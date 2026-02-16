"use client";

import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Users,
    Target,
    Clock,
    Award,
    ArrowUpRight,
    CheckCircle2,
    AlertCircle,
    XCircle,
    FileText,
    Phone,
    Mail,
    Calendar
} from "lucide-react";
import Link from "next/link";

// Datos de ejemplo - En producción vendrían de Firestore
const salesTeamData = [
    {
        id: "1",
        name: "Sara Martínez",
        avatar: "SM",
        email: "sara@nortech.com",
        phone: "+52 555 1234",
        role: "Senior Sales",
        quota: 150000,
        achieved: 165000,
        deals: {
            won: 12,
            inProgress: 8,
            lost: 3
        },
        pipeline: {
            prospecting: 5,
            qualified: 8,
            proposal: 6,
            negotiation: 4,
            closed: 12
        },
        metrics: {
            conversionRate: 52,
            avgDealSize: 13750,
            avgCycleTime: 28,
            activeClients: 24
        },
        recentActivity: [
            { action: "Cerró deal", client: "TechCorp", amount: 15000, date: "Hoy" },
            { action: "Propuesta enviada", client: "InnovateLab", amount: 12000, date: "Ayer" }
        ]
    },
    {
        id: "2",
        name: "Jaime Rodríguez",
        avatar: "JR",
        email: "jaime@nortech.com",
        phone: "+52 555 5678",
        role: "Sales Representative",
        quota: 120000,
        achieved: 135000,
        deals: {
            won: 15,
            inProgress: 6,
            lost: 2
        },
        pipeline: {
            prospecting: 4,
            qualified: 6,
            proposal: 5,
            negotiation: 3,
            closed: 15
        },
        metrics: {
            conversionRate: 65,
            avgDealSize: 9000,
            avgCycleTime: 21,
            activeClients: 31
        },
        recentActivity: [
            { action: "Llamada programada", client: "MegaStore", amount: 8500, date: "Hoy" },
            { action: "Demo completada", client: "FastShip", amount: 11000, date: "Hace 2 días" }
        ]
    },
    {
        id: "3",
        name: "Miguel Hernández",
        avatar: "MH",
        email: "miguel@nortech.com",
        phone: "+52 555 9012",
        role: "Sales Representative",
        quota: 100000,
        achieved: 98000,
        deals: {
            won: 10,
            inProgress: 9,
            lost: 4
        },
        pipeline: {
            prospecting: 7,
            qualified: 9,
            proposal: 4,
            negotiation: 2,
            closed: 10
        },
        metrics: {
            conversionRate: 43,
            avgDealSize: 9800,
            avgCycleTime: 35,
            activeClients: 19
        },
        recentActivity: [
            { action: "Negociación en curso", client: "BuildCo", amount: 14000, date: "Hoy" },
            { action: "Prospecto calificado", client: "DesignHub", amount: 7500, date: "Ayer" }
        ]
    },
    {
        id: "4",
        name: "Lisa Chen",
        avatar: "LC",
        email: "lisa@nortech.com",
        phone: "+52 555 3456",
        role: "Sales Representative",
        quota: 110000,
        achieved: 118000,
        deals: {
            won: 13,
            inProgress: 7,
            lost: 3
        },
        pipeline: {
            prospecting: 6,
            qualified: 7,
            proposal: 5,
            negotiation: 3,
            closed: 13
        },
        metrics: {
            conversionRate: 56,
            avgDealSize: 9077,
            avgCycleTime: 25,
            activeClients: 26
        },
        recentActivity: [
            { action: "Propuesta aceptada", client: "CloudSys", amount: 16000, date: "Hoy" },
            { action: "Reunión agendada", client: "DataFlow", amount: 9500, date: "Mañana" }
        ]
    },
    {
        id: "5",
        name: "Tomás Vargas",
        avatar: "TV",
        email: "tomas@nortech.com",
        phone: "+52 555 7890",
        role: "Junior Sales",
        quota: 80000,
        achieved: 72000,
        deals: {
            won: 8,
            inProgress: 11,
            lost: 5
        },
        pipeline: {
            prospecting: 9,
            qualified: 11,
            proposal: 3,
            negotiation: 2,
            closed: 8
        },
        metrics: {
            conversionRate: 33,
            avgDealSize: 9000,
            avgCycleTime: 42,
            activeClients: 15
        },
        recentActivity: [
            { action: "Primera llamada", client: "StartupX", amount: 5000, date: "Hoy" },
            { action: "Email de seguimiento", client: "GrowthCo", amount: 6500, date: "Ayer" }
        ]
    },
    {
        id: "6",
        name: "Ana López",
        avatar: "AL",
        email: "ana@nortech.com",
        phone: "+52 555 2468",
        role: "Sales Representative",
        quota: 115000,
        achieved: 125000,
        deals: {
            won: 14,
            inProgress: 5,
            lost: 2
        },
        pipeline: {
            prospecting: 3,
            qualified: 5,
            proposal: 6,
            negotiation: 4,
            closed: 14
        },
        metrics: {
            conversionRate: 67,
            avgDealSize: 8929,
            avgCycleTime: 19,
            activeClients: 28
        },
        recentActivity: [
            { action: "Deal cerrado", client: "RetailMax", amount: 13500, date: "Hoy" },
            { action: "Contrato firmado", client: "LogiPro", amount: 10000, date: "Hace 3 días" }
        ]
    }
];

