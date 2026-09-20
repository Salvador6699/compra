import { useState, useEffect, useCallback, useRef } from "react";

export function useWakeLock(shouldKeepAwake: boolean = true) {
  const [isSupported, setIsSupported] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isEnabled, setIsEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem("libreta_wakelock_enabled");
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const wakeLockSentinelRef = useRef<any>(null);

  // Check browser support
  useEffect(() => {
    if (typeof window !== "undefined" && "wakeLock" in navigator) {
      setIsSupported(true);
    }
  }, []);

  // Save preference
  useEffect(() => {
    try {
      localStorage.setItem("libreta_wakelock_enabled", JSON.stringify(isEnabled));
    } catch {}
  }, [isEnabled]);

  // Acquire wake lock
  const requestLock = useCallback(async () => {
    if (typeof window === "undefined" || !("wakeLock" in navigator)) return;

    try {
      if (!wakeLockSentinelRef.current) {
        const sentinel = await (navigator as any).wakeLock.request("screen");
        wakeLockSentinelRef.current = sentinel;
        setIsActive(true);

        sentinel.addEventListener("release", () => {
          wakeLockSentinelRef.current = null;
          setIsActive(false);
        });
      }
    } catch (err) {
      console.warn("No se pudo activar Screen Wake Lock:", err);
      setIsActive(false);
    }
  }, []);

  // Release wake lock
  const releaseLock = useCallback(async () => {
    if (wakeLockSentinelRef.current) {
      try {
        await wakeLockSentinelRef.current.release();
      } catch {
        // Ignore release errors
      }
      wakeLockSentinelRef.current = null;
      setIsActive(false);
    }
  }, []);

  // Toggle user preference
  const toggleEnabled = useCallback(() => {
    setIsEnabled((prev: boolean) => {
      const next = !prev;
      if (!next) {
        releaseLock();
      }
      return next;
    });
  }, [releaseLock]);

  // Manage wake lock lifecycle based on conditions
  useEffect(() => {
    if (isSupported && isEnabled && shouldKeepAwake) {
      requestLock();
    } else {
      releaseLock();
    }
  }, [isSupported, isEnabled, shouldKeepAwake, requestLock, releaseLock]);

  // Re-acquire lock when app tab becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isEnabled && shouldKeepAwake) {
        requestLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      releaseLock();
    };
  }, [isEnabled, shouldKeepAwake, requestLock, releaseLock]);

  return {
    isSupported,
    isActive,
    isEnabled,
    toggleEnabled,
  };
}
