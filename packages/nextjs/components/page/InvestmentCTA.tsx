import Link from "next/link";

const InvestmentCTA = () => {
  return (
    <section
      id="investment"
      className="py-20 bg-gradient-to-r from-yellow-900/20 via-orange-900/30 to-red-900/20 backdrop-blur-lg"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl lg:text-7xl font-black mb-8 bg-gradient-to-r from-white via-yellow-200 to-yellow-400 bg-clip-text text-transparent leading-tight">
            Ready to Build the Future?
          </h2>

          <p className="text-xl lg:text-2xl text-gray-300 mb-12 leading-relaxed">
            Join thousands of players and investors who are already part of the UniRamble ecosystem.
            <strong className="text-white">
              {" "}
              Deploy your account, start playing today, and explore future reward opportunities.
            </strong>
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
            <Link
              href="/account"
              className="group bg-gradient-to-r from-yellow-500 to-orange-600 text-black px-12 py-5 rounded-full font-black text-xl hover:shadow-2xl hover:shadow-yellow-500/25 transition-all transform hover:scale-105"
            >
              <span className="flex items-center justify-center space-x-3">
                <span>Create Account</span>
                <svg
                  className="w-6 h-6 group-hover:translate-x-1 transition-transform"
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
              href="/uniboard"
              className="border-2 border-white/30 text-white px-12 py-5 rounded-full font-bold text-xl hover:bg-white/10 hover:border-white/50 transition-all"
            >
              Launch Game
            </Link>

            <Link
              href="/whitepaper"
              className="border-2 border-yellow-400/50 text-yellow-400 px-12 py-5 rounded-full font-bold text-xl hover:bg-yellow-400/10 hover:border-yellow-400 transition-all"
            >
              Whitepaper
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="bg-black/40 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              <div>
                <div className="text-3xl font-black text-yellow-400 mb-1">$2.4M+</div>
                <div className="text-gray-300 text-sm font-medium">Total Value Locked</div>
              </div>
              <div>
                <div className="text-3xl font-black text-green-400 mb-1">340%</div>
                <div className="text-gray-300 text-sm font-medium">Average ROI (90 days)</div>
              </div>
              <div>
                <div className="text-3xl font-black text-blue-400 mb-1">15K+</div>
                <div className="text-gray-300 text-sm font-medium">Active Players</div>
              </div>
              <div>
                <div className="text-3xl font-black text-purple-400 mb-1">$450K+</div>
                <div className="text-gray-300 text-sm font-medium">Rewards Distributed</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InvestmentCTA;
