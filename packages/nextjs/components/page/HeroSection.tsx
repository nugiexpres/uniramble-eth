import Link from "next/link";

const HeroSection = () => {
  const metrics = [
    { label: "TVL", value: "$2.4M+", change: "+45%" },
    { label: "Active Players", value: "15K+", change: "+120%" },
    { label: "NFTs Minted", value: "8.2K", change: "+89%" },
    { label: "Rewards Paid", value: "$450K+", change: "+67%" },
  ];

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/30 to-pink-600/20"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="text-center max-w-5xl mx-auto">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-full px-6 py-2 mb-8">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-yellow-400 text-sm font-semibold">🔥 LIVE NOW • 15K+ ACTIVE PLAYERS</span>
          </div>

          <h1 className="text-6xl lg:text-8xl font-black mb-8 leading-tight">
            <span className="bg-gradient-to-r from-white via-yellow-200 to-yellow-400 bg-clip-text text-transparent">
              Play. Compete.
            </span>
            <br />
            <span className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
              Profit.
            </span>
          </h1>

          <p className="text-xl lg:text-2xl text-gray-300 mb-12 leading-relaxed max-w-4xl mx-auto">
            <strong className="text-white">UniRamble is not just a game. It is a new economy</strong> where your time,
            strategy, and passion create real long-term value through blockchain-powered rewards and NFT ownership.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
            <Link
              href="/account"
              className="group bg-gradient-to-r from-yellow-500 to-orange-600 text-black px-10 py-5 rounded-full font-bold text-lg hover:shadow-2xl hover:shadow-yellow-500/25 transition-all transform hover:scale-105"
            >
              <span className="flex items-center justify-center space-x-2">
                <span>Start Playing Now</span>
                <svg
                  className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            </Link>

            <Link
              href="#investment"
              className="group border-2 border-purple-500/50 text-white px-10 py-5 rounded-full font-bold text-lg hover:bg-purple-500/10 hover:border-purple-400 transition-all"
            >
              <span className="flex items-center justify-center space-x-2">
                <span>Investment Deck</span>
                <svg
                  className="w-5 h-5 group-hover:translate-y-[-2px] transition-transform"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            </Link>
          </div>

          {/* Live Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {metrics.map((metric, index) => (
              <div key={index} className="bg-black/40 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <div className="text-3xl font-black text-yellow-400 mb-1">{metric.value}</div>
                <div className="text-gray-300 font-medium text-sm mb-2">{metric.label}</div>
                <div className="text-green-400 text-xs font-bold">{metric.change} ↗</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
