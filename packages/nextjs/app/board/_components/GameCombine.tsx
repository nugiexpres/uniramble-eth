import { useState } from "react";
import { Ingredient } from "./Ingredient";
import { SpecialBox } from "./SpecialBox";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Gift } from "lucide-react";
import { useAccount } from "wagmi";
import { useSmartAccountTBA } from "~~/hooks/envio/useSmartAccountTBA";

interface GameCombineProps {
  tbaAddress?: string;
  className?: string;
  foodTokens?: Array<{ name: string; amount: bigint | undefined; icon: string; color: string }>;
  gridData?: Array<{ id: number; typeGrid: string; ingredientType: number; numberOfPlayers: number }>;
  playerPosition?: number;
  faucetUsed?: boolean;
  canBuy?: boolean;
  tbaBalance?: bigint | undefined;
}

export const GameCombine = ({ className = "" }: GameCombineProps) => {
  const [activePanel, setActivePanel] = useState<"combine" | "ingredient">("combine");
  const { address } = useAccount(); // Track wallet changes

  // Get Smart Account TBA (reactive to wallet changes - like SpecialBox)
  const { tbaAddress: smartAccountTbaAddress } = useSmartAccountTBA();

  // Debug: Log wallet and TBA changes
  console.log("🎮 GameCombine Wallet Update:", {
    eoaAddress: address,
    smartAccountTbaAddress,
    activePanel,
  });

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 400 : -400,
      opacity: 0,
      scale: 0.8,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 400 : -400,
      opacity: 0,
      scale: 0.8,
    }),
  };

  return (
    <div className={`relative w-full ${className}`}>
      {/* Gaming Style Container with Animated Border */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-400 via-yellow-500 to-green-500 rounded-2xl blur-sm opacity-60 animate-pulse"></div>

        <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 p-2 rounded-2xl shadow-2xl border border-orange-400/40">
          {/* Toggle Header - Compact */}
          <div className="mb-3 mt-4">
            <div className="flex items-center justify-between bg-slate-800/80 rounded-lg p-2 border border-slate-700/50">
              {/* Left Tab - Combine */}
              <motion.button
                onClick={() => setActivePanel("combine")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-semibold text-xs transition-all duration-300 flex-1 mr-1.5 cursor-pointer ${
                  activePanel === "combine"
                    ? "bg-gradient-to-r from-orange-500 to-yellow-600 text-white shadow-lg shadow-orange-500/25"
                    : "bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-slate-300"
                }`}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Gift size={14} />
                <span>COMBINE</span>
                {activePanel === "combine" && (
                  <motion.div
                    className="w-1.5 h-1.5 bg-white rounded-full"
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </motion.button>

              {/* Toggle Visual Indicator */}
              <div className="flex items-center gap-1.5">
                <motion.div animate={{ x: activePanel === "combine" ? -6 : 6 }} className="text-orange-400">
                  {activePanel === "combine" ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </motion.div>

                <div className="relative w-8 h-4 bg-slate-600 rounded-full p-0.5">
                  <motion.div
                    className="w-3 h-3 bg-gradient-to-r from-orange-400 to-green-500 rounded-full shadow-lg"
                    animate={{
                      x: activePanel === "combine" ? 0 : 16,
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </div>

                <motion.div animate={{ x: activePanel === "ingredient" ? 6 : -6 }} className="text-green-400">
                  {activePanel === "ingredient" ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
                </motion.div>
              </div>

              {/* Right Tab - Ingredient */}
              <motion.button
                onClick={() => setActivePanel("ingredient")}
                className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-md font-semibold text-xs transition-all duration-300 flex-1 ml-1.5 cursor-pointer ${
                  activePanel === "ingredient"
                    ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25"
                    : "bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-slate-300"
                }`}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <span>INGREDIENT</span>
                {activePanel === "ingredient" && (
                  <motion.div
                    className="w-1.5 h-1.5 bg-white rounded-full"
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </motion.button>
            </div>
          </div>

          {/* Panel Content with Slide Animation */}
          <div className="relative overflow-hidden rounded-xl">
            <AnimatePresence mode="wait" custom={activePanel === "ingredient" ? 1 : -1}>
              <motion.div
                key={activePanel}
                custom={activePanel === "ingredient" ? 1 : -1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                }}
                className="w-full"
              >
                {activePanel === "combine" ? (
                  <div className="space-y-4 h-full overflow-y-auto pr-2">
                    <SpecialBox />
                  </div>
                ) : (
                  <div className="space-y-4 h-full overflow-y-auto pr-2">
                    <Ingredient tbaAddress={smartAccountTbaAddress} className="mb-6" />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom Status Indicator */}
          <div className="mt-4 flex justify-center">
            <div className="flex items-center gap-2 bg-slate-800/60 px-4 py-2 rounded-full border border-slate-700/50">
              <div
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  activePanel === "combine" ? "bg-orange-400 shadow-lg shadow-orange-400/50" : "bg-slate-600"
                }`}
              ></div>
              <div
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  activePanel === "ingredient" ? "bg-green-400 shadow-lg shadow-green-400/50" : "bg-slate-600"
                }`}
              ></div>
            </div>
          </div>

          {/* Quick Info Bar */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-800/90 backdrop-blur-sm border border-slate-700/50 rounded-lg px-3 py-1">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse"></div>
              <span className="text-slate-300 font-medium">{activePanel === "combine" ? "COMBINE" : "INGREDIENT"}</span>
            </div>
          </div>

          {/* TBA Address Indicator (if exists) */}
          {smartAccountTbaAddress && (
            <div className="mt-2 p-2 bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/20 rounded-lg">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Using TBA:</span>
                <span className="text-orange-300 font-medium">
                  {smartAccountTbaAddress.slice(0, 6)}...{smartAccountTbaAddress.slice(-4)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </div>
  );
};
