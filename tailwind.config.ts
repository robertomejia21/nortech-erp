import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class", "[data-theme=\"dark\"]"],
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                // Base dark theme colors
                dark: {
                    900: "#050505", // Deepest black
                    800: "#0a0a0a", // Pure black base
                    700: "#121212", // Elevated surface
                    600: "#1a1a1a", // Cards/panels
                    500: "#242424", // Hover states
                    400: "#2d2d2d", // Borders
                    300: "#3d3d3d", // Muted borders
                },
                // Premium accent colors - Mapped to Monochrome Scheme
                accent: {
                    blue: "hsl(var(--primary))",      // Mapped to Primary (Black/White)
                    cyan: "hsl(var(--muted-foreground))", // Mapped to Muted
                    purple: "hsl(var(--primary))",    // Mapped to Primary
                    emerald: "#10b981",   // Success green (Keep semantic)
                    amber: "#f59e0b",     // Warning (Keep semantic)
                    rose: "#f43f5e",      // Error/destructive (Keep semantic)
                },
                // Semantics
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                success: {
                    DEFAULT: "hsl(142.1 76.2% 36.3%)",
                    foreground: "hsl(355.7 100% 97.3%)",
                },
                warning: {
                    DEFAULT: "hsl(47.9 95.8% 53.1%)",
                    foreground: "hsl(26 83.3% 14.1%)",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                // Surface colors for dark theme
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                surface: "#0a0a0a",
                card: "hsl(var(--card))",
                border: "hsl(var(--border))",
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
            },
            fontFamily: {
                sans: ["var(--font-inter)", "system-ui", "sans-serif"],
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "glow-blue": "radial-gradient(ellipse at center, rgba(255, 255, 255, 0.1), transparent 70%)", // White glow
                "glow-purple": "radial-gradient(ellipse at center, rgba(161, 161, 170, 0.15), transparent 70%)", // Gray glow
            },
            boxShadow: {
                "glow-sm": "0 0 15px -3px rgba(255, 255, 255, 0.1)",
                "glow-md": "0 0 25px -5px rgba(255, 255, 255, 0.15)",
                "glow-lg": "0 0 40px -10px rgba(255, 255, 255, 0.2)",
                "inner-glow": "inset 0 1px 0 0 rgba(255, 255, 255, 0.05)",
            },
            animation: {
                "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                "glow": "glow 2s ease-in-out infinite alternate",
                "shimmer": "shimmer 2s linear infinite",
            },
            keyframes: {
                glow: {
                    "0%": { opacity: "0.5" },
                    "100%": { opacity: "1" },
                },
                shimmer: {
                    "0%": { backgroundPosition: "-200% 0" },
                    "100%": { backgroundPosition: "200% 0" },
                },
            },
        },
    },
    plugins: [],
};
export default config;
