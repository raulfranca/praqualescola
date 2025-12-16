import { useState, useCallback } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

export interface VersionInfo {
  title: string;
  subtitle: string;
}

const FALLBACK_VERSION: VersionInfo = {
  title: "Nova versão disponível",
  subtitle: "Clique em atualizar para ver as novidades",
};

const VERSION_CACHE_KEY = "app-version-seen";

export interface UseVersionedUpdatePromptReturn {
  showUpdatePrompt: boolean;
  handleUpdate: () => Promise<void>;
  handleDismiss: () => void;
  title: string;
  subtitle: string;
  isLoading: boolean;
}

/**
 * Fetches version.json from network, bypassing all caches
 * This ensures we always get the NEWEST version's message when an update is available
 */
async function fetchFreshVersionInfo(): Promise<VersionInfo> {
  try {
    // Add timestamp to bust any proxy/CDN caches
    const cacheBuster = `?t=${Date.now()}`;
    const response = await fetch(`/version.json${cacheBuster}`, {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch version.json: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.title || !data.subtitle) {
      throw new Error("version.json missing required fields");
    }

    return data as VersionInfo;
  } catch (err) {
    console.warn("Failed to fetch fresh version info:", err);
    return FALLBACK_VERSION;
  }
}

/**
 * Enhanced service worker hook that fetches NEW version info when update is detected
 * Fixes timing issue where old version's message was shown instead of new version's
 */
export function useVersionedUpdatePrompt(): UseVersionedUpdatePromptReturn {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [versionInfo, setVersionInfo] = useState<VersionInfo>(FALLBACK_VERSION);
  const [isLoading, setIsLoading] = useState(false);

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
    async onNeedRefresh() {
      // When SW detects update, fetch the NEW version's info from network
      setIsLoading(true);
      const freshInfo = await fetchFreshVersionInfo();
      setVersionInfo(freshInfo);
      setIsLoading(false);
      setShowUpdatePrompt(true);
    },
  });

  const handleUpdate = useCallback(async () => {
    setShowUpdatePrompt(false);
    try {
      // Save current version to localStorage to track what user has seen
      localStorage.setItem(VERSION_CACHE_KEY, JSON.stringify(versionInfo));
      await updateServiceWorker(true);
    } catch (error) {
      console.error("Error during service worker update:", error);
      setShowUpdatePrompt(true);
    }
  }, [updateServiceWorker, versionInfo]);

  const handleDismiss = useCallback(() => {
    setShowUpdatePrompt(false);
    setNeedRefresh(false);
  }, [setNeedRefresh]);

  return {
    showUpdatePrompt,
    handleUpdate,
    handleDismiss,
    title: versionInfo.title,
    subtitle: versionInfo.subtitle,
    isLoading,
  };
}
