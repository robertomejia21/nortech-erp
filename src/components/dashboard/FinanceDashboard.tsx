"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import {
    FileText,
    DollarSign,
    Package,
    AlertCircle,
    CheckCircle2,
    ArrowUpRight,
    Search,
    Upload,
    ShoppingCart
} from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import InvoiceUploadModal from "@/components/modals/InvoiceUploadModal";

export default function FinanceDashboard({ stats, shortcuts }: { stats: any[], shortcuts: any[] }) {
    const { user } = useAuthStore();
    const [pendingInvoices, setPendingInvoices] = useState<any[]>([]);
    const [activeOrders, setActiveOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch Orders needing Invoices
                const qOrders = query(
                    collection(db, "orders"),
                    where("status", "in", ["APPROVED", "PO_SENT", "GOODS_RECEIVED", "COMPLETED", "PAID"]),
                    orderBy("createdAt", "desc"),
                    limit(40)
                );

                const snapshot = await getDocs(qOrders);
                const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                const distinctPendingInvoices = orders.filter((o: any) => o.invoiceStatus !== 'UPLOADED');
                setPendingInvoices(distinctPendingInvoices);

                const recentOrders = orders.filter((o: any) => ['APPROVED', 'PO_SENT', 'GOODS_RECEIVED'].includes(o.status));
                setActiveOrders(recentOrders);

            } catch (error) {
                console.error("Error fetching finance dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    const handleOpenUpload = (order: any) => {
        setSelectedOrder(order);
        setIsUploadModalOpen(true);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {shortcuts.map((shortcut) => (
                    <Link
                        key={shortcut.name}
                        href={shortcut.href}
                        className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-muted/50 transition-all group shadow-sm hover:shadow-md"
                    >
                        <div className="p-3 rounded-lg bg-finance/10 text-finance group-hover:scale-110 transition-transform">
                            <shortcut.icon className="w-6 h-6" />
                        </div>
                        <span className="font-bold text-sm text-foreground">{shortcut.name}</span>
                    </Link>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* SECTION 1: Facturas Pendientes */}
                <div className="card-premium p-6 bg-card border-l-4 border-l-amber-500">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-amber-500" />
                            <h2 className="text-lg font-bold text-foreground">Facturas Pendientes</h2>
                        </div>
                        <span className="bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-bold px-2 py-1 rounded-full">
                            {pendingInvoices.length} Requeridas
                        </span>
                    </div>

                    <div className="space-y-3">
                        {loading ? (
                            <p className="text-sm text-muted-foreground">Cargando...</p>
                        ) : pendingInvoices.length > 0 ? (
                            pendingInvoices.slice(0, 5).map((order) => (
                                <div key={order.id} className="p-4 rounded-xl bg-muted/30 border border-border hover:bg-muted/50 transition-colors flex items-center justify-between group">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-sm text-foreground">{order.quoteFolio}</p>
                                            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                                {formatDate(new Date(order.createdAt?.seconds * 1000 || Date.now()))}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate font-medium mt-0.5">{order.clientName}</p>
                                        <p className="text-xs font-mono font-bold text-foreground mt-1 text-primary">
                                            {formatCurrency(order.financials?.total || 0)}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleOpenUpload(order)}
                                        className="btn-primary px-3 py-2 text-xs font-bold flex items-center gap-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Upload className="w-3 h-3" /> Subir Factura
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500 opacity-50" />
                                ¡Todo al día! No hay facturas pendientes.
                            </div>
                        )}
                    </div>
                </div>

                {/* SECTION 2: Cuentas por cobrar / OC */}
                <div className="card-premium p-6 bg-card border-l-4 border-l-blue-500">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5 text-blue-500" />
                            <h2 className="text-lg font-bold text-foreground">Aprobaciones y Cobranza</h2>
                        </div>
                        <Link href="/dashboard/finance/receivables" className="text-xs text-primary hover:underline flex items-center gap-1">
                            Ver Todas <ArrowUpRight className="w-3 h-3" />
                        </Link>
                    </div>

                    <div className="space-y-3">
                        {loading ? (
                            <p className="text-sm text-muted-foreground">Cargando...</p>
                        ) : activeOrders.length > 0 ? (
                            activeOrders.slice(0, 5).map((order) => (
                                <div key={order.id} className="p-4 rounded-xl bg-muted/30 border border-border hover:bg-muted/50 transition-colors flex items-center justify-between">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-sm text-foreground">{order.quoteFolio}</p>
                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${order.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                                                order.status === 'PO_SENT' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-zinc-100 text-zinc-700'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate font-medium mt-0.5">{order.clientName}</p>
                                    </div>
                                    <Link
                                        href={`/dashboard/sales/orders/${order.id}`}
                                        className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-primary transition-colors"
                                    >
                                        <ArrowUpRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                                No hay requerimientos financieros activos.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-bold text-foreground mb-4">Resumen Financiero y Operativo</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat, index) => (
                        <div key={stat.title} className="card-premium p-4 bg-card border border-border">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg bg-${stat.accent}-500/10 text-${stat.accent}-500`}>
                                    <stat.icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground font-bold uppercase">{stat.title}</p>
                                    <p className="text-lg font-black text-foreground">{stat.value}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <InvoiceUploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                order={selectedOrder}
                onUploadComplete={() => {
                    window.location.reload();
                }}
            />
        </div>
    );
}
