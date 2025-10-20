"use client";

import React, { ReactNode, createContext, useContext, useState } from "react";

interface GlobalModalContextType {
  // Smart Account Deploy Modal
  showSmartAccountDeployModal: boolean;
  setShowSmartAccountDeployModal: (show: boolean) => void;
  deployStep: number;
  setDeployStep: (step: number) => void;
  deployError: string | null;
  setDeployError: (error: string | null) => void;
  isDeployProcessing: boolean;
  setIsDeployProcessing: (processing: boolean) => void;
  deploySuccess: boolean;
  setDeploySuccess: (success: boolean) => void;
  deployedAddress: string | null;
  setDeployedAddress: (address: string | null) => void;
}

const GlobalModalContext = createContext<GlobalModalContextType | undefined>(undefined);

export const GlobalModalProvider = ({ children }: { children: ReactNode }) => {
  // Smart Account Deploy Modal States
  const [showSmartAccountDeployModal, setShowSmartAccountDeployModal] = useState(false);
  const [deployStep, setDeployStep] = useState(1);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [isDeployProcessing, setIsDeployProcessing] = useState(false);
  const [deploySuccess, setDeploySuccess] = useState(false);
  const [deployedAddress, setDeployedAddress] = useState<string | null>(null);

  return (
    <GlobalModalContext.Provider
      value={{
        showSmartAccountDeployModal,
        setShowSmartAccountDeployModal,
        deployStep,
        setDeployStep,
        deployError,
        setDeployError,
        isDeployProcessing,
        setIsDeployProcessing,
        deploySuccess,
        setDeploySuccess,
        deployedAddress,
        setDeployedAddress,
      }}
    >
      {children}
    </GlobalModalContext.Provider>
  );
};

export const useGlobalModal = () => {
  const context = useContext(GlobalModalContext);
  if (context === undefined) {
    throw new Error("useGlobalModal must be used within a GlobalModalProvider");
  }
  return context;
};
