"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle, Loader2, Rocket, Wallet, X } from "lucide-react";
import { useGlobalModal } from "~~/contexts/GlobalModalContext";

export const SmartAccountDeployModal = () => {
  const {
    showSmartAccountDeployModal,
    setShowSmartAccountDeployModal,
    deployStep,
    deployError,
    isDeployProcessing,
    deploySuccess, // 🎯 NEW
    deployedAddress, // 🎯 NEW
  } = useGlobalModal();

  if (!showSmartAccountDeployModal) return null;

  // 🎯 Format address for display
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // 🎯 Handle close modal
  const handleClose = () => {
    // Only allow closing if not processing or if there's an error or success
    if (!isDeployProcessing || deployError || deploySuccess) {
      setShowSmartAccountDeployModal(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          onClick={e => e.stopPropagation()}
          className="relative w-full max-w-md mx-4 bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-2xl border border-cyan-500/30 shadow-2xl overflow-hidden"
        >
          {/* Close Button - Only show if not processing or if error/success */}
          {(!isDeployProcessing || deployError || deploySuccess) && (
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-700/50 hover:bg-slate-600/50 border border-slate-500/30 flex items-center justify-center transition-colors z-10"
            >
              <X className="w-4 h-4 text-slate-300" />
            </button>
          )}

          {/* Header */}
          <div className="p-6 pb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                {deploySuccess ? (
                  <CheckCircle className="w-6 h-6 text-white" />
                ) : deployError ? (
                  <AlertCircle className="w-6 h-6 text-white" />
                ) : (
                  <Rocket className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  {deploySuccess ? "Smart Account Created!" : "Create Smart Account"}
                </h3>
                <p className="text-sm text-cyan-300">
                  {deploySuccess ? "Ready for gasless gaming" : "Gasless deployment"}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 pb-6 space-y-4">
            {/* 🎯 SUCCESS STATE */}
            {deploySuccess && deployedAddress && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                {/* Success Message */}
                <div className="p-4 bg-green-500/10 rounded-xl border border-green-400/30">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-sm font-semibold text-green-300">Deployment Successful!</span>
                  </div>
                  <p className="text-xs text-green-200">
                    Your Smart Account has been created and is ready to use for gasless transactions.
                  </p>
                </div>

                {/* Deployed Address */}
                <div className="p-4 bg-slate-700/30 rounded-xl border border-slate-600/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-medium text-cyan-300">Smart Account Address</span>
                  </div>
                  <p className="text-sm text-white font-mono break-all">{deployedAddress}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Short: <span className="text-cyan-300">{formatAddress(deployedAddress)}</span>
                  </p>
                </div>

                {/* Next Steps */}
                <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-400/30">
                  <p className="text-xs text-blue-200 mb-2">
                    <span className="font-semibold">Next Steps:</span>
                  </p>
                  <ul className="text-xs text-blue-300 space-y-1">
                    <li className="flex items-start gap-2">
                      <span className="mt-1 w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0"></span>
                      <span>Start playing games with gasless transactions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0"></span>
                      <span>Use your smart account for all future interactions</span>
                    </li>
                  </ul>
                </div>
              </motion.div>
            )}

            {/* 🎯 ERROR STATE */}
            {deployError && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="p-4 bg-red-500/10 rounded-xl border border-red-400/30">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <span className="text-sm font-semibold text-red-300">Deployment Failed</span>
                  </div>
                  <p className="text-xs text-red-200">{deployError}</p>
                </div>

                <div className="p-4 bg-slate-700/30 rounded-xl border border-slate-600/30">
                  <p className="text-xs text-slate-300">Please try again or contact support if the issue persists.</p>
                </div>
              </motion.div>
            )}

            {/* 🎯 PROCESSING STATE */}
            {!deploySuccess && !deployError && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                {/* Progress Bar */}
                <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(deployStep / 2) * 100}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full"
                  ></motion.div>
                </div>

                {/* Steps */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Step 1 */}
                  <div
                    className={`p-3 rounded-xl border transition-all ${
                      deployStep >= 1 ? "bg-purple-500/10 border-purple-400/30" : "bg-slate-700/30 border-slate-600/30"
                    }`}
                  >
                    <div className="flex flex-col items-center text-center">
                      {deployStep >= 1 ? (
                        <CheckCircle className="w-6 h-6 text-green-400 mb-2" />
                      ) : (
                        <div className="w-6 h-6 border-2 border-slate-500 rounded-full mb-2 flex items-center justify-center">
                          <span className="text-xs text-slate-400 font-bold">1</span>
                        </div>
                      )}
                      <h4 className="font-bold text-white text-sm mb-1">Welcome Sign</h4>
                      <p className="text-xs text-slate-300">{deployStep >= 1 ? "✅ Signed" : "⏳ Waiting"}</p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div
                    className={`p-3 rounded-xl border transition-all ${
                      deployStep >= 2 ? "bg-cyan-500/10 border-cyan-400/30" : "bg-slate-700/30 border-slate-600/30"
                    }`}
                  >
                    <div className="flex flex-col items-center text-center">
                      {deployStep >= 2 ? (
                        <CheckCircle className="w-6 h-6 text-green-400 mb-2" />
                      ) : (
                        <div className="w-6 h-6 border-2 border-slate-500 rounded-full mb-2 flex items-center justify-center">
                          <span className="text-xs text-slate-400 font-bold">2</span>
                        </div>
                      )}
                      <h4 className="font-bold text-white text-sm mb-1">Deploy Gasless</h4>
                      <p className="text-xs text-slate-300">{deployStep >= 2 ? "✅ Deployed" : "⏳ Waiting"}</p>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="p-4 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-400/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                      {isDeployProcessing ? (
                        <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                      ) : (
                        <Rocket className="w-4 h-4 text-cyan-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-cyan-300">
                        {deployStep === 1
                          ? "Signing Welcome Message..."
                          : deployStep === 2
                            ? "Deploying Smart Account..."
                            : "Complete"}
                      </p>
                      <p className="text-xs text-slate-300">
                        {deployStep === 1
                          ? "Please sign the welcome message in your wallet"
                          : deployStep === 2
                            ? "Confirm deployment in your wallet"
                            : "All steps completed successfully"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                <div className="p-4 bg-slate-700/30 rounded-xl border border-slate-600/30">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <span className="text-xs font-bold text-white">!</span>
                    </div>
                    <p className="text-sm text-slate-300 font-medium">Instructions</p>
                  </div>
                  <p className="text-xs text-slate-400">
                    {deployStep === 1
                      ? "Sign the welcome message to authenticate your identity"
                      : deployStep === 2
                        ? "Confirm the deployment transaction in your wallet"
                        : "Your smart account is ready to use!"}
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SmartAccountDeployModal;
