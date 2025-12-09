import { useState, useEffect } from "react";

export interface VersionInfo {
  title: string;
  subtitle: string;
}

const VERSION_CACHE_KEY = "app-version";
const FALLBACK_VERSION: VersionInfo = {
  title: "Nova versão disponível",
  subtitle: "Clique em atualizar para ver as novidades",
};

/**
 * Custom hook to fetch version information from version.json
 * Uses network-first strategy to ensure fresh version info
 * Falls back to hardcoded messages if fetch fails
 */
export function useVersionInfo() {
  const [versionInfo, setVersionInfo] = useState<VersionInfo>(FALLBACK_VERSION);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchVersionInfo = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Network-first strategy: always try to fetch fresh version info
        // Do not use cache to ensure we always get the latest version message
        const response = await fetch("/version.json", {
          cache: "no-store", // Disable caching for this fetch
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        });

        if (!response.ok) {
          throw new Error(
            `Failed to fetch version.json: ${response.statusText}`
          );
        }

        const data = await response.json();

        // Validate the response has required fields
        if (!data.title || !data.subtitle) {
          throw new Error("version.json missing required fields (title, subtitle)");
        }

        if (isMounted) {
          setVersionInfo(data as VersionInfo);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.warn(
          "Failed to fetch version info, using fallback:",
          error.message
        );
        if (isMounted) {
          setError(error);
          setVersionInfo(FALLBACK_VERSION);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchVersionInfo();

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Call this after successful update to save the current version
   * Prevents showing the same message again
   */
  const saveCurrentVersion = () => {
    try {
      localStorage.setItem(VERSION_CACHE_KEY, JSON.stringify(versionInfo));
    } catch (err) {
      console.warn("Failed to save version to localStorage:", err);
    }
  };

  return {
    versionInfo,
    isLoading,
    error,
    saveCurrentVersion,
  };
}
