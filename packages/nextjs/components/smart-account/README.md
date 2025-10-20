# Smart Account Delegation with Caveat Enforcer

## Overview

This implementation enables gasless game actions through MetaMask's Delegation Toolkit with custom caveat enforcers. Users can delegate their smart account to execute game actions without signing each transaction.

## Components

### DelegationCaveatEnforcer

A React component that manages delegation setup with caveat enforcers for secure, gasless transactions.

**Features:**

- Creates session keys for gasless execution
- Sets up hybrid delegation with game and financial caveats
- Enforces rate limits and action quotas
- Displays delegation status and session key info
- Collapsible UI for better UX

**Usage:**

```tsx
import { DelegationCaveatEnforcer } from "~~/components/smart-account/DelegationCaveatEnforcer";

function MyComponent() {
  const [sessionKey, setSessionKey] = useState<string | null>(null);
  const [delegationHash, setDelegationHash] = useState<string | null>(null);

  return (
    <DelegationCaveatEnforcer
      smartAccountAddress={smartAccountAddress}
      onDelegationCreated={(key, hash) => {
        setSessionKey(key);
        setDelegationHash(hash);
      }}
      onDelegationCleared={() => {
        setSessionKey(null);
        setDelegationHash(null);
      }}
    />
  );
}
```

## Hooks

### useGaslessGameActions

A React hook that provides gasless execution methods for all game actions.

**Features:**

- Roll dice without signing
- Buy ingredients without signing
- Travel via rail without signing
- Use faucet without signing
- Cook burgers without signing

**Usage:**

```tsx
import { useGaslessGameActions } from "~~/hooks/delegation/game/useGaslessGameActions";

function GameComponent() {
  const {
    isDelegationActive,
    canExecuteGasless,
    isExecuting,
    executeRollGasless,
    executeBuyGasless,
    executeRailGasless,
    executeFaucetGasless,
    executeCookGasless,
  } = useGaslessGameActions(smartAccountAddress);

  const handleRoll = async () => {
    if (canExecuteGasless) {
      await executeRollGasless();
    } else {
      // Fallback to normal transaction
      await normalRoll();
    }
  };

  return (
    <button onClick={handleRoll} disabled={isExecuting}>
      {canExecuteGasless ? "🎲 Roll (Gasless)" : "🎲 Roll"}
    </button>
  );
}
```

## Integration with GameControls

Here's how to integrate gasless delegation into the existing `GameControls.tsx`:

### Step 1: Import Required Components and Hooks

```tsx
import { DelegationCaveatEnforcer } from "~~/components/smart-account/DelegationCaveatEnforcer";
import { useGaslessGameActions } from "~~/hooks/delegation/game/useGaslessGameActions";
```

### Step 2: Add State for Delegation

```tsx
const [delegationSessionKey, setDelegationSessionKey] = useState<string | null>(null);
const [delegationHash, setDelegationHash] = useState<string | null>(null);
```

### Step 3: Initialize Gasless Actions Hook

```tsx
const {
  isDelegationActive,
  canExecuteGasless,
  isExecuting: isGaslessExecuting,
  executeRollGasless,
  executeBuyGasless,
  executeRailGasless,
  executeFaucetGasless,
  executeCookGasless,
} = useGaslessGameActions(smartAccountAddress);
```

### Step 4: Modify Button Click Handlers

```tsx
const handleRollClick = async () => {
  if (canExecuteGasless) {
    const success = await executeRollGasless();
    if (success) return;
    // If gasless fails, fallback to normal
  }
  handleRoll(); // Original handler
};

const handleBuyClick = async () => {
  if (canExecuteGasless) {
    const success = await executeBuyGasless();
    if (success) return;
  }
  handleBuy();
};

const handleRailClick = async () => {
  if (canExecuteGasless) {
    const success = await executeRailGasless();
    if (success) return;
  }
  handleRail();
};

const handleFaucetClick = async () => {
  if (canExecuteGasless) {
    const success = await executeFaucetGasless(isOnStove);
    if (success) return;
  }
  handleFaucetMon(isOnStove);
};

const handleCookClick = async () => {
  if (canExecuteGasless) {
    const success = await executeCookGasless();
    if (success) return;
  }
  handleCook();
};
```

### Step 5: Add DelegationCaveatEnforcer Component

Add the delegation enforcer component above or below the game controls:

```tsx
<div className="space-y-4">
  {/* Delegation Controls */}
  {smartAccountAddress && (
    <DelegationCaveatEnforcer
      smartAccountAddress={smartAccountAddress}
      onDelegationCreated={(sessionKey, hash) => {
        setDelegationSessionKey(sessionKey);
        setDelegationHash(hash);
      }}
      onDelegationCleared={() => {
        setDelegationSessionKey(null);
        setDelegationHash(null);
      }}
    />
  )}

  {/* Existing Game Controls */}
  <GameControls {...props} />
</div>
```

### Step 6: Update Button UI to Show Gasless Status

