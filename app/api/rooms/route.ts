import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { supabaseAdmin } from "@/lib/supabase/server";
import { generateRoomCode } from "@/lib/roomCode";
import { createInitialState } from "@/lib/roomState";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 24) : "";
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const hostId = randomUUID();
  const hostToken = randomUUID();
  const state = createInitialState(hostId, name);

  let code = "";
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = generateRoomCode();
    const { error } = await supabaseAdmin.from("rooms").insert({
      code: candidate,
      host_token: hostToken,
      state,
    });
    if (!error) {
      code = candidate;
      break;
    }
    // 23505 = unique_violation, try another code
    if (error.code !== "23505") {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  if (!code) {
    return NextResponse.json(
      { error: "Could not allocate a room code, try again" },
      { status: 500 }
    );
  }

  return NextResponse.json({ code, hostToken, playerId: hostId });
}
