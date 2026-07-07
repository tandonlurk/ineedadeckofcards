"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { PlayingCard } from "./Card";
import { useDraggable } from "@/lib/useDraggable";
import type { TableCard } from "@/lib/roomState";

export function TableCardView({
  card,
  isNew,
  tossDelayMs,
  tableRef,
  deckRef,
  onMove,
  onFlip,
}: {
  card: TableCard;
  isNew: boolean;
  tossDelayMs: number;
  tableRef: React.RefObject<HTMLDivElement | null>;
  deckRef: React.RefObject<HTMLDivElement | null>;
  onMove: (cardId: string, x: number, y: number) => void;
  onFlip: (cardId: string) => void;
}) {
  // Capture at mount whether this card entered with a toss; later prop
  // changes (e.g. z bumps from moves) must not retrigger the entrance.
  const [entrance] = useState(() => (isNew ? { delay: tossDelayMs } : null));
  const [toss, setToss] = useState<React.CSSProperties | null>(null);
  const [settled, setSettled] = useState(entrance === null);

  useLayoutEffect(() => {
    if (!entrance || toss) return;
    const tableRect = tableRef.current?.getBoundingClientRect();
    if (!tableRect) return;
    const deckRect = deckRef.current?.getBoundingClientRect();
    const restX = tableRect.left + (card.x / 100) * tableRect.width;
    const restY = tableRect.top + (card.y / 100) * tableRect.height;
    const fromX = deckRect ? deckRect.left + deckRect.width / 2 : tableRect.left - 100;
    const fromY = deckRect ? deckRect.top + deckRect.height / 2 : tableRect.top - 100;
    setToss({
      "--toss-x": `${fromX - restX}px`,
      "--toss-y": `${fromY - restY}px`,
      "--toss-r": `${(Math.random() * 48 - 24).toFixed(1)}deg`,
      animationDelay: `${entrance.delay}ms`,
    } as React.CSSProperties);
  }, [entrance, toss, card.x, card.y, tableRef, deckRef]);

  // Cards tossed face up land showing their back, then flip mid-settle.
  useEffect(() => {
    if (settled) return;
    const t = setTimeout(() => setSettled(true), (entrance?.delay ?? 0) + 300);
    return () => clearTimeout(t);
  }, [settled, entrance]);

  const shownFaceUp = settled ? card.faceUp : false;

  const { dragging, pct, onPointerDown } = useDraggable(tableRef, (x, y) => {
    onMove(card.id, x, y);
  });

  const x = dragging && pct ? pct.x : card.x;
  const y = dragging && pct ? pct.y : card.y;
  const stillHidden = entrance !== null && toss === null;

  return (
    <div
      onPointerDown={onPointerDown}
      onDoubleClick={() => onFlip(card.id)}
      className={`absolute cursor-grab touch-none active:cursor-grabbing ${
        toss ? "card-toss" : ""
      } ${stillHidden ? "opacity-0" : ""}`}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        zIndex: dragging ? 999 : card.z,
        transition: dragging ? "none" : "left 120ms ease, top 120ms ease",
      }}
      title="Drag to move, double-click to flip"
    >
      <PlayingCard card={{ ...card, faceUp: shownFaceUp }} size="md" />
    </div>
  );
}
