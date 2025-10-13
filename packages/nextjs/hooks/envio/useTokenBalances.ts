import { useEffect, useState } from "react";
import { GET_BREAD_TRANSFERS, GET_LETTUCE_TRANSFERS, GET_MEAT_TRANSFERS, GET_TOMATO_TRANSFERS } from "./queries";
import { useQuery } from "@apollo/client/react";

interface TokenTransfer {
  id: string;
  from: string;
  to: string;
  value: string;
  blockNumber: number;
}

interface TokenBalances {
  bread: bigint;
  meat: bigint;
  lettuce: bigint;
  tomato: bigint;
}

interface TokenBalancesState {
  balances: TokenBalances;
  transfers: {
    bread: TokenTransfer[];
    meat: TokenTransfer[];
    lettuce: TokenTransfer[];
    tomato: TokenTransfer[];
  };
  loading: boolean;
  error: any;
  refetch: () => void;
}

/**
 * Hook untuk mendapatkan token balances dari Envio indexer
 * Menghitung balance berdasarkan transfer events
 */
export const useTokenBalances = (tbaAddress?: string): TokenBalancesState => {
  const [balances, setBalances] = useState<TokenBalances>({
    bread: 0n,
    meat: 0n,
    lettuce: 0n,
    tomato: 0n,
  });

  const [transfers, setTransfers] = useState({
    bread: [] as TokenTransfer[],
    meat: [] as TokenTransfer[],
    lettuce: [] as TokenTransfer[],
    tomato: [] as TokenTransfer[],
  });

  // Query semua token transfers dengan polling yang lebih cepat
  const {
    data: breadData,
    loading: breadLoading,
    error: breadError,
    refetch: refetchBread,
  } = useQuery(GET_BREAD_TRANSFERS, {
    variables: { to: tbaAddress },
    skip: !tbaAddress,
    pollInterval: 1000, // Poll lebih cepat untuk token balances
    fetchPolicy: "cache-and-network",
  });

  const {
    data: meatData,
    loading: meatLoading,
    error: meatError,
    refetch: refetchMeat,
  } = useQuery(GET_MEAT_TRANSFERS, {
    variables: { to: tbaAddress },
    skip: !tbaAddress,
    pollInterval: 1000,
    fetchPolicy: "cache-and-network",
  });

  const {
    data: lettuceData,
    loading: lettuceLoading,
    error: lettuceError,
    refetch: refetchLettuce,
  } = useQuery(GET_LETTUCE_TRANSFERS, {
    variables: { to: tbaAddress },
    skip: !tbaAddress,
    pollInterval: 1000,
    fetchPolicy: "cache-and-network",
  });

  const {
    data: tomatoData,
    loading: tomatoLoading,
    error: tomatoError,
    refetch: refetchTomato,
  } = useQuery(GET_TOMATO_TRANSFERS, {
    variables: { to: tbaAddress },
    skip: !tbaAddress,
    pollInterval: 1000,
    fetchPolicy: "cache-and-network",
  });

  // Calculate balances dari transfer events
  useEffect(() => {
    if (tbaAddress) {
      const newBalances: TokenBalances = {
        bread: 0n,
        meat: 0n,
        lettuce: 0n,
        tomato: 0n,
      };

      // Calculate bread balance
      if ((breadData as any)?.BreadToken_Transfers) {
        (breadData as any).BreadToken_Transfers.forEach((transfer: TokenTransfer) => {
          if (transfer.to.toLowerCase() === tbaAddress.toLowerCase()) {
            newBalances.bread += BigInt(transfer.value);
          }
          if (transfer.from.toLowerCase() === tbaAddress.toLowerCase()) {
            newBalances.bread -= BigInt(transfer.value);
          }
        });
      }

      // Calculate meat balance
      if ((meatData as any)?.MeatToken_Transfers) {
        (meatData as any).MeatToken_Transfers.forEach((transfer: TokenTransfer) => {
          if (transfer.to.toLowerCase() === tbaAddress.toLowerCase()) {
            newBalances.meat += BigInt(transfer.value);
          }
          if (transfer.from.toLowerCase() === tbaAddress.toLowerCase()) {
            newBalances.meat -= BigInt(transfer.value);
          }
        });
      }

      // Calculate lettuce balance
      if ((lettuceData as any)?.LettuceToken_Transfers) {
        (lettuceData as any).LettuceToken_Transfers.forEach((transfer: TokenTransfer) => {
          if (transfer.to.toLowerCase() === tbaAddress.toLowerCase()) {
            newBalances.lettuce += BigInt(transfer.value);
          }
          if (transfer.from.toLowerCase() === tbaAddress.toLowerCase()) {
            newBalances.lettuce -= BigInt(transfer.value);
          }
        });
      }

      // Calculate tomato balance
      if ((tomatoData as any)?.TomatoToken_Transfers) {
        (tomatoData as any).TomatoToken_Transfers.forEach((transfer: TokenTransfer) => {
          if (transfer.to.toLowerCase() === tbaAddress.toLowerCase()) {
            newBalances.tomato += BigInt(transfer.value);
          }
          if (transfer.from.toLowerCase() === tbaAddress.toLowerCase()) {
            newBalances.tomato -= BigInt(transfer.value);
          }
        });
      }

      setBalances(newBalances);
    }
  }, [breadData, meatData, lettuceData, tomatoData, tbaAddress]);

  // Update transfers data
  useEffect(() => {
    setTransfers({
      bread: (breadData as any)?.BreadToken_Transfers || [],
      meat: (meatData as any)?.MeatToken_Transfers || [],
      lettuce: (lettuceData as any)?.LettuceToken_Transfers || [],
      tomato: (tomatoData as any)?.TomatoToken_Transfers || [],
    });
  }, [breadData, meatData, lettuceData, tomatoData]);

  const refetch = () => {
    refetchBread();
    refetchMeat();
    refetchLettuce();
    refetchTomato();
  };

  return {
    balances,
    transfers,
    loading: breadLoading || meatLoading || lettuceLoading || tomatoLoading,
    error: breadError || meatError || lettuceError || tomatoError,
    refetch,
  };
};
