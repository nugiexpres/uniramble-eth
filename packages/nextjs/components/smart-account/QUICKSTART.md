# Quick Start: Gasless Game Actions with Delegation

This guide will help you quickly integrate gasless game actions using MetaMask Delegation Toolkit with Caveat Enforcers.

## What Was Built

1. **DelegationCaveatEnforcer.tsx** - UI component for managing delegations
2. **useGaslessGameActions.ts** - Hook for executing gasless game actions
3. **GameControlsWithDelegation.tsx** - Drop-in replacement for GameControls
4. **Smart Contracts** - GameCaveatEnforcer.sol, FinancialCaveatEnforcer.sol, CaveatEnforcerHub.sol

## Quick Integration (3 Steps)

### Option 1: Use the Drop-in Component (Easiest)

Replace your GameControls import:

```tsx
// Before
import { GameControls } from "~~/app/board/_components/GameControls";
// After
import { GameControlsWithDelegation } from "~~/components/smart-account";

// In your JSX
<GameControlsWithDelegation
  // ... same props as GameControls
  smartAccountAddress={smartAccountAddress}
  // ... all other props
/>;
```

Done! Your users can now enable gasless mode.

### Option 2: Manual Integration

#### Step 1: Add imports

```tsx
import { DelegationCaveatEnforcer } from "~~/components/smart-account";
import { useGaslessGameActions } from "~~/hooks/delegation/game/useGaslessGameActions";
```

#### Step 2: Use the hook

```tsx
const {
  canExecuteGasless,
  executeRollGasless,
  executeBuyGasless,
  // ... other methods
} = useGaslessGameActions(smartAccountAddress);
```

#### Step 3: Add delegation UI

```tsx
{
  smartAccountAddress && <DelegationCaveatEnforcer smartAccountAddress={smartAccountAddress} />;
}
```

#### Step 4: Update action handlers

```tsx
const handleRoll = async () => {
  if (canExecuteGasless) {
    const success = await executeRollGasless();
    if (success) return;
  }
  // Fallback to normal execution
  await normalRoll();
};
```

## How It Works

1. **User clicks "Enable Gasless Mode"** - Signs delegation once
2. **Session key generated** - Stored locally for gasless execution
3. **Game actions execute instantly** - No more wallet popups!
4. **Caveats enforce limits** - 100 actions/day, 50 calls/hour
5. **Automatic fallback** - If gasless fails, uses normal execution

## Security Features

✅ Action limits (100 per day per action type)
✅ Rate limiting (50 calls per hour)
✅ Time-based expiration (30 days)
✅ Spending limits (1 ETH max)
✅ Contract-level enforcement

## User Experience

### Before Delegation

```
Click Roll → MetaMask Popup → Wait → Confirm → Transaction
```

### After Delegation

```
Click Roll → Instant Transaction ⚡
```

## Testing Checklist

- [ ] Deploy smart account
- [ ] Enable gasless mode (signs once)
- [ ] Roll dice without signing
- [ ] Buy ingredient without signing
- [ ] Travel rail without signing
- [ ] Use faucet without signing
- [ ] Cook burger without signing
- [ ] Verify action limits work
- [ ] Clear delegation and verify normal execution works

## Environment Setup

Add to your `.env.local`:

```env
NEXT_PUBLIC_PIMLICO_API_KEY=your_pimlico_api_key_here
```

Get your API key from: https://dashboard.pimlico.io

## Troubleshooting

**"Delegation not active"**
→ Click "Enable Gasless Mode" first

**"Failed to execute gasless"**
→ Check smart account is deployed
→ Check session key is valid
→ System will fallback to normal execution

**No Pimlico API key error**
→ Add `NEXT_PUBLIC_PIMLICO_API_KEY` to `.env.local`

## Files Created/Modified

### New Files

- `components/smart-account/DelegationCaveatEnforcer.tsx`
- `components/smart-account/GameControlsWithDelegation.tsx`
- `components/smart-account/README.md`
- `components/smart-account/QUICKSTART.md`
- `components/smart-account/index.ts`
- `hooks/delegation/game/useGaslessGameActions.ts`

### Existing Smart Contracts

- `contracts/delegation/GameCaveatEnforcer.sol` ✅
- `contracts/delegation/FinancialCaveatEnforcer.sol` ✅
- `contracts/delegation/CaveatEnforcerHub.sol` ✅

### Existing Hooks (Used)

- `hooks/Delegation/useCaveatEnforcer.ts` ✅
- `hooks/Delegation/useDelegationManager.ts` ✅
- `hooks/delegation/hybrid/useHybridDelegation.ts` ✅

## Next Steps

1. **Test the integration** - Follow the testing checklist above
2. **Customize limits** - Modify default caveat configurations
3. **Add analytics** - Track gasless vs normal execution ratio
4. **User onboarding** - Add tutorial for first-time users

## Support

For detailed documentation, see:

- `README.md` - Complete architecture and integration guide
- Smart contract code in `packages/hardhat/contracts/delegation/`
- Hook implementations in `packages/nextjs/hooks/delegation/`

## Example Usage

See `GameControlsWithDelegation.tsx` for a complete working example of how to integrate delegation with game controls.

---

**Built with:**

- MetaMask Delegation Toolkit
- ERC-4337 Account Abstraction
- Pimlico Paymaster & Bundler
- Custom Caveat Enforcers
