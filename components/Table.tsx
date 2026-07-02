"use client";

import { useState } from "react";
import { useDeckTheme } from "./DeckTheme";
import { Seat, SEAT_COLORS, seatPosition } from "./Seat";
import { TableCardView } from "./TableCard";
import type { Player, TableCard } from "@/lib/roomState";

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
