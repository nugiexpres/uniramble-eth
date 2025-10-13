"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChainSwitcher } from "./ChainSwitcher";
import clsx from "clsx";
import { Gamepad2, Gift, Home, LucideCrown, Menu, ShoppingBag, User, X } from "lucide-react";

// import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";

const Sidebar = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { name: "Home", icon: Home, path: "/" },
    { name: "Account", icon: User, path: "/uniaccount" },
    { name: "UniRamble", icon: Gamepad2, path: "/uniboard" },
    { name: "UniBattle", icon: User, path: "/unibattle" },
    { name: "RewardCenter", icon: Gift, path: "/rewardcenter" },
    { name: "MarketPlace", icon: ShoppingBag, path: "/marketplace" },
    { name: "Leaderboard", icon: LucideCrown, path: "/leaderboard" },
  ];

  const isMenuActive = (path: string) => {
    if (!pathname) return false;
    return path === "/" ? pathname === "/" : pathname.startsWith(path);
  };

  return (
    <>
      {/* Hamburger Button (mobile only) */}
      <button
        className="md:hidden absolute top-1 left-1 z-50 p-2 rounded-lg bg-purple-700 text-white shadow-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed top-0 left-0 h-screen w-64 bg-gradient-to-b from-purple-900 via-purple-800 to-indigo-900 text-white border-r border-purple-700/30 flex flex-col z-40 transform transition-transform duration-300",
          "md:translate-x-0", // Always visible on desktop
          isOpen ? "translate-x-0" : "-translate-x-full", // Mobile toggle
        )}
      >
        {/* Brand */}
        <div className="p-4 border-b border-purple-700/30 flex-shrink-0">
          <div className="flex items-center justify-center gap-2">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Image src="/uniramble.png" width={40} height={40} alt="Uni Ramble" />
              <span className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                UniRamble
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Wallet Connection */}
          {/* <RainbowKitCustomConnectButton /> */}

          {/* Navigation */}
          <div>
            <h3 className="text-xs font-semibold text-purple-200 uppercase tracking-wider mb-3">Navigation</h3>
            <ul className="space-y-2">
              {menuItems.map(item => {
                const Icon = item.icon;
                const active = isMenuActive(item.path);
                return (
                  <li key={item.name}>
                    <Link
                      href={item.path}
                      onClick={() => setIsOpen(false)} // Close sidebar on mobile click
                      className={clsx(
                        "flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group",
                        active
                          ? "bg-gradient-to-r from-purple-500/30 to-indigo-500/30 border border-purple-400/50 text-white"
                          : "hover:bg-purple-700/30 text-purple-200 hover:text-white",
                      )}
                    >
                      <Icon
                        size={20}
                        className={clsx(active ? "text-purple-300" : "text-purple-400 group-hover:text-purple-300")}
                      />
                      <span className="font-medium">{item.name}</span>
                      {active && (
                        <div className="ml-auto w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></div>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Fixed Footer */}
          <div className="absolute bottom-0 left-0 w-full p-4 border-t border-purple-700/30 flex-shrink-0 text-center">
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-lg font-semibold text-green-400">Chain</span>
              </div>
              <ChainSwitcher />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
