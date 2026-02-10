"use client";

import RoleGuard from "@/components/auth/RoleGuard";

export default function SalesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Sales people + Admins can see sales view
    return (
        <RoleGuard allowedRoles={["SUPERADMIN", "ADMIN", "SALES"]}>
            <div className="flex flex-col gap-6">
                <header className="flex items-center justify-between border-b border-border pb-4">
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Ventas y Cotizaciones</h1>
                </header>
                {children}
            </div>
        </RoleGuard>
    );
}
