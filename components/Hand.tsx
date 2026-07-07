"use client";

import { useEffect, useState } from "react";
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
  // Diff hand ids against the previous render so freshly dealt cards animate
  // in ("storing information from previous renders" pattern).
  const [prev, setPrev] = useState<{
    cards: Card[];
    newIds: ReadonlySet<string>;
  }>({ cards, newIds: new Set() });
  let newIds = prev.newIds;
  if (prev.cards !== cards) {
    const prevIds = new Set(prev.cards.map((c) => c.id));
    newIds = new Set(cards.filter((c) => !prevIds.has(c.id)).map((c) => c.id));
    setPrev({ cards, newIds });
  }

  if (cards.length === 0) {
    return (
      <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-zinc-800 text-sm text-zinc-600">
        Your hand is empty — cards dealt to you land here.
      </div>
    );
  }

  let dealt = 0;
  return (
    <div className="flex flex-wrap gap-3">
      {cards.map((card) => (
        <HandCard
          key={card.id}
          card={card}
          isNew={newIds.has(card.id)}
          dealDelayMs={newIds.has(card.id) ? dealt++ * 90 : 0}
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
  isNew,
  dealDelayMs,
  tableRef,
  onPlayToTable,
  onReturnToDeck,
}: {
  card: Card;
  isNew: boolean;
  dealDelayMs: number;
  tableRef: React.RefObject<HTMLDivElement | null>;
  onPlayToTable: (cardId: string, faceUp: boolean, x: number, y: number) => void;
  onReturnToDeck: (cardId: string) => void;
}) {
  const [faceUp, setFaceUp] = useState(card.faceUp);
  // Fresh deals slide in showing the back, then flip up for a quick peek.
  // Entrance is captured at mount so later renders don't retrigger it.
  const [entrance] = useState(() => (isNew ? { delay: dealDelayMs } : null));
  const [revealed, setRevealed] = useState(entrance === null);

  useEffect(() => {
    if (revealed) return;
    const t = setTimeout(() => setRevealed(true), (entrance?.delay ?? 0) + 320);
    return () => clearTimeout(t);
  }, [revealed, entrance]);

  const { dragging, point, onPointerDown } = useDraggable(tableRef, (x, y) => {
    onPlayToTable(card.id, faceUp, x, y);
  });

  // Blind cards stay hidden from their own holder until played.
  const showFace = !card.blind && revealed;

  return (
    <div
      className={`flex flex-col items-center gap-1.5 ${entrance ? "hand-in" : ""}`}
      style={entrance ? { animationDelay: `${entrance.delay}ms` } : undefined}
    >
      <div onPointerDown={onPointerDown} className="relative touch-none">
        <PlayingCard
          card={{ ...card, faceUp: showFace }}
          size="md"
          className={`cursor-grab transition-transform hover:-translate-y-1 active:cursor-grabbing ${
            dragging ? "opacity-30" : ""
          }`}
        />
        {card.blind && (
          <span
            title="Dealt blind — everyone can see this card except you"
            className="absolute -right-1.5 -top-1.5 rounded-full border border-zinc-600 bg-zinc-950 px-1.5 py-0.5 text-[10px] font-bold text-zinc-200"
          >
            ?
          </span>
        )}
      </div>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => setFaceUp((v) => !v)}
          className="rounded-md border border-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
          title="Toggle how this card will land when you play it to the table"
        >
          {faceUp ? "▲ plays face up" : "▼ plays face down"}
        </button>
        <button
          type="button"
          onClick={() => onReturnToDeck(card.id)}
          className="rounded-md border border-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
          title="Return this card to the deck"
        >
          return
        </button>
      </div>
      {dragging &&
        point &&
        createPortal(
          <div
            className="pointer-events-none fixed z-[1000]"
            style={{ left: point.clientX - 34, top: point.clientY - 48 }}
          >
            <PlayingCard
              card={{ ...card, faceUp: !card.blind && faceUp }}
              size="md"
            />
          </div>,
          document.body
        )}
    </div>
  );
}
