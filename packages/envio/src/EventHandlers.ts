/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 * This file is auto-generated from scaffold-eth contracts
 */
import {
  BasicCaveatEnforcer,
  BasicCaveatEnforcer_FunctionAllowed,
  BasicCaveatEnforcer_GameActionLimitSet,
  BasicCaveatEnforcer_OwnershipTransferred,
  BasicCaveatEnforcer_RateLimitSet,
  BasicCaveatEnforcer_SpendingLimitSet,
  BasicCaveatEnforcer_TargetAddressesSet,
  BasicCaveatEnforcer_TargetAllowed,
  BasicCaveatEnforcer_TimeLimitSet,
  BreadToken,
  BreadToken_Approval,
  BreadToken_OwnershipTransferred,
  BreadToken_Transfer,
  CaveatEnforcerHub,
  CaveatEnforcerHub_DefaultEnforcerSet,
  CaveatEnforcerHub_EnforcerAdded,
  CaveatEnforcerHub_EnforcerAfterHookFailed,
  CaveatEnforcerHub_EnforcerEnabled,
  CaveatEnforcerHub_EnforcerRemoved,
  CaveatEnforcerHub_OwnershipTransferred,
  ERC6551Account,
  ERC6551Account_NFTReceived,
  ERC6551Account_Withdraw,
  ERC6551Registry,
  ERC6551Registry_AccountCreated,
  FaucetMon,
  FaucetMon_BalanceFunded,
  FaucetMon_BalanceWithdrawn,
  FaucetMon_FaucetUsed,
  FinancialCaveatEnforcer,
  FinancialCaveatEnforcer_OwnershipTransferred,
  FinancialCaveatEnforcer_SpendingLimitSet,
  FinancialCaveatEnforcer_TimeLimitSet,
  FinancialCaveatEnforcer_TokenSpent,
  FinancialCaveatEnforcer_TokenWhitelistSet,
  FinancialCaveatEnforcer_TransferLimitSet,
  FoodNFT,
  FoodNFT_Approval,
  FoodNFT_ApprovalForAll,
  FoodNFT_BatchMetadataUpdate,
  FoodNFT_FoodBurned,
  FoodNFT_MetadataUpdate,
  FoodNFT_MintPriceUpdated,
  FoodNFT_OwnershipTransferred,
  FoodNFT_Transfer,
  FoodScramble,
  FoodScramble_FaucetAmountUpdated,
  FoodScramble_FaucetCooldownUpdated,
  FoodScramble_HamburgerMinted,
  FoodScramble_IngredientPurchased,
  FoodScramble_PlayerCreated,
  FoodScramble_PlayerMoved,
  FoodScramble_RailTraveled,
  FoodScramble_TokenBoundAccountCreated,
  GameCaveatEnforcer,
  GameCaveatEnforcer_FunctionAllowed,
  GameCaveatEnforcer_GameActionAllowed,
  GameCaveatEnforcer_GameActionLimitSet,
  GameCaveatEnforcer_GameStateSet,
  GameCaveatEnforcer_OwnershipTransferred,
  GameCaveatEnforcer_RateLimitSet,
  GameCaveatEnforcer_TargetAddressesSet,
  LettuceToken,
  LettuceToken_Approval,
  LettuceToken_OwnershipTransferred,
  LettuceToken_Transfer,
  MeatToken,
  MeatToken_Approval,
  MeatToken_OwnershipTransferred,
  MeatToken_Transfer,
  PaymentGateway,
  PaymentGateway_ERC20PaymentReceived,
  PaymentGateway_ERC20Withdrawn,
  PaymentGateway_NativePaymentReceived,
  PaymentGateway_OwnershipTransferred,
  PaymentGateway_Withdrawn,
  RewardPool,
  RewardPool_DistributorUpdated,
  RewardPool_FundsDeposited,
  RewardPool_OwnershipTransferred,
  RewardPool_RewardDistributed,
  SpiceToken,
  SpiceToken_Approval,
  SpiceToken_Transfer,
  TomatoToken,
  TomatoToken_Approval,
  TomatoToken_OwnershipTransferred,
  TomatoToken_Transfer,
} from "generated";

