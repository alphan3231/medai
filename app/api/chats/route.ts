import { NextResponse } from "next/server";

import { getUserFromRequest } from "@/lib/auth";
import { ensureUserProfile, listChatSessions } from "@/lib/chat-store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureUserProfile(user);
    const sessions = await listChatSessions(user.uid);
    return NextResponse.json({ sessions });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load chats.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
