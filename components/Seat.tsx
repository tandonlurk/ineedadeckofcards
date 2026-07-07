"use client";

import { useDeckTheme } from "./DeckTheme";
import { seatCardFaceUp, SUIT_GLYPHS, type Card } from "@/lib/deck";
import type { Player } from "@/lib/roomState";

export const SEAT_COLORS = [
  "#f2b04c",
  "#5aa9f5",
  "#ef6c8b",
  "#6fd39a",
  "#b78cf2",
  "#f28b5a",
  "#63d6d0",
  "#e0e08a",
];

const MAX_MINI_CARDS = 8;

/**
 * Seats sit on an ellipse just inside the table edge: you at the bottom
 * center, everyone else spread across the top arc in join order.
 */
export function seatPosition(
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

export function Seat({
  player,
  isMe,
  color,
  position,
  highlighted = false,
}: {
  player: Player;
  isMe: boolean;
  color: string;
  position: { x: number; y: number };
  highlighted?: boolean;
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
      <div
        className={`seat-pop flex flex-col items-center gap-1 transition-transform ${
          highlighted ? "scale-110" : ""
        }`}
      >
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full border-2 bg-black/50 text-xs font-bold backdrop-blur-sm transition-shadow"
          style={{
            borderColor: color,
            color,
            boxShadow: highlighted ? `0 0 0 4px ${color}55, 0 0 18px ${color}88` : undefined,
          }}
        >
          {initials || "?"}
        </div>
        <div className="flex max-w-32 items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 backdrop-blur-sm">
          {player.isHost && (
            <span className="text-[10px]" title="Host" style={{ color }}>
              ♛
            </span>
          )}
          <span className="truncate text-[11px] font-medium text-zinc-100">
            {isMe ? "You" : player.name}
          </span>
          {/* keyed on count so every change re-triggers the bump animation */}
          <span
            key={player.hand.length}
            className="count-bump shrink-0 text-[10px] tabular-nums text-zinc-400"
          >
            ({player.hand.length})
          </span>
        </div>
        {player.hand.length > 0 && (
          <MiniHand cards={player.hand} viewerIsOwner={isMe} />
        )}
      </div>
    </div>
  );
}

/**
 * The public view of a player's held cards: face-up deals show their front
 * to the whole table, blind deals show their front to everyone except the
 * holder, everything else shows a back.
 */
function MiniHand({
  cards,
  viewerIsOwner,
}: {
  cards: Card[];
  viewerIsOwner: boolean;
}) {
  const shown = cards.slice(0, MAX_MINI_CARDS);
  const extra = cards.length - shown.length;

  return (
    <div className="flex items-center">
      {shown.map((card, i) => (
        <MiniCard
          key={card.id}
          card={card}
          faceUp={seatCardFaceUp(card, viewerIsOwner)}
          overlap={i > 0}
        />
      ))}
      {extra > 0 && (
        <span className="ml-0.5 rounded-full bg-black/50 px-1 text-[9px] tabular-nums text-zinc-300 backdrop-blur-sm">
          +{extra}
        </span>
      )}
    </div>
  );
}

function MiniCard({
  card,
  faceUp,
  overlap,
}: {
  card: Card;
  faceUp: boolean;
  overlap: boolean;
}) {
  const { theme } = useDeckTheme();

  if (!faceUp) {
    return (
      <div
        className={`h-[2.1rem] w-6 overflow-hidden rounded-[3px] shadow-sm shadow-black/50 ${
          overlap ? "-ml-2" : ""
        }`}
      >
        <theme.Back />
      </div>
    );
  }

  const isRed = card.suit === "hearts" || card.suit === "diamonds";
  const color = isRed ? theme.red : theme.ink;
  return (
    <div
      className={`flex h-[2.1rem] w-6 flex-col items-center justify-center rounded-[3px] leading-none shadow-sm shadow-black/50 ${
        theme.face
      } ${color} ${overlap ? "-ml-2" : ""}`}
    >
      <span className="text-[9px] font-bold">
        {card.rank === "JOKER" ? theme.jokerGlyph : card.rank}
      </span>
      {card.rank !== "JOKER" && (
        <span className="text-[8px]">{SUIT_GLYPHS[card.suit]}</span>
      )}
    </div>
  );
}
