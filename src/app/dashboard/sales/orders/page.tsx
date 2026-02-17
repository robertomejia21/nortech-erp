"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthStore } from "@/store/useAuthStore";
import {
    Search, Filter, ShoppingBag, Eye,
    Clock, CheckCircle2, AlertCircle, TrendingUp,
    ChevronRight, ArrowUpRight, FileText
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";

type Order = {
    id: string;
    quoteFolio: string;
    clientName: string;
    financials: { total: number; currency: string };
    status: 'PENDING' | 'APPROVED' | 'PO_SENT' | 'COMPLETED' | 'CANCELLED';
    createdAt: any;
    clientOcFolio: string;
};

export default function OrdersListPage() {
    const { user, role } = useAuthStore();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        if (user) {
            // OPTIMIZATION: Load from cache first
            const cacheKey = `orders_list_${user.uid}`;
            const cached = localStorage.getItem(cacheKey);
            let isBackground = false;

            if (cached) {
                try {
                    setOrders(JSON.parse(cached));
                    setLoading(false);
                    isBackground = true;
                } catch (e) {
                    console.error("Cache parse error", e);
                }
            }
            fetchOrders(isBackground);
        }
    }, [user]);

    const fetchOrders = async (isBackground = false) => {
        if (!isBackground) setLoading(true);
        try {
            let q;
            const ordersRef = collection(db, "orders");

            // Filters based on role
            if (role === 'SUPERADMIN' || role === 'ADMIN' || role === 'FINANCE') {
                q = query(ordersRef, orderBy("createdAt", "desc"));
            } else {
                q = query(
                    ordersRef,
                    where("salesRepId", "==", user?.uid),
                    orderBy("createdAt", "desc")
                );
            }

            const querySnapshot = await getDocs(q);
            const list: Order[] = [];
            querySnapshot.forEach((doc) => {
                list.push({ id: doc.id, ...doc.data() } as Order);
            });
            setOrders(list);

            // Update cache
            if (user?.uid) {
                localStorage.setItem(`orders_list_${user.uid}`, JSON.stringify(list));
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredOrders = orders.filter(order =>
        order.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.quoteFolio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.clientOcFolio?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'APPROVED': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'PO_SENT': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
            case 'COMPLETED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'CANCELLED': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'PENDING': return 'Pendiente Admin';
            case 'APPROVED': return 'Aprobada';
            case 'PO_SENT': return 'OC Enviada a Proveedor';
            case 'COMPLETED': return 'Completada';
            case 'CANCELLED': return 'Cancelada';
            default: return status;
        }
    };

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Órdenes de Venta</h1>
                    <p className="text-muted-foreground mt-1">Garantiza el seguimiento de tus ventas cerradas.</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-initial">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Buscar por cliente u OC..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-card border border-border rounded-lg py-2 pl-10 pr-4 text-sm w-full md:w-64 focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="card-premium p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <ShoppingBag className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Totales</p>
                        <p className="text-2xl font-bold">{orders.length}</p>
                    </div>
                </div>
                <div className="card-premium p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Pendientes</p>
                        <p className="text-2xl font-bold">{orders.filter(o => o.status === 'PENDING').length}</p>
                    </div>
                </div>
                <div className="card-premium p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Completadas</p>
                        <p className="text-2xl font-bold">{orders.filter(o => o.status === 'COMPLETED').length}</p>
                    </div>
                </div>
                <div className="card-premium p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Facturado</p>
                        <p className="text-xl font-bold">
                            {formatCurrency(orders.reduce((acc, curr) => acc + (curr.financials?.total || 0), 0))}
                        </p>
                    </div>
                </div>
            </div>

            {/* Orders Table */}
            <div className="card-premium overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-muted-foreground">
                            <tr>
                                <th className="p-4 text-left font-bold">Cliente / Proyecto</th>
                                <th className="p-4 text-left font-bold">Vínculo Cotización</th>
                                <th className="p-4 text-left font-bold">OC Cliente</th>
                                <th className="p-4 text-left font-bold">Estado</th>
                                <th className="p-4 text-right font-bold">Total</th>
                                <th className="p-4 text-center font-bold">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="p-8 text-center bg-muted/5">Cargando...</td>
                                    </tr>
                                ))
                            ) : filteredOrders.length > 0 ? (
                                filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-muted/30 transition-colors group">
                                        <td className="p-4">
                                            <div className="font-bold text-foreground">{order.clientName}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {order.createdAt?.seconds ? formatDate(new Date(order.createdAt.seconds * 1000)) : '---'}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center gap-1.5 text-xs bg-muted px-2 py-1 rounded border border-border">
                                                <FileText className="w-3 h-3" /> {order.quoteFolio}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className="font-mono text-xs">{order.clientOcFolio}</span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase ${getStatusStyles(order.status)}`}>
                                                {getStatusLabel(order.status)}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right font-bold font-mono">
                                            {formatCurrency(order.financials?.total || 0)} {order.financials?.currency || 'MXN'}
                                        </td>
                                        <td className="p-4 text-center">
                                            <Link
                                                href={`/dashboard/sales/orders/${order.id}`}
                                                className="btn-ghost p-2 hover:text-primary transition-colors inline-block"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-muted-foreground">
                                        No se encontraron órdenes.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
