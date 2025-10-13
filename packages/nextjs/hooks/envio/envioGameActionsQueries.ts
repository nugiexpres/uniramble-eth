import { gql } from "@apollo/client";

// ===== GAME ACTIONS QUERIES =====

// Get all game actions with real-time updates
export const GET_ALL_GAME_ACTIONS = gql`
  query GetAllGameActions($limit: Int = 50) {
    GameAction(order_by: { timestamp: desc }, limit: $limit) {
      id
      player
      tbaAddress
      actionType
      actionData
      position
      timestamp
      blockNumber
      transactionHash
      db_write_timestamp
    }
  }
`;

// Get game actions by player
export const GET_GAME_ACTIONS_BY_PLAYER = gql`
  query GetGameActionsByPlayer($player: String!, $limit: Int = 20) {
    GameAction(where: { player: { _eq: $player } }, order_by: { timestamp: desc }, limit: $limit) {
      id
      player
      tbaAddress
      actionType
      actionData
      position
      timestamp
      blockNumber
      transactionHash
      db_write_timestamp
    }
  }
`;

// Get game actions by TBA address
export const GET_GAME_ACTIONS_BY_TBA = gql`
  query GetGameActionsByTBA($tbaAddress: String!, $limit: Int = 20) {
    GameAction(where: { tbaAddress: { _eq: $tbaAddress } }, order_by: { timestamp: desc }, limit: $limit) {
      id
      player
      tbaAddress
      actionType
      actionData
      position
      timestamp
      blockNumber
      transactionHash
      db_write_timestamp
    }
  }
`;

// Get game actions by action type
export const GET_GAME_ACTIONS_BY_TYPE = gql`
  query GetGameActionsByType($actionType: String!, $limit: Int = 20) {
    GameAction(where: { actionType: { _eq: $actionType } }, order_by: { timestamp: desc }, limit: $limit) {
      id
      player
      tbaAddress
      actionType
      actionData
      position
      timestamp
      blockNumber
      transactionHash
      db_write_timestamp
    }
  }
`;

// ===== PLAYER STATS QUERIES =====

// Get all player stats
export const GET_ALL_PLAYER_STATS = gql`
  query GetAllPlayerStats {
    PlayerStats(order_by: { lastActionTimestamp: desc }) {
      id
      player
      tbaAddress
      totalRolls
      totalPurchases
      totalCooks
      totalFaucetClaims
      hamburgersOwned
      specialBoxesOwned
      lastAction
      lastActionTimestamp
      db_write_timestamp
    }
  }
`;

// Get player stats by player address
export const GET_PLAYER_STATS_BY_PLAYER = gql`
  query GetPlayerStatsByPlayer($player: String!) {
    PlayerStats(where: { player: { _eq: $player } }) {
      id
      player
      tbaAddress
      totalRolls
      totalPurchases
      totalCooks
      totalFaucetClaims
      hamburgersOwned
      specialBoxesOwned
      lastAction
      lastActionTimestamp
      db_write_timestamp
    }
  }
`;

// Get player stats by TBA address
export const GET_PLAYER_STATS_BY_TBA = gql`
  query GetPlayerStatsByTBA($tbaAddress: String!) {
    PlayerStats(where: { tbaAddress: { _eq: $tbaAddress } }) {
      id
      player
      tbaAddress
      totalRolls
      totalPurchases
      totalCooks
      totalFaucetClaims
      hamburgersOwned
      specialBoxesOwned
      lastAction
      lastActionTimestamp
      db_write_timestamp
    }
  }
`;

// ===== REAL-TIME SUBSCRIPTIONS =====

// Subscribe to all game actions
export const GAME_ACTIONS_SUBSCRIPTION = gql`
  subscription GameActionsSubscription {
    GameAction(order_by: { timestamp: desc }, limit: 10) {
      id
      player
      tbaAddress
      actionType
      actionData
      position
      timestamp
      blockNumber
      transactionHash
      db_write_timestamp
    }
  }
`;

// Subscribe to game actions by player
export const PLAYER_GAME_ACTIONS_SUBSCRIPTION = gql`
  subscription PlayerGameActionsSubscription($player: String!) {
    GameAction(where: { player: { _eq: $player } }, order_by: { timestamp: desc }, limit: 10) {
      id
      player
      tbaAddress
      actionType
      actionData
      position
      timestamp
      blockNumber
      transactionHash
      db_write_timestamp
    }
  }
`;

// Subscribe to player stats updates
export const PLAYER_STATS_SUBSCRIPTION = gql`
  subscription PlayerStatsSubscription {
    PlayerStats(order_by: { lastActionTimestamp: desc }, limit: 20) {
      id
      player
      tbaAddress
      totalRolls
      totalPurchases
      totalCooks
      totalFaucetClaims
      hamburgersOwned
      specialBoxesOwned
      lastAction
      lastActionTimestamp
      db_write_timestamp
    }
  }
`;

// ===== SPECIFIC ACTION TYPE QUERIES =====

// Get roll actions
export const GET_ROLL_ACTIONS = gql`
  query GetRollActions($limit: Int = 20) {
    GameAction(where: { actionType: { _eq: "roll" } }, order_by: { timestamp: desc }, limit: $limit) {
      id
      player
      tbaAddress
      actionType
      actionData
      position
      timestamp
      blockNumber
      transactionHash
      db_write_timestamp
    }
  }
`;

// Get buy actions
export const GET_BUY_ACTIONS = gql`
  query GetBuyActions($limit: Int = 20) {
    GameAction(where: { actionType: { _eq: "buy" } }, order_by: { timestamp: desc }, limit: $limit) {
      id
      player
      tbaAddress
      actionType
      actionData
      position
      timestamp
      blockNumber
      transactionHash
      db_write_timestamp
    }
  }
`;

// Get cook actions
export const GET_COOK_ACTIONS = gql`
  query GetCookActions($limit: Int = 20) {
    GameAction(where: { actionType: { _eq: "cook" } }, order_by: { timestamp: desc }, limit: $limit) {
      id
      player
      tbaAddress
      actionType
      actionData
      position
      timestamp
      blockNumber
      transactionHash
      db_write_timestamp
    }
  }
`;

// Get faucet actions
export const GET_FAUCET_ACTIONS = gql`
  query GetFaucetActions($limit: Int = 20) {
    GameAction(where: { actionType: { _eq: "faucet" } }, order_by: { timestamp: desc }, limit: $limit) {
      id
      player
      tbaAddress
      actionType
      actionData
      position
      timestamp
      blockNumber
      transactionHash
      db_write_timestamp
    }
  }
`;

// Get rail actions
export const GET_RAIL_ACTIONS = gql`
  query GetRailActions($limit: Int = 20) {
    GameAction(where: { actionType: { _eq: "rail" } }, order_by: { timestamp: desc }, limit: $limit) {
      id
      player
      tbaAddress
      actionType
      actionData
      position
      timestamp
      blockNumber
      transactionHash
      db_write_timestamp
    }
  }
`;
