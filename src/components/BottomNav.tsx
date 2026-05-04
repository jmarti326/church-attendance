"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "./ThemeProvider";
import { ThemePicker } from "./ThemePicker";
import { useAuth } from "./AuthGuard";

const navItems = [
  { href: "/attendance", label: "Asistencia", icon: "📋", adminOnly: false },
  { href: "/members", label: "Miembros", icon: "👥", adminOnly: false },
  { href: "/dashboard", label: "Dashboard", icon: "📊", adminOnly: false },
  { href: "/admin/users", label: "Usuarios", icon: "🔑", adminOnly: true },
];

export function BottomNav() {
  const pathname = usePathname();
  const { theme } = useTheme();
  const { user, isAuthenticated } = useAuth();

  // Hide on login page and when not authenticated
  if (pathname.startsWith("/login") || !isAuthenticated) return null;

  const visibleItems = navItems.filter((item) => !item.adminOnly || user?.role === "admin");

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 safe-area-bottom z-50"
      style={{ backgroundColor: theme.navBg, borderTop: `1px solid ${theme.navBorder}` }}
    >
      <div className="flex justify-around items-center h-16 relative">
        {visibleItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center w-full h-full"
              style={{ color: isActive ? theme.primary : "#6b7280" }}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </Link>
          );
        })}

      </div>
    </nav>
  );
}
