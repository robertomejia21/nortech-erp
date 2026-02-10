"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, serverTimestamp, addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthStore } from "@/store/useAuthStore";
import {
    Loader2, ArrowLeft, Download, FileText, CheckCircle2,
    Truck, Package, ShieldCheck, AlertCircle, ShoppingBag,
    Send, User, Clock
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

type Order = {
    id: string;
    quoteId: string;
    quoteFolio: string;
    clientId: string;
    clientName: string;
    items: any[];
    financials: { subtotal: number; taxRate: number; taxAmount: number; total: number; currency: string };
    clientOcFolio: string;
    clientOcUrl: string;
    status: 'PENDING' | 'APPROVED' | 'PO_SENT' | 'COMPLETED' | 'CANCELLED' | 'GOODS_RECEIVED';
    createdAt: any;
    salesRepId: string;
    internalPoId?: string;
};

export default function OrderDetailPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const { user, role } = useAuthStore();

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    useEffect(() => {
        if (id) fetchOrder();
    }, [id]);

    const fetchOrder = async () => {
        try {
            const docRef = doc(db, "orders", id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setOrder({ id: docSnap.id, ...docSnap.data() } as Order);
            }
        } catch (error) {
            console.error("Error fetching order:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!order || !user) return;

        setActionLoading(true);
        setLocalError(null);
        console.log("🚀 Iniciando aprobación de orden...", id);

        try {
            console.log("📦 Agrupando productos por proveedor para generar OCs internas...");
            const itemsBySupplier: Record<string, { name: string, items: any[] }> = {};

            (order.items || []).forEach(item => {
                const sId = item.supplierId || "UNKNOWN";
                if (!itemsBySupplier[sId]) {
                    itemsBySupplier[sId] = { name: item.supplierName || "Proveedor Desconocido", items: [] };
                }
                itemsBySupplier[sId].items.push(item);
            });

            const supplierIds = Object.keys(itemsBySupplier).filter(sid => sid !== "UNKNOWN");
            console.log(`📑 Generando ${supplierIds.length} Órdenes de Compra internas...`);

            // Generate POs for each supplier
            for (const sId of supplierIds) {
                const data = itemsBySupplier[sId];
                const poRef = await addDoc(collection(db, "orders"), {
                    type: 'PURCHASE_ORDER',
                    parentSalesOrderId: id,
                    quoteId: order.quoteId,
                    quoteFolio: order.quoteFolio,
                    supplierId: sId,
                    supplierName: data.name,
                    items: data.items,
                    status: 'PO_CREATED',
                    createdAt: serverTimestamp(),
                    createdBy: user.uid,
                    financials: {
                        subtotal: data.items.reduce((acc, item) => acc + (Number(item.basePrice || 0) * Number(item.quantity || 1)), 0),
                        currency: order.financials?.currency || "MXN"
                    }
                });
                console.log(`✅ PO Creada para ${data.name}: ${poRef.id}`);
            }

            // Update main Sales Order Status
            const orderRef = doc(db, "orders", id);
            await updateDoc(orderRef, {
                status: 'APPROVED',
                type: 'SALES_ORDER',
                approvedBy: user.uid,
                approvedAt: serverTimestamp(),
                poGenerated: true
            });

            // Notification (safe)
            try {
                await addDoc(collection(db, "notifications"), {
                    userId: "SYSTEM_BROADCAST",
                    targetRole: "WAREHOUSE",
                    message: `Nueva Orden de Venta Aprobada: ${order.quoteFolio}. Se generaron ${supplierIds.length} OCs.`,
                    href: `/dashboard/warehouse/receivals`,
                    createdAt: serverTimestamp(),
                    read: false
                });
            } catch (e) { console.warn("Error enviando notificación:", e); }

            setOrder(prev => prev ? ({ ...prev, status: 'APPROVED' }) : null);
            setShowConfirm(false);
            alert(`¡ORDEN APROBADA! Se han generado ${supplierIds.length} Órdenes de Compra internas para Almacén.`);

        } catch (error: any) {
            console.error("❌ ERROR AL APROBAR:", error);
            setLocalError(`No se pudo aprobar: ${error.message || "Error de red/permisos"}`);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div>;
    if (!order) return <div className="p-20 text-center">Orden no encontrada.</div>;

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
            {/* Nav & Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <Link href="/dashboard/sales/orders" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Volver al Historial
                </Link>

                <div className="flex items-center gap-3">
                    {(role === "ADMIN" || role === "SUPERADMIN") && order.status === 'PENDING' && (
                        <>
                            {!showConfirm ? (
                                <button
                                    onClick={() => setShowConfirm(true)}
                                    className="btn-primary flex items-center gap-2 px-6 shadow-lg shadow-primary/20"
                                >
                                    <ShieldCheck className="w-4 h-4" /> Aprobar y Mandar a Almacén
                                </button>
                            ) : (
                                <div className="flex items-center gap-2 animate-in slide-in-from-right-4">
                                    <button
                                        onClick={() => setShowConfirm(false)}
                                        className="btn-ghost text-xs uppercase font-bold"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleApprove}
                                        disabled={actionLoading}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg"
                                    >
                                        {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                        SÍ, CONFIRMAR APROBACIÓN
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                    {order.clientOcUrl && (
                        <a
                            href={order.clientOcUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary flex items-center gap-2 border-border"
                        >
                            <Download className="w-4 h-4" /> Ver OC Cliente
                        </a>
                    )}
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left: Product and Client Review */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Status Tracker */}
                    <div className="card-premium p-6">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5 text-primary" /> Seguimiento de la Orden
                            </h3>

                            <div className="flex items-center gap-2">
                                {role === 'SUPERADMIN' ? (
                                    <select
                                        value={order.status}
                                        onChange={async (e) => {
                                            const newStatus = e.target.value;
                                            if (confirm(`¿Cambiar estado manualmente a ${newStatus}?`)) {
                                                await updateDoc(doc(db, "orders", order.id), { status: newStatus });
                                                setOrder({ ...order, status: newStatus as any });
                                            }
                                        }}
                                        className="bg-primary/5 text-primary border-primary/20 rounded px-2 py-1 text-xs font-bold uppercase transition-all hover:bg-primary/10"
                                    >
                                        <option value="PENDING font-normal text-foreground">PENDIENTE</option>
                                        <option value="APPROVED font-normal text-foreground">APROBADA</option>
                                        <option value="PO_SENT font-normal text-foreground">OC ENVIADA</option>
                                        <option value="COMPLETED font-normal text-foreground">COMPLETADA</option>
                                        <option value="CANCELLED font-normal text-foreground">CANCELADA</option>
                                    </select>
                                ) : (
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${order.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-primary/10 text-primary border-primary/20'
                                        }`}>
                                        {order.status}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="relative flex justify-between">
                            {/* Line */}
                            <div className="absolute top-5 left-8 right-8 h-0.5 bg-muted z-0" />
                            <div className={`absolute top-5 left-8 h-0.5 bg-primary z-0 transition-all duration-1000`}
                                style={{ width: order.status === 'PENDING' ? '0%' : order.status === 'APPROVED' ? '33%' : order.status === 'PO_SENT' ? '66%' : '100%' }} />

                            {[
                                { id: 'PENDING', label: 'Cerrada', icon: FileText },
                                { id: 'APPROVED', label: 'Aprobada', icon: ShieldCheck },
                                { id: 'PO_SENT', label: 'En Proceso', icon: Truck },
                                { id: 'COMPLETED', label: 'Entregada', icon: CheckCircle2 },
                            ].map((step, idx) => {
                                const isDone = order.status === step.id || (
                                    (order.status === 'APPROVED' && idx === 0) ||
                                    (order.status === 'PO_SENT' && idx <= 1) ||
                                    (order.status === 'COMPLETED')
                                );
                                const isCurrent = order.status === step.id;

                                return (
                                    <div key={step.id} className="relative z-10 flex flex-col items-center gap-2 text-center w-20">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isDone ? 'bg-primary text-white scale-110 shadow-lg' : 'bg-muted text-muted-foreground'
                                            }`}>
                                            <step.icon className="w-5 h-5" />
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase tracking-tight ${isDone ? 'text-foreground' : 'text-muted-foreground'}`}>
                                            {step.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Products Table */}
                    <div className="card-premium p-6">
                        <h3 className="font-bold mb-4 flex items-center gap-2">
                            <Package className="w-5 h-5 text-primary" /> Productos Acordados
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="text-muted-foreground border-b border-border">
                                    <tr>
                                        <th className="text-left pb-4">Ítem</th>
                                        <th className="text-center pb-4">Cantidad</th>
                                        <th className="text-right pb-4">Precio Venta</th>
                                        <th className="text-right pb-4">Importe</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {order.items.map((item, idx) => {
                                        const quantity = Number(item.quantity) || 0;
                                        const unitPrice = Number(item.unitPrice) || 0;
                                        const margin = Number(item.margin) || 0;

                                        return (
                                            <tr key={idx} className="group hover:bg-muted/5">
                                                <td className="py-4">
                                                    <div className="font-medium text-foreground">{item.productName || "Producto"}</div>
                                                    <p className="text-[10px] text-muted-foreground uppercase">Margen: {(margin * 100).toFixed(0)}%</p>
                                                </td>
                                                <td className="py-4 text-center font-bold">{quantity}</td>
                                                <td className="py-4 text-right font-mono">{formatCurrency(unitPrice)}</td>
                                                <td className="py-4 text-right font-bold font-mono">{formatCurrency(unitPrice * quantity)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right: Summary & Links */}
                <div className="space-y-6">

                    {/* Financial Summary */}
                    <div className="card-premium p-6 bg-primary/5 border-primary/20">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Cierre Financiero</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal:</span>
                                <span>{formatCurrency(order.financials.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">IVA ({(order.financials.taxRate * 100).toFixed(0)}%):</span>
                                <span>{formatCurrency(order.financials.taxAmount)}</span>
                            </div>
                            <div className="pt-3 border-t border-primary/20 flex justify-between items-end">
                                <span className="text-sm font-bold">TOTAL VENTA:</span>
                                <div className="text-right">
                                    <p className="text-2xl font-black text-primary font-mono">{formatCurrency(order.financials.total)}</p>
                                    <p className="text-[10px] text-muted-foreground font-bold">{order.financials.currency}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Client & OC Link */}
                    <div className="card-premium p-6">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6">Detalles de Vínculo</h3>

                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-muted rounded-lg"><User className="w-4 h-4 text-muted-foreground" /></div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase font-bold">Cliente</p>
                                    <p className="text-sm font-bold text-foreground">{order.clientName}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-muted rounded-lg"><FileText className="w-4 h-4 text-muted-foreground" /></div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase font-bold">Cotización Raíz</p>
                                    <Link href={`/dashboard/sales/quotes/${order.quoteId}`} className="text-sm font-bold text-primary hover:underline">
                                        {order.quoteFolio}
                                    </Link>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-muted rounded-lg"><ShieldCheck className="w-4 h-4 text-muted-foreground" /></div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase font-bold">OC del Cliente</p>
                                    <p className="text-sm font-bold font-mono">{order.clientOcFolio || 'Sin Folio'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Helper Banner */}
                    {order.status === 'PENDING' && (
                        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                            <div>
                                <p className="text-sm font-bold text-amber-600">Espera de Aprobación</p>
                                <p className="text-xs text-amber-600/80">Esta orden debe ser aprobada por Administración para generar las órdenes de compra a proveedores.</p>
                            </div>
                        </div>
                    )}

                    {/* History / Recorrido */}
                    <div className="card-premium p-6">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6">Trazabilidad del Recorrido</h3>
                        <div className="space-y-6">
                            <div className="flex gap-4 relative">
                                <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-border" />
                                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 z-10">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold">Venta Registrada</p>
                                    <p className="text-xs text-muted-foreground">Por Vendedor • {order.createdAt?.seconds ? formatDate(new Date(order.createdAt.seconds * 1000)) : 'Fecha reciente'}</p>
                                    <p className="text-[10px] bg-muted px-2 py-0.5 rounded mt-1 inline-block">OC Cliente: {order.clientOcFolio}</p>
                                </div>
                            </div>

                            <div className="flex gap-4 relative">
                                {order.status !== 'PENDING' ? (
                                    <>
                                        <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-border" />
                                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 z-10">
                                            <ShieldCheck className="w-4 h-4 text-blue-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">Orden Aprobada</p>
                                            <p className="text-xs text-muted-foreground">Por Administración</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 z-10 border border-dashed border-muted-foreground/30">
                                            <Clock className="w-4 h-4 text-muted-foreground" />
                                        </div>
                                        <div className="opacity-50">
                                            <p className="text-sm font-bold">Esperando Aprobación</p>
                                            <p className="text-xs text-muted-foreground">Pendiente de Admin</p>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="flex gap-4">
                                {order.status === 'GOODS_RECEIVED' || order.status === 'COMPLETED' ? (
                                    <>
                                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 z-10">
                                            <Package className="w-4 h-4 text-emerald-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">Mercancía Recibida</p>
                                            <p className="text-xs text-muted-foreground">En Almacén</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 z-10 border border-dashed border-muted-foreground/30">
                                            <Truck className="w-4 h-4 text-muted-foreground" />
                                        </div>
                                        <div className="opacity-50">
                                            <p className="text-sm font-bold">Pendiente de Recibir</p>
                                            <p className="text-xs text-muted-foreground">Logística en curso</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
