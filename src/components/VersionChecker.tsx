"use client";

import { useEffect, useRef } from "react";

const CHECK_INTERVAL = 60_000; // check every 60 seconds

export function VersionChecker() {
  const currentVersion = process.env.NEXT_PUBLIC_APP_VERSION || "dev";
  const hasReloaded = useRef(false);

  useEffect(() => {
    if (currentVersion === "dev") return;

    const check = async () => {
      try {
        const res = await fetch("/api/version", { cache: "no-store" });
        if (!res.ok) return;
        const { version } = await res.json();
        if (version && version !== currentVersion && !hasReloaded.current) {
          hasReloaded.current = true;
          // Unregister service workers and reload
          if ("serviceWorker" in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            await Promise.all(registrations.map((r) => r.unregister()));
          }
          window.location.reload();
        }
      } catch {
        // silently ignore network errors
      }
    };

    const interval = setInterval(check, CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [currentVersion]);

  return null;
}
