"use client";

import { useState } from "react";
import type { LogEntry } from "@/lib/roomState";

export function ActionLog({ entries }: { entries: LogEntry[] }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/60">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-2 text-xs uppercase tracking-wide text-zinc-500"
      >
        Activity
        <span>{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div className="max-h-40 overflow-y-auto border-t border-zinc-800 px-4 py-2 text-sm text-zinc-400">
          {entries.length === 0 && (
            <p className="text-zinc-600">No activity yet.</p>
          )}
          {entries
            .slice()
            .reverse()
            .map((e, i) => (
              <p key={i} className="py-0.5">
                {e.text}
              </p>
            ))}
        </div>
      )}
    </div>
  );
}
