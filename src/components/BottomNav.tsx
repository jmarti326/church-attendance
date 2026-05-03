"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "./ThemeProvider";
import { ThemePicker } from "./ThemePicker";

const navItems = [
  { href: "/attendance", label: "Asistencia", icon: "📋" },
  { href: "/members", label: "Miembros", icon: "👥" },
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
];

export function BottomNav() {
  const pathname = usePathname();
  const { theme } = useTheme();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 safe-area-bottom z-50"
      style={{ backgroundColor: theme.navBg, borderTop: `1px solid ${theme.navBorder}` }}
    >
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
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
