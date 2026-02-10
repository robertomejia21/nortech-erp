"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, query, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Plus, Search, Truck } from "lucide-react";

type Supplier = {
    id: string;
    name: string;
    email: string;
    contactName: string;
    creditTerms: string;
};

export default function SuppliersPage() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        setLoading(true);
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
        } finally {
            setLoading(false);
        }
    };

    const filteredSuppliers = suppliers.filter(s =>
        (s.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.contactName || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight">Directorio de <span className="text-primary italic">Proveedores</span></h1>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">Gestiona las alianzas estratégicas y condiciones comerciales con fabricantes.</p>
                </div>
                <Link
                    href="/dashboard/admin/suppliers/new"
                    className="btn-primary flex items-center gap-2 px-8"
                >
                    <Plus className="w-5 h-5" />
                    Nueva Alianza
                </Link>
            </div>

            <div className="bg-card/40 backdrop-blur-xl rounded-[2rem] border border-border/50 shadow-2xl p-4">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5 transition-colors group-focus-within:text-primary" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre de empresa o contacto..."
                        className="input-dark pl-12 bg-background/50 border-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSuppliers.map((supplier) => (
                    <div key={supplier.id} className="card-premium p-8 group relative overflow-hidden">
                        {/* Decorative background element */}
                        <div className="absolute -right-16 -top-16 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none transition-transform group-hover:scale-150 duration-700" />

                        <div className="relative">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner group-hover:bg-primary group-hover:text-white transition-all">
                                    <Truck className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="font-black text-foreground text-lg group-hover:text-primary transition-colors truncate max-w-[180px]">{supplier.name}</h3>
                                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest leading-none mt-1">
                                        {supplier.contactName || "Sin Responsable"}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-border/50">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Contacto Directo</span>
                                    <p className="text-sm font-bold text-foreground truncate">{supplier.email || "contacto@nortech.com"}</p>
                                </div>
                                <div className="flex justify-between items-center bg-muted/30 p-3 rounded-xl border border-border/50">
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Crédito</span>
                                    <span className="text-xs font-black text-primary px-3 py-1 bg-primary/10 rounded-lg border border-primary/20">{supplier.creditTerms || 'Contado'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <Link
                                href={`/dashboard/sales/suppliers/${supplier.id}`}
                                className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline transition-all"
                            >
                                Gestionar Proveedor →
                            </Link>
                        </div>
                    </div>
                ))}

                {filteredSuppliers.length === 0 && !loading && (
                    <div className="col-span-full py-24 text-center rounded-[3rem] border-4 border-dashed border-border/30 bg-muted/5">
                        <div className="w-20 h-20 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Truck className="w-10 h-10 text-muted-foreground/30" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground">No se encontraron resultados</h3>
                        <p className="text-muted-foreground mt-2 max-w-xs mx-auto">Prueba con otro término de búsqueda o registra un nuevo proveedor.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
