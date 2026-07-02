"use client";

import { createContext, useContext, useState } from "react";

export type DeckThemeId = "midnight" | "retro" | "davy";

export type DeckTheme = {
  id: DeckThemeId;
  label: string;
  tagline: string;
  /** background + border classes for the card face */
  face: string;
  /** font class for rank/index text */
  faceFont: string;
  /** text color class for black suits */
  ink: string;
  /** text color class for red suits */
  red: string;
  /** table felt surface */
  feltStyle: React.CSSProperties;
  feltBorder: string;
  /** css background used by the theme picker chip */
  swatch: string;
  /** highlight color for interactive accents (drag targets, toggles) */
  accent: string;
  jokerGlyph: string;
  Back: React.ComponentType<{ className?: string }>;
};

function MidnightBack({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 56 80" className={`h-full w-full ${className}`} aria-hidden>
      <defs>
        <linearGradient id="mn-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#272b5e" />
          <stop offset="1" stopColor="#0b0d24" />
        </linearGradient>
      </defs>
      <rect width="56" height="80" rx="6" fill="url(#mn-bg)" />
      <rect
        x="3"
        y="3"
        width="50"
        height="74"
        rx="4"
        fill="none"
        stroke="#8b90f5"
        strokeOpacity="0.5"
        strokeWidth="1"
      />
      <g transform="translate(28 40)" fill="none" stroke="#9ba0ff" strokeWidth="1">
        <rect x="-16" y="-16" width="32" height="32" transform="rotate(45)" strokeOpacity="0.3" />
        <rect x="-11.5" y="-11.5" width="23" height="23" transform="rotate(45)" strokeOpacity="0.55" />
        <rect
          x="-7"
          y="-7"
          width="14"
          height="14"
          transform="rotate(45)"
          strokeOpacity="0.9"
          fill="#9ba0ff"
          fillOpacity="0.12"
        />
        <circle r="1.6" fill="#c9ccff" stroke="none" />
      </g>
      <circle cx="28" cy="12" r="1" fill="#8b90f5" opacity="0.7" />
      <circle cx="28" cy="68" r="1" fill="#8b90f5" opacity="0.7" />
      <circle cx="10" cy="40" r="1" fill="#8b90f5" opacity="0.7" />
      <circle cx="46" cy="40" r="1" fill="#8b90f5" opacity="0.7" />
    </svg>
  );
}

function RetroBack({ className = "" }: { className?: string }) {
  const rays = Array.from({ length: 16 });
  return (
    <svg viewBox="0 0 56 80" className={`h-full w-full ${className}`} aria-hidden>
      <defs>
        <clipPath id="rt-clip">
          <rect x="3" y="3" width="50" height="74" rx="4" />
        </clipPath>
      </defs>
      <rect width="56" height="80" rx="6" fill="#f0e3c0" />
      <rect x="3" y="3" width="50" height="74" rx="4" fill="#6d4423" />
      <g clipPath="url(#rt-clip)">
        <g transform="translate(28 40)">
          {rays.map((_, i) => (
            <path
              key={i}
              d="M0 0 L-8 -70 L8 -70 Z"
              transform={`rotate(${(360 / rays.length) * i})`}
              fill={i % 2 ? "#e08a33" : "#b5561f"}
              opacity="0.92"
            />
          ))}
          <circle r="13" fill="#f0e3c0" />
          <circle r="9.5" fill="#d9a743" />
          <circle r="5.5" fill="#b5561f" />
          <circle r="2" fill="#f0e3c0" />
        </g>
      </g>
      <rect
        x="3"
        y="3"
        width="50"
        height="74"
        rx="4"
        fill="none"
        stroke="#f0e3c0"
        strokeOpacity="0.6"
        strokeWidth="1"
      />
    </svg>
  );
}