BasicCaveatEnforcer.FunctionAllowed.handler(async ({ event, context }) => {
  const entity: BasicCaveatEnforcer_FunctionAllowed = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    delegationHash: event.params.delegationHash,
    functionSelector: event.params.functionSelector,
    allowed: event.params.allowed,
  };

  context.BasicCaveatEnforcer_FunctionAllowed.set(entity);
});

BasicCaveatEnforcer.GameActionLimitSet.handler(async ({ event, context }) => {
  const entity: BasicCaveatEnforcer_GameActionLimitSet = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    delegationHash: event.params.delegationHash,
    maxRolls: event.params.maxRolls,
    maxBuys: event.params.maxBuys,
    maxRails: event.params.maxRails,
    maxFaucets: event.params.maxFaucets,
    maxCooks: event.params.maxCooks,
    validUntil: event.params.validUntil,
  };

  context.BasicCaveatEnforcer_GameActionLimitSet.set(entity);
});

BasicCaveatEnforcer.OwnershipTransferred.handler(async ({ event, context }) => {
  const entity: BasicCaveatEnforcer_OwnershipTransferred = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    previousOwner: event.params.previousOwner,
    newOwner: event.params.newOwner,
  };

  context.BasicCaveatEnforcer_OwnershipTransferred.set(entity);
});

BasicCaveatEnforcer.RateLimitSet.handler(async ({ event, context }) => {
  const entity: BasicCaveatEnforcer_RateLimitSet = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    delegationHash: event.params.delegationHash,
    maxCallsPerHour: event.params.maxCallsPerHour,
  };

  context.BasicCaveatEnforcer_RateLimitSet.set(entity);
});

BasicCaveatEnforcer.SpendingLimitSet.handler(async ({ event, context }) => {
  const entity: BasicCaveatEnforcer_SpendingLimitSet = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    delegationHash: event.params.delegationHash,
    token: event.params.token,
    maxAmount: event.params.maxAmount,
    validUntil: event.params.validUntil,
  };

  context.BasicCaveatEnforcer_SpendingLimitSet.set(entity);
});

BasicCaveatEnforcer.TargetAddressesSet.handler(async ({ event, context }) => {
  const entity: BasicCaveatEnforcer_TargetAddressesSet = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    delegationHash: event.params.delegationHash,
    targets: event.params.targets,
  };

  context.BasicCaveatEnforcer_TargetAddressesSet.set(entity);
});

BasicCaveatEnforcer.TargetAllowed.handler(async ({ event, context }) => {
  const entity: BasicCaveatEnforcer_TargetAllowed = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    delegationHash: event.params.delegationHash,
    target: event.params.target,
  };

  context.BasicCaveatEnforcer_TargetAllowed.set(entity);
});

BasicCaveatEnforcer.TimeLimitSet.handler(async ({ event, context }) => {
  const entity: BasicCaveatEnforcer_TimeLimitSet = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    delegationHash: event.params.delegationHash,
    validUntil: event.params.validUntil,
  };

  context.BasicCaveatEnforcer_TimeLimitSet.set(entity);
});

BreadToken.Approval.handler(async ({ event, context }) => {
  const entity: BreadToken_Approval = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    owner: event.params.owner,
    spender: event.params.spender,
    value: event.params.value,
  };

  context.BreadToken_Approval.set(entity);
});

BreadToken.OwnershipTransferred.handler(async ({ event, context }) => {
  const entity: BreadToken_OwnershipTransferred = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    previousOwner: event.params.previousOwner,
    newOwner: event.params.newOwner,
  };

  context.BreadToken_OwnershipTransferred.set(entity);
});

