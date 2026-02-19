"use client";

import SupplierForm from "@/components/forms/SupplierForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewSupplierPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard/sales/suppliers"
                    className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Nuevo Proveedor</h1>
                    <p className="text-muted-foreground">Registra un nuevo aliado industrial</p>
                </div>
            </div>

            <SupplierForm redirectUrl="/dashboard/sales/suppliers" />
        </div>
    );
}
