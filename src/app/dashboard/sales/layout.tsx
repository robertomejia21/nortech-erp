"use client";

import RoleGuard from "@/components/auth/RoleGuard";

import { usePathname } from "next/navigation";

export default function SalesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    // Sales people + Admins can see sales view
    return (
        <RoleGuard allowedRoles={["SUPERADMIN", "ADMIN", "SALES"]}>
            <div className="flex flex-col gap-6">
                <header className="flex items-center justify-between border-b border-border pb-4">
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">
                        {pathname.includes("/suppliers") ? "Proveedores"
                            : pathname.includes("/clients") ? "Clientes"
                                : pathname.includes("/orders") ? "Órdenes de Venta"
                                    : "Ventas y Cotizaciones"}
                    </h1>
                </header>
                {children}
            </div>
        </RoleGuard >
    );
}
