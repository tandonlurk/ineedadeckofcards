"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { PlayingCard } from "./Card";
import { ActionLog } from "./ActionLog";
import { Sideboard } from "./Sideboard";
import { DeckThemePicker, ThemeBackdrop, useDeckTheme } from "./DeckTheme";
import { Seat, SEAT_COLORS, seatPosition } from "./Seat";
import { TableCardView } from "./TableCard";
import type { Card } from "@/lib/deck";
import type { Player, RoomState, TableCard } from "@/lib/roomState";

type Dispatch = (type: string, payload?: Record<string, unknown>) => void;

/** A loose landing spot near the middle of the felt. */
function randomLanding() {
  return { x: 38 + Math.random() * 14, y: 34 + Math.random() * 12 };
}

/**
 * Full-screen touch-first room layout. The dealer's deck sits centered at the
 * bottom: tap it to toss a card onto the table, or drag it onto a player's
 * seat (or a spot on the felt) to deal there. Everyone's hand fans out along
 * the bottom edge; tap a fanned card for actions or drag it onto the felt.
 */
export function MobileRoom({
  code,
  state,
  meId,
  isHost,
  dispatch,
  onLeave,
  tableRef,
  deckRef,
}: {
  code: string;
  state: RoomState;
  meId: string;
  isHost: boolean;
  dispatch: Dispatch;
  onLeave: () => void;
  tableRef: React.RefObject<HTMLDivElement | null>;
  deckRef: React.RefObject<HTMLDivElement | null>;
}) {
  const { theme } = useDeckTheme();
  const players = Object.values(state.players);
  const me = state.players[meId];
  const deckCount = state.deck.length;

  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [faceUp, setFaceUp] = useState(false);
  const [flights, setFlights] = useState<Flight[]>([]);

  // Diff table card ids for the toss entrance, as on desktop.
  const [prev, setPrev] = useState<{
    cards: TableCard[];
    newIds: ReadonlySet<string>;
  }>({ cards: state.table, newIds: new Set() });
  let newIds = prev.newIds;
  if (prev.cards !== state.table) {
    const prevIds = new Set(prev.cards.map((c) => c.id));
    newIds = new Set(
      state.table.filter((c) => !prevIds.has(c.id)).map((c) => c.id)
    );
    setPrev({ cards: state.table, newIds });
  }
  const tossOrder = state.table
    .filter((c) => newIds.has(c.id))
    .sort((a, b) => a.z - b.z)
    .map((c) => c.id);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable; nothing to do
    }
  }

  function seatPixel(p: Player) {
    const rect = tableRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const pos = seatPosition(players, meId, p.id);
    return {
      x: rect.left + (pos.x / 100) * rect.width,
      y: rect.top + (pos.y / 100) * rect.height,
    };
  }

  function seatHit(clientX: number, clientY: number): Player | null {
    let best: Player | null = null;
    let bestD = 64;
    for (const p of players) {
      if (p.id === meId) continue;
      const px = seatPixel(p);
      if (!px) continue;
      const d = Math.hypot(clientX - px.x, clientY - px.y);
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    }
    return best;
  }

  function feltPct(clientX: number, clientY: number) {
    const rect = tableRef.current?.getBoundingClientRect();
    if (!rect) return null;
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      return null;
    }
    return {
      x: Math.min(96, Math.max(0, ((clientX - rect.left) / rect.width) * 100)),
      y: Math.min(92, Math.max(0, ((clientY - rect.top) / rect.height) * 100)),
    };
  }

  function launchFlight(toX: number, toY: number) {
    const from = deckRef.current?.getBoundingClientRect();
    if (!from) return;
    setFlights((f) => [
      ...f,
      {
        key: Date.now() + Math.random(),
        fromX: from.left + from.width / 2,
        fromY: from.top + from.height / 2,
        toX,
        toY,
        rot: Math.random() * 40 - 20,
      },
    ]);
  }

  const [targetSeatId, setTargetSeatId] = useState<string | null>(null);
  const deckDrag = usePointerDrag({
    onTap: () => {
      if (deckCount === 0) return;
      dispatch("dealToTable", { count: 1, faceUp, ...randomLanding() });
    },
    onMove: (x, y) => setTargetSeatId(seatHit(x, y)?.id ?? null),
    onDrop: (x, y) => {
      setTargetSeatId(null);
      if (deckCount === 0) return;
      const seat = seatHit(x, y);
      if (seat) {
        dispatch("deal", { targetPlayerId: seat.id, count: 1, faceUp });
        const px = seatPixel(seat);
        if (px) launchFlight(px.x, px.y);
        return;
      }
      const pct = feltPct(x, y);
      if (pct) {
        dispatch("dealToTable", { count: 1, faceUp, x: pct.x, y: pct.y });
        return;
      }
      // Dropped below the felt, onto the dock: deal to your own hand.
      const rect = tableRef.current?.getBoundingClientRect();
      if (rect && y > rect.bottom) {
        dispatch("deal", { targetPlayerId: meId, count: 1, faceUp });
      }
    },
  });

  const canShuffle = deckCount === 52;

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col overflow-hidden overscroll-none"
      style={theme.feltStyle}
    >
      <ThemeBackdrop />

      <header className="relative z-10 flex items-center justify-between gap-2 px-3 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2">
        <button
          type="button"
          onClick={copyCode}
          className="flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 backdrop-blur-sm"
        >
          <span className="font-mono text-sm font-semibold tracking-widest text-zinc-100">
            {code}
          </span>
          <span className="text-[9px] uppercase tracking-wide text-zinc-400">
            {copied ? "copied!" : "copy"}
          </span>
        </button>
        <div className="flex items-center gap-2">
          <DeckThemePicker />
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-lg text-zinc-200 backdrop-blur-sm"
          >
            ⋯
          </button>
        </div>
      </header>

      <main ref={tableRef} className="relative z-10 flex-1">
        {!isHost && (
          <div
            ref={deckRef}
            className="absolute left-1/2 top-1 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 backdrop-blur-sm"
          >
            <div className="h-7 w-5 overflow-hidden rounded-[3px]">
              <theme.Back />
            </div>
            <span className="text-xs tabular-nums text-zinc-200">{deckCount}</span>
          </div>
        )}

        {state.table.length === 0 && (
          <p className="absolute inset-0 flex items-center justify-center px-10 text-center text-sm text-white/25">
            {players.length < 2 ? (
              <span>
                Waiting for players — share code{" "}
                <span className="font-mono font-semibold text-white/50">{code}</span>
              </span>
            ) : isHost ? (
              "Tap the deck to toss a card, or drag it onto a player"
            ) : (
              "The felt is empty — waiting on the dealer"
            )}
          </p>
        )}

        {state.table
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
              onMove={(cardId, x, y) => dispatch("moveOnTable", { cardId, x, y })}
              onFlip={(cardId) => dispatch("flipTableCard", { cardId })}
            />
          ))}

        {players
          .filter((p) => p.id !== meId)
          .map((p) => (
            <Seat
              key={p.id}
              player={p}
              isMe={false}
              color={SEAT_COLORS[players.indexOf(p) % SEAT_COLORS.length]}
              position={seatPosition(players, meId, p.id)}
              highlighted={targetSeatId === p.id}
            />
          ))}
      </main>

      <footer className="relative z-20 flex flex-col items-center gap-2 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1">
        {me && me.hand.length > 0 && (
          <FanHand
            cards={me.hand}
            feltPct={feltPct}
            onPlay={(cardId, cardFaceUp, x, y) =>
              dispatch("playToTable", { cardId, faceUp: cardFaceUp, x, y })
            }
            onReturn={(cardId) => dispatch("returnToDeck", { cardId })}
          />
        )}

        {isHost ? (
          <div className="flex w-full items-end justify-center gap-4">
            <button
              type="button"
              disabled={!canShuffle}
              onClick={() => dispatch("shuffle")}
              className="mb-1 rounded-full bg-black/40 px-3 py-1.5 text-xs font-medium text-zinc-200 backdrop-blur-sm disabled:text-zinc-600"
            >
              ⟳ Shuffle
            </button>
            <div className="flex flex-col items-center gap-1">
              <p className="text-[10px] text-white/35">
                tap to toss · drag to deal
              </p>
              <div
                ref={deckRef}
                onPointerDown={deckDrag.onPointerDown}
                className={`relative h-[4.5rem] w-[3.15rem] touch-none ${
                  deckDrag.dragging ? "opacity-40" : ""
                }`}
              >
                {deckCount === 0 ? (
                  <div className="flex h-full w-full items-center justify-center rounded-lg border border-dashed border-white/25 text-[9px] text-white/40">
                    empty
                  </div>
                ) : (
                  <>
                    {deckCount > 20 && (
                      <div className="absolute inset-0 -translate-x-1 translate-y-0.5 rotate-[-4deg] overflow-hidden rounded-lg shadow-md shadow-black/50">
                        <theme.Back />
                      </div>
                    )}
                    {deckCount > 5 && (
                      <div className="absolute inset-0 -translate-x-0.5 rotate-[-2deg] overflow-hidden rounded-lg shadow-md shadow-black/50">
                        <theme.Back />
                      </div>
                    )}
                    <div className="absolute inset-0 overflow-hidden rounded-lg shadow-lg shadow-black/60">
                      <theme.Back />
                    </div>
                  </>
                )}
                <span className="absolute -right-2 -top-2 rounded-full bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-zinc-100 backdrop-blur-sm">
                  {deckCount}
                </span>
              </div>
            </div>
            <div className="mb-1 flex rounded-full bg-black/40 p-0.5 backdrop-blur-sm">
              <button
                type="button"
                onClick={() => setFaceUp(false)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                  !faceUp ? "bg-zinc-100 text-black" : "text-zinc-400"
                }`}
              >
                ▼ down
              </button>
              <button
                type="button"
                onClick={() => setFaceUp(true)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                  faceUp ? "bg-zinc-100 text-black" : "text-zinc-400"
                }`}
              >
                ▲ up
              </button>
            </div>
          </div>
        ) : (
          me &&
          me.hand.length === 0 && (
            <p className="py-3 text-center text-xs text-white/30">
              Your hand is empty — cards dealt to you fan out here.
            </p>
          )
        )}
      </footer>

      {/* deck drag ghost */}
      {deckDrag.dragging &&
        deckDrag.point &&
        createPortal(
          <div
            className="pointer-events-none fixed z-[1000] h-20 w-14 -rotate-6 overflow-hidden rounded-lg shadow-xl shadow-black/60"
            style={{ left: deckDrag.point.x - 28, top: deckDrag.point.y - 46 }}
          >
            <theme.Back />
          </div>,
          document.body
        )}

      {flights.map((f) => (
        <FlightCard
          key={f.key}
          flight={f}
          onDone={(key) =>
            setFlights((cur) => cur.filter((x) => x.key !== key))
          }
        />
      ))}

      {menuOpen && (
        <div className="fixed inset-0 z-[900]">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-black/60"
          />
          <div className="sheet-in absolute inset-x-0 bottom-0 max-h-[75vh] overflow-y-auto rounded-t-3xl border-t border-zinc-800 bg-zinc-950 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-zinc-700" />
            <p className="mb-3 text-center text-xs text-zinc-500">
              {players.length} player{players.length !== 1 ? "s" : ""} ·{" "}
              {isHost
                ? "you hold the deck"
                : `${players.find((p) => p.isHost)?.name ?? "?"} holds the deck`}
            </p>
            {isHost && (
              <div className="mb-4 flex gap-2">
                <button
                  type="button"
                  disabled={!canShuffle}
                  onClick={() => {
                    dispatch("shuffle");
                    setMenuOpen(false);
                  }}
                  className="flex-1 rounded-lg border border-zinc-700 py-2 text-sm text-zinc-200 disabled:border-zinc-800 disabled:text-zinc-600"
                >
                  ⟳ Shuffle
                </button>
                <button
                  type="button"
                  onClick={() => {
                    dispatch("returnAllToDeck");
                    setMenuOpen(false);
                  }}
                  className="flex-1 rounded-lg border border-zinc-700 py-2 text-sm text-zinc-200"
                >
                  Return all to deck
                </button>
              </div>
            )}
            <div className="flex flex-col gap-4">
              <Sideboard
                jokers={state.sideboard.jokers}
                chips={state.sideboard.chips}
              />
              <ActionLog entries={state.turnLog} />
              <button
                type="button"
                onClick={onLeave}
                className="rounded-lg border border-zinc-800 py-2 text-sm text-zinc-500"
              >
                Leave room
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type Flight = {
  key: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  rot: number;
};

/** A card back that streaks from the deck to a seat after a drag-deal. */
function FlightCard({
  flight,
  onDone,
}: {
  flight: Flight;
  onDone: (key: number) => void;
}) {
  const { theme } = useDeckTheme();

  useEffect(() => {
    const t = setTimeout(() => onDone(flight.key), 520);
    return () => clearTimeout(t);
  }, [flight.key, onDone]);

  return createPortal(
    <div
      className="card-fly pointer-events-none fixed z-[1000] h-20 w-14 overflow-hidden rounded-lg shadow-xl shadow-black/60"
      style={
        {
          left: flight.fromX - 28,
          top: flight.fromY - 40,
          "--fly-x": `${flight.toX - flight.fromX}px`,
          "--fly-y": `${flight.toY - flight.fromY}px`,
          "--fly-r": `${flight.rot.toFixed(1)}deg`,
        } as React.CSSProperties
      }
    >
      <theme.Back />
    </div>,
    document.body
  );
}

/**
 * Tap-vs-drag pointer tracking: small movements resolve as a tap, anything
 * past the threshold becomes a drag that reports its live point and drop.
 */
function usePointerDrag({
  onTap,
  onMove,
  onDrop,
}: {
  onTap?: () => void;
  onMove?: (clientX: number, clientY: number) => void;
  onDrop?: (clientX: number, clientY: number) => void;
}) {
  const [point, setPoint] = useState<{ x: number; y: number } | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    const sx = e.clientX;
    const sy = e.clientY;
    let moved = false;
    const move = (ev: PointerEvent) => {
      if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 10) {
        moved = true;
      }
      if (moved) {
        setPoint({ x: ev.clientX, y: ev.clientY });
        onMove?.(ev.clientX, ev.clientY);
      }
    };
    const up = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", move);
      setPoint(null);
      if (moved) onDrop?.(ev.clientX, ev.clientY);
      else onTap?.();
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up, { once: true });
  };

  return { dragging: point !== null, point, onPointerDown };
}