BreadToken.Transfer.handler(async ({ event, context }) => {
  const entity: BreadToken_Transfer = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    from: event.params.from,
    to: event.params.to,
    value: event.params.value,
  };

  context.BreadToken_Transfer.set(entity);
});

CaveatEnforcerHub.DefaultEnforcerSet.handler(async ({ event, context }) => {
  const entity: CaveatEnforcerHub_DefaultEnforcerSet = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    enforcerType: event.params.enforcerType,
    enforcer: event.params.enforcer,
  };

  context.CaveatEnforcerHub_DefaultEnforcerSet.set(entity);
});

CaveatEnforcerHub.EnforcerAdded.handler(async ({ event, context }) => {
  const entity: CaveatEnforcerHub_EnforcerAdded = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    delegationHash: event.params.delegationHash,
    enforcer: event.params.enforcer,
  };

  context.CaveatEnforcerHub_EnforcerAdded.set(entity);
});

CaveatEnforcerHub.EnforcerAfterHookFailed.handler(async ({ event, context }) => {
  const entity: CaveatEnforcerHub_EnforcerAfterHookFailed = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    enforcer: event.params.enforcer,
    delegationHash: event.params.delegationHash,
    reason: event.params.reason,
  };

  context.CaveatEnforcerHub_EnforcerAfterHookFailed.set(entity);
});

CaveatEnforcerHub.EnforcerEnabled.handler(async ({ event, context }) => {
  const entity: CaveatEnforcerHub_EnforcerEnabled = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    enforcer: event.params.enforcer,
    enabled: event.params.enabled,
  };

  context.CaveatEnforcerHub_EnforcerEnabled.set(entity);
});

CaveatEnforcerHub.EnforcerRemoved.handler(async ({ event, context }) => {
  const entity: CaveatEnforcerHub_EnforcerRemoved = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    delegationHash: event.params.delegationHash,
    enforcer: event.params.enforcer,
  };

  context.CaveatEnforcerHub_EnforcerRemoved.set(entity);
});

CaveatEnforcerHub.OwnershipTransferred.handler(async ({ event, context }) => {
  const entity: CaveatEnforcerHub_OwnershipTransferred = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    previousOwner: event.params.previousOwner,
    newOwner: event.params.newOwner,
  };

  context.CaveatEnforcerHub_OwnershipTransferred.set(entity);
});

ERC6551Account.NFTReceived.handler(async ({ event, context }) => {
  const entity: ERC6551Account_NFTReceived = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    operator: event.params.operator,
    from: event.params.from,
    tokenId: event.params.tokenId,
    data: event.params.data,
  };

  context.ERC6551Account_NFTReceived.set(entity);
});

ERC6551Account.Withdraw.handler(async ({ event, context }) => {
  const entity: ERC6551Account_Withdraw = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    owner: event.params.owner,
    amount: event.params.amount,
  };

  context.ERC6551Account_Withdraw.set(entity);
});

ERC6551Registry.AccountCreated.handler(async ({ event, context }) => {
  const entity: ERC6551Registry_AccountCreated = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    account: event.params.account,
    implementation: event.params.implementation,
    chainId: event.params.chainId,
    tokenContract: event.params.tokenContract,
    tokenId: event.params.tokenId,
    salt: event.params.salt,
  };

  context.ERC6551Registry_AccountCreated.set(entity);
});

FaucetMon.BalanceFunded.handler(async ({ event, context }) => {
  const entity: FaucetMon_BalanceFunded = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    funder: event.params.funder,
    amount: event.params.amount,
  };

  context.FaucetMon_BalanceFunded.set(entity);
});

FaucetMon.BalanceWithdrawn.handler(async ({ event, context }) => {
  const entity: FaucetMon_BalanceWithdrawn = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    owner: event.params.owner,
    amount: event.params.amount,
  };

  context.FaucetMon_BalanceWithdrawn.set(entity);
});

