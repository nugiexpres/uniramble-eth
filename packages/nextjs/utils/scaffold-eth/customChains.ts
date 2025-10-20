import dotenv from "dotenv";
import { defineChain } from "viem";

dotenv.config();

const ANKR_API_KEY = process.env.NEXT_PUBLIC_ANKR_API_KEY;
const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || "oKxs-03sij-U_N0iOlrSsZFr29-IqbuF";

export const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  network: "monadTestnet",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        `https://rpc.ankr.com/monad_testnet/${ANKR_API_KEY}`,
        // Ankr RPC - No rate limiting (500M req/month free)
      ],
    },
    public: {
      http: [
        `https://rpc.ankr.com/monad_testnet/${ANKR_API_KEY}`,
        // Ankr RPC as public fallback too
      ],
    },
  },
  blockExplorers: {
    default: {
      name: "Monad Testnet Explorer",
      url: "https://testnet-explorer.monad.xyz",
    },
  },
});

export const sepolia = defineChain({
  id: 11155111,
  name: "Sepolia",
  network: "sepolia",
  nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        `https://rpc.ankr.com/eth_sepolia/${ANKR_API_KEY}`,
        // Ankr RPC as primary - No rate limiting (500M req/month free)
        `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
        // Alchemy as backup
      ],
    },
    public: {
      http: [
        `https://rpc.ankr.com/eth_sepolia/${ANKR_API_KEY}`,
        // Ankr RPC as public primary
        "https://rpc.sepolia.org",
        // Public RPC as fallback
      ],
    },
  },
  blockExplorers: {
    default: {
      name: "Etherscan",
      url: "https://sepolia.etherscan.io",
    },
  },
  testnet: true,
});
