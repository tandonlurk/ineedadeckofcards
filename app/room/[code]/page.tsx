"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useRoomState } from "./useRoomState";
import { loadSession, saveSession, type RoomSession } from "@/lib/session";
import { Deck } from "@/components/Deck";
import { Hand } from "@/components/Hand";
import { Table } from "@/components/Table";
import { Sideboard } from "@/components/Sideboard";
import { ActionLog } from "@/components/ActionLog";
import { DeckThemePicker, DeckThemeProvider } from "@/components/DeckTheme";
import { MobileRoom } from "@/components/MobileRoom";
import { useMediaQuery } from "@/lib/useMediaQuery";

export default function RoomPage() {
  return (
    <DeckThemeProvider>
      <Room />
    </DeckThemeProvider>
  );
}

function Room() {
  const params = useParams<{ code: string }>();
  const code = params.code;
  const router = useRouter();
  const tableRef = useRef<HTMLDivElement | null>(null);
  const deckRef = useRef<HTMLDivElement | null>(null);

  const [session, setSession] = useState<RoomSession | null>(() =>
    loadSession(code)
  );
  const [joinName, setJoinName] = useState("");
  const [joinBusy, setJoinBusy] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { state, error, actionError, clearActionError, loading, dispatch } =
    useRoomState(code, session ?? null);
  const isMobile = useMediaQuery("(max-width: 767px)");

  useEffect(() => {
    if (!actionError) return;
    const t = setTimeout(clearActionError, 3500);
    return () => clearTimeout(t);
  }, [actionError, clearActionError]);

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

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable; nothing to do
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
          className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-200 hover:border-zinc-500"
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
            Joining room{" "}
            <span className="font-mono font-semibold text-zinc-200">{code}</span>
          </p>
          <input
            value={joinName}
            onChange={(e) => setJoinName(e.target.value)}
            placeholder="Your name"
            maxLength={24}
            className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none"
          />
          {joinError && <p className="text-sm text-red-400/80">{joinError}</p>}
          <button
            type="submit"
            disabled={joinBusy || !joinName.trim()}
            className="rounded-lg bg-zinc-100 py-2 text-sm font-semibold text-black hover:bg-white disabled:bg-zinc-700 disabled:text-zinc-400"
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

  const toast = actionError && (
    <div
      className={`toast-in fixed left-1/2 z-[1100] -translate-x-1/2 rounded-lg border border-red-900/60 bg-red-950/90 px-4 py-2 text-sm text-red-200 shadow-lg shadow-black/40 backdrop-blur ${
        isMobile ? "top-14" : "bottom-4"
      }`}
    >
      {actionError}
    </div>
  );

  if (isMobile) {
    return (
      <>
        <MobileRoom
          code={code}
          state={state}
          meId={session.playerId}
          isHost={isHost}
          dispatch={dispatch}
          onLeave={() => router.push("/")}
          tableRef={tableRef}
          deckRef={deckRef}
        />
        {toast}
      </>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 p-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={copyCode}
            title="Copy room code"
            className="group flex items-center gap-2 rounded-lg border border-zinc-800 px-3 py-1.5 transition-colors hover:border-zinc-600"
          >
            <span className="font-mono text-lg font-semibold tracking-widest text-zinc-100">
              {code}
            </span>
            <span className="text-[10px] uppercase tracking-wide text-zinc-600 group-hover:text-zinc-400">
              {copied ? "copied!" : "copy"}
            </span>
          </button>
          <div>
            <p className="text-sm text-zinc-300">
              {players.length} player{players.length !== 1 ? "s" : ""} at the table
            </p>
            <p className="text-xs text-zinc-600">
              {isHost
                ? "You hold the deck"
                : `${players.find((p) => p.isHost)?.name ?? "?"} holds the deck`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <DeckThemePicker />
          <button
            onClick={() => router.push("/")}
            className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs text-zinc-500 transition-colors hover:border-zinc-600 hover:text-zinc-300"
          >
            Leave
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[16rem_1fr_15rem]">
        <div className="order-2 flex flex-col gap-4 lg:order-1">
          <Deck
            deckCount={state.deck.length}
            isHost={isHost}
            players={players}
            canShuffle={canShuffle}
            deckRef={deckRef}
            onShuffle={() => dispatch("shuffle")}
            onDeal={(targetPlayerId, count, faceUp, blind) =>
              dispatch("deal", { targetPlayerId, count, faceUp, blind })
            }
            onDealToTable={(count, faceUp) =>
              dispatch("dealToTable", {
                count,
                faceUp,
                x: 38 + Math.random() * 14,
                y: 34 + Math.random() * 12,
              })
            }
            onReturnAll={() => dispatch("returnAllToDeck")}
          />
          <ActionLog entries={state.turnLog} />
        </div>

        <div className="order-1 flex flex-col gap-4 lg:order-2">
          <Table
            cards={state.table}
            players={players}
            meId={session.playerId}
            roomCode={code}
            tableRef={tableRef}
            deckRef={deckRef}
            onMove={(cardId, x, y) => dispatch("moveOnTable", { cardId, x, y })}
            onFlip={(cardId) => dispatch("flipTableCard", { cardId })}
          />
          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-zinc-500">
              Your hand · {me.hand.length}
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

      {toast}
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
