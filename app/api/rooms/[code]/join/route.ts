import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { RoomState } from "@/lib/roomState";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 24) : "";
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const { data: room, error } = await supabaseAdmin
    .from("rooms")
    .select("state")
    .eq("code", code)
    .single();

  if (error || !room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  const state = room.state as RoomState;
  const playerId = randomUUID();
  state.players[playerId] = { id: playerId, name, isHost: false, hand: [] };
  state.turnLog.push({ ts: Date.now(), text: `${name} joined the room` });
  if (state.turnLog.length > 50) state.turnLog.shift();

  const { error: updateError } = await supabaseAdmin
    .from("rooms")
    .update({ state })
    .eq("code", code);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ playerId });
}
