import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { ActionError, applyAction, type ActionType, type RoomState } from "@/lib/roomState";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body.type !== "string" || typeof body.playerId !== "string") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const { data: room, error } = await supabaseAdmin
    .from("rooms")
    .select("state, host_token")
    .eq("code", code)
    .single();

  if (error || !room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  const isHost =
    typeof body.hostToken === "string" && body.hostToken === room.host_token;

  const state = room.state as RoomState;
  const action = {
    type: body.type,
    playerId: body.playerId,
    payload: body.payload,
  } as ActionType;

  try {
    const nextState = applyAction(state, action, isHost);
    const { error: updateError } = await supabaseAdmin
      .from("rooms")
      .update({ state: nextState })
      .eq("code", code);
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof ActionError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
