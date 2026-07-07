"use client";

import { useState } from "react";
import type { LogEntry } from "@/lib/roomState";

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ActionLog({ entries }: { entries: LogEntry[] }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-xs uppercase tracking-wide text-zinc-500 transition-colors hover:text-zinc-300"
      >
        Activity
        <span className="text-zinc-600">{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div className="max-h-44 overflow-y-auto border-t border-zinc-800 px-4 py-2 text-sm">
          {entries.length === 0 && (
            <p className="py-1 text-zinc-600">No activity yet.</p>
          )}
          {entries
            .slice()
            .reverse()
            .map((e, i) => (
              <p
                key={`${e.ts}-${i}`}
                className={`flex items-baseline gap-2 py-0.5 ${
                  i === 0 ? "text-zinc-200" : "text-zinc-500"
                }`}
              >
                <span className="shrink-0 font-mono text-[10px] text-zinc-600">
                  {formatTime(e.ts)}
                </span>
                {e.text}
              </p>
            ))}
        </div>
      )}
    </div>
  );
}
