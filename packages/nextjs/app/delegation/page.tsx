import { Metadata } from "next";
import { RevokeDelegation } from "~~/components/delegation/RevokeDelegation";
import { RollDelegationExample } from "~~/components/delegation/RollDelegationExample";

export const metadata: Metadata = {
  title: "Delegasi | UniRamble",
  description: "Implementasi MetaMask Delegation Toolkit untuk UniRamble",
};

export default function DelegationPage() {
  return (
    <div className="flex flex-col py-8 px-4 lg:px-8 space-y-6 w-full max-w-5xl mx-auto">
      <div className="text-center mb-4">
        <h1 className="text-4xl font-bold">MetaMask Delegation Toolkit</h1>
        <p className="text-lg mt-2">Buat dan kelola delegasi untuk fungsi game tanpa perlu sign setiap transaksi</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <RollDelegationExample />
        </div>
        <div>
          <RevokeDelegation />
        </div>
      </div>

      <div className="bg-base-200 p-4 rounded-lg mt-8">
        <h2 className="text-xl font-semibold mb-2">Tentang Delegasi</h2>
        <p>
          Dengan MetaMask Delegation Toolkit, Anda dapat memberikan wewenang kepada alamat lain (delegate) untuk
          melakukan aksi tertentu atas nama Anda, tanpa perlu menandatangani setiap transaksi.
        </p>
        <p className="mt-2">
          Delegasi dibatasi dengan caveat (aturan) yang memastikan delegate hanya dapat melakukan aksi yang diizinkan,
          dengan batasan jumlah dan waktu yang ditentukan.
        </p>
        <p className="mt-2">
          Untuk informasi lebih lanjut, lihat{" "}
          <a href="/docs/MetaMaskDelegation.md" className="text-primary underline">
            dokumentasi lengkap
          </a>
          .
        </p>
      </div>
    </div>
  );
}
