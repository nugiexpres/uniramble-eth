"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, Shield, Wallet } from "lucide-react";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { useFinalSmartAccount } from "~~/hooks/smart-account/useFinalSmartAccount";
import { useSmartAccountVerification } from "~~/hooks/smart-account/useSmartAccountVerification";

interface SmartAccountStatusProps {
  showDetails?: boolean;
  className?: string;
}

export const SmartAccountStatus = ({ showDetails = true, className = "" }: SmartAccountStatusProps) => {
  const { address: eoaAddress } = useAccount();
  const { smartAccountAddress, isDeployed: isSmartAccountDeployed } = useFinalSmartAccount();
  const { isVerified, verificationStatus, checkExistingVerification, verifyOwnership, canVerify } =
    useSmartAccountVerification();

  const [isInitialized, setIsInitialized] = useState(false);

  // Check existing verification on mount
  useEffect(() => {
    if (smartAccountAddress && !isInitialized) {
      checkExistingVerification();
      setIsInitialized(true);
    }
  }, [smartAccountAddress, checkExistingVerification, isInitialized]);

  if (!eoaAddress) {
    return (
      <div className={`flex items-center gap-2 text-slate-400 ${className}`}>
        <Wallet className="w-4 h-4" />
        <span className="text-sm">Connect Wallet</span>
      </div>
    );
  }

  if (!isSmartAccountDeployed || !smartAccountAddress) {
    return (
      <div className={`flex items-center gap-2 text-amber-400 ${className}`}>
        <AlertTriangle className="w-4 h-4" />
        <span className="text-sm">Smart Account Not Deployed</span>
      </div>
    );
  }

  const handleVerifyOwnership = async () => {
    if (canVerify) {
      await verifyOwnership();
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Main Status */}
      <div className="flex items-center gap-2">
        {isVerified ? (
          <>
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium text-green-400">✅ Smart Account Connected</span>
          </>
        ) : (
          <>
            <Shield className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-400">🔐 Verify Ownership</span>
          </>
        )}
      </div>

      {/* Verification Status */}
      {verificationStatus && showDetails && <div className="text-xs text-slate-400 ml-6">{verificationStatus}</div>}

      {/* Smart Account Address */}
      {showDetails && (
        <div className="ml-6">
          <div className="text-xs text-slate-500 mb-1">Smart Account:</div>
          <Address address={smartAccountAddress} />
        </div>
      )}

      {/* Verify Button */}
      {!isVerified && canVerify && (
        <button
          onClick={handleVerifyOwnership}
          className="mt-2 px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 rounded-lg text-xs text-blue-300 transition-colors"
        >
          🔐 Verify Ownership
        </button>
      )}

      {/* Success Message */}
      {isVerified && showDetails && (
        <div className="ml-6 p-2 bg-green-500/10 border border-green-400/30 rounded-lg">
          <div className="text-xs text-green-300">
            <div className="font-medium mb-1">✅ Ownership Verified</div>
            <div>Your EOA wallet controls this Smart Account</div>
            <div className="text-green-400/70 mt-1">
              EOA: <Address address={eoaAddress} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartAccountStatus;
