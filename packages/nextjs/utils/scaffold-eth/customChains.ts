import dotenv from "dotenv";
import { defineChain } from "viem";

dotenv.config();

const ANKR_API_KEY = process.env.NEXT_PUBLIC_ANKR_API_KEY;

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
