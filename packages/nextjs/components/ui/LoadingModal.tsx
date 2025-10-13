"use client";

import React, { FC } from "react";
import { RollSpinner } from "./RollSpinner";

export interface LoadingModalProps {
  open: boolean;
  message?: string;
}

const LoadingModal: FC<LoadingModalProps> = ({ open, message }) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] bg-black bg-opacity-50 flex items-center justify-center"
      style={{ zIndex: 99999 }}
    >
      <div className="bg-white rounded-lg p-6 flex flex-col items-center max-w-[300px] shadow-2xl">
        <RollSpinner size={64} color="#7c3aed" />
        <p className="mt-4 text-gray-700 text-center">{message || "Processing action..."}</p>
      </div>
    </div>
  );
};

export default LoadingModal;
