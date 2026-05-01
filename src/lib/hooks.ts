"use client";

import { useState, useEffect, useCallback } from "react";
import { SyncService } from "@/lib/sync";
import type { LocalMember } from "@/lib/db";

type SyncStatus = "synced" | "pending" | "syncing" | "offline" | "error";

export function useSync() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("synced");
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sync when back online
      triggerSync();
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus("offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const triggerSync = useCallback(async () => {
    setSyncStatus("syncing");
    const result = await SyncService.fullSync();
    setSyncStatus(result.success ? "synced" : "error");
  }, []);

  return { syncStatus, isOnline, triggerSync };
}

export function useMembers() {
  const [members, setMembers] = useState<LocalMember[]>([]);
  const [loading, setLoading] = useState(true);
  const { syncStatus, isOnline, triggerSync } = useSync();

  const loadMembers = useCallback(async () => {
    setLoading(true);

    // Try server first if online
    if (navigator.onLine) {
      try {
        await SyncService.pullMembers();
      } catch {
        // Fall through to local
      }
    }

    // Always read from local DB
    const local = await SyncService.getAllLocalMembers();
    if (local.length > 0) {
      setMembers(local);
    } else if (navigator.onLine) {
      // Fallback: direct API call if IndexedDB is empty (first load)
      try {
        const res = await fetch("/api/members?status=all");
        const data = await res.json();
        setMembers(data);
        // Cache to IndexedDB
        await SyncService.pullMembers();
      } catch {
        // No data available
      }
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  return { members, loading, syncStatus, isOnline, triggerSync, reload: loadMembers };
}

export function useAttendance(date: string) {
  const [presentIds, setPresentIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState<"synced" | "local" | null>(null);

  const loadAttendance = useCallback(async () => {
    setLoading(true);

    // Try to pull from server
    if (navigator.onLine) {
      try {
        await SyncService.pullAttendance(date);
      } catch {
        // Use local
      }
    }

    // Read from local
    const local = await SyncService.getLocalAttendance(date);
    if (local.length > 0) {
      setPresentIds(new Set(local.map((a) => a.memberId)));
    } else if (navigator.onLine) {
      // Fallback direct API
      try {
        const res = await fetch(`/api/attendance?date=${date}`);
        const data = await res.json();
        if (data.attendances) {
          setPresentIds(new Set(data.attendances.map((a: { memberId: number }) => a.memberId)));
        }
      } catch {
        // No data
      }
    }

    setLoading(false);
  }, [date]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const saveAttendance = useCallback(
    async (memberIds: number[]) => {
      const synced = await SyncService.pushAttendance(date, memberIds);
      setLastSaved(synced ? "synced" : "local");
      setPresentIds(new Set(memberIds));
    },
    [date]
  );

  const toggle = useCallback((id: number) => {
    setPresentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return { presentIds, loading, toggle, saveAttendance, lastSaved };
}
