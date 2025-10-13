import { useCallback, useState } from "react";
import confetti from "canvas-confetti";

export interface BoxModalConfig {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  type?: "mint" | "burn" | "success" | "error" | "info" | "warning";
  autoClose?: boolean;
  autoCloseDelay?: number;
  showConfetti?: boolean;
  customContent?: React.ReactNode;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  onClose?: () => void;
}

export interface UseBoxModalProps {
  defaultConfig?: Partial<BoxModalConfig>;
  onModalOpen?: (type: string) => void;
  onModalClose?: (type: string) => void;
}

export interface BoxModalState {
  isOpen: boolean;
  type: BoxModalConfig["type"];
  title: string;
  description: string;
  confirmText: string;
  cancelText: string;
  autoClose: boolean;
  autoCloseDelay: number;
  showConfetti: boolean;
  customContent?: React.ReactNode;
  isLoading: boolean;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  onClose?: () => void;
}

export const useBoxModal = ({ defaultConfig = {}, onModalOpen, onModalClose }: UseBoxModalProps = {}) => {
  // Default modal configuration
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const defaultModalConfig: BoxModalConfig = {
    title: "Confirm Action",
    description: "Are you sure you want to proceed?",
    confirmText: "Confirm",
    cancelText: "Cancel",
    type: "info",
    autoClose: false,
    autoCloseDelay: 3000,
    showConfetti: false,
    ...defaultConfig,
  };

  // Modal state
  const [modalState, setModalState] = useState<BoxModalState>({
    isOpen: false,
    type: defaultModalConfig.type!,
    title: defaultModalConfig.title!,
    description: defaultModalConfig.description!,
    confirmText: defaultModalConfig.confirmText!,
    cancelText: defaultModalConfig.cancelText!,
    autoClose: defaultModalConfig.autoClose!,
    autoCloseDelay: defaultModalConfig.autoCloseDelay!,
    showConfetti: defaultModalConfig.showConfetti!,
    isLoading: false,
  });

  // Auto close timer
  const [autoCloseTimer, setAutoCloseTimer] = useState<NodeJS.Timeout | null>(null);

  // 🎆 CONFETTI EFFECTS
  const triggerConfetti = useCallback((type: "success" | "celebration" | "explosion" = "success") => {
    const effects = {
      success: () => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      },
      celebration: () => {
        const duration = 2000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

        const interval = setInterval(() => {
          const timeLeft = animationEnd - Date.now();
          if (timeLeft <= 0) return clearInterval(interval);

          confetti(
            Object.assign({}, defaults, {
              particleCount: 50 * (timeLeft / duration),
              origin: { x: Math.random(), y: Math.random() - 0.2 },
            }),
          );
        }, 250);
      },
      explosion: () => {
        confetti({
          particleCount: 150,
          spread: 180,
          origin: { y: 0.5 },
          colors: ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#feca57"],
        });
      },
    };

    effects[type]();
  }, []);

  // Clear auto close timer
  const clearAutoCloseTimer = useCallback(() => {
    if (autoCloseTimer) {
      clearTimeout(autoCloseTimer);
      setAutoCloseTimer(null);
    }
  }, [autoCloseTimer]);

  // Set auto close timer
  const setAutoCloseTimerFunc = useCallback((delay: number) => {
    const timer = setTimeout(() => {
      closeModal();
    }, delay);
    setAutoCloseTimer(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 📖 OPEN MODAL
  const openModal = useCallback(
    (config: BoxModalConfig = {}) => {
      const finalConfig = { ...defaultModalConfig, ...config };

      setModalState({
        isOpen: true,
        type: finalConfig.type!,
        title: finalConfig.title!,
        description: finalConfig.description!,
        confirmText: finalConfig.confirmText!,
        cancelText: finalConfig.cancelText!,
        autoClose: finalConfig.autoClose!,
        autoCloseDelay: finalConfig.autoCloseDelay!,
        showConfetti: finalConfig.showConfetti!,
        customContent: finalConfig.customContent,
        isLoading: false,
        onConfirm: finalConfig.onConfirm,
        onCancel: finalConfig.onCancel,
        onClose: finalConfig.onClose,
      });

      // Show confetti if configured
      if (finalConfig.showConfetti) {
        setTimeout(() => triggerConfetti("success"), 100);
      }

      // Set auto close timer if configured
      if (finalConfig.autoClose && finalConfig.autoCloseDelay) {
        setAutoCloseTimerFunc(finalConfig.autoCloseDelay);
      }

      // Notify modal opened
      onModalOpen?.(finalConfig.type || "info");
    },
    [defaultModalConfig, onModalOpen, setAutoCloseTimerFunc, triggerConfetti],
  );

  // ❌ CLOSE MODAL
  const closeModal = useCallback(() => {
    const currentType = modalState.type;

    clearAutoCloseTimer();

    setModalState(prev => ({
      ...prev,
      isOpen: false,
      isLoading: false,
    }));

    // Call onClose callback
    modalState.onClose?.();

    // Notify modal closed
    onModalClose?.(currentType || "info");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearAutoCloseTimer, modalState.onClose, modalState.type, onModalClose]);

  // ✅ CONFIRM ACTION
  const confirmAction = useCallback(async () => {
    if (modalState.onConfirm) {
      setModalState(prev => ({ ...prev, isLoading: true }));

      try {
        await modalState.onConfirm();
        closeModal();
      } catch (error) {
        console.error("Modal confirm action failed:", error);
        setModalState(prev => ({ ...prev, isLoading: false }));
      }
    } else {
      closeModal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalState.onConfirm, closeModal]);

  // ❌ CANCEL ACTION
  const cancelAction = useCallback(() => {
    modalState.onCancel?.();
    closeModal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalState.onCancel, closeModal]);

  // 🎯 PRESET MODAL CONFIGURATIONS
  const presetModals = {
    // Success modals
    mintSuccess: (config: Partial<BoxModalConfig> = {}) =>
      openModal({
        type: "success",
        title: "🎉 Success!",
        description: "Special Box minted successfully!",
        confirmText: "Awesome!",
        autoClose: true,
        autoCloseDelay: 3000,
        showConfetti: true,
        ...config,
      }),

    burnSuccess: (config: Partial<BoxModalConfig> = {}) =>
      openModal({
        type: "success",
        title: "🔥 Burned!",
        description: "Special Box burned successfully!",
        confirmText: "Got it!",
        autoClose: true,
        autoCloseDelay: 2500,
        ...config,
      }),

    gameSuccess: (config: Partial<BoxModalConfig> = {}) =>
      openModal({
        type: "success",
        title: "🎮 Game Success!",
        description: "Action completed successfully!",
        confirmText: "Continue",
        autoClose: true,
        autoCloseDelay: 2000,
        showConfetti: true,
        ...config,
      }),

    // Error modals
    error: (message: string, config: Partial<BoxModalConfig> = {}) =>
      openModal({
        type: "error",
        title: "❌ Error",
        description: message,
        confirmText: "Try Again",
        cancelText: "Cancel",
        ...config,
      }),

    walletError: (config: Partial<BoxModalConfig> = {}) =>
      openModal({
        type: "error",
        title: "👛 Wallet Error",
        description: "Please connect your wallet to continue",
        confirmText: "Connect Wallet",
        ...config,
      }),

    insufficientFunds: (config: Partial<BoxModalConfig> = {}) =>
      openModal({
        type: "error",
        title: "💰 Insufficient Funds",
        description: "You don't have enough funds for this transaction",
        confirmText: "Add Funds",
        ...config,
      }),

    // Warning modals
    warning: (message: string, config: Partial<BoxModalConfig> = {}) =>
      openModal({
        type: "warning",
        title: "⚠️ Warning",
        description: message,
        confirmText: "Proceed",
        cancelText: "Cancel",
        ...config,
      }),

    cooldownActive: (timeRemaining: string, config: Partial<BoxModalConfig> = {}) =>
      openModal({
        type: "warning",
        title: "⏰ Cooldown Active",
        description: `Please wait ${timeRemaining} before you can perform this action again.`,
        confirmText: "Understood",
        autoClose: true,
        autoCloseDelay: 3000,
        ...config,
      }),

    // Info modals
    info: (message: string, config: Partial<BoxModalConfig> = {}) =>
      openModal({
        type: "info",
        title: "ℹ️ Information",
        description: message,
        confirmText: "OK",
        ...config,
      }),

    // Confirmation modals
    confirmMint: (config: Partial<BoxModalConfig> = {}) =>
      openModal({
        type: "mint",
        title: "🎁 Mint Special Box",
        description: "Are you sure you want to mint a Special Box?",
        confirmText: "Mint Now",
        cancelText: "Cancel",
        ...config,
      }),

    confirmBurn: (tokenId: number, config: Partial<BoxModalConfig> = {}) =>
      openModal({
        type: "burn",
        title: "🔥 Burn Special Box",
        description: `Are you sure you want to burn Special Box #${tokenId}? This action cannot be undone.`,
        confirmText: "Burn Box",
        cancelText: "Keep Box",
        ...config,
      }),

    confirmGameAction: (action: string, config: Partial<BoxModalConfig> = {}) =>
      openModal({
        type: "info",
        title: `🎮 ${action}`,
        description: `Are you sure you want to ${action.toLowerCase()}?`,
        confirmText: "Confirm",
        cancelText: "Cancel",
        ...config,
      }),

    // Special game modals
    ingredientPurchase: (ingredient: string, config: Partial<BoxModalConfig> = {}) =>
      openModal({
        type: "info",
        title: `🥘 Buy ${ingredient}`,
        description: `Purchase ${ingredient} for free`,
        confirmText: "Buy Now",
        cancelText: "Cancel",
        ...config,
      }),

    mintHamburger: (config: Partial<BoxModalConfig> = {}) =>
      openModal({
        type: "info",
        title: "🍔 Mint Hamburger NFT",
        description: "Use your ingredients to create a delicious hamburger NFT?",
        confirmText: "Cook It!",
        cancelText: "Not Yet",
        showConfetti: true,
        ...config,
      }),
  };

  // 🔄 UPDATE MODAL
  const updateModal = useCallback((updates: Partial<BoxModalState>) => {
    setModalState(prev => ({ ...prev, ...updates }));
  }, []);

  // 🎯 TOGGLE LOADING
  const setLoading = useCallback((loading: boolean) => {
    setModalState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  return {
    // Modal state
    modalState,
    isOpen: modalState.isOpen,
    isLoading: modalState.isLoading,

    // Core functions
    openModal,
    closeModal,
    confirmAction,
    cancelAction,
    updateModal,
    setLoading,

    // Utility functions
    triggerConfetti,
    clearAutoCloseTimer,

    // Preset modals
    presetModals,

    // Quick access to common modals
    showSuccess: (message: string, config?: Partial<BoxModalConfig>) =>
      presetModals.info(message, { ...config, type: "success", showConfetti: true }),

    showError: (message: string, config?: Partial<BoxModalConfig>) => presetModals.error(message, config),

    showWarning: (message: string, config?: Partial<BoxModalConfig>) => presetModals.warning(message, config),

    showInfo: (message: string, config?: Partial<BoxModalConfig>) => presetModals.info(message, config),

    // Modal type checkers
    isSuccessModal: modalState.type === "success",
    isErrorModal: modalState.type === "error",
    isWarningModal: modalState.type === "warning",
    isInfoModal: modalState.type === "info",
    isMintModal: modalState.type === "mint",
    isBurnModal: modalState.type === "burn",
  };
};
