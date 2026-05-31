"use client";

import { useState, useMemo, useEffect } from "react";
import { StatusBadge, type MemberStatus } from "@/components/StatusBadge";
import { useMembers, useAttendance, useVisitorCount } from "@/lib/hooks";
import { useTheme } from "@/components/ThemeProvider";
import { ThemePicker } from "@/components/ThemePicker";
import { LogoutButton } from "@/components/LogoutButton";
import { VisitorStepper } from "@/components/VisitorStepper";

interface Member {
  id?: number;
  serverId?: number;
  firstName: string;
  lastName: string;
  phone?: string;
  status: MemberStatus;
  familyId?: number;
}

interface Family {
  id: number;
  name: string;
}

const STATUS_OPTIONS: { value: string; label: string; emoji: string }[] = [
  { value: "all", label: "Todos", emoji: "👥" },
  { value: "member", label: "Miembros", emoji: "⛪" },
  { value: "visitor", label: "Visitantes", emoji: "👋" },
  { value: "members_class", label: "Clase", emoji: "📖" },
];

export default function AttendancePage() {
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [familyFilter, setFamilyFilter] = useState<number | "all">("all");
  const [families, setFamilies] = useState<Family[]>([]);
  const { members, loading: membersLoading, syncStatus, isOnline, triggerSync } = useMembers();
  const { presentIds, loading: attendanceLoading, toggle, saveAttendance, lastSaved } = useAttendance(date);
  const { count: visitorCount, notes: visitorNotes, increment, decrement, saveVisitorCount, setNotes: setVisitorNotes } = useVisitorCount(date);
  const [saving, setSaving] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    fetch("/api/families").then((r) => r.json()).then(setFamilies).catch(() => {});
  }, []);

  const activeMembers = useMemo(
    () => members.filter((m) => m.status !== "inactive" && m.status !== "pastor" && m.status !== "fallecido"),
    [members]
  );

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return activeMembers.filter((m) => {
      const matchesSearch =
        m.firstName.toLowerCase().includes(term) ||
        m.lastName.toLowerCase().includes(term);
      const matchesStatus = statusFilter === "all" || m.status === statusFilter;
      const matchesFamily = familyFilter === "all" || m.familyId === familyFilter;
      return matchesSearch && matchesStatus && matchesFamily;
    });
  }, [activeMembers, search, statusFilter, familyFilter]);

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

  const getFamilyName = (familyId?: number) => {
    if (!familyId) return null;
    return families.find((f) => f.id === familyId)?.name || null;
  };

  // Toggle all members in a family
  const toggleFamily = (familyMembers: Member[]) => {
    const allPresent = familyMembers.every((m) => presentIds.has(m.serverId || m.id!));
    for (const m of familyMembers) {
      const memberId = m.serverId || m.id!;
      if (allPresent) {
        if (presentIds.has(memberId)) toggle(memberId);
      } else {
        if (!presentIds.has(memberId)) toggle(memberId);
      }
    }
  };

  return (
    <div className="pb-24 max-w-5xl mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b px-4 py-3 shadow-sm" style={{ backgroundColor: theme.headerBg }}>
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-lg font-bold text-gray-900">Asistencia</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold" style={{ color: theme.primary }}>
              {presentIds.size} + {visitorCount} 👥
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
        <div className="lg:flex lg:gap-3 lg:items-center">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full lg:w-auto border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2 lg:mb-0"
          />
          <input
            type="text"
            placeholder="Buscar miembro..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full lg:flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2 lg:mb-0"
          />
        </div>

        {/* Status filter chips */}
        <div className="flex gap-1.5 mb-2 overflow-x-auto mt-2">
          {STATUS_OPTIONS.map((opt) => {
            const isActive = statusFilter === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors"
                style={{
                  backgroundColor: isActive ? theme.primaryLight : "#f3f4f6",
                  color: isActive ? theme.primary : "#6b7280",
                  border: `1px solid ${isActive ? theme.primaryBorder : "transparent"}`,
                }}
              >
                <span>{opt.emoji}</span>
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>

        {/* Family filter */}
        <select
          value={familyFilter}
          onChange={(e) => setFamilyFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
          className="w-full lg:w-64 border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">🏠 Todas las familias</option>
          {families.map((f) => (
            <option key={f.id} value={f.id}>🏠 {f.name}</option>
          ))}
        </select>
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
          <div className="lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-3">
          {grouped.map((familyMembers) => {
            const familyKey = familyMembers.map((m) => m.id).join("-");
            const isFamily = familyMembers.length > 1;
            const familyName = getFamilyName(familyMembers[0].familyId);
            const allPresent = familyMembers.every((m) => presentIds.has(m.serverId || m.id!));

            return (
              <div
                key={familyKey}
                className="mb-3 rounded-xl overflow-hidden"
                style={{
                  border: isFamily ? `1px solid ${theme.primaryBorder}` : "none",
                  backgroundColor: isFamily ? `${theme.primaryLight}40` : "transparent",
                }}
              >
                {/* Family header */}
                {isFamily && (
                  <button
                    onClick={() => toggleFamily(familyMembers)}
                    className="w-full flex items-center justify-between px-3 py-2 text-left"
                    style={{ backgroundColor: `${theme.primaryLight}80` }}
                  >
                    <span className="text-xs font-bold uppercase tracking-wide" style={{ color: theme.primary }}>
                      🏠 {familyName || familyMembers[0].lastName}
                    </span>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{
                        backgroundColor: allPresent ? theme.checkColor : "#e5e7eb",
                        color: allPresent ? "white" : "#6b7280",
                      }}
                    >
                      {allPresent ? "✓ Todos" : `${familyMembers.filter((m) => presentIds.has(m.serverId || m.id!)).length}/${familyMembers.length}`}
                    </span>
                  </button>
                )}

                {/* Members */}
                <div className={isFamily ? "px-2 pb-2 pt-1" : ""}>
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
              </div>
            );
          })}
          </div>
        </div>
      )}

      {/* Visitor stepper */}
      {!loading && (
        <VisitorStepper
          count={visitorCount}
          notes={visitorNotes}
          onIncrement={increment}
          onDecrement={decrement}
          onNotesChange={(newNotes) => {
            setVisitorNotes(newNotes);
            saveVisitorCount(visitorCount, newNotes);
          }}
        />
      )}

      {/* Save button */}
      <div className="fixed bottom-16 lg:bottom-0 left-0 lg:left-56 right-0 p-4 bg-gradient-to-t from-white via-white">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full text-white font-semibold py-3 rounded-xl shadow-lg disabled:opacity-50 active:scale-[0.98] transition-transform"
            style={{ background: theme.buttonGradient }}
          >
            {saving ? "Guardando..." : `Guardar Asistencia (${presentIds.size} + ${visitorCount} visitantes)`}
          </button>
          {lastSaved && (
            <p className="text-center text-xs mt-1 text-gray-500">
              {lastSaved === "synced" ? "✓ Guardado en servidor" : "💾 Guardado localmente"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
