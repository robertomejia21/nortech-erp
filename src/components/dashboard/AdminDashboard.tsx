"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs, updateDoc, doc } from "firebase/firestore";
import {
    FileText,
    TrendingUp,
    Package,
    ArrowUpRight,
    ShoppingCart,
    MessageSquare,
    CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function AdminDashboard({ stats, shortcuts, salesData }: { stats: any[], shortcuts: any[], salesData: any[] }) {
    const { user } = useAuthStore();
    const [pendingQuotes, setPendingQuotes] = useState<any[]>([]); // Quotes waiting for PO
    const [supportRequests, setSupportRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Fetch Cotizaciones Autorizadas listos para generar Orden de Compra (FINALIZED / ACCEPTED)
                const qQuotes = query(
                    collection(db, "quotations"),
                    where("status", "in", ["FINALIZED", "ACCEPTED"]),
                    orderBy("createdAt", "desc")
                );
                const snapQuotes = await getDocs(qQuotes);
                const authorizedQuotes = snapQuotes.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // Usually an admin creates an order and it links to a quote. 
                // We could filter out quotes that already have orders if we queried orders. 
                // Since this is a dashboard, showing recent ones is good enough.
                setPendingQuotes(authorizedQuotes.slice(0, 10));

                // 2. Fetch Support Requests
                const qHelp = query(
                    collection(db, "notifications"),
                    where("type", "==", "SUPPORT_REQUEST"),
                    orderBy("createdAt", "desc")
                );
                const snapHelp = await getDocs(qHelp);
                const helps = snapHelp.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setSupportRequests(helps.slice(0, 10)); // Top 10 most recent

            } catch (error) {
                console.error("Error fetching admin dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    const handleResolveHelp = async (id: string) => {
        try {
            await updateDoc(doc(db, "notifications", id), {
                read: true,
                status: 'RESOLVED'
            });
            setSupportRequests(supportRequests.filter(req => req.id !== id));
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Shortcuts / Quick Actions Header */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {shortcuts.map((shortcut) => (
                    <Link
                        key={shortcut.name}
                        href={shortcut.href}
                        className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-muted/50 transition-all group shadow-sm hover:shadow-md"
                    >
                        <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                            <shortcut.icon className="w-6 h-6" />
                        </div>
                        <span className="font-bold text-sm text-foreground">{shortcut.name}</span>
                    </Link>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* SECTION 1: Solicitudes de Ayuda (Vendedores) */}
                <div className="card-premium p-6 bg-card border-l-4 border-l-purple-500">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-purple-500" />
                            <h2 className="text-lg font-bold text-foreground">Solicitudes de Ayuda</h2>
                        </div>
                        <span className="bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 text-xs font-bold px-2 py-1 rounded-full">
                            {supportRequests.length} Solicitudes
                        </span>
                    </div>

                    <div className="space-y-3">
                        {loading ? (
                            <p className="text-sm text-muted-foreground">Cargando...</p>
                        ) : supportRequests.length > 0 ? (
                            supportRequests.map((req) => (
                                <div key={req.id} className="p-4 rounded-xl bg-muted/30 border border-border flex flex-col gap-2">
                                    <div className="flex justify-between items-start">
                                        <p className="text-sm font-medium text-foreground">{req.message}</p>
                                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded flex-shrink-0 ml-2">
                                            {formatDate(new Date(req.createdAt?.seconds * 1000 || Date.now()))}
                                        </span>
                                    </div>
                                    <div className="flex justify-end pt-2">
                                        <button onClick={() => handleResolveHelp(req.id)} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" /> Marcar Resuelto
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500 opacity-50" />
                                Todos los vendedores están bien.
                            </div>
                        )}
                    </div>
                </div>

                {/* SECTION 2: Cotizaciones a Procesar a OC */}
                <div className="card-premium p-6 bg-card border-l-4 border-l-blue-500">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5 text-blue-500" />
                            <h2 className="text-lg font-bold text-foreground">Autorizadas p/ Orden de Compra</h2>
                        </div>
                        <Link href="/dashboard/admin/orders/new" className="text-xs text-primary hover:underline flex items-center gap-1">
                            Crear Nueva OC <ArrowUpRight className="w-3 h-3" />
                        </Link>
                    </div>

                    <div className="space-y-3">
                        {loading ? (
                            <p className="text-sm text-muted-foreground">Cargando...</p>
                        ) : pendingQuotes.length > 0 ? (
                            pendingQuotes.map((quote) => (
                                <div key={quote.id} className="p-4 rounded-xl bg-muted/30 border border-border hover:bg-muted/50 transition-colors flex items-center justify-between">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-sm text-foreground">{quote.folio}</p>
                                            <span className="bg-emerald-100 text-emerald-700 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                                                Autorizada
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate font-medium mt-0.5 text-primary">
                                            Vendedor ID: {quote.salesRepId}
                                        </p>
                                    </div>
                                    <Link
                                        href={`/dashboard/admin/orders/new?quoteId=${quote.id}`}
                                        className="btn-primary flex items-center gap-2 px-3 py-1.5 text-xs shadow-sm"
                                    >
                                        <ShoppingCart className="w-3 h-3" /> Crear OC
                                    </Link>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                                No hay cotizaciones esperando Orden de Compra.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* SECTION 3: Sales Rep Performance */}
            <div className="card-premium p-6 bg-card">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-foreground">Funcionamiento de Vendedores</h3>
                        <p className="text-sm text-muted-foreground">Monitorea el progreso y las cuotas de tu equipo.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {salesData && salesData.length > 0 ? salesData.map((person) => {
                        const progress = (person.quota / person.target) * 100;
                        const isOverQuota = progress >= 100;

                        return (
                            <div
                                key={person.name}
                                className="flex flex-col items-center gap-4 p-5 rounded-xl bg-muted/30 border border-border"
                            >
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm">
                                    {person.name.substring(0, 2).toUpperCase()}
                                </div>

                                <div className="text-center">
                                    <p className="text-sm font-semibold text-foreground">{person.name}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {isOverQuota ? '🏆 ' : ''}${person.quota}K / ${person.target}K
                                    </p>
                                </div>

                                <div className="w-full">
                                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all ${isOverQuota ? 'bg-gradient-to-r from-success to-success/80' : 'bg-gradient-to-r from-primary to-primary/80'}`}
                                            style={{ width: `${Math.min(progress, 100)}%` }}
                                        />
                                    </div>
                                    <p className={`text-xs font-medium text-center mt-1 ${isOverQuota ? 'text-success' : 'text-primary'}`}>
                                        {progress.toFixed(0)}%
                                    </p>
                                </div>

                                <div className="w-full space-y-1.5">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground">Conversión:</span>
                                        <span className="font-semibold text-foreground">{person.conversion}%</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground">Deals:</span>
                                        <span className="font-semibold text-success">{person.deals}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="col-span-full py-8 text-center text-muted-foreground text-sm">
                            Cargando datos de vendedores u operando sin actividad reciente.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
