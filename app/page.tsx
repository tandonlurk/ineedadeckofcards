"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveSession } from "@/lib/session";

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
        <h1 className="mb-1 text-center text-2xl font-semibold tracking-tight text-zinc-100">
          ♠ Deck of Cards
        </h1>
        <p className="mb-8 text-center text-sm text-zinc-500">
          No accounts. Just a room code.
        </p>

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
