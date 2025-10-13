"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, Wallet, X } from "lucide-react";
import { useAccount } from "wagmi";
import { useSmartAccountContext } from "~~/contexts/SmartAccountContext";

interface SmartAccountLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const SmartAccountLoginModal = ({ isOpen, onClose, onLoginSuccess }: SmartAccountLoginModalProps) => {
  const { address, isConnected } = useAccount();
  const {
    isSmartAccountLoggedIn,
    setIsSmartAccountLoggedIn,
    smartAccountAddress,
    setSmartAccountAddress,
    isSmartAccountDeployed,
    setIsSmartAccountDeployed,
  } = useSmartAccountContext();

  const handleLogin = async () => {
    if (!isConnected || !address) {
      return;
    }

    try {
      console.log("Handling Smart Account login/restore...");

      // Real implementation: Restore Smart Account from sessionStorage
      if (typeof window !== "undefined") {
        // Get saved Smart Account data from sessionStorage
        const mappingKey = sessionStorage.getItem(`sa_mapping_${address}`);

        if (mappingKey) {
          // Smart Account exists - restore it
          const savedState = sessionStorage.getItem(mappingKey);
          if (!savedState) {
            throw new Error("Smart Account session expired");
          }

          const stateData = JSON.parse(savedState);

          // Validate saved state
          if (!stateData?.smartAccountAddress || !stateData?.eoaAddress || stateData.eoaAddress !== address) {
            throw new Error("Invalid Smart Account data");
          }

          // Check if state is not too old (6 hours)
          const isStateValid = Date.now() - (stateData?.timestamp || 0) < 6 * 60 * 60 * 1000;
          if (!isStateValid) {
            throw new Error("Smart Account session expired");
          }

          // Restore Smart Account state
          console.log("Restoring existing Smart Account:", stateData.smartAccountAddress);
          setIsSmartAccountLoggedIn(true);
          setIsSmartAccountDeployed(stateData.isDeployed || false);
          setSmartAccountAddress(stateData.smartAccountAddress);
        } else {
          // No Smart Account found - this is a new user
          console.log("No Smart Account found - this is a new user");
          // For new users, we'll set basic states but they need to create Smart Account
          setIsSmartAccountLoggedIn(false);
          setIsSmartAccountDeployed(false);
          setSmartAccountAddress(null);
        }

        // Call success callback
        onLoginSuccess();
        onClose();
      } else {
        throw new Error("SessionStorage not available");
      }
    } catch (error) {
      console.error("Smart Account login failed:", error);
      // Show error to user
      alert(`Login failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
        style={{ zIndex: 99999 }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-sm mx-4 bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-2xl border border-cyan-500/30 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          style={{ zIndex: 99999 }}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-slate-700/50 hover:bg-slate-600/50 border border-slate-500/30 flex items-center justify-center transition-colors z-[100000] backdrop-blur-sm"
          >
            <X className="w-4 h-4 text-slate-300" />
          </button>

          {/* Header */}
          <div className="p-3 pb-2 flex-shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <Wallet className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Login Smart Account</h3>
                <p className="text-xs text-cyan-300">Restore session</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-3 pb-3 space-y-2 flex-1 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-2">
              {/* Wallet Info */}
              <div className="p-2 bg-slate-700/30 rounded-lg border border-slate-600/30">
                <div className="flex items-center gap-1 mb-1">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-green-300">Wallet</span>
                </div>
                <p className="text-xs text-slate-300 font-mono">
                  {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Not connected"}
                </p>
              </div>

              {/* Smart Account Status */}
              <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-400/30">
                <div className="flex items-center gap-1 mb-1">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                  <span className="text-xs font-medium text-blue-300">Smart Account</span>
                </div>
                <p className="text-xs text-blue-200 mb-1">{isSmartAccountLoggedIn ? "Logged in" : "Not logged in"}</p>
                {smartAccountAddress && (
                  <p className="text-xs text-blue-300 font-mono">
                    {smartAccountAddress.slice(0, 6)}...{smartAccountAddress.slice(-4)}
                  </p>
                )}
                {isSmartAccountDeployed && (
                  <div className="flex items-center gap-1 mt-1">
                    <CheckCircle className="w-3 h-3 text-green-400" />
                    <p className="text-xs text-green-400">Deployed</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {/* Instructions */}
              <div className="p-2 bg-slate-700/20 rounded-lg border border-slate-600/20">
                <p className="text-xs text-slate-300 text-center">Restore session to continue gaming</p>
              </div>

              {/* Login Button */}
              <button
                onClick={handleLogin}
                disabled={!isConnected || isSmartAccountLoggedIn || !isSmartAccountDeployed}
                className={`w-full py-2 px-3 rounded-lg font-medium text-xs transition-all flex items-center justify-center gap-2 ${
                  !isConnected || isSmartAccountLoggedIn || !isSmartAccountDeployed
                    ? "bg-slate-600/50 text-slate-400 cursor-not-allowed border border-slate-600/30"
                    : "bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white shadow-lg hover:shadow-cyan-500/25 border border-cyan-400/30"
                }`}
              >
                {isSmartAccountLoggedIn ? (
                  <>
                    <CheckCircle className="w-3 h-3" />
                    Already Logged In
                  </>
                ) : !isSmartAccountDeployed ? (
                  <>
                    <X className="w-3 h-3" />
                    Not Deployed
                  </>
                ) : (
                  <>
                    <Wallet className="w-3 h-3" />
                    Login Smart Account
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SmartAccountLoginModal;
