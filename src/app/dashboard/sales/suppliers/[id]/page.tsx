"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ArrowLeft, Building2, Mail, Phone, CreditCard, Tag, Calendar, Package, ChevronRight, ExternalLink, Loader2, Plus, FileText } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

type Supplier = {
    id: string;
    name: string;
    contactName: string;
    email: string;
    phone: string;
    category: string;
    creditTerms: string;
    address?: string;
    notes?: string;
    createdAt?: any;
};

type Product = {
    id: string;
    name: string;
    sku: string;
    basePrice: number;
    category?: string;
    stock?: number;
    leadTime?: string;
    isExternal?: boolean;
};

export default function SupplierDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [supplier, setSupplier] = useState<Supplier | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [productsLoading, setProductsLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            fetchSupplier(params.id as string);
            fetchProducts(params.id as string);
        }
    }, [params.id]);

    const fetchSupplier = async (id: string) => {
        setLoading(true);
        try {
            const docRef = doc(db, "suppliers", id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setSupplier({ id: docSnap.id, ...docSnap.data() } as Supplier);
            } else {
                console.error("Supplier not found");
                router.push("/dashboard/sales/suppliers");
            }
        } catch (error) {
            console.error("Error fetching supplier:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async (supplierId: string) => {
        setProductsLoading(true);
        try {
            const q = query(collection(db, "products"), where("supplierId", "==", supplierId));
            const snap = await getDocs(q);
            const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
            setProducts(list);
        } catch (error) {
            console.error("Error fetching supplier products:", error);
        } finally {
            setProductsLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-xl animate-pulse rounded-full" />
                    <Package className="w-10 h-10 text-primary animate-bounce relative" />
                </div>
                <p className="text-muted-foreground font-medium animate-pulse">Obteniendo expediente del proveedor...</p>
            </div>
        );
    }

    if (!supplier) {
        return (
            <div className="text-center py-20 bg-card/50 rounded-3xl border border-dashed border-border mt-10">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Building2 className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Proveedor no encontrado</h3>
                <p className="text-muted-foreground mt-2 mb-6">El registro que buscas no existe o ha sido eliminado.</p>
                <Link href="/dashboard/sales/suppliers" className="btn-primary inline-flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" /> Volver a Proveedores
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border/50">
                <div className="space-y-4">
                    <Link
                        href="/dashboard/sales/suppliers"
                        className="group inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors"
                    >
                        <div className="p-1.5 rounded-lg border border-border group-hover:border-primary/30 transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                        </div>
                        Volver al Directorio
                    </Link>
                    <div>
                        <div className="flex items-center gap-4 mb-2">
                            <h1 className="text-5xl font-black text-foreground tracking-tighter">{supplier.name}</h1>
                            <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-black uppercase tracking-widest">
                                {supplier.category || "General"}
                            </span>
                        </div>
                        <p className="text-muted-foreground font-medium flex items-center gap-2">
                            <Building2 className="w-4 h-4 opacity-50" />
                            Asesor Comercial: <span className="text-foreground font-bold">{supplier.contactName || "Sin asignar"}</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href={`/dashboard/admin/orders/new?supplier=${supplier.id}`}
                        className="btn-primary shadow-2xl shadow-primary/20 px-8 py-4 text-base rounded-2xl"
                    >
                        Nueva Orden de Compra
                    </Link>
                </div>
            </div>

            {/* Premium Info Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card-premium p-5 flex items-center gap-4 bg-card/40 border-border/40">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-inner">
                        <Mail className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Canal Digital</p>
                        <p className="text-sm font-black text-foreground truncate">{supplier.email || "N/A"}</p>
                    </div>
                </div>
                <div className="card-premium p-5 flex items-center gap-4 bg-card/40 border-border/40">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-inner">
                        <Phone className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Línea Directa</p>
                        <p className="text-sm font-black text-foreground">{supplier.phone || "N/A"}</p>
                    </div>
                </div>
                <div className="card-premium p-5 flex items-center gap-4 bg-card/40 border-border/40">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-inner">
                        <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Términos</p>
                        <p className="text-sm font-black text-foreground">{supplier.creditTerms || "Contado"}</p>
                    </div>
                </div>
                <div className="card-premium p-5 flex items-center gap-4 bg-primary/5 border-primary/20 shadow-lg shadow-primary/5">
                    <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-inner">
                        <Package className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Inventario</p>
                        <p className="text-sm font-black text-foreground">{products.length} SKU's Vinculados</p>
                    </div>
                </div>
            </div>

            {/* Central Product & Service Catalog */}
            <div className="card-premium bg-card overflow-hidden border-primary/10 shadow-2xl rounded-3xl">
                <div className="p-8 border-b border-border flex items-center justify-between bg-muted/20">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-primary text-primary-foreground rounded-2xl shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]">
                            <Package className="w-7 h-7" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-foreground tracking-tight">Portafolio de Productos y Servicios</h2>
                            <p className="text-base text-muted-foreground font-medium">Catálogo especializado bajo control de este proveedor.</p>
                        </div>
                    </div>
                    <Link href="/dashboard/sales/products" className="btn-premium-ghost px-6">
                        Catálogo Maestro <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>

                {productsLoading ? (
                    <div className="py-32 flex flex-col items-center justify-center gap-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/30 blur-2xl animate-pulse rounded-full" />
                            <Loader2 className="w-12 h-12 animate-spin text-primary relative" />
                        </div>
                        <p className="text-xl text-muted-foreground font-black uppercase tracking-widest animate-pulse">Consultando Registros...</p>
                    </div>
                ) : products.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="table-dark w-full">
                            <thead>
                                <tr>
                                    <th className="pl-12 py-6 text-left">Descripción del Artículo / Servicio</th>
                                    <th className="text-left">Identificador (SKU)</th>
                                    <th className="text-center">Stock / Disponibilidad</th>
                                    <th className="text-center">Tiempo de Entrega</th>
                                    <th className="text-right">Precio de Lista</th>
                                    <th className="text-center pr-12">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/20">
                                {products.map((product) => (
                                    <tr key={product.id} className="group hover:bg-primary/5 transition-all duration-300">
                                        <td className="pl-12 py-8">
                                            <div className="flex items-center gap-5">
                                                <div className="w-3 h-3 rounded-full bg-primary/20 group-hover:bg-primary group-hover:scale-150 transition-all duration-500 shadow-primary/20" />
                                                <span className="text-xl font-bold text-foreground group-hover:text-primary transition-colors tracking-tight">
                                                    {product.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-8">
                                            <span className="font-mono text-sm font-black tracking-widest bg-muted/50 px-4 py-2 rounded-xl border border-border/50 text-muted-foreground group-hover:text-foreground group-hover:border-primary/30 transition-all uppercase">
                                                {product.sku || "STOCK-PEND"}
                                            </span>
                                        </td>
                                        <td className="py-8 text-center">
                                            {product.isExternal ? (
                                                <div className="inline-flex flex-col items-center">
                                                    <span className="px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full text-[10px] font-black uppercase tracking-widest mb-1">
                                                        EXTERNO / BAJO PEDIDO
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground font-medium">Validar con Asesor</span>
                                                </div>
                                            ) : (
                                                <div className="inline-flex flex-col items-center">
                                                    <span className={`text-2xl font-black tabular-nums transition-colors ${Number(product.stock) <= 5 ? 'text-red-500' : 'text-foreground'}`}>
                                                        {product.stock || 0}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">En Almacén</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-8 text-center">
                                            <div className="inline-flex flex-col items-center">
                                                <span className="text-sm font-bold text-foreground bg-muted/30 px-4 py-1.5 rounded-full border border-border">
                                                    {product.leadTime || "3-5 días"}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground font-medium mt-1">Estimado</span>
                                            </div>
                                        </td>
                                        <td className="text-right py-8">
                                            <div className="flex flex-col items-end">
                                                <span className="text-2xl font-black text-foreground tabular-nums tracking-tighter">
                                                    {formatCurrency(product.basePrice)}
                                                </span>
                                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Base MXN</span>
                                            </div>
                                        </td>
                                        <td className="text-center pr-12 py-8">
                                            <Link
                                                href="/dashboard/sales/products"
                                                className="p-4 bg-card border border-border/50 hover:bg-primary hover:text-white hover:border-primary rounded-2xl transition-all inline-block shadow-sm group-hover:shadow-lg group-hover:-translate-y-1"
                                                title="Gestionar Producto"
                                            >
                                                <ExternalLink className="w-6 h-6" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="py-40 text-center">
                        <div className="w-24 h-24 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-dashed border-border/50">
                            <Package className="w-12 h-12 text-muted-foreground/30" />
                        </div>
                        <h3 className="text-3xl font-black text-foreground">Sin Portafolio Asignado</h3>
                        <p className="text-lg text-muted-foreground mt-4 max-w-sm mx-auto leading-relaxed">
                            No se han detectado productos o servicios ligados a este proveedor en el catálogo comercial.
                        </p>
                        <Link
                            href="/dashboard/sales/products"
                            className="mt-10 btn-primary inline-flex items-center gap-3 px-10 py-4"
                        >
                            <Plus className="w-5 h-5" /> Vincular Primer Artículo
                        </Link>
                    </div>
                )}
            </div>

            {/* Strategic Notes Section */}
            {supplier.notes && (
                <div className="card-premium p-12 bg-card/30 border-border/40 backdrop-blur-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <FileText className="w-32 h-32" />
                    </div>
                    <h2 className="text-xs font-black text-muted-foreground uppercase tracking-[0.4em] mb-8 flex items-center gap-4">
                        <span className="w-10 h-px bg-primary/40" />
                        Consideraciones Estratégicas
                    </h2>
                    <p className="text-2xl text-foreground font-medium leading-relaxed italic opacity-90 max-w-4xl relative z-10">
                        "{supplier.notes}"
                    </p>
                </div>
            )}
        </div>
    );
}