FaucetMon.FaucetUsed.handler(async ({ event, context }) => {
  const entity: FaucetMon_FaucetUsed = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    recipient: event.params.recipient,
    amount: event.params.amount,
  };

  context.FaucetMon_FaucetUsed.set(entity);
});

FinancialCaveatEnforcer.OwnershipTransferred.handler(async ({ event, context }) => {
  const entity: FinancialCaveatEnforcer_OwnershipTransferred = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    previousOwner: event.params.previousOwner,
    newOwner: event.params.newOwner,
  };

  context.FinancialCaveatEnforcer_OwnershipTransferred.set(entity);
});

FinancialCaveatEnforcer.SpendingLimitSet.handler(async ({ event, context }) => {
  const entity: FinancialCaveatEnforcer_SpendingLimitSet = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    delegationHash: event.params.delegationHash,
    token: event.params.token,
    maxAmount: event.params.maxAmount,
    validUntil: event.params.validUntil,
    periodLength: event.params.periodLength,
  };

  context.FinancialCaveatEnforcer_SpendingLimitSet.set(entity);
});

FinancialCaveatEnforcer.TimeLimitSet.handler(async ({ event, context }) => {
  const entity: FinancialCaveatEnforcer_TimeLimitSet = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    delegationHash: event.params.delegationHash,
    validUntil: event.params.validUntil,
  };

  context.FinancialCaveatEnforcer_TimeLimitSet.set(entity);
});

FinancialCaveatEnforcer.TokenSpent.handler(async ({ event, context }) => {
  const entity: FinancialCaveatEnforcer_TokenSpent = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    delegationHash: event.params.delegationHash,
    token: event.params.token,
    amount: event.params.amount,
  };

  context.FinancialCaveatEnforcer_TokenSpent.set(entity);
});

FinancialCaveatEnforcer.TokenWhitelistSet.handler(async ({ event, context }) => {
  const entity: FinancialCaveatEnforcer_TokenWhitelistSet = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    delegationHash: event.params.delegationHash,
    tokens: event.params.tokens,
  };

  context.FinancialCaveatEnforcer_TokenWhitelistSet.set(entity);
});

FinancialCaveatEnforcer.TransferLimitSet.handler(async ({ event, context }) => {
  const entity: FinancialCaveatEnforcer_TransferLimitSet = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    delegationHash: event.params.delegationHash,
    token: event.params.token,
    maxTransferAmount: event.params.maxTransferAmount,
    dailyLimit: event.params.dailyLimit,
  };

  context.FinancialCaveatEnforcer_TransferLimitSet.set(entity);
});

FoodNFT.Approval.handler(async ({ event, context }) => {
  const entity: FoodNFT_Approval = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    owner: event.params.owner,
    approved: event.params.approved,
    tokenId: event.params.tokenId,
  };

  context.FoodNFT_Approval.set(entity);
});

FoodNFT.ApprovalForAll.handler(async ({ event, context }) => {
  const entity: FoodNFT_ApprovalForAll = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    owner: event.params.owner,
    operator: event.params.operator,
    approved: event.params.approved,
  };

  context.FoodNFT_ApprovalForAll.set(entity);
});

FoodNFT.BatchMetadataUpdate.handler(async ({ event, context }) => {
  const entity: FoodNFT_BatchMetadataUpdate = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    _fromTokenId: event.params._fromTokenId,
    _toTokenId: event.params._toTokenId,
  };

  context.FoodNFT_BatchMetadataUpdate.set(entity);
});

FoodNFT.FoodBurned.handler(async ({ event, context }) => {
  const entity: FoodNFT_FoodBurned = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    tokenId: event.params.tokenId,
    owner: event.params.owner,
    burner: event.params.burner,
    timestamp: event.params.timestamp,
  };

  context.FoodNFT_FoodBurned.set(entity);
});

FoodNFT.MetadataUpdate.handler(async ({ event, context }) => {
  const entity: FoodNFT_MetadataUpdate = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    _tokenId: event.params._tokenId,
  };

  context.FoodNFT_MetadataUpdate.set(entity);
});

