import { useCallback, useEffect, useState } from "react";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { notification } from "~~/utils/scaffold-eth";

interface DelegationData {
  sessionKeyAddress: string;
  sessionKeyPrivateKey: string;
  delegationHash: string;
  smartAccountAddress: string;
  createdAt: number;
  validUntil: number;
}

export const useDelegationExecution = (smartAccountAddress?: string) => {
  const { targetNetwork } = useTargetNetwork();
  const [delegationData, setDelegationData] = useState<DelegationData | null>(null);
  const [isDelegationEnabled, setIsDelegationEnabled] = useState(false);

  // Listen for delegation event
  useEffect(() => {
    if (typeof window === "undefined" || !smartAccountAddress) return;

    const handleDelegationCreated = (event: Event) => {
      const customEvent = event as CustomEvent<DelegationData>;
      console.log("🎮 Delegation created event received:", customEvent.detail);
      setDelegationData(customEvent.detail);
      setIsDelegationEnabled(true);
      notification.success("✅ Delegation enabled! Game actions now use session key (no wallet signatures needed).");
    };

    const handleDelegationRestored = (event: Event) => {
      const customEvent = event as CustomEvent<DelegationData>;
      console.log("🔄 Delegation restored event received:", customEvent.detail);
      setDelegationData(customEvent.detail);
      setIsDelegationEnabled(true);
    };

    const handleDelegationCleared = () => {
      console.log("🔴 Delegation cleared");
      setDelegationData(null);
      setIsDelegationEnabled(false);
      if (smartAccountAddress) {
        localStorage.removeItem(`delegation_${smartAccountAddress}`);
      }
    };

    window.addEventListener("delegationCreated", handleDelegationCreated as EventListener);
    window.addEventListener("delegationRestored", handleDelegationRestored as EventListener);
    window.addEventListener("delegationCleared", handleDelegationCleared);

    // Check localStorage on mount
    const stored = localStorage.getItem(`delegation_${smartAccountAddress}`);
    if (stored) {
      try {
        const data = JSON.parse(stored) as DelegationData;
        if (data.validUntil > Date.now()) {
          setDelegationData(data);
          setIsDelegationEnabled(true);
          console.log("✅ Delegation loaded from localStorage");
        }
      } catch (error) {
        console.error("Failed to load delegation:", error);
      }
    }

    return () => {
      window.removeEventListener("delegationCreated", handleDelegationCreated as EventListener);
      window.removeEventListener("delegationRestored", handleDelegationRestored as EventListener);
      window.removeEventListener("delegationCleared", handleDelegationCleared);
    };
  }, [smartAccountAddress]);

  // Execute delegated transaction using session key via Smart Account
  const executeDelegatedTransaction = useCallback(
    async (to: string, data: string, value: string = "0"): Promise<string | false> => {
      if (!delegationData || !isDelegationEnabled || !delegationData.sessionKeyPrivateKey || !smartAccountAddress) {
        console.warn("❌ Delegation execution not available:", {
          hasDelegationData: !!delegationData,
          isDelegationEnabled,
          hasSessionKey: !!delegationData?.sessionKeyPrivateKey,
          hasSmartAccount: !!smartAccountAddress,
        });
        return false;
      }

      try {
        // Import required modules
        const { createWalletClient, createPublicClient, http } = await import("viem");
        const { privateKeyToAccount } = await import("viem/accounts");
        const { createBundlerClient, createPaymasterClient } = await import("viem/account-abstraction");
        const { toMetaMaskSmartAccount, Implementation } = await import("@metamask/delegation-toolkit");

        // Guard: ensure smartAccountAddress is well-formed
        if (!smartAccountAddress || typeof smartAccountAddress !== "string" || !smartAccountAddress.startsWith("0x")) {
          throw new Error("Invalid smartAccountAddress for MetaMask Smart Account setup");
        }

        // Get network configuration from Scaffold-ETH
        const chainId = targetNetwork.id;

        // Get RPC URL from chain config
        const rpcUrl = targetNetwork.rpcUrls?.default?.http?.[0] || targetNetwork.rpcUrls?.public?.http?.[0];
        if (!rpcUrl) {
          throw new Error(`No RPC URL configured for ${targetNetwork.name}`);
        }

        // Get Pimlico bundler URL
        const pimlicoApiKey = process.env.NEXT_PUBLIC_PIMLICO_API_KEY;
        if (!pimlicoApiKey) {
          throw new Error(
            `Pimlico API key required for ${targetNetwork.name}. ` + "Set NEXT_PUBLIC_PIMLICO_API_KEY in .env",
          );
        }

        const bundlerUrl = `https://api.pimlico.io/v2/${chainId}/rpc?apikey=${pimlicoApiKey}`;

        console.log("🎮 Delegation execution config:", {
          network: targetNetwork.name,
          chainId,
          rpcUrl: rpcUrl.split("/").slice(0, 3).join("/") + "/...",
          bundlerUrl: bundlerUrl.split("?")[0] + "?apikey=...",
          to,
          smartAccountAddress,
        });

        // Create session key account
        const sessionAccount = privateKeyToAccount(delegationData.sessionKeyPrivateKey as `0x${string}`);

        // Create session key wallet client
        const sessionWalletClient = createWalletClient({
          account: sessionAccount,
          transport: http(rpcUrl),
        });

        // Create public client
        const publicClient = createPublicClient({
          transport: http(rpcUrl),
        });

        // Create bundler and paymaster clients
        const bundlerClient = createBundlerClient({
          client: publicClient,
          transport: http(bundlerUrl),
        });

        const paymasterClient = createPaymasterClient({
          transport: http(bundlerUrl),
        });

        // Create smart account with session key as signer
        const smartAccount = await toMetaMaskSmartAccount({
          client: publicClient,
          implementation: Implementation.Hybrid,
          address: smartAccountAddress as `0x${string}`,
          signer: { walletClient: sessionWalletClient },
        });

        console.log("🎮 Smart Account created with session key:", {
          smartAccountAddress: smartAccount.address,
          sessionKeyAddress: sessionAccount.address,
        });

        // Execute transaction via session key with delegation
        console.log("🎮 Executing delegated transaction...");

        // Check if we have signed delegation
        const signedDelegation = (delegationData as any).signedDelegation;

        const userOperationHash = await bundlerClient.sendUserOperation({
          account: smartAccount,
          calls: [
            {
              to: to as `0x${string}`,
              data: data as `0x${string}`,
              value: BigInt(value),
            },
          ],
          paymaster: paymasterClient,
          paymasterContext: {
            chainId: chainId,
          },
          // Include delegation if available
          ...(signedDelegation && { delegation: signedDelegation }),
        });

        console.log("✅ Session key transaction successful:", userOperationHash);
        notification.success("🎮 Transaction executed via session key!");
        return userOperationHash as string;
      } catch (error: any) {
        console.error("❌ Delegated transaction failed:", {
          error: error.message,
          stack: error.stack,
          code: error.code,
          details: error.details,
        });

        // Provide more specific error messages
        let errorMessage = "Delegated transaction failed";
        if (error.message?.includes("Pimlico")) {
          errorMessage = "Bundler service error. Check Pimlico API key and network support.";
        } else if (error.message?.includes("RPC")) {
          errorMessage = "RPC connection error. Check network configuration.";
        } else if (error.message?.includes("delegation")) {
          errorMessage = "Delegation error. Try re-creating delegation.";
        } else {
          errorMessage = error.message || "Unknown error";
        }

        notification.error(`❌ ${errorMessage}`);
        return false;
      }
    },
    [delegationData, isDelegationEnabled, smartAccountAddress, targetNetwork],
  );

  // Check if delegation should be used (just check flag, execution will be done by original handlers)
  const shouldUseDelegation = useCallback(() => {
    if (!delegationData || !isDelegationEnabled) {
      return false;
    }

    // Delegation mode is active - transactions will be executed WITHOUT wallet signature
    // The session key will be used automatically by MetaMask Delegation Toolkit
    console.log("✅ Delegation mode active - using session key for execution");
    notification.info("🎮 Executing action via delegation (no signature needed)...");
    return true;
  }, [delegationData, isDelegationEnabled]);

  return {
    isDelegationEnabled,
    delegationData,
    shouldUseDelegation,
    executeDelegatedTransaction,
  };
};