/**
 * The player's hand as an arc fan pinned to the bottom edge. Tap a card to
 * raise it and show actions; drag it onto the felt to play it there.
 */
function FanHand({
  cards,
  feltPct,
  onPlay,
  onReturn,
}: {
  cards: Card[];
  feltPct: (
    clientX: number,
    clientY: number
  ) => { x: number; y: number } | null;
  onPlay: (cardId: string, faceUp: boolean, x: number, y: number) => void;
  onReturn: (cardId: string) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [faceUpById, setFaceUpById] = useState<Record<string, boolean>>({});

  // Entrance diff, as elsewhere.
  const [prev, setPrev] = useState<{
    cards: Card[];
    newIds: ReadonlySet<string>;
  }>({ cards, newIds: new Set() });
  let newIds = prev.newIds;
  if (prev.cards !== cards) {
    const prevIds = new Set(prev.cards.map((c) => c.id));
    newIds = new Set(cards.filter((c) => !prevIds.has(c.id)).map((c) => c.id));
    setPrev({ cards, newIds });
  }

  const selected = cards.find((c) => c.id === selectedId) ?? null;
  const selectedFaceUp = selected ? (faceUpById[selected.id] ?? false) : false;
  const n = cards.length;
  const spread = n > 1 ? Math.min(64, n * 9) : 0;

  let dealt = 0;
  return (
    <div className="flex w-full flex-col items-center">
      <div
        className={`mb-1 flex items-center gap-2 transition-opacity ${
          selected ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <button
          type="button"
          onClick={() => {
            if (!selected) return;
            const spot = randomLanding();
            onPlay(selected.id, selectedFaceUp, spot.x, spot.y);
            setSelectedId(null);
          }}
          className="rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-semibold text-black"
        >
          ⤴ Play
        </button>
        <button
          type="button"
          onClick={() =>
            selected &&
            setFaceUpById((m) => ({ ...m, [selected.id]: !selectedFaceUp }))
          }
          className="rounded-full bg-black/50 px-3 py-1 text-[11px] text-zinc-200 backdrop-blur-sm"
        >
          {selectedFaceUp ? "▲ plays face up" : "▼ plays face down"}
        </button>
        <button
          type="button"
          onClick={() => {
            if (!selected) return;
            onReturn(selected.id);
            setSelectedId(null);
          }}
          className="rounded-full bg-black/50 px-3 py-1 text-[11px] text-zinc-200 backdrop-blur-sm"
        >
          ⟲ Return
        </button>
      </div>
      <div className="relative h-[6.5rem] w-full">
        {cards.map((card, i) => {
          const rot = n > 1 ? -spread / 2 + (spread / (n - 1)) * i : 0;
          const isNew = newIds.has(card.id);
          return (
            <FanCard
              key={card.id}
              card={card}
              rot={rot}
              zIndex={selectedId === card.id ? 100 : i + 1}
              selected={selectedId === card.id}
              faceUpPref={faceUpById[card.id] ?? false}
              isNew={isNew}
              dealDelayMs={isNew ? dealt++ * 90 : 0}
              feltPct={feltPct}
              onSelect={() =>
                setSelectedId((cur) => (cur === card.id ? null : card.id))
              }
              onPlay={(x, y) => {
                onPlay(card.id, faceUpById[card.id] ?? false, x, y);
                setSelectedId(null);
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

function FanCard({
  card,
  rot,
  zIndex,
  selected,
  faceUpPref,
  isNew,
  dealDelayMs,
  feltPct,
  onSelect,
  onPlay,
}: {
  card: Card;
  rot: number;
  zIndex: number;
  selected: boolean;
  faceUpPref: boolean;
  isNew: boolean;
  dealDelayMs: number;
  feltPct: (
    clientX: number,
    clientY: number
  ) => { x: number; y: number } | null;
  onSelect: () => void;
  onPlay: (x: number, y: number) => void;
}) {
  // Fresh deals fan in showing the back, then flip up for a quick peek.
  const [entrance] = useState(() => (isNew ? { delay: dealDelayMs } : null));
  const [revealed, setRevealed] = useState(entrance === null);

  useEffect(() => {
    if (revealed) return;
    const t = setTimeout(() => setRevealed(true), (entrance?.delay ?? 0) + 340);
    return () => clearTimeout(t);
  }, [revealed, entrance]);

  const drag = usePointerDrag({
    onTap: onSelect,
    onDrop: (x, y) => {
      const pct = feltPct(x, y);
      if (pct) onPlay(pct.x, pct.y);
    },
  });

  return (
    <>
      <div
        className="absolute bottom-0 left-1/2"
        style={{
          transform: `translateX(-50%) rotate(${rot}deg) translateY(${
            selected ? -26 : 0
          }px)`,
          transformOrigin: "50% 130%",
          zIndex,
          transition: "transform 200ms cubic-bezier(0.3, 1.1, 0.4, 1)",
        }}
      >
        <div
          className={entrance ? "hand-in" : ""}
          style={entrance ? { animationDelay: `${entrance.delay}ms` } : undefined}
        >
          <div onPointerDown={drag.onPointerDown} className="touch-none">
            <PlayingCard
              card={{ ...card, faceUp: revealed }}
              size="md"
              className={drag.dragging ? "opacity-30" : ""}
            />
          </div>
        </div>
      </div>
      {drag.dragging &&
        drag.point &&
        createPortal(
          <div
            className="pointer-events-none fixed z-[1000]"
            style={{ left: drag.point.x - 28, top: drag.point.y - 46 }}
          >
            <PlayingCard card={{ ...card, faceUp: faceUpPref }} size="md" />
          </div>,
          document.body
        )}
    </>
  );
}