FoodNFT.MintPriceUpdated.handler(async ({ event, context }) => {
  const entity: FoodNFT_MintPriceUpdated = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    oldPrice: event.params.oldPrice,
    newPrice: event.params.newPrice,
  };

  context.FoodNFT_MintPriceUpdated.set(entity);
});

FoodNFT.OwnershipTransferred.handler(async ({ event, context }) => {
  const entity: FoodNFT_OwnershipTransferred = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    previousOwner: event.params.previousOwner,
    newOwner: event.params.newOwner,
  };

  context.FoodNFT_OwnershipTransferred.set(entity);
});

FoodNFT.Transfer.handler(async ({ event, context }) => {
  const entity: FoodNFT_Transfer = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    from: event.params.from,
    to: event.params.to,
    tokenId: event.params.tokenId,
  };

  context.FoodNFT_Transfer.set(entity);
});

FoodScramble.FaucetAmountUpdated.handler(async ({ event, context }) => {
  const entity: FoodScramble_FaucetAmountUpdated = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    oldAmount: event.params.oldAmount,
    newAmount: event.params.newAmount,
  };

  context.FoodScramble_FaucetAmountUpdated.set(entity);
});

FoodScramble.FaucetCooldownUpdated.handler(async ({ event, context }) => {
  const entity: FoodScramble_FaucetCooldownUpdated = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    oldCooldown: event.params.oldCooldown,
    newCooldown: event.params.newCooldown,
  };

  context.FoodScramble_FaucetCooldownUpdated.set(entity);
});

FoodScramble.HamburgerMinted.handler(async ({ event, context }) => {
  const entity: FoodScramble_HamburgerMinted = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    player: event.params.player,
    tokenId: event.params.tokenId,
  };

  context.FoodScramble_HamburgerMinted.set(entity);
});

FoodScramble.IngredientPurchased.handler(async ({ event, context }) => {
  const entity: FoodScramble_IngredientPurchased = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    player: event.params.player,
    ingredientType: event.params.ingredientType,
    position: event.params.position,
  };

  context.FoodScramble_IngredientPurchased.set(entity);
});

FoodScramble.PlayerCreated.handler(async ({ event, context }) => {
  const entity: FoodScramble_PlayerCreated = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    tba: event.params.tba,
    gridIndex: event.params.gridIndex,
  };

  context.FoodScramble_PlayerCreated.set(entity);
});

FoodScramble.PlayerMoved.handler(async ({ event, context }) => {
  const entity: FoodScramble_PlayerMoved = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    player: event.params.player,
    newPosition: event.params.newPosition,
    roll: event.params.roll,
  };

  context.FoodScramble_PlayerMoved.set(entity);
});

FoodScramble.RailTraveled.handler(async ({ event, context }) => {
  const entity: FoodScramble_RailTraveled = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    player: event.params.player,
    fromPosition: event.params.fromPosition,
    toPosition: event.params.toPosition,
  };

  context.FoodScramble_RailTraveled.set(entity);
});

FoodScramble.TokenBoundAccountCreated.handler(async ({ event, context }) => {
  const entity: FoodScramble_TokenBoundAccountCreated = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    eoa: event.params.eoa,
    tba: event.params.tba,
    startPosition: event.params.startPosition,
  };

  context.FoodScramble_TokenBoundAccountCreated.set(entity);
});

GameCaveatEnforcer.FunctionAllowed.handler(async ({ event, context }) => {
  const entity: GameCaveatEnforcer_FunctionAllowed = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    delegationHash: event.params.delegationHash,
    functionSelector: event.params.functionSelector,
    allowed: event.params.allowed,
  };

  context.GameCaveatEnforcer_FunctionAllowed.set(entity);
});

