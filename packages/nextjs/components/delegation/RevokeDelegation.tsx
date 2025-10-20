"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useCaveatEnforcer } from "~~/hooks/Delegation/useCaveatEnforcer";
import { notification } from "~~/utils/scaffold-eth";

/**
 * Komponen untuk merevokasi delegasi yang sudah dibuat
 * Memungkinkan user untuk mencabut wewenang yang sudah diberikan kepada delegate
 */
export const RevokeDelegation = () => {
  const { address, isConnected } = useAccount();
  const [delegationHash, setDelegationHash] = useState<string>("");

  // Gunakan hook useCaveatEnforcer untuk mengakses fungsi-fungsi caveat enforcer
  const { revokeDelegation } = useCaveatEnforcer();

  // Fungsi untuk merevokasi delegasi
  const handleRevokeDelegation = async () => {
    if (!isConnected || !address) {
      notification.error("Wallet tidak terhubung");
      return;
    }

    if (!delegationHash) {
      notification.error("Hash delegasi harus diisi");
      return;
    }

    try {
      // Panggil fungsi revokeDelegation dari hook useCaveatEnforcer
      await revokeDelegation(delegationHash as `0x${string}`);

      notification.success("Delegasi berhasil dicabut!");
      setDelegationHash("");
    } catch (error) {
      console.error("Error revoking delegation:", error);
      notification.error("Gagal mencabut delegasi");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto mt-6 bg-base-200 rounded-xl shadow-md overflow-hidden">
      <div className="p-4 border-b border-base-300">
        <h3 className="text-xl font-bold">Cabut Delegasi</h3>
        <p className="text-sm opacity-70">Cabut wewenang yang telah diberikan kepada delegate</p>
      </div>
      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <label htmlFor="delegationHash" className="font-medium">
            Hash Delegasi
          </label>
          <input
            id="delegationHash"
            className="input input-bordered w-full"
            placeholder="0x..."
            value={delegationHash}
            onChange={e => setDelegationHash(e.target.value)}
          />
          <p className="text-xs opacity-70">Masukkan hash delegasi yang ingin dicabut</p>
        </div>
      </div>
      <div className="p-4 border-t border-base-300">
        <button onClick={handleRevokeDelegation} disabled={!isConnected || !delegationHash} className="btn btn-error">
          Cabut Delegasi
        </button>
      </div>
    </div>
  );
};
