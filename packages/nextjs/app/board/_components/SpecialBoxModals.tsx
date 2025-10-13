import { useEffect } from "react";
import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "framer-motion";
import { Gift } from "lucide-react";

interface SpecialBoxModalsProps {
  showModal: boolean;
  showSuccessModal: boolean;
  setShowModal: (show: boolean) => void;
  setShowSuccessModal: (show: boolean) => void;
  hamburgerCount?: number;
  specialBoxCount?: number;
}

export const SpecialBoxModals = ({
  showModal,
  showSuccessModal,
  setShowModal,
  setShowSuccessModal,
  hamburgerCount = 0,
  specialBoxCount = 0,
}: SpecialBoxModalsProps) => {
  // Fireworks animation function
  const triggerFireworks = () => {
    const duration = 2 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

    const interval: NodeJS.Timeout = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);

      const particleCount = 50 * (timeLeft / duration);
      confetti(
        Object.assign({}, defaults, {
          particleCount,
          origin: {
            x: Math.random(),
            y: Math.random() - 0.2,
          },
        }),
      );
    }, 250);
  };

  // Trigger fireworks when success modal appears
  useEffect(() => {
    if (showSuccessModal) {
      // Add small delay to ensure modal is rendered
      const timer = setTimeout(() => {
        triggerFireworks();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [showSuccessModal]);

  return (
    <>
      {/* Failed Mint Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999]"
            style={{ zIndex: 99999 }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl max-w-md mx-4 overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-red-500 to-pink-500 p-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="text-2xl">⚠️</span>
                  Mint Failed
                </h2>
              </div>
              <div className="p-6">
                <p className="text-gray-700 mb-6 leading-relaxed">
                  {hamburgerCount < 10 ? (
                    <>
                      You need <strong>10 hamburgers</strong> to mint a Special Box. You currently have{" "}
                      <strong>{hamburgerCount}</strong> hamburgers.
                    </>
                  ) : (
                    <>
                      You have already minted a Special Box with your current hamburgers. Collect{" "}
                      <strong>10 more hamburgers</strong> to mint another Special Box.
                    </>
                  )}
                </p>
                <div className="text-sm text-gray-500 mb-4">
                  Current: {hamburgerCount} hamburgers, {specialBoxCount} Special Boxes
                </div>
                <button
                  className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
                  onClick={() => setShowModal(false)}
                >
                  Got it!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Mint Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999]"
            style={{ zIndex: 99999 }}
            onClick={() => setShowSuccessModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-xl shadow-2xl max-w-md mx-4 overflow-hidden max-h-[90vh] flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="text-2xl">🎉</span>
                  Success!
                </h2>
              </div>
              <div className="p-6 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
                  <Gift className="w-10 h-10 text-white" />
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  <strong>Congratulations!</strong> You have successfully minted a Special Box. Check your collection
                  for amazing rewards!
                </p>
                <button
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
                  onClick={() => setShowSuccessModal(false)}
                >
                  Awesome!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
