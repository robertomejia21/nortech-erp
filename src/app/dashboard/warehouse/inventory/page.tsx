"use client";

import { useEffect, useState } from "react";
import { collection, query, getDocs, orderBy, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
    Package, Search, Save, AlertTriangle, CheckCircle2,
    ArrowUpDown, Loader2, Info, ExternalLink, Truck
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type Product = {
    id: string;
    name: string;
    sku: string;
    stock: number;
    minStock: number;
    maxStock: number;
    isExternal: boolean;
    leadTime: string;
    supplierName?: string;
};

export default function WarehouseInventoryPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [savingId, setSavingId] = useState<string | null>(null);
    const [successId, setSuccessId] = useState<string | null>(null);

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "products"), orderBy("name"));
            const snap = await getDocs(q);
            const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
            setProducts(list);
        } catch (error) {
            console.error("Error fetching inventory:", error);
        } finally {
            setLoading(false);
        }
    };

    const updateField = async (id: string, field: string, value: number) => {
        setSavingId(`${id}-${field}`);
        try {
            await updateDoc(doc(db, "products", id), {
                [field]: value,
                updatedAt: serverTimestamp()
            });
            setProducts(products.map(p => p.id === id ? { ...p, [field]: value } : p));
            setSuccessId(`${id}-${field}`);
            setTimeout(() => setSuccessId(null), 2000);
        } catch (error) {
            console.error(`Error updating ${field}:`, error);
            alert("Error al actualizar campo");
        } finally {
            setSavingId(null);
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight">Control de <span className="text-primary italic">Existencias</span></h1>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">Gestión directa de inventario físico y tiempos de respuesta logística.</p>
                </div>
                <div className="flex items-center gap-4 bg-card/40 p-2 rounded-2xl border border-border/50">
                    <div className="flex items-center gap-2 px-4 border-r border-border">
                        <span className="text-emerald-500 font-black text-xl">{products.filter(p => !p.isExternal).length}</span>
                        <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Locales</span>
                    </div>
                    <div className="flex items-center gap-2 px-4">
                        <span className="text-amber-500 font-black text-xl">{products.filter(p => p.isExternal).length}</span>
                        <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Bajo Pedido</span>
                    </div>
                </div>
            </div>

            <div className="card-premium p-4 flex items-center gap-4 bg-card/60">
                <Search className="w-5 h-5 text-muted-foreground focus-within:text-primary transition-colors" />
                <input
                    type="text"
                    placeholder="Filtrar por nombre o SKU..."
                    className="bg-transparent border-none text-foreground placeholder:text-muted-foreground focus:ring-0 w-full font-medium"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="card-premium overflow-hidden border-border/50 shadow-2xl">
                <table className="table-dark w-full">
                    <thead>
                        <tr>
                            <th className="pl-8 py-5 text-left">Producto</th>
                            <th className="text-left">SKU</th>
                            <th className="text-center w-32">Min</th>
                            <th className="text-center w-32">Max</th>
                            <th className="text-center w-40">Stock Físico</th>
                            <th className="text-center">Estado</th>
                            <th className="text-right pr-8">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                        {filteredProducts.map((product) => (
                            <tr key={product.id} className="group hover:bg-primary/5 transition-all">
                                <td className="pl-8 py-6">
                                    <div>
                                        <p className="font-bold text-foreground group-hover:text-primary transition-colors">{product.name}</p>
                                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-0.5">{product.supplierName || "Proveedor General"}</p>
                                    </div>
                                </td>
                                <td>
                                    <span className="font-mono text-[10px] font-black tracking-widest bg-muted px-3 py-1 rounded-lg border border-border/50 text-muted-foreground">
                                        {product.sku || "N/A"}
                                    </span>
                                </td>
                                <td className="text-center">
                                    <input
                                        type="number"
                                        className="w-16 bg-background/30 border-red-500/20 rounded-lg text-center font-bold text-sm focus:border-red-500/50 focus:ring-0"
                                        defaultValue={product.minStock || 0}
                                        onBlur={(e) => {
                                            const val = Number(e.target.value);
                                            if (val !== product.minStock) updateField(product.id, 'minStock', val);
                                        }}
                                    />
                                </td>
                                <td className="text-center">
                                    <input
                                        type="number"
                                        className="w-16 bg-background/30 border-blue-500/20 rounded-lg text-center font-bold text-sm focus:border-blue-500/50 focus:ring-0"
                                        defaultValue={product.maxStock || 0}
                                        onBlur={(e) => {
                                            const val = Number(e.target.value);
                                            if (val !== product.maxStock) updateField(product.id, 'maxStock', val);
                                        }}
                                    />
                                </td>
                                <td className="text-center">
                                    {product.isExternal ? (
                                        <div className="flex flex-col items-center">
                                            <span className="text-[10px] text-amber-500 font-black uppercase tracking-widest leading-none">PEDIDO</span>
                                            <span className="text-xs font-bold text-foreground">{product.leadTime || "3-5d"}</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center gap-2">
                                            <input
                                                type="number"
                                                className={`w-20 bg-background/50 border-border/50 rounded-xl text-center font-black text-lg focus:border-primary/50 transition-all ${product.stock <= product.minStock ? 'text-red-500 border-red-500/30 ring-1 ring-red-500/20' : 'text-foreground'}`}
                                                defaultValue={product.stock || 0}
                                                onBlur={(e) => {
                                                    const val = Number(e.target.value);
                                                    if (val !== product.stock) updateField(product.id, 'stock', val);
                                                }}
                                            />
                                        </div>
                                    )}
                                </td>
                                <td className="text-center">
                                    <div className="flex flex-col items-center gap-1">
                                        {product.isExternal ? (
                                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-muted text-muted-foreground border border-border">Externa</span>
                                        ) : product.stock <= product.minStock ? (
                                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse">Stock Crítico</span>
                                        ) : product.stock >= product.maxStock ? (
                                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-blue-500/10 text-blue-500 border border-blue-500/20">Exceso</span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Óptimo</span>
                                        )}
                                        {savingId?.startsWith(product.id) && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
                                        {successId?.startsWith(product.id) && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                                    </div>
                                </td>
                                <td className="text-right pr-8">
                                    <button
                                        onClick={() => window.open(`/dashboard/sales/products`, '_blank')}
                                        className="p-3 bg-muted/20 hover:bg-primary/20 text-muted-foreground hover:text-primary rounded-xl transition-all"
                                        title="Ver Detalles del Producto"
                                    >
                                        <ExternalLink className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredProducts.length === 0 && !loading && (
                    <div className="py-24 text-center">
                        <Package className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-foreground opacity-50">Sin resultados</h3>
                        <p className="text-sm text-muted-foreground">No hay productos que coincidan con tu búsqueda en el inventario.</p>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card-premium p-6 bg-blue-500/5 border-blue-500/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
                            <Info className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="font-bold text-foreground">Inventario Local</h4>
                            <p className="text-xs text-muted-foreground">Productos físicamente en bodega. Actualización inmediata de existencia.</p>
                        </div>
                    </div>
                </div>
                <div className="card-premium p-6 bg-amber-500/5 border-amber-500/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500">
                            <Truck className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="font-bold text-foreground">Bajo Pedido</h4>
                            <p className="text-xs text-muted-foreground">Stock gestionado por el proveedor. El tiempo de entrega es una estimación.</p>
                        </div>
                    </div>
                </div>
                <div className="card-premium p-6 bg-red-500/5 border-red-500/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-500/10 rounded-2xl text-red-500">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="font-bold text-foreground">Alertas de Stock</h4>
                            <p className="text-xs text-muted-foreground">Los artículos con menos de 5 unidades se marcarán como críticos.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
