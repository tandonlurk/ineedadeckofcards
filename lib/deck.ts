export type Suit = "spades" | "hearts" | "diamonds" | "clubs";
export type Rank =
  | "A"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K";

export type Card = {
  id: string;
  rank: Rank | "JOKER";
  suit: Suit | "joker";
  faceUp: boolean;
};

const SUITS: Suit[] = ["spades", "hearts", "diamonds", "clubs"];
const RANKS: Rank[] = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];

export const SUIT_GLYPHS: Record<Card["suit"], string> = {
  spades: "♠",
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
  joker: "★",
};

export function buildDeck(): Card[] {
  const cards: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      cards.push({ id: `${rank}-${suit}`, rank, suit, faceUp: false });
    }
  }
  return cards;
}

export function buildJokers(): Card[] {
  return [
    { id: "joker-1", rank: "JOKER", suit: "joker", faceUp: false },
    { id: "joker-2", rank: "JOKER", suit: "joker", faceUp: false },
  ];
}

export function shuffle<T>(input: T[]): T[] {
  const cards = [...input];
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}
