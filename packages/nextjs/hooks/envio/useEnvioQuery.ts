/**
 * useEnvioQuery Hook
 * React hook for querying Envio GraphQL with automatic network switching
 */
import { useEnvioClient } from "./useEnvioClient";
import { UseQueryResult, useQuery } from "@tanstack/react-query";
import type { RequestDocument, Variables } from "graphql-request";

export interface UseEnvioQueryOptions<TData = unknown> {
  query: RequestDocument;
  variables?: Variables;
  enabled?: boolean;
  refetchInterval?: number;
  select?: (data: TData) => TData;
}

/**
 * Hook to query Envio GraphQL endpoint with automatic network detection
 * @example
 * const { data, isLoading, error } = useEnvioQuery({
 *   query: gql`query GetPlayers { PlayerState { id position balance } }`,
 *   enabled: true,
 * });
 */
export function useEnvioQuery<TData = unknown>({
  query,
  variables,
  enabled = true,
  refetchInterval,
  select,
}: UseEnvioQueryOptions<TData>): UseQueryResult<TData, Error> {
  const { client, isEnabled, chainId } = useEnvioClient();

  return useQuery({
    queryKey: ["envio", chainId, query, variables],
    queryFn: async () => {
      if (!client) {
        throw new Error(`Envio client not available for chain ${chainId}`);
      }
      return client.request<TData>(query, variables);
    },
    enabled: enabled && isEnabled && !!client,
    refetchInterval,
    select,
  });
}

/**
 * Hook to query multiple Envio endpoints across different chains
 * @example
 * const queries = useEnvioMultiChainQuery([
 *   { chainId: 11155111, query: playersQuery },
 *   { chainId: 10143, query: playersQuery },
 * ]);
 */
export function useEnvioMultiChainQuery<TData = unknown>(
  configs: Array<{
    chainId: number;
    query: RequestDocument;
    variables?: Variables;
    enabled?: boolean;
  }>,
) {
  const queries = configs.map(config => {
    const { client, isEnabled } = useEnvioClient();

    return useQuery({
      queryKey: ["envio", config.chainId, config.query, config.variables],
      queryFn: async () => {
        if (!client) {
          throw new Error(`Envio client not available for chain ${config.chainId}`);
        }
        return client.request<TData>(config.query, config.variables);
      },
      enabled: (config.enabled ?? true) && isEnabled && !!client,
    });
  });

  return queries;
}
