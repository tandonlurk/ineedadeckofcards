# Testing stuff

How to try the new table UI locally before showing it off.

## Setup

1. Check out the branch and install:

   ```sh
   git fetch origin
   git checkout claude/multi-user-table-ui-tbjotr
   npm install
   ```

2. Make sure `.env.local` has the same Supabase keys the deployed app uses:

   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ```

3. Run it:

   ```sh
   npm run dev
   ```

   Open http://localhost:3000.

## Two-player session on one computer

1. Create a room in a normal browser window (you're the host/dealer).
2. Open an **incognito** window, go to the same URL, join with the 5-digit
   code and a different name. Incognito matters — sessions are stored per
   browser profile, so a normal second tab would reuse the host session.
3. Arrange the windows side by side and deal — every action should appear
   in both windows in realtime.

## Testing the mobile layout

Either shrink a browser window under **768px** wide (the room switches to
the mobile layout automatically), or use your actual phone:

```sh
npm run dev -- --hostname 0.0.0.0
```

Then on a phone connected to the same Wi-Fi, open
`http://<your-computer's-LAN-IP>:3000` (find the IP with `ipconfig` /
`ifconfig`). Host from the phone and join from the desktop, or vice versa.

## What to try

- **Themes**: the three circles in the header swap between Midnight, Retro,
  and Davy Jones — card backs, faces, felt, and backdrop all change. The
  choice is per-player (stored locally), so two players can use different
  decks.
- **Deck circle**: the deck starts as a small circle (left column on
  desktop, bottom-right on mobile). Click/tap it to expand the real
  controls; ✕ collapses it again.
- **Dealing (desktop)**: pick Face down / Face up / Blind, a count, and a
  target, then "To player" — or "Toss to table". Watch the cards fly from
  the deck and flip mid-settle when face up.
- **Dealing (mobile, as host)**: with the deck expanded — *tap* the deck to
  toss a card onto the felt, *drag* it onto a player's seat to deal to them
  (the seat glows while targeted), drag to a spot on the felt to deal
  there, or drag down onto your own hand area to deal to yourself.
- **Blind deals**: deal Blind to someone — their seat shows the card's face
  to everyone else, but on *their* screen it's a back with a “?” badge.
  Deal one to yourself to feel the difference. Playing the card to the
  table reveals it to everyone (including the holder).
- **Seat mini-cards**: face-up deals show under the player's seat for the
  whole table; face-down deals show backs; the count is the “(n)” next to
  the name.
- **Your hand**: desktop shows a row with per-card buttons; mobile fans the
  cards — tap one to raise it and get Play / face toggle / Return, or drag
  it straight onto the felt.
- **Table cards**: drag to move them, double-click/double-tap to flip.
- **Menu (mobile)**: the ⋯ button opens the sheet with chips, jokers, the
  activity log, host actions, and Leave.

## Build check (no Supabase needed)

```sh
npx tsc --noEmit && npm run lint
NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co \
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder \
SUPABASE_SERVICE_ROLE_KEY=placeholder npm run build
```

## Heads-up before posting publicly

Room state (including everyone's card faces) is broadcast to every client
and only hidden by the UI. Fine for friendly games, but someone determined
could peek via browser dev tools — worth knowing before promising truly
hidden cards. Server-side redaction would be the fix if it ever matters.
