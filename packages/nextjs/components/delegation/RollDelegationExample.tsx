"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useCaveatEnforcer } from "~~/hooks/Delegation/useCaveatEnforcer";
import { notification } from "~~/utils/scaffold-eth";

/**
 * Contoh implementasi MetaMask Delegation Toolkit untuk fungsi roll
 * Menunjukkan cara membuat delegasi dengan caveat untuk membatasi penggunaan fungsi roll
 */
export const RollDelegationExample = () => {
  const { address, isConnected } = useAccount();
  const [delegateAddress, setDelegateAddress] = useState("");
  const [maxRolls, setMaxRolls] = useState(5);
  const [validityHours, setValidityHours] = useState(24);
  const [delegationHash, setDelegationHash] = useState<string>("");

  // Gunakan hook useCaveatEnforcer untuk mengakses fungsi-fungsi caveat enforcer
  const { setupHybridDelegation, setGameActionLimits, generateDelegationHash } = useCaveatEnforcer();

  // Fungsi untuk membuat delegasi dengan caveat untuk fungsi roll
  const createRollDelegation = async () => {
    if (!isConnected || !address) {
      notification.error("Wallet tidak terhubung");
      return;
    }

    if (!delegateAddress) {
      notification.error("Alamat delegate harus diisi");
      return;
    }

    try {
      // 1. Generate delegation hash
      // Menggunakan parameter yang benar sesuai dengan implementasi hook
      const hash = generateDelegationHash(address, delegateAddress as `0x${string}`, "game", 0);
      setDelegationHash(hash);

      // 2. Setup hybrid delegation dengan GameCaveatEnforcer dan FinancialCaveatEnforcer
      await setupHybridDelegation(hash);

      // 3. Set game action limits untuk membatasi jumlah roll
      const validUntil = Math.floor(Date.now() / 1000) + validityHours * 3600;

      // Menggunakan parameter yang benar sesuai dengan implementasi hook
      await setGameActionLimits(
        hash,
        maxRolls,
        0, // maxBuys
        0, // maxRails
        0, // maxFaucets
        0, // maxCooks
        validUntil,
      );

      notification.success("Delegasi untuk fungsi roll berhasil dibuat!");
      notification.info(
        `Delegate ${delegateAddress} dapat melakukan roll maksimal ${maxRolls} kali dalam ${validityHours} jam ke depan`,
      );
    } catch (error: any) {
      console.error("Error creating roll delegation:", error);
      notification.error("Gagal membuat delegasi: " + (error.message || "Unknown error"));
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-base-200 rounded-xl shadow-md overflow-hidden">
      <div className="p-4 border-b border-base-300 bg-gradient-to-r from-purple-600/80 to-indigo-600/80">
        <h3 className="text-lg font-medium text-white">Delegasi Fungsi Roll</h3>
        <p className="mt-1 max-w-2xl text-sm text-purple-100">
          Buat delegasi dengan caveat untuk membatasi penggunaan fungsi roll tanpa perlu sign setiap transaksi
        </p>
      </div>
      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <label htmlFor="delegate" className="block text-sm font-medium">
            Alamat Delegate
          </label>
          <input
            id="delegate"
            className="input input-bordered w-full"
            placeholder="0x..."
            value={delegateAddress}
            onChange={e => setDelegateAddress(e.target.value)}
          />
          <p className="text-xs opacity-70">Alamat yang akan diberi wewenang untuk melakukan roll atas nama Anda</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="maxRolls" className="block text-sm font-medium">
            Jumlah Roll Maksimal
          </label>
          <input
            id="maxRolls"
            type="number"
            min={1}
            className="input input-bordered w-full"
            value={maxRolls}
            onChange={e => setMaxRolls(parseInt(e.target.value))}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="validity" className="block text-sm font-medium">
            Masa Berlaku (jam)
          </label>
          <input
            id="validity"
            type="number"
            min={1}
            className="input input-bordered w-full"
            value={validityHours}
            onChange={e => setValidityHours(parseInt(e.target.value))}
          />
        </div>

        {delegationHash && (
          <div className="p-2 bg-base-300 rounded-md">
            <p className="text-xs font-mono break-all">Delegation Hash: {delegationHash}</p>
          </div>
        )}
      </div>
      <div className="p-4 border-t border-base-300 text-right">
        <button onClick={createRollDelegation} disabled={!isConnected || !delegateAddress} className="btn btn-primary">
          Buat Delegasi Roll
        </button>
      </div>
    </div>
  );
};
