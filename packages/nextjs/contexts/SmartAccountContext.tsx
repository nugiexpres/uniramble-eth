"use client";

import { ReactNode, createContext, useContext, useEffect, useState } from "react";
import { usePublicClient, useWalletClient } from "wagmi";
import { useMetaMask } from "~~/providers/MetaMaskProvider";

interface SmartAccountContextType {
  // Smart Account state
  isSmartAccountDeployed: boolean;
  setIsSmartAccountDeployed: (deployed: boolean) => void;

  // Smart Account login state
  isSmartAccountLoggedIn: boolean;
  setIsSmartAccountLoggedIn: (loggedIn: boolean) => void;

  // Smart Account address
  smartAccountAddress: string | null;
  setSmartAccountAddress: (address: string | null) => void;

  // TBA state
  shouldShowCreateTBA: boolean;
  setShouldShowCreateTBA: (show: boolean) => void;

  // Refresh functions
  refreshCreateTBA: () => void;
  setRefreshCreateTBA: (fn: () => void) => void;

  // Login modal state
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;

  // Reset functions
  resetSmartAccountState: () => void;

  // Smart Account operations
  deploySmartAccount: () => Promise<void>;
  createTokenBoundAccount: (nftContractAddress: string, tokenId: number) => Promise<string>;
}

const SmartAccountContext = createContext<SmartAccountContextType | undefined>(undefined);

export const useSmartAccountContext = () => {
  const context = useContext(SmartAccountContext);
  if (!context) {
    // Return default values when not within provider
    return {
      isSmartAccountDeployed: false,
      setIsSmartAccountDeployed: () => {},
      isSmartAccountLoggedIn: false,
      setIsSmartAccountLoggedIn: () => {},
      smartAccountAddress: null,
      setSmartAccountAddress: () => {},
      shouldShowCreateTBA: false,
      setShouldShowCreateTBA: () => {},
      refreshCreateTBA: () => {},
      setRefreshCreateTBA: () => {},
      showLoginModal: false,
      setShowLoginModal: () => {},
      resetSmartAccountState: () => {},
      isContextAvailable: false,
      deploySmartAccount: async () => {},
      createTokenBoundAccount: async () => "",
    };
  }
  return { ...context, isContextAvailable: true };
};

interface SmartAccountProviderProps {
  children: ReactNode;
}

export const SmartAccountProvider = ({ children }: SmartAccountProviderProps) => {
  const { provider, connectedAccount } = useMetaMask();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [isSmartAccountDeployed, setIsSmartAccountDeployed] = useState(false);
  const [isSmartAccountLoggedIn, setIsSmartAccountLoggedIn] = useState(false);
  const [smartAccountAddress, setSmartAccountAddress] = useState<string | null>(null);
  const [shouldShowCreateTBA, setShouldShowCreateTBA] = useState(false);
  const [refreshCreateTBA, setRefreshCreateTBA] = useState<() => void>(() => {});
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Check Smart Account status when account changes
  useEffect(() => {
    const checkSmartAccountStatus = async () => {
      if (!connectedAccount || !provider) {
        resetSmartAccountState();
        return;
      }

      try {
        // Check if user has a deployed smart account
        const hasSmartAccount = await provider.request({
          method: "eth_getCode",
          params: [connectedAccount, "latest"],
        });

        setIsSmartAccountDeployed(hasSmartAccount !== "0x");
      } catch (err) {
        console.error("Error checking smart account status:", err);
      }
    };

    checkSmartAccountStatus();
  }, [connectedAccount, provider]);

  // Reset function to clear all Smart Account state
  const resetSmartAccountState = () => {
    setIsSmartAccountDeployed(false);
    setIsSmartAccountLoggedIn(false);
    setSmartAccountAddress(null);
    setShouldShowCreateTBA(false);
    setShowLoginModal(false);
  };

  // Deploy a new Smart Account
  const deploySmartAccount = async () => {
    if (!connectedAccount || !provider || !walletClient) {
      throw new Error("Not connected to MetaMask");
    }

    try {
      // Use the smart account factory to deploy
      const deployTx = await provider.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: connectedAccount,
            // Add your smart account factory deployment transaction here
          },
        ],
      });

      // Wait for deployment
      if (!publicClient) throw new Error("Public client not available");

      const receipt = await publicClient.waitForTransactionReceipt({
        hash: deployTx as `0x${string}`,
      });

      if (!receipt.contractAddress) {
        throw new Error("No contract address in receipt");
      }

      setIsSmartAccountDeployed(true);
      setSmartAccountAddress(receipt.contractAddress);
    } catch (err) {
      console.error("Error deploying smart account:", err);
      throw err;
    }
  };

  // Create a Token Bound Account for an NFT
  const createTokenBoundAccount = async (nftContract: string, tokenId: number) => {
    if (!connectedAccount || !provider || !walletClient || !publicClient) {
      throw new Error("Not connected to MetaMask or missing client");
    }

    try {
      const registryAddress = "0x"; // TODO: Get from config

      // Encode registry createAccount call with contract/token params
      const data = `0x${nftContract.slice(2)}${tokenId.toString(16).padStart(64, "0")}`; // TODO: Encode properly

      const createTx = await provider.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: connectedAccount,
            to: registryAddress,
            data,
          },
        ],
      });

      const receipt = await publicClient.waitForTransactionReceipt({
        hash: createTx as `0x${string}`,
      });

      // TODO: Add proper AccountCreated event topic
      const accountCreatedEvent = receipt.logs.find(log => log.topics[0] === "0x");

      if (!accountCreatedEvent) {
        throw new Error("Could not find account created event");
      }

      const tbaAddress = "0x"; // TODO: Decode event data
      return tbaAddress;
    } catch (err) {
      console.error("Error creating token bound account:", err);
      throw err;
    }
  };

  const value = {
    isSmartAccountDeployed,
    setIsSmartAccountDeployed,
    isSmartAccountLoggedIn,
    setIsSmartAccountLoggedIn,
    smartAccountAddress,
    setSmartAccountAddress,
    shouldShowCreateTBA,
    setShouldShowCreateTBA,
    refreshCreateTBA,
    setRefreshCreateTBA,
    showLoginModal,
    setShowLoginModal,
    resetSmartAccountState,
    deploySmartAccount,
    createTokenBoundAccount,
  };

  return <SmartAccountContext.Provider value={value}>{children}</SmartAccountContext.Provider>;
};
