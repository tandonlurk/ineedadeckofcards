"use client";

import { PlayingCard } from "./Card";
import type { Card } from "@/lib/deck";
import type { ChipStack } from "@/lib/roomState";

const CHIP_STYLES: Record<
  ChipStack["color"],
  { bg: string; edge: string; text: string }
> = {
  white: { bg: "#e9e6dc", edge: "#b9b5a6", text: "#1c1c1c" },
  red: { bg: "#c23b3b", edge: "#7e2020", text: "#fff5f5" },
  blue: { bg: "#3565c0", edge: "#1f3f82", text: "#eef3ff" },
  green: { bg: "#2f8355", edge: "#1c5636", text: "#eefff5" },
  black: { bg: "#232323", edge: "#5c5c5c", text: "#efefef" },
};

export function Sideboard({
  jokers,
  chips,
}: {
  jokers: Card[];
  chips: ChipStack[];
}) {
  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
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
        <div className="flex flex-col gap-2">
          {chips.map((c) => {
            const style = CHIP_STYLES[c.color];
            return (
              <div key={c.color} className="flex items-center justify-between">
                <span className="flex items-center gap-2.5">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-dashed text-[10px] font-bold shadow-sm shadow-black/40"
                    style={{
                      background: style.bg,
                      borderColor: style.edge,
                      color: style.text,
                    }}
                  >
                    {c.value}
                  </span>
                  <span className="text-sm capitalize text-zinc-400">
                    {c.color}
                  </span>
                </span>
                <span className="font-mono text-sm text-zinc-200">
                  ×{c.count}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
