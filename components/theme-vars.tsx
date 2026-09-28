"use client";

import { useEffect } from "react";
import { hexToPrimaryHsl } from "@/lib/color";

export function ThemeVars({ primaryColor }: { primaryColor: string }) {
  useEffect(() => {
    const hsl = hexToPrimaryHsl(primaryColor);
    const root = document.documentElement;
    root.style.setProperty("--color-primary", primaryColor);
    root.style.setProperty("--primary", hsl);
    root.style.setProperty("--ring", hsl);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", primaryColor);
  }, [primaryColor]);

  return null;
}
