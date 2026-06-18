import { SUIT_GLYPHS, type Card as CardType } from "@/lib/deck";

const SIZES = {
  sm: "w-10 h-14 text-xs",
  md: "w-14 h-20 text-base",
  lg: "w-20 h-28 text-xl",
};

export function PlayingCard({
  card,
  size = "md",
  className = "",
}: {
  card: CardType;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const sizeClass = SIZES[size];

  if (!card.faceUp) {
    return (
      <div
        className={`flex items-center justify-center rounded-md border border-zinc-700 bg-zinc-800 select-none ${sizeClass} ${className}`}
      >
        <span className="text-zinc-600">♠</span>
      </div>
    );
  }

  const glyph = SUIT_GLYPHS[card.suit];
  const isJoker = card.rank === "JOKER";

  return (
    <div
      className={`flex flex-col items-center justify-center gap-0.5 rounded-md border border-zinc-300 bg-zinc-100 font-semibold text-black select-none ${sizeClass} ${className}`}
    >
      {isJoker ? (
        <span className="text-lg">★</span>
      ) : (
        <>
          <span>{card.rank}</span>
          <span>{glyph}</span>
        </>
      )}
    </div>
  );
}
