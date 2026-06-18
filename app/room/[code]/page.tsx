"use client";

import { useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useRoomState } from "./useRoomState";
import { loadSession, saveSession, type RoomSession } from "@/lib/session";
import { Deck } from "@/components/Deck";
import { Hand } from "@/components/Hand";
import { Table } from "@/components/Table";
import { Sideboard } from "@/components/Sideboard";
import { ActionLog } from "@/components/ActionLog";

export default function RoomPage() {
  const params = useParams<{ code: string }>();
  const code = params.code;
  const router = useRouter();
  const tableRef = useRef<HTMLDivElement | null>(null);

  const [session, setSession] = useState<RoomSession | null>(() =>
    loadSession(code)
  );
  const [joinName, setJoinName] = useState("");
  const [joinBusy, setJoinBusy] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const { state, error, loading, dispatch } = useRoomState(
    code,
    session ?? null
  );

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!joinName.trim()) return;
    setJoinBusy(true);
    setJoinError(null);
    try {
      const res = await fetch(`/api/rooms/${code}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: joinName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not join room");
      const newSession: RoomSession = {
        code,
        playerId: data.playerId,
        name: joinName,
      };
      saveSession(newSession);
      setSession(newSession);
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setJoinBusy(false);
    }
  }

  if (loading) {
    return <Centered>Loading room…</Centered>;
  }

  if (error) {
    return (
      <Centered>
        <p className="mb-4 text-zinc-400">{error}</p>
        <button
          onClick={() => router.push("/")}
          className="rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-200 hover:border-zinc-500"
        >
          Back home
        </button>
      </Centered>
    );
  }

  if (!session) {
    return (
      <Centered>
        <form onSubmit={handleJoin} className="flex w-full max-w-xs flex-col gap-3">
          <p className="text-center text-sm text-zinc-500">
            Joining room <span className="text-zinc-200">{code}</span>
          </p>
          <input
            value={joinName}
            onChange={(e) => setJoinName(e.target.value)}
            placeholder="Your name"
            maxLength={24}
            className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none"
          />
          {joinError && <p className="text-sm text-zinc-400">{joinError}</p>}
          <button
            type="submit"
            disabled={joinBusy || !joinName.trim()}
            className="rounded-md bg-zinc-100 py-2 text-sm font-semibold text-black hover:bg-white disabled:bg-zinc-700 disabled:text-zinc-400"
          >
            {joinBusy ? "Joining…" : "Join Room"}
          </button>
        </form>
      </Centered>
    );
  }

  if (!state) {
    return <Centered>Loading room…</Centered>;
  }

  const me = state.players[session.playerId];
  if (!me) {
    return <Centered>You&apos;re not in this room anymore.</Centered>;
  }

  const isHost = Boolean(session.hostToken);
  const players = Object.values(state.players);
  const canShuffle = state.deck.length === 52;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 p-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">
            Room {code}
          </h1>
          <p className="text-xs text-zinc-500">
            {players.length} player{players.length !== 1 ? "s" : ""} ·{" "}
            {isHost ? "you are the host" : `host: ${players.find((p) => p.isHost)?.name ?? "?"}`}
          </p>
        </div>
        <button
          onClick={() => router.push("/")}
          className="rounded-md border border-zinc-800 px-3 py-1.5 text-xs text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
        >
          Leave
        </button>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[16rem_1fr_16rem]">
        <div className="flex flex-col gap-4 order-2 lg:order-1">
          <Deck
            deckCount={state.deck.length}
            isHost={isHost}
            players={players}
            canShuffle={canShuffle}
            onShuffle={() => dispatch("shuffle")}
            onDeal={(targetPlayerId, count, faceUp) =>
              dispatch("deal", { targetPlayerId, count, faceUp })
            }
            onDealToTable={(count, faceUp) =>
              dispatch("dealToTable", {
                count,
                faceUp,
                x: 40 + Math.random() * 10,
                y: 35 + Math.random() * 10,
              })
            }
            onReturnAll={() => dispatch("returnAllToDeck")}
          />
          <ActionLog entries={state.turnLog} />
        </div>

        <div className="order-1 flex flex-col gap-4 lg:order-2">
          <Table
            cards={state.table}
            tableRef={tableRef}
            onMove={(cardId, x, y) => dispatch("moveOnTable", { cardId, x, y })}
            onFlip={(cardId) => dispatch("flipTableCard", { cardId })}
          />
          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-zinc-500">
              Your Hand
            </p>
            <Hand
              cards={me.hand}
              tableRef={tableRef}
              onPlayToTable={(cardId, faceUp, x, y) =>
                dispatch("playToTable", { cardId, faceUp, x, y })
              }
              onReturnToDeck={(cardId) => dispatch("returnToDeck", { cardId })}
            />
          </div>
        </div>

        <div className="order-3">
          <Sideboard
            jokers={state.sideboard.jokers}
            chips={state.sideboard.chips}
          />
        </div>
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
      {children}
    </div>
  );
}
