import { gql } from "@apollo/client";

// Player Position Queries
export const GET_PLAYER_POSITIONS = gql`
  query GetPlayerPositions {
    FoodScramble_PlayerMoved {
      id
      player
      newPosition
      roll
      db_write_timestamp
    }
  }
`;

export const GET_PLAYER_POSITION_BY_ADDRESS = gql`
  query GetPlayerPositionByAddress($player: String!) {
    FoodScramble_PlayerMoved(where: { player: { _eq: $player } }) {
      id
      player
      newPosition
      roll
      db_write_timestamp
    }
  }
`;

// Player Creation Queries
export const GET_PLAYER_CREATIONS = gql`
  query GetPlayerCreations {
    FoodScramble_PlayerCreated {
      id
      tba
      gridIndex
      db_write_timestamp
    }
  }
`;

// TBA Queries (using FoodScramble_TokenBoundAccountCreated events)
export const GET_ALL_TBA_CREATIONS = gql`
  query GetAllTBACreations {
    FoodScramble_TokenBoundAccountCreated {
      id
      eoa
      tba
      startPosition
      db_write_timestamp
    }
  }
`;

export const GET_TBAS_BY_EOA = gql`
  query GetTBAsByEOA($eoa: String!) {
    FoodScramble_TokenBoundAccountCreated(where: { eoa: { _eq: $eoa } }) {
      id
      eoa
      tba
      startPosition
      db_write_timestamp
    }
  }
`;

// Ingredient Purchase Queries
export const GET_INGREDIENT_PURCHASES = gql`
  query GetIngredientPurchases($player: String!) {
    FoodScramble_IngredientPurchased(where: { player: { _eq: $player } }) {
      id
      player
      ingredientType
      position
      db_write_timestamp
    }
  }
`;

export const GET_ALL_INGREDIENT_PURCHASES = gql`
  query GetAllIngredientPurchases {
    FoodScramble_IngredientPurchased {
      id
      player
      ingredientType
      position
      db_write_timestamp
    }
  }
`;

// Special Box Minting Queries
export const GET_SPECIAL_BOX_MINTS = gql`
  query GetSpecialBoxMints($user: String!) {
    FoodScramble_SpecialBoxMinted(where: { user: { _eq: $user } }) {
      id
      user
      hamburgerCount
      db_write_timestamp
    }
  }
`;

export const GET_ALL_SPECIAL_BOX_MINTS = gql`
  query GetAllSpecialBoxMints {
    FoodScramble_SpecialBoxMinted {
      id
      user
      hamburgerCount
      db_write_timestamp
    }
  }
`;

// Faucet events
export const GET_ALL_FAUCET_EVENTS = gql`
  query GetAllFaucetEvents {
    FaucetMon_BalanceWithdrawn {
      id
      owner
      amount
      db_write_timestamp
    }
  }
`;

// Token Transfer Queries
export const GET_BREAD_TRANSFERS = gql`
  query GetBreadTransfers($to: String!) {
    BreadToken_Transfer(where: { to: { _eq: $to } }) {
      id
      from
      to
      value
      db_write_timestamp
    }
  }
`;

export const GET_MEAT_TRANSFERS = gql`
  query GetMeatTransfers($to: String!) {
    MeatToken_Transfer(where: { to: { _eq: $to } }) {
      id
      from
      to
      value
      db_write_timestamp
    }
  }
`;

export const GET_LETTUCE_TRANSFERS = gql`
  query GetLettuceTransfers($to: String!) {
    LettuceToken_Transfer(where: { to: { _eq: $to } }) {
      id
      from
      to
      value
      db_write_timestamp
    }
  }
`;

export const GET_TOMATO_TRANSFERS = gql`
  query GetTomatoTransfers($to: String!) {
    TomatoToken_Transfer(where: { to: { _eq: $to } }) {
      id
      from
      to
      value
      db_write_timestamp
    }
  }
`;

// Real-time Subscriptions
export const PLAYER_MOVEMENT_SUBSCRIPTION = gql`
  subscription PlayerMovementSubscription {
    FoodScramble_PlayerMoved {
      id
      player
      newPosition
      roll
      db_write_timestamp
    }
  }
`;

