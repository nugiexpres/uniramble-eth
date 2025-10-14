"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, Info, Network, Zap } from "lucide-react";
import { useEnvioClient } from "~~/hooks/envio";
import { useGameEvents } from "~~/hooks/envio/useGameEvents";
import { usePlayerPositions } from "~~/hooks/envio/usePlayerPositions";
import { getGridInfo } from "~~/utils/grid/gridHelper";

/**
 * EnvioAnalytics — compact, modern component that surfaces real-time game events
 * and documents the Envio <-> DApp flow. Key goals:
 * - Show live events streamed from the Envio indexer (GraphQL subscriptions / queries)
 * - Show optimistic local events emitted by the DApp for instant UX
 * - Keep UI compact and readable for a game dashboard
 * - Demonstrate how Envio ties contract events -> stored entities -> GraphQL
 */

type EventType =
  | "movement"
  | "purchase"
  | "mint"
  | "rail"
  | "faucet"
  | "tba"
  | "cook"
  | "sendNative"
  | "mintNFT"
  | "createSmartAccount";

interface GameEvent {
  id: string;
  type: EventType;
  player: string;
  tbaAddress: string;
  data: any;
  timestamp: number; // ms since epoch
  db_write_timestamp: string; // original db timestamp from Envio
  optimistic?: boolean; // local-only, not yet confirmed on-chain
  optimisticKey?: string; // optional deterministic key to dedupe optimistic event
}

