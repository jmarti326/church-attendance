"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: number;
  username: string;
  name: string;
  role: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ username: "", password: "", name: "", role: "user" });
  const [error, setError] = useState("");
  const router = useRouter();

  const fetchUsers = async () => {
    const res = await fetch("/api/users");
    if (res.status === 403) {
      router.push("/attendance");
      return;
    }
    const data = await res.json();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error);
      return;
    }
    setForm({ username: "", password: "", name: "", role: "user" });
    setShowAdd(false);
    fetchUsers();
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editingId, ...form }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error);
      return;
    }
    setEditingId(null);
    setForm({ username: "", password: "", name: "", role: "user" });
    fetchUsers();
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`¿Eliminar usuario "${name}"?`)) return;
    await fetch(`/api/users?id=${id}`, { method: "DELETE" });
    fetchUsers();
  };

  const startEdit = (user: User) => {
    setEditingId(user.id);
    setForm({ username: user.username, name: user.name, role: user.role, password: "" });
    setShowAdd(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="pb-24 px-4">
      <div className="sticky top-0 bg-white z-10 border-b py-3 -mx-4 px-4 shadow-sm mb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">👤 Usuarios</h1>
          <button
            onClick={() => { setShowAdd(!showAdd); setEditingId(null); setForm({ username: "", password: "", name: "", role: "user" }); }}
            className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg"
          >
            + Nuevo
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Add/Edit form */}
      {(showAdd || editingId) && (
        <form onSubmit={editingId ? handleUpdate : handleAdd} className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            {editingId ? "Editar Usuario" : "Nuevo Usuario"}
          </h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <input
              type="text"
              placeholder="Nombre"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="col-span-2 border border-gray-300 rounded-lg px-3 py-2 text-sm"
              required
            />
            <input
              type="text"
              placeholder="Usuario"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              required
            />
            <input
              type="password"
              placeholder={editingId ? "Nueva contraseña (opcional)" : "Contraseña"}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              required={!editingId}
            />
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="user">Usuario</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg">
              {editingId ? "Actualizar" : "Crear"}
            </button>
            <button
              type="button"
              onClick={() => { setShowAdd(false); setEditingId(null); setError(""); }}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* User list */}
      <div className="space-y-2">
        {users.map((user) => (
          <div key={user.id} className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900 text-sm">{user.name}</div>
              <div className="text-xs text-gray-500">@{user.username} · {user.role}</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => startEdit(user)}
                className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-md"
              >
                ✏️
              </button>
              <button
                onClick={() => handleDelete(user.id, user.name)}
                className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded-md"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
