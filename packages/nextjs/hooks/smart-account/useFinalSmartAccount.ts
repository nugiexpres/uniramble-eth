import { useCallback, useEffect, useState } from "react";
import { Implementation, toMetaMaskSmartAccount } from "@metamask/delegation-toolkit";
import { http } from "viem";
import { createBundlerClient, createPaymasterClient } from "viem/account-abstraction";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { getBundlerConfig } from "~~/config/bundler";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";

interface FinalSmartAccountState {
  smartAccountAddress: string | null;
  isDeployed: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useFinalSmartAccount = () => {
  const { address: eoaAddress, isConnected } = useAccount();
  const { targetNetwork } = useTargetNetwork();
  const publicClient = usePublicClient({ chainId: targetNetwork.id });
  const { data: walletClient } = useWalletClient({ chainId: targetNetwork.id });

  const [state, setState] = useState<FinalSmartAccountState>({
    smartAccountAddress: null,
    isDeployed: false,
    isLoading: false,
    error: null,
  });

  // 🎯 CREATE AND DEPLOY SMART ACCOUNT
  const createAndDeploySmartAccount = useCallback(async (): Promise<boolean> => {
    if (!eoaAddress || !walletClient || !publicClient) {
      console.error("❌ Missing required clients or address");
      setState(prev => ({
        ...prev,
        error: "Missing required clients or address",
        isLoading: false,
      }));
      return false;
    }

    try {
      console.log("🚀 Creating Smart Account...");
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Get bundler config
      const chainId = targetNetwork.id;
      const bundlerConfig = getBundlerConfig(chainId);

      // Create bundler client
      const bundlerClient = createBundlerClient({
        client: publicClient,
        transport: http(bundlerConfig.bundlerUrl),
      });

      // Create paymaster client
      const paymasterClient = createPaymasterClient({
        transport: http(bundlerConfig.paymasterUrl),
      });

      // Create MetaMask Smart Account
      const smartAccount = await toMetaMaskSmartAccount({
        client: publicClient,
        implementation: Implementation.Hybrid,
        deployParams: [eoaAddress as `0x${string}`, [], [], []],
        deploySalt: "0x",
        signer: { walletClient },
      });

      const smartAccountAddress = smartAccount.address;
      console.log("✅ Smart Account address:", smartAccountAddress);

      // Check if already deployed
      const code = await publicClient.getBytecode({ address: smartAccountAddress as `0x${string}` });
      const isDeployed = !!code && code !== "0x";

      if (!isDeployed) {
        console.log("📝 Deploying Smart Account...");

        // Deploy via User Operation
        const userOpHash = await bundlerClient.sendUserOperation({
          account: smartAccount,
          calls: [
            {
              to: smartAccountAddress as `0x${string}`,
              value: 0n,
              data: "0x",
            },
          ],
          paymaster: paymasterClient,
        });

        console.log("⏳ Waiting for deployment... UserOp Hash:", userOpHash);

        // Wait for receipt
        const receipt = await bundlerClient.waitForUserOperationReceipt({
          hash: userOpHash,
        });

        console.log("✅ Smart Account deployed! Receipt:", receipt);
      } else {
        console.log("✅ Smart Account already deployed");
      }

      // Update state
      setState({
        smartAccountAddress,
        isDeployed: true,
        isLoading: false,
        error: null,
      });

      // Save to localStorage
      if (typeof window !== "undefined") {
        const stateData = {
          smartAccountAddress,
          eoaAddress,
          isDeployed: true,
          timestamp: Date.now(),
          version: "2.0",
        };
        const mappingKey = `sa_state_${eoaAddress}`;
        localStorage.setItem(mappingKey, JSON.stringify(stateData));
        localStorage.setItem(`sa_mapping_${eoaAddress}`, mappingKey);
      }

      return true;
    } catch (error: any) {
      console.error("❌ Failed to create Smart Account:", error);

      const errorMessage = error.message || "Failed to create Smart Account";
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));

      return false;
    }
  }, [eoaAddress, walletClient, publicClient, targetNetwork]);

  // 🎯 RESTORE FROM STORAGE ON MOUNT
  useEffect(() => {
    if (!isConnected || !eoaAddress) return;

    const restoreFromStorage = () => {
      if (typeof window === "undefined") return;

      const mappingKey = localStorage.getItem(`sa_mapping_${eoaAddress}`);
      if (!mappingKey) return;

      const savedState = localStorage.getItem(mappingKey);
      if (!savedState) return;

      try {
        const stateData = JSON.parse(savedState);

        // Validate saved state
        if (stateData?.smartAccountAddress && stateData?.eoaAddress === eoaAddress) {
          const expirationTime = 30 * 24 * 60 * 60 * 1000; // 30 days
          const isStateValid = Date.now() - (stateData?.timestamp || 0) < expirationTime;

          if (isStateValid) {
            console.log("♻️ Restoring Smart Account from storage:", stateData.smartAccountAddress);
            setState({
              smartAccountAddress: stateData.smartAccountAddress,
              isDeployed: stateData.isDeployed || false,
              isLoading: false,
              error: null,
            });
          } else {
            console.log("⏰ Smart Account state expired, clearing...");
            localStorage.removeItem(mappingKey);
            localStorage.removeItem(`sa_mapping_${eoaAddress}`);
          }
        }
      } catch (error) {
        console.error("❌ Failed to restore Smart Account state:", error);
      }
    };

    restoreFromStorage();
  }, [isConnected, eoaAddress]);

  return {
    smartAccountAddress: state.smartAccountAddress,
    isDeployed: state.isDeployed,
    isLoading: state.isLoading,
    error: state.error,
    createAndDeploySmartAccount,
  };
};
