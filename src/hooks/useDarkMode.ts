import { useState, useEffect, useCallback } from "react";

export function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    try {
      const saved = localStorage.getItem("libreta_theme");
      if (saved) return saved === "dark";
      // Fallback to system preference
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (isDark) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("libreta_theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("libreta_theme", "light");
      }
    } catch {}
  }, [isDark]);

  const toggleDark = useCallback(() => {
    setIsDark((prev) => !prev);
  }, []);

  return {
    isDark,
    toggleDark,
  };
}