function DavyBack({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 56 80" className={`h-full w-full ${className}`} aria-hidden>
      <defs>
        <linearGradient id="dj-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0d3a3b" />
          <stop offset="1" stopColor="#03100f" />
        </linearGradient>
        <radialGradient id="dj-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#5ef0cf" stopOpacity="0.35" />
          <stop offset="1" stopColor="#5ef0cf" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="56" height="80" rx="6" fill="url(#dj-bg)" />
      <rect
        x="3"
        y="3"
        width="50"
        height="74"
        rx="4"
        fill="none"
        stroke="#2e9d86"
        strokeOpacity="0.55"
        strokeWidth="1"
      />
      {/* tentacles */}
      <path
        d="M7 76 C 15 62, 5 50, 15 41 C 22 35, 20 26, 13 24 C 9 23, 8 27, 11 28"
        stroke="#35c3a4"
        strokeOpacity="0.55"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M49 74 C 41 64, 51 52, 42 43 C 35 37, 37 27, 44 26 C 48 25.5, 48.5 29.5, 45.5 30"
        stroke="#35c3a4"
        strokeOpacity="0.4"
        strokeWidth="1.3"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M18 8 C 24 12, 32 6, 38 10"
        stroke="#35c3a4"
        strokeOpacity="0.35"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />
      {/* kraken eye */}
      <circle cx="28" cy="40" r="15" fill="url(#dj-glow)" />
      <ellipse cx="28" cy="40" rx="10" ry="7" fill="#062023" stroke="#2e9d86" strokeOpacity="0.85" />
      <ellipse cx="28" cy="40" rx="2.1" ry="4.8" fill="#7cf5d8" />
      {/* bubbles */}
      <circle cx="19" cy="19" r="1.4" fill="#7cf5d8" opacity="0.35" />
      <circle cx="23" cy="13" r="0.9" fill="#7cf5d8" opacity="0.25" />
      <circle cx="39" cy="61" r="1.2" fill="#7cf5d8" opacity="0.3" />
      <circle cx="35" cy="67" r="0.8" fill="#7cf5d8" opacity="0.22" />
    </svg>
  );
}

export const DECK_THEMES: Record<DeckThemeId, DeckTheme> = {
  midnight: {
    id: "midnight",
    label: "Midnight",
    tagline: "Sleek indigo house deck",
    face: "bg-[#f8f6ef] border border-[#d9d5c6]",
    faceFont: "font-sans",
    ink: "text-[#232637]",
    red: "text-[#d5445c]",
    feltStyle: {
      background:
        "radial-gradient(120% 90% at 50% 28%, #14352a 0%, #0c231c 55%, #071510 100%)",
      boxShadow: "inset 0 0 90px rgba(0,0,0,0.55)",
    },
    feltBorder: "#1e4030",
    swatch: "linear-gradient(135deg, #272b5e, #0b0d24)",
    accent: "#8b90f5",
    jokerGlyph: "★",
    Back: MidnightBack,
  },
  retro: {
    id: "retro",
    label: "Retro",
    tagline: "'70s rec-room sunburst",
    face: "bg-[#f2e5c4] border border-[#c9a86a] shadow-[inset_0_0_0_2px_rgba(109,68,35,0.15)]",
    faceFont: "font-serif",
    ink: "text-[#4c3620]",
    red: "text-[#bc4e1a]",
    feltStyle: {
      background:
        "radial-gradient(120% 90% at 50% 28%, #4d3a1e 0%, #34270f 55%, #201807 100%)",
      boxShadow: "inset 0 0 90px rgba(0,0,0,0.5)",
    },
    feltBorder: "#5b4526",
    swatch: "linear-gradient(135deg, #e08a33, #6d4423)",
    accent: "#e08a33",
    jokerGlyph: "☺",
    Back: RetroBack,
  },
  davy: {
    id: "davy",
    label: "Davy Jones",
    tagline: "Dredged from the locker",
    face: "bg-gradient-to-b from-[#e6efe7] to-[#ccdcd2] border border-[#96ad9f]",
    faceFont: "font-serif",
    ink: "text-[#17383f]",
    red: "text-[#993744]",
    feltStyle: {
      background:
        "radial-gradient(120% 90% at 50% 28%, #0d3335 0%, #082123 55%, #030f0f 100%)",
      boxShadow: "inset 0 0 90px rgba(0,0,0,0.6)",
    },
    feltBorder: "#164a45",
    swatch: "linear-gradient(135deg, #0d3a3b, #03100f)",
    accent: "#35c3a4",
    jokerGlyph: "☠",
    Back: DavyBack,
  },
};

const THEME_STORAGE_KEY = "deck-theme";

