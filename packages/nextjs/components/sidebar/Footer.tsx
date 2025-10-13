import { useState } from "react";
import Image from "next/image";
import { TbaBalance } from "./TbaBalance";

// Custom Twitter SVG icon
const TwitterIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    viewBox="0 0 24 24"
    className="h-4 w-4 text-purple-300 group-hover:text-white transition-colors"
  >
    <path d="M23.954 4.569c-.885.389-1.83.654-2.825.775 1.014-.611 1.794-1.574 2.163-2.723-.949.555-2.005.959-3.127 1.184-.897-.959-2.178-1.559-3.594-1.559-2.717 0-4.92 2.203-4.92 4.917 0 .39.045.765.127 1.124-4.087-.205-7.72-2.165-10.148-5.144-.422.722-.664 1.561-.664 2.475 0 1.71.87 3.213 2.188 4.096-.807-.026-1.566-.248-2.228-.616v.061c0 2.385 1.693 4.374 3.946 4.827-.413.111-.849.171-1.296.171-.314 0-.615-.03-.916-.086.631 1.953 2.445 3.377 4.604 3.417-1.68 1.319-3.809 2.105-6.102 2.105-.39 0-.779-.023-1.17-.067 2.189 1.394 4.768 2.209 7.557 2.209 9.054 0 14.002-7.496 14.002-13.986 0-.209 0-.42-.015-.63.961-.689 1.8-1.56 2.46-2.548l-.047-.02z" />
  </svg>
);

// Custom Telegram SVG icon
const TelegramIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    viewBox="0 0 24 24"
    className="h-4 w-4 text-purple-300 group-hover:text-white transition-colors"
  >
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.454 8.454l-1.636 7.273c-.121.515-.454.636-.909.394l-2.545-1.909-1.273 1.273c-.121.121-.242.242-.485.242l.606-2.121 4.849-4.849c.242-.242-.061-.363-.363-.121l-5.697 3.697-2.121-.666c-.485-.151-.485-.485.121-.727l8.485-3.333c.363-.121.666.121.545.606z" />
  </svg>
);

export const Footer = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Tombol toggle footer (hanya mobile) */}
      <button
        className="fixed bottom-4 right-4 z-50 p-3 rounded-full bg-purple-600 text-white shadow-lg md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? "✕" : "☰"}
      </button>

      {/* Wrapper footer */}
      <footer
        className={`
          fixed z-40 
          md:top-0 md:right-0 
          bg-gradient-to-b from-purple-900 via-purple-800 to-indigo-900 text-white border-l border-purple-700/30 flex flex-col
          transition-transform duration-300
          ${isOpen ? "translate-y-0" : "translate-y-full"} 
          md:translate-y-0
          md:w-64 md:h-screen w-full bottom-0
        `}
      >
        {/* Konten footer */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Bagian send/wd Wallet */}
          <div className="flex flex-col translate-x-[-8px] space-y-2 mb-4">
            <TbaBalance />
          </div>

          {/* Bagian connect */}
          <div>
            <h3 className="text-xs font-semibold text-purple-200 uppercase tracking-wider mb-3">Community</h3>
            <div className="space-y-2">
              <a
                href="https://twitter.com/nugrosir"
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-2 p-2 hover:bg-purple-700/30 rounded-lg transition-all duration-200 group"
              >
                <TwitterIcon />
                <span className="text-sm text-purple-300 group-hover:text-white transition-colors">Twitter</span>
              </a>
              <a
                href="https://telegram.com/nugrosir"
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-2 p-2 hover:bg-purple-700/30 rounded-lg transition-all duration-200 group"
              >
                <TelegramIcon />
                <span className="text-sm text-purple-300 group-hover:text-white transition-colors">Telegram</span>
              </a>
            </div>
          </div>

          <hr className="border-purple-600/30" />

          {/* Settings  TODO*/}

          <hr className="border-purple-600/30" />

          {/* Status */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-purple-400">Network</span>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-400">Active</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-purple-400">Version</span>
              <span className="text-xs text-purple-300">v1.0.0</span>
            </div>
          </div>
        </div>

        {/* Bagian bawah */}
        <div className="p-4 border-t border-purple-700/30 flex-shrink-0 text-center space-y-2">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Image src="/uniramble.png" width={40} height={40} alt="Uni Ramble" />
            <span className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              UniRamble
            </span>
          </div>
          <p className="text-white-400 text-sm">
            The next generation GameFi platform combining engaging gameplay with sustainable tokenomics.
          </p>
        </div>
      </footer>
    </>
  );
};

export default Footer;
