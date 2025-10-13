"use client";

import { EnvioBoard } from "./_components/EnvioBoard";
import type { NextPage } from "next";
import { EnvioAnalytics } from "~~/components/envio/EnvioAnalytics";

const BoardPage: NextPage = () => {
  return (
    <>
      <EnvioBoard />
      {/* Envio Analytic - Positioned at bottom right, below GameCombine panel */}
      <div className="fixed bottom-4 right-4 z-20 hidden lg:block">
        <EnvioAnalytics />
      </div>
      {/* Mobile Analytic - Positioned at bottom */}
      <div className="fixed bottom-4 left-4 right-4 lg:hidden">
        <EnvioAnalytics />
      </div>
    </>
  );
};

export default BoardPage;
