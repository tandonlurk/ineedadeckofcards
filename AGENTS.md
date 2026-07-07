<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Commit & attribution rules (security)

- **Never add AI co-author trailers to commits.** No `Co-Authored-By: Claude ...` (or any other AI/agent co-author line), no model identifiers, and no AI-attribution footers in commit messages, PR titles/bodies, or code comments.
- Keep commit messages focused on what changed and why.

# Project overview

A realtime shared deck-of-cards webapp: create a room, share a 5-digit code, and shuffle/deal/play cards together. State lives in Supabase (Postgres row per room + realtime broadcasts); all mutations go through the action API route and the pure reducer in `lib/roomState.ts`.

- `app/page.tsx` — landing page (create/join room)
- `app/room/[code]/page.tsx` — room UI (desktop and mobile layouts)
- `app/api/rooms/**` — room create/join/action routes (server, uses service-role key)
- `lib/roomState.ts` — room state shape + `applyAction` reducer (host-only checks live here)
- `lib/deck.ts` — card/deck primitives
- `components/` — UI: `Card` (themed, 3D flip), `DeckTheme` (theme defs + provider + backdrops), `Table`/`Seat`/`TableCard` (felt, seats, toss animation), `Deck`, `Hand`, `MobileRoom`, `Sideboard`, `ActionLog`
- Animations are plain CSS keyframes in `app/globals.css`

# Conventions & commands

- Tailwind CSS v4 (no config file; arbitrary values in class strings are fine).
- New-card entrance animations use the "derive from previous render state" pattern — the strict `react-hooks` lint rules forbid reading refs during render; keep it that way.
- Verify with: `npx tsc --noEmit && npm run lint && npm run build`. The build needs Supabase env vars; placeholders work for a local check:
  `NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder SUPABASE_SERVICE_ROLE_KEY=placeholder npm run build`
