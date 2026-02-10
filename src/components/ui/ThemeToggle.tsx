"use client";

import { Sun, Moon, Palette } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export default function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Only render the component on the client to avoid hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="w-10 h-10 rounded-lg bg-muted animate-pulse" />
        );
    }

    const toggleTheme = () => {
        if (theme === "light") setTheme("dark");
        else if (theme === "dark") setTheme("theme-hub");
        else setTheme("light");
    };

    return (
        <button
            onClick={toggleTheme}
            className="p-2 mr-2 rounded-lg bg-muted hover:bg-muted-foreground/10 text-muted-foreground hover:text-foreground transition-all duration-200 border border-border flex items-center justify-center gap-2"
            title="Cambiar Estilo Visual"
        >
            {theme === "light" && <Sun className="w-5 h-5" />}
            {theme === "dark" && <Moon className="w-5 h-5" />}
            {theme === "theme-hub" && <Palette className="w-5 h-5 text-primary" />}
            <span className="text-[10px] font-bold uppercase hidden md:block">
                {theme === 'theme-hub' ? 'HUB' : theme === 'dark' ? 'DARK' : 'LIGHT'}
            </span>
        </button>
    );
}
