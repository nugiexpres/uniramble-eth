/**
 * useEnvioClient Hook
 * Dynamic Envio GraphQL client that switches based on the active network
 */
import { useMemo } from "react";
import { GraphQLClient } from "graphql-request";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";
import { getEnvioConfig, isEnvioEnabled } from "~~/utils/envio/extendedNetworks";

/**
 * Hook to get Envio GraphQL client for the current network
 * Automatically switches endpoint when network change
 */
export function useEnvioClient() {
  const { targetNetwork } = useTargetNetwork();

  const client = useMemo(() => {
    const config = getEnvioConfig(targetNetwork.id);

    if (!isEnvioEnabled(targetNetwork.id)) {
      console.warn(`Envio is not enabled for chain ${targetNetwork.id} (${targetNetwork.name})`);
      return null;
    }

    // HyperSync Bearer Token (optional untuk local dev, required untuk production)
    const bearerToken = process.env.NEXT_PUBLIC_HYPERSYNC_BEARER_TOKEN;

    return new GraphQLClient(config.graphqlUrl, {
      headers: {
        "Content-Type": "application/json",
        ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}),
      },
    });
  }, [targetNetwork.id, targetNetwork.name]);

  return {
    client,
    config: getEnvioConfig(targetNetwork.id),
    isEnabled: isEnvioEnabled(targetNetwork.id),
    chainId: targetNetwork.id,
    chainName: targetNetwork.name,
  };
}

/**
 * Hook to get Envio client for a specific chain (regardless of current network)
 */
export function useEnvioClientForChain(chainId: number) {
  const client = useMemo(() => {
    const config = getEnvioConfig(chainId);

    if (!isEnvioEnabled(chainId)) {
      console.warn(`Envio is not enabled for chain ${chainId}`);
      return null;
    }

    // HyperSync Bearer Token (optional untuk local dev, required untuk production)
    const bearerToken = process.env.NEXT_PUBLIC_HYPERSYNC_BEARER_TOKEN;

    return new GraphQLClient(config.graphqlUrl, {
      headers: {
        "Content-Type": "application/json",
        ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}),
      },
    });
  }, [chainId]);

  return {
    client,
    config: getEnvioConfig(chainId),
    isEnabled: isEnvioEnabled(chainId),
    chainId,
  };
}
