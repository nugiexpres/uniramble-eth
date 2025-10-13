"use client";

import { ErrorPopup } from "./ErrorPopup";
import { useTBAErrorHandler } from "~~/hooks/tba/useTBAErrorHandler";

interface ErrorHandlerProps {
  children: React.ReactNode;
}

export const ErrorHandler = ({ children }: ErrorHandlerProps) => {
  const { showErrorPopup, errorMessage, errorTitle, hideError } = useTBAErrorHandler();

  return (
    <>
      {children}
      <ErrorPopup
        isOpen={showErrorPopup}
        onClose={hideError}
        errorMessage={errorMessage}
        title={errorTitle}
        showRetry={false}
      />
    </>
  );
};

// Export the hook for direct use in components
export { useTBAErrorHandler } from "~~/hooks/tba/useTBAErrorHandler";
