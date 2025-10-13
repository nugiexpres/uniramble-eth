"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle, Clock, Coins, Gamepad2, Loader2, Lock, Target } from "lucide-react";
import { useAccount } from "wagmi";
import { WalletConnectionWarning } from "~~/components/scaffold-eth";
import { useCaveatEnforcer } from "~~/hooks/Delegation/useCaveatEnforcer";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { notification } from "~~/utils/scaffold-eth";

interface GameActionsProps {
  isSmartAccount: boolean;
  isLoading: boolean;
  error: string | null;
  onGameAction: (action: string, params?: any[]) => Promise<boolean>;
  executeGameAction?: (action: string, params?: any[]) => Promise<false | `0x${string}`>;
}

export const GameActions = ({
  isSmartAccount,
  isLoading,
  error,
  onGameAction,
  executeGameAction,
}: GameActionsProps) => {
  const { address, isConnected } = useAccount();
  const { targetNetwork } = useTargetNetwork();
  const { contractAddress } = useCaveatEnforcer();

  const [delegationCreated, setDelegationCreated] = useState(false);
  const [isCreatingDelegation, setIsCreatingDelegation] = useState(false);

  const handleCreateDelegation = async () => {
    if (!address || !contractAddress) {
      notification.error("Address or CaveatEnforcer contract not available");
      return;
    }

    try {
      setIsCreatingDelegation(true);

      // Create delegation for game actions
      // Note: createDelegation requires session key address and smart account address
      notification.info("Delegation creation feature is under development");

      setDelegationCreated(false);
    } catch (error: any) {
      notification.error(`Failed to create delegation: ${error.message}`);
    } finally {
      setIsCreatingDelegation(false);
    }
  };

  const handleGameAction = async (action: string) => {
    if (!delegationCreated) {
      notification.error("Please create delegation first");
      return;
    }

    // Use passkey execution if available, otherwise fallback to regular action
    if (executeGameAction) {
      await executeGameAction(action);
    } else {
      await onGameAction(action);
    }
  };

  if (!isConnected) {
    return <WalletConnectionWarning className="card bg-green-100 border-green-200 shadow-sm" />;
  }

  if (!isSmartAccount) {
    return (
      <div className="card bg-green-100 border-green-200 shadow-sm">
        <div className="card-body text-center">
          <Gamepad2 className="w-12 h-12 mx-auto text-green-500 mb-4" />
          <h3 className="font-semibold text-green-700">Smart Account Required</h3>
          <p className="text-sm text-green-600">Please upgrade to smart account first to use game actions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="alert alert-error">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Create Game Delegation */}
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <Lock className="w-5 h-5" />
          Create Game Delegation with Caveats
        </h3>
        <p className="text-sm text-base-content/70 mb-3">
          Create a delegation with caveat enforcers for secure game actions
        </p>

        <div className="grid grid-cols-1 gap-2 mb-3">
          <div className="flex items-center gap-2 text-sm">
            <Target className="w-4 h-4 text-blue-500" />
            <span>Allowed Targets: Game contracts only</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Coins className="w-4 h-4 text-green-500" />
            <span>Spending Limit: 1 {targetNetwork.nativeCurrency?.symbol || "ETH"}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-orange-500" />
            <span>Time Limit: 24 hours from creation</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Lock className="w-4 h-4 text-purple-500" />
            <span>
              Caveat Enforcer:{" "}
              {contractAddress ? `${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}` : "Not deployed"}
            </span>
          </div>
        </div>

        <button
          onClick={handleCreateDelegation}
          disabled={isCreatingDelegation || delegationCreated || !contractAddress}
          className="btn btn-primary w-full"
        >
          {isCreatingDelegation ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating Delegation...
            </>
          ) : delegationCreated ? (
            <>
              <CheckCircle className="w-4 h-4" />
              Delegation Created
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              Create Game Delegation
            </>
          )}
        </button>
      </div>

      {/* Game Actions */}
      {delegationCreated && (
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Gamepad2 className="w-5 h-5" />
            Execute Game Actions via Delegation
          </h3>
          <p className="text-sm text-base-content/70 mb-3">
            Execute game actions through secure delegation with caveat enforcers
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => handleGameAction("roll")} disabled={isLoading} className="btn btn-outline btn-sm">
              🎲 Roll Dice
            </button>
            <button onClick={() => handleGameAction("buy")} disabled={isLoading} className="btn btn-outline btn-sm">
              🛒 Buy Ingredient
            </button>
            <button onClick={() => handleGameAction("rail")} disabled={isLoading} className="btn btn-outline btn-sm">
              🚂 Use Rail
            </button>
            <button onClick={() => handleGameAction("faucet")} disabled={isLoading} className="btn btn-outline btn-sm">
              💧 Use Faucet
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 p-3 bg-success/10 rounded-lg">
        <h4 className="font-semibold text-success mb-2">Game Delegation Features!</h4>
        <ul className="text-xs text-base-content/80 space-y-1 text-left">
          <li>• Secure delegation with caveat enforcers</li>
          <li>• Game actions executed through controlled permissions</li>
          <li>• Spending limits and time constraints enforced</li>
          <li>• Biometric authentication with passkey support</li>
        </ul>
      </div>
    </div>
  );
};
