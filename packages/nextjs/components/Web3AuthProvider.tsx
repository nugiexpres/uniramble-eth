/**
 * Web3Auth Provider Wrapper
 * Integrates Web3Auth with Scaffold-ETH structure
 */

"use client";

import { ReactNode } from "react";
import { Web3AuthProvider as W3AProvider } from "@web3auth/modal/react";
import { web3AuthContextConfig, isWeb3AuthEnabled } from "~~/services/web3/web3AuthConfig";

interface Web3AuthProviderProps {
  children: ReactNode;
}

export const Web3AuthProvider = ({ children }: Web3AuthProviderProps) => {
  // Only use Web3Auth if explicitly enabled
  if (!isWeb3AuthEnabled()) {
    return <>{children}</>;
  }

  return <W3AProvider config={web3AuthContextConfig}>{children}</W3AProvider>;
};

