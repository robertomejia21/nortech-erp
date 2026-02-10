"use client";

import RoleGuard from "@/components/auth/RoleGuard";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // SUPERADMIN has access to everything, ADMIN has access to this
    return (
        <RoleGuard allowedRoles={["SUPERADMIN", "ADMIN"]}>
            <div className="flex flex-col gap-6 animate-in fade-in duration-500">
                <header className="flex items-center justify-between border-b border-border pb-4">
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Panel de Administración</h1>
                </header>
                <div className="flex-1">
                    {children}
                </div>
            </div>
        </RoleGuard>
    );
}
