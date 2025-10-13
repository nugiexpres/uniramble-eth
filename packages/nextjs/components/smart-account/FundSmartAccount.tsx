"use client";

import { useCallback, useState } from "react";
import { Implementation, toMetaMaskSmartAccount } from "@metamask/delegation-toolkit";
import { ArrowDown, ArrowUp, ArrowUpDown, Loader2, Lock } from "lucide-react";
import { createPublicClient, http, parseEther } from "viem";
import { createBundlerClient, createPaymasterClient } from "viem/account-abstraction";
import { useAccount, useBalance, useWalletClient } from "wagmi";
import { WalletConnectionWarning } from "~~/components/scaffold-eth";
import { getBundlerConfig } from "~~/config/bundler";
import { useSmartAccountContext } from "~~/contexts/SmartAccountContext";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { useFinalSmartAccount } from "~~/hooks/smart-account/useFinalSmartAccount";
import { notification } from "~~/utils/scaffold-eth";

export const FundSmartAccount = () => {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { targetNetwork } = useTargetNetwork();
  const { isDeployed, smartAccountAddress } = useFinalSmartAccount();
  // Smart account context (must be unconditional)
  const { isSmartAccountDeployed: contextSmartAccountDeployed, smartAccountAddress: contextSmartAccountAddress } =
    useSmartAccountContext();

  const { data: eoaBalance } = useBalance({
    address: address,
  });
  const { data: smartAccountBalance } = useBalance({
    address: smartAccountAddress as `0x${string}`,
    query: {
      enabled: !!smartAccountAddress,
    },
  });

  const [amount, setAmount] = useState("0");
  const [isLoading, setIsLoading] = useState(false);
  const [direction, setDirection] = useState<"to" | "from">("to"); // "to" = EOA->Smart Account, "from" = Smart Account->EOA

  // Setup clients for gasless operations
  const setupClients = useCallback(() => {
    if (typeof window === "undefined" || !address || !isDeployed) return null;

    if (!process.env.NEXT_PUBLIC_ZERODEV_PROJECT_ID) {
      console.error("ZeroDev project ID not configured");
      return null;
    }

    try {
      const chainId = targetNetwork.id;
      const bundlerConfig = getBundlerConfig(chainId);

      const publicClient = createPublicClient({
        chain: targetNetwork,
        transport: http(bundlerConfig.rpcUrl),
      });

      const bundlerClient = createBundlerClient({
        client: publicClient,
        transport: http(bundlerConfig.bundlerUrl),
      });

      const paymasterClient = createPaymasterClient({
        transport: http(bundlerConfig.bundlerUrl),
      });

      return { publicClient, bundlerClient, paymasterClient };
    } catch (error) {
      console.error("Failed to setup clients:", error);
      return null;
    }
  }, [address, isDeployed, targetNetwork]);

  const formatBalance = (balance: bigint | undefined) => {
    if (!balance) return `0.0000 ${targetNetwork.nativeCurrency.symbol}`;
    const eth = Number(balance) / 1e18;
    return `${eth.toFixed(4)} ${targetNetwork.nativeCurrency.symbol}`;
  };

  // Gasless transaction from Smart Account to EOA
  const sendGaslessTransaction = useCallback(
    async (to: string, value: string) => {
      if (!isConnected || !address || !smartAccountAddress || !isDeployed) {
        notification.error("Smart account not available");
        return false;
      }

      if (!walletClient) {
        notification.error("Wallet client not available");
        return false;
      }

      try {
        const clients = setupClients();
        if (!clients) {
          throw new Error("Failed to setup clients");
        }

        const { publicClient, bundlerClient, paymasterClient } = clients;

        // Create MetaMask Smart Account instance using Hybrid implementation
        const smartAccountInstance = await toMetaMaskSmartAccount({
          client: publicClient,
          implementation: Implementation.Hybrid,
          address: smartAccountAddress as `0x${string}`,
          signer: { walletClient: walletClient },
        });

        // Get current nonce using MetaMask Smart Account's getNonce method
        let nonce;
        try {
          nonce = await smartAccountInstance.getNonce();
          console.log("Smart Account nonce for withdrawal:", nonce);
        } catch (nonceErr) {
          console.error("Failed to read Smart Account nonce for withdrawal:", nonceErr);
          notification.error("Unable to read Smart Account nonce (network error)");
          return false;
        }

        // Prepare user operation with proper nonce handling
        const userOperation = await bundlerClient.prepareUserOperation({
          account: smartAccountInstance,
          calls: [
            {
              to: to as `0x${string}`,
              value: parseEther(value),
            },
          ],
          paymaster: paymasterClient,
        });

        // Update nonce in user operation
        const userOperationWithNonce = {
          ...userOperation,
          nonce: nonce,
        };

        // Sign the user operation
        const signature = await smartAccountInstance.signUserOperation(userOperationWithNonce);

        // Send the user operation
        const userOperationHash = await bundlerClient.sendUserOperation({
          ...userOperationWithNonce,
          signature: signature,
        });

        console.log("Gasless withdrawal successful! UserOperation Hash:", userOperationHash);
        return userOperationHash;
      } catch (error: any) {
        console.error("Gasless withdrawal failed:", error);
        throw error;
      }
    },
    [isConnected, address, smartAccountAddress, isDeployed, walletClient, setupClients],
  );

  const handleFund = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      notification.error("Please enter a valid amount");
      return;
    }

    if (!isDeployed || !smartAccountAddress) {
      notification.error("Smart Account not deployed");
      return;
    }

    if (!walletClient) {
      notification.error("Wallet client not available");
      return;
    }

    setIsLoading(true);

    try {
      if (direction === "to") {
        // EOA -> Smart Account (normal transaction)
        const txHash = await walletClient.sendTransaction({
          to: smartAccountAddress as `0x${string}`,
          value: parseEther(amount),
        });

        if (txHash) {
          notification.success("Funds sent to Smart Account!");
          console.log("Normal transaction hash:", txHash);
        }
      } else {
        // Smart Account -> EOA (gasless transaction)
        const txHash = await sendGaslessTransaction(address!, amount);

        if (txHash) {
          notification.success("Funds withdrawn from Smart Account!");
          console.log("Gasless withdrawal hash:", txHash);
        }
      }
    } catch (error) {
      console.error("Funding failed:", error);
      notification.error("Failed to process funding transaction");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <WalletConnectionWarning className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-600/30" />
    );
  }

  // Check if Smart Account exists in context even if not deployed
  const hasSmartAccount = isDeployed || (contextSmartAccountDeployed && contextSmartAccountAddress);

  if (!hasSmartAccount) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-yellow-500/30 p-4 text-center">
        <Lock className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
        <h3 className="text-lg font-bold text-yellow-300 mb-2">Fund Account Locked</h3>
        <p className="text-yellow-200 text-sm mb-3">Deploy Smart Account first to unlock funding features</p>
        <div className="text-xs text-slate-400">
          Go to <strong>Account</strong> tab to deploy your Smart Account
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-cyan-500/30 p-2">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-5 h-5 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-lg flex items-center justify-center">
          <ArrowUpDown className="w-3 h-3 text-black" />
        </div>
        <h3 className="text-sm font-bold text-cyan-300">Fund Smart Account</h3>
      </div>

      {/* Direction Toggle */}
      <div className="flex bg-slate-700/50 rounded-lg p-0.5 mb-2">
        <button
          onClick={() => setDirection("to")}
          className={`flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-md text-xs font-medium transition-all cursor-pointer ${
            direction === "to"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30"
              : "text-slate-400 hover:text-slate-300"
          }`}
        >
          <ArrowDown className="w-3 h-3" />
          EOA → Smart
        </button>
        <button
          onClick={() => setDirection("from")}
          className={`flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-md text-xs font-medium transition-all cursor-pointer ${
            direction === "from"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30"
              : "text-slate-400 hover:text-slate-300"
          }`}
        >
          <ArrowUp className="w-3 h-3" />
          Smart → EOA
        </button>
      </div>

      {/* Balances */}
      <div className="grid grid-cols-2 gap-1.5 mb-2">
        <div className="bg-slate-700/30 rounded-lg p-1.5">
          <div className="text-xs text-slate-400 mb-0.5">EOA</div>
          <div className="text-xs font-bold text-white">{formatBalance(eoaBalance?.value)}</div>
        </div>
        <div className="bg-slate-700/30 rounded-lg p-1.5">
          <div className="text-xs text-slate-400 mb-0.5">Smart</div>
          <div className="text-xs font-bold text-cyan-300">{formatBalance(smartAccountBalance?.value)}</div>
        </div>
      </div>

      {/* Amount Input */}
      <div className="mb-2">
        <label className="block text-xs text-slate-300 mb-1">Amount ({targetNetwork.nativeCurrency.symbol})</label>
        <input
          type="number"
          step="0.001"
          placeholder="0.0"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-2 py-1.5 text-white placeholder-slate-400 focus:border-cyan-400/50 focus:outline-none text-xs"
        />
      </div>

      {/* Fund Button */}
      <button
        onClick={handleFund}
        disabled={isLoading || !amount || parseFloat(amount) <= 0}
        className={`w-full py-1.5 px-2 rounded-lg font-medium text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
          isLoading || !amount || parseFloat(amount) <= 0
            ? "bg-slate-600/50 text-slate-400 cursor-not-allowed"
            : "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg hover:shadow-cyan-500/25"
        }`}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-3 h-3 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            {direction === "to" ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />}
            {direction === "to" ? "Send to Smart" : "Withdraw to EOA"}
          </>
        )}
      </button>

      {/* Info */}
      <div className="mt-3 text-xs text-slate-400 text-center">
        {direction === "to"
          ? "Regular transaction from EOA to Smart Account"
          : "Gasless transaction from Smart Account to EOA"}
      </div>
    </div>
  );
};
