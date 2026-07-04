"use client";

import { useState } from "react";
import { useDeckTheme } from "./DeckTheme";
import type { Player } from "@/lib/roomState";

export type DealMode = "down" | "up" | "blind";

export function Deck({
  deckCount,
  isHost,
  players,
  canShuffle,
  onShuffle,
  onDeal,
  onDealToTable,
  onReturnAll,
  deckRef,
}: {
  deckCount: number;
  isHost: boolean;
  players: Player[];
  canShuffle: boolean;
  onShuffle: () => void;
  onDeal: (
    targetPlayerId: string,
    count: number,
    faceUp: boolean,
    blind: boolean
  ) => void;
  onDealToTable: (count: number, faceUp: boolean) => void;
  onReturnAll: () => void;
  deckRef: React.RefObject<HTMLDivElement | null>;
}) {
  const { theme } = useDeckTheme();
  const [open, setOpen] = useState(false);
  const [rawTargetId, setRawTargetId] = useState("");
  const [count, setCount] = useState(1);
  const [mode, setMode] = useState<DealMode>("down");
  const [shuffling, setShuffling] = useState(false);

  // Fall back to the first player if the picked target left the room.
  const targetId = players.some((p) => p.id === rawTargetId)
    ? rawTargetId
    : (players[0]?.id ?? "");

  function handleShuffle() {
    setShuffling(true);
    setTimeout(() => setShuffling(false), 520);
    onShuffle();
  }

  if (!open) {
    return (
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          title="Open the deck"
          className="group relative h-16 w-16 shrink-0 transition-transform hover:scale-105"
        >
          <div
            ref={deckRef}
            className="h-full w-full overflow-hidden rounded-full border-2 border-zinc-700 shadow-lg shadow-black/50 transition-colors group-hover:border-zinc-500"
          >
            <div className="h-full w-full scale-[1.8]">
              <theme.Back />
            </div>
          </div>
          <span className="absolute -right-1 -top-1 rounded-full border border-zinc-700 bg-zinc-950 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-zinc-100">
            {deckCount}
          </span>
        </button>
        <div className="text-left">
          <p className="text-sm font-medium text-zinc-300">Deck</p>
          <p className="text-xs text-zinc-600">
            {isHost ? "tap to shuffle & deal" : "tap to peek"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">Deck</p>
          <p className="text-3xl font-semibold tabular-nums text-zinc-100">
            {deckCount}
          </p>
          <p className="text-[11px] text-zinc-600">
            card{deckCount !== 1 ? "s" : ""} remaining
          </p>
        </div>
        <div className="flex items-start gap-2">
          <div
            ref={deckRef}
            className={`relative h-24 w-[4.25rem] ${shuffling ? "deck-shuffling" : ""}`}
          >
            {deckCount === 0 ? (
              <div className="flex h-full w-full items-center justify-center rounded-lg border border-dashed border-zinc-700 text-[10px] text-zinc-600">
                empty
              </div>
            ) : (
              <>
                {deckCount > 20 && (
                  <div className="absolute inset-0 -translate-x-1.5 translate-y-1 rotate-[-5deg] overflow-hidden rounded-lg shadow-md shadow-black/40">
                    <theme.Back />
                  </div>
                )}
                {deckCount > 5 && (
                  <div className="absolute inset-0 -translate-x-0.5 translate-y-0.5 rotate-[-2deg] overflow-hidden rounded-lg shadow-md shadow-black/40">
                    <theme.Back />
                  </div>
                )}
                <div className="absolute inset-0 overflow-hidden rounded-lg shadow-lg shadow-black/50">
                  <theme.Back />
                </div>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            title="Collapse the deck"
            className="rounded-full px-1.5 text-sm text-zinc-600 transition-colors hover:text-zinc-300"
          >
            ✕
          </button>
        </div>
      </div>

      {isHost ? (
        <>
          <button
            type="button"
            disabled={!canShuffle}
            onClick={handleShuffle}
            title={
              canShuffle
                ? "Shuffle the deck"
                : "All cards must be back in the deck before shuffling"
            }
            className="rounded-lg border border-zinc-700 py-2 text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-500 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:border-zinc-800 disabled:text-zinc-600"
          >
            ⟳ Shuffle
          </button>

          <div className="flex flex-col gap-2.5 border-t border-zinc-800 pt-3">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Deal</p>

            <div className="flex rounded-lg border border-zinc-800 p-0.5">
              {(
                [
                  ["down", "Face down", "Dealt cards land hidden"],
                  ["up", "Face up", "Dealt cards land revealed"],
                  [
                    "blind",
                    "Blind",
                    "Everyone sees the card EXCEPT the player holding it",
                  ],
                ] as const
              ).map(([value, label, hint]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMode(value)}
                  title={hint}
                  className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
                    mode === value
                      ? "bg-zinc-100 text-black"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {mode === "blind" && (
              <p className="text-[11px] leading-snug text-zinc-500">
                Blind: the whole table sees the card — except whoever holds it.
              </p>
            )}

            <div className="flex gap-2">
              <div className="flex items-center rounded-lg border border-zinc-700 bg-zinc-900">
                <button
                  type="button"
                  onClick={() => setCount((c) => Math.max(1, c - 1))}
                  className="px-2 py-1 text-zinc-400 hover:text-zinc-100"
                  aria-label="Fewer cards"
                >
                  −
                </button>
                <span className="w-6 text-center text-sm tabular-nums text-zinc-100">
                  {count}
                </span>
                <button
                  type="button"
                  onClick={() => setCount((c) => Math.min(Math.max(deckCount, 1), c + 1))}
                  className="px-2 py-1 text-zinc-400 hover:text-zinc-100"
                  aria-label="More cards"
                >
                  +
                </button>
              </div>
              <select
                value={targetId}
                onChange={(e) => setRawTargetId(e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-100"
                aria-label="Deal to player"
              >
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={deckCount < count || !targetId}
                onClick={() =>
                  onDeal(targetId, count, mode === "up", mode === "blind")
                }
                className="flex-1 rounded-lg border border-zinc-700 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:border-zinc-500 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:border-zinc-800 disabled:text-zinc-600"
              >
                To player
              </button>
              <button
                type="button"
                disabled={deckCount < count || mode === "blind"}
                title={
                  mode === "blind"
                    ? "Blind deals only go to players"
                    : undefined
                }
                onClick={() => onDealToTable(count, mode === "up")}
                className="flex-1 rounded-lg bg-zinc-100 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-white disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
              >
                Toss to table
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={onReturnAll}
            className="rounded-lg border border-zinc-800 py-1.5 text-xs text-zinc-500 transition-colors hover:border-zinc-600 hover:text-zinc-300"
          >
            Return all cards to deck
          </button>
        </>
      ) : (
        <p className="text-xs text-zinc-600">
          The host holds the deck — they shuffle and deal.
        </p>
      )}
    </div>
  );
}
