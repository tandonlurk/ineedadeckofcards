import { PlayingCard } from "./Card";
import type { Card } from "@/lib/deck";
import type { ChipStack } from "@/lib/roomState";

export function Sideboard({
  jokers,
  chips,
}: {
  jokers: Card[];
  chips: ChipStack[];
}) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
      <div>
        <p className="mb-2 text-xs uppercase tracking-wide text-zinc-500">
          Jokers
        </p>
        <div className="flex gap-2">
          {jokers.map((j) => (
            <PlayingCard key={j.id} card={{ ...j, faceUp: true }} size="sm" />
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs uppercase tracking-wide text-zinc-500">
          Chips
        </p>
        <div className="flex flex-col gap-1.5">
          {chips.map((c) => (
            <div
              key={c.color}
              className="flex items-center justify-between text-sm text-zinc-300"
            >
              <span className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full border border-zinc-500 bg-zinc-700" />
                <span className="capitalize text-zinc-500">{c.color}</span>
                <span className="text-zinc-600">×{c.value}</span>
              </span>
              <span className="font-mono text-zinc-200">{c.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
