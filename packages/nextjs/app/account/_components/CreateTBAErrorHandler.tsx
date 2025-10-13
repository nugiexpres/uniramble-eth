"use client";

import { useEffect } from "react";
import { ErrorPopup } from "./ErrorPopup";
import { useTBAErrorHandler } from "~~/hooks/tba/useTBAErrorHandler";

interface CreateTBAErrorHandlerProps {
  gaslessError: string | null;
  onRetryMint?: () => void;
  onRetryCreateTBA?: () => void;
}

export const CreateTBAErrorHandler = ({ gaslessError, onRetryMint, onRetryCreateTBA }: CreateTBAErrorHandlerProps) => {
  const { showErrorPopup, errorMessage, errorTitle, showError, hideError } = useTBAErrorHandler();

  // Handle gasless error from hook
  useEffect(() => {
    if (gaslessError) {
      showError(gaslessError, "Create TBA Error");
    }
  }, [gaslessError, showError]);

  // Determine retry function based on error type
  const getRetryFunction = () => {
    if (errorMessage.includes("Mint") || errorMessage.includes("NFT")) {
      return onRetryMint;
    }
    if (errorMessage.includes("TBA") || errorMessage.includes("Create") || errorMessage.includes("Paymaster")) {
      return onRetryCreateTBA;
    }
    return undefined;
  };

  const retryFunction = getRetryFunction();
  const showRetry = !!retryFunction;

  const handleRetry = () => {
    if (retryFunction) {
      retryFunction();
    }
    hideError();
  };

  return (
    <ErrorPopup
      isOpen={showErrorPopup}
      onClose={hideError}
      errorMessage={errorMessage}
      title={errorTitle}
      onRetry={handleRetry}
      showRetry={showRetry}
    />
  );
};

// Export functions for external use
export const useCreateTBAErrorHandler = () => {
  const errorHandler = useTBAErrorHandler();

  const handleMintError = (error: any) => {
    errorHandler.handleError(error, "Failed to mint NFT");
  };

  const handleCreateTBAError = (error: any) => {
    errorHandler.handleError(error, "Failed to create TBA");
  };

  const handleRetryError = (error: any) => {
    errorHandler.handleError(error, "Failed to retry operation");
  };

  return {
    ...errorHandler,
    handleMintError,
    handleCreateTBAError,
    handleRetryError,
  };
};
