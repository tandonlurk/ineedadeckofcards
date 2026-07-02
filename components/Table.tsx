"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { PlayingCard } from "./Card";
import { useDeckTheme } from "./DeckTheme";
import { useDraggable } from "@/lib/useDraggable";
import type { Player, TableCard } from "@/lib/roomState";

const SEAT_COLORS = [
  "#f2b04c",
  "#5aa9f5",
  "#ef6c8b",
  "#6fd39a",
  "#b78cf2",
  "#f28b5a",
  "#63d6d0",
  "#e0e08a",
];

export function Table({
  cards,
  players,
  meId,
  roomCode,
  tableRef,
  deckRef,
  onMove,
  onFlip,
}: {
  cards: TableCard[];
  players: Player[];
  meId: string;
  roomCode: string;
  tableRef: React.RefObject<HTMLDivElement | null>;
  deckRef: React.RefObject<HTMLDivElement | null>;
  onMove: (cardId: string, x: number, y: number) => void;
  onFlip: (cardId: string) => void;
}) {
  const { theme } = useDeckTheme();

  // Diff table card ids against the previous render so newly dealt cards get
  // a toss animation ("storing information from previous renders" pattern).
  const [prev, setPrev] = useState<{
    cards: TableCard[];
    newIds: ReadonlySet<string>;
  }>({ cards, newIds: new Set() });
  let newIds = prev.newIds;
  if (prev.cards !== cards) {
    const prevIds = new Set(prev.cards.map((c) => c.id));
    newIds = new Set(cards.filter((c) => !prevIds.has(c.id)).map((c) => c.id));
    setPrev({ cards, newIds });
  }

  const tossOrder = cards
    .filter((c) => newIds.has(c.id))
    .sort((a, b) => a.z - b.z)
    .map((c) => c.id);

  return (
    <div
      ref={tableRef}
      className="relative h-[26rem] w-full overflow-hidden rounded-[2rem] border-2 sm:h-[30rem]"
      style={{ ...theme.feltStyle, borderColor: theme.feltBorder }}
    >
      {/* inner rail */}
      <div className="pointer-events-none absolute inset-3 rounded-[1.5rem] border border-white/10" />

      {cards.length === 0 && (
        <p className="absolute inset-0 flex items-center justify-center px-8 text-center text-sm text-white/25">
          {players.length < 2 ? (
            <span>
              Waiting for players — share code{" "}
              <span className="font-mono font-semibold text-white/50">{roomCode}</span>
            </span>
          ) : (
            "The table is empty — deal from the deck or drag cards here"
          )}
        </p>
      )}

      {cards
        .slice()
        .sort((a, b) => a.z - b.z)
        .map((card) => (
          <TableCardView
            key={card.id}
            card={card}
            isNew={newIds.has(card.id)}
            tossDelayMs={Math.max(0, tossOrder.indexOf(card.id)) * 90}
            tableRef={tableRef}
            deckRef={deckRef}
            onMove={onMove}
            onFlip={onFlip}
          />
        ))}

      {players.map((p, i) => (
        <Seat
          key={p.id}
          player={p}
          isMe={p.id === meId}
          color={SEAT_COLORS[i % SEAT_COLORS.length]}
          position={seatPosition(players, meId, p.id)}
        />
      ))}
    </div>
  );
}

/**
 * Seats sit on an ellipse just inside the table edge: you at the bottom
 * center, everyone else spread across the top arc in join order.
 */
function seatPosition(
  players: Player[],
  meId: string,
  playerId: string
): { x: number; y: number } {
  if (playerId === meId) return { x: 50, y: 90 };
  const others = players.filter((p) => p.id !== meId);
  const j = others.findIndex((p) => p.id === playerId);
  const k = others.length;
  // Top arc from 200° (left) through 270° (top) to 340° (right).
  const deg = 200 + (140 * (j + 1)) / (k + 1);
  const rad = (deg * Math.PI) / 180;
  return { x: 50 + 43 * Math.cos(rad), y: 50 + 39 * Math.sin(rad) };
}

function Seat({
  player,
  isMe,
  color,
  position,
}: {
  player: Player;
  isMe: boolean;
  color: string;
  position: { x: number; y: number };
}) {
  const initials = player.name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className="pointer-events-none absolute z-[600]"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      <div className="seat-pop flex flex-col items-center gap-1">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full border-2 bg-black/50 text-xs font-bold backdrop-blur-sm"
          style={{ borderColor: color, color }}
        >
          {initials || "?"}
        </div>
        <div className="flex max-w-28 items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 backdrop-blur-sm">
          {player.isHost && (
            <span className="text-[10px]" title="Host" style={{ color }}>
              ♛
            </span>
          )}
          <span className="truncate text-[11px] font-medium text-zinc-100">
            {isMe ? "You" : player.name}
          </span>
          <span className="flex shrink-0 items-center gap-0.5 text-[10px] tabular-nums text-zinc-300">
            <span className="inline-block h-2.5 w-2 rounded-[2px] border border-zinc-400/60 bg-zinc-600/60" />
            {player.hand.length}
          </span>
        </div>
      </div>
    </div>
  );
}

function TableCardView({
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
