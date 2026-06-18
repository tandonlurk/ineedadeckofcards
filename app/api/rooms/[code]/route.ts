import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const { data: room, error } = await supabaseAdmin
    .from("rooms")
    .select("state")
    .eq("code", code)
    .single();

  if (error || !room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  return NextResponse.json({ state: room.state });
}