// Calcular totales del equipo
const teamTotals = salesTeamData.reduce((acc, seller) => ({
    quota: acc.quota + seller.quota,
    achieved: acc.achieved + seller.achieved,
    won: acc.won + seller.deals.won,
    inProgress: acc.inProgress + seller.deals.inProgress,
    lost: acc.lost + seller.deals.lost
}), { quota: 0, achieved: 0, won: 0, inProgress: 0, lost: 0 });

export default function SalesReportsPage() {
    const achievementRate = ((teamTotals.achieved / teamTotals.quota) * 100).toFixed(1);
    const totalDeals = teamTotals.won + teamTotals.inProgress + teamTotals.lost;
    const winRate = ((teamTotals.won / totalDeals) * 100).toFixed(1);

    return (
        <div className="space-y-6 animate-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Reportes de Ventas</h1>
                    <p className="text-muted-foreground mt-1">Radiografía completa del equipo comercial</p>
                </div>
                <Link
                    href="/dashboard"
                    className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm font-medium transition-colors"
                >
                    Volver al Dashboard
                </Link>
            </div>

            {/* Team Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="card-premium p-5 border-l-2 border-finance/20">
                    <div className="flex items-center justify-between">
                        <div className="p-2.5 rounded-lg bg-finance/10">
                            <DollarSign className="w-5 h-5 text-finance" />
                        </div>
                        <span className="text-xs font-medium text-success">
                            {achievementRate}%
                        </span>
                    </div>
                    <div className="mt-4">
                        <p className="text-sm text-muted-foreground">Meta del Equipo</p>
                        <p className="text-2xl font-bold mt-1">${(teamTotals.achieved / 1000).toFixed(0)}K</p>
                        <p className="text-xs text-muted-foreground mt-1">de ${(teamTotals.quota / 1000).toFixed(0)}K</p>
                    </div>
                </div>

                <div className="card-premium p-5 border-l-2 border-success/20">
                    <div className="flex items-center justify-between">
                        <div className="p-2.5 rounded-lg bg-success/10">
                            <CheckCircle2 className="w-5 h-5 text-success" />
                        </div>
                        <span className="text-xs font-medium text-success">
                            {winRate}% Win Rate
                        </span>
                    </div>
                    <div className="mt-4">
                        <p className="text-sm text-muted-foreground">Deals Ganados</p>
                        <p className="text-2xl font-bold mt-1">{teamTotals.won}</p>
                        <p className="text-xs text-muted-foreground mt-1">de {totalDeals} totales</p>
                    </div>
                </div>

                <div className="card-premium p-5 border-l-2 border-warning/20">
                    <div className="flex items-center justify-between">
                        <div className="p-2.5 rounded-lg bg-warning/10">
                            <Clock className="w-5 h-5 text-warning" />
                        </div>
                    </div>
                    <div className="mt-4">
                        <p className="text-sm text-muted-foreground">En Progreso</p>
                        <p className="text-2xl font-bold mt-1">{teamTotals.inProgress}</p>
                        <p className="text-xs text-muted-foreground mt-1">oportunidades activas</p>
                    </div>
                </div>

                <div className="card-premium p-5 border-l-2 border-clients/20">
                    <div className="flex items-center justify-between">
                        <div className="p-2.5 rounded-lg bg-clients/10">
                            <Users className="w-5 h-5 text-clients" />
                        </div>
                    </div>
                    <div className="mt-4">
                        <p className="text-sm text-muted-foreground">Vendedores</p>
                        <p className="text-2xl font-bold mt-1">{salesTeamData.length}</p>
                        <p className="text-xs text-muted-foreground mt-1">miembros del equipo</p>
                    </div>
                </div>
            </div>

            {/* Individual Seller Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {salesTeamData.map((seller) => {
                    const progress = (seller.achieved / seller.quota) * 100;
                    const isOverQuota = progress >= 100;
                    const totalPipeline = Object.values(seller.pipeline).reduce((a, b) => a + b, 0);

                    return (
                        <div key={seller.id} className="card-premium p-6 space-y-6">
                            {/* Seller Header */}
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg">
                                        {seller.avatar}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-foreground">{seller.name}</h3>
                                        <p className="text-sm text-muted-foreground">{seller.role}</p>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Mail className="w-3 h-3" />
                                                {seller.email}
                                            </span>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Phone className="w-3 h-3" />
                                                {seller.phone}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                {isOverQuota && (
                                    <div className="p-2 rounded-lg bg-success/10">
                                        <Award className="w-5 h-5 text-success" />
                                    </div>
                                )}
                            </div>

                            {/* Quota Progress */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-foreground">Progreso de Meta</span>
                                    <span className={`text-sm font-bold ${isOverQuota ? 'text-success' : 'text-primary'}`}>
                                        {progress.toFixed(0)}%
                                    </span>
                                </div>
                                <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all ${isOverQuota ? 'bg-gradient-to-r from-success to-success/80' : 'bg-gradient-to-r from-primary to-primary/80'}`}
                                        style={{ width: `${Math.min(progress, 100)}%` }}
                                    />
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                    <span className="text-xs text-muted-foreground">
                                        ${(seller.achieved / 1000).toFixed(0)}K alcanzado
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        Meta: ${(seller.quota / 1000).toFixed(0)}K
                                    </span>
                                </div>
                            </div>

                            {/* Key Metrics Grid */}
                            <div className="grid grid-cols-4 gap-3">
                                <div className="text-center p-3 rounded-lg bg-muted/30 border border-border">
                                    <p className="text-xs text-muted-foreground mb-1">Conversión</p>
                                    <p className="text-lg font-bold text-foreground">{seller.metrics.conversionRate}%</p>
                                </div>
                                <div className="text-center p-3 rounded-lg bg-muted/30 border border-border">
                                    <p className="text-xs text-muted-foreground mb-1">Deal Prom.</p>
                                    <p className="text-lg font-bold text-foreground">${(seller.metrics.avgDealSize / 1000).toFixed(1)}K</p>
                                </div>
                                <div className="text-center p-3 rounded-lg bg-muted/30 border border-border">
                                    <p className="text-xs text-muted-foreground mb-1">Ciclo</p>
                                    <p className="text-lg font-bold text-foreground">{seller.metrics.avgCycleTime}d</p>
                                </div>
                                <div className="text-center p-3 rounded-lg bg-muted/30 border border-border">
                                    <p className="text-xs text-muted-foreground mb-1">Clientes</p>
                                    <p className="text-lg font-bold text-foreground">{seller.metrics.activeClients}</p>
                                </div>
                            </div>

                            {/* Pipeline Funnel */}
                            <div>
                                <h4 className="text-sm font-semibold text-foreground mb-3">Pipeline ({totalPipeline} oportunidades)</h4>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-24 text-xs text-muted-foreground font-medium">Prospección</div>
                                        <div className="flex-1 h-6 bg-muted/50 rounded-full overflow-hidden border border-white/5">
                                            <div
                                                className="h-full bg-gradient-to-r from-blue-600 to-blue-400 flex items-center justify-end pr-2 shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-500"
                                                style={{ width: `${Math.max((seller.pipeline.prospecting / totalPipeline) * 100, 15)}%` }}
                                            >
                                                <span className="text-xs font-bold text-white drop-shadow-md">{seller.pipeline.prospecting}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-24 text-xs text-muted-foreground font-medium">Calificado</div>
                                        <div className="flex-1 h-6 bg-muted/50 rounded-full overflow-hidden border border-white/5">
                                            <div
                                                className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 flex items-center justify-end pr-2 shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all duration-500"
                                                style={{ width: `${Math.max((seller.pipeline.qualified / totalPipeline) * 100, 15)}%` }}
                                            >
                                                <span className="text-xs font-bold text-white drop-shadow-md">{seller.pipeline.qualified}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-24 text-xs text-muted-foreground font-medium">Propuesta</div>
                                        <div className="flex-1 h-6 bg-muted/50 rounded-full overflow-hidden border border-white/5">
                                            <div
                                                className="h-full bg-gradient-to-r from-amber-600 to-amber-400 flex items-center justify-end pr-2 shadow-[0_0_10px_rgba(245,158,11,0.5)] transition-all duration-500"
                                                style={{ width: `${Math.max((seller.pipeline.proposal / totalPipeline) * 100, 15)}%` }}
                                            >
                                                <span className="text-xs font-bold text-white drop-shadow-md">{seller.pipeline.proposal}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-24 text-xs text-muted-foreground font-medium">Negociación</div>
                                        <div className="flex-1 h-6 bg-muted/50 rounded-full overflow-hidden border border-white/5">
                                            <div
                                                className="h-full bg-gradient-to-r from-purple-600 to-purple-400 flex items-center justify-end pr-2 shadow-[0_0_10px_rgba(168,85,247,0.5)] transition-all duration-500"
                                                style={{ width: `${Math.max((seller.pipeline.negotiation / totalPipeline) * 100, 15)}%` }}
                                            >
                                                <span className="text-xs font-bold text-white drop-shadow-md">{seller.pipeline.negotiation}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-24 text-xs text-muted-foreground font-medium">Cerrados</div>
                                        <div className="flex-1 h-6 bg-muted/50 rounded-full overflow-hidden border border-white/5">
                                            <div
                                                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 flex items-center justify-end pr-2 shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-500"
                                                style={{ width: `${Math.max((seller.pipeline.closed / totalPipeline) * 100, 15)}%` }}
                                            >
                                                <span className="text-xs font-bold text-white drop-shadow-md">{seller.pipeline.closed}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Deals Summary */}
                            <div className="flex items-center justify-between pt-4 border-t border-border">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1">
                                        <CheckCircle2 className="w-4 h-4 text-success" />
                                        <span className="text-sm font-medium text-success">{seller.deals.won} Ganados</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-4 h-4 text-warning" />
                                        <span className="text-sm font-medium text-warning">{seller.deals.inProgress} En curso</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <XCircle className="w-4 h-4 text-danger" />
                                        <span className="text-sm font-medium text-danger">{seller.deals.lost} Perdidos</span>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Activity */}
                            <div>
                                <h4 className="text-sm font-semibold text-foreground mb-3">Actividad Reciente</h4>
                                <div className="space-y-2">
                                    {seller.recentActivity.map((activity, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm font-medium text-foreground">{activity.action}</p>
                                                    <p className="text-xs text-muted-foreground">{activity.client} • ${(activity.amount / 1000).toFixed(1)}K</p>
                                                </div>
                                            </div>
                                            <span className="text-xs text-muted-foreground">{activity.date}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
