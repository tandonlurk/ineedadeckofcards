"use client";

import { useCallback, useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { RoomState } from "@/lib/roomState";
import type { RoomSession } from "@/lib/session";

type RoomRow = { state: RoomState };

export function useRoomState(code: string, session: RoomSession | null) {
  const [state, setState] = useState<RoomState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const res = await fetch(`/api/rooms/${code}`);
      if (cancelled) return;
      if (!res.ok) {
        setError("Room not found");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setState(data.state);
      setLoading(false);
    }
    load();

    const channel = supabaseBrowser
      .channel(`room:${code}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rooms",
          filter: `code=eq.${code}`,
        },
        (payload) => {
          const row = payload.new as RoomRow;
          setState(row.state);
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabaseBrowser.removeChannel(channel);
    };
  }, [code]);

  const dispatch = useCallback(
    async (type: string, payload?: Record<string, unknown>) => {
      if (!session) return;
      setError(null);
      const res = await fetch(`/api/rooms/${code}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          playerId: session.playerId,
          hostToken: session.hostToken,
          payload,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Action failed");
      }
    },
    [code, session]
  );

  return { state, error, loading, dispatch };
}
