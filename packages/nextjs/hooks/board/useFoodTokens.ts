import { useMemo } from "react";
import { useSmartAccountTBA } from "~~/hooks/envio/useSmartAccountTBA";
import { useTokenBalances } from "~~/hooks/envio/useTokenBalances";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

export const useFoodTokens = (tbaAddress: string | undefined) => {
  // Get Smart Account TBA (priority over prop)
  const { tbaAddress: smartAccountTbaAddress } = useSmartAccountTBA();

  // Use Smart Account TBA if available, otherwise use prop TBA
  const effectiveTbaAddress = smartAccountTbaAddress || tbaAddress;

  // Envio-powered token balances (faster)
  const { balances: envioBalances, loading: envioLoading } = useTokenBalances(effectiveTbaAddress);

  // Contract-based token balances (fallback only, Envio is primary source)
  const { data: breadAmount } = useScaffoldReadContract({
    contractName: "BreadToken",
    functionName: "balanceOf",
    args: [effectiveTbaAddress || "0x0000000000000000000000000000000000000000"],
    query: {
      enabled: !!effectiveTbaAddress,
      refetchInterval: 60000, // 60s - Envio handles real-time updates
    },
  });

  const { data: meatAmount } = useScaffoldReadContract({
    contractName: "MeatToken",
    functionName: "balanceOf",
    args: [effectiveTbaAddress || "0x0000000000000000000000000000000000000000"],
    query: {
      enabled: !!effectiveTbaAddress,
      refetchInterval: 60000, // 60s - Envio handles real-time updates
    },
  });

  const { data: lettuceAmount } = useScaffoldReadContract({
    contractName: "LettuceToken",
    functionName: "balanceOf",
    args: [effectiveTbaAddress || "0x0000000000000000000000000000000000000000"],
    query: {
      enabled: !!effectiveTbaAddress,
      refetchInterval: 60000, // 60s - Envio handles real-time updates
    },
  });

  const { data: tomatoAmount } = useScaffoldReadContract({
    contractName: "TomatoToken",
    functionName: "balanceOf",
    args: [effectiveTbaAddress || "0x0000000000000000000000000000000000000000"],
    query: {
      enabled: !!effectiveTbaAddress,
      refetchInterval: 60000, // 60s - Envio handles real-time updates
    },
  });

  // Use Envio balances if available, otherwise fallback to contract data
  const finalBalances = useMemo(() => {
    return {
      bread: envioBalances.bread > 0n ? envioBalances.bread : breadAmount,
      meat: envioBalances.meat > 0n ? envioBalances.meat : meatAmount,
      lettuce: envioBalances.lettuce > 0n ? envioBalances.lettuce : lettuceAmount,
      tomato: envioBalances.tomato > 0n ? envioBalances.tomato : tomatoAmount,
    };
  }, [envioBalances, breadAmount, meatAmount, lettuceAmount, tomatoAmount]);

  // Format food tokens data with Smart Account TBA data
  const foodTokens = [
    { name: "Bread", amount: finalBalances.bread, icon: "🍞", color: "bg-yellow-100" },
    { name: "Meat", amount: finalBalances.meat, icon: "🥩", color: "bg-red-100" },
    { name: "Lettuce", amount: finalBalances.lettuce, icon: "🥬", color: "bg-green-100" },
    { name: "Tomato", amount: finalBalances.tomato, icon: "🍅", color: "bg-red-100" },
  ];

  // Debug logging
  console.log("=== useFoodTokens Smart Account Debug ===");
  console.log("Prop TBA Address:", tbaAddress);
  console.log("Smart Account TBA:", smartAccountTbaAddress);
  console.log("Effective TBA Address:", effectiveTbaAddress);
  console.log("Envio Balances:", envioBalances);
  console.log("Final Balances:", finalBalances);
  console.log("Using Envio Data:", envioBalances.bread > 0n || envioBalances.meat > 0n);
  console.log("=======================================");

  return {
    // Individual balances
    breadAmount: finalBalances.bread,
    meatAmount: finalBalances.meat,
    lettuceAmount: finalBalances.lettuce,
    tomatoAmount: finalBalances.tomato,
    foodTokens,
    // Envio data
    envioBalances,
    envioLoading,
    // Smart Account info
    smartAccountTbaAddress,
    effectiveTbaAddress,
    // Contract data (fallback)
    contractBalances: {
      bread: breadAmount,
      meat: meatAmount,
      lettuce: lettuceAmount,
      tomato: tomatoAmount,
    },
  };
};
