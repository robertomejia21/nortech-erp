"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, query, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthStore } from "@/store/useAuthStore";
import { Plus, Search, Truck, Building2 } from "lucide-react";

type Supplier = {
    id: string;
    name: string;
    contactName: string;
    email: string;
    phone: string;
    category: string;
    creditTerms: string;
};

export default function SuppliersPage() {
    const { role } = useAuthStore();
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Automatically timeout loading spinner if DB doesn't respond in 5 seconds
        const timeout = setTimeout(() => {
            if (loading) setLoading(false);
        }, 5000);

        fetchSuppliers();

        return () => clearTimeout(timeout);
    }, []);

    const fetchSuppliers = async () => {
        setLoading(true);
        setError(null);
        try {
            const q = query(collection(db, "suppliers"), orderBy("name", "asc"));
            const querySnapshot = await getDocs(q);
            const list: Supplier[] = [];
            querySnapshot.forEach((doc) => {
                list.push({ id: doc.id, ...doc.data() } as Supplier);
            });
            setSuppliers(list);
        } catch (error) {
            console.error("Error fetching suppliers:", error);
            setError("No se pudieron cargar los proveedores. Intenta recargar la página.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Proveedores</h1>
                    <p className="text-muted-foreground mt-1">Gestiona tu red de aliados estratégicos</p>
                </div>
                <Link
                    href="/dashboard/sales/suppliers/new"
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Nuevo Proveedor
                </Link>
            </div>

            <div className="card-premium p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, categoría o contacto..."
                        className="input-dark pl-10 w-full"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {suppliers.map((supplier) => (
                    <div key={supplier.id} className="card-premium p-5 hover:border-accent-blue/50 transition-colors group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 rounded-lg bg-accent-blue/10">
                                <Building2 className="w-5 h-5 text-accent-blue" />
                            </div>
                            <span className="text-[10px] px-2 py-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-500/30">
                                {supplier.category || "GENERAL"}
                            </span>
                        </div>

                        <h3 className="font-bold text-lg text-foreground mb-1 group-hover:text-accent-blue transition-colors">
                            {supplier.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Contacto: <span className="text-foreground">{supplier.contactName || "No asignado"}</span>
                        </p>

                        <div className="space-y-2 text-xs border-t border-dark-400 pt-4">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Crédito:</span>
                                <span className="text-foreground font-medium">{supplier.creditTerms || "Contado"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Email:</span>
                                <span className="text-foreground truncate ml-2">{supplier.email || "N/A"}</span>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-dark-400 flex justify-end">
                            <Link
                                href={`/dashboard/sales/suppliers/${supplier.id}`}
                                className="text-xs font-semibold text-accent-blue hover:underline"
                            >
                                Ver Detalles
                            </Link>
                        </div>
                    </div>
                ))}

                {error && !loading && (
                    <div className="col-span-full py-16 text-center card-premium border-dashed border-red-500/20 bg-red-500/5">
                        <p className="text-red-400">{error}</p>
                    </div>
                )}

                {suppliers.length === 0 && !loading && !error && (
                    <div className="col-span-full py-16 text-center card-premium border-dashed bg-transparent">
                        <Truck className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-20" />
                        <p className="text-muted-foreground">No hay proveedores registrados aún.</p>
                        <Link href="/dashboard/sales/suppliers/new" className="text-accent-blue hover:underline text-sm mt-2 inline-block">
                            Registrar primer proveedor
                        </Link>
                    </div>
                )}

                {loading && (
                    <div className="col-span-full py-16 text-center">
                        <div className="animate-spin w-8 h-8 border-2 border-accent-blue border-t-transparent rounded-full mx-auto" />
                        <p className="text-muted-foreground mt-4 text-sm animate-pulse">Cargando proveedores...</p>
                    </div>
                )}
            </div>
        </div>
    );
}
