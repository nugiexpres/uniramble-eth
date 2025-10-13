import { useState } from "react";
import { Ingredient } from "./Ingredient";
import { SpecialBox } from "./SpecialBox";
// import { WalletBalance } from "./WalletBalance";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, GamepadIcon, User } from "lucide-react";
import CreateTBA from "~~/app/account/CreateTBA";
import { FinalSmartAccount } from "~~/app/account/FinalSmartAccount";
// ...existing code...
import { useSmartAccountTBA } from "~~/hooks/envio/useSmartAccountTBA";

interface GameDashboardProps {
  tbaAddress?: string;
  className?: string;
  foodTokens?: Array<{ name: string; amount: bigint | undefined; icon: string; color: string }>;
  gridData?: Array<{ id: number; typeGrid: string; ingredientType: number; numberOfPlayers: number }>;
  playerPosition?: number;
  faucetUsed?: boolean;
  canBuy?: boolean;
  tbaBalance?: bigint | undefined;
}

export const GameDashboard = ({ tbaAddress, className = "" }: GameDashboardProps) => {
  const [activePanel, setActivePanel] = useState<"create" | "hub">("create");

  // Get Smart Account TBA (priority over prop)
  const { tbaAddress: smartAccountTbaAddress } = useSmartAccountTBA();

  // Smart Account Context
  // const { shouldShowCreateTBA } = useSmartAccountContext(); // Not used anymore

  // Use Smart Account TBA if available, otherwise use prop TBA
  const effectiveTbaAddress = smartAccountTbaAddress || tbaAddress;

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
    <div className={`relative w-[445px] ${className}`}>
      {/* Gaming Style Container with Animated Border */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-2xl blur-sm opacity-60 animate-pulse"></div>

        <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 p-2 rounded-2xl shadow-2xl border border-purple-400/40">
          {/* Toggle Header */}
          <div className="mb-4 mt-7">
            <div className="flex items-center justify-between bg-slate-800/80 rounded-xl p-3 border border-slate-700/50">
              {/* Left Tab - Create Account */}
              <motion.button
                onClick={() => setActivePanel("create")}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg font-bold text-sm transition-all duration-300 flex-1 mr-2 cursor-pointer ${
                  activePanel === "create"
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25"
                    : "bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-slate-300"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <User size={16} />
                <span>ACCOUNT</span>
                {activePanel === "create" && (
                  <motion.div
                    className="w-2 h-2 bg-white rounded-full"
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </motion.button>

              {/* Toggle Visual Indicator */}
              <div className="flex items-center gap-2">
                <motion.div animate={{ x: activePanel === "create" ? -10 : 10 }} className="text-cyan-400">
                  {activePanel === "create" ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </motion.div>

                <div className="relative w-12 h-6 bg-slate-600 rounded-full p-1">
                  <motion.div
                    className="w-4 h-4 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full shadow-lg"
                    animate={{
                      x: activePanel === "create" ? 0 : 20,
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </div>

                <motion.div animate={{ x: activePanel === "hub" ? 10 : -10 }} className="text-purple-400">
                  {activePanel === "hub" ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                </motion.div>
              </div>

              {/* Right Tab - Game Hub */}
              <motion.button
                onClick={() => setActivePanel("hub")}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg font-bold text-sm transition-all duration-300 flex-1 ml-2 cursor-pointer ${
                  activePanel === "hub"
                    ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/25"
                    : "bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-slate-300"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <GamepadIcon size={16} />
                <span>COMBINE</span>
                {activePanel === "hub" && (
                  <motion.div
                    className="w-2 h-2 bg-white rounded-full"
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </motion.button>
            </div>
          </div>

          {/* Panel Content with Slide Animation */}
          <div className="relative overflow-hidden rounded-xl">
            <AnimatePresence mode="wait" custom={activePanel === "hub" ? 1 : -1}>
              <motion.div
                key={activePanel}
                custom={activePanel === "hub" ? 1 : -1}
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
                {activePanel === "create" ? (
                  <div className="space-y-4 h-full overflow-y-auto pr-2">
                    <FinalSmartAccount />
                    <CreateTBA />
                    {/* <WalletBalance /> */}
                  </div>
                ) : (
                  <div className="space-y-4 h-full overflow-y-auto pr-2">
                    <SpecialBox />
                    <Ingredient tbaAddress={effectiveTbaAddress} className="mb-6" />
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
                  activePanel === "create" ? "bg-emerald-400 shadow-lg shadow-emerald-400/50" : "bg-slate-600"
                }`}
              ></div>
              <div
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  activePanel === "hub" ? "bg-purple-400 shadow-lg shadow-purple-400/50" : "bg-slate-600"
                }`}
              ></div>
            </div>
          </div>

          {/* Quick Info Bar */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-800/90 backdrop-blur-sm border border-slate-700/50 rounded-lg px-3 py-1">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-slate-300 font-medium">{activePanel === "create" ? "ACCOUNT" : "COMBINE"}</span>
            </div>
          </div>
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
