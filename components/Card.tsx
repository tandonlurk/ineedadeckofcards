"use client";

import { SUIT_GLYPHS, type Card as CardType } from "@/lib/deck";
import { useDeckTheme } from "./DeckTheme";

const SIZES = {
  sm: "w-12 h-[4.2rem] text-[8px] rounded-md",
  md: "w-[4.25rem] h-24 text-xs rounded-lg",
  lg: "w-24 h-[8.5rem] text-base rounded-xl",
};

/**
 * A themed playing card rendered as a 3D flip container, so any change to
 * `card.faceUp` animates as a smooth flip.
 */
export function PlayingCard({
  card,
  size = "md",
  className = "",
}: {
  card: CardType;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const { theme } = useDeckTheme();

  return (
    <div
      className={`card-flip relative select-none shadow-md shadow-black/40 ${SIZES[size]} ${className}`}
    >
      <div className={`card-flip-inner ${card.faceUp ? "" : "card-flipped"}`}>
        <div className="card-face">
          <CardFace card={card} />
        </div>
        <div className="card-face card-face-back">
          <theme.Back />
        </div>
      </div>
    </div>
  );
}

function CardFace({ card }: { card: CardType }) {
  const { theme } = useDeckTheme();
  const glyph = SUIT_GLYPHS[card.suit];
  const isRed = card.suit === "hearts" || card.suit === "diamonds";
  const color = isRed ? theme.red : theme.ink;

  if (card.rank === "JOKER") {
    return (
      <div
        className={`flex h-full w-full flex-col items-center justify-center gap-[0.3em] rounded-[inherit] ${theme.face} ${theme.ink} ${theme.faceFont}`}
      >
        <span className="text-[2.6em] leading-none">{theme.jokerGlyph}</span>
        <span className="text-[0.85em] font-bold tracking-[0.25em]">JOKER</span>
      </div>
    );
  }

  return (
    <div
      className={`flex h-full w-full flex-col rounded-[inherit] ${theme.face} ${color} ${theme.faceFont}`}
    >
      <div className="flex flex-col items-center self-start px-[0.5em] pt-[0.4em] leading-none">
        <span className="text-[1.3em] font-bold">{card.rank}</span>
        <span className="text-[1.05em]">{glyph}</span>
      </div>
      <div className="relative flex flex-1 items-center justify-center">
        <span className="absolute text-[4.4em] leading-none opacity-[0.08]">{glyph}</span>
        <span className="text-[2.7em] leading-none">{glyph}</span>
      </div>
      <div className="flex rotate-180 flex-col items-center self-end px-[0.5em] pt-[0.4em] leading-none">
        <span className="text-[1.3em] font-bold">{card.rank}</span>
        <span className="text-[1.05em]">{glyph}</span>
      </div>
    </div>
  );
}
