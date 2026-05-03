"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="w-8 h-8 rounded-full flex items-center justify-center text-lg shadow-sm border border-gray-200 bg-white active:scale-95 transition-transform"
      title="Cerrar sesión"
    >
      🚪
    </button>
  );
}
