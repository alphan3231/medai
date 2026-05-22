import { NextResponse } from "next/server";

import { getUserFromRequest } from "@/lib/auth";
import { ensureUserProfile, getChatMessages, getChatSession } from "@/lib/chat-store";
import { hydrateChatMessagesWithDownloadUrls } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ chatId: string }> },
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureUserProfile(user);
    const { chatId } = await params;
    const session = await getChatSession(user.uid, chatId);
    if (!session) {
      return NextResponse.json({ error: "Chat not found." }, { status: 404 });
    }

    const messages = await hydrateChatMessagesWithDownloadUrls(await getChatMessages(user.uid, chatId));
    return NextResponse.json({ session, messages });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load chat.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
