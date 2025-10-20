"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

export const MobileWarning = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user is on mobile device
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const mobileKeywords = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
      const isMobileDevice = mobileKeywords.test(userAgent) || window.innerWidth < 768;

      setIsMobile(isMobileDevice);

      // Check if user has dismissed the warning in this session
      const isDismissed = sessionStorage.getItem("mobile-warning-dismissed");
      if (isMobileDevice && !isDismissed) {
        setIsVisible(true);
      }
    };

    checkMobile();

    // Re-check on resize
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    // Save dismissal state for this session
    sessionStorage.setItem("mobile-warning-dismissed", "true");
  };

  if (!isMobile || !isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative bg-base-100 rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-base-200 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="bg-warning/20 rounded-full p-4">
            <svg
              className="w-12 h-12 text-warning"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center mb-4">Desktop Experience Required</h2>

        {/* Message */}
        <div className="space-y-3 text-center text-base-content/80">
          <p>
            UniRamble GamiFi currently provides the best experience on{" "}
            <span className="font-semibold text-primary">desktop devices</span>.
          </p>
          <p>
            We are working hard to bring you a{" "}
            <span className="font-semibold text-secondary">mobile-optimized version</span> soon!
          </p>
        </div>

        {/* Features Coming Soon */}
        <div className="mt-6 p-4 bg-base-200 rounded-lg">
          <p className="text-sm font-semibold mb-2 text-center">Coming Soon:</p>
          <ul className="text-sm space-y-1 text-base-content/70">
            <li className="flex items-center gap-2">
              <span className="text-success">✓</span>
              Mobile-responsive design
            </li>
            <li className="flex items-center gap-2">
              <span className="text-success">✓</span>
              Touch-optimized controls
            </li>
            <li className="flex items-center gap-2">
              <span className="text-success">✓</span>
              Native mobile wallet support
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col gap-3">
          <button onClick={handleDismiss} className="btn btn-primary btn-block">
            Continue Anyway
          </button>
          <p className="text-xs text-center text-base-content/60">
            For the best experience, please visit us on desktop
          </p>
        </div>
      </div>
    </div>
  );
};
