"use client";

import { useTheme, themes, type ThemeName } from "./ThemeProvider";
import { useState } from "react";

export function ThemePicker() {
  const { themeName, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-8 h-8 rounded-full flex items-center justify-center text-lg shadow-sm border border-gray-200 bg-white active:scale-95 transition-transform"
        title="Cambiar tema"
      >
        🎨
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-50 bg-white rounded-xl shadow-xl border border-gray-100 p-3 w-48 animate-in fade-in slide-in-from-top-2">
            <p className="text-xs font-semibold text-gray-500 mb-2 px-1">Tema</p>
            {(Object.keys(themes) as ThemeName[]).map((key) => {
              const t = themes[key];
              const isActive = key === themeName;
              return (
                <button
                  key={key}
                  onClick={() => { setTheme(key); setOpen(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive ? "font-semibold" : "hover:bg-gray-50"
                  }`}
                  style={isActive ? { backgroundColor: t.primaryLight, color: t.primary } : {}}
                >
                  <span className="text-base">{t.emoji}</span>
                  <span>{t.label}</span>
                  {isActive && <span className="ml-auto text-xs">✓</span>}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
