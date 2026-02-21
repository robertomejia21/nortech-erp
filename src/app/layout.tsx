import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import AuthProvider from "@/components/providers/AuthProvider";
import ThemeWrapper from "@/components/providers/ThemeWrapper";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
    title: "North Tech ERP/CRM",
    description: "Sistema de gestión integral para North Tech",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es">
            <body className={cn("min-h-screen bg-background font-sans antialiased", inter.variable)}>
                <ThemeWrapper>
                    <AuthProvider>
                        {children}
                    </AuthProvider>
                </ThemeWrapper>
            </body>
        </html>
    );
}
