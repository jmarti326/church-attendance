"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { type MemberStatus } from "@/components/StatusBadge";

interface Family {
  id: number;
  name: string;
}

interface Member {
  id: number;
  firstName: string;
  lastName: string;
  phone?: string | null;
  address?: string | null;
  status: MemberStatus;
  familyId?: number | null;
  family?: Family | null;
}

export default function MemberDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [member, setMember] = useState<Member | null>(null);
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    status: "member" as MemberStatus,
    familyId: "" as string,
    newFamilyName: "",
  });

  const fetchData = useCallback(async () => {
    const [memberRes, familiesRes] = await Promise.all([
      fetch(`/api/members/${id}`),
      fetch("/api/families"),
    ]);

    if (memberRes.ok) {
      const m: Member = await memberRes.json();
      setMember(m);
      setForm({
        firstName: m.firstName,
        lastName: m.lastName,
        phone: m.phone || "",
        address: m.address || "",
        status: m.status,
        familyId: m.familyId?.toString() || "",
        newFamilyName: "",
      });
    }

    if (familiesRes.ok) {
      setFamilies(await familiesRes.json());
    }

    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async (e: React.FormEvent) => {
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

    await fetch(`/api/members/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        address: form.address,
        status: form.status,
        familyId,
      }),
    });

    setSaving(false);
    router.push("/members");
  };

  const handleDelete = async () => {
    await fetch(`/api/members/${id}`, { method: "DELETE" });
    router.push("/members");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="p-4 text-center text-gray-500">Miembro no encontrado</div>
    );
  }

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-white z-10 border-b px-4 py-3 shadow-sm flex items-center gap-3">
        <button
          onClick={() => router.push("/members")}
          className="text-gray-500 text-lg"
        >
          ←
        </button>
        <h1 className="text-lg font-bold text-gray-900">Editar Miembro</h1>
      </div>

      <form onSubmit={handleSave} className="p-4 space-y-4">
        {/* Name */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-500 uppercase">Nombre</label>
          <input
            required
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            placeholder="Nombre"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
          />
          <input
            required
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            placeholder="Apellido"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
          />
        </div>

        {/* Contact */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-500 uppercase">Contacto</label>
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="Teléfono"
            type="tel"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
          />
          <input
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Dirección"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
          />
        </div>

        {/* Status */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-500 uppercase">Estado</label>
          <div className="grid grid-cols-2 gap-2">
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
                className={`px-3 py-2.5 rounded-lg border text-sm font-medium flex items-center gap-2 ${
                  form.status === s.value
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : "border-gray-200 text-gray-600"
                }`}
              >
                <span>{s.emoji}</span>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Family */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-500 uppercase">Familia</label>
          <select
            value={form.familyId}
            onChange={(e) => setForm({ ...form, familyId: e.target.value, newFamilyName: "" })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
          >
            <option value="">Sin familia asignada</option>
            {families.map((f) => (
              <option key={f.id} value={f.id.toString()}>
                {f.name}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">o crear nueva:</span>
            <input
              value={form.newFamilyName}
              onChange={(e) => setForm({ ...form, newFamilyName: e.target.value, familyId: "" })}
              placeholder="Nombre de nueva familia"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Save */}
        <button
          type="submit"
          disabled={saving}
          className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl shadow disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar Cambios"}
        </button>

        {/* Delete */}
        <div className="pt-4 border-t">
          {!showDelete ? (
            <button
              type="button"
              onClick={() => setShowDelete(true)}
              className="w-full text-red-500 text-sm font-medium py-2"
            >
              Eliminar Miembro
            </button>
          ) : (
            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
              <p className="text-sm text-red-700 mb-2">¿Estás seguro? Esta acción no se puede deshacer.</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowDelete(false)}
                  className="flex-1 py-2 border rounded-lg text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium"
                >
                  Eliminar
                </button>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
