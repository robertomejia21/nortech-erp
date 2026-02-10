"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, query, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Plus, Search, Tag } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type Product = {
    id: string;
    name: string;
    sku: string;
    basePrice: number;
    unit: string;
};

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "products"), orderBy("name", "asc"));
            const querySnapshot = await getDocs(q);
            const list: Product[] = [];
            querySnapshot.forEach((doc) => {
                list.push({ id: doc.id, ...doc.data() } as Product);
            });
            setProducts(list);
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
                        Catálogo de <span className="text-primary italic">Productos</span>
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">Inventario maestro de soluciones, hardware y servicios técnicos.</p>
                </div>
                <Link
                    href="/dashboard/admin/products/new"
                    className="btn-primary flex items-center gap-2 px-8"
                >
                    <Plus className="w-5 h-5" />
                    Registrar Producto
                </Link>
            </div>

            <div className="bg-card/40 backdrop-blur-xl rounded-[2rem] border border-border/50 shadow-2xl p-4">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5 transition-colors group-focus-within:text-primary" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, SKU o categoría..."
                        className="input-dark pl-12 bg-background/50 border-none"
                    />
                </div>
            </div>

            <div className="bg-card/40 backdrop-blur-xl rounded-[2.5rem] border border-border/50 shadow-2xl overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-[400px] gap-4">
                        <Tag className="w-10 h-10 animate-pulse text-primary/50" />
                        <p className="text-muted-foreground font-medium">Cargando catálogo...</p>
                    </div>
                ) : (
                    <table className="table-dark">
                        <thead>
                            <tr>
                                <th>Identificación / SKU</th>
                                <th>Nombre del Producto</th>
                                <th>Unidad de Medida</th>
                                <th className="text-right">Precio Base (Lista)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product) => (
                                <tr key={product.id} className="group cursor-pointer">
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground font-black text-[10px] group-hover:bg-primary/20 group-hover:text-primary transition-all uppercase tracking-tighter">
                                                {product.sku?.slice(0, 3) || 'SKU'}
                                            </div>
                                            <span className="font-mono text-xs font-bold text-foreground/70 uppercase group-hover:text-foreground transition-colors">
                                                {product.sku}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                                                {product.name}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Categoría General</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground bg-muted/30 px-3 py-1 rounded-full border border-border/50">
                                            {product.unit}
                                        </span>
                                    </td>
                                    <td className="text-right">
                                        <div className="flex flex-col items-end">
                                            <span className="text-sm font-black text-foreground">{formatCurrency(product.basePrice)}</span>
                                            <span className="text-[10px] text-success font-bold uppercase tracking-tighter">Pre-Tax</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {products.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="py-32 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-30">
                                            <Tag className="w-16 h-16" />
                                            <p className="text-lg font-bold">No hay productos en el catálogo</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