const DeckThemeContext = createContext<{
  theme: DeckTheme;
  themeId: DeckThemeId;
  setThemeId: (id: DeckThemeId) => void;
}>({
  theme: DECK_THEMES.midnight,
  themeId: "midnight",
  setThemeId: () => {},
});

export function DeckThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState<DeckThemeId>(() => {
    if (typeof window === "undefined") return "midnight";
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored && stored in DECK_THEMES ? (stored as DeckThemeId) : "midnight";
  });

  const set = (id: DeckThemeId) => {
    setThemeId(id);
    localStorage.setItem(THEME_STORAGE_KEY, id);
  };

  return (
    <DeckThemeContext.Provider
      value={{ theme: DECK_THEMES[themeId], themeId, setThemeId: set }}
    >
      {children}
    </DeckThemeContext.Provider>
  );
}

export function useDeckTheme() {
  return useContext(DeckThemeContext);
}

/**
 * Ambient full-bleed decoration layered over the felt on mobile: stars for
 * Midnight, sun arcs for Retro, rising bubbles and light shafts for Davy
 * Jones. Purely decorative — pointer-events pass through.
 */
export function ThemeBackdrop() {
  const { themeId } = useDeckTheme();

  if (themeId === "midnight") {
    const stars = [
      [8, 12], [22, 6], [37, 15], [55, 8], [70, 13], [86, 7], [93, 18],
      [14, 26], [78, 28], [45, 4], [63, 22], [30, 30],
    ];
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {stars.map(([x, y], i) => (
          <span
            key={i}
            className="star-twinkle absolute rounded-full bg-[#aeb2ff]"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              width: i % 3 === 0 ? 3 : 2,
              height: i % 3 === 0 ? 3 : 2,
              animationDelay: `${(i * 0.7) % 4}s`,
            }}
          />
        ))}
      </div>
    );
  }

  if (themeId === "retro") {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute -top-10 -left-10 h-56 w-56 opacity-[0.14]"
        >
          {[46, 38, 30, 22, 14].map((r, i) => (
            <circle
              key={r}
              cx="0"
              cy="0"
              r={r}
              fill="none"
              stroke={i % 2 ? "#e08a33" : "#d9a743"}
              strokeWidth="7"
            />
          ))}
        </svg>
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute -right-10 -bottom-10 h-56 w-56 opacity-[0.12]"
        >
          {[46, 38, 30, 22, 14].map((r, i) => (
            <circle
              key={r}
              cx="100"
              cy="100"
              r={r}
              fill="none"
              stroke={i % 2 ? "#b5561f" : "#e08a33"}
              strokeWidth="7"
            />
          ))}
        </svg>
      </div>
    );
  }

  // davy
  const bubbles = [
    [12, 9, 14], [28, 6, 19], [47, 11, 9], [66, 7, 16], [84, 10, 12], [93, 5, 21],
  ];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-x-0 top-0 h-2/5 opacity-25"
        style={{
          background:
            "conic-gradient(from 195deg at 30% -10%, transparent 0deg, #2e9d8633 8deg, transparent 16deg, transparent 30deg, #2e9d8626 38deg, transparent 46deg)",
        }}
      />
      {bubbles.map(([x, size, dur], i) => (
        <span
          key={i}
          className="bubble-rise absolute rounded-full border border-[#7cf5d8]/30 bg-[#7cf5d8]/10"
          style={{
            left: `${x}%`,
            bottom: -12,
            width: size,
            height: size,
            animationDuration: `${dur}s`,
            animationDelay: `${(i * 2.3) % 7}s`,
          }}
        />
      ))}
    </div>
  );
}

export function DeckThemePicker() {
  const { themeId, setThemeId } = useDeckTheme();
  return (
    <div className="flex items-center gap-1.5">
      {Object.values(DECK_THEMES).map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => setThemeId(t.id)}
          title={`${t.label} — ${t.tagline}`}
          aria-pressed={themeId === t.id}
          className={`h-6 w-6 rounded-full border transition-transform hover:scale-110 ${
            themeId === t.id
              ? "border-zinc-200 ring-2 ring-zinc-400/40 scale-110"
              : "border-zinc-700"
          }`}
          style={{ background: t.swatch }}
        >
          <span className="sr-only">{t.label} deck</span>
        </button>
      ))}
    </div>
  );
}
