/**
 * Game Event Emitter
 * Central system to emit game events to EnvioAnalytics
 * All board actions should use this to ensure fast event display
 */

export type GameEventType =
  | "movement"
  | "purchase"
  | "mint"
  | "rail"
  | "faucet"
  | "tba"
  | "cook"
  | "sendNative"
  | "mintNFT"
  | "createSmartAccount";

export interface GameEventData {
  type: GameEventType;
  player?: string;
  tbaAddress?: string;
  data?: Record<string, any>;
  optimisticKey?: string;
}

/**
 * Emit game event to EnvioAnalytics component
 * This creates an optimistic UI update before Envio indexes the blockchain event
 */
export const emitGameEvent = (eventData: GameEventData) => {
  if (typeof window === "undefined") return;

  const event = new CustomEvent("localGameAction", {
    detail: {
      id: `local_${Date.now()}_${Math.random()}`,
      type: eventData.type,
      player: eventData.player || "",
      tbaAddress: eventData.tbaAddress || eventData.player || "",
      data: eventData.data || {},
      timestamp: Date.now(),
      db_write_timestamp: new Date().toISOString(),
      optimistic: true,
      optimisticKey: eventData.optimisticKey || `${eventData.type}:${eventData.player}:${Date.now()}`,
    },
  });

  window.dispatchEvent(event);
  console.log("🎮 Game event emitted:", eventData.type, eventData);
};

/**
 * Shorthand emitters for common actions
 */
export const emitRollEvent = (player: string, newPosition: number) => {
  emitGameEvent({
    type: "movement",
    player,
    tbaAddress: player,
    data: { position: newPosition, action: "roll" },
    optimisticKey: `roll:${player}:${Date.now()}`,
  });
};

export const emitRailEvent = (player: string, newPosition: number) => {
  emitGameEvent({
    type: "rail",
    player,
    tbaAddress: player,
    data: { position: newPosition, action: "rail" },
    optimisticKey: `rail:${player}:${Date.now()}`,
  });
};

export const emitBuyEvent = (player: string, ingredientType: number, fee: number) => {
  emitGameEvent({
    type: "purchase",
    player,
    tbaAddress: player,
    data: { ingredientType, fee },
    optimisticKey: `buy:${player}:${Date.now()}`,
  });
};

export const emitFaucetEvent = (player: string, amount: string) => {
  emitGameEvent({
    type: "faucet",
    player,
    tbaAddress: player,
    data: { amount },
    optimisticKey: `faucet:${player}:${Date.now()}`,
  });
};

export const emitCookEvent = (player: string, hamburgerCount: number) => {
  emitGameEvent({
    type: "cook",
    player,
    tbaAddress: player,
    data: { hamburgerCount },
    optimisticKey: `cook:${player}:${Date.now()}`,
  });
};

export const emitMintNFTEvent = (player: string, smartAccount: string) => {
  emitGameEvent({
    type: "mintNFT",
    player: smartAccount,
    tbaAddress: smartAccount,
    data: { to: smartAccount },
    optimisticKey: `mintNFT:${smartAccount}:${Date.now()}`,
  });
};

export const emitCreateTBAEvent = (player: string, tbaAddress: string, tokenId: string) => {
  emitGameEvent({
    type: "tba",
    player,
    tbaAddress,
    data: { tokenId },
    optimisticKey: `tba:${player}:${tbaAddress}`,
  });
};

export const emitSendNativeEvent = (from: string, to: string, amount: string) => {
  emitGameEvent({
    type: "sendNative",
    player: from,
    tbaAddress: to,
    data: { from, to, amount },
    optimisticKey: `send:${from}:${to}:${Date.now()}`,
  });
};

export const emitCreateSmartAccountEvent = (player: string, smartAccount: string) => {
  emitGameEvent({
    type: "createSmartAccount",
    player,
    tbaAddress: smartAccount,
    data: { smartAccount },
    optimisticKey: `smartAccount:${player}`,
  });
};
