import { motion } from "framer-motion";
import { Package } from "lucide-react";
import { useAccount } from "wagmi";
import { useFoodTokens } from "~~/hooks/board/useFoodTokens";
import { useSmartAccountTBA } from "~~/hooks/envio/useSmartAccountTBA";
import { useTokenBalances } from "~~/hooks/envio/useTokenBalances";

// import { useFinalSmartAccount } from "~~/hooks/smart-account/useFinalSmartAccount";

interface IngredientProps {
  tbaAddress: string | undefined;
  className?: string;
}

// Color mapping for ingredient cards
const getIngredientColor = (name: string) => {
  switch (name.toLowerCase()) {
    case "bread":
      return {
        border: "border-yellow-400/30",
        hover: "hover:border-yellow-400/50",
        gradient: "from-yellow-400 to-orange-500",
        bg: "bg-yellow-500/20",
      };
    case "meat":
      return {
        border: "border-red-400/30",
        hover: "hover:border-red-400/50",
        gradient: "from-red-400 to-red-600",
        bg: "bg-red-500/20",
      };
    case "lettuce":
      return {
        border: "border-green-400/30",
        hover: "hover:border-green-400/50",
        gradient: "from-green-400 to-emerald-500",
        bg: "bg-green-500/20",
      };
    case "tomato":
      return {
        border: "border-red-300/30",
        hover: "hover:border-red-300/50",
        gradient: "from-red-300 to-pink-500",
        bg: "bg-red-300/20",
      };
    default:
      return {
        border: "border-slate-400/30",
        hover: "hover:border-slate-400/50",
        gradient: "from-slate-400 to-slate-600",
        bg: "bg-slate-500/20",
      };
  }
};

// Format amount display
const formatAmount = (amount: bigint | undefined): string => {
  if (!amount) return "0";
  const formatted = (Number(amount) / 10 ** 18).toFixed(0);
  return Number(formatted).toLocaleString();
};

