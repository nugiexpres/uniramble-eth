import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  coinbaseWallet,
  metaMaskWallet,
  rainbowWallet,
  trustWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { rainbowkitBurnerWallet } from "burner-connector";
import * as chains from "viem/chains";
import { metaMask } from "wagmi/connectors";
import scaffoldConfig from "~~/scaffold.config";

const { onlyLocalBurnerWallet, targetNetworks } = scaffoldConfig;

/**
 * Recommended Wallets - MetaMask prioritized
 */
const recommendedWallets = [metaMaskWallet];

/**
 * Other Wallets
 */
const otherWallets = [
  walletConnectWallet,
  coinbaseWallet,
  rainbowWallet,
  trustWallet,
  ...(!targetNetworks.some(network => network.id !== (chains.hardhat as chains.Chain).id) || !onlyLocalBurnerWallet
    ? [rainbowkitBurnerWallet]
    : []),
];

// MetaMask SDK connector for EIP-7702 (following official MetaMask docs)
export const metaMaskSDKConnector = metaMask({
  dappMetadata: {
    name: "UniRamble GamiFi",
    url: "https://app.uniramble.xyz",
  },
});

/**
 * wagmi connectors for the wagmi context
 */
export const wagmiConnectors = () => {
  // Only create connectors on client-side to avoid SSR issues
  // TODO: update when https://github.com/rainbow-me/rainbowkit/issues/2476 is resolved
  if (typeof window === "undefined") {
    return [];
  }

  try {
    return connectorsForWallets(
      [
        {
          groupName: "Recommended",
          wallets: recommendedWallets,
        },
        {
          groupName: "Other Wallets",
          wallets: otherWallets,
        },
      ],
      {
        appName: "UniRamble GamiFi",
        projectId: scaffoldConfig.walletConnectProjectId,
      },
    );
  } catch (error) {
    console.warn("Failed to create wallet connectors:", error);
    // Return minimal connectors on error
    return [
      metaMask({
        dappMetadata: {
          name: "UniRamble GamiFi",
          url: "https://app.uniramble.xyz",
        },
      }),
    ];
  }
};
