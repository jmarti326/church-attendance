"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/db";

export function SyncIndicator() {
  const [pendingCount, setPendingCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const checkPending = async () => {
      try {
        const unsyncedAttendance = await db.attendance.where("synced").equals(0).count();
        const unsyncedMembers = await db.members.where("synced").equals(0).count();
        setPendingCount(unsyncedAttendance + unsyncedMembers);
      } catch {
        setPendingCount(0);
      }
    };

    checkPending();
    const interval = setInterval(checkPending, 5000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, []);

  if (isOnline && pendingCount === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 text-center text-xs py-1 font-medium lg:ml-56"
      style={{
        backgroundColor: isOnline ? "var(--theme-primary-light)" : "#fef3c7",
        color: isOnline ? "var(--theme-primary)" : "#92400e",
      }}
    >
      {!isOnline ? (
        "📡 Sin conexión — los cambios se guardan localmente"
      ) : pendingCount > 0 ? (
        `🔄 ${pendingCount} cambio${pendingCount > 1 ? "s" : ""} pendiente${pendingCount > 1 ? "s" : ""} de sincronizar`
      ) : null}
    </div>
  );
}
