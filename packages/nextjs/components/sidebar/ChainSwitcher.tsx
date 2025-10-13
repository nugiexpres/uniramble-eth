"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Globe, Network, Zap } from "lucide-react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { NETWORKS_EXTRA_DATA, getTargetNetworks } from "~~/utils/scaffold-eth";

/* eslint-disable @next/next/no-img-element */

// Chain configuration with additional UI properties
const getChainConfig = (chainId: number) => {
  const chainConfigs: Record<number, any> = {
    31337: {
      color: "#627EEA",
      gradient: "from-blue-500 to-indigo-600",
      icon: "/assets/chains/hardhat.png",
      description: "Local Development",
    },
    11155111: {
      color: "#A78BFA",
      gradient: "from-purple-500 to-violet-600",
      icon: "/assets/chains/ethereum-sepolia.png",
      description: "Ethereum Testnet",
    },
    10143: {
      color: "#C084FC",
      gradient: "from-pink-500 to-purple-600",
      icon: "/assets/chains/monad-logo.webp",
      description: "Next-Gen Blockchain",
    },
  };

  // Get color from NETWORKS_EXTRA_DATA if available
  const extraData = NETWORKS_EXTRA_DATA[chainId];
  const baseConfig = chainConfigs[chainId] || {
    color: "#6B7280",
    gradient: "from-gray-500 to-gray-600",
    icon: "/assets/chains/default.png",
    description: "Unknown Network",
  };

  // Override color with NETWORKS_EXTRA_DATA if available
  if (extraData?.color) {
    baseConfig.color = extraData.color;
  }

  return baseConfig;
};

export const ChainSwitcher = () => {
  const [isOpen, setIsOpen] = useState(false);
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();
  const { targetNetwork } = useTargetNetwork();
  const availableNetworks = getTargetNetworks();
  const { isConnected } = useAccount();

  // Get chains from scaffold.config.ts with dynamic config
  const chains = availableNetworks.map(network => ({
    ...network,
    ...getChainConfig(network.id),
  }));

  const currentChain = chains.find(chain => chain.id === chainId) || {
    ...targetNetwork,
    ...getChainConfig(targetNetwork.id),
  };

  const handleChainSwitch = (targetChainId: number) => {
    try {
      switchChain({ chainId: targetChainId });
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to switch chain:", error);
    }
  };

  return (
    <div className="relative w-full">
      {/* Main Button with Futuristic Design */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 border-2 border-purple-500/30 shadow-2xl hover:shadow-purple-500/25 transition-all duration-300"
      >
        {/* Glowing Border Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 blur-sm"></div>
        <div className="absolute inset-[1px] rounded-2xl bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900"></div>

        {/* Content */}
        <div className="relative z-10 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Chain Icon */}
            <div className="relative">
              {currentChain?.icon ? (
                <img
                  src={currentChain.icon}
                  alt={`${currentChain.name} logo`}
                  className="w-6 h-6 rounded-full object-contain ring-2 ring-purple-400/50"
                  loading="lazy"
                />
              ) : (
                <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Network className="w-3 h-3 text-white" />
                </div>
              )}
              {/* Status Indicator */}
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse border border-white/20"></div>
            </div>

            {/* Chain Info */}
            <div className="flex flex-col items-start">
              <span className="text-sm font-bold text-white">
                {isConnected ? currentChain?.name || "Unknown Chain" : "Select Chain"}
              </span>
              {currentChain && <span className="text-xs text-purple-300 font-medium">{currentChain.description}</span>}
            </div>
          </div>

          {/* Status & Arrow */}
          <div className="flex items-center space-x-2">
            {isPending && (
              <div className="flex items-center space-x-1">
                <Zap className="w-3 h-3 text-yellow-400 animate-spin" />
                <span className="text-xs text-yellow-400 font-medium">Switching...</span>
              </div>
            )}

            <ChevronDown
              className={`w-4 h-4 text-purple-300 transform transition-transform duration-300 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </div>
        </div>

        {/* Hover Effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </button>

      {/* Futuristic Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown Panel */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute bottom-full mb-3 w-full z-50"
            >
              {/* Dropdown Container */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 border-2 border-purple-500/30 shadow-2xl backdrop-blur-xl">
                {/* Glowing Border */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 blur-sm"></div>
                <div className="absolute inset-[1px] rounded-2xl bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"></div>

                {/* Content */}
                <div className="relative z-10">
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-purple-500/20">
                    <div className="flex items-center space-x-2">
                      <Globe className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-bold text-purple-300 tracking-wider">NETWORKS</span>
                    </div>
                  </div>

                  {/* Chain Options */}
                  <div className="py-2">
                    {chains.map((chain, index) => (
                      <motion.button
                        key={chain.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleChainSwitch(chain.id)}
                        disabled={isPending}
                        className="group relative w-full flex items-center px-4 py-3 text-left hover:bg-purple-500/10 transition-all duration-200 disabled:opacity-50"
                      >
                        {/* Selection Indicator */}
                        {chainId === chain.id && (
                          <motion.div
                            layoutId="activeChain"
                            className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-pink-500"
                            transition={{ duration: 0.2 }}
                          />
                        )}

                        {/* Chain Content */}
                        <div className="flex items-center space-x-3 flex-1">
                          {/* Icon */}
                          <div className="relative">
                            <img
                              src={chain.icon}
                              alt={`${chain.name} logo`}
                              className="w-8 h-8 rounded-full object-contain ring-1 ring-purple-400/30 group-hover:ring-purple-400/60 transition-all"
                              loading="lazy"
                            />
                            {chainId === chain.id && (
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse border border-white/20"></div>
                            )}
                          </div>

                          {/* Chain Info */}
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-white font-semibold">{chain.name}</span>
                              {chainId === chain.id && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-bold rounded-full border border-green-500/30"
                                >
                                  ACTIVE
                                </motion.div>
                              )}
                            </div>
                            <span className="text-xs text-purple-300">{chain.description}</span>
                          </div>

                          {/* Chain ID */}
                          <div className="text-xs text-purple-400 font-mono bg-slate-800/50 px-2 py-1 rounded border border-purple-500/20">
                            {chain.id}
                          </div>
                        </div>

                        {/* Hover Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                      </motion.button>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="px-4 py-3 border-t border-purple-500/20 bg-slate-800/20">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-purple-400">Connected Networks</span>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-green-400 font-medium">{chains.length} Available</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Animated Background Elements */}
                <div className="absolute top-2 right-2 w-2 h-2 bg-purple-500 rounded-full animate-ping opacity-30"></div>
                <div className="absolute bottom-2 left-2 w-1 h-1 bg-pink-500 rounded-full animate-pulse opacity-40"></div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