GameCaveatEnforcer.GameActionAllowed.handler(async ({ event, context }) => {
  const entity: GameCaveatEnforcer_GameActionAllowed = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    delegationHash: event.params.delegationHash,
    gameAction: event.params.action,
    allowed: event.params.allowed,
  };

  context.GameCaveatEnforcer_GameActionAllowed.set(entity);
});

GameCaveatEnforcer.GameActionLimitSet.handler(async ({ event, context }) => {
  const entity: GameCaveatEnforcer_GameActionLimitSet = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    delegationHash: event.params.delegationHash,
    maxRolls: event.params.maxRolls,
    maxBuys: event.params.maxBuys,
    maxRails: event.params.maxRails,
    maxFaucets: event.params.maxFaucets,
    maxCooks: event.params.maxCooks,
    validUntil: event.params.validUntil,
  };

  context.GameCaveatEnforcer_GameActionLimitSet.set(entity);
});

GameCaveatEnforcer.GameStateSet.handler(async ({ event, context }) => {
  const entity: GameCaveatEnforcer_GameStateSet = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    delegationHash: event.params.delegationHash,
    isActive: event.params.isActive,
    maxConsecutiveActions: event.params.maxConsecutiveActions,
  };

  context.GameCaveatEnforcer_GameStateSet.set(entity);
});

GameCaveatEnforcer.OwnershipTransferred.handler(async ({ event, context }) => {
  const entity: GameCaveatEnforcer_OwnershipTransferred = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    previousOwner: event.params.previousOwner,
    newOwner: event.params.newOwner,
  };

  context.GameCaveatEnforcer_OwnershipTransferred.set(entity);
});

GameCaveatEnforcer.RateLimitSet.handler(async ({ event, context }) => {
  const entity: GameCaveatEnforcer_RateLimitSet = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    delegationHash: event.params.delegationHash,
    maxCallsPerHour: event.params.maxCallsPerHour,
  };

  context.GameCaveatEnforcer_RateLimitSet.set(entity);
});

GameCaveatEnforcer.TargetAddressesSet.handler(async ({ event, context }) => {
  const entity: GameCaveatEnforcer_TargetAddressesSet = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    delegationHash: event.params.delegationHash,
    targets: event.params.targets,
  };

  context.GameCaveatEnforcer_TargetAddressesSet.set(entity);
});

LettuceToken.Approval.handler(async ({ event, context }) => {
  const entity: LettuceToken_Approval = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    owner: event.params.owner,
    spender: event.params.spender,
    value: event.params.value,
  };

  context.LettuceToken_Approval.set(entity);
});

LettuceToken.OwnershipTransferred.handler(async ({ event, context }) => {
  const entity: LettuceToken_OwnershipTransferred = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    previousOwner: event.params.previousOwner,
    newOwner: event.params.newOwner,
  };

  context.LettuceToken_OwnershipTransferred.set(entity);
});

LettuceToken.Transfer.handler(async ({ event, context }) => {
  const entity: LettuceToken_Transfer = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    from: event.params.from,
    to: event.params.to,
    value: event.params.value,
  };

  context.LettuceToken_Transfer.set(entity);
});

MeatToken.Approval.handler(async ({ event, context }) => {
  const entity: MeatToken_Approval = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    owner: event.params.owner,
    spender: event.params.spender,
    value: event.params.value,
  };

  context.MeatToken_Approval.set(entity);
});

MeatToken.OwnershipTransferred.handler(async ({ event, context }) => {
  const entity: MeatToken_OwnershipTransferred = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    previousOwner: event.params.previousOwner,
    newOwner: event.params.newOwner,
  };

  context.MeatToken_OwnershipTransferred.set(entity);
});

MeatToken.Transfer.handler(async ({ event, context }) => {
  const entity: MeatToken_Transfer = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    from: event.params.from,
    to: event.params.to,
    value: event.params.value,
  };

  context.MeatToken_Transfer.set(entity);
});

