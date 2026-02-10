"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { Loader2 } from "lucide-react";

type UserRole = "SUPERADMIN" | "ADMIN" | "SALES" | "WAREHOUSE" | "FINANCE";

interface RoleGuardProps {
    children: React.ReactNode;
    allowedRoles: UserRole[];
}

export default function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
    const { user, role, isLoading } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                router.push("/");
            } else if (role && !allowedRoles.includes(role as UserRole)) {
                // Redirect to their default dashboard or show unauthorized
                // For now, redirect to root dashboard which should be safe or handle routing
                router.push("/dashboard/unauthorized");
            }
        }
    }, [user, role, isLoading, allowedRoles, router]);

    if (isLoading) {
        return (
            <div className="flex w-full h-full items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
        );
    }

    if (!user || (role && !allowedRoles.includes(role as UserRole))) {
        return null;
    }

    return <>{children}</>;
}
