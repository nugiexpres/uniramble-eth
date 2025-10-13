import { Ingredient } from "./Ingredient";
import { SpecialBox } from "./SpecialBox";
import { motion } from "framer-motion";
import { Gift } from "lucide-react";
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

export const GameCombine = ({ tbaAddress, className = "" }: GameCombineProps) => {
  // Get Smart Account TBA (priority over prop)
  const { tbaAddress: smartAccountTbaAddress } = useSmartAccountTBA();

  // Use Smart Account TBA if available, otherwise use prop TBA
  const effectiveTbaAddress = smartAccountTbaAddress || tbaAddress;

  // Debug: Log render
  console.log("🎮 GameCombine Rendered:", {
    tbaAddress,
    smartAccountTbaAddress,
    effectiveTbaAddress,
    className,
  });

  return (
    <div className={`relative w-[445px] ${className}`}>
      {/* Gaming Style Container with Animated Border */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-400 via-yellow-500 to-green-500 rounded-2xl blur-sm opacity-60 animate-pulse"></div>

        <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 p-2 rounded-2xl shadow-2xl border border-orange-400/40">
          {/* Header */}
          <div className="mb-4 mt-7">
            <div className="flex items-center justify-center bg-slate-800/80 rounded-xl p-3 border border-slate-700/50">
              {/* Combine Header */}
              <motion.div
                className="flex items-center gap-3 px-4 py-2 rounded-lg font-bold text-sm bg-gradient-to-r from-orange-500 to-yellow-600 text-white shadow-lg shadow-orange-500/25 flex-1"
                animate={{
                  boxShadow: [
                    "0 4px 20px rgba(249, 115, 22, 0.25)",
                    "0 4px 30px rgba(249, 115, 22, 0.4)",
                    "0 4px 20px rgba(249, 115, 22, 0.25)",
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Gift size={16} />
                <span>COMBINE</span>
                <motion.div
                  className="w-2 h-2 bg-white rounded-full"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </motion.div>
            </div>
          </div>

          {/* Content Area - Direct Display */}
          <div className="relative overflow-hidden rounded-xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
              className="w-full"
            >
              <div className="space-y-4 h-full overflow-y-auto pr-2">
                <SpecialBox />
                <Ingredient tbaAddress={effectiveTbaAddress} className="mb-6" />
              </div>
            </motion.div>
          </div>

          {/* Bottom Status Indicator */}
          <div className="mt-4 flex justify-center">
            <div className="flex items-center gap-2 bg-slate-800/60 px-4 py-2 rounded-full border border-slate-700/50">
              <div className="w-2 h-2 rounded-full bg-orange-400 shadow-lg shadow-orange-400/50"></div>
              <span className="text-xs text-slate-400">Active</span>
            </div>
          </div>

          {/* Quick Info Bar */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-800/90 backdrop-blur-sm border border-slate-700/50 rounded-lg px-3 py-1">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse"></div>
              <span className="text-slate-300 font-medium">COMBINE</span>
            </div>
          </div>

          {/* TBA Address Indicator (if exists) */}
          {effectiveTbaAddress && (
            <div className="mt-2 p-2 bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/20 rounded-lg">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Using TBA:</span>
                <span className="text-orange-300 font-medium">
                  {effectiveTbaAddress.slice(0, 6)}...{effectiveTbaAddress.slice(-4)}
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
