"use client";

import { useEffect } from "react";

function getPreferredTheme(): "dark" | "light" {
  const stored = window.localStorage.getItem("theme");
  if (stored === "dark" || stored === "light") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: "dark" | "light") {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    applyTheme(getPreferredTheme());

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const stored = window.localStorage.getItem("theme");
      if (stored === "dark" || stored === "light") return;
      applyTheme(media.matches ? "dark" : "light");
    };

    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return <>{children}</>;
}
