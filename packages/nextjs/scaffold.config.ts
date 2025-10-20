import * as chains from "viem/chains";
import { monadTestnet, sepolia } from "~~/utils/scaffold-eth/customChains";

export type BaseConfig = {
  targetNetworks: readonly chains.Chain[];
  pollingInterval: number;
  alchemyApiKey?: string;
  ankrApiKey?: string;
  rpcOverrides?: Record<number, string>;
  walletConnectProjectId: string;
  onlyLocalBurnerWallet: boolean;
};

// Type without 'as const' for runtime compatibility
export type ScaffoldConfigRuntime = {
  targetNetworks: readonly chains.Chain[];
  pollingInterval: number;
  alchemyApiKey?: string;
  ankrApiKey: string;
  rpcOverrides?: Record<number, string>;
  walletConnectProjectId: string;
  onlyLocalBurnerWallet: boolean;
};

export type ScaffoldConfig = BaseConfig;

export const DEFAULT_ALCHEMY_API_KEY = "oKxs-03sij-U_N0iOlrSsZFr29-IqbuF";

const scaffoldConfig = {
  // The networks on which your DApp is live
  // Using custom chains with Ankr as primary RPC and Alchemy as backup
  targetNetworks: [sepolia, monadTestnet],
  // The interval at which your front-end polls the RPC servers for new data (it has no effect if you only target the local network (default is 4000))
  pollingInterval: 30000, // Increased to reduce RPC load
  // Ankr API key - Primary RPC provider (500M req/month free, no rate limiting)
  // Get your own at https://www.ankr.com/rpc/
  ankrApiKey: process.env.NEXT_PUBLIC_ANKR_API_KEY || "",
  // Alchemy API key - Used as backup RPC in customChains.ts
  // You can get your own at https://dashboard.alchemyapi.io
  alchemyApiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || DEFAULT_ALCHEMY_API_KEY,
  // RPC overrides - All RPCs are configured in customChains.ts with Ankr as primary
  rpcOverrides: {},
  // This is ours WalletConnect's default project ID.
  // You can get your own at https://cloud.walletconnect.com
  // It's recommended to store it in an env variable:
  // .env.local for local testing, and in the Vercel/system env config for live apps.
  walletConnectProjectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "3a8170812b534d0ff9d794f19a901d64",
  onlyLocalBurnerWallet: true,
} as const satisfies ScaffoldConfig;

export default scaffoldConfig;
