"use client";

import { motion } from "framer-motion";
import { AlertCircle, RefreshCw, X } from "lucide-react";

interface ErrorPopupProps {
  isOpen: boolean;
  onClose: () => void;
  errorMessage: string;
  title?: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

export const ErrorPopup = ({
  isOpen,
  onClose,
  errorMessage,
  title = "Error",
  onRetry,
  showRetry = true,
}: ErrorPopupProps) => {
  if (!isOpen) return null;

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999]"
      style={{ zIndex: 99999 }}
    >
      <div className="bg-slate-800 p-6 rounded-xl shadow-2xl border border-red-400/30 max-w-sm mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-red-300">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <div className="text-slate-300 mb-4 text-sm">
            <p className="font-medium mb-2">Operation Failed</p>
            <p className="text-xs break-words leading-relaxed">{errorMessage}</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
            {showRetry && (
              <button
                onClick={handleRetry}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ErrorPopup;
