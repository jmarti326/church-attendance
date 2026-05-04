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
  const [deleting, setDeleting] = useState<number | null>(null);

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
    setDeleting(id);
    await fetch(`/api/families?id=${id}`, { method: "DELETE" });
    setDeleting(null);
    load();
  };

  return (
    <div className="pb-20 px-4 pt-4">
      <h1 className="text-lg font-bold text-gray-900 mb-4">🏠 Familias</h1>

      <form onSubmit={handleAdd} className="flex gap-2 mb-4">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nueva familia..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          Añadir
        </button>
      </form>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : (
        <div className="space-y-2">
          {families.map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-between bg-white rounded-lg border border-gray-100 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{f.name}</p>
                <p className="text-xs text-gray-500">
                  {f._count.members} {f._count.members === 1 ? "miembro" : "miembros"}
                </p>
              </div>
              <button
                onClick={() => handleDelete(f.id)}
                disabled={deleting === f.id}
                className="text-red-500 hover:text-red-700 text-sm font-medium disabled:opacity-50"
              >
                {deleting === f.id ? "..." : "🗑️ Eliminar"}
              </button>
            </div>
          ))}
          {families.length === 0 && (
            <p className="text-center text-sm text-gray-500 py-4">No hay familias registradas.</p>
          )}
        </div>
      )}

      <p className="mt-4 text-xs text-gray-400">
        Al eliminar una familia, sus miembros quedarán sin familia asignada.
      </p>
    </div>
  );
}
