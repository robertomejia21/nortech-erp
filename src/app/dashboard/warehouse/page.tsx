"use client";

import { useEffect, useState } from "react";
import { collection, query, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
    Truck,
    PackageCheck,
    Upload,
    FileText,
    Search,
    CheckCircle2,
    Clock,
    Eye
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";

const statusConfig = {
    GOODS_RECEIVED: { label: "Recibido", class: "badge-success", icon: CheckCircle2 },
    APPROVED: { label: "Por Recibir", class: "badge-warning", icon: Clock },
    PO_SENT: { label: "En Tránsito", class: "badge-info", icon: Truck },
    PENDING: { label: "Pendiente Admin", class: "badge-neutral", icon: Clock },
};

export default function WarehouseDashboardPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDragging, setIsDragging] = useState(false);
    const [notification, setNotification] = useState<string | null>(null);

    useEffect(() => {
        fetchRecentOrders();
    }, []);

    const fetchRecentOrders = async () => {
        setLoading(true);
        try {
            const q = query(
                collection(db, "orders"),
                orderBy("createdAt", "desc"),
                limit(10)
            );
            const querySnapshot = await getDocs(q);
            const list: any[] = [];
            querySnapshot.forEach((doc) => {
                list.push({ id: doc.id, ...doc.data() });
            });
            setOrders(list);
        } catch (error) {
            console.error("Error fetching warehouse orders:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        // Simulate file upload
        setNotification("Factura XML procesada exitosamente. Notificación enviada al vendedor.");
        setTimeout(() => setNotification(null), 5000);
    };

    return (
        <div className="space-y-6 animate-in">
            {/* Page Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Operaciones de Almacén</h1>
                    <p className="text-muted-foreground mt-1">Órdenes de Compra Internas y Procesamiento de Facturas</p>
                </div>

                {/* Success Notification */}
                {notification && (
                    <div className="flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 max-w-md animate-in">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-emerald-500">Factura Cargada</p>
                            <p className="text-xs text-emerald-500/80 mt-1">{notification}</p>
                        </div>
                        <button
                            onClick={() => setNotification(null)}
                            className="text-emerald-500/60 hover:text-emerald-500 ml-2"
                        >
                            ×
                        </button>
                    </div>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card-premium p-5 bg-card">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-blue-500/10">
                            <Truck className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">{orders.filter(o => o.status === 'PO_SENT').length}</p>
                            <p className="text-sm text-muted-foreground">En Tránsito</p>
                        </div>
                    </div>
                </div>
                <div className="card-premium p-5 bg-card">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-emerald-500/10">
                            <PackageCheck className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">{orders.filter(o => o.status === 'GOODS_RECEIVED').length}</p>
                            <p className="text-sm text-muted-foreground">Recibidos</p>
                        </div>
                    </div>
                </div>
                <div className="card-premium p-5 bg-card">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-amber-500/10">
                            <Clock className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">{orders.filter(o => o.status === 'APPROVED').length}</p>
                            <p className="text-sm text-muted-foreground">Por Recibir</p>
                        </div>
                    </div>
                </div>
                <div className="card-premium p-5 bg-card">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-purple-500/10">
                            <FileText className="w-5 h-5 text-purple-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">{orders.length}</p>
                            <p className="text-sm text-muted-foreground">Órdenes Totales</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Upload Zone */}
            <div
                className={`card-premium p-8 border-2 border-dashed transition-all duration-300 bg-card ${isDragging
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30"
                    }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <div className="flex flex-col items-center text-center">
                    <div className={`p-4 rounded-full mb-4 transition-colors ${isDragging ? "bg-primary/20" : "bg-muted"
                        }`}>
                        <Upload className={`w-8 h-8 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                        Arrastra y Suelta Facturas Compac
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 max-w-md">
                        Sube archivos XML y PDF para validar automáticamente contra las Órdenes de Compra abiertas.
                    </p>
                    <button className="btn-primary">
                        Examinar Archivos
                    </button>
                    <p className="text-xs text-muted-foreground mt-3">
                        Formatos soportados: .XML, .PDF (Máx 25MB)
                    </p>
                </div>
            </div>

            {/* Orders Table */}
            <div className="card-premium overflow-hidden bg-card">
                <div className="p-4 border-b border-white/5 flex justify-between items-center">
                    <h3 className="font-bold">Órdenes Recientes</h3>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            className="input-dark pl-10 text-xs py-1.5 w-64"
                        />
                    </div>
                </div>
                <table className="table-dark">
                    <thead>
                        <tr>
                            <th className="w-10">
                                <input type="checkbox" className="w-4 h-4 rounded bg-muted border-border" />
                            </th>
                            <th>ID Orden</th>
                            <th>Cotización</th>
                            <th>Cliente</th>
                            <th>Fecha</th>
                            <th>Monto Total</th>
                            <th>Estado</th>
                            <th className="w-10"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={8} className="text-center py-10 font-medium">Buscando órdenes...</td></tr>
                        ) : orders.map((order) => {
                            const status = statusConfig[order.status as keyof typeof statusConfig] || { label: order.status, class: "badge-neutral", icon: Clock };
                            return (
                                <tr key={order.id}>
                                    <td>
                                        <input type="checkbox" className="w-4 h-4 rounded bg-muted border-border" />
                                    </td>
                                    <td className="font-mono text-xs">#{order.id.slice(-6).toUpperCase()}</td>
                                    <td>
                                        <Link href={`/dashboard/sales/quotes/${order.quoteId}`} className="text-primary hover:underline font-medium">
                                            {order.quoteFolio || "Ver"}
                                        </Link>
                                    </td>
                                    <td>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{order.type === 'PURCHASE_ORDER' ? order.supplierName : (order.clientName || "Cliente")}</span>
                                            {order.type === 'PURCHASE_ORDER' && <span className="text-[10px] text-primary font-bold">OC INTERNA</span>}
                                        </div>
                                    </td>
                                    <td className="text-muted-foreground text-[10px]">{order.createdAt?.seconds ? formatDate(new Date(order.createdAt.seconds * 1000)) : 'Reciente'}</td>
                                    <td className="font-medium">{formatCurrency(order.financials?.total || order.financials?.subtotal || 0)}</td>
                                    <td>
                                        <span className={`badge ${order.status === 'PO_CREATED' ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' : status.class}`}>
                                            {order.status === 'PO_CREATED' ? 'OC Creada' : status.label}
                                        </span>
                                    </td>
                                    <td>
                                        <Link href={`/dashboard/sales/orders/${order.id}`} className="p-2 hover:bg-muted rounded-lg transition-colors inline-block">
                                            <Eye className="w-4 h-4 text-muted-foreground" />
                                        </Link>
                                    </td>
                                </tr>
                            );
                        })}
                        {orders.length === 0 && !loading && (
                            <tr><td colSpan={8} className="text-center py-10 text-muted-foreground">No se encontraron órdenes recientes.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
