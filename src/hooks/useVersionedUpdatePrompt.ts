import { useState, useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { useVersionInfo } from "./useVersionInfo";

export interface UseVersionedUpdatePromptReturn {
  showUpdatePrompt: boolean;
  handleUpdate: () => Promise<void>;
  handleDismiss: () => void;
  title: string;
  subtitle: string;
  isLoading: boolean;
}

/**
 * Enhanced service worker hook that integrates version info
 * Manages PWA updates with custom versioned messages
 * Handles localStorage tracking to avoid showing the same message twice
 */
export function useVersionedUpdatePrompt(): UseVersionedUpdatePromptReturn {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const { versionInfo, isLoading, saveCurrentVersion } = useVersionInfo();

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration) {
      console.log("Service Worker registered successfully");

      // Check for updates every 60 seconds
      if (registration) {
        setInterval(() => {
          registration.update();
        }, 60000);
      }
    },
    onRegisterError(error) {
      console.error("Service Worker registration error:", error);
    },
    onNeedRefresh() {
      setShowUpdatePrompt(true);
    },
  });

  const handleUpdate = async () => {
    setShowUpdatePrompt(false);
    try {
      // Save the current version to localStorage before updating
      // This prevents showing the same update message again
      saveCurrentVersion();
      await updateServiceWorker(true);
    } catch (error) {
      console.error("Error during service worker update:", error);
      // Re-show prompt if update fails
      setShowUpdatePrompt(true);
    }
  };

  const handleDismiss = () => {
    setShowUpdatePrompt(false);
    setNeedRefresh(false);
  };

  return {
    showUpdatePrompt,
    handleUpdate,
    handleDismiss,
    title: versionInfo.title,
    subtitle: versionInfo.subtitle,
    isLoading,
  };
}
