"use client";

import { useState } from "react";
import type { Player } from "@/lib/roomState";

export function Deck({
  deckCount,
  isHost,
  players,
  canShuffle,
  onShuffle,
  onDeal,
  onDealToTable,
  onReturnAll,
}: {
  deckCount: number;
  isHost: boolean;
  players: Player[];
  canShuffle: boolean;
  onShuffle: () => void;
  onDeal: (targetPlayerId: string, count: number, faceUp: boolean) => void;
  onDealToTable: (count: number, faceUp: boolean) => void;
  onReturnAll: () => void;
}) {
  const [targetId, setTargetId] = useState(players[0]?.id ?? "");
  const [count, setCount] = useState(1);
  const [faceUp, setFaceUp] = useState(false);

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-500">Deck</p>
          <p className="text-3xl font-semibold text-zinc-100">{deckCount}</p>
        </div>
        <div className="h-20 w-14 rounded-md border border-zinc-700 bg-zinc-800" />
      </div>

      {isHost && (
        <>
          <button
            type="button"
            disabled={!canShuffle}
            onClick={onShuffle}
            title={
              canShuffle
                ? "Shuffle the deck"
                : "All cards must be back in the deck before shuffling"
            }
            className="rounded-md border border-zinc-700 py-2 text-sm font-medium text-zinc-200 hover:border-zinc-500 disabled:cursor-not-allowed disabled:border-zinc-800 disabled:text-zinc-600"
          >
            Shuffle
          </button>

          <div className="flex flex-col gap-2 border-t border-zinc-800 pt-3">
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              Deal
            </p>
            <div className="flex gap-2">
              <input
                type="number"
                min={1}
                max={deckCount}
                value={count}
                onChange={(e) =>
                  setCount(Math.max(1, Number(e.target.value) || 1))
                }
                className="w-16 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-100"
              />
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="flex-1 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-100"
              >
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-xs text-zinc-400">
              <input
                type="checkbox"
                checked={faceUp}
                onChange={(e) => setFaceUp(e.target.checked)}
              />
              Deal face up
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={deckCount < count || !targetId}
                onClick={() => onDeal(targetId, count, faceUp)}
                className="flex-1 rounded-md border border-zinc-700 py-1.5 text-xs font-medium text-zinc-200 hover:border-zinc-500 disabled:cursor-not-allowed disabled:border-zinc-800 disabled:text-zinc-600"
              >
                To Player
              </button>
              <button
                type="button"
                disabled={deckCount < count}
                onClick={() => onDealToTable(count, faceUp)}
                className="flex-1 rounded-md border border-zinc-700 py-1.5 text-xs font-medium text-zinc-200 hover:border-zinc-500 disabled:cursor-not-allowed disabled:border-zinc-800 disabled:text-zinc-600"
              >
                To Table
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={onReturnAll}
            className="rounded-md border border-zinc-800 py-1.5 text-xs text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
          >
            Return all cards to deck
          </button>
        </>
      )}
    </div>
  );
}