export const Ingredient = ({ tbaAddress, className = "" }: IngredientProps) => {
  const { address } = useAccount();

  // Get Smart Account state
  // const { smartAccountAddress, isDeployed: isSmartAccountDeployed } = useFinalSmartAccount();

  // Get TBA address from Smart Account (priority over prop)
  const { tbaAddress: smartAccountTbaAddress } = useSmartAccountTBA();

  // Use Smart Account TBA if available, otherwise use prop TBA
  const effectiveTbaAddress = smartAccountTbaAddress || tbaAddress;

  // Envio-powered hooks untuk performa lebih cepat - use Smart Account TBA
  const { balances: envioBalances } = useTokenBalances(effectiveTbaAddress);

  // Use the food tokens hook with Smart Account TBA address
  const { foodTokens } = useFoodTokens(effectiveTbaAddress);

  // Calculate total ingredients from both sources
  const totalIngredients = foodTokens.reduce((total, item) => {
    const amount = Number(item.amount || 0) / 10 ** 18;
    return total + amount;
  }, 0);

  // Calculate total from Envio balances
  const envioTotalIngredients =
    Number(envioBalances.bread) +
    Number(envioBalances.meat) +
    Number(envioBalances.lettuce) +
    Number(envioBalances.tomato);

  // Use Envio data if available, otherwise fallback to contract data
  const hasIngredients = envioTotalIngredients > 0 || totalIngredients > 0;

  // Debug logging
  console.log("=== INGREDIENT SMART ACCOUNT TBA DEBUG ===");
  console.log("EOA Address:", address);
  console.log("Prop TBA Address:", tbaAddress);
  console.log("Smart Account TBA Address:", smartAccountTbaAddress);
  console.log("Effective TBA Address:", effectiveTbaAddress);
  console.log("Using Smart Account TBA:", effectiveTbaAddress === smartAccountTbaAddress);
  console.log("Envio balances:", envioBalances);
  console.log("Envio total:", envioTotalIngredients);
  console.log("Contract total:", totalIngredients);
  console.log("==========================================");

  // Show loading if address is not available
  if (!effectiveTbaAddress) {
    return (
      <div className={`relative ${className}`}>
        <div
          className="relative bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl shadow-2xl border border-purple-400/30 backdrop-blur-sm"
          style={{ width: "430px", height: "280px" }}
        >
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400"></div>
            <span className="ml-2 text-slate-400 text-sm">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Animated Border Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 rounded-2xl blur-sm opacity-75 animate-pulse"></div>

      {/* Main Container - Fixed Size */}
      <div
        className="relative bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 rounded-2xl shadow-2xl border border-purple-400/30 backdrop-blur-sm"
        style={{ width: "425px", height: "280px" }}
      >
        {/* Header - Compact */}
        <div className="mb-2">
          <motion.h3
            className="text-lg font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-2"
            animate={{
              textShadow: [
                "0 0 10px rgba(168, 85, 247, 0.5)",
                "0 0 20px rgba(168, 85, 247, 0.8)",
                "0 0 10px rgba(168, 85, 247, 0.5)",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="relative">
              <div className="absolute inset-0 w-2 h-2 bg-purple-400 rounded-full blur-sm animate-ping"></div>
              <Package size={16} className="relative text-purple-400" />
            </div>
            INGREDIENTS
          </motion.h3>
        </div>

        {/* Smart Account TBA Info */}
        {/* 
        {smartAccountTbaAddress && smartAccountTbaAddress !== address && (
          <div className="mb-3 p-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-400/30 rounded-lg">
            <div className="text-xs text-purple-400 font-semibold mb-1 flex items-center gap-1">
              <span>🔗</span>
              SMART ACCOUNT TBA
            </div>
            <div className="text-xs text-slate-300 space-y-1">
              <div>
                TBA: {smartAccountTbaAddress.slice(0, 6)}...{smartAccountTbaAddress.slice(-4)}
              </div>
              <div>Total Ingredients: {envioTotalIngredients}</div>
              <div>Status: {isLoading ? "Indexing..." : "Ready"}</div>
            </div>
          </div>
        )} */}

        {/* No Ingredients State */}
        {!hasIngredients && (
          <div className="flex flex-col items-center justify-center h-48">
            <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-3 border border-slate-600">
              <Package size={20} className="text-slate-500" />
            </div>
            <p className="text-slate-400 text-sm text-center">No ingredients available</p>
            <p className="text-slate-500 text-xs text-center mt-1">Start playing to collect!</p>
          </div>
        )}

        {/* Ingredients Grid - Compact */}
        {hasIngredients && (
          <div className="space-y-1">
            {foodTokens.map((item, index) => {
              const colors = getIngredientColor(item.name);

              // Use Envio balance if available, otherwise fallback to contract data
              let envioAmount = 0n;
              switch (item.name.toLowerCase()) {
                case "bread":
                  envioAmount = envioBalances.bread;
                  break;
                case "meat":
                  envioAmount = envioBalances.meat;
                  break;
                case "lettuce":
                  envioAmount = envioBalances.lettuce;
                  break;
                case "tomato":
                  envioAmount = envioBalances.tomato;
                  break;
              }

              // Use Envio amount if available and greater than 0, otherwise use contract amount
              const finalAmount = envioAmount > 0n ? envioAmount : item.amount;
              const amount = formatAmount(finalAmount);
              const hasAmount = Number(amount.replace(/,/g, "")) > 0;

              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-gradient-to-r from-slate-800 to-slate-700 p-0 rounded-lg border ${
                    colors.border
                  } relative overflow-hidden ${colors.hover} transition-all duration-200 ${
                    hasAmount ? "" : "opacity-50"
                  }`}
                  whileHover={hasAmount ? { scale: 1.01 } : {}}
                >
                  {/* Shimmer effect for items with ingredients */}
                  {hasAmount && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 animate-shimmer"></div>
                  )}

                  {/* Top gradient line */}
                  <div className={`absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r ${colors.gradient}`}></div>

                  <div className="relative flex items-center justify-between">
                    {/* Left side - Icon and Name */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 ${colors.bg} rounded-lg border ${colors.border} backdrop-blur-sm flex items-center justify-center`}
                      >
                        <span className="text-lg">{item.icon}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm flex items-center gap-1">
                          {item.name}
                          {envioAmount > 0n && (
                            <span className="text-xs text-green-400" title="Powered by Envio">
                              ⚡
                            </span>
                          )}
                        </h4>
                      </div>
                    </div>

                    {/* Right side - Amount */}
                    <div className="text-right p-2">
                      <div className={`font-bold text-lg ${hasAmount ? "text-green-400" : "text-slate-500"}`}>
                        {amount}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
      `}</style>
    </div>
  );
};
