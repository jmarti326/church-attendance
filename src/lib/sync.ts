"use client";

import { db, type LocalMember, type LocalFamily, type LocalAttendance } from "./db";

interface ServerMember {
  id: number;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  status: "member" | "visitor" | "members_class" | "inactive";
  familyId?: number;
  family?: { id: number; name: string };
}

interface ServerAttendance {
  memberId: number;
  present: boolean;
}

interface ServerAttendanceResponse {
  record: { id: number; date: string } | null;
  attendances: ServerAttendance[];
}

export class SyncService {
  private static isOnline(): boolean {
    return typeof navigator !== "undefined" ? navigator.onLine : true;
  }

  /**
   * Pull all members from server into IndexedDB
   */
  static async pullMembers(): Promise<void> {
    if (!this.isOnline()) return;

    try {
      const res = await fetch("/api/members?status=all");
      if (!res.ok) return;
      const members: ServerMember[] = await res.json();

      const res2 = await fetch("/api/families");
      if (!res2.ok) return;
      const families: { id: number; name: string }[] = await res2.json();

      // Bulk replace local data with server data
      await db.transaction("rw", db.families, db.members, async () => {
        await db.families.clear();
        await db.families.bulkPut(
          families.map((f) => ({
            id: f.id,
            serverId: f.id,
            name: f.name,
            synced: true,
          }))
        );

        await db.members.clear();
        await db.members.bulkPut(
          members.map((m) => ({
            id: m.id,
            serverId: m.id,
            firstName: m.firstName,
            lastName: m.lastName,
            phone: m.phone || undefined,
            address: m.address || undefined,
            status: m.status,
            familyId: m.familyId || undefined,
            synced: true,
          }))
        );
      });
    } catch {
      // Offline or network error — silently fail
    }
  }

  /**
   * Pull attendance for a specific date
   */
  static async pullAttendance(date: string): Promise<void> {
    if (!this.isOnline()) return;

    try {
      const res = await fetch(`/api/attendance?date=${date}`);
      if (!res.ok) return;
      const data: ServerAttendanceResponse = await res.json();

      // Clear local attendance for this date and replace
      await db.transaction("rw", db.attendance, async () => {
        await db.attendance.where("date").equals(date).delete();

        if (data.attendances && data.attendances.length > 0) {
          await db.attendance.bulkPut(
            data.attendances.map((a, idx) => ({
              id: idx + 1000000 + Date.now(), // Avoid conflicts
              serverId: undefined,
              memberId: a.memberId,
              date,
              present: a.present,
              synced: true,
            }))
          );
        }
      });
    } catch {
      // Offline — use cached data
    }
  }

  /**
   * Push local attendance changes to server
   */
  static async pushAttendance(date: string, memberIds: number[]): Promise<boolean> {
    // Save locally first (offline-first)
    await db.transaction("rw", db.attendance, async () => {
      await db.attendance.where("date").equals(date).delete();
      await db.attendance.bulkPut(
        memberIds.map((memberId) => ({
          memberId,
          date,
          present: true,
          synced: false,
        }))
      );
    });

    // Try to push to server
    if (!this.isOnline()) return false;

    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, memberIds }),
      });

      if (res.ok) {
        // Mark as synced
        await db.attendance.where("date").equals(date).modify({ synced: true });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Push a new member to server
   */
  static async pushNewMember(member: Omit<LocalMember, "id" | "serverId" | "synced">): Promise<number | null> {
    // Save locally first
    const localId = await db.members.add({ ...member, synced: false });

    if (!this.isOnline()) return localId ?? null;

    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(member),
      });

      if (res.ok) {
        const serverMember = await res.json();
        await db.members.update(localId!, { serverId: serverMember.id, synced: true });
        return serverMember.id;
      }
    } catch {
      // Will sync later
    }

    return localId ?? null;
  }

  /**
   * Sync all unsynced attendance records
   */
  static async syncPendingAttendance(): Promise<void> {
    if (!this.isOnline()) return;

    const unsynced = await db.attendance.where("synced").equals(0).toArray();

    // Group by date
    const byDate = unsynced.reduce<Record<string, number[]>>((acc, a) => {
      if (!acc[a.date]) acc[a.date] = [];
      acc[a.date].push(a.memberId);
      return acc;
    }, {});

    for (const [date, memberIds] of Object.entries(byDate)) {
      try {
        const res = await fetch("/api/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date, memberIds }),
        });
        if (res.ok) {
          await db.attendance.where("date").equals(date).modify({ synced: true });
        }
      } catch {
        break; // Stop if offline
      }
    }
  }

  /**
   * Get members from local DB (offline-first)
   */
  static async getLocalMembers(): Promise<LocalMember[]> {
    return db.members.where("status").notEqual("inactive").toArray();
  }

  /**
   * Get all members including inactive
   */
  static async getAllLocalMembers(): Promise<LocalMember[]> {
    return db.members.toArray();
  }

  /**
   * Get local families
   */
  static async getLocalFamilies(): Promise<LocalFamily[]> {
    return db.families.toArray();
  }

  /**
   * Get attendance for a date from local DB
   */
  static async getLocalAttendance(date: string): Promise<LocalAttendance[]> {
    return db.attendance.where("date").equals(date).toArray();
  }

  /**
   * Full sync: pull from server, then push pending changes
   */
  static async fullSync(): Promise<{ success: boolean; error?: string }> {
    if (!this.isOnline()) {
      return { success: false, error: "Sin conexión" };
    }

    try {
      await this.syncPendingAttendance();
      await this.pullMembers();
      return { success: true };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  }
}
