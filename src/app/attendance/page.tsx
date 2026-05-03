"use client";

import { useState, useMemo } from "react";
import { StatusBadge, type MemberStatus } from "@/components/StatusBadge";
import { useMembers, useAttendance } from "@/lib/hooks";
import { useTheme } from "@/components/ThemeProvider";
import { ThemePicker } from "@/components/ThemePicker";
import { LogoutButton } from "@/components/LogoutButton";

interface Member {
  id?: number;
  serverId?: number;
  firstName: string;
  lastName: string;
  phone?: string;
  status: MemberStatus;
  familyId?: number;
}

export default function AttendancePage() {
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [search, setSearch] = useState("");
  const { members, loading: membersLoading, syncStatus, isOnline, triggerSync } = useMembers();
  const { presentIds, loading: attendanceLoading, toggle, saveAttendance, lastSaved } = useAttendance(date);
  const [saving, setSaving] = useState(false);
  const { theme } = useTheme();

  const activeMembers = useMemo(
    () => members.filter((m) => m.status !== "inactive" && m.status !== "pastor" && m.status !== "fallecido"),
    [members]
  );

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return activeMembers.filter(
      (m) =>
        m.firstName.toLowerCase().includes(term) ||
        m.lastName.toLowerCase().includes(term)
    );
  }, [activeMembers, search]);

  // Group by familyId
  const grouped = useMemo(() => {
    const groups: Record<string, Member[]> = {};
    for (const m of filtered) {
      const key = m.familyId ? `family-${m.familyId}` : `solo-${m.id}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(m);
    }
    return Object.values(groups).sort((a, b) =>
      a[0].lastName.localeCompare(b[0].lastName)
    );
  }, [filtered]);

  const loading = membersLoading || attendanceLoading;

  const handleSave = async () => {
    setSaving(true);
    await saveAttendance(Array.from(presentIds));
    setSaving(false);
  };

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b px-4 py-3 shadow-sm" style={{ backgroundColor: theme.headerBg }}>
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-lg font-bold text-gray-900">Asistencia</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold" style={{ color: theme.primary }}>
              {presentIds.size} presentes
            </span>
            <button
              onClick={triggerSync}
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                !isOnline
                  ? "bg-red-100 text-red-600"
                  : syncStatus === "syncing"
                  ? "bg-yellow-100 text-yellow-600 animate-spin"
                  : "bg-green-100 text-green-600"
              }`}
              title={isOnline ? "Sincronizado" : "Sin conexión"}
            >
              {!isOnline ? "⚡" : syncStatus === "syncing" ? "↻" : "✓"}
            </button>
            <ThemePicker />
            <LogoutButton />
          </div>
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2"
        />
        <input
          type="text"
          placeholder="Buscar miembro..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
      </div>

      {/* Offline banner */}
      {!isOnline && (
        <div className="mx-4 mt-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800">
          📴 Sin conexión — los cambios se guardarán localmente y se sincronizarán al reconectar.
        </div>
      )}

      {/* Member list */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: theme.primary }} />
        </div>
      ) : (
        <div className="px-4 py-2">
          {grouped.map((familyMembers) => {
            const familyKey = familyMembers.map((m) => m.id).join("-");
            return (
              <div key={familyKey} className="mb-2">
                {familyMembers.length > 1 && (
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1 px-1">
                    🏠 {familyMembers[0].lastName}
                  </h3>
                )}
                {familyMembers.map((m) => {
                  const memberId = m.serverId || m.id!;
                  const isPresent = presentIds.has(memberId);
                  return (
                    <button
                      key={memberId}
                      onClick={() => toggle(memberId)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg mb-1 transition-all active:scale-[0.98]"
                      style={{
                        backgroundColor: isPresent ? theme.presentBg : "white",
                        border: `1px solid ${isPresent ? theme.presentBorder : "#f3f4f6"}`,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors"
                          style={{
                            borderColor: isPresent ? theme.checkColor : "#d1d5db",
                            backgroundColor: isPresent ? theme.checkColor : "transparent",
                          }}
                        >
                          {isPresent && <span className="text-white text-xs">✓</span>}
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {m.firstName} {m.lastName}
                        </span>
                      </div>
                      <StatusBadge status={m.status} />
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* Save button */}
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-gradient-to-t from-white via-white">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full text-white font-semibold py-3 rounded-xl shadow-lg disabled:opacity-50 active:scale-[0.98] transition-transform"
          style={{ background: theme.buttonGradient }}
        >
          {saving ? "Guardando..." : `Guardar Asistencia (${presentIds.size})`}
        </button>
        {lastSaved && (
          <p className="text-center text-xs mt-1 text-gray-500">
            {lastSaved === "synced" ? "✓ Guardado en servidor" : "💾 Guardado localmente"}
          </p>
        )}
      </div>
    </div>
  );
}
