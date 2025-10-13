import { useState } from "react";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

interface UseSpecialBoxStakeProps {
  contractName?: "SpecialBoxStake";
  enabled?: boolean;
}

export const useSpecialBoxStake = ({
  contractName = "SpecialBoxStake",
  enabled = true,
}: UseSpecialBoxStakeProps = {}) => {
  const { address } = useAccount();
  const [isProcessing, setIsProcessing] = useState(false);

  // Read user's TBA address first
  const { data: tbaAddress } = useScaffoldReadContract({
    contractName,
    functionName: "getTBA",
    args: [address],
    query: {
      enabled: enabled && !!address,
    },
  });

  // Read stakeable boxes count (for UI display)
  const { data: stakeableCount, refetch: refetchBoxes } = useScaffoldReadContract({
    contractName,
    functionName: "getStakeableCount",
    args: [tbaAddress],
    query: {
      enabled: enabled && !!tbaAddress,
      refetchInterval: 30000, // Refetch every 30s
    },
  });

  // Read user's staked boxes
  const { data: stakedBoxes, refetch: refetchStakedBoxes } = useScaffoldReadContract({
    contractName,
    functionName: "stakedBoxBalance",
    args: [tbaAddress],
    query: {
      enabled: enabled && !!tbaAddress,
      refetchInterval: 30000, // Refetch every 30s
    },
  });

  // Type assertion for array return
  const userBoxes = stakedBoxes as readonly bigint[] | undefined;

  // Write functions
  const { writeContractAsync: stakeWrite, isPending: isStakeLoading } = useScaffoldWriteContract({
    contractName,
  });

  const { writeContractAsync: unstakeWrite, isPending: isUnstakeLoading } = useScaffoldWriteContract({
    contractName,
  });

  // Stake boxes
  const stake = async (tokenIds: bigint[]) => {
    if (!address) {
      notification.error("Please connect your wallet");
      return;
    }

    if (!tokenIds || tokenIds.length === 0) {
      notification.error("No boxes selected for staking");
      return;
    }

    if (tokenIds.length > 50) {
      notification.error("Cannot stake more than 50 boxes at once");
      return;
    }

    // Validate that user owns all boxes and they're not already staked
    const invalidBoxes = tokenIds.filter(tokenId => {
      const isOwned = userBoxes?.includes(tokenId);
      const isAlreadyStaked = stakedBoxes?.includes(tokenId);
      return !isOwned || isAlreadyStaked;
    });

    if (invalidBoxes.length > 0) {
      notification.error("Some boxes are not owned by you or already staked");
      return;
    }

    try {
      setIsProcessing(true);

      const tx = await stakeWrite({
        functionName: "stakeBatch",
        args: [tokenIds],
      });

      notification.success(`${tokenIds.length} box(es) staked successfully!`);

      // Refetch data
      refetchBoxes();
      refetchStakedBoxes();

      return tx;
    } catch (error: any) {
      console.error("Stake failed:", error);
      if (error?.message?.includes("Not owner")) {
        notification.error("You don't own one or more of these boxes");
      } else if (error?.message?.includes("Already staked")) {
        notification.error("One or more boxes are already staked");
      } else {
        notification.error(error?.message || "Stake failed");
      }
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  // Unstake boxes
  const unstake = async (tokenIds: bigint[]) => {
    if (!address) {
      notification.error("Please connect your wallet");
      return;
    }

    if (!tokenIds || tokenIds.length === 0) {
      notification.error("No boxes selected for unstaking");
      return;
    }

    if (tokenIds.length > 50) {
      notification.error("Cannot unstake more than 50 boxes at once");
      return;
    }

    // Validate that all boxes are currently staked by user
    const invalidBoxes = tokenIds.filter(tokenId => {
      const isStaked = stakedBoxes?.includes(tokenId);
      const isOwned = userBoxes?.includes(tokenId);
      return !isStaked || !isOwned;
    });

    if (invalidBoxes.length > 0) {
      notification.error("Some boxes are not staked or not owned by you");
      return;
    }

    try {
      setIsProcessing(true);

      const tx = await unstakeWrite({
        functionName: "unstakeBatch",
        args: [tokenIds],
      });

      notification.success(`${tokenIds.length} box(es) unstaked successfully!`);

      // Refetch data
      refetchBoxes();
      refetchStakedBoxes();

      return tx;
    } catch (error: any) {
      console.error("Unstake failed:", error);
      if (error?.message?.includes("Not owner")) {
        notification.error("You don't own one or more of these boxes");
      } else if (error?.message?.includes("Not staked")) {
        notification.error("One or more boxes are not staked");
      } else {
        notification.error(error?.message || "Unstake failed");
      }
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper functions
  const getUnstakedBoxes = () => {
    if (!userBoxes || !stakedBoxes) return [];
    return userBoxes.filter((box: any) => !stakedBoxes.includes(box));
  };

  const getStakeableBoxes = () => {
    return getUnstakedBoxes();
  };

  const getUnstakeableBoxes = () => {
    return stakedBoxes || [];
  };

  const isBoxStaked = (tokenId: bigint) => {
    return stakedBoxes?.includes(tokenId) || false;
  };

  const canStakeBox = (tokenId: bigint) => {
    const isOwned = userBoxes?.includes(tokenId) || false;
    const alreadyStaked = isBoxStaked(tokenId);
    return isOwned && !alreadyStaked;
  };

  const canUnstakeBox = (tokenId: bigint) => {
    const isOwned = userBoxes?.includes(tokenId) || false;
    const isStaked = isBoxStaked(tokenId);
    return isOwned && isStaked;
  };

  const canStakeBoxes = (tokenIds: bigint[]) => {
    if (tokenIds.length === 0 || tokenIds.length > 50) return false;
    return tokenIds.every(tokenId => canStakeBox(tokenId));
  };

  const canUnstakeBoxes = (tokenIds: bigint[]) => {
    if (tokenIds.length === 0 || tokenIds.length > 50) return false;
    return tokenIds.every(tokenId => canUnstakeBox(tokenId));
  };

  // Format data for display
  const formatStakeData = () => {
    const totalBoxes = userBoxes?.length || 0;
    const totalStaked = stakedBoxes?.length || 0;
    const totalUnstaked = totalBoxes - totalStaked;
    const stakeableCount = getStakeableBoxes().length;
    const unstakeableCount = getUnstakeableBoxes().length;

    return {
      totalBoxes,
      totalStaked,
      totalUnstaked,
      stakeableCount,
      unstakeableCount,
      userBoxes: userBoxes || [],
      stakedBoxes: stakedBoxes || [],
      unstakedBoxes: getUnstakedBoxes(),
      stakeableBoxes: getStakeableBoxes(),
      unstakeableBoxes: getUnstakeableBoxes(),
    };
  };

  // Batch operations
  const stakeSelected = async (selectedIds: bigint[]) => {
    const stakeableIds = selectedIds.filter(id => canStakeBox(id));

    if (stakeableIds.length === 0) {
      notification.error("No stakeable boxes selected");
      return;
    }

    if (stakeableIds.length !== selectedIds.length) {
      notification.warning(`Only ${stakeableIds.length} out of ${selectedIds.length} boxes can be staked`);
    }

    return await stake(stakeableIds);
  };

  const unstakeSelected = async (selectedIds: bigint[]) => {
    const unstakeableIds = selectedIds.filter(id => canUnstakeBox(id));

    if (unstakeableIds.length === 0) {
      notification.error("No unstakeable boxes selected");
      return;
    }

    if (unstakeableIds.length !== selectedIds.length) {
      notification.warning(`Only ${unstakeableIds.length} out of ${selectedIds.length} boxes can be unstaked`);
    }

    return await unstake(unstakeableIds);
  };

  // Quick actions
  const stakeAll = async () => {
    const stakeableBoxes = getStakeableBoxes();

    if (stakeableBoxes.length === 0) {
      notification.error("No boxes available to stake");
      return;
    }

    // Split into batches of 50 if needed
    const batches = [];
    for (let i = 0; i < stakeableBoxes.length; i += 50) {
      batches.push(stakeableBoxes.slice(i, i + 50));
    }

    if (batches.length === 1) {
      return await stake(batches[0]);
    } else {
      notification.info(`Will stake ${stakeableBoxes.length} boxes in ${batches.length} transactions`);

      for (let i = 0; i < batches.length; i++) {
        await stake(batches[i]);
        if (i < batches.length - 1) {
          // Small delay between batches
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
  };

  const unstakeAll = async () => {
    const unstakeableBoxes = getUnstakeableBoxes();

    if (unstakeableBoxes.length === 0) {
      notification.error("No boxes available to unstake");
      return;
    }

    // Split into batches of 50 if needed
    const batches = [];
    for (let i = 0; i < unstakeableBoxes.length; i += 50) {
      batches.push(unstakeableBoxes.slice(i, i + 50));
    }

    if (batches.length === 1) {
      return await unstake(batches[0]);
    } else {
      notification.info(`Will unstake ${unstakeableBoxes.length} boxes in ${batches.length} transactions`);

      for (let i = 0; i < batches.length; i++) {
        await unstake(batches[i]);
        if (i < batches.length - 1) {
          // Small delay between batches
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
  };

  return {
    // Data
    ...formatStakeData(),
    tbaAddress,
    stakeableCount: Number(stakeableCount || 0), // Expose for UI

    // Functions
    stake,
    unstake,
    refetchBoxes,
    refetchStakedBoxes,

    // Helper functions
    getUnstakedBoxes,
    getStakeableBoxes,
    getUnstakeableBoxes,
    isBoxStaked,
    canStakeBox,
    canUnstakeBox,
    canStakeBoxes,
    canUnstakeBoxes,

    // Status
    isLoading: isStakeLoading || isUnstakeLoading || isProcessing,
    isStakeLoading,
    isUnstakeLoading,
    isProcessing,

    // Batch operations
    stakeSelected,
    unstakeSelected,

    // Quick actions
    stakeAll,
    unstakeAll,

    // Validation helpers
    hasStakeableBoxes: getStakeableBoxes().length > 0,
    hasUnstakeableBoxes: getUnstakeableBoxes().length > 0,
    hasBoxes: (userBoxes?.length || 0) > 0,

    // Utility functions
    getStakeRatio: () => {
      const total = userBoxes?.length || 0;
      const staked = stakedBoxes?.length || 0;
      return total > 0 ? (staked / total) * 100 : 0;
    },

    formatStakeStatus: (tokenId: bigint) => ({
      tokenId: tokenId.toString(),
      isStaked: isBoxStaked(tokenId),
      canStake: canStakeBox(tokenId),
      canUnstake: canUnstakeBox(tokenId),
      isOwned: userBoxes?.includes(tokenId) || false,
    }),
  };
};
