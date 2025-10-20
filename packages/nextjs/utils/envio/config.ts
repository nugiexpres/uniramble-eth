/**
 * Envio Configuration
 * This file centralizes Envio configuration and network mappings
 */

export interface EnvioNetworkConfig {
  chainId: number;
  graphqlUrl: string;
  hasuraPassword: string;
  enabled: boolean;
}

/**
 * Envio network configurations
 * Maps chain IDs to their respective Envio GraphQL endpoint
 */
export const ENVIO_NETWORKS: Record<number, EnvioNetworkConfig> = {
  // Sepolia
  11155111: {
    chainId: 11155111,
    graphqlUrl: process.env.NEXT_PUBLIC_ENVIO_SEPOLIA_URL || "http://localhost:8080/v1/graphql",
    hasuraPassword: process.env.NEXT_PUBLIC_ENVIO_HASURA_PASSWORD || "testing",
    enabled: true,
  },
  // Monad Testnet
  10143: {
    chainId: 10143,
    graphqlUrl: process.env.NEXT_PUBLIC_ENVIO_MONAD_URL || "http://localhost:8080/v1/graphql",
    hasuraPassword: process.env.NEXT_PUBLIC_ENVIO_HASURA_PASSWORD || "testing",
    enabled: true,
  },
  // Local development
  31337: {
    chainId: 31337,
    graphqlUrl: process.env.NEXT_PUBLIC_ENVIO_LOCAL_URL || "http://localhost:8080/v1/graphql",
    hasuraPassword: process.env.NEXT_PUBLIC_ENVIO_HASURA_PASSWORD || "testing",
    enabled: false, // Disable by default for local chain
  },
};

/**
 * Default Envio configuration (used when no specific chain is selected)
 */
export const DEFAULT_ENVIO_CONFIG = ENVIO_NETWORKS[11155111];

/**
 * Get Envio configuration for a specific chain
 */
export function getEnvioConfig(chainId: number): EnvioNetworkConfig {
  return ENVIO_NETWORKS[chainId] || DEFAULT_ENVIO_CONFIG;
}

/**
 * Check if Envio is enabled for a specific chain
 */
export function isEnvioEnabled(chainId: number): boolean {
  const config = ENVIO_NETWORKS[chainId];
  return config?.enabled ?? false;
}

/**
 * Get all enabled Envio networks
 */
export function getEnabledEnvioNetworks(): EnvioNetworkConfig[] {
  return Object.values(ENVIO_NETWORKS).filter(config => config.enabled);
}
