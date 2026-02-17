"use client";

import { useEffect, useState } from "react";
import { collection, query, getDocs, orderBy, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthStore } from "@/store/useAuthStore";
import {
    Plus, Search, Package, Truck, Trash2, Edit2, Loader2, X, Check,
    History, TrendingUp, TrendingDown
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

type Supplier = { id: string; name: string };
type Product = {
    id: string;
    name: string;
    sku: string;
    basePrice: number;
    supplierId: string;
    supplierName?: string;
    description?: string;
    stock: number;
    minStock: number;
    maxStock: number;
    leadTime: string;
    isExternal: boolean;
    priceHistory?: { price: number; date: string; changedBy?: string }[];
};

export default function ProductsPage() {
    const { user } = useAuthStore();
    const [products, setProducts] = useState<Product[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [viewingHistory, setViewingHistory] = useState<Product | null>(null);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        sku: "",
        basePrice: 0,
        supplierId: "",
        description: "",
        stock: 0,
        minStock: 5,
        maxStock: 50,
        leadTime: "3-5 días",
        isExternal: false
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        // OPTIMIZATION: Load from cache first
        const productsCache = localStorage.getItem('products_cache');
        const suppliersCache = localStorage.getItem('suppliers_cache');
        let isBackground = false;

        if (productsCache && suppliersCache) {
            try {
                setProducts(JSON.parse(productsCache));
                setSuppliers(JSON.parse(suppliersCache));
                setLoading(false);
                isBackground = true;
            } catch (e) {
                console.error("Cache parse error", e);
            }
        }
        fetchData(isBackground);
    }, []);

    const fetchData = async (isBackground = false) => {
        if (!isBackground) setLoading(true);
        try {
            const [productsSnap, suppliersSnap] = await Promise.all([
                getDocs(query(collection(db, "products"), orderBy("name"))),
                getDocs(query(collection(db, "suppliers"), orderBy("name")))
            ]);

            const supplierList = suppliersSnap.docs.map(d => ({ id: d.id, name: d.data().name } as Supplier));
            setSuppliers(supplierList);
            localStorage.setItem('suppliers_cache', JSON.stringify(supplierList));

            const productList = productsSnap.docs.map(d => {
                const data = d.data();
                const supplier = supplierList.find(s => s.id === data.supplierId);
                return {
                    id: d.id,
                    ...data,
                    supplierName: supplier?.name || "Sin Proveedor"
                } as Product;
            });
            setProducts(productList);
            localStorage.setItem('products_cache', JSON.stringify(productList));
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.supplierId) return alert("Nombre y Proveedor son obligatorios");

        setIsSaving(true);
        try {
            if (editingProduct) {
                const hasPriceChanged = editingProduct.basePrice !== formData.basePrice;
                const updateData: any = {
                    ...formData,
                    updatedAt: serverTimestamp()
                };

                if (hasPriceChanged) {
                    const historyEntry = {
                        price: formData.basePrice,
                        date: new Date().toISOString(),
                        changedBy: user?.uid || "SYSTEM"
                    };
                    updateData.priceHistory = [...(editingProduct.priceHistory || []), historyEntry];
                }

                await updateDoc(doc(db, "products", editingProduct.id), updateData);
            } else {
                const initialHistory = [{
                    price: formData.basePrice,
                    date: new Date().toISOString(),
                    changedBy: user?.uid || "SYSTEM"
                }];

                await addDoc(collection(db, "products"), {
                    ...formData,
                    priceHistory: initialHistory,
                    createdAt: serverTimestamp(),
                    createdBy: user?.uid
                });
            }
            await fetchData();
            setIsModalOpen(false);
            setEditingProduct(null);
            setFormData({
                name: "", sku: "", basePrice: 0, supplierId: "", description: "",
                stock: 0, minStock: 5, maxStock: 50, leadTime: "3-5 días", isExternal: false
            });
        } catch (error) {
            console.error("Error saving product:", error);
            alert("Error al guardar el producto");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar este producto?")) return;
        try {
            await deleteDoc(doc(db, "products", id));
            setProducts(products.filter(p => p.id !== id));
        } catch (error) {
            console.error("Error deleting product:", error);
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.supplierName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-foreground font-display">Catálogo de Productos</h1>
                    <p className="text-muted-foreground mt-1">Gestiona los artículos por proveedor y rastrea cambios de precio</p>
                </div>
                <button
                    onClick={() => {
                        setEditingProduct(null);
                        setFormData({
                            name: "", sku: "", basePrice: 0, supplierId: "", description: "",
                            stock: 0, minStock: 5, maxStock: 50, leadTime: "3-5 días", isExternal: false
                        });
                        setIsModalOpen(true);
                    }}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Nuevo Producto
                </button>
            </div>

            {/* Filters */}
            <div className="card-premium p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, SKU o proveedor..."
                        className="input-dark pl-10 w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map((product) => (
                    <div key={product.id} className="card-premium p-5 hover:border-primary/50 transition-all group relative overflow-hidden">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Package className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => {
                                        setViewingHistory(product);
                                        setIsHistoryOpen(true);
                                    }}
                                    className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-blue-500"
                                    title="Ver Historial"
                                >
                                    <History className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => {
                                        setEditingProduct(product);
                                        setFormData({
                                            name: product.name,
                                            sku: product.sku,
                                            basePrice: product.basePrice,
                                            supplierId: product.supplierId,
                                            description: product.description || "",
                                            stock: product.stock || 0,
                                            minStock: product.minStock || 5,
                                            maxStock: product.maxStock || 50,
                                            leadTime: product.leadTime || "3-5 días",
                                            isExternal: product.isExternal || false
                                        });
                                        setIsModalOpen(true);
                                    }}
                                    className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-primary"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(product.id)}
                                    className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-destructive"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="mb-4">
                            <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                {product.name}
                            </h3>
                            <p className="text-xs font-mono text-muted-foreground uppercase">{product.sku || "Sin SKU"}</p>
                        </div>

                        <div className="space-y-2 text-xs border-t border-border pt-4">
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground flex items-center gap-1"><Truck className="w-3 h-3" /> Proveedor:</span>
                                <span className="text-foreground font-medium truncate max-w-[150px]">{product.supplierName}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Costo Base:</span>
                                <span className="text-lg font-black text-foreground">{formatCurrency(product.basePrice)}</span>
                            </div>
                        </div>
                    </div>
                ))}

                {filteredProducts.length === 0 && !loading && (
                    <div className="col-span-full py-20 text-center card-premium border-dashed bg-transparent">
                        <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-20" />
                        <p className="text-muted-foreground font-medium">No se encontraron productos.</p>
                    </div>
                )}
            </div>

            {loading && (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            )}

            {/* Modal Form */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold font-display">
                                {editingProduct ? "Editar Producto" : "Nuevo Producto"}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
                                <X className="w-5 h-5 text-muted-foreground" />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Nombre del Producto *</label>
                                <input required className="input-dark w-full" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">SKU</label>
                                    <input className="input-dark w-full" value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Costo Base *</label>
                                    <input required type="number" step="0.01" className="input-dark w-full" value={formData.basePrice} onChange={e => setFormData({ ...formData, basePrice: Number(e.target.value) })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Stock</label>
                                    <input type="number" className="input-dark w-full" value={formData.stock} onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Mínimo</label>
                                    <input type="number" className="input-dark w-full border-red-500/20" value={formData.minStock} onChange={e => setFormData({ ...formData, minStock: Number(e.target.value) })} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Máximo</label>
                                    <input type="number" className="input-dark w-full border-blue-500/20" value={formData.maxStock} onChange={e => setFormData({ ...formData, maxStock: Number(e.target.value) })} />
                                </div>
                            </div>
                            <div className="flex items-center gap-2 py-2">
                                <input
                                    type="checkbox"
                                    id="isExternal"
                                    className="w-4 h-4 rounded border-border bg-card text-primary pt-0.5"
                                    checked={formData.isExternal}
                                    onChange={e => setFormData({ ...formData, isExternal: e.target.checked })}
                                />
                                <label htmlFor="isExternal" className="text-sm font-medium text-foreground">¿Es producto externo/bajo pedido?</label>
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Proveedor *</label>
                                <select required className="input-dark w-full" value={formData.supplierId} onChange={e => setFormData({ ...formData, supplierId: e.target.value })}>
                                    <option value="">Seleccionar proveedor...</option>
                                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 btn-ghost py-3">Cancelar</button>
                                <button type="submit" disabled={isSaving} className="flex-1 btn-primary py-3">
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar Producto"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {isHistoryOpen && viewingHistory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-2xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-xl font-bold">Historial de Precios</h2>
                                <p className="text-xs text-muted-foreground">{viewingHistory.name}</p>
                            </div>
                            <button onClick={() => setIsHistoryOpen(false)} className="p-2 hover:bg-muted rounded-full">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                            {(viewingHistory.priceHistory || []).slice().reverse().map((entry, idx, arr) => {
                                const nextEntry = arr[idx + 1];
                                const isIncrease = nextEntry ? entry.price > nextEntry.price : false;
                                const isDecrease = nextEntry ? entry.price < nextEntry.price : false;
                                return (
                                    <div key={idx} className="relative pl-8 pb-4 border-l-2 border-border ml-2">
                                        <div className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 bg-card ${isIncrease ? 'border-emerald-500' : isDecrease ? 'border-red-500' : 'border-border'}`} />
                                        <div className="bg-muted/10 border border-border/50 rounded-xl p-4">
                                            <div className="flex justify-between items-start">
                                                <span className="text-lg font-black font-mono">{formatCurrency(entry.price)}</span>
                                                <span className="text-[10px] text-muted-foreground font-bold uppercase">{formatDate(new Date(entry.date))}</span>
                                            </div>
                                            {nextEntry && (
                                                <p className={`text-[10px] font-bold mt-1 ${isIncrease ? 'text-emerald-500' : 'text-red-500'}`}>
                                                    {isIncrease ? '▲' : '▼'} {Math.abs(((entry.price - nextEntry.price) / nextEntry.price) * 100).toFixed(1)}%
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <button onClick={() => setIsHistoryOpen(false)} className="w-full btn-ghost py-3 mt-6">Cerrar</button>
                    </div>
                </div>
            )}
        </div>
    );
}
