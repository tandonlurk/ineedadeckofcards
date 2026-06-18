export type RoomSession = {
  code: string;
  playerId: string;
  name: string;
  hostToken?: string;
};

function key(code: string) {
  return `deckofcards:room:${code}`;
}

export function saveSession(session: RoomSession) {
  localStorage.setItem(key(session.code), JSON.stringify(session));
}

export function loadSession(code: string): RoomSession | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(key(code));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as RoomSession;
  } catch {
    return null;
  }
}

export function clearSession(code: string) {
  localStorage.removeItem(key(code));
}
