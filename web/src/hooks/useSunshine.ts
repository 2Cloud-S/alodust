import { useState, useEffect, useCallback } from "react";

interface SunshineStatus {
  isInstalled: boolean;
  isRunning: boolean;
  version?: string;
  tailscaleIP?: string;
}

const DEFAULT_SUNSHINE_PORT = 47989;

export function useSunshine() {
  const [status, setStatus] = useState<SunshineStatus>({
    isInstalled: false,
    isRunning: false,
  });
  const [isChecking, setIsChecking] = useState(false);

  // Try to detect Sunshine by checking if the API endpoint responds
  const checkSunshineStatus = useCallback(async () => {
    setIsChecking(true);

    try {
      // Sunshine runs a local API on port 47989 by default
      // Note: This might be blocked by CORS in production
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);

      const response = await fetch(`https://localhost:${DEFAULT_SUNSHINE_PORT}/api/apps`, {
        method: "GET",
        signal: controller.signal,
      }).catch(() => null);

      clearTimeout(timeout);

      if (response) {
        setStatus({
          isInstalled: true,
          isRunning: true,
        });
      } else {
        // Sunshine not running but might be installed
        setStatus({
          isInstalled: false,
          isRunning: false,
        });
      }
    } catch {
      setStatus({
        isInstalled: false,
        isRunning: false,
      });
    } finally {
      setIsChecking(false);
    }
  }, []);

  // Check Tailscale IP
  const getTailscaleIP = useCallback(async (): Promise<string | null> => {
    // In a real implementation, this would call the Tailscale API
    // For now, user needs to manually enter their Tailscale IP
    return null;
  }, []);

  // Launch Sunshine (deep link)
  const launchSunshine = useCallback(() => {
    // Sunshine doesn't have a standard deep link protocol
    // Users need to manually start Sunshine
    // This is a placeholder for future implementation
    window.open("https://github.com/LizardByte/Sunshine/releases", "_blank");
  }, []);

  // Open Sunshine settings
  const openSunshineSettings = useCallback(() => {
    window.open(`https://localhost:${DEFAULT_SUNSHINE_PORT}`, "_blank");
  }, []);

  // Check status on mount and periodically
  useEffect(() => {
    checkSunshineStatus();

    // Check every 30 seconds
    const interval = setInterval(checkSunshineStatus, 30000);

    return () => clearInterval(interval);
  }, [checkSunshineStatus]);

  return {
    ...status,
    isChecking,
    checkStatus: checkSunshineStatus,
    getTailscaleIP,
    launchSunshine,
    openSunshineSettings,
    sunshinePort: DEFAULT_SUNSHINE_PORT,
  };
}
