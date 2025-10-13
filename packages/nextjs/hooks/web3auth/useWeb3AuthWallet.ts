/**
 * Web3Auth Wallet Hook
 * Stub implementation - Web3Auth integration is opt-in
 * See WEB3AUTH_INTEGRATION.md for setup instructions
 */

export const useWeb3AuthWallet = () => {
  // Stub implementation - returns disabled state
  // Web3Auth integration is opt-in and requires additional setup
  return {
    isAvailable: false,
    isConnected: false,
    isConnecting: false,
    userInfo: null,
    provider: null,
    connect: async () => {
      console.log("Web3Auth not configured. See WEB3AUTH_INTEGRATION.md");
    },
    disconnect: async () => {},
  };
};
