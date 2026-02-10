"use client";

import RoleGuard from "@/components/auth/RoleGuard";

export default function FinanceLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <RoleGuard allowedRoles={["SUPERADMIN", "ADMIN", "FINANCE"]}>
            <div className="flex flex-col gap-6">
                <header className="flex items-center justify-between border-b border-border pb-4">
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Finanzas y Contabilidad</h1>
                </header>
                {children}
            </div>
        </RoleGuard>
    );
}
