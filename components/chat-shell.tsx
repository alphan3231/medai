"use client";

import {
  type ClipboardEvent,
  type DragEvent,
  type FormEvent,
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { User } from "firebase/auth";
import { signOut } from "firebase/auth";
import { deleteObject, getDownloadURL, ref, uploadBytesResumable, type UploadTask } from "firebase/storage";
import {
  AlertTriangle,
  ImagePlus,
  Languages,
  LoaderCircle,
  LogOut,
  MessageSquarePlus,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";

import {
  ALLOWED_ATTACHMENT_MIME_TYPES,
  buildChatAttachmentStoragePath,
  describeAttachmentKind,
  isXrayAttachmentKind,
  MAX_ATTACHMENTS_PER_MESSAGE,
  MAX_ATTACHMENT_BYTES,
  messageHasXrayAttachment,
} from "@/lib/chat-attachments";
import { auth, storage } from "@/lib/firebase/client";
import { extractFollowUp, type FollowUpSuggestion } from "@/lib/follow-up";
import { copy, getWarningCopy } from "@/lib/i18n";
import type { AppLanguage, ChatAttachment, ChatAttachmentKind, ChatMessage, ChatSession } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const OPTIMISTIC_USER_ID = "optimistic-user";
const STREAMING_ASSISTANT_ID = "streaming-assistant";

type StartPayload = {
  chatId: string;
  session: ChatSession;
  userMessage: ChatMessage;
  assistantDraft: {
    language: AppLanguage;
    warningLevel: ChatMessage["warningLevel"];
    warningText: string | null;
  };
};

type DonePayload = {
  chatId: string;
  session: ChatSession;
  assistantMessage: ChatMessage;
};

type ComposerAttachment = ChatAttachment & {
  previewUrl: string;
  progress: number;
  status: "uploading" | "ready" | "error";
  errorMessage?: string;
};

type ChatStreamEvent =
  | { event: "open"; payload: { at: string } }
  | { event: "heartbeat"; payload: { at: string } }
  | { event: "start"; payload: StartPayload }
  | {
      event: "delta";
      payload: {
        delta: string;
      };
    }
  | {
      event: "follow_up";
      payload: FollowUpSuggestion;
    }
  | {
      event: "done";
      payload: DonePayload;
    }
  | {
      event: "error";
      payload: {
        error: string;
      };
    };

function buildOptimisticUserMessage(
  message: string,
  userId: string,
  language: AppLanguage,
  attachments: ChatAttachment[] = [],
): ChatMessage {
  return {
    id: OPTIMISTIC_USER_ID,
    chatId: "",
    userId,
    role: "user",
    content: message,
    attachments,
    language,
    warningLevel: "none",
    warningText: null,
    createdAt: new Date().toISOString(),
  };
}

function buildStreamingAssistantMessage(language: AppLanguage): ChatMessage {
  return {
    id: STREAMING_ASSISTANT_ID,
    chatId: "",
    userId: "",
    role: "assistant",
    content: "",
    attachments: [],
    language,
    warningLevel: "none",
    warningText: null,
    createdAt: new Date().toISOString(),
  };
}

async function loadImageDimensions(file: File) {
  const objectUrl = URL.createObjectURL(file);

  try {
    const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => reject(new Error("Unable to read image dimensions."));
      image.src = objectUrl;
    });

    return dimensions;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function AttachmentGallery({
  attachments,
  language,
  tone,
}: {
  attachments: ChatAttachment[];
  language: AppLanguage;
  tone: "user" | "assistant";
}) {
  if (!attachments.length) {
    return null;
  }

  return (
    <div className="mb-4 grid gap-3 sm:grid-cols-2">
      {attachments.map((attachment) => (
        <div
          key={attachment.id}
          className={`overflow-hidden rounded-[1.3rem] border ${
            tone === "user"
              ? "border-white/15 bg-white/10"
              : "border-[rgba(24,32,24,0.08)] bg-[#f7faf8]"
          }`}
        >
          {attachment.downloadUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={attachment.fileName}
              className="h-40 w-full object-cover"
              src={attachment.downloadUrl}
            />
          ) : (
            <div className="flex h-40 items-center justify-center text-sm text-[#748076]">
              {attachment.fileName}
            </div>
          )}
          <div className="flex items-center justify-between gap-3 px-3 py-3 text-xs">
            <span
              className={`rounded-full px-2.5 py-1 font-semibold ${
                tone === "user"
                  ? "bg-white/12 text-white"
                  : "bg-white text-[#245946]"
              }`}
            >
              {describeAttachmentKind(attachment.kind, language)}
            </span>
            <span className={tone === "user" ? "text-white/80" : "text-[#748076]"}>
              {Math.max(1, Math.round(attachment.sizeBytes / 1024))} KB
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function parseSseFrame(frame: string): ChatStreamEvent | null {
  let eventName = "message";
  const dataLines: string[] = [];

  for (const rawLine of frame.split("\n")) {
    const line = rawLine.trimEnd();
    if (!line || line.startsWith(":")) {
      continue;
    }

    if (line.startsWith("event:")) {
      eventName = line.slice(6).trim();
      continue;
    }

    if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trimStart());
    }
  }

  if (!dataLines.length) {
    return null;
  }

  const payload = JSON.parse(dataLines.join("\n")) as Record<string, unknown>;

  switch (eventName) {
    case "open":
      return { event: "open", payload: payload as { at: string } };
    case "heartbeat":
      return { event: "heartbeat", payload: payload as { at: string } };
    case "start":
      return {
        event: "start",
        payload: payload as StartPayload,
      };
    case "delta":
      return { event: "delta", payload: payload as { delta: string } };
    case "follow_up":
      return { event: "follow_up", payload: payload as FollowUpSuggestion };
    case "done":
      return {
        event: "done",
        payload: payload as DonePayload,
      };
    case "error":
      return { event: "error", payload: payload as { error: string } };
    default:
      return null;
  }
}

function StreamingGlow({ label }: { label: string }) {
  return (
    <div className="streaming-glow-wrap">
      <div className="streaming-glow-orbit">
        <span className="streaming-glow-dot streaming-glow-dot-one" />
        <span className="streaming-glow-dot streaming-glow-dot-two" />
        <span className="streaming-glow-dot streaming-glow-dot-three" />
      </div>
      <div>
        <p className="text-sm font-semibold tracking-[0.18em] text-[#245946]/80 uppercase">{label}</p>
        <p className="mt-1 text-sm text-[#748076]">Preparing a live answer</p>
      </div>
    </div>
  );
}

export function ChatShell({
  user,
  language,
  onLanguageChange,
}: {
  user: User;
  language: AppLanguage;
  onLanguageChange: (language: AppLanguage) => void;
}) {
  const t = useMemo(() => copy[language], [language]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [streamingFollowUp, setStreamingFollowUp] = useState<FollowUpSuggestion | null>(null);
  const [composerAttachments, setComposerAttachments] = useState<ComposerAttachment[]>([]);
  const [draftChatId, setDraftChatId] = useState<string | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadTasksRef = useRef<Record<string, UploadTask>>({});
  const composerAttachmentsRef = useRef<ComposerAttachment[]>([]);
  const dragDepthRef = useRef(0);
  const shouldStickToBottomRef = useRef(true);
  const pendingInitialScrollRef = useRef(false);
  const [dragActive, setDragActive] = useState(false);

  const activeSession = sessions.find((item) => item.id === activeChatId) ?? null;
  const warningCopy = getWarningCopy(language, activeSession?.warningLevel ?? "none");
  const streamingAssistantMessage =
    messages.find((item) => item.id === STREAMING_ASSISTANT_ID) ?? null;
  const streamingAssistantBody = streamingAssistantMessage
    ? extractFollowUp(streamingAssistantMessage.content).body.trim()
    : "";
  const showStandaloneStreamingBubble = sending && !streamingAssistantBody;
  const activeComposerChatId = activeChatId ?? draftChatId;
  const hasBlockingAttachmentState = composerAttachments.some((attachment) => attachment.status !== "ready");
  const conversationHasXray =
    composerAttachments.some((attachment) => isXrayAttachmentKind(attachment.kind)) ||
    messages.some((message) => messageHasXrayAttachment(message.attachments));

  function ensureDraftChatId() {
    if (activeChatId) {
      return activeChatId;
    }

    if (draftChatId) {
      return draftChatId;
    }

    const nextDraftChatId = window.crypto.randomUUID();
    setDraftChatId(nextDraftChatId);
    return nextDraftChatId;
  }

  function revokeComposerPreviews(attachments: ComposerAttachment[]) {
    attachments.forEach((attachment) => {
      URL.revokeObjectURL(attachment.previewUrl);
    });
  }

  function clearComposerAttachments(attachments: ComposerAttachment[] = composerAttachments) {
    Object.values(uploadTasksRef.current).forEach((task) => {
      try {
        task.cancel();
      } catch {
        // Best effort cleanup only.
      }
    });
    revokeComposerPreviews(attachments);
    setComposerAttachments([]);
    uploadTasksRef.current = {};
  }

  function resetDragState() {
    dragDepthRef.current = 0;
    setDragActive(false);
  }

  function scrollChatToBottom() {
    const element = chatScrollRef.current;
    if (!element) {
      return;
    }

    element.scrollTop = element.scrollHeight;
  }

  function handleChatScroll() {
    const element = chatScrollRef.current;
    if (!element) {
      return;
    }

    const distanceFromBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight;
    shouldStickToBottomRef.current = distanceFromBottom < 72;
  }

  async function authorizedFetch(url: string, init?: RequestInit) {
    const token = await user.getIdToken();

    return fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(init?.headers ?? {}),
      },
    });
  }

  const loadSessions = useEffectEvent(async () => {
    setLoadingHistory(true);
    setError("");

    try {
      const response = await authorizedFetch("/api/chats");
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? t.genericError);
      }

      const nextSessions = payload.sessions as ChatSession[];
      setSessions(nextSessions);

      if (!activeChatId && nextSessions[0]) {
        await loadConversation(nextSessions[0].id);
      } else if (!nextSessions.length) {
        setMessages([]);
        pendingInitialScrollRef.current = false;
      }
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : t.genericError;
      setError(message);
    } finally {
      setLoadingHistory(false);
    }
  });

  async function loadConversation(chatId: string) {
    setActiveChatId(chatId);
    setDraftChatId(null);
    setLoadingHistory(true);
    setError("");
    clearComposerAttachments();
    pendingInitialScrollRef.current = true;
    shouldStickToBottomRef.current = true;

    try {
      const response = await authorizedFetch(`/api/chats/${chatId}`);
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? t.genericError);
      }

      setMessages(payload.messages as ChatMessage[]);
      setStreamingFollowUp(null);
      const session = payload.session as ChatSession;
      if (session?.language) {
        onLanguageChange(session.language);
      }
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : t.genericError;
      setError(message);
    } finally {
      setLoadingHistory(false);
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadSessions();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [user.uid]);

  useEffect(() => {
    composerAttachmentsRef.current = composerAttachments;
  }, [composerAttachments]);

  useEffect(() => {
    return () => {
      revokeComposerPreviews(composerAttachmentsRef.current);
    };
  }, []);

  useLayoutEffect(() => {
    if (pendingInitialScrollRef.current) {
      scrollChatToBottom();
      pendingInitialScrollRef.current = false;
      shouldStickToBottomRef.current = true;
      return;
    }

    if (shouldStickToBottomRef.current) {
      scrollChatToBottom();
    }
  }, [activeChatId, messages, showStandaloneStreamingBubble]);

  async function submitMessage(rawMessage: string) {
    if (sending) {
      return;
    }

    const nextInput = rawMessage.trim();
    const readyAttachments = composerAttachments
      .filter((attachment) => attachment.status === "ready")
      .map<ChatAttachment>((attachment) => ({
        id: attachment.id,
        storagePath: attachment.storagePath,
        downloadUrl: attachment.downloadUrl,
        mimeType: attachment.mimeType,
        fileName: attachment.fileName,
        sizeBytes: attachment.sizeBytes,
        width: attachment.width,
        height: attachment.height,
        kind: attachment.kind,
      }));

    if ((!nextInput && !readyAttachments.length) || hasBlockingAttachmentState) {
      setError(hasBlockingAttachmentState ? t.attachmentPendingError : t.attachmentOnlyPrompt);
      return;
    }

    const previewAttachments = composerAttachments
      .filter((attachment) => attachment.status === "ready")
      .map<ChatAttachment>((attachment) => ({
        id: attachment.id,
        storagePath: attachment.storagePath,
        mimeType: attachment.mimeType,
        fileName: attachment.fileName,
        sizeBytes: attachment.sizeBytes,
        width: attachment.width,
        height: attachment.height,
        kind: attachment.kind,
        downloadUrl: attachment.previewUrl,
      }));
    const outgoingChatId = activeComposerChatId ?? ensureDraftChatId();
    const outgoingComposerAttachments = composerAttachments;
    setSending(true);
    setError("");
    setInput("");
    setStreamingFollowUp(null);
    setComposerAttachments([]);
    shouldStickToBottomRef.current = true;
    setMessages((current) => [
      ...current,
      buildOptimisticUserMessage(nextInput, user.uid, language, previewAttachments),
      buildStreamingAssistantMessage(language),
    ]);

    try {
      const response = await authorizedFetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          chatId: outgoingChatId,
          message: nextInput,
          language,
          attachments: readyAttachments,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? t.genericError);
      }

      if (!response.body) {
        throw new Error(t.genericError);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const applyStreamEvent = (eventPayload: ChatStreamEvent) => {
        if (eventPayload.event === "open" || eventPayload.event === "heartbeat") {
          return;
        }

        if (eventPayload.event === "start") {
          setActiveChatId(eventPayload.payload.chatId);
          setDraftChatId(eventPayload.payload.chatId);
          setSessions((current) => [
            eventPayload.payload.session,
            ...current.filter((item) => item.id !== eventPayload.payload.session.id),
          ]);
          setMessages((current) =>
            current.map((item) => {
              if (item.id === OPTIMISTIC_USER_ID) {
                return eventPayload.payload.userMessage;
              }

              if (item.id === STREAMING_ASSISTANT_ID) {
                return {
                  ...item,
                  chatId: eventPayload.payload.chatId,
                  userId: eventPayload.payload.userMessage.userId,
                  language: eventPayload.payload.assistantDraft.language,
                  warningLevel: eventPayload.payload.assistantDraft.warningLevel,
                  warningText: eventPayload.payload.assistantDraft.warningText,
                };
              }

              return item;
            }),
          );
          return;
        }

        if (eventPayload.event === "delta") {
          setMessages((current) =>
            current.map((item) =>
              item.id === STREAMING_ASSISTANT_ID
                ? { ...item, content: `${item.content}${eventPayload.payload.delta}` }
                : item,
            ),
          );
          return;
        }

        if (eventPayload.event === "follow_up") {
          setStreamingFollowUp(eventPayload.payload);
          return;
        }

        if (eventPayload.event === "done") {
          setActiveChatId(eventPayload.payload.chatId);
          setDraftChatId(eventPayload.payload.chatId);
          setSessions((current) => [
            eventPayload.payload.session,
            ...current.filter((item) => item.id !== eventPayload.payload.session.id),
          ]);
          setMessages((current) =>
            current.map((item) =>
              item.id === STREAMING_ASSISTANT_ID ? eventPayload.payload.assistantMessage : item,
            ),
          );
          setStreamingFollowUp(null);
          return;
        }

        throw new Error(eventPayload.payload.error);
      };

      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value, { stream: !done }).replace(/\r\n/g, "\n");

        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";

        for (const frame of frames) {
          if (!frame.trim()) {
            continue;
          }

          const parsedEvent = parseSseFrame(frame);
          if (parsedEvent) {
            applyStreamEvent(parsedEvent);
          }
        }

        if (done) {
          break;
        }
      }

      if (buffer.trim()) {
        const parsedEvent = parseSseFrame(buffer);
        if (parsedEvent) {
          applyStreamEvent(parsedEvent);
        }
      }

      revokeComposerPreviews(outgoingComposerAttachments);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : t.genericError;
      setMessages((current) =>
        current.filter(
          (item) => item.id !== OPTIMISTIC_USER_ID && item.id !== STREAMING_ASSISTANT_ID,
        ),
      );
      setComposerAttachments(outgoingComposerAttachments);
      setStreamingFollowUp(null);
      setInput(nextInput);
      setError(message.includes("OPENAI_API_KEY") ? t.missingKeyError : message);
    } finally {
      setSending(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitMessage(input);
  }

  function startNewChat() {
    setActiveChatId(null);
    setDraftChatId(null);
    setMessages([]);
    setStreamingFollowUp(null);
    setError("");
    setInput("");
    clearComposerAttachments();
    pendingInitialScrollRef.current = false;
    shouldStickToBottomRef.current = true;
  }

  async function handleSelectedFiles(files: File[]) {
    if (!files.length) {
      return;
    }

    const availableSlots = MAX_ATTACHMENTS_PER_MESSAGE - composerAttachments.length;
    if (availableSlots <= 0) {
      setError(t.attachmentCountError);
      return;
    }

    const limitedFiles = files.slice(0, availableSlots);
    if (files.length > limitedFiles.length) {
      setError(t.attachmentCountError);
    }

    const workingChatId = ensureDraftChatId();

    for (const file of limitedFiles) {
      if (!ALLOWED_ATTACHMENT_MIME_TYPES.includes(file.type as (typeof ALLOWED_ATTACHMENT_MIME_TYPES)[number])) {
        setError(t.attachmentTypeError);
        continue;
      }

      if (file.size > MAX_ATTACHMENT_BYTES) {
        setError(t.attachmentSizeError);
        continue;
      }

      const attachmentId = window.crypto.randomUUID();
      const previewUrl = URL.createObjectURL(file);
      const { width, height } = await loadImageDimensions(file);
      const storagePath = buildChatAttachmentStoragePath({
        userId: user.uid,
        chatId: workingChatId,
        attachmentId,
        fileName: file.name,
      });

      const nextAttachment: ComposerAttachment = {
        id: attachmentId,
        storagePath,
        mimeType: file.type,
        fileName: file.name,
        sizeBytes: file.size,
        width,
        height,
        kind: "symptom_photo",
        previewUrl,
        progress: 0,
        status: "uploading",
      };

      setComposerAttachments((current) => [...current, nextAttachment]);

      const storageTask = uploadBytesResumable(ref(storage, storagePath), file, {
        contentType: file.type,
        customMetadata: {
          userId: user.uid,
          chatId: workingChatId,
          attachmentId,
          fileName: file.name,
          width: String(width),
          height: String(height),
        },
      });
      uploadTasksRef.current[attachmentId] = storageTask;

      storageTask.on(
        "state_changed",
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setComposerAttachments((current) =>
            current.map((attachment) =>
              attachment.id === attachmentId ? { ...attachment, progress } : attachment,
            ),
          );
        },
        () => {
          setComposerAttachments((current) =>
            current.map((attachment) =>
              attachment.id === attachmentId
                ? {
                    ...attachment,
                    status: "error",
                    errorMessage: t.attachmentUploadError,
                  }
                : attachment,
            ),
          );
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(storageTask.snapshot.ref);
            setComposerAttachments((current) =>
              current.map((attachment) =>
                attachment.id === attachmentId
                  ? {
                      ...attachment,
                      downloadUrl,
                      progress: 100,
                      status: "ready",
                    }
                  : attachment,
              ),
            );
          } catch {
            setComposerAttachments((current) =>
              current.map((attachment) =>
                attachment.id === attachmentId
                  ? {
                      ...attachment,
                      status: "error",
                      errorMessage: t.attachmentUploadError,
                    }
                  : attachment,
              ),
            );
          }
        },
      );
    }
  }

  async function handleFilesSelected(fileList: FileList | null) {
    if (!fileList?.length) {
      return;
    }

    await handleSelectedFiles(Array.from(fileList));
  }

  async function handleComposerPaste(event: ClipboardEvent<HTMLTextAreaElement>) {
    const imageFiles = Array.from(event.clipboardData.items)
      .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
      .map((item) => item.getAsFile())
      .filter((file): file is File => Boolean(file));

    if (!imageFiles.length) {
      return;
    }

    event.preventDefault();
    await handleSelectedFiles(imageFiles);
  }

  function handleComposerDragEnter(event: DragEvent<HTMLFormElement>) {
    const hasFiles = Array.from(event.dataTransfer.items).some((item) => item.kind === "file");
    if (!hasFiles) {
      return;
    }

    event.preventDefault();
    dragDepthRef.current += 1;
    setDragActive(true);
  }

  function handleComposerDragOver(event: DragEvent<HTMLFormElement>) {
    const hasFiles = Array.from(event.dataTransfer.items).some((item) => item.kind === "file");
    if (!hasFiles) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    if (!dragActive) {
      setDragActive(true);
    }
  }

  function handleComposerDragLeave(event: DragEvent<HTMLFormElement>) {
    const hasFiles = Array.from(event.dataTransfer.items).some((item) => item.kind === "file");
    if (!hasFiles) {
      return;
    }

    event.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) {
      setDragActive(false);
    }
  }

  async function handleComposerDrop(event: DragEvent<HTMLFormElement>) {
    const droppedFiles = Array.from(event.dataTransfer.files).filter((file) => file.type.startsWith("image/"));
    event.preventDefault();
    resetDragState();

    if (!droppedFiles.length) {
      return;
    }

    await handleSelectedFiles(droppedFiles);
  }

  function updateComposerAttachmentKind(attachmentId: string, kind: ChatAttachmentKind) {
    setComposerAttachments((current) =>
      current.map((attachment) =>
        attachment.id === attachmentId ? { ...attachment, kind } : attachment,
      ),
    );
  }

  async function removeComposerAttachment(attachmentId: string) {
    const attachment = composerAttachments.find((item) => item.id === attachmentId);
    if (!attachment) {
      return;
    }

    const uploadTask = uploadTasksRef.current[attachmentId];
    if (uploadTask && attachment.status === "uploading") {
      uploadTask.cancel();
    } else if (attachment.status === "ready") {
      try {
        await deleteObject(ref(storage, attachment.storagePath));
      } catch {
        // Best effort cleanup only.
      }
    }

    delete uploadTasksRef.current[attachmentId];
    URL.revokeObjectURL(attachment.previewUrl);
    setComposerAttachments((current) => current.filter((item) => item.id !== attachmentId));
  }

  return (
    <div className="h-screen overflow-hidden px-4 py-6 md:px-6">
      <div className="mx-auto grid h-[calc(100vh-3rem)] max-w-7xl items-stretch gap-4 overflow-hidden lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="glass-panel grain flex h-full min-h-0 flex-col overflow-hidden rounded-[2rem] p-5">
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#245946]">{t.appName}</p>
                <h1 className="mt-2 font-[var(--font-display)] text-3xl leading-tight text-[#182018]">
                  {t.sidebarTitle}
                </h1>
              </div>
              <div className="rounded-full border border-[rgba(24,32,24,0.08)] bg-white/70 p-2 text-[#245946]">
                <Sparkles className="h-4 w-4" />
              </div>
            </div>

            <p className="text-sm leading-6 text-[#5c665d]">{t.sidebarHint}</p>

            <div className="flex items-center gap-2 rounded-full border border-[rgba(24,32,24,0.08)] bg-white/70 p-1">
              {(["en", "tr"] as const).map((option) => (
                <button
                  key={option}
                  className={`flex-1 rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                    language === option ? "bg-[#245946] text-white" : "text-[#5c665d] hover:bg-white"
                  }`}
                  onClick={() => onLanguageChange(option)}
                  type="button"
                >
                  <span className="inline-flex items-center gap-2">
                    <Languages className="h-3.5 w-3.5" />
                    {option}
                  </span>
                </button>
              ))}
            </div>

            <Button className="w-full" onClick={startNewChat} variant="secondary">
              <MessageSquarePlus className="mr-2 h-4 w-4" />
              {t.newChat}
            </Button>
          </div>

          <div className="mt-6 min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-y-contain pr-1">
            {sessions.length ? (
              sessions.map((session) => (
                <button
                  key={session.id}
                  className={`w-full rounded-[1.4rem] border p-4 text-left transition ${
                    session.id === activeChatId
                      ? "border-[#245946]/40 bg-white/95 shadow-[0_16px_40px_rgba(36,89,70,0.12)]"
                      : "border-[rgba(24,32,24,0.08)] bg-white/55 hover:bg-white/80"
                  }`}
                  onClick={() => void loadConversation(session.id)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <p className="font-semibold text-[#182018]">{session.title}</p>
                      <p className="text-sm leading-5 text-[#5c665d]">{session.lastMessagePreview}</p>
                    </div>
                    {session.warningLevel === "soft" ? (
                      <ShieldAlert className="h-4 w-4 shrink-0 text-[#b4533f]" />
                    ) : null}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-[#748076]">
                    <span>{session.language}</span>
                    <span>{formatRelativeTime(session.updatedAt)}</span>
                  </div>
                </button>
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-[rgba(24,32,24,0.12)] px-4 py-6 text-sm leading-6 text-[#5c665d]">
                {loadingHistory ? t.sending : t.historyEmpty}
              </div>
            )}
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-[rgba(24,32,24,0.08)] bg-white/70 p-4">
            <p className="text-sm font-semibold text-[#182018]">{user.email}</p>
            <Button className="mt-3 w-full" onClick={() => void signOut(auth)} size="sm" variant="ghost">
              <LogOut className="mr-2 h-4 w-4" />
              {t.signOut}
            </Button>
          </div>
        </aside>

        <main className="glass-panel grain flex h-full min-h-0 flex-col overflow-hidden rounded-[2rem]">
          <div className="flex flex-col gap-4 border-b border-[rgba(24,32,24,0.08)] px-6 py-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#245946]">{t.intakeBadge}</p>
              <h2 className="font-[var(--font-display)] text-4xl leading-tight text-[#182018]">{t.appTitle}</h2>
              <p className="text-sm leading-6 text-[#5c665d]">{t.appSubtitle}</p>
            </div>
            <div className="rounded-[1.5rem] border border-[rgba(24,32,24,0.08)] bg-white/70 px-4 py-3 text-sm leading-6 text-[#5c665d]">
              <p className="font-semibold text-[#182018]">{t.introLabel}</p>
              <p>{t.disclaimer}</p>
            </div>
          </div>

          {warningCopy ? (
            <div className="mx-6 mt-6 rounded-[1.5rem] border border-[#b4533f]/20 bg-[#fff2eb] px-4 py-4 text-sm leading-6 text-[#8f3e2f]">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold">{warningCopy.title}</p>
                  <p>{warningCopy.body}</p>
                </div>
              </div>
            </div>
          ) : null}

          <div
            className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-y-contain px-6 py-6"
            onScroll={handleChatScroll}
            ref={chatScrollRef}
          >
            {error ? (
              <div className="rounded-[1.5rem] border border-[#b4533f]/20 bg-[#fff2eb] px-4 py-3 text-sm text-[#8f3e2f]">
                {error}
              </div>
            ) : null}

            {!messages.length ? (
              <div className="rounded-[2rem] border border-dashed border-[rgba(24,32,24,0.12)] bg-white/50 px-6 py-8">
                <p className="text-lg font-semibold text-[#182018]">{t.chatPlaceholder}</p>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5c665d]">{t.startPrompt}</p>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#748076]">{t.attachmentHint}</p>
              </div>
            ) : null}

            {messages.map((message) => {
              const parsedAssistantMessage =
                message.role === "assistant"
                  ? extractFollowUp(message.content)
                  : { body: message.content, followUp: null };
              const followUp =
                message.id === STREAMING_ASSISTANT_ID && streamingFollowUp
                  ? streamingFollowUp
                  : parsedAssistantMessage.followUp;

              if (message.id === STREAMING_ASSISTANT_ID && !parsedAssistantMessage.body.trim()) {
                return null;
              }

              return (
                <article
                  key={message.id}
                  className={`max-w-3xl rounded-[1.75rem] px-5 py-4 ${
                    message.role === "user"
                      ? "ml-auto bg-[#245946] text-white shadow-[0_16px_36px_rgba(36,89,70,0.24)]"
                      : "border border-[rgba(24,32,24,0.08)] bg-white/88 text-[#182018]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <AttachmentGallery
                        attachments={message.attachments ?? []}
                        language={message.language}
                        tone={message.role}
                      />
                      <p className="whitespace-pre-wrap text-sm leading-7">{parsedAssistantMessage.body}</p>
                    </div>
                    <span
                      className={`shrink-0 text-[10px] font-semibold uppercase tracking-[0.22em] ${
                        message.role === "user" ? "text-white/70" : "text-[#748076]"
                      }`}
                    >
                      {message.role === "user" ? t.userRole : t.assistantRole}
                    </span>
                  </div>
                  {message.warningLevel === "soft" && message.warningText ? (
                    <div
                      className={`mt-4 rounded-[1.25rem] px-4 py-3 text-sm leading-6 ${
                        message.role === "user"
                          ? "bg-white/12 text-white/90"
                          : "bg-[#fff2eb] text-[#8f3e2f]"
                      }`}
                    >
                      {message.warningText}
                    </div>
                  ) : null}
                  {message.role === "assistant" && followUp?.question ? (
                    <div className="mt-4 space-y-3">
                      <p className="text-sm font-semibold text-[#245946]">{followUp.question}</p>
                      <div className="flex flex-wrap gap-2">
                        {followUp.options.map((option) => (
                          <button
                            key={`${message.id}-${option}`}
                            className="rounded-full border border-[#245946]/15 bg-[#f4faf7] px-3 py-2 text-sm font-medium text-[#245946] transition hover:border-[#245946]/35 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={sending}
                            onClick={() => void submitMessage(option)}
                            type="button"
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}

            {showStandaloneStreamingBubble ? (
              <article className="max-w-3xl rounded-[1.75rem] border border-[rgba(24,32,24,0.08)] bg-white/88 px-5 py-4 text-[#182018]">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <StreamingGlow label={t.sending} />
                  </div>
                  <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#748076]">
                    {t.assistantRole}
                  </span>
                </div>
              </article>
            ) : null}
          </div>

          <div className="border-t border-[rgba(24,32,24,0.08)] px-6 py-5">
            <form
              className={`space-y-3 rounded-[1.6rem] p-2 transition ${
                dragActive ? "bg-[#eef7f1] ring-2 ring-[#245946]/18" : ""
              }`}
              onDragEnter={handleComposerDragEnter}
              onDragLeave={handleComposerDragLeave}
              onDragOver={handleComposerDragOver}
              onDrop={(event) => {
                void handleComposerDrop(event);
              }}
              onSubmit={handleSubmit}
            >
              {conversationHasXray ? (
                <div className="rounded-[1.35rem] border border-[#245946]/12 bg-[#eef7f1] px-4 py-3 text-sm leading-6 text-[#245946]">
                  <p className="font-semibold">{t.xrayNoticeTitle}</p>
                  <p>{t.xrayNoticeBody}</p>
                </div>
              ) : null}
              {composerAttachments.length ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {composerAttachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="overflow-hidden rounded-[1.35rem] border border-[rgba(24,32,24,0.08)] bg-white/80"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img alt={attachment.fileName} className="h-36 w-full object-cover" src={attachment.previewUrl} />
                      <div className="space-y-3 px-3 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[#182018]">{attachment.fileName}</p>
                            <p className="text-xs text-[#748076]">
                              {attachment.status === "uploading"
                                ? `${t.attachmentUploading} ${attachment.progress}%`
                                : attachment.status === "ready"
                                  ? t.attachmentReady
                                  : t.attachmentError}
                            </p>
                          </div>
                          <button
                            className="rounded-full border border-[rgba(24,32,24,0.08)] p-2 text-[#748076] transition hover:bg-white"
                            onClick={() => void removeComposerAttachment(attachment.id)}
                            type="button"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(["symptom_photo", "xray_like"] as const).map((kind) => (
                            <button
                              key={kind}
                              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                                attachment.kind === kind
                                  ? "bg-[#245946] text-white"
                                  : "border border-[rgba(24,32,24,0.08)] bg-white text-[#245946]"
                              }`}
                              disabled={attachment.status === "uploading"}
                              onClick={() => updateComposerAttachmentKind(attachment.id, kind)}
                              type="button"
                            >
                              {kind === "xray_like" ? t.attachmentXray : t.attachmentSymptom}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
              <Textarea
                onChange={(event) => setInput(event.target.value)}
                onPaste={(event) => {
                  void handleComposerPaste(event);
                }}
                placeholder={t.composerPlaceholder}
                value={input}
              />
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <input
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    multiple
                    onChange={(event) => {
                      void handleFilesSelected(event.target.files);
                      event.currentTarget.value = "";
                    }}
                    ref={fileInputRef}
                    type="file"
                  />
                  <button
                    className="inline-flex items-center gap-2 rounded-full border border-[rgba(24,32,24,0.08)] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#245946] transition hover:border-[#245946]/35"
                    disabled={sending || composerAttachments.length >= MAX_ATTACHMENTS_PER_MESSAGE}
                    onClick={() => fileInputRef.current?.click()}
                    type="button"
                  >
                    {hasBlockingAttachmentState ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                    {t.attachmentButton}
                  </button>
                  <p className="text-xs uppercase tracking-[0.2em] text-[#748076]">
                    {activeSession?.language
                      ? `${activeSession.language} ${t.sessionLabel}`
                      : `${language} ${t.sessionLabel}`}
                  </p>
                </div>
                <Button disabled={sending || (!input.trim() && !composerAttachments.length) || hasBlockingAttachmentState} type="submit">
                  {t.send}
                </Button>
              </div>
              <p className="text-xs leading-5 text-[#748076]">{t.attachmentHint}</p>
              <p className="text-xs leading-5 text-[#748076]">{t.attachmentShortcutHint}</p>
              <p className="text-xs leading-5 text-[#748076]">{t.quotaHint}</p>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
