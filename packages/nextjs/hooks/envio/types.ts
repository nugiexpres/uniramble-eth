/**
 * Envio Query Response Types
 */

export interface PlayerState {
  id: string;
  position: number;
  balance: string;
  nftBalance: number;
  lastUpdated: string;
  tbaAddress?: string;
}

export interface TokenBalance {
  id: string;
  address: string;
  token: string;
  balance: string;
  lastUpdated: string;
}

export interface PlayerAction {
  id: string;
  player: string;
  actionType: string;
  timestamp: string;
  data: string;
  success: boolean;
  txHash: string;
}

export interface GameState {
  id: string;
  totalPlayers: number;
  totalMoves: number;
  totalIngredientsBought: number;
  lastRollTimestamp: string;
  lastFaucetTimestamp: string;
}

// Query response types
export interface PlayerStateResponse {
  PlayerState: PlayerState[];
}

export interface TokenBalancesResponse {
  TokenBalances: TokenBalance[];
}

export interface PlayerActionsResponse {
  PlayerAction: PlayerAction[];
}

export interface GameStateResponse {
  GameState: GameState[];
}

export interface AllPlayersResponse {
  PlayerState: PlayerState[];
}
