import { GameDashboard } from "./GameDashboard";
import { AnimatePresence, motion } from "framer-motion";
import { GamepadIcon, X } from "lucide-react";

interface MobilePanelsProps {
  showGameHubPanel: boolean;
  setShowGameHubPanel: (show: boolean) => void;
  tbaAddress: string | undefined;
  foodTokens: Array<{
    name: string;
    amount: any;
    icon: string;
    color: string;
  }>;
  gridData: any[];
  playerPosition: number;
  faucetUsed: boolean;
  canBuy: boolean;
}

export const MobilePanels = ({
  showGameHubPanel,
  setShowGameHubPanel,
  tbaAddress,
  foodTokens,
  gridData,
  playerPosition,
  faucetUsed,
  canBuy,
}: MobilePanelsProps) => {
  const closePanels = () => {
    setShowGameHubPanel(false);
  };

  return (
    <>
      {/* Mobile Header with Toggle */}
      <div className="bg-white/80 backdrop-blur-sm shadow-lg p-4">
        <div className="flex justify-between items-center">
          <div className="w-20"></div> {/* Spacer for centering */}
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Uniramble Board
          </h1>
          <motion.button
            onClick={() => setShowGameHubPanel(!showGameHubPanel)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              showGameHubPanel
                ? "bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg"
                : "bg-gradient-to-r from-cyan-100 to-purple-100 text-cyan-800 hover:from-cyan-200 hover:to-purple-200"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <GamepadIcon size={18} />
            <span className="text-sm font-bold">GameHub</span>
          </motion.button>
        </div>
      </div>

      {/* Mobile Game Hub Panel Overlay */}
      <AnimatePresence>
        {showGameHubPanel && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/60 z-50"
              onClick={closePanels}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Panel */}
            <motion.div
              initial={{ y: -100, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -100, opacity: 0, scale: 0.9 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 25,
              }}
              className="fixed top-20 left-4 right-4 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl shadow-2xl border border-cyan-400/30 z-50 max-h-[75vh] overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-slate-800 to-purple-800 p-4 border-b border-cyan-400/20">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-bold text-cyan-300 flex items-center gap-2">
                    <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
                    Game Hub
                  </h2>
                  <motion.button
                    onClick={() => setShowGameHubPanel(false)}
                    className="p-2 hover:bg-cyan-400/20 rounded-lg transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X size={20} className="text-cyan-300" />
                  </motion.button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 overflow-y-auto max-h-[calc(75vh-80px)]">
                <GameDashboard
                  tbaAddress={tbaAddress}
                  foodTokens={foodTokens}
                  gridData={gridData}
                  playerPosition={playerPosition}
                  faucetUsed={faucetUsed}
                  canBuy={canBuy}
                  tbaBalance={undefined}
                  className="!bg-transparent !border-0 !shadow-none !p-0"
                />
              </div>

              {/* Subtle bottom gradient */}
              <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none rounded-b-2xl"></div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
