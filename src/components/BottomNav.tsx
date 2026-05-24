"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "./ThemeProvider";
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

  if (pathname.startsWith("/login") || !isAuthenticated) return null;

  const visibleItems = navItems.filter((item) => !item.adminOnly || user?.role === "admin");

  return (
    <>
      {/* Desktop sidebar */}
      <nav
        className="hidden lg:flex fixed top-0 left-0 bottom-0 w-56 flex-col z-50 border-r shadow-sm"
        style={{ backgroundColor: theme.navBg, borderColor: theme.navBorder }}
      >
        <div className="px-4 py-5 border-b" style={{ borderColor: theme.navBorder }}>
          <span className="text-lg font-bold" style={{ color: theme.primary }}>⛪ Iglesia</span>
        </div>
        <div className="flex-1 flex flex-col gap-1 px-3 py-4">
          {visibleItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
                style={{
                  backgroundColor: isActive ? theme.primaryLight : "transparent",
                  color: isActive ? theme.primary : "#4b5563",
                }}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile bottom nav */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 safe-area-bottom z-50"
        style={{ backgroundColor: theme.navBg, borderTop: `1px solid ${theme.navBorder}` }}
      >
        <div className="flex justify-around items-center h-16">
          {visibleItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center flex-1 h-full min-w-0 px-1"
                style={{ color: isActive ? theme.primary : "#6b7280" }}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-[10px] sm:text-xs mt-0.5 font-medium truncate max-w-full">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
