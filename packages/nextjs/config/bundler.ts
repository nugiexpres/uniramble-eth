// Bundler configuration for Smart Accounts using Pimlico with ERC-4337 support
// Pimlico supports Sepolia & Monad Testnet with gas sponsorship!
// Configure with environment variables:
// - NEXT_PUBLIC_PIMLICO_API_KEY (Required for gasless operations)
// - NEXT_PUBLIC_ALCHEMY_API_KEY (Optional for read operations on Sepolia)
// - NEXT_PUBLIC_ANKR_API_KEY (Required for Monad Testnet read operations)

const PIMLICO_API_KEY = process.env.NEXT_PUBLIC_PIMLICO_API_KEY;
const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY; // For Sepolia reads
const ANKR_API_KEY = process.env.NEXT_PUBLIC_ANKR_API_KEY; // For Monad reads

export const BUNDLER_CONFIG = {
  // For testing on Sepolia using Pimlico Bundler & Paymaster
  sepolia: {
    rpcUrl: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`, // Alchemy for reads
    bundlerUrl: `https://api.pimlico.io/v2/11155111/rpc?apikey=${PIMLICO_API_KEY}`, // Pimlico bundler
    paymasterUrl: `https://api.pimlico.io/v2/11155111/rpc?apikey=${PIMLICO_API_KEY}`, // Pimlico paymaster
    entryPoint: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789", // ERC-4337 EntryPoint v0.6
    policyId: undefined, // Pimlico auto-sponsors based on API key
    supportsERC4337: true, // Full ERC-4337 support
  },

  // For Monad testnet using Ankr RPC + Pimlico Bundler/Paymaster
  monadTestnet: {
    rpcUrl: `https://rpc.ankr.com/monad_testnet/${ANKR_API_KEY}`, // ✅ Ankr RPC (no rate limit!)
    bundlerUrl: `https://api.pimlico.io/v2/10143/rpc?apikey=${PIMLICO_API_KEY}`, // Pimlico bundler
    paymasterUrl: `https://api.pimlico.io/v2/10143/rpc?apikey=${PIMLICO_API_KEY}`, // Pimlico paymaster
    entryPoint: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789", // ERC-4337 EntryPoint v0.6
    policyId: undefined, // Pimlico auto-sponsors
    supportsERC4337: true, // ✅ Full ERC-4337 support on Monad via Pimlico!
  },

  // For local development with Hardhat (limited ERC-4337 support)
  localhost: {
    rpcUrl: "http://localhost:8545",
    bundlerUrl: "http://localhost:8545",
    paymasterUrl: "http://localhost:8545",
    entryPoint: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
    policyId: undefined,
    supportsERC4337: false,
  },

  // For mainnet using Pimlico Bundler & Paymaster
  mainnet: {
    rpcUrl: `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`, // Alchemy for reads
    bundlerUrl: `https://api.pimlico.io/v2/1/rpc?apikey=${PIMLICO_API_KEY}`, // Pimlico bundler
    paymasterUrl: `https://api.pimlico.io/v2/1/rpc?apikey=${PIMLICO_API_KEY}`, // Pimlico paymaster
    entryPoint: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789", // ERC-4337 EntryPoint v0.6
    policyId: undefined, // Pimlico auto-sponsors
    supportsERC4337: true, // Full ERC-4337 support
  },
};

// Get bundler config based on chain ID
export const getBundlerConfig = (chainId: number) => {
  console.log(`Getting bundler config for chainId: ${chainId}`);

  switch (chainId) {
    case 1: // Mainnet
      return BUNDLER_CONFIG.mainnet;
    case 11155111: // Sepolia
      return BUNDLER_CONFIG.sepolia;
    case 31337: // Hardhat
      return BUNDLER_CONFIG.localhost;
    case 10143: // Monad Testnet
      return BUNDLER_CONFIG.monadTestnet;
    default:
      console.warn(`Chain ID ${chainId} not supported, defaulting to Sepolia`);
      return BUNDLER_CONFIG.sepolia; // Default to Sepolia for testing
  }
};
