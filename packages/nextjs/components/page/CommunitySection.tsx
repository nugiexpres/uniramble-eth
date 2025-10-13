import Image from "next/image";

const CommunitySection = () => {
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-5xl lg:text-6xl font-black mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Join Our Growing Community
          </h2>
          <p className="text-xl text-gray-300 max-w-4xl mx-auto">
            Connect with thousands of players, developers, and investors building the future of Web3 gaming together.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 backdrop-blur-lg rounded-3xl p-8 border border-blue-500/20 text-center group hover:transform hover:scale-105 transition-all">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-blue-400">Twitter Community</h3>
            <div className="text-4xl font-black text-white mb-2">25K+</div>
            <p className="text-gray-300">Followers & Growing</p>
            <a
              href="https://twitter.com/UniRamble"
              className="mt-4 inline-block bg-blue-500 text-white px-6 py-2 rounded-full font-semibold hover:bg-blue-600 transition-colors"
            >
              Follow @UniRamble
            </a>
          </div>

          <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-lg rounded-3xl p-8 border border-purple-500/20 text-center group hover:transform hover:scale-105 transition-all">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-purple-400">Telegram Group</h3>
            <div className="text-4xl font-black text-white mb-2">18K+</div>
            <p className="text-gray-300">Active Members</p>
            <a
              href="https://t.me/UniRamble"
              className="mt-4 inline-block bg-purple-500 text-white px-6 py-2 rounded-full font-semibold hover:bg-purple-600 transition-colors"
            >
              Join Telegram
            </a>
          </div>

          <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 backdrop-blur-lg rounded-3xl p-8 border border-green-500/20 text-center group hover:transform hover:scale-105 transition-all">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-green-400">Medium Blog</h3>
            <div className="text-4xl font-black text-white mb-2">5K+</div>
            <p className="text-gray-300">Readers Monthly</p>
            <a
              href="https://medium.com/@UniRamble"
              className="mt-4 inline-block bg-green-500 text-white px-6 py-2 rounded-full font-semibold hover:bg-green-600 transition-colors"
            >
              Read Updates
            </a>
          </div>
        </div>

        {/* Testimonials */}
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-lg rounded-3xl p-8 border border-white/10">
            <div className="flex items-start space-x-4 mb-6">
              <Image src="/testimonial1.jpg" width={60} height={60} alt="Player" className="rounded-full" />
              <div>
                <div className="font-bold text-white">Alex Chen</div>
                <div className="text-gray-400 text-sm">Top 50 Player • $2.3K earned</div>
              </div>
            </div>
            <p className="text-gray-300 italic leading-relaxed">
              &quote;UniRamble changed my perspective on gaming. I am not just having fun&apos;I am building real
              wealth. The strategy depth keeps me engaged, and the rewards keep growing month after month.&quote;
            </p>
            <div className="flex text-yellow-400 mt-4">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-lg rounded-3xl p-8 border border-white/10">
            <div className="flex items-start space-x-4 mb-6">
              <Image src="/testimonial2.jpg" width={60} height={60} alt="Investor" className="rounded-full" />
              <div>
                <div className="font-bold text-white">Sarah Martinez</div>
                <div className="text-gray-400 text-sm">Early Investor • 340% ROI</div>
              </div>
            </div>
            <p className="text-gray-300 italic leading-relaxed">
              &quote;As an investor, UniRamble impressed me with its sustainable tokenomics and engaged community. The
              team delivers on promises, and the ROI speaks for itself. This is the future of GameFi.&quote;
            </p>
            <div className="flex text-yellow-400 mt-4">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CommunitySection;
