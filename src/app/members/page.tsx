"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StatusBadge, type MemberStatus } from "@/components/StatusBadge";
import { useMembers } from "@/lib/hooks";
import { SyncService } from "@/lib/sync";
import { useAuth } from "@/components/AuthGuard";

interface Family {
  id: number;
  name: string;
}

export default function MembersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { members, loading, syncStatus, isOnline, triggerSync, reload } = useMembers();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showAdd, setShowAdd] = useState(false);
  const [families, setFamilies] = useState<Family[]>([]);

  useEffect(() => {
    fetch("/api/families").then((r) => r.json()).then(setFamilies).catch(() => {});
  }, []);

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
    <div className="pb-20 max-w-5xl mx-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white z-10 border-b px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-lg font-bold text-gray-900">Miembros</h1>
          <div className="flex items-center gap-2 flex-wrap justify-end">
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
            <Link
              href="/batch-upload"
              className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-200"
              style={{ display: isAdmin ? "inline-block" : "none" }}
            >
              📤 Importar
            </Link>
            <a
              href="/api/members/export"
              download="miembros.csv"
              className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-200"
            >
              💾 Exportar
            </a>
            <Link
              href="/admin/families"
              className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-200"
              style={{ display: isAdmin ? "inline-block" : "none" }}
            >
              🏠 Familias
            </Link>
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
            { value: "pastor", label: "Pastor" },
            { value: "inactive", label: "Inactivos" },
            { value: "fallecido", label: "Fallecidos" },
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

      {!isOnline && (
        <div className="mx-4 mt-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800">
          Sin conexion. Los datos se muestran desde cache local.
        </div>
      )}

      {showAdd && (
        <AddMemberForm
          families={families}
          onClose={() => setShowAdd(false)}
          onSaved={() => { reload(); fetch("/api/families").then(r => r.json()).then(setFamilies).catch(() => {}); }}
        />
      )}

      <div className="px-4 py-2">
        <p className="text-xs text-gray-500">{filtered.length} miembros</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : (
        <div className="px-4">
          <div className="lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-3">
          {grouped.map(([key, familyMembers]) => {
            const isFamily = familyMembers.length > 1;
            const familyName = familyMembers[0].lastName.split(" ")[0].toUpperCase();

            return (
            <div key={key} className={`mb-3 ${isFamily ? "rounded-xl border-2 border-indigo-200 bg-indigo-50/30 p-2" : ""}`}>
              {isFamily && (
                <div className="flex items-center justify-between px-2 py-1 mb-1">
                  <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wide">
                    🏠 {familyName}
                  </h3>
                  <span className="text-xs text-indigo-400 font-medium">{familyMembers.length} miembros</span>
                </div>
              )}
              {familyMembers.map((m) => {
                const memberId = m.serverId || m.id;

                return (
                  <div
                    key={m.id || m.serverId}
                    className="w-full flex items-center justify-between px-3 py-2.5 bg-white rounded-lg border border-gray-100 mb-1 transition-colors"
                  >
                    <button
                      onClick={() => router.push(`/members/${memberId}`)}
                      className="min-w-0 flex-1 text-left active:bg-gray-50"
                    >
                      <p className="text-sm font-medium text-gray-900">
                        {m.firstName} {m.lastName}
                      </p>
                      {m.phone && <p className="text-xs text-gray-500">{m.phone}</p>}
                    </button>
                    <div className="ml-3 flex items-center gap-2">
                      <Link
                        href={`/members/${memberId}/history`}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm text-gray-600 hover:bg-gray-200"
                        title="Ver historial de asistencia"
                        aria-label={`Ver historial de ${m.firstName} ${m.lastName}`}
                      >
                        📊
                      </Link>
                      <StatusBadge status={m.status} />
                      <button
                        onClick={() => router.push(`/members/${memberId}`)}
                        className="px-1 text-sm text-gray-300"
                        aria-label={`Editar a ${m.firstName} ${m.lastName}`}
                      >
                        ›
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          );
          })}
          </div>
        </div>
      )}
    </div>
  );
}

function AddMemberForm({
  families,
  onClose,
  onSaved,
}: {
  families: Family[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    birthday: "",
    photoUrl: "",
    status: "visitor" as MemberStatus,
    familyId: "" as string,
    newFamilyName: "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    let familyId: number | null = form.familyId ? parseInt(form.familyId) : null;

    // Create new family if specified
    if (form.newFamilyName.trim()) {
      const res = await fetch("/api/families", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.newFamilyName.trim() }),
      });
      if (res.ok) {
        const newFamily = await res.json();
        familyId = newFamily.id;
      }
    }

    // Create member via API (also saves offline via SyncService)
    if (navigator.onLine) {
      await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone || null,
          birthday: form.birthday || null,
          photoUrl: form.photoUrl || null,
          status: form.status,
          familyId,
        }),
      });
    } else {
      await SyncService.pushNewMember({
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone || undefined,
        status: form.status,
        familyId: familyId || undefined,
      });
    }

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
        <input
          type="date"
          placeholder="Cumpleaños"
          value={form.birthday}
          onChange={(e) => setForm({ ...form, birthday: e.target.value })}
          className="w-full border rounded-lg px-3 py-2 text-sm"
        />
        <input
          placeholder="URL de foto (opcional)"
          value={form.photoUrl}
          onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
          className="w-full border rounded-lg px-3 py-2 text-sm"
        />

        {/* Status */}
        <div className="grid grid-cols-2 gap-1.5">
          {([
            { value: "member", label: "Miembro", emoji: "✅" },
            { value: "visitor", label: "Visitante", emoji: "👋" },
            { value: "members_class", label: "En Clase", emoji: "📖" },
            { value: "inactive", label: "Inactivo", emoji: "⏸️" },
          ] as const).map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setForm({ ...form, status: s.value })}
              className={`px-2 py-2 rounded-lg border text-xs font-medium flex items-center gap-1 ${
                form.status === s.value
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                  : "border-gray-200 text-gray-600"
              }`}
            >
              <span>{s.emoji}</span> {s.label}
            </button>
          ))}
        </div>

        {/* Family */}
        <select
          value={form.familyId}
          onChange={(e) => setForm({ ...form, familyId: e.target.value, newFamilyName: "" })}
          className="w-full border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Sin familia</option>
          {families.map((f) => (
            <option key={f.id} value={f.id.toString()}>{f.name}</option>
          ))}
        </select>
        <input
          value={form.newFamilyName}
          onChange={(e) => setForm({ ...form, newFamilyName: e.target.value, familyId: "" })}
          placeholder="O crear nueva familia..."
          className="w-full border rounded-lg px-3 py-2 text-sm"
        />
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
