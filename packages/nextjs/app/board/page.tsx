"use client";

import { EnvioBoard } from "./_components/EnvioBoard";
import type { NextPage } from "next";
import { EnvioAnalytics } from "~~/components/envio/EnvioAnalytics";

const BoardPage: NextPage = () => {
  return (
    <>
      <EnvioBoard />
      {/* Envio Analytics - Full height sidebar sejajar Board */}
      <div className="fixed top-20 bottom-4 right-4 w-[320px] z-20 hidden lg:block">
        <div className="h-full flex flex-col overflow-hidden bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/30">
          <EnvioAnalytics />
        </div>
      </div>
      {/* Mobile Analytic - Positioned at bottom */}
      <div className="fixed bottom-4 left-4 right-4 lg:hidden">
        <EnvioAnalytics />
      </div>
    </>
  );
};

export default BoardPage;
