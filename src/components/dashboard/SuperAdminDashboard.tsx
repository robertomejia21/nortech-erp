"use client";

import { analyzeBusinessHealth } from "@/lib/businessLogic";
import {
    Activity,
    TrendingUp,
    TrendingDown,
    DollarSign,
    FileText,
    Package,
    Users,
    ArrowRight,
    Zap,
    AlertTriangle,
    CheckCircle2
} from "lucide-react";
import Link from "next/link";

interface SuperAdminDashboardProps {
    stats: any[];
    shortcuts: any[];
}

export default function SuperAdminDashboard({ stats, shortcuts }: SuperAdminDashboardProps) {
    // 1. Simulate aggregated data for analysis (In a real app, this comes from an API)
    const currentStats = {
        revenue: 1240500, // From page.tsx mock
        pendingQuotes: 45,
        activeDeals: 12,
        netProfit: 320000
    };

    // 2. Get AI Sentiment
    const pulse = analyzeBusinessHealth(currentStats);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* --- COMPANY PULSE SECTION --- */}
            <section className={`rounded-3xl p-8 border ${pulse.color} bg-card relative overflow-hidden shadow-lg group`}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-current opacity-[0.03] rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
                    <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="text-4xl filter drop-shadow-md animate-bounce-slow">{pulse.icon}</span>
                            <h2 className="text-2xl font-bold tracking-tight text-foreground">
                                {pulse.title}
                            </h2>
                        </div>

                        <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
                            {pulse.message}
                        </p>

                        <div className="flex items-center gap-2 text-sm font-medium bg-background/50 w-fit px-4 py-2 rounded-full border border-border/50 backdrop-blur-sm">
                            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                            <span className="text-foreground">Recomendación Estratégica:</span>
                            <span className="text-muted-foreground">{pulse.recommendation}</span>
                        </div>
                    </div>

                    {/* Quick Vital Stats */}
                    <div className="flex gap-8 border-l border-border/50 pl-8 hidden md:flex">
                        <div>
                            <p className="text-sm text-muted-foreground">Utilidad Neta</p>
                            <p className="text-2xl font-bold text-foreground tracking-tight">
                                ${currentStats.netProfit.toLocaleString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Conversión</p>
                            <p className="text-2xl font-bold text-foreground tracking-tight">
                                4.2% <span className="text-sm text-muted-foreground font-normal">vs mes ant.</span>
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- KEY METRICS GRID --- */}
            <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Métricas Clave
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => {
                    const colorClasses = [
                        { bg: 'bg-finance/10 dark:bg-finance/20', text: 'text-finance', border: 'border-finance/20' },
                        { bg: 'bg-sales/10 dark:bg-sales/20', text: 'text-sales', border: 'border-sales/20' },
                        { bg: 'bg-inventory/10 dark:bg-inventory/20', text: 'text-inventory', border: 'border-inventory/20' },
                        { bg: 'bg-finance/10 dark:bg-finance/20', text: 'text-finance', border: 'border-finance/20' },
                    ][index];

                    return (
                        <div key={stat.title} className={`card-premium p-5 group bg-card border-l-2 ${colorClasses.border} hover:shadow-md transition-all duration-300`}>
                            <div className="flex items-start justify-between">
                                <div className={`p-2.5 rounded-lg ${colorClasses.bg}`}>
                                    <stat.icon className={`w-5 h-5 ${colorClasses.text}`} />
                                </div>
                                {stat.trend === "up" && (
                                    <span className="stat-change-positive flex items-center gap-1 bg-success/10 px-2 py-0.5 rounded-full text-xs">
                                        <TrendingUp className="w-3 h-3" />
                                        {stat.change}
                                    </span>
                                )}
                                {stat.trend === "down" && (
                                    <span className="stat-change-negative flex items-center gap-1 bg-destructive/10 px-2 py-0.5 rounded-full text-xs">
                                        <TrendingDown className="w-3 h-3" />
                                        {stat.change}
                                    </span>
                                )}
                                {stat.trend === "neutral" && (
                                    <span className="badge-warning text-xs">
                                        {stat.change}
                                    </span>
                                )}
                            </div>
                            <div className="mt-4">
                                <p className="stat-label">{stat.title}</p>
                                <p className="stat-value mt-1">{stat.value}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* --- QUICK ACCESS --- */}
            <div className="bg-gradient-to-br from-card to-background border border-border rounded-3xl p-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-semibold text-foreground">Accesos Rápidos</h3>
                        <p className="text-muted-foreground text-sm">Herramientas de gestión administrativa</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {shortcuts.map((shortcut) => (
                        <Link
                            key={shortcut.name}
                            href={shortcut.href}
                            className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-muted/30 border border-border hover:border-primary/50 hover:bg-muted/50 transition-all group shadow-sm hover:shadow-lg hover:-translate-y-1"
                        >
                            <div className="p-4 rounded-xl bg-background group-hover:bg-primary/10 dark:group-hover:bg-primary/20 transition-colors shadow-inner ring-1 ring-border/50">
                                <shortcut.icon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <span className="text-sm font-medium text-foreground text-center">{shortcut.name}</span>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
