import { getBundlerConfig } from "./bundler";
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";

// EntryPoint ABI for getting nonce
export const entryPointAbi = [
  {
    inputs: [
      { name: "sender", type: "address" },
      { name: "key", type: "uint192" },
    ],
    name: "getNonce",
    outputs: [{ name: "nonce", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// EntryPoint address for Sepolia (ERC-4337 v0.6)
export const ENTRYPOINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789" as const;

// Create public client for reading contract state
export const createPublicClientForNonce = (chainId: number) => {
  const bundlerConfig = getBundlerConfig(chainId);

  return createPublicClient({
    chain: sepolia, // Use sepolia chain
    transport: http(bundlerConfig.rpcUrl),
  });
};

// Get smart account nonce from EntryPoint with better error handling
export const getSmartAccountNonce = async (
  smartAccountAddress: `0x${string}`,
  chainId: number,
  customPublicClient?: any, // Allow passing wagmi publicClient to avoid rate limiting
): Promise<bigint> => {
  try {
    // Use custom client if provided (wagmi has better RPC handling with Alchemy)
    const publicClient = customPublicClient || createPublicClientForNonce(chainId);

    // Skip deployment check to reduce RPC calls - assume deployed if address exists
    // const code = await publicClient.getCode({ address: smartAccountAddress });
    // if (!code || code === "0x") {
    //   console.warn("Smart account not deployed yet, returning nonce 0");
    //   return 0n;
    // }

    const nonce = await publicClient.readContract({
      address: ENTRYPOINT_ADDRESS,
      abi: entryPointAbi,
      functionName: "getNonce",
      args: [smartAccountAddress, 0n], // 0n = key / nonce space
    });

    console.log("Current smart account nonce:", nonce.toString());
    return nonce;
  } catch (error) {
    console.error("Error getting smart account nonce:", error);

    // Return 0 as fallback instead of making another RPC call
    console.warn("Returning nonce 0 as fallback");
    return 0n;
  }
};
