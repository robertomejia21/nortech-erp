import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ThemeState {
    theme: "light" | "dark" | "theme-hub";
    toggleTheme: () => void;
    setTheme: (theme: "light" | "dark" | "theme-hub") => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            theme: "dark", // Default to dark as requested previously
            toggleTheme: () =>
                set((state) => ({ theme: state.theme === "light" ? "dark" : "light" })),
            setTheme: (theme) => set({ theme }),
        }),
        {
            name: "nortech-theme",
        }
    )
);
