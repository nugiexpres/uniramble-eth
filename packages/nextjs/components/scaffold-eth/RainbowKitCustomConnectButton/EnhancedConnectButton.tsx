/**
 * Enhanced Connect Button
 * Supports both RainbowKit wallets and Web3Auth social logins
 */
"use client";

import { useState } from "react";
import { Balance } from "../Balance";
import { AddressInfoDropdown } from "./AddressInfoDropdown";
import { AddressQRCodeModal } from "./AddressQRCodeModal";
import { RevealBurnerPKModal } from "./RevealBurnerPKModal";
import { WrongNetworkDropdown } from "./WrongNetworkDropdown";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Address } from "viem";
import { useNetworkColor, useTargetNetwork } from "~~/hooks/scaffold-eth";
import { useWeb3AuthWallet } from "~~/hooks/web3auth/useWeb3AuthWallet";
import { getBlockExplorerAddressLink } from "~~/utils/scaffold-eth";

/**
 * Enhanced Connect Button
 * Supports both RainbowKit wallets and Web3Auth social logins
 */

/**
 * Enhanced Connect Button
 * Supports both RainbowKit wallets and Web3Auth social logins
 */

/**
 * Enhanced connect button with Web3Auth integration
 */
export const EnhancedConnectButton = () => {
  const networkColor = useNetworkColor();
  const { targetNetwork } = useTargetNetwork();
  const {
    isAvailable: web3AuthAvailable,
    isConnected: web3AuthConnected,
    connect: connectWeb3Auth,
  } = useWeb3AuthWallet();
  const [showWeb3AuthOption, setShowWeb3AuthOption] = useState(false);

  return (
    <ConnectButton.Custom>
      {({ account, chain, openConnectModal, mounted }) => {
        const connected = mounted && account && chain;
        const blockExplorerAddressLink = account
          ? getBlockExplorerAddressLink(targetNetwork, account.address)
          : undefined;

        return (
          <>
            {(() => {
              if (!connected && !web3AuthConnected) {
                return (
                  <div className="relative">
                    <button className="btn btn-primary btn-sm" onClick={openConnectModal} type="button">
                      Connect Wallet
                    </button>

                    {/* Web3Auth Social Login Option (if enabled) */}
                    {web3AuthAvailable && showWeb3AuthOption && (
                      <div className="absolute top-full mt-2 right-0 bg-base-100 rounded-lg shadow-lg p-2 min-w-[200px]">
                        <button onClick={connectWeb3Auth} className="btn btn-sm btn-ghost w-full justify-start">
                          <span>🔐</span>
                          Social Login
                        </button>
                      </div>
                    )}
                  </div>
                );
              }

              if (chain?.unsupported || chain?.id !== targetNetwork.id) {
                return <WrongNetworkDropdown />;
              }

              return (
                <>
                  <div className="flex flex-col items-center mr-1">
                    <Balance address={account!.address as Address} className="min-h-0 h-auto" />
                    <span className="text-xs" style={{ color: networkColor }}>
                      {chain!.name}
                    </span>
                  </div>
                  <AddressInfoDropdown
                    address={account!.address as Address}
                    displayName={account!.displayName}
                    ensAvatar={account!.ensAvatar}
                    blockExplorerAddressLink={blockExplorerAddressLink}
                  />
                  <AddressQRCodeModal address={account!.address as Address} modalId="qrcode-modal" />
                  <RevealBurnerPKModal />
                </>
              );
            })()}
          </>
        );
      }}
    </ConnectButton.Custom>
  );
};
