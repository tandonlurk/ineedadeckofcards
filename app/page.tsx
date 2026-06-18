"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Anton, Playfair_Display, Caveat } from "next/font/google";
import { saveSession } from "@/lib/session";

const deckFont = Playfair_Display({ subsets: ["latin"], weight: "900" });
const ofFont = Caveat({ subsets: ["latin"], weight: "700" });
const cardsFont = Anton({ subsets: ["latin"], weight: "400" });

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<"create" | "join">("create");
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create room");
      saveSession({
        code: data.code,
        playerId: data.playerId,
        hostToken: data.hostToken,
        name,
      });
      router.push(`/room/${data.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    const code = joinCode.trim();
    if (!name.trim() || code.length !== 5) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/rooms/${code}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not join room");
      saveSession({ code, playerId: data.playerId, name });
      router.push(`/room/${code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <span className="-mb-1 self-end pr-1 text-sm italic font-light tracking-wide text-zinc-500">
            i need a
          </span>
          <h1 className="flex items-center gap-3 text-3xl tracking-tight text-zinc-50 sm:text-4xl">
            <span className="text-zinc-600">♠</span>
            <span className="flex items-baseline gap-1.5">
              <span className={deckFont.className}>DECK</span>
              <span className={`${ofFont.className} text-xl italic text-zinc-500 sm:text-2xl`}>
                of
              </span>
              <span className={cardsFont.className}>CARDS</span>
            </span>
            <span className="text-zinc-600">♠</span>
          </h1>
          <div className="mt-3 h-px w-40 bg-zinc-800" />
          <p className="mt-3 text-center text-sm text-zinc-500">
            For when you couldn't find one in your junk drawer.
          </p>
        </div>

        <div className="mb-6 flex rounded-md border border-zinc-800 p-1">
          <button
            type="button"
            onClick={() => setMode("create")}
            className={`flex-1 rounded-sm py-2 text-sm font-medium transition-colors ${
              mode === "create"
                ? "bg-zinc-100 text-black"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Create Room
          </button>
          <button
            type="button"
            onClick={() => setMode("join")}
            className={`flex-1 rounded-sm py-2 text-sm font-medium transition-colors ${
              mode === "join"
                ? "bg-zinc-100 text-black"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Join Room
          </button>
        </div>

        <form
          onSubmit={mode === "create" ? handleCreate : handleJoin}
          className="flex flex-col gap-3"
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength={24}
            className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none"
          />
          {mode === "join" && (
            <input
              value={joinCode}
              onChange={(e) =>
                setJoinCode(e.target.value.replace(/\D/g, "").slice(0, 5))
              }
              placeholder="5-digit room code"
              inputMode="numeric"
              className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-center text-lg tracking-widest text-zinc-100 placeholder:text-sm placeholder:tracking-normal placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none"
            />
          )}
          {error && <p className="text-sm text-zinc-400">{error}</p>}
          <button
            type="submit"
            disabled={
              busy ||
              !name.trim() ||
              (mode === "join" && joinCode.length !== 5)
            }
            className="mt-2 rounded-md bg-zinc-100 py-2 text-sm font-semibold text-black transition-colors hover:bg-white disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
          >
            {busy
              ? "Working…"
              : mode === "create"
                ? "Create Room"
                : "Join Room"}
          </button>
        </form>
      </div>
    </div>
  );
}