```tsx
<button
  onClick={handleRollClick}
  disabled={isRolling || isGaslessExecuting}
  className={`btn ${canExecuteGasless ? "btn-success" : "btn-primary"}`}
>
  {isGaslessExecuting ? <>🔄 Processing...</> : canExecuteGasless ? <>🎲 Roll (Free ⚡)</> : <>🎲 Roll</>}
</button>
```

## Architecture

### Smart Contracts

1. **GameCaveatEnforcer.sol** - Enforces game-specific limits:

   - Max rolls, buys, rails, faucets, cooks per period
   - Rate limiting (calls per hour)
   - Allowed function selectors
   - Target address whitelisting

2. **FinancialCaveatEnforcer.sol** - Enforces financial limits:

   - Spending limits per token
   - Token whitelisting
   - Time-based restrictions
   - Period-based quotas

3. **CaveatEnforcerHub.sol** - Manages multiple enforcers:
   - Enables/disables enforcers
   - Links enforcers to delegations
   - Coordinates enforcement

### Frontend Hooks

1. **useDelegationManager** - Main delegation lifecycle:

   - Generate session keys
   - Create delegations
   - Execute transactions via session keys
   - Clear delegations

2. **useHybridDelegation** - Hybrid caveat configuration:

   - Create game + financial caveats
   - Set default configurations
   - Generate delegation hashes

3. **useCaveatEnforcer** - Direct caveat control:

   - Set action limits
   - Configure rate limits
   - Manage whitelists

4. **useGaslessGameActions** - Game-specific execution:
   - Gasless roll, buy, rail, faucet, cook
   - Automatic fallback to normal execution
   - Error handling

## Security Features

### Caveat Limits (Default)

- Max Actions per Day: 100 each (roll, buy, rail, faucet, cook)
- Rate Limit: 50 calls per hour
- Valid Duration: 30 days
- Spending Limit: 1 ETH
- Token Whitelist: Native token only

### Enforced at Contract Level

- All limits are checked in `beforeHook()`
- Usage is tracked in `afterHook()`
- Rate limits reset hourly
- Time-based expiration

## Flow Diagram

```
User
  ↓
1. Click "Enable Gasless Mode"
  ↓
2. DelegationCaveatEnforcer generates session key
  ↓
3. Creates delegation with caveats (game + financial)
  ↓
4. User signs delegation (one-time)
  ↓
5. Session key stored securely
  ↓
6. Game actions now execute gasless
  ↓
7. Each action:
   - Encoded with contract ABI
   - Signed by session key (no user interaction)
   - Validated by caveat enforcers
   - Executed via Pimlico paymaster
   - User gets instant feedback
```

## Testing

### Manual Testing Steps

1. Deploy smart account
2. Enable gasless mode via DelegationCaveatEnforcer
3. Try each game action:
   - Roll dice
   - Buy ingredient
   - Travel rail
   - Use faucet
   - Cook burger
4. Verify no wallet signatures required
5. Check action limits work
6. Test rate limiting
7. Clear delegation and verify fallback to normal execution

### Expected Behavior

- ✅ First click: Enable gasless mode (requires signature)
- ✅ Subsequent game actions: No signatures required
- ✅ Actions execute instantly
- ✅ Transaction sponsored by paymaster
- ✅ Limits enforced by caveats
- ✅ Clear delegation removes gasless mode

## Troubleshooting

### "Delegation not active"

- Solution: Click "Enable Gasless Mode" in DelegationCaveatEnforcer

### "Failed to execute gasless transaction"

- Check: Smart account is deployed
- Check: Session key is valid
- Check: Action limits not exceeded
- Check: Rate limit not exceeded
- Fallback: Normal transaction will execute

### "Contract ABI not found"

- Solution: Ensure deployedContracts.ts is up to date
- Run: `yarn deploy` to regenerate contract artifacts

## Environment Setup

### Required Environment Variables

```env
NEXT_PUBLIC_PIMLICO_API_KEY=your_pimlico_key
```

### Configuration Files

1. `config/bundler.ts` - Bundler and paymaster URLs
2. `config/client.ts` - Smart account client setup
3. `contracts/deployedContracts.ts` - Contract addresses and ABIs

## Best Practices

1. **Always provide fallback**: If gasless execution fails, fall back to normal execution
2. **Show user feedback**: Display "Gasless" or "Free ⚡" badges
3. **Handle errors gracefully**: Don't block user if delegation fails
4. **Secure session keys**: Store securely, don't expose in logs
5. **Test limits**: Ensure caveat enforcers work as expected
6. **Monitor usage**: Track gasless vs normal execution ratio

## Future Improvements

- [ ] Persistent session key storage (encrypted)
- [ ] Custom caveat configurations per user
- [ ] Analytics dashboard for delegation usage
- [ ] Multi-game support with different caveats
- [ ] Automatic session key rotation
- [ ] Delegation sharing/transfer features