export const EnvioAnalytics = () => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [showHowInfo, setShowHowInfo] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const [overlayPos, setOverlayPos] = useState({ top: 0, left: 0, width: 320 });

  // --- Network detection ---
  const { isEnabled, chainId, chainName } = useEnvioClient();

  // --- Envio hooks (authoritative data) - filtered by current chain ---
  const { latestPositions } = usePlayerPositions();
  const {
    ingredientPurchases,
    specialBoxMints,
    faucetUsedEvents,
    railTravelEvents,
    hamburgerMintEvents,
    tbaCreations,
    loading: eventsLoading,
  } = useGameEvents();

  // Debug: Log raw Envio data dengan detail
  console.log("🔍 EnvioAnalytics - Raw Envio Data:", {
    latestPositions: latestPositions.length,
    latestPositionsData: latestPositions.slice(0, 3),
    ingredientPurchases: ingredientPurchases.length,
    ingredientPurchasesData: ingredientPurchases.slice(0, 3),
    specialBoxMints: specialBoxMints.length,
    faucetUsedEvents: faucetUsedEvents.length,
    railTravelEvents: railTravelEvents.length,
    hamburgerMintEvents: hamburgerMintEvents.length,
    tbaCreations: tbaCreations.length,
    isEnabled,
    chainId,
    chainName,
    eventsLoading,
  });

  // PURELY ENVIO INDEXER - No optimistic events
  // Envio subscriptions sudah sangat cepat (3-5 detik) via WebSocket
  // Menghindari duplicate events dan memastikan data 100% akurat dari blockchain

  // Build canonical on-chain events from Envio hooks
  const onChainEvents: GameEvent[] = useMemo(() => {
    const out: GameEvent[] = [];

    console.log("🏗️ Building events from Envio data...");

    // Movement events (roll dice) - SEMUA events, tidak filter
    console.log("🎲 Processing Movement events, count:", latestPositions.length);
    latestPositions.forEach((m, i) => {
      console.log("🎲 Movement event:", {
        id: m.id,
        player: m.player,
        newPosition: m.newPosition,
        roll: m.roll,
        timestamp: m.db_write_timestamp,
      });
      out.push({
        id: m.id, // Use Envio's unique ID
        type: "movement",
        player: m.player,
        tbaAddress: m.player,
        data: { position: m.newPosition, roll: m.roll || 0 }, // Default 0 for old events
        timestamp: new Date(m.db_write_timestamp).getTime() + i,
        db_write_timestamp: m.db_write_timestamp,
      });
    });

    // Purchase events (buy ingredient) - SEMUA events, tidak filter
    console.log("🛒 Processing Purchase events, count:", ingredientPurchases.length);
    ingredientPurchases.forEach((p, i) => {
      console.log("🛒 Purchase event:", {
        id: p.id,
        player: p.player,
        ingredientType: p.ingredientType,
        position: p.position,
        timestamp: p.db_write_timestamp,
      });
      out.push({
        id: p.id, // Use Envio's unique ID
        type: "purchase",
        player: p.player,
        tbaAddress: p.player,
        data: {
          ingredientType: p.ingredientType,
          position: p.position !== undefined ? p.position : null, // null for old events without position
        },
        timestamp: new Date(p.db_write_timestamp).getTime() + i,
        db_write_timestamp: p.db_write_timestamp,
      });
    });

    // Special box mint events
    specialBoxMints.slice(0, 20).forEach((s, i) => {
      console.log("🎁 SpecialBox Mint:", s);
      out.push({
        id: s.id, // Use Envio's unique ID
        type: "mint",
        player: s.user,
        tbaAddress: s.user,
        data: { hamburgerCount: s.hamburgerCount },
        timestamp: new Date(s.db_write_timestamp).getTime() + i,
        db_write_timestamp: s.db_write_timestamp,
      });
    });

    // Faucet usage events
    faucetUsedEvents.slice(0, 20).forEach((f, i) => {
      console.log("💰 Faucet:", f);
      out.push({
        id: f.id, // Use Envio's unique ID
        type: "faucet",
        player: f.recipient,
        tbaAddress: f.recipient,
        data: { amount: f.amount },
        timestamp: new Date(f.db_write_timestamp).getTime() + i,
        db_write_timestamp: f.db_write_timestamp,
      });
    });

    // Rail travel events
    railTravelEvents.slice(0, 20).forEach((r, i) => {
      console.log("🚄 Rail:", r);
      out.push({
        id: r.id, // Use Envio's unique ID
        type: "rail",
        player: r.player,
        tbaAddress: r.player,
        data: { fromPosition: r.fromPosition, toPosition: r.toPosition },
        timestamp: new Date(r.db_write_timestamp).getTime() + i,
        db_write_timestamp: r.db_write_timestamp,
      });
    });

    // Cook (hamburger mint) events
    hamburgerMintEvents.slice(0, 20).forEach((h, i) => {
      console.log("👨‍🍳 Cook:", h);
      out.push({
        id: h.id, // Use Envio's unique ID
        type: "cook",
        player: h.player,
        tbaAddress: h.player,
        data: { tokenId: h.tokenId },
        timestamp: new Date(h.db_write_timestamp).getTime() + i,
        db_write_timestamp: h.db_write_timestamp,
      });
    });

    // TBA creation events
    tbaCreations.slice(0, 20).forEach((t, i) => {
      console.log("🧾 TBA:", t);
      out.push({
        id: t.id, // Use Envio's unique ID
        type: "tba",
        player: t.eoa,
        tbaAddress: t.tba,
        data: { startPosition: t.startPosition },
        timestamp: new Date(t.db_write_timestamp).getTime() + i,
        db_write_timestamp: t.db_write_timestamp,
      });
    });

    console.log("✅ Total events built:", out.length);
    console.log("📊 Events breakdown:", {
      movement: out.filter(e => e.type === "movement").length,
      purchase: out.filter(e => e.type === "purchase").length,
      rail: out.filter(e => e.type === "rail").length,
      cook: out.filter(e => e.type === "cook").length,
      faucet: out.filter(e => e.type === "faucet").length,
      tba: out.filter(e => e.type === "tba").length,
    });

    // Sort by timestamp (newest first) - TIDAK slice, return semua untuk pool lebih besar
    return out.sort((a, b) => b.timestamp - a.timestamp);
  }, [
    latestPositions,
    ingredientPurchases,
    specialBoxMints,
    faucetUsedEvents,
    railTravelEvents,
    hamburgerMintEvents,
    tbaCreations,
  ]);

  // PURELY ENVIO ON-CHAIN EVENTS - No optimistic, no duplicates
  // Envio subscriptions provide instant updates (3-5s via WebSocket)
  const events = useMemo(() => {
    console.log("🔄 Processing events, onChainEvents count:", onChainEvents.length);

    // Deduplicate by Envio's unique ID (chainId_blockNumber_logIndex)
    const uniqueEvents = new Map<string, GameEvent>();

    for (const event of onChainEvents) {
      // Only add if not already present (prevent duplicates)
      if (!uniqueEvents.has(event.id)) {
        uniqueEvents.set(event.id, event);
      } else {
        console.log("⚠️ Duplicate detected, skipped:", event.id);
      }
    }

    console.log("✅ After deduplication:", uniqueEvents.size);

    // Sort by timestamp (newest first), limit to 13
    const sortedEvents = Array.from(uniqueEvents.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 13);

    // Debug: Log final events
    console.log("📊 Final Events (13 max):", sortedEvents);

    return sortedEvents;
  }, [onChainEvents]);

  // Auto-scroll to bottom when new items arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events.length]);

  // Compute overlay position so it appears right below the toggle button.
  useLayoutEffect(() => {
    const compute = () => {
      const toggle = toggleRef.current;
      const root = rootRef.current;
      if (!toggle || !root) return;
      const rt = root.getBoundingClientRect();
      const tt = toggle.getBoundingClientRect();
      // position relative to root
      const left = 16; // align with component inner padding
      const top = tt.bottom - rt.top + 8; // 8px gap
      const width = Math.max(320, rt.width - 32); // full width minus padding
      setOverlayPos({ top, left, width });
    };

    if (showHowInfo) compute();

    window.addEventListener("resize", compute);
    window.addEventListener("scroll", compute, true);
    return () => {
      window.removeEventListener("resize", compute);
      window.removeEventListener("scroll", compute, true);
    };
  }, [showHowInfo]);

  // --- UI helpers ---
  const formatAddress = (address = "") => (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "—");
  const icons: Record<EventType, string> = {
    movement: "🚶",
    purchase: "🛒",
    mint: "🎁",
    rail: "🚄",
    tba: "🧾",
    faucet: "💰",
    cook: "👨‍🍳",
    sendNative: "💸",
    mintNFT: "🖼️",
    createSmartAccount: "🏦",
  };

  const colors: Record<EventType, string> = {
    movement: "text-sky-400 bg-sky-500/10 border-sky-500/20",
    purchase: "text-green-400 bg-green-500/10 border-green-500/20",
    mint: "text-violet-400 bg-violet-500/10 border-violet-500/20",
    rail: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    tba: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    faucet: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    cook: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    sendNative: "text-pink-400 bg-pink-500/10 border-pink-500/20",
    mintNFT: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    createSmartAccount: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  };

  const describe = (e: GameEvent) => {
    switch (e.type) {
      case "movement": {
        // Handle undefined/null position
        if (e.data.position === undefined || e.data.position === null) {
          return `Rolled ${e.data.roll || "?"} (indexing...)`;
        }
        const position = e.data.position % 20; // Normalize to 0-19
        const gridInfo = getGridInfo(position);
        const roll = e.data.roll || "?"; // Fallback untuk old events
        return `Rolled ${roll} → Grid ${position} (${gridInfo.gridType})`;
      }
      case "purchase": {
        // Handle undefined/null position (old events without position field)
        if (e.data.position === undefined || e.data.position === null) {
          // Fallback: gunakan ingredientType
          const ingredientName =
            e.data.ingredientType === 0
              ? "Bread"
              : e.data.ingredientType === 1
                ? "Meat"
                : e.data.ingredientType === 2
                  ? "Lettuce"
                  : e.data.ingredientType === 3
                    ? "Tomato"
                    : "Ingredient";
          return `Bought ${ingredientName} (old event)`;
        }

        const position = e.data.position % 20; // Normalize to 0-19
        const gridInfo = getGridInfo(position);

        // Use grid info as source of truth for ingredient name (based on position)
        return `Bought ${gridInfo.ingredientName} at Grid ${position}`;
      }
      case "mint":
        return `Minted special box`;
      case "rail": {
        if (e.data.fromPosition === undefined || e.data.toPosition === undefined) {
          return `Rail travel (indexing...)`;
        }
        const fromPos = e.data.fromPosition % 20;
        const toPos = e.data.toPosition % 20;
        return `Rail: Grid ${fromPos} → Grid ${toPos}`;
      }
      case "tba": {
        if (e.data.startPosition === undefined || e.data.startPosition === null) {
          return `TBA created (indexing...)`;
        }
        const startPos = e.data.startPosition % 20;
        const gridInfo = getGridInfo(startPos);
        return `TBA created at Grid ${startPos} (${gridInfo.gridType})`;
      }
      case "faucet": {
        // Convert amount dari wei (string/bigint) ke MON
        const amountWei = e.data.amount || 0;
        const amountMON =
          typeof amountWei === "string"
            ? (parseFloat(amountWei) / 1e18).toFixed(4)
            : (Number(amountWei) / 1e18).toFixed(4);
        return `Faucet used (${amountMON} MON)`;
      }
      case "cook":
        // Cook = 1 Bread + 1 Meat + 1 Lettuce + 1 Tomato → 1 Hamburger
        return `Cooked hamburger (1🍞 1🥩 1🥬 1🍅 → 🍔)`;
      case "sendNative":
        return `Sent ${e.data.amount || "?"} to ${formatAddress(e.data.to)}`;
      case "mintNFT":
        return `Minted Chef NFT to ${formatAddress(e.data.to)}`;
      case "createSmartAccount":
        return `Smart Account ${formatAddress(e.data.smartAccount)} created`;
      default:
        return "Game action";
    }
  };

  return (
    <div
      ref={rootRef}
      className="w-full h-full bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl rounded-2xl border border-slate-700/40 shadow-xl overflow-hidden relative flex flex-col"
    >
      {/* Compact Header */}
      <div className="px-4 py-2 border-b border-slate-700/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-r from-green-400 to-blue-400 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Envio Indexer</div>
              <div className="text-[10px] text-slate-400">{chainName}</div>
            </div>
            <div
              className={`w-2 h-2 rounded-full ml-1 ${eventsLoading ? "bg-yellow-400 animate-pulse" : isEnabled ? "bg-green-400" : "bg-red-400"}`}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              ref={toggleRef}
              onClick={() => setShowHowInfo(s => !s)}
              className="text-xs px-2 py-1 bg-slate-700/20 text-slate-300 hover:text-white rounded"
            >
              <Info className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Events stream - Flex-1 untuk full height */}
      <div className="flex-1 flex flex-col p-2 overflow-hidden">
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800"
        >
          <AnimatePresence>
            {!isEnabled ? (
              <div className="flex items-center justify-center h-36 text-slate-500">
                <div className="text-center">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <div className="text-sm">Envio not enabled</div>
                  <div className="text-xs">for {chainName}</div>
                </div>
              </div>
            ) : events.length === 0 ? (
              <div className="flex items-center justify-center h-36 text-slate-500">
                <div className="text-center">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <div className="text-sm">No events yet</div>
                  <div className="text-xs">Play to see events on {chainName}</div>
                </div>
              </div>
            ) : (
              events.map(e => (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className={`p-2 rounded-lg border ${colors[e.type]}`}
                >
                  <div className="flex items-start gap-2">
                    <div className="text-base leading-none mt-0.5">{icons[e.type]}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs font-medium text-white truncate">{describe(e)}</div>
                        <div className="text-[10px] text-slate-400 whitespace-nowrap">
                          {(() => {
                            // Convert UTC timestamp dari Envio ke local timezone user
                            const localDate = new Date(e.timestamp);
                            const day = localDate.getDate().toString().padStart(2, "0");
                            const month = (localDate.getMonth() + 1).toString().padStart(2, "0");
                            const hours = localDate.getHours().toString().padStart(2, "0");
                            const minutes = localDate.getMinutes().toString().padStart(2, "0");
                            return `${day}/${month} ${hours}:${minutes}`;
                          })()}
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                        <span className="font-mono">{formatAddress(e.tbaAddress)}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer - Powered by Envio (always visible below 13 events) */}
      <div className="px-4 py-2 bg-slate-800/40 border-t border-slate-700/40 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <a
            href="https://envio.dev/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-400 hover:text-white underline flex items-center gap-1.5"
          >
            <Zap className="w-3 h-3" />
            Powered by Envio
          </a>
          <div className="flex items-center gap-1 text-[10px] text-slate-500">
            <Network className="w-3 h-3" />
            <span>
              {chainName} ({chainId})
            </span>
          </div>
        </div>
        <div className="text-[10px] text-slate-500">{events.length}/13</div>
      </div>

      {/* How Envio overlay (absolute) */}
      {showHowInfo && (
        <div className="absolute inset-0 z-40 pointer-events-none">
          {/* backdrop (blue) */}
          <div
            onClick={() => setShowHowInfo(false)}
            className="absolute inset-0 bg-blue-600/30 pointer-events-auto rounded-2xl"
          />

          {/* overlay content positioned using computed overlayPos (below the toggle) */}
          <div
            className="pointer-events-auto"
            style={{ position: "absolute", top: overlayPos.top, left: overlayPos.left, width: overlayPos.width }}
          >
            <div className="bg-slate-900/95 rounded-lg p-4 border border-slate-700/30 text-xs text-slate-300 shadow-xl">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-slate-300" />
                <div className="font-medium text-slate-100">How Envio works</div>
                <div className="ml-auto">
                  <button onClick={() => setShowHowInfo(false)} className="text-xs text-slate-400 hover:text-white">
                    Close
                  </button>
                </div>
              </div>
              <ol className="list-decimal ml-4 space-y-1">
                <li>Contracts emit events</li>
                <li>Envio indexer ingests & stores entities</li>
                <li>DApp queries GraphQL / subscriptions</li>
                <li>We show on-chain + optimistic UI</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnvioAnalytics;
