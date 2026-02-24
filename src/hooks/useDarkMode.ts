import { useCallback } from "react";

export function useDarkMode() {
  const toggle = useCallback(() => {
    document.documentElement.classList.toggle("dark");
  }, []);

  const isDark = document.documentElement.classList.contains("dark");

  return { isDark, toggle };
}
