"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type ThemeName = "rosa" | "lavanda" | "menta" | "melocoton" | "default";

export interface Theme {
  name: ThemeName;
  label: string;
  emoji: string;
  primary: string;
  primaryHover: string;
  primaryLight: string;
  primaryBorder: string;
  accent: string;
  navBg: string;
  navBorder: string;
  headerBg: string;
  presentBg: string;
  presentBorder: string;
  checkColor: string;
  buttonGradient: string;
  themeColor: string;
}

export const themes: Record<ThemeName, Theme> = {
  rosa: {
    name: "rosa",
    label: "Rosa Suave",
    emoji: "🌸",
    primary: "rgb(219, 39, 119)",
    primaryHover: "rgb(190, 24, 93)",
    primaryLight: "rgb(252, 231, 243)",
    primaryBorder: "rgb(249, 168, 212)",
    accent: "rgb(236, 72, 153)",
    navBg: "rgb(255, 255, 255)",
    navBorder: "rgb(252, 231, 243)",
    headerBg: "rgb(255, 255, 255)",
    presentBg: "rgb(252, 231, 243)",
    presentBorder: "rgb(249, 168, 212)",
    checkColor: "rgb(219, 39, 119)",
    buttonGradient: "linear-gradient(135deg, rgb(236, 72, 153), rgb(219, 39, 119))",
    themeColor: "#db2777",
  },
  lavanda: {
    name: "lavanda",
    label: "Lavanda",
    emoji: "💜",
    primary: "rgb(124, 58, 237)",
    primaryHover: "rgb(109, 40, 217)",
    primaryLight: "rgb(237, 233, 254)",
    primaryBorder: "rgb(196, 181, 253)",
    accent: "rgb(139, 92, 246)",
    navBg: "rgb(255, 255, 255)",
    navBorder: "rgb(237, 233, 254)",
    headerBg: "rgb(255, 255, 255)",
    presentBg: "rgb(237, 233, 254)",
    presentBorder: "rgb(196, 181, 253)",
    checkColor: "rgb(124, 58, 237)",
    buttonGradient: "linear-gradient(135deg, rgb(139, 92, 246), rgb(124, 58, 237))",
    themeColor: "#7c3aed",
  },
  menta: {
    name: "menta",
    label: "Menta",
    emoji: "🍃",
    primary: "rgb(13, 148, 136)",
    primaryHover: "rgb(15, 118, 110)",
    primaryLight: "rgb(204, 251, 241)",
    primaryBorder: "rgb(153, 246, 228)",
    accent: "rgb(20, 184, 166)",
    navBg: "rgb(255, 255, 255)",
    navBorder: "rgb(204, 251, 241)",
    headerBg: "rgb(255, 255, 255)",
    presentBg: "rgb(204, 251, 241)",
    presentBorder: "rgb(153, 246, 228)",
    checkColor: "rgb(13, 148, 136)",
    buttonGradient: "linear-gradient(135deg, rgb(20, 184, 166), rgb(13, 148, 136))",
    themeColor: "#0d9488",
  },
  melocoton: {
    name: "melocoton",
    label: "Melocotón",
    emoji: "🍑",
    primary: "rgb(234, 88, 12)",
    primaryHover: "rgb(194, 65, 12)",
    primaryLight: "rgb(255, 237, 213)",
    primaryBorder: "rgb(253, 186, 116)",
    accent: "rgb(249, 115, 22)",
    navBg: "rgb(255, 255, 255)",
    navBorder: "rgb(255, 237, 213)",
    headerBg: "rgb(255, 255, 255)",
    presentBg: "rgb(255, 237, 213)",
    presentBorder: "rgb(253, 186, 116)",
    checkColor: "rgb(234, 88, 12)",
    buttonGradient: "linear-gradient(135deg, rgb(249, 115, 22), rgb(234, 88, 12))",
    themeColor: "#ea580c",
  },
  default: {
    name: "default",
    label: "Índigo",
    emoji: "💎",
    primary: "rgb(79, 70, 229)",
    primaryHover: "rgb(67, 56, 202)",
    primaryLight: "rgb(238, 242, 255)",
    primaryBorder: "rgb(165, 180, 252)",
    accent: "rgb(99, 102, 241)",
    navBg: "rgb(255, 255, 255)",
    navBorder: "rgb(229, 231, 235)",
    headerBg: "rgb(255, 255, 255)",
    presentBg: "rgb(240, 253, 244)",
    presentBorder: "rgb(187, 247, 208)",
    checkColor: "rgb(34, 197, 94)",
    buttonGradient: "linear-gradient(135deg, rgb(99, 102, 241), rgb(79, 70, 229))",
    themeColor: "#4f46e5",
  },
};

interface ThemeContextType {
  theme: Theme;
  themeName: ThemeName;
  setTheme: (name: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: themes.default,
  themeName: "default",
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeName, setThemeName] = useState<ThemeName>("default");

  useEffect(() => {
    const saved = localStorage.getItem("app-theme") as ThemeName | null;
    if (saved && themes[saved]) {
      setThemeName(saved);
    }
  }, []);

  const setTheme = (name: ThemeName) => {
    setThemeName(name);
    localStorage.setItem("app-theme", name);
  };

  const theme = themes[themeName];

  // Apply CSS variables to document
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--theme-primary", theme.primary);
    root.style.setProperty("--theme-primary-hover", theme.primaryHover);
    root.style.setProperty("--theme-primary-light", theme.primaryLight);
    root.style.setProperty("--theme-primary-border", theme.primaryBorder);
    root.style.setProperty("--theme-accent", theme.accent);
    root.style.setProperty("--theme-nav-bg", theme.navBg);
    root.style.setProperty("--theme-nav-border", theme.navBorder);
    root.style.setProperty("--theme-header-bg", theme.headerBg);
    root.style.setProperty("--theme-present-bg", theme.presentBg);
    root.style.setProperty("--theme-present-border", theme.presentBorder);
    root.style.setProperty("--theme-check", theme.checkColor);
    root.style.setProperty("--theme-button-gradient", theme.buttonGradient);
    // Update meta theme-color
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme.themeColor);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, themeName, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
