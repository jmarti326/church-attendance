"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type ThemeName = "rosa" | "lavanda" | "menta" | "melocoton" | "default" | "oscuro";

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
  pageBg: string;
  cardBg: string;
  textColor: string;
  textMuted: string;
  inputBg: string;
  inputBorder: string;
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
    pageBg: "rgb(249, 250, 251)",
    cardBg: "rgb(255, 255, 255)",
    textColor: "rgb(17, 24, 39)",
    textMuted: "rgb(107, 114, 128)",
    inputBg: "rgb(255, 255, 255)",
    inputBorder: "rgb(209, 213, 219)",
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
    pageBg: "rgb(249, 250, 251)",
    cardBg: "rgb(255, 255, 255)",
    textColor: "rgb(17, 24, 39)",
    textMuted: "rgb(107, 114, 128)",
    inputBg: "rgb(255, 255, 255)",
    inputBorder: "rgb(209, 213, 219)",
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
    pageBg: "rgb(249, 250, 251)",
    cardBg: "rgb(255, 255, 255)",
    textColor: "rgb(17, 24, 39)",
    textMuted: "rgb(107, 114, 128)",
    inputBg: "rgb(255, 255, 255)",
    inputBorder: "rgb(209, 213, 219)",
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
    pageBg: "rgb(249, 250, 251)",
    cardBg: "rgb(255, 255, 255)",
    textColor: "rgb(17, 24, 39)",
    textMuted: "rgb(107, 114, 128)",
    inputBg: "rgb(255, 255, 255)",
    inputBorder: "rgb(209, 213, 219)",
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
    pageBg: "rgb(249, 250, 251)",
    cardBg: "rgb(255, 255, 255)",
    textColor: "rgb(17, 24, 39)",
    textMuted: "rgb(107, 114, 128)",
    inputBg: "rgb(255, 255, 255)",
    inputBorder: "rgb(209, 213, 219)",
  },
  oscuro: {
    name: "oscuro",
    label: "Oscuro",
    emoji: "🌙",
    primary: "rgb(129, 140, 248)",
    primaryHover: "rgb(165, 180, 252)",
    primaryLight: "rgb(30, 27, 75)",
    primaryBorder: "rgb(67, 56, 202)",
    accent: "rgb(139, 92, 246)",
    navBg: "rgb(17, 24, 39)",
    navBorder: "rgb(55, 65, 81)",
    headerBg: "rgb(17, 24, 39)",
    presentBg: "rgb(6, 78, 59)",
    presentBorder: "rgb(5, 150, 105)",
    checkColor: "rgb(52, 211, 153)",
    buttonGradient: "linear-gradient(135deg, rgb(139, 92, 246), rgb(99, 102, 241))",
    themeColor: "#1f2937",
    pageBg: "rgb(3, 7, 18)",
    cardBg: "rgb(17, 24, 39)",
    textColor: "rgb(243, 244, 246)",
    textMuted: "rgb(156, 163, 175)",
    inputBg: "rgb(31, 41, 55)",
    inputBorder: "rgb(75, 85, 99)",
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
    root.style.setProperty("--theme-page-bg", theme.pageBg);
    root.style.setProperty("--theme-card-bg", theme.cardBg);
    root.style.setProperty("--theme-text", theme.textColor);
    root.style.setProperty("--theme-text-muted", theme.textMuted);
    root.style.setProperty("--theme-input-bg", theme.inputBg);
    root.style.setProperty("--theme-input-border", theme.inputBorder);
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
