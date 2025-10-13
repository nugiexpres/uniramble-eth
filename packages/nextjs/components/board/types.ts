export interface PlayerState {
  id: string;
  position: number;
  balance: number;
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

export interface GameStats {
  totalPlayers: number;
  totalMoves: number;
  totalIngredientsBought: number;
}

export interface GameState {
  players: PlayerState[];
  tokenBalances: Record<string, TokenBalance>;
  actions: PlayerAction[];
  stats: GameStats;
}

export interface BoardContextType {
  gameState: GameState;
  loading: boolean;
  error?: Error;
}
