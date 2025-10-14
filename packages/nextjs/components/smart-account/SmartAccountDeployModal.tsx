"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, Loader2, Wallet, X } from "lucide-react";

interface SmartAccountDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStep: number;
  totalSteps: number;
  stepTitle: string;
  stepDescription: string;
  isProcessing: boolean;
  error?: string | null;
}

export const SmartAccountDeployModal = ({
  isOpen,
  onClose,
  currentStep,
  totalSteps,
  stepTitle,
  stepDescription,
  isProcessing,
  error,
}: SmartAccountDeployModalProps) => {
  if (!isOpen) return null;

  const progress = (currentStep / totalSteps) * 100;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        style={{ zIndex: 999999, position: "fixed" }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-md mx-4 bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-2xl border border-cyan-500/30 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          style={{ zIndex: 999999 }}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-slate-700/50 hover:bg-slate-600/50 border border-slate-500/30 flex items-center justify-center transition-colors z-[100000] backdrop-blur-sm"
          >
            <X className="w-4 h-4 text-slate-300" />
          </button>

          {/* Gaming Header */}
          <div className="p-4 pb-3 flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Wallet className="w-5 h-5 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Create Smart Account</h3>
                  <p className="text-xs text-cyan-300">
                    Step {currentStep} of {totalSteps} • Gasless Deployment
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">Progress</div>
                <div className="text-sm font-bold text-cyan-400">{Math.round(progress)}%</div>
              </div>
            </div>

            {/* Enhanced Progress Bar */}
            <div className="relative w-full bg-slate-700/50 rounded-full h-2 mb-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="h-2 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-full shadow-lg relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
              </motion.div>
            </div>
          </div>

          {/* Gaming Steps Layout */}
          <div className="px-4 pb-4 flex-1 flex flex-col overflow-y-auto">
            {/* Steps Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* Step 1: Welcome Signature */}
              <div
                className={`p-3 rounded-xl border transition-all ${
                  currentStep === 1
                    ? "bg-purple-500/10 border-purple-400/30 shadow-lg shadow-purple-500/20"
                    : currentStep > 1
                      ? "bg-green-500/10 border-green-400/30 shadow-lg shadow-green-500/20"
                      : "bg-slate-700/30 border-slate-600/30"
                }`}
              >
                <div className="flex flex-col items-center text-center">
                  {currentStep > 1 ? (
                    <CheckCircle className="w-6 h-6 text-green-400 mb-2" />
                  ) : currentStep === 1 ? (
                    <Loader2 className="w-6 h-6 text-purple-400 animate-spin mb-2" />
                  ) : (
                    <div className="w-6 h-6 border-2 border-slate-500 rounded-full mb-2 flex items-center justify-center">
                      <span className="text-xs text-slate-400 font-bold">1</span>
                    </div>
                  )}
                  <h4 className="font-bold text-white text-sm mb-1">Welcome Sign</h4>
                  <p className="text-xs text-slate-300">
                    {currentStep === 1 ? "📝 Signing..." : currentStep > 1 ? "✅ Signed" : "⏳ Waiting"}
                  </p>
                </div>
              </div>

              {/* Step 2: Deploy Smart Account */}
              <div
                className={`p-3 rounded-xl border transition-all ${
                  currentStep === 2
                    ? "bg-cyan-500/10 border-cyan-400/30 shadow-lg shadow-cyan-500/20"
                    : currentStep > 2
                      ? "bg-green-500/10 border-green-400/30 shadow-lg shadow-green-500/20"
                      : "bg-slate-700/30 border-slate-600/30"
                }`}
              >
                <div className="flex flex-col items-center text-center">
                  {currentStep > 2 ? (
                    <CheckCircle className="w-6 h-6 text-green-400 mb-2" />
                  ) : currentStep === 2 ? (
                    <Loader2 className="w-6 h-6 text-cyan-400 animate-spin mb-2" />
                  ) : (
                    <div className="w-6 h-6 border-2 border-slate-500 rounded-full mb-2 flex items-center justify-center">
                      <span className="text-xs text-slate-400 font-bold">2</span>
                    </div>
                  )}
                  <h4 className="font-bold text-white text-sm mb-1">Deploy Gasless</h4>
                  <p className="text-xs text-slate-300">
                    {currentStep > 2 ? "✅ Deployed" : currentStep === 2 ? "📝 Deploying..." : "⏳ Waiting"}
                  </p>
                </div>
              </div>
            </div>

            {/* Gaming Status Section */}
            <div className="space-y-3">
              {/* Current Status */}
              {isProcessing && (
                <div className="p-3 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-400/30 rounded-xl shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                      <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-cyan-300">{stepTitle}</p>
                      <p className="text-xs text-slate-300">{stepDescription}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="p-3 bg-gradient-to-r from-red-500/10 to-pink-500/10 border border-red-400/30 rounded-xl shadow-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-red-500/20 rounded-lg flex items-center justify-center">
                      <X className="w-3 h-3 text-red-400" />
                    </div>
                    <p className="text-sm text-red-300 font-medium">{error}</p>
                  </div>
                </div>
              )}

              {/* Gaming Instructions */}
              <div className="p-3 bg-gradient-to-r from-slate-700/30 to-slate-800/30 rounded-xl border border-slate-600/30 backdrop-blur-sm">
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-xs font-bold text-white">!</span>
                  </div>
                  <p className="text-sm text-slate-300 text-center font-medium">
                    {currentStep === 1
                      ? "🔐 Signature 1/2: Sign Welcome to Uniramble message"
                      : currentStep === 2
                        ? "🔐 Signature 2/2: Deploying Smart Account (Gasless)"
                        : "🎉 Smart Account ready!"}
                  </p>
                  <p className="text-xs text-slate-400 text-center">
                    {currentStep === 1
                      ? "Check your wallet to sign the welcome message"
                      : currentStep === 2
                        ? "Check your wallet to confirm deployment"
                        : "Both signatures completed successfully"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SmartAccountDeployModal;
