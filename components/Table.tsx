"use client";

import { useRef } from "react";
import { PlayingCard } from "./Card";
import { useDraggable } from "@/lib/useDraggable";
import type { TableCard } from "@/lib/roomState";

export function Table({
  cards,
  tableRef,
  onMove,
  onFlip,
}: {
  cards: TableCard[];
  tableRef: React.RefObject<HTMLDivElement | null>;
  onMove: (cardId: string, x: number, y: number) => void;
  onFlip: (cardId: string) => void;
}) {
  return (
    <div
      ref={tableRef}
      className="relative h-[28rem] w-full overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950/60"
      style={{
        backgroundImage:
          "radial-gradient(circle at 1px 1px, #1f1f1f 1px, transparent 0)",
        backgroundSize: "24px 24px",
      }}
    >
      {cards.length === 0 && (
        <p className="absolute inset-0 flex items-center justify-center text-sm text-zinc-700">
          The table is empty — drag cards here
        </p>
      )}
      {cards
        .slice()
        .sort((a, b) => a.z - b.z)
        .map((card) => (
          <TableCardView
            key={card.id}
            card={card}
            tableRef={tableRef}
            onMove={onMove}
            onFlip={onFlip}
          />
        ))}
    </div>
  );
}

function TableCardView({
  card,
  tableRef,
  onMove,
  onFlip,
}: {
  card: TableCard;
  tableRef: React.RefObject<HTMLDivElement | null>;
  onMove: (cardId: string, x: number, y: number) => void;
  onFlip: (cardId: string) => void;
}) {
  const dragRef = useRef<HTMLDivElement | null>(null);

  const { dragging, pct, onPointerDown } = useDraggable(tableRef, (x, y) => {
    onMove(card.id, x, y);
  });

  const x = dragging && pct ? pct.x : card.x;
  const y = dragging && pct ? pct.y : card.y;

  return (
    <div
      ref={dragRef}
      onPointerDown={onPointerDown}
      onDoubleClick={() => onFlip(card.id)}
      className="absolute cursor-grab touch-none active:cursor-grabbing"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        zIndex: dragging ? 999 : card.z,
        transition: dragging ? "none" : "left 120ms ease, top 120ms ease",
      }}
      title="Drag to move, double-click to flip"
    >
      <PlayingCard card={card} size="md" />
    </div>
  );
}
