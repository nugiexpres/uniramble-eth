import { useCallback, useState } from "react";
import { useFinalSmartAccount } from "./useFinalSmartAccount";
import { hashMessage, recoverAddress } from "viem";
import { useAccount, useSignMessage } from "wagmi";

interface VerificationState {
  isVerifying: boolean;
  isVerified: boolean;
  verificationMessage: string | null;
  verificationSignature: string | null;
  error: string | null;
}

interface VerificationData {
  eoaAddress: string;
  smartAccountAddress: string;
  timestamp: number;
  domain: string;
  nonce: string;
}

export const useSmartAccountVerification = () => {
  const { address: eoaAddress } = useAccount();
  const { smartAccountAddress } = useFinalSmartAccount();
  const { signMessageAsync, isPending: isSigning } = useSignMessage();

  const [state, setState] = useState<VerificationState>({
    isVerifying: false,
    isVerified: false,
    verificationMessage: null,
    verificationSignature: null,
    error: null,
  });

  // Generate secure verification message
  const generateVerificationMessage = useCallback((data: VerificationData): string => {
    const message = `
🔐 Smart Account Ownership Verification

EOA Address: ${data.eoaAddress}
Smart Account: ${data.smartAccountAddress}
Domain: ${data.domain}
Timestamp: ${data.timestamp}
Nonce: ${data.nonce}

This signature proves that you control the EOA wallet that owns this Smart Account. This is a secure verification process and no funds will be transferred.

By signing this message, you confirm:
✅ You own the EOA wallet ${data.eoaAddress}
✅ You control the Smart Account ${data.smartAccountAddress}
✅ You understand this is a verification signature only

⚠️ Never sign this message on untrusted websites!
    `.trim();

    return message;
  }, []);

  // Verify ownership with secure signature
  const verifyOwnership = useCallback(async (): Promise<boolean> => {
    console.log("🔐 verifyOwnership called with:", {
      eoaAddress,
      smartAccountAddress,
      hasSignMessage: !!signMessageAsync,
    });

    if (!eoaAddress || !smartAccountAddress) {
      const error = "Missing EOA or Smart Account address";
      console.error("❌ Verification failed:", error);
      setState(prev => ({
        ...prev,
        error,
        isVerifying: false,
      }));
      return false;
    }

    try {
      setState(prev => ({
        ...prev,
        isVerifying: true,
        error: null,
      }));

      // Generate verification data
      const verificationData: VerificationData = {
        eoaAddress,
        smartAccountAddress,
        timestamp: Date.now(),
        domain: window.location.hostname,
        nonce: Math.random().toString(36).substring(2, 15),
      };

      // Generate message
      const message = generateVerificationMessage(verificationData);

      // Store message for later verification
      setState(prev => ({
        ...prev,
        verificationMessage: message,
      }));

      // Sign the message
      console.log("🔐 Requesting ownership verification signature from wallet...");
      console.log("📝 Message to sign:", message.substring(0, 100) + "...");

      const signature = await signMessageAsync({
        message,
      });

      console.log("✅ Signature received:", signature.substring(0, 20) + "...");

      // Verify signature
      const recoveredAddress = await recoverAddress({
        hash: hashMessage(message),
        signature,
      });

      // Check if signature is valid
      if (recoveredAddress.toLowerCase() !== eoaAddress.toLowerCase()) {
        throw new Error("Signature verification failed");
      }

      // Store verification data
      setState(prev => ({
        ...prev,
        isVerifying: false,
        isVerified: true,
        verificationSignature: signature,
        error: null,
      }));

      // Store in session storage for persistence
      if (typeof window !== "undefined") {
        const verificationData = {
          eoaAddress,
          smartAccountAddress,
          signature,
          timestamp: Date.now(),
          message,
        };
        sessionStorage.setItem(`smart-account-verification-${smartAccountAddress}`, JSON.stringify(verificationData));
      }

      console.log("✅ Smart Account ownership verified successfully!");
      return true;
    } catch (error: any) {
      console.error("❌ Ownership verification failed:", error);

      // Detect user rejection
      const isUserRejection =
        error.message?.includes("rejected") ||
        error.message?.includes("denied") ||
        error.message?.includes("User rejected") ||
        error.code === 4001 || // MetaMask rejection code
        error.code === "ACTION_REJECTED";

      const errorMessage = isUserRejection
        ? "User rejected the verification signature"
        : error.message || "Verification failed";

      console.log("Error details:", {
        message: error.message,
        code: error.code,
        name: error.name,
        isUserRejection,
      });

      setState(prev => ({
        ...prev,
        isVerifying: false,
        isVerified: false,
        error: errorMessage,
      }));

      return false;
    }
  }, [eoaAddress, smartAccountAddress, signMessageAsync, generateVerificationMessage]);

  // Check if already verified
  const checkExistingVerification = useCallback((): boolean => {
    if (!smartAccountAddress || typeof window === "undefined") return false;

    try {
      const stored = sessionStorage.getItem(`smart-account-verification-${smartAccountAddress}`);
      if (!stored) return false;

      const verificationData = JSON.parse(stored);
      const now = Date.now();
      const verificationAge = now - verificationData.timestamp;

      // Verification valid for 24 hours
      if (verificationAge > 24 * 60 * 60 * 1000) {
        sessionStorage.removeItem(`smart-account-verification-${smartAccountAddress}`);
        return false;
      }

      // Restore verification state
      setState(prev => ({
        ...prev,
        isVerified: true,
        verificationSignature: verificationData.signature,
        verificationMessage: verificationData.message,
      }));

      console.log("✅ Using existing verification");
      return true;
    } catch (error) {
      console.error("Error checking existing verification:", error);
      return false;
    }
  }, [smartAccountAddress]);

  // Clear verification
  const clearVerification = useCallback(() => {
    setState({
      isVerifying: false,
      isVerified: false,
      verificationMessage: null,
      verificationSignature: null,
      error: null,
    });

    if (smartAccountAddress && typeof window !== "undefined") {
      sessionStorage.removeItem(`smart-account-verification-${smartAccountAddress}`);
    }
  }, [smartAccountAddress]);

  // Get verification status message
  const getVerificationStatus = useCallback((): string => {
    if (state.isVerifying) return "Verifying ownership...";
    if (state.isVerified) return "✅ Smart Account Connected";
    if (state.error) return `❌ ${state.error}`;
    return "⚠️ Ownership verification required";
  }, [state.isVerifying, state.isVerified, state.error]);

  return {
    // State
    isVerifying: state.isVerifying,
    isVerified: state.isVerified,
    isSigning,
    error: state.error,
    verificationMessage: state.verificationMessage,
    verificationSignature: state.verificationSignature,
    verificationStatus: getVerificationStatus(),

    // Actions
    verifyOwnership,
    checkExistingVerification,
    clearVerification,
    getVerificationStatus,

    // Computed
    canVerify: !state.isVerifying && !state.isVerified && !!eoaAddress && !!smartAccountAddress,
  };
};
