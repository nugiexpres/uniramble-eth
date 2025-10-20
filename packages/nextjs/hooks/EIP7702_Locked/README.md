# EIP-7702 DEPRECATED

⚠️ **This folder is locked and no longer used in the application.**

## Migration to Smart Account System

This application has migrated from EIP-7702 delegation to a dedicated Smart Account system for better reliability and compatibility.

## What Changed

### Before (EIP-7702)
- Used experimental EIP-7702 delegation
- Required MetaMask SDK delegation toolkit
- Limited browser support
- Complex delegation workflow

### After (Smart Account)
- Uses MetaMask Delegation Toolkit with ERC-4337
- Proper Smart Account deployment via Biconomy/Pimlico
- Better gasless transaction support
- More reliable and tested

## New Hooks to Use

Instead of `useEIP7702Delegation`, use:

1. **`useFinalSmartAccount`** - For smart account creation and deployment
   ```ts
   import { useFinalSmartAccount } from "~~/hooks/smart-account/useFinalSmartAccount";
   
   const { 
     smartAccountAddress, 
     isDeployed, 
     createAndDeploySmartAccount 
   } = useFinalSmartAccount();
   ```

2. **`useGaslessGameActions`** - For gasless game actions
   ```ts
   import { useGaslessGameActions } from "~~/hooks/board/useGaslessGameActions";
   
   const { 
     gaslessHandleRoll,
     gaslessHandleBuy,
     gaslessHandleCook,
     // ... other gasless actions
   } = useGaslessGameActions();
   ```

3. **`useSmartAccountTBA`** - For TBA (Token Bound Account) integration
   ```ts
   import { useSmartAccountTBA } from "~~/hooks/envio/useSmartAccountTBA";
   
   const { tbaAddress, refetchContractTBA } = useSmartAccountTBA();
   ```

## Benefits of Smart Account System

1. ✅ **Better UX** - Simpler wallet connection flow
2. ✅ **Gasless Transactions** - Users don't pay gas fees
3. ✅ **More Reliable** - Battle-tested ERC-4337 standard
4. ✅ **Better Support** - Works with all wallets, not just MetaMask
5. ✅ **Modular** - Easier to maintain and extend

## Migration Guide

If you need to migrate code from EIP-7702 to Smart Account:

### 1. Replace Hook Import
```ts
// OLD ❌
import { useEIP7702Delegation } from "~~/hooks/EIP7702/useEIP7702Delegation";
const { executeGameAction, isDelegationEnabled } = useEIP7702Delegation();

// NEW ✅
import { useGaslessGameActions } from "~~/hooks/board/useGaslessGameActions";
const { gaslessHandleRoll, gaslessHandleBuy } = useGaslessGameActions();
```

### 2. Update Action Logic
```ts
// OLD ❌
if (isDelegationEnabled) {
  await executeGameAction("movePlayer", []);
}

// NEW ✅
if (isSmartAccountDeployed && smartAccountAddress) {
  await gaslessHandleRoll();
}
```

### 3. Remove Delegation Checks
Smart Account system doesn't need delegation checks. Just check if smart account is deployed:

```ts
if (isSmartAccountDeployed && smartAccountAddress) {
  // Use gasless transaction
} else {
  // Fallback to regular transaction
}
```

## Files Updated

- ✅ `hooks/board/useActionBoard.ts` - Removed EIP-7702 logic
- ✅ All game action handlers now use Smart Account first, then fallback to regular transactions

## Date Deprecated

October 20, 2025

## Questions?

Refer to the new Smart Account documentation in:
- `/hooks/smart-account/README.md`
- `/docs/SMART_ACCOUNT.md`
