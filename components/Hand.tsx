"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { PlayingCard } from "./Card";
import { useDraggable } from "@/lib/useDraggable";
import type { Card } from "@/lib/deck";

export function Hand({
  cards,
  tableRef,
  onPlayToTable,
  onReturnToDeck,
}: {
  cards: Card[];
  tableRef: React.RefObject<HTMLDivElement | null>;
  onPlayToTable: (cardId: string, faceUp: boolean, x: number, y: number) => void;
  onReturnToDeck: (cardId: string) => void;
}) {
  if (cards.length === 0) {
    return <p className="text-sm text-zinc-600">Your hand is empty.</p>;
  }

  return (
    <div className="flex flex-wrap gap-3">
      {cards.map((card) => (
        <HandCard
          key={card.id}
          card={card}
          tableRef={tableRef}
          onPlayToTable={onPlayToTable}
          onReturnToDeck={onReturnToDeck}
        />
      ))}
    </div>
  );
}

function HandCard({
  card,
  tableRef,
  onPlayToTable,
  onReturnToDeck,
}: {
  card: Card;
  tableRef: React.RefObject<HTMLDivElement | null>;
  onPlayToTable: (cardId: string, faceUp: boolean, x: number, y: number) => void;
  onReturnToDeck: (cardId: string) => void;
}) {
  const [faceUp, setFaceUp] = useState(card.faceUp);

  const { dragging, point, onPointerDown } = useDraggable(tableRef, (x, y) => {
    onPlayToTable(card.id, faceUp, x, y);
  });

  return (
    <div className="flex flex-col items-center gap-1">
      <div onPointerDown={onPointerDown} className="touch-none">
        <PlayingCard
          card={{ ...card, faceUp: true }}
          size="md"
          className={`cursor-grab active:cursor-grabbing ${dragging ? "opacity-30" : ""}`}
        />
      </div>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => setFaceUp((v) => !v)}
          className="rounded border border-zinc-700 px-1.5 py-0.5 text-[10px] text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
          title="Toggle how this card will appear to others when played"
        >
          {faceUp ? "play face up" : "play face down"}
        </button>
        <button
          type="button"
          onClick={() => onReturnToDeck(card.id)}
          className="rounded border border-zinc-700 px-1.5 py-0.5 text-[10px] text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
        >
          return
        </button>
      </div>
      {dragging &&
        point &&
        createPortal(
          <div
            className="pointer-events-none fixed z-[1000]"
            style={{ left: point.clientX - 28, top: point.clientY - 40 }}
          >
            <PlayingCard card={{ ...card, faceUp }} size="md" />
          </div>,
          document.body
        )}
    </div>
  );
}
