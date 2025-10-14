import { useState } from "react";
import { encodeFunctionData, formatEther, parseEther } from "viem";
import { useAccount, useBalance, useSendTransaction } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

export function useTbaBalance() {
  const { address: userAddress } = useAccount();
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  // Get TBA address from FoodScramble contract
  const { data: tbaAddress } = useScaffoldReadContract({
    contractName: "FoodScramble",
    functionName: "tbaList",
    args: [userAddress],
    query: {
      refetchInterval: 60000, // 60s - Token + subscriptions eliminate need for frequent polling
    },
    watch: false, // Disable continuous polling
  });

  // Get EOA balance
  const { data: eoaBalance, refetch: refetchEoaBalance } = useBalance({
    address: userAddress,
    query: {
      refetchInterval: 60000, // 60s - Token eliminates rate limiting
    },
  });

  // Get TBA balance
  const { data: tbaBalance, refetch: refetchTbaBalance } = useBalance({
    address: tbaAddress as `0x${string}`,
    query: {
      refetchInterval: 60000, // 60s - Token eliminates rate limiting
    },
  });

  // Contract write hooks
  const { writeContractAsync: executeFromTba } = useScaffoldWriteContract({
    contractName: "ERC6551Account",
  });
  const { sendTransactionAsync } = useSendTransaction();

  /**
   * 1. SEND ETH: EOA → TBA (Direct Transfer)
   * Kirim ETH dari wallet ke TBA account
   */
  const sendToTba = async (amount: string) => {
    if (!tbaAddress || !userAddress) {
      throw new Error("TBA address or user address not found");
    }

    if (!eoaBalance || parseEther(amount) > eoaBalance.value) {
      throw new Error("Insufficient wallet balance");
    }

    try {
      setIsSending(true);

      const txHash = await sendTransactionAsync({
        to: tbaAddress as `0x${string}`,
        value: parseEther(amount),
      });

      await Promise.all([refetchEoaBalance(), refetchTbaBalance()]);

      return {
        success: true,
        message: `Successfully sent ${amount} ETH to TBA`,
        txHash,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error?.shortMessage || error?.message || "Failed to send ETH to TBA",
      };
    } finally {
      setIsSending(false);
    }
  };

  /**
   * 2. WITHDRAW ETH: TBA → EOA via executeCall
   * Tarik ETH dari TBA ke wallet menggunakan executeCall
   */
  const withdrawToWallet = async (amount: string) => {
    if (!tbaAddress || !userAddress) {
      throw new Error("TBA address or user address not found");
    }

    if (!tbaBalance || parseEther(amount) > tbaBalance.value) {
      throw new Error("Insufficient TBA balance");
    }

    try {
      setIsWithdrawing(true);

      // Create calldata for simple ETH transfer (empty data)
      const callData = "0x";

      // Use executeCall to send ETH from TBA to user wallet
      const txHash = await executeFromTba({
        functionName: "executeCall",
        args: [
          userAddress, // target: user's wallet
          parseEther(amount), // value: amount to send
          callData, // data: empty for ETH transfer
        ],
      });

      await Promise.all([refetchEoaBalance(), refetchTbaBalance()]);

      return {
        success: true,
        message: `Successfully withdrew ${amount} ETH to wallet`,
        txHash,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error?.shortMessage || error?.message || "Failed to withdraw ETH",
      };
    } finally {
      setIsWithdrawing(false);
    }
  };

  /**
   * 3. EXECUTE ACTION: TBA calls another contract
   * Gunakan ETH di TBA untuk action ke contract lain
   */
  const executeAction = async (
    targetContract: string,
    targetAbi: any,
    functionName: string,
    args: any[] = [],
    ethValue: string = "0",
  ) => {
    if (!tbaAddress || !userAddress) {
      throw new Error("Required data not available");
    }

    // Check if TBA has enough balance for the action
    const requiredEth = parseEther(ethValue);
    if (requiredEth > 0n && (!tbaBalance || requiredEth > tbaBalance.value)) {
      throw new Error(`Insufficient TBA balance. Required: ${ethValue} ETH`);
    }

    try {
      setIsExecuting(true);

      // Encode the function call data
      const callData = encodeFunctionData({
        abi: targetAbi,
        functionName,
        args,
      });

      // Execute via TBA's executeCall function
      const txHash = await executeFromTba({
        functionName: "executeCall",
        args: [
          targetContract, // target contract address
          requiredEth, // ETH to send with the call
          callData, // encoded function data
        ],
      });

      await refetchTbaBalance();

      return {
        success: true,
        message: `Successfully executed ${functionName} on ${targetContract}`,
        txHash,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error?.shortMessage || error?.message || `Failed to execute ${functionName}`,
      };
    } finally {
      setIsExecuting(false);
    }
  };

  /**
   * HELPER: Execute FoodScramble game actions via TBA
   */

  /**
   * Get balance info
   */
  const getBalanceInfo = () => {
    return {
      wallet: {
        balance: eoaBalance ? formatEther(eoaBalance.value) : "0",
        formatted: eoaBalance ? `${formatEther(eoaBalance.value)} ${eoaBalance.symbol}` : "0 ETH",
        wei: eoaBalance?.value || 0n,
      },
      tba: {
        balance: tbaBalance ? formatEther(tbaBalance.value) : "0",
        formatted: tbaBalance ? `${formatEther(tbaBalance.value)} ${tbaBalance.symbol}` : "0 ETH",
        wei: tbaBalance?.value || 0n,
      },
    };
  };

  /**
   * Status checks
   */
  const isTbaReady = () => !!tbaAddress && tbaAddress !== "0x0000000000000000000000000000000000000000";
  const canWithdraw = () => isTbaReady() && tbaBalance && tbaBalance.value > 0n;
  const canSend = () => isTbaReady() && eoaBalance && eoaBalance.value > 0n;
  const canExecute = () => isTbaReady() && tbaBalance && tbaBalance.value > 0n;

  return {
    // Addresses and balances
    userAddress,
    tbaAddress,
    balanceInfo: getBalanceInfo(),

    // Status checks
    isTbaReady: isTbaReady(),
    canWithdraw: canWithdraw(),
    canSend: canSend(),
    canExecute: canExecute(),

    // Main functions
    sendToTba, // EOA → TBA
    withdrawToWallet, // TBA → EOA via executeCall
    executeAction, // TBA → Contract action

    // Loading states
    isWithdrawing,
    isSending,
    isExecuting,
    isLoading: isWithdrawing || isSending || isExecuting,

    // Refresh
    refetchBalances: () => Promise.all([refetchEoaBalance(), refetchTbaBalance()]),
  };
}
