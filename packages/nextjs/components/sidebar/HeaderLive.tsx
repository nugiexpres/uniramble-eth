"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

// import AlchemyConnectButton from "~~/components/ui/alchemyConnectButton";

// import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

export const HeaderLive = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 bg-purple-700 py-1 shadow-lg relative z-40">
      <div className="w-full px-0 flex justify-between items-center relative">
        {/* Logo + Title */}
        <div className="flex items-center space-x-3">
          <button onClick={() => setIsOpen(!isOpen)} className="flex items-center space-x-2 focus:outline-none">
            <Image src="/assets/uniramble-logo.png" alt="UniRamble" width={50} height={50} />
          </button>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center px-2 space-x-4">
            <Link
              href="/"
              className="text-white hover:text-yellow-300 px-4 py-2 rounded-lg bg-black hover:bg-purple-500"
            >
              Home
            </Link>
            <Link
              href="/account"
              className="text-white hover:text-yellow-300 px-4 py-2 rounded-lg bg-black hover:bg-purple-500"
            >
              Account
            </Link>
            <Link
              href="/uniboard"
              className="text-white hover:text-yellow-300 px-4 py-2 rounded-lg bg-black hover:bg-purple-500"
            >
              GameBoard
            </Link>
            <Link
              href="/marketplace"
              className="text-white hover:text-yellow-300 px-4 py-2 rounded-lg bg-black hover:bg-purple-500"
            >
              MarketPlace
            </Link>
          </nav>
        </div>

        {/* Wallet connection is centralized to main Header.tsx */}

        {/* Mobile Dropdown Menu */}
        {isOpen && (
          <div className="absolute top-full left-0 w-full max-w-[180px] g-purple-800 text-white flex flex-col items-start gap-2 px-0 py-4 rounded-box shadow-lg md:hidden animate-fade-down z-50">
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="w-full block px-4 py-1 rounded-lg bg-black hover:text-yellow-300"
            >
              Home
            </Link>
            <Link
              href="/account"
              onClick={() => setIsOpen(false)}
              className="w-full block px-4 py-1 rounded-lg bg-black hover:text-yellow-300"
            >
              Account
            </Link>
            <Link
              href="/uniboard"
              onClick={() => setIsOpen(false)}
              className="w-full block px-4 py-1 rounded-lg bg-black hover:text-yellow-300"
            >
              GameBoard
            </Link>
            <Link
              href="/marketplace"
              onClick={() => setIsOpen(false)}
              className="w-full block px-4 py-1 rounded-lg bg-black hover:text-yellow-300"
            >
              MarketPlace
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
