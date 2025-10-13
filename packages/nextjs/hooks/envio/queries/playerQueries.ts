/**
 * Player-related GraphQL queries for Envio
 * Centralized query definitions for better maintenance
 */

import { gql } from "graphql-request";

/**
 * Get player state by address
 */
export const GET_PLAYER_STATE = gql`
  query GetPlayerState($address: String!) {
    PlayerState(where: { id: { _eq: $address } }) {
      id
      position
      balance
      nftBalance
      lastUpdated
      tbaAddress
    }
  }
`;

/**
 * Get all players
 */
export const GET_ALL_PLAYERS = gql`
  query GetAllPlayers($limit: Int = 100, $offset: Int = 0) {
    PlayerState(limit: $limit, offset: $offset, order_by: { balance: desc }) {
      id
      position
      balance
      nftBalance
      lastUpdated
      tbaAddress
    }
  }
`;

/**
 * Get token balances for an address
 */
export const GET_TOKEN_BALANCES = gql`
  query GetTokenBalances($address: String!) {
    TokenBalances(where: { address: { _eq: $address } }) {
      id
      address
      token
      balance
      lastUpdated
    }
  }
`;

/**
 * Get player actions/history
 */
export const GET_PLAYER_ACTIONS = gql`
  query GetPlayerActions($player: String!, $limit: Int = 50) {
    PlayerAction(
      where: { player: { _eq: $player } }
      order_by: { timestamp: desc }
      limit: $limit
    ) {
      id
      player
      actionType
      timestamp
      data
      success
      txHash
    }
  }
`;

/**
 * Get game state
 */
export const GET_GAME_STATE = gql`
  query GetGameState {
    GameState(where: { id: { _eq: "GAME" } }) {
      id
      totalPlayers
      totalMoves
      totalIngredientsBought
      lastRollTimestamp
      lastFaucetTimestamp
    }
  }
`;

/**
 * Get FoodScramble events
 */
export const GET_FOOD_SCRAMBLE_EVENTS = gql`
  query GetFoodScrambleEvents($limit: Int = 100) {
    FoodScramble_PlayerMoved(order_by: { id: desc }, limit: $limit) {
      id
      player
      newPosition
    }
    FoodScramble_IngredientPurchased(order_by: { id: desc }, limit: $limit) {
      id
      player
      ingredientType
    }
  }
`;

/**
 * Get token transfers for an address
 */
export const GET_TOKEN_TRANSFERS = gql`
  query GetTokenTransfers($address: String!, $limit: Int = 50) {
    BreadToken_Transfer(
      where: { _or: [{ from: { _eq: $address } }, { to: { _eq: $address } }] }
      order_by: { id: desc }
      limit: $limit
    ) {
      id
      from
      to
      value
    }
    LettuceToken_Transfer(
      where: { _or: [{ from: { _eq: $address } }, { to: { _eq: $address } }] }
      order_by: { id: desc }
      limit: $limit
    ) {
      id
      from
      to
      value
    }
    MeatToken_Transfer(
      where: { _or: [{ from: { _eq: $address } }, { to: { _eq: $address } }] }
      order_by: { id: desc }
      limit: $limit
    ) {
      id
      from
      to
      value
    }
    TomatoToken_Transfer(
      where: { _or: [{ from: { _eq: $address } }, { to: { _eq: $address } }] }
      order_by: { id: desc }
      limit: $limit
    ) {
      id
      from
      to
      value
    }
  }
`;

