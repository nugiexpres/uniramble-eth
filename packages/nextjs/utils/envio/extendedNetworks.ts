/**
 * Extended Networks for Envio
 * Dynamically generates Envio network configs from Scaffold-ETH targetNetworks
 *
 * This is the SINGLE SOURCE OF TRUTH for Envio configuration.
 * All networks, passwords, and URLs are configured here.
 */
import scaffoldConfig from "~~/scaffold.config";

export interface EnvioNetworkConfig {
  chainId: number;
  chainName: string;
  graphqlUrl: string;
  hasuraPassword: string;
  enabled: boolean;
}

/**
 * Generate Envio network configs from Scaffold-ETH networks
 */
function generateEnvioNetworks(): Record<number, EnvioNetworkConfig> {
  const networks: Record<number, EnvioNetworkConfig> = {};

  // Get hasura password from env or use default
  const hasuraPassword = process.env.NEXT_PUBLIC_ENVIO_HASURA_PASSWORD || "testing";

  // Base GraphQL URL (can be overridden per network)
  const baseGraphqlUrl = process.env.NEXT_PUBLIC_ENVIO_GRAPHQL_URL || "http://localhost:8080/v1/graphql";

  // Generate config for each network in scaffold config
  scaffoldConfig.targetNetworks.forEach(network => {
    const chainId = network.id;

    // Check for network-specific environment variable
    const envVarName = `NEXT_PUBLIC_ENVIO_${network.name.toUpperCase().replace(/\s+/g, "_")}_URL`;
    const graphqlUrl = (process.env as any)[envVarName] || baseGraphqlUrl;

    networks[chainId] = {
      chainId,
      chainName: network.name,
      graphqlUrl,
      hasuraPassword,
      enabled: true, // Enable all networks from scaffold config
    };
  });

  // Add localhost if not already present (for development)
  if (!networks[31337]) {
    networks[31337] = {
      chainId: 31337,
      chainName: "Localhost",
      graphqlUrl: process.env.NEXT_PUBLIC_ENVIO_LOCAL_URL || "http://localhost:8080/v1/graphql",
      hasuraPassword,
      enabled: false, // Disabled by default
    };
  }

  return networks;
}

/**
 * Envio network configurations
 * Automatically generated from Scaffold-ETH targetNetworks
 */
export const ENVIO_NETWORKS = generateEnvioNetworks();

/**
 * Default Envio configuration (first network in scaffold config)
 */
export const DEFAULT_ENVIO_CONFIG = ENVIO_NETWORKS[scaffoldConfig.targetNetworks[0]?.id] || ENVIO_NETWORKS[31337];

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
