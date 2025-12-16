import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface VersionInfo {
  version?: string;
  title: string;
  subtitle: string;
}

const INSTALL_PROMPT_VERSION_KEY = "pwa-install-prompt-version";

/**
 * Hook to handle PWA install prompt with version-based triggering
 * Shows native browser install prompt when app version changes
 */
export function usePWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSBanner, setShowIOSBanner] = useState(false);

  // Check if app is already installed
  const checkIfInstalled = useCallback(() => {
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    return isStandalone || isIOSStandalone;
  }, []);

  // Fetch current version from version.json
  const fetchCurrentVersion = useCallback(async (): Promise<string | null> => {
    try {
      const cacheBuster = `?t=${Date.now()}`;
      const response = await fetch(`/version.json${cacheBuster}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      });

      if (!response.ok) return null;

      const data: VersionInfo = await response.json();
      // Use title as version identifier since version field might not exist
      return data.version || data.title || null;
    } catch (err) {
      console.warn("Failed to fetch version for install prompt:", err);
      return null;
    }
  }, []);

  // Check if should show prompt based on version
  const shouldShowPrompt = useCallback(async (): Promise<boolean> => {
    if (checkIfInstalled()) return false;

    const currentVersion = await fetchCurrentVersion();
    if (!currentVersion) return false;

    const lastPromptVersion = localStorage.getItem(INSTALL_PROMPT_VERSION_KEY);
    return currentVersion !== lastPromptVersion;
  }, [checkIfInstalled, fetchCurrentVersion]);

  // Trigger the native install prompt
  const triggerInstallPrompt = useCallback(async () => {
    if (!deferredPrompt) return false;

    try {
      // Show the native browser install prompt
      await deferredPrompt.prompt();

      // Wait for user response
      const result = await deferredPrompt.userChoice;

      // Update version regardless of user choice (so we don't spam them)
      const currentVersion = await fetchCurrentVersion();
      if (currentVersion) {
        localStorage.setItem(INSTALL_PROMPT_VERSION_KEY, currentVersion);
      }

      // Clear the deferred prompt
      setDeferredPrompt(null);

      return result.outcome === "accepted";
    } catch (err) {
      console.error("Error triggering install prompt:", err);
      return false;
    }
  }, [deferredPrompt, fetchCurrentVersion]);

  // Handle iOS banner dismissal
  const dismissIOSBanner = useCallback(async () => {
    const currentVersion = await fetchCurrentVersion();
    if (currentVersion) {
      localStorage.setItem(INSTALL_PROMPT_VERSION_KEY, currentVersion);
    }
    setShowIOSBanner(false);
  }, [fetchCurrentVersion]);

  // Dismiss install banner without triggering prompt
  const dismissInstallBanner = useCallback(async () => {
    const currentVersion = await fetchCurrentVersion();
    if (currentVersion) {
      localStorage.setItem(INSTALL_PROMPT_VERSION_KEY, currentVersion);
    }
    setDeferredPrompt(null);
  }, [fetchCurrentVersion]);

  useEffect(() => {
    // Check if already installed
    setIsInstalled(checkIfInstalled());

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Handle beforeinstallprompt event
    const handleBeforeInstallPrompt = async (e: Event) => {
      // Prevent the default mini-infobar from appearing
      e.preventDefault();

      // Store the event for later use
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);

      // Check if we should show the prompt based on version
      const shouldShow = await shouldShowPrompt();
      if (shouldShow) {
        // Small delay to let the app fully load
        setTimeout(async () => {
          try {
            await promptEvent.prompt();
            const result = await promptEvent.userChoice;

            // Update version regardless of outcome
            const currentVersion = await fetchCurrentVersion();
            if (currentVersion) {
              localStorage.setItem(INSTALL_PROMPT_VERSION_KEY, currentVersion);
            }

            if (result.outcome === "accepted") {
              setIsInstalled(true);
            }
            setDeferredPrompt(null);
          } catch (err) {
            console.error("Error showing install prompt:", err);
          }
        }, 2000);
      }
    };

    // Handle app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    // Check iOS banner visibility
    const checkIOSBanner = async () => {
      if (isIOSDevice && !checkIfInstalled()) {
        const shouldShow = await shouldShowPrompt();
        setShowIOSBanner(shouldShow);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // Check iOS banner after a delay
    if (isIOSDevice) {
      setTimeout(checkIOSBanner, 3000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [checkIfInstalled, shouldShowPrompt, fetchCurrentVersion]);

  return {
    canInstall: !!deferredPrompt && !isInstalled,
    isInstalled,
    isIOS,
    showIOSBanner,
    triggerInstallPrompt,
    dismissIOSBanner,
    dismissInstallBanner,
  };
}
