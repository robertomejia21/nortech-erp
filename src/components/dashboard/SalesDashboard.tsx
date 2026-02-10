"use client";

import { useAuthStore } from "@/store/useAuthStore";
import {
    Trophy,
    Target,
    Zap,
    ArrowUpRight,
    Clock,
    CheckCircle2,
    AlertCircle,
    FileText,
    TrendingUp,
    DollarSign,
    Users,
    ArrowRight
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import { db } from "@/lib/firebase";

export default function SalesDashboard() {
    const { user } = useAuthStore();
    const [stats, setStats] = useState({
        monthlySales: 135200, // En un futuro esto vendrá de coleccion 'orders'
        monthlyGoal: 150000,
        pendingQuotes: 18,
        conversionRate: 42,
        activeOrders: 12
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            if (!user?.uid) return;
            try {
                const { doc, getDoc, collection, query, where, getCountFromServer, getDocs } = await import("firebase/firestore");

                // Fetch User Meta (Goal)
                const userDoc = await getDoc(doc(db, "users", user.uid));
                let monthlyGoal = 150000;
                if (userDoc.exists()) {
                    monthlyGoal = userDoc.data().monthlyGoal || 150000;
                }

                const qLeads = query(collection(db, "leads"), where("salesRepId", "==", user.uid));
                const qPending = query(collection(db, "quotations"),
                    where("salesRepId", "==", user.uid),
                    where("status", "==", "DRAFT")
                );
                const qTotal = query(collection(db, "quotations"),
                    where("salesRepId", "==", user.uid)
                );

                const [pendingSnap, totalSnap, leadsSnap] = await Promise.all([
                    getCountFromServer(qPending),
                    getCountFromServer(qTotal),
                    getDocs(qLeads)
                ]);

                const leads = leadsSnap.docs.map(d => d.data() as any);

                setStats(prev => ({
                    ...prev,
                    monthlyGoal,
                    pendingQuotes: pendingSnap.data().count,
                    activeOrders: totalSnap.data().count,
                    leadCounts: {
                        leads: leads.filter((l: any) => l.status === 'leads').length,
                        quotes: leads.filter((l: any) => l.status === 'quotes').length,
                        negotiation: leads.filter((l: any) => l.status === 'negotiation').length,
                    }
                }));

            } catch (error) {
                console.error("Error fetching dashboard stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [user]);

    const remaining = stats.monthlyGoal - stats.monthlySales;
    const isGoalReached = remaining <= 0;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-4">
                    <Zap className="w-10 h-10 animate-pulse text-accent-blue" />
                    <p className="text-muted-foreground animate-pulse font-medium">Personalizando tu panel...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header / Motivation Card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-8 border border-white/5 shadow-2xl">
                {/* Decorative Elements */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-accent-blue/20 rounded-full blur-[100px]" />
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Trophy className="w-40 h-40 text-white" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-[10px] font-bold uppercase tracking-widest mb-4">
                            <Zap className="w-3 h-3 fill-current" /> Rendimiento de Ventas
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
                            ¡Sigue así, <span className="text-gradient">{(user?.displayName || "Vendedor").split(" ")[0]}!</span>
                        </h2>
                        <p className="text-zinc-400 max-w-md text-lg leading-relaxed">
                            {isGoalReached ? (
                                <span className="text-success font-bold text-xl">✨ ¡Felicidades! Has superado tu meta mensual.</span>
                            ) : (
                                <>Estás a solo <span className="text-white font-bold">{formatCurrency(remaining)}</span> de alcanzar tu meta mensual.</>
                            )}
                            {" "}Tienes <span className="text-accent-blue font-bold">{stats.pendingQuotes} cotizaciones</span> urgentes.
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/sales/quotes/new" className="btn-primary px-8 py-4 rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all text-base font-bold bg-white text-black hover:bg-zinc-200">
                            + Nueva Cotización
                        </Link>
                    </div>
                </div>
            </div>

            {/* Personalized Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Mis Ventas Mes"
                    value={formatCurrency(stats.monthlySales)}
                    trend="+15%"
                    icon={DollarSign}
                    color="text-emerald-400"
                    bg="bg-emerald-500/10"
                    trendUp={true}
                />
                <StatCard
                    title="Cotizaciones Totales"
                    value={stats.activeOrders.toString()}
                    trend={`${stats.pendingQuotes} pendientes`}
                    icon={FileText}
                    color="text-amber-400"
                    bg="bg-amber-500/10"
                    trendUp={stats.pendingQuotes > 0 ? false : null}
                />
                <StatCard
                    title="Tasa de Cierre"
                    value="42%"
                    trend="+5% vs mes ant."
                    icon={TrendingUp}
                    color="text-blue-400"
                    bg="bg-blue-500/10"
                    trendUp={true}
                />
                <StatCard
                    title="Días Promedio Cierre"
                    value="4.5"
                    trend="Eficiencia alta"
                    icon={Clock}
                    color="text-purple-400"
                    bg="bg-purple-500/10"
                    trendUp={true}
                />
            </div>

            {/* Condensed Pipeline Summary */}
            <div className="card-premium p-6 bg-card border-border/40 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <Target className="w-5 h-5 text-primary" />
                            <h3 className="text-xl font-bold text-foreground">Pipeline Operativo</h3>
                        </div>
                        <p className="text-sm text-muted-foreground max-w-md">
                            Tienes <span className="text-foreground font-bold">varios prospectos</span> y <span className="text-foreground font-bold">{stats.pendingQuotes} cotizaciones</span> pendientes. Entra al CRM para gestionar tu cartera.
                        </p>

                        <div className="flex items-center gap-6 mt-6">
                            <div className="flex items-center gap-2 transition-transform hover:scale-105 cursor-default">
                                <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                <span className="text-xs font-black text-foreground uppercase tracking-wider">{(stats as any).leadCounts?.leads || 0} Prospectos</span>
                            </div>
                            <div className="flex items-center gap-2 transition-transform hover:scale-105 cursor-default">
                                <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                                <span className="text-xs font-black text-foreground uppercase tracking-wider">{(stats as any).leadCounts?.quotes || 0} En Cotiz.</span>
                            </div>
                            <div className="flex items-center gap-2 transition-transform hover:scale-105 cursor-default">
                                <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                                <span className="text-xs font-black text-foreground uppercase tracking-wider">{(stats as any).leadCounts?.negotiation || 0} Negoc.</span>
                            </div>
                        </div>
                    </div>

                    <div className="shrink-0">
                        <Link
                            href="/dashboard/sales/crm"
                            className="btn-primary px-6 py-3 rounded-xl flex items-center gap-2 shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all text-sm font-black whitespace-nowrap"
                        >
                            Gestionar en CRM Interactivo
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Focus Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent My Quotes */}
                <div className="card-premium p-6 bg-card">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-foreground">Mis Cotizaciones Recientes</h3>
                        <Link href="/dashboard/sales/quotes" className="text-xs text-muted-foreground hover:text-primary transition-colors">Ver todo</Link>
                    </div>
                    <div className="space-y-3">
                        {[
                            { id: 'QT-2024-001', client: 'Industrias Patito S.A.', amount: 12400, status: 'Enviada', statusColor: 'amber' },
                            { id: 'QT-2024-002', client: 'Global Logistics MX', amount: 45200, status: 'Aprobada', statusColor: 'emerald' },
                            { id: 'QT-2024-003', client: 'Tech Solutions LLC', amount: 8900, status: 'Borrador', statusColor: 'zinc' },
                        ].map((quote) => (
                            <div key={quote.id} className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/50 hover:border-primary/30 hover:bg-muted/50 transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-foreground">{quote.id}</p>
                                        <p className="text-xs text-muted-foreground truncate max-w-[150px]">{quote.client}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-sm text-foreground">{formatCurrency(quote.amount)}</p>
                                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter bg-${quote.statusColor}-500/10 text-${quote.statusColor}-500 border border-${quote.statusColor}-500/20`}>
                                        {quote.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tracking / Alerts */}
                <div className="card-premium p-6 bg-card">
                    <h3 className="text-lg font-bold text-foreground mb-6">Estado de mis Procesos</h3>
                    <div className="space-y-4">
                        <AlertItem
                            icon={AlertCircle}
                            color="text-amber-500"
                            bg="bg-amber-500/10"
                            title="Seguimiento Pendiente"
                            desc="La cotización QT-2024-001 fue enviada hace 3 días sin respuesta."
                            action="Llamar Cliente"
                        />
                        <AlertItem
                            icon={CheckCircle2}
                            color="text-emerald-500"
                            bg="bg-emerald-500/10"
                            title="¡Venta Ganada!"
                            desc="El cliente aceptó la propuesta de Global Logistics MX."
                            action="Ver Orden"
                        />
                        <AlertItem
                            icon={Clock}
                            color="text-blue-500"
                            bg="bg-blue-500/10"
                            title="En Almacén"
                            desc="Los equipos para tu orden #882 ya están listos para envío."
                            action="Check Logística"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, trend, icon: Icon, color, bg, trendUp }: any) {
    return (
        <div className="card-premium p-5 bg-card hover:translate-y-[-4px] transition-all duration-300 group">
            <div className="flex items-start justify-between">
                <div className={`p-3 rounded-2xl ${bg} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                </div>
                {trendUp !== null && (
                    <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-tight ${trendUp ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                        {trend}
                    </span>
                )}
            </div>
            <div className="mt-5">
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest opacity-70">{title}</p>
                <p className="text-2xl font-black text-foreground mt-1 tabular-nums">{value}</p>
            </div>
        </div>
    );
}

function AlertItem({ icon: Icon, color, bg, title, desc, action }: any) {
    return (
        <div className="flex gap-4 p-4 rounded-2xl hover:bg-muted/50 transition-all border border-transparent hover:border-border cursor-pointer group">
            <div className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center shrink-0 shadow-sm`}>
                <Icon className={`w-6 h-6 ${color}`} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-black text-foreground group-hover:text-primary transition-colors">{title}</p>
                    <span className="text-[9px] font-bold text-accent-blue opacity-0 group-hover:opacity-100 transition-opacity uppercase">{action}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{desc}</p>
            </div>
        </div>
    );
}
