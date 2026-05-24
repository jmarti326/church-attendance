"use client";

import { useEffect, useState } from "react";

interface Family {
  id: number;
  name: string;
  _count: { members: number };
}

export default function FamiliesPage() {
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [mergeTarget, setMergeTarget] = useState<number | null>(null);
  const [showMerge, setShowMerge] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = () => {
    fetch("/api/families")
      .then((r) => r.json())
      .then((data) => { setFamilies(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await fetch("/api/families", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    setNewName("");
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar esta familia? Los miembros quedarán sin familia.")) return;
    setBusy(true);
    await fetch(`/api/families?id=${id}`, { method: "DELETE" });
    setBusy(false);
    load();
  };

  const handleRename = async (id: number) => {
    if (!editName.trim()) return;
    setBusy(true);
    await fetch("/api/families", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name: editName.trim() }),
    });
    setEditingId(null);
    setEditName("");
    setBusy(false);
    load();
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`¿Eliminar ${selected.size} familia(s)? Los miembros quedarán sin familia.`)) return;
    setBusy(true);
    await fetch("/api/families", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "bulkDelete", ids: Array.from(selected) }),
    });
    setSelected(new Set());
    setBusy(false);
    load();
  };

  const handleMerge = async () => {
    if (!mergeTarget || selected.size === 0) return;
    const sourceIds = Array.from(selected).filter((id) => id !== mergeTarget);
    if (sourceIds.length === 0) return;
    setBusy(true);
    await fetch("/api/families", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "merge", targetId: mergeTarget, sourceIds }),
    });
    setSelected(new Set());
    setShowMerge(false);
    setMergeTarget(null);
    setBusy(false);
    load();
  };

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === families.length) setSelected(new Set());
    else setSelected(new Set(families.map((f) => f.id)));
  };

  return (
    <div className="pb-20 px-4 pt-4 max-w-2xl mx-auto">
      <h1 className="text-lg font-bold mb-4" style={{ color: "var(--theme-text, #111)" }}>
        🏠 Gestión de Familias
      </h1>

      {/* Add new family */}
      <form onSubmit={handleAdd} className="flex gap-2 mb-4">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nueva familia..."
          className="flex-1 border rounded-lg px-3 py-2 text-sm"
          style={{ borderColor: "var(--theme-input-border, #d1d5db)", backgroundColor: "var(--theme-input-bg, #fff)" }}
        />
        <button
          type="submit"
          className="text-white px-4 py-2 rounded-lg text-sm font-medium"
          style={{ backgroundColor: "var(--theme-primary, #4f46e5)" }}
        >
          Añadir
        </button>
      </form>

      {/* Toolbar when items selected */}
      {selected.size > 0 && (
        <div className="flex flex-wrap gap-2 mb-3 p-3 rounded-lg border" style={{ backgroundColor: "var(--theme-primary-light, #eef2ff)", borderColor: "var(--theme-primary, #4f46e5)" }}>
          <span className="text-sm font-medium" style={{ color: "var(--theme-primary, #4f46e5)" }}>
            {selected.size} seleccionada(s)
          </span>
          <div className="flex gap-2 ml-auto">
            <button
              onClick={() => { setShowMerge(true); setMergeTarget(null); }}
              disabled={selected.size < 2}
              className="px-3 py-1 rounded text-xs font-medium bg-amber-100 text-amber-800 disabled:opacity-40"
            >
              🔗 Fusionar
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={busy}
              className="px-3 py-1 rounded text-xs font-medium bg-red-100 text-red-700"
            >
              🗑️ Eliminar
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="px-3 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600"
            >
              ✕ Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Merge dialog */}
      {showMerge && (
        <div className="mb-4 p-4 rounded-lg border border-amber-300 bg-amber-50">
          <p className="text-sm font-medium text-amber-900 mb-2">
            Selecciona la familia destino (las demás se fusionarán en esta):
          </p>
          <div className="space-y-1 mb-3 max-h-40 overflow-y-auto">
            {families.filter((f) => selected.has(f.id)).map((f) => (
              <label key={f.id} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="mergeTarget"
                  checked={mergeTarget === f.id}
                  onChange={() => setMergeTarget(f.id)}
                />
                <span className="text-amber-900">{f.name} ({f._count.members} miembros)</span>
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleMerge}
              disabled={!mergeTarget || busy}
              className="px-3 py-1.5 rounded text-xs font-medium bg-amber-600 text-white disabled:opacity-40"
            >
              Confirmar fusión
            </button>
            <button
              onClick={() => setShowMerge(false)}
              className="px-3 py-1.5 rounded text-xs font-medium bg-gray-200 text-gray-700"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : (
        <>
          {/* Select all */}
          {families.length > 0 && (
            <button
              onClick={selectAll}
              className="text-xs mb-2 underline"
              style={{ color: "var(--theme-text-muted, #6b7280)" }}
            >
              {selected.size === families.length ? "Deseleccionar todo" : "Seleccionar todo"}
            </button>
          )}

          <div className="space-y-2">
            {families.map((f) => (
              <div
                key={f.id}
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${selected.has(f.id) ? "border-indigo-300 bg-indigo-50" : ""}`}
                style={!selected.has(f.id) ? { borderColor: "var(--theme-input-border, #e5e7eb)", backgroundColor: "var(--theme-card-bg, #fff)" } : {}}
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={selected.has(f.id)}
                  onChange={() => toggleSelect(f.id)}
                  className="w-4 h-4 rounded border-gray-300"
                />

                {/* Name (editable) */}
                <div className="flex-1 min-w-0">
                  {editingId === f.id ? (
                    <div className="flex gap-1">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleRename(f.id); if (e.key === "Escape") setEditingId(null); }}
                        autoFocus
                        className="flex-1 border rounded px-2 py-1 text-sm"
                        style={{ borderColor: "var(--theme-input-border, #d1d5db)" }}
                      />
                      <button onClick={() => handleRename(f.id)} className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">✓</button>
                      <button onClick={() => setEditingId(null)} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">✕</button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium truncate" style={{ color: "var(--theme-text, #111)" }}>{f.name}</p>
                      <p className="text-xs" style={{ color: "var(--theme-text-muted, #6b7280)" }}>
                        {f._count.members} {f._count.members === 1 ? "miembro" : "miembros"}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {editingId !== f.id && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setEditingId(f.id); setEditName(f.name); }}
                      className="text-xs px-2 py-1 rounded hover:bg-gray-100"
                      title="Renombrar"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(f.id)}
                      disabled={busy}
                      className="text-xs px-2 py-1 rounded hover:bg-red-50 text-red-500"
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            ))}
            {families.length === 0 && (
              <p className="text-center text-sm py-4" style={{ color: "var(--theme-text-muted, #6b7280)" }}>
                No hay familias registradas.
              </p>
            )}
          </div>
        </>
      )}

      <p className="mt-4 text-xs" style={{ color: "var(--theme-text-muted, #9ca3af)" }}>
        💡 Selecciona 2+ familias para fusionarlas. Al eliminar, los miembros quedan sin familia.
      </p>
    </div>
  );
}
