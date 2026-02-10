"use client";

import { ThemeProvider } from "next-themes";

export default function ThemeWrapper({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem themes={["light", "dark", "theme-hub"]}>
            {children}
        </ThemeProvider>
    );
}
