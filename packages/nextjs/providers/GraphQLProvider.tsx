"use client";

import { ReactNode } from "react";
import { ApolloClient, InMemoryCache, split } from "@apollo/client";
import { HttpLink } from "@apollo/client/link/http";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { ApolloProvider } from "@apollo/client/react";
import { getMainDefinition } from "@apollo/client/utilities";
import { createClient } from "graphql-ws";

// GraphQL endpoints for Envio indexer
const GRAPHQL_HTTP_ENDPOINT = process.env.NEXT_PUBLIC_ENVIO_GRAPHQL_URL || "http://localhost:8080/v1/graphql";
const GRAPHQL_WS_ENDPOINT = process.env.NEXT_PUBLIC_ENVIO_WS_URL || "ws://localhost:8080/v1/graphql";

// HyperSync Bearer Token (optional untuk local dev, required untuk production)
// Get token at: https://envio.dev/app/api-tokens
const HYPERSYNC_BEARER_TOKEN = process.env.NEXT_PUBLIC_HYPERSYNC_BEARER_TOKEN;

// HTTP link for queries and mutations
const httpLink = new HttpLink({
  uri: GRAPHQL_HTTP_ENDPOINT,
  headers: HYPERSYNC_BEARER_TOKEN
    ? {
        Authorization: `Bearer ${HYPERSYNC_BEARER_TOKEN}`,
      }
    : {},
});

// WebSocket link for subscriptions
const wsLink =
  typeof window !== "undefined"
    ? new GraphQLWsLink(
        createClient({
          url: GRAPHQL_WS_ENDPOINT,
          connectionParams: HYPERSYNC_BEARER_TOKEN
            ? {
                headers: {
                  Authorization: `Bearer ${HYPERSYNC_BEARER_TOKEN}`,
                },
              }
            : {},
        }),
      )
    : null;

// Split link based on operation type
const splitLink =
  typeof window !== "undefined" && wsLink
    ? split(
        ({ query }) => {
          const definition = getMainDefinition(query);
          return definition.kind === "OperationDefinition" && definition.operation === "subscription";
        },
        wsLink,
        httpLink,
      )
    : httpLink;

const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          // Game state management
          playerStates: {
            merge(existing, incoming) {
              return incoming; // Always use latest state
            },
          },
          tokenBalances: {
            merge(existing, incoming) {
              return incoming;
            },
          },
          playerActions: {
            merge(existing, incoming) {
              return incoming;
            },
          },
          // Legacy fields
          FoodScramble_PlayerMoveds: {
            merge(_, incoming) {
              return [...incoming];
            },
          },
          FoodScramble_PlayerCreateds: {
            merge(_, incoming) {
              return [...incoming];
            },
          },
          SmartAccountTBAs: {
            merge(_, incoming) {
              return [...incoming];
            },
          },
          // NFT Transfer tracking
          FoodNFT_Transfer: {
            merge(_, incoming) {
              return [...incoming];
            },
          },
        },
      },
    },
  }),
});

interface GraphQLProviderProps {
  children: ReactNode;
}

export const GraphQLProvider = ({ children }: GraphQLProviderProps) => {
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
};

export default client;
