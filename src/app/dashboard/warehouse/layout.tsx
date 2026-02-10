"use client";

import RoleGuard from "@/components/auth/RoleGuard";
import React from "react";

export default function WarehouseLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        // Passing children as a prop explicitly to avoid TypeScript error without definitions
        <RoleGuard
            allowedRoles={["SUPERADMIN", "ADMIN", "WAREHOUSE"]}
            children={
                <div className="flex flex-col gap-6">
                    <header className="flex items-center justify-between border-b border-border pb-4">
                        <h1 className="text-2xl font-bold text-foreground tracking-tight">Almacén y Entregas</h1>
                    </header>
                    {children}
                </div>
            }
        />
    );
}
