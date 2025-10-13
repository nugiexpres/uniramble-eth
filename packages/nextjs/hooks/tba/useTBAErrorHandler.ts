"use client";

import { useCallback, useState } from "react";

interface ErrorHandlerState {
  showErrorPopup: boolean;
  errorMessage: string;
  errorTitle: string;
}

export const useTBAErrorHandler = () => {
  const [state, setState] = useState<ErrorHandlerState>({
    showErrorPopup: false,
    errorMessage: "",
    errorTitle: "Error",
  });

  const showError = useCallback((message: string, title: string = "Error") => {
    setState({
      showErrorPopup: true,
      errorMessage: message,
      errorTitle: title,
    });
  }, []);

  const hideError = useCallback(() => {
    setState(prev => ({
      ...prev,
      showErrorPopup: false,
    }));
  }, []);

  const handleError = useCallback(
    (error: any, fallbackMessage: string = "An error occurred") => {
      const message = error?.message || error?.toString() || fallbackMessage;
      showError(message);
    },
    [showError],
  );

  return {
    showErrorPopup: state.showErrorPopup,
    errorMessage: state.errorMessage,
    errorTitle: state.errorTitle,
    showError,
    hideError,
    handleError,
  };
};
