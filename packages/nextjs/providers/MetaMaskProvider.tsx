"use client";

import { ReactNode, createContext, useContext, useEffect, useState } from "react";
import type { MetaMaskInpageProvider } from "@metamask/providers";
import MetaMaskSDK, { MetaMaskSDKOptions } from "@metamask/sdk";

interface MetaMaskProviderProps {
  children: ReactNode;
}

interface MetaMaskContextType {
  // Smart Account state
  isSmartAccountDeployed: boolean;
  setIsSmartAccountDeployed: (deployed: boolean) => void;

  // Smart Account login state
  isSmartAccountLoggedIn: boolean;
  setIsSmartAccountLoggedIn: (loggedIn: boolean) => void;

  // Smart Account address
  smartAccountAddress: string | null;
  setSmartAccountAddress: (address: string | null) => void;

  // SDK instance
  sdk: MetaMaskSDK | null;

  // Provider instance (ethereum)
  provider: MetaMaskInpageProvider | null;

  // Connection state
  isConnecting: boolean;
  error: Error | null;

  // Account state
  connectedAccount: string | null;

  // Connect functions
  connectMetaMask: () => Promise<void>;
  disconnectMetaMask: () => Promise<void>;
}

const MetaMaskContext = createContext<MetaMaskContextType | undefined>(undefined);

export const useMetaMask = () => {
  const context = useContext(MetaMaskContext);
  if (!context) {
    throw new Error("useMetaMask must be used within a MetaMaskProvider");
  }
  return context;
};

const getMetaMaskSDKOptions = (): MetaMaskSDKOptions => ({
  dappMetadata: {
    name: "UniRamble",
    url: typeof window !== "undefined" ? window.location.href : "https://app.uniramble.xyz",
  },
  checkInstallationImmediately: false,
  extensionOnly: false,
});

export const MetaMaskProvider = ({ children }: MetaMaskProviderProps) => {
  const [sdk, setSDK] = useState<MetaMaskSDK | null>(null);
  const [provider, setProvider] = useState<MetaMaskInpageProvider | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [connectedAccount, setConnectedAccount] = useState<string | null>(null);

  // Smart Account state
  const [isSmartAccountDeployed, setIsSmartAccountDeployed] = useState(false);
  const [isSmartAccountLoggedIn, setIsSmartAccountLoggedIn] = useState(false);
  const [smartAccountAddress, setSmartAccountAddress] = useState<string | null>(null);

  // Initialize SDK
  useEffect(() => {
    const initSDK = async () => {
      try {
        const sdk = new MetaMaskSDK(getMetaMaskSDKOptions());
        setSDK(sdk);
        const provider = sdk.getProvider();
        setProvider((provider as unknown as MetaMaskInpageProvider) || null);
      } catch (err) {
        console.error("Failed to initialize MetaMask SDK:", err);
        setError(err as Error);
      }
    };

    if (typeof window !== "undefined") {
      initSDK();
    }
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (!provider) return;

    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      setConnectedAccount(accounts?.[0] || null);

      // Reset smart account state if disconnected
      if (!accounts?.[0]) {
        setIsSmartAccountDeployed(false);
        setIsSmartAccountLoggedIn(false);
        setSmartAccountAddress(null);
      }
    };

    provider.on("accountsChanged", handleAccountsChanged);
    return () => {
      provider.removeListener("accountsChanged", handleAccountsChanged);
    };
  }, [provider]);

  const connectMetaMask = async () => {
    if (!provider) {
      throw new Error("MetaMask SDK not initialized");
    }

    setIsConnecting(true);
    setError(null);

    try {
      const result = await provider.request({
        method: "eth_requestAccounts",
      });
      const accounts = result as string[];

      setConnectedAccount(accounts?.[0] || null);
    } catch (err) {
      console.error("Failed to connect to MetaMask:", err);
      setError(err as Error);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectMetaMask = async () => {
    if (!provider) return;

    try {
      // Clear connection state
      setConnectedAccount(null);
      setIsSmartAccountDeployed(false);
      setIsSmartAccountLoggedIn(false);
      setSmartAccountAddress(null);
    } catch (err) {
      console.error("Error disconnecting from MetaMask:", err);
      setError(err as Error);
    }
  };

  const value = {
    isSmartAccountDeployed,
    setIsSmartAccountDeployed,
    isSmartAccountLoggedIn,
    setIsSmartAccountLoggedIn,
    smartAccountAddress,
    setSmartAccountAddress,
    sdk,
    provider,
    isConnecting,
    error,
    connectedAccount,
    connectMetaMask,
    disconnectMetaMask,
  };

  return <MetaMaskContext.Provider value={value}>{children}</MetaMaskContext.Provider>;
};
