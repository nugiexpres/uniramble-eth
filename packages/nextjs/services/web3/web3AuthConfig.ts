/**
 * Web3Auth Configuration (Stub)
 * Web3Auth integration is opt-in and currently disabled
 * 
 * To enable:
 * 1. Install: yarn add @web3auth/modal @web3auth/ethereum-provider @web3auth/base
 * 2. Get Client ID from https://dashboard.web3auth.io (create testnet project)
 * 3. Set .env.local: NEXT_PUBLIC_ENABLE_WEB3AUTH=true
 * 4. Uncomment Web3AuthProvider in layout.tsx
 * 
 * See WEB3AUTH_INTEGRATION.md for complete instructions
 */

/**
 * Check if Web3Auth should be enabled
 */
export const isWeb3AuthEnabled = (): boolean => {
  // Explicitly check for "true" string to avoid accidental enabling
  return process.env.NEXT_PUBLIC_ENABLE_WEB3AUTH === "true";
};

/**
 * Stub config - replace with actual implementation when enabling Web3Auth
 */
export const web3AuthContextConfig = null;