PaymentGateway.ERC20PaymentReceived.handler(async ({ event, context }) => {
  const entity: PaymentGateway_ERC20PaymentReceived = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    payer: event.params.payer,
    token: event.params.token,
    amount: event.params.amount,
    metadata: event.params.metadata,
  };

  context.PaymentGateway_ERC20PaymentReceived.set(entity);
});

PaymentGateway.ERC20Withdrawn.handler(async ({ event, context }) => {
  const entity: PaymentGateway_ERC20Withdrawn = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    token: event.params.token,
    receiver: event.params.receiver,
    amount: event.params.amount,
  };

  context.PaymentGateway_ERC20Withdrawn.set(entity);
});

PaymentGateway.NativePaymentReceived.handler(async ({ event, context }) => {
  const entity: PaymentGateway_NativePaymentReceived = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    payer: event.params.payer,
    amount: event.params.amount,
    metadata: event.params.metadata,
  };

  context.PaymentGateway_NativePaymentReceived.set(entity);
});

PaymentGateway.OwnershipTransferred.handler(async ({ event, context }) => {
  const entity: PaymentGateway_OwnershipTransferred = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    previousOwner: event.params.previousOwner,
    newOwner: event.params.newOwner,
  };

  context.PaymentGateway_OwnershipTransferred.set(entity);
});

PaymentGateway.Withdrawn.handler(async ({ event, context }) => {
  const entity: PaymentGateway_Withdrawn = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    receiver: event.params.receiver,
    amount: event.params.amount,
  };

  context.PaymentGateway_Withdrawn.set(entity);
});

RewardPool.DistributorUpdated.handler(async ({ event, context }) => {
  const entity: RewardPool_DistributorUpdated = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    distributor: event.params.distributor,
    authorized: event.params.authorized,
  };

  context.RewardPool_DistributorUpdated.set(entity);
});

RewardPool.FundsDeposited.handler(async ({ event, context }) => {
  const entity: RewardPool_FundsDeposited = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    from: event.params.from,
    amount: event.params.amount,
  };

  context.RewardPool_FundsDeposited.set(entity);
});

RewardPool.OwnershipTransferred.handler(async ({ event, context }) => {
  const entity: RewardPool_OwnershipTransferred = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    previousOwner: event.params.previousOwner,
    newOwner: event.params.newOwner,
  };

  context.RewardPool_OwnershipTransferred.set(entity);
});

RewardPool.RewardDistributed.handler(async ({ event, context }) => {
  const entity: RewardPool_RewardDistributed = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    to: event.params.to,
    amount: event.params.amount,
    distributor: event.params.distributor,
  };

  context.RewardPool_RewardDistributed.set(entity);
});

SpiceToken.Approval.handler(async ({ event, context }) => {
  const entity: SpiceToken_Approval = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    owner: event.params.owner,
    spender: event.params.spender,
    value: event.params.value,
  };

  context.SpiceToken_Approval.set(entity);
});

SpiceToken.Transfer.handler(async ({ event, context }) => {
  const entity: SpiceToken_Transfer = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    from: event.params.from,
    to: event.params.to,
    value: event.params.value,
  };

  context.SpiceToken_Transfer.set(entity);
});

TomatoToken.Approval.handler(async ({ event, context }) => {
  const entity: TomatoToken_Approval = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    owner: event.params.owner,
    spender: event.params.spender,
    value: event.params.value,
  };

  context.TomatoToken_Approval.set(entity);
});

TomatoToken.OwnershipTransferred.handler(async ({ event, context }) => {
  const entity: TomatoToken_OwnershipTransferred = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    previousOwner: event.params.previousOwner,
    newOwner: event.params.newOwner,
  };

  context.TomatoToken_OwnershipTransferred.set(entity);
});

TomatoToken.Transfer.handler(async ({ event, context }) => {
  const entity: TomatoToken_Transfer = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    from: event.params.from,
    to: event.params.to,
    value: event.params.value,
  };

  context.TomatoToken_Transfer.set(entity);
});

