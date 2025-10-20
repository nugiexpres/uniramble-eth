"use client";

import { useRouter } from "next/navigation";
import { Calendar, Monitor, Smartphone, Zap } from "lucide-react";

export default function MobileNoticePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-base-200 to-base-300 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Main Card */}
        <div className="bg-base-100 rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-secondary p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                <Monitor className="w-16 h-16 text-white" />
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Desktop Experience Required</h1>
            <p className="text-white/90 text-lg">UniRamble GamiFi - Best enjoyed on desktop</p>
          </div>

          {/* Content */}
          <div className="p-8 space-y-6">
            {/* Current Status */}
            <div className="bg-warning/10 border border-warning/30 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <Smartphone className="w-6 h-6 text-warning flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-lg mb-2">Mobile Support Status</h3>
                  <p className="text-base-content/80">
                    UniRamble GamiFi is currently optimized for desktop browsers. While you can continue on mobile, some
                    features may not work as expected or display correctly.
                  </p>
                </div>
              </div>
            </div>

            {/* Why Desktop? */}
            <div>
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Why Desktop?
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1">•</span>
                  <span className="text-base-content/80">
                    Complex blockchain interactions require larger screens for better visibility
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1">•</span>
                  <span className="text-base-content/80">
                    Game mechanics and NFT management are optimized for mouse/keyboard input
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1">•</span>
                  <span className="text-base-content/80">
                    Smart contract debugging tools work best on desktop environments
                  </span>
                </li>
              </ul>
            </div>

            {/* Coming Soon */}
            <div className="bg-gradient-to-br from-secondary/10 to-primary/10 rounded-xl p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-secondary" />
                Mobile Version Coming Soon!
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                  <span className="text-base-content/90">Responsive mobile UI design</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                  <span className="text-base-content/90">Touch-optimized game controls</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                  <span className="text-base-content/90">Native mobile wallet integration</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                  <span className="text-base-content/90">Progressive Web App (PWA) support</span>
                </div>
              </div>
            </div>

            {/* Recommended Action */}
            <div className="border-t border-base-300 pt-6 space-y-3">
              <p className="text-center text-base-content/70">
                For the best experience, please access UniRamble GamiFi from:
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <span className="badge badge-lg badge-primary">Chrome Desktop</span>
                <span className="badge badge-lg badge-primary">Firefox Desktop</span>
                <span className="badge badge-lg badge-primary">Edge Desktop</span>
                <span className="badge badge-lg badge-primary">Safari Desktop</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button onClick={() => router.push("/")} className="btn btn-primary flex-1">
                Continue Anyway
              </button>
              <button onClick={() => window.close()} className="btn btn-outline flex-1">
                Close
              </button>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-sm text-base-content/60 mt-6">
          We appreciate your patience as we work to bring you the best mobile experience possible.
        </p>
      </div>
    </div>
  );
}
