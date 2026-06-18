import { buildDeck, buildJokers, shuffle, type Card } from "./deck";

export type TableCard = Card & { x: number; y: number; z: number };

export type Player = {
  id: string;
  name: string;
  isHost: boolean;
  hand: Card[];
};

export type ChipStack = {
  color: "white" | "red" | "blue" | "green" | "black";
  value: number;
  count: number;
};

export type LogEntry = { ts: number; text: string };

export type RoomState = {
  deck: Card[];
  players: Record<string, Player>;
  table: TableCard[];
  sideboard: { jokers: Card[]; chips: ChipStack[] };
  turnLog: LogEntry[];
  nextZ: number;
};

const MAX_LOG = 50;

export function createInitialState(hostId: string, hostName: string): RoomState {
  return {
    deck: shuffle(buildDeck()),
    players: {
      [hostId]: { id: hostId, name: hostName, isHost: true, hand: [] },
    },
    table: [],
    sideboard: {
      jokers: buildJokers(),
      chips: [
        { color: "white", value: 1, count: 20 },
        { color: "red", value: 5, count: 20 },
        { color: "blue", value: 10, count: 20 },
        { color: "green", value: 25, count: 10 },
        { color: "black", value: 100, count: 10 },
      ],
    },
    turnLog: [],
    nextZ: 1,
  };
}

function log(state: RoomState, text: string) {
  state.turnLog.push({ ts: Date.now(), text });
  if (state.turnLog.length > MAX_LOG) state.turnLog.shift();
}

function toDeckCard(tableCard: TableCard): Card {
  return {
    id: tableCard.id,
    rank: tableCard.rank,
    suit: tableCard.suit,
    faceUp: false,
  };
}

export type ActionType =
  | { type: "join"; playerId: string; payload: { name: string } }
  | { type: "shuffle"; playerId: string }
  | {
      type: "deal";
      playerId: string;
      payload: { targetPlayerId: string; count: number; faceUp: boolean };
    }
  | {
      type: "dealToTable";
      playerId: string;
      payload: { count: number; faceUp: boolean; x: number; y: number };
    }
  | {
      type: "playToTable";
      playerId: string;
      payload: { cardId: string; faceUp: boolean; x: number; y: number };
    }
  | {
      type: "moveOnTable";
      playerId: string;
      payload: { cardId: string; x: number; y: number };
    }
  | { type: "flipTableCard"; playerId: string; payload: { cardId: string } }
  | { type: "returnToDeck"; playerId: string; payload: { cardId: string } }
  | { type: "returnAllToDeck"; playerId: string };

export class ActionError extends Error {}

export function applyAction(
  state: RoomState,
  action: ActionType,
  isHost: boolean
): RoomState {
  const player = state.players[action.playerId];
  if (!player) throw new ActionError("Unknown player");

  switch (action.type) {
    case "join": {
      // handled separately in join route; no-op here
      return state;
    }

    case "shuffle": {
      if (!isHost) throw new ActionError("Only the host can shuffle");
      if (state.deck.length !== 52) {
        throw new ActionError(
          "All cards must be returned to the deck before shuffling"
        );
      }
      state.deck = shuffle(state.deck);
      log(state, `${player.name} shuffled the deck`);
      return state;
    }

    case "deal": {
      if (!isHost) throw new ActionError("Only the host can deal");
      const { targetPlayerId, count, faceUp } = action.payload;
      const target = state.players[targetPlayerId];
      if (!target) throw new ActionError("Unknown target player");
      if (count < 1 || count > state.deck.length) {
        throw new ActionError("Not enough cards left in the deck");
      }
      for (let i = 0; i < count; i++) {
        const card = state.deck.shift();
        if (!card) break;
        card.faceUp = faceUp;
        target.hand.push(card);
      }
      log(
        state,
        `${player.name} dealt ${count} card${count > 1 ? "s" : ""} ${
          faceUp ? "face up" : "face down"
        } to ${target.name}`
      );
      return state;
    }

    case "dealToTable": {
      if (!isHost) throw new ActionError("Only the host can deal to the table");
      const { count, faceUp, x, y } = action.payload;
      if (count < 1 || count > state.deck.length) {
        throw new ActionError("Not enough cards left in the deck");
      }
      for (let i = 0; i < count; i++) {
        const card = state.deck.shift();
        if (!card) break;
        card.faceUp = faceUp;
        state.table.push({
          ...card,
          x: x + i * 3,
          y: y + i * 3,
          z: state.nextZ++,
        });
      }
      log(
        state,
        `${player.name} dealt ${count} card${count > 1 ? "s" : ""} ${
          faceUp ? "face up" : "face down"
        } to the table`
      );
      return state;
    }

    case "playToTable": {
      const { cardId, faceUp, x, y } = action.payload;
      const idx = player.hand.findIndex((c) => c.id === cardId);
      if (idx === -1) throw new ActionError("Card not in your hand");
      const [card] = player.hand.splice(idx, 1);
      card.faceUp = faceUp;
      state.table.push({ ...card, x, y, z: state.nextZ++ });
      log(state, `${player.name} played a card to the table`);
      return state;
    }

    case "moveOnTable": {
      const { cardId, x, y } = action.payload;
      const card = state.table.find((c) => c.id === cardId);
      if (!card) throw new ActionError("Card not on table");
      card.x = x;
      card.y = y;
      card.z = state.nextZ++;
      return state;
    }

    case "flipTableCard": {
      const { cardId } = action.payload;
      const card = state.table.find((c) => c.id === cardId);
      if (!card) throw new ActionError("Card not on table");
      card.faceUp = !card.faceUp;
      return state;
    }

    case "returnToDeck": {
      const { cardId } = action.payload;
      const handIdx = player.hand.findIndex((c) => c.id === cardId);
      if (handIdx !== -1) {
        const [card] = player.hand.splice(handIdx, 1);
        card.faceUp = false;
        state.deck.unshift(card);
        log(state, `${player.name} returned a card to the deck`);
        return state;
      }
      const tableIdx = state.table.findIndex((c) => c.id === cardId);
      if (tableIdx !== -1) {
        if (!isHost) throw new ActionError("Only the host can return table cards");
        const [card] = state.table.splice(tableIdx, 1);
        state.deck.unshift(toDeckCard(card));
        log(state, `${player.name} returned a table card to the deck`);
        return state;
      }
      throw new ActionError("Card not found");
    }

    case "returnAllToDeck": {
      if (!isHost) throw new ActionError("Only the host can do this");
      for (const p of Object.values(state.players)) {
        for (const card of p.hand) {
          card.faceUp = false;
          state.deck.unshift(card);
        }
        p.hand = [];
      }
      for (const card of state.table) {
        state.deck.unshift(toDeckCard(card));
      }
      state.table = [];
      log(state, `${player.name} returned all cards to the deck`);
      return state;
    }

    default:
      throw new ActionError("Unknown action");
  }
}
