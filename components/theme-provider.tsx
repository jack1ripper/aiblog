"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ReactNode } from "react";

// next-themes renders an inline <script> to prevent theme flicker.
// React 19 warns about script tags inside components.
// The warning is a false positive — the script runs correctly during SSR.
const origConsoleError = console.error;
console.error = (...args: unknown[]) => {
  if (args[0] && typeof args[0] === "string" && args[0].includes("Encountered a script tag")) {
    return;
  }
  origConsoleError.apply(console, args);
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </NextThemesProvider>
  );
}