export const INGREDIENT_PURCHASE_SUBSCRIPTION = gql`
  subscription IngredientPurchaseSubscription($player: String!) {
    FoodScramble_IngredientPurchased(where: { player: { _eq: $player } }) {
      id
      player
      ingredientType
      position
      db_write_timestamp
    }
  }
`;

// Real-time subscriptions for instant updates (no polling needed!)
export const PLAYER_MOVED_SUBSCRIPTION = gql`
  subscription PlayerMovedSubscription {
    FoodScramble_PlayerMoved(order_by: { db_write_timestamp: desc }, limit: 50) {
      id
      player
      newPosition
      roll
      db_write_timestamp
    }
  }
`;

export const RAIL_TRAVELED_SUBSCRIPTION = gql`
  subscription RailTraveledSubscription {
    FoodScramble_RailTraveled(order_by: { db_write_timestamp: desc }, limit: 10) {
      id
      player
      fromPosition
      toPosition
      db_write_timestamp
    }
  }
`;

export const HAMBURGER_MINTED_SUBSCRIPTION = gql`
  subscription HamburgerMintedSubscription {
    FoodScramble_HamburgerMinted(order_by: { db_write_timestamp: desc }, limit: 10) {
      id
      player
      tokenId
      db_write_timestamp
    }
  }
`;

export const FAUCET_USED_SUBSCRIPTION = gql`
  subscription FaucetUsedSubscription {
    FaucetMon_FaucetUsed(order_by: { db_write_timestamp: desc }, limit: 10) {
      id
      recipient
      amount
      db_write_timestamp
    }
  }
`;

export const ALL_PURCHASES_SUBSCRIPTION = gql`
  subscription AllPurchasesSubscription {
    FoodScramble_IngredientPurchased(order_by: { db_write_timestamp: desc }, limit: 50) {
      id
      player
      ingredientType
      position
      db_write_timestamp
    }
  }
`;

// Rail Travel Events
export const GET_ALL_RAIL_EVENTS = gql`
  query GetAllRailEvents {
    FoodScramble_RailTraveled {
      id
      player
      fromPosition
      toPosition
      db_write_timestamp
    }
  }
`;

// Hamburger/Cook Events
export const GET_ALL_HAMBURGER_MINTS = gql`
  query GetAllHamburgerMints {
    FoodScramble_HamburgerMinted {
      id
      player
      tokenId
      db_write_timestamp
    }
  }
`;

// Faucet Used Events (actual faucet usage, not withdrawal)
export const GET_ALL_FAUCET_USED_EVENTS = gql`
  query GetAllFaucetUsedEvents {
    FaucetMon_FaucetUsed {
      id
      recipient
      amount
      db_write_timestamp
    }
  }
`;

// FoodNFT Transfer Events - untuk tracking NFT ownership
// Query ini mengambil SEMUA transfer untuk tokenId yang pernah dimiliki owner
// Kemudian di client-side kita filter untuk cek ownership terakhir
export const GET_NFTS_BY_OWNER = gql`
  query GetNFTsByOwner($owner: String!) {
    FoodNFT_Transfer(
      where: { _or: [{ to: { _eq: $owner } }, { from: { _eq: $owner } }] }
      order_by: { db_write_timestamp: asc }
    ) {
      id
      from
      to
      tokenId
      db_write_timestamp
    }
  }
`;

// Alternative query: Get ALL transfers globally, then filter client-side
// This is more comprehensive but returns more data
export const GET_ALL_TRANSFERS_FOR_TOKENS = gql`
  query GetAllTransfersForTokens($tokenIds: [String!]!) {
    FoodNFT_Transfer(where: { tokenId: { _in: $tokenIds } }, order_by: { db_write_timestamp: asc }) {
      id
      from
      to
      tokenId
      db_write_timestamp
    }
  }
`;

// Get all NFT transfers untuk tracking global
export const GET_ALL_NFT_TRANSFERS = gql`
  query GetAllNFTTransfers {
    FoodNFT_Transfer(order_by: { db_write_timestamp: desc }, limit: 100) {
      id
      from
      to
      tokenId
      db_write_timestamp
    }
  }
`;

// Real-time subscription untuk NFT transfers
export const NFT_TRANSFER_SUBSCRIPTION = gql`
  subscription NFTTransferSubscription {
    FoodNFT_Transfer(order_by: { db_write_timestamp: desc }, limit: 20) {
      id
      from
      to
      tokenId
      db_write_timestamp
    }
  }
`;
