"use client";

import { useState, useMemo } from "react";
import { StatusBadge, type MemberStatus } from "@/components/StatusBadge";
import { useMembers } from "@/lib/hooks";
import { SyncService } from "@/lib/sync";

export default function MembersPage() {
  const { members, loading, syncStatus, isOnline, triggerSync, reload } = useMembers();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showAdd, setShowAdd] = useState(false);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return members.filter((m) => {
      const matchesSearch =
        m.firstName.toLowerCase().includes(term) ||
        m.lastName.toLowerCase().includes(term);
      const matchesStatus = statusFilter === "all" || m.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [members, search, statusFilter]);

  // Group by familyId
  const grouped = useMemo(() => {
    const groups: Record<string, typeof filtered> = {};
    for (const m of filtered) {
      const key = m.familyId ? `family-${m.familyId}` : `solo-${m.id}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(m);
    }
    return Object.entries(groups).sort(([, a], [, b]) =>
      a[0].lastName.localeCompare(b[0].lastName)
    );
  }, [filtered]);

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-white z-10 border-b px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-lg font-bold text-gray-900">Miembros</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={triggerSync}
              className={`px-2 py-1 rounded text-xs font-medium ${
                !isOnline
                  ? "bg-red-100 text-red-600"
                  : syncStatus === "syncing"
                  ? "bg-yellow-100 text-yellow-600"
                  : "bg-green-100 text-green-600"
              }`}
            >
              {!isOnline ? "Offline" : syncStatus === "syncing" ? "Sync..." : "Online"}
            </button>
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium"
            >
              + Nuevo
            </button>
          </div>
        </div>
        <input
          type="text"
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2"
        />
        <div className="flex gap-1 overflow-x-auto pb-1">
          {[
            { value: "all", label: "Todos" },
            { value: "member", label: "Miembros" },
            { value: "visitor", label: "Visitantes" },
            { value: "members_class", label: "Clase" },
            { value: "inactive", label: "Inactivos" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                statusFilter === f.value
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Offline banner */}
      {!isOnline && (
        <div className="mx-4 mt-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800">
          Sin conexion. Los datos se muestran desde cache local.
        </div>
      )}

      {/* Add Member Form */}
      {showAdd && <AddMemberForm onClose={() => setShowAdd(false)} onSaved={reload} />}

      {/* Count */}
      <div className="px-4 py-2">
        <p className="text-xs text-gray-500">{filtered.length} miembros</p>
      </div>

      {/* Member list */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : (
        <div className="px-4">
          {grouped.map(([key, familyMembers]) => (
            <div key={key} className="mb-3">
              {familyMembers.length > 1 && (
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1 px-1">
                  {familyMembers[0].lastName}
                </h3>
              )}
              {familyMembers.map((m) => (
                <div
                  key={m.id || m.serverId}
                  className="flex items-center justify-between px-3 py-2.5 bg-white rounded-lg border border-gray-100 mb-1"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {m.firstName} {m.lastName}
                    </p>
                    {m.phone && <p className="text-xs text-gray-500">{m.phone}</p>}
                  </div>
                  <StatusBadge status={m.status} />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AddMemberForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    status: "visitor" as MemberStatus,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await SyncService.pushNewMember({
      firstName: form.firstName,
      lastName: form.lastName,
      phone: form.phone || undefined,
      status: form.status,
    });
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="mx-4 mt-2 p-4 bg-gray-50 rounded-xl border">
      <h3 className="font-semibold text-sm mb-3">Nuevo Miembro</h3>
      <div className="space-y-2">
        <input
          required
          placeholder="Nombre"
          value={form.firstName}
          onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          className="w-full border rounded-lg px-3 py-2 text-sm"
        />
        <input
          required
          placeholder="Apellido"
          value={form.lastName}
          onChange={(e) => setForm({ ...form, lastName: e.target.value })}
          className="w-full border rounded-lg px-3 py-2 text-sm"
        />
        <input
          placeholder="Telefono"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="w-full border rounded-lg px-3 py-2 text-sm"
        />
        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value as MemberStatus })}
          className="w-full border rounded-lg px-3 py-2 text-sm"
        >
          <option value="member">Miembro</option>
          <option value="visitor">Visitante</option>
          <option value="members_class">Clase de Miembros</option>
        </select>
      </div>
      <div className="flex gap-2 mt-3">
        <button type="button" onClick={onClose} className="flex-1 py-2 border rounded-lg text-sm">
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {saving ? "..." : "Guardar"}
        </button>
      </div>
    </form>
  );
}
