"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, Info, Network, Zap } from "lucide-react";
import { useEnvioClient } from "~~/hooks/envio";
import { useGameEvents } from "~~/hooks/envio/useGameEvents";
import { usePlayerPositions } from "~~/hooks/envio/usePlayerPositions";

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
  const [autoScroll, setAutoScroll] = useState(true);
  const [optimisticEvents, setOptimisticEvents] = useState<GameEvent[]>([]); // local optimistic events
  const [showHowInfo, setShowHowInfo] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const [overlayPos, setOverlayPos] = useState({ top: 0, left: 0, width: 320 });

  // --- Network detection ---
  const { isEnabled, chainId, chainName } = useEnvioClient();

  // --- Envio hooks (authoritative data) - filtered by current chain ---
  const { latestPositions } = usePlayerPositions();
  const { ingredientPurchases, specialBoxMints, faucetEvents, tbaCreations, loading: eventsLoading } = useGameEvents();

  // Listen to local game events for instant UI feedback
  useEffect(() => {
    const handler = (e: Event) => {
      try {
        const detail = (e as CustomEvent).detail as Partial<GameEvent> | undefined;
        if (!detail) return;

        const localEvent: GameEvent = {
          id: detail.id || `local_${Date.now()}`,
          type: (detail.type as EventType) || "movement",
          player: detail.player || detail.tbaAddress || "",
          tbaAddress: detail.tbaAddress || detail.player || "",
          data: detail.data || {},
          timestamp: detail.timestamp || Date.now(),
          db_write_timestamp: new Date().toISOString(),
          optimistic: true,
          optimisticKey: (detail as any).optimisticKey,
        };

        setOptimisticEvents(prev => {
          // Remove old event with same key to avoid duplicates
          if (localEvent.optimisticKey) {
            const filtered = prev.filter(p => p.optimisticKey !== localEvent.optimisticKey);
            return [localEvent, ...filtered].slice(0, 10); // Keep max 10 optimistic
          }
          return [localEvent, ...prev].slice(0, 10);
        });
      } catch (err) {
        console.warn("EnvioAnalytics: failed to handle localGameAction", err);
      }
    };

    window.addEventListener("localGameAction", handler as EventListener);
    return () => window.removeEventListener("localGameAction", handler as EventListener);
  }, []);

  // Build canonical on-chain events from Envio hooks
  const onChainEvents: GameEvent[] = useMemo(() => {
    const out: GameEvent[] = [];

    latestPositions.slice(0, 8).forEach((m, i) => {
      out.push({
        id: `movement_${m.id}`,
        type: "movement",
        player: m.player,
        tbaAddress: m.player,
        data: { position: m.newPosition },
        timestamp: new Date(m.db_write_timestamp).getTime() + i,
        db_write_timestamp: m.db_write_timestamp,
      });
    });

    ingredientPurchases.slice(0, 6).forEach((p, i) => {
      out.push({
        id: `purchase_${p.id}`,
        type: "purchase",
        player: p.player,
        tbaAddress: p.player,
        data: { ingredientType: p.ingredientType, fee: p.fee },
        timestamp: new Date(p.db_write_timestamp).getTime() + i,
        db_write_timestamp: p.db_write_timestamp,
      });
    });

    specialBoxMints.slice(0, 3).forEach((s, i) => {
      out.push({
        id: `mint_${s.id}`,
        type: "mint",
        player: s.user,
        tbaAddress: s.user,
        data: { hamburgerCount: s.hamburgerCount },
        timestamp: new Date(s.db_write_timestamp).getTime() + i,
        db_write_timestamp: s.db_write_timestamp,
      });
    });

    faucetEvents.slice(0, 5).forEach((f, i) => {
      out.push({
        id: `faucet_${f.id}`,
        type: "faucet",
        player: f.owner,
        tbaAddress: f.owner,
        data: { amount: f.amount },
        timestamp: new Date(f.db_write_timestamp).getTime() + i,
        db_write_timestamp: f.db_write_timestamp,
      });
    });

    tbaCreations.slice(0, 4).forEach((t, i) => {
      out.push({
        id: `tba_${t.id}`,
        type: "tba",
        player: t.eoa,
        tbaAddress: t.tba,
        data: { startPosition: t.startPosition },
        timestamp: new Date(t.db_write_timestamp).getTime() + i,
        db_write_timestamp: t.db_write_timestamp,
      });
    });

    return out.sort((a, b) => b.timestamp - a.timestamp).slice(0, 16);
  }, [latestPositions, ingredientPurchases, specialBoxMints, faucetEvents, tbaCreations]);

  // Merge optimistic (instant feedback) + on-chain events with smart deduplication
  const events = useMemo(() => {
    const merged: GameEvent[] = [];
    const seenKeys = new Set<string>();

    // Add on-chain events first (authoritative)
    for (const oc of onChainEvents) {
      const key = `${oc.type}:${oc.player}:${oc.data?.position || oc.data?.ingredientType || ""}`;
      seenKeys.add(key);
      merged.push(oc);
    }

    // Add optimistic events that haven't been confirmed yet
    // Auto-remove optimistic after 30 seconds (assumed indexed by Envio)
    const now = Date.now();
    for (const opt of optimisticEvents) {
      const age = now - opt.timestamp;
      if (age > 30000) continue; // Skip old optimistic events (>30s)

      const key = `${opt.type}:${opt.player}:${opt.data?.position || opt.data?.ingredientType || ""}`;
      if (!seenKeys.has(key)) {
        merged.push(opt);
      }
    }

    // Sort and limit to 16 most recent
    return merged.sort((a, b) => b.timestamp - a.timestamp).slice(0, 16);
  }, [onChainEvents, optimisticEvents]);

  // Auto-scroll when new items arrive (unless user toggled it off)
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events.length, autoScroll]);

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
      case "movement":
        return `Moved → ${e.data.position ?? "?"}`;
      case "purchase":
        return `Bought ${e.data.ingredientType ?? "?"} for ${e.data.fee ?? "?"}`;
      case "mint":
        return `Minted special box`;
      case "rail":
        return `Rail used by ${formatAddress(e.player)}`;
      case "tba":
        return `TBA ${formatAddress(e.tbaAddress)} created`;
      case "faucet":
        return `Faucet: ${e.data.amount ?? "?"}`;
      case "cook":
        return `Cooked ${e.data.hamburgerCount ?? "?"} hamburger(s)`;
      case "sendNative":
        return `Sent ${e.data.amount ?? "?"} to ${formatAddress(e.data.to)}`;
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
            <button
              onClick={() => setAutoScroll(s => !s)}
              className={`text-xs px-2 py-1 rounded ${autoScroll ? "bg-slate-700/30 text-white" : "bg-slate-700/10 text-slate-300"}`}
            >
              {autoScroll ? "Auto" : "Hold"}
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
                          {new Date(e.timestamp).toLocaleTimeString()}
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

      {/* Footer - Powered by Envio (always visible below 16 events) */}
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
        <div className="text-[10px] text-slate-500">{events.length}/16</div>
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
