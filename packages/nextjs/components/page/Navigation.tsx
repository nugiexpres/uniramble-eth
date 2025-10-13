import Image from "next/image";
import Link from "next/link";

// import { useAccount } from "wagmi";
// import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";

const Navigation = () => {
  return (
    <nav className="relative z-50 border-b border-white/10 backdrop-blur-xl bg-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Image src="/uniramble.png" width={48} height={48} alt="UniRamble" className="rounded-full" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-black animate-pulse"></div>
            </div>
            <div>
              <span className="text-2xl font-black bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
                UniRamble
              </span>
              <div className="text-xs text-gray-400 font-semibold">WEB3 GAMEFI</div>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <Link href="#features" className="text-gray-300 hover:text-yellow-400 transition-colors font-medium">
              Features
            </Link>
            <Link href="#tokenomics" className="text-gray-300 hover:text-yellow-400 transition-colors font-medium">
              Tokenomics
            </Link>
            <Link href="#roadmap" className="text-gray-300 hover:text-yellow-400 transition-colors font-medium">
              Roadmap
            </Link>
          </div>

          <Link
            href="/uniboard"
            className="bg-gradient-to-r from-yellow-500 to-orange-600 text-black px-6 py-3 rounded-full font-bold hover:shadow-2xl hover:shadow-yellow-500/25 transition-all transform hover:scale-105"
          >
            Launch Game
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
