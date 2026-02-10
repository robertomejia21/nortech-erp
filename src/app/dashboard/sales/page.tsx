"use client";

import Link from "next/link";
import { Users, FilePlus, Archive, TrendingUp, DollarSign, Clock } from "lucide-react";

const quickActions = [
    {
        name: "Mis Clientes",
        description: "Ver cartera y prospectos",
        href: "/dashboard/sales/clients",
        icon: Users,
        color: "emerald"
    },
    {
        name: "Nueva Cotización",
        description: "Crear propuesta comercial",
        href: "/dashboard/sales/quotes/new",
        icon: FilePlus,
        color: "amber"
    },
    {
        name: "Historial",
        description: "Cotizaciones enviadas",
        href: "/dashboard/sales/quotes",
        icon: Archive,
        color: "blue"
    },
];

const stats = [
    { label: "Cotizaciones Este Mes", value: "12", icon: FilePlus, color: "blue" },
    { label: "Monto Total Cotizado", value: "$45,230", icon: DollarSign, color: "emerald" },
    { label: "Cotizaciones Pendientes", value: "5", icon: Clock, color: "amber" },
    { label: "Tasa de Conversión", value: "68%", icon: TrendingUp, color: "purple" },
];

export default function SalesDashboardPage() {
    return (
        <div className="space-y-6 animate-in">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground">Panel de Ventas</h1>
                <p className="text-muted-foreground mt-1">Gestiona tus clientes y cotizaciones</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <div key={stat.label} className="card-premium p-5 bg-card">
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-lg bg-accent-${stat.color}/10 dark:bg-accent-${stat.color}/20`}>
                                <stat.icon className={`w-5 h-5 text-accent-${stat.color}`} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                                <p className="text-sm text-muted-foreground">{stat.label}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-lg font-semibold text-foreground mb-4">Acciones Rápidas</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {quickActions.map((action) => (
                        <Link
                            key={action.name}
                            href={action.href}
                            className="card-premium p-6 group bg-card"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl bg-accent-${action.color}/10 dark:bg-accent-${action.color}/20 group-hover:bg-accent-${action.color}/20 dark:group-hover:bg-accent-${action.color}/30 transition-colors shadow-sm`}>
                                    <action.icon className={`w-6 h-6 text-accent-${action.color}`} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground group-hover:text-accent-blue transition-colors">
                                        {action.name}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">{action.description}</p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Recent Quotes Preview */}
            <div className="card-premium p-6 bg-card">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-foreground">Cotizaciones Recientes</h2>
                    <Link href="/dashboard/sales/quotes" className="text-sm text-accent-blue hover:underline">
                        Ver Todas
                    </Link>
                </div>
                <div className="text-center py-8">
                    <Archive className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                    <p className="text-muted-foreground">No hay cotizaciones recientes</p>
                    <Link href="/dashboard/sales/quotes/new" className="btn-primary inline-flex mt-4 gap-2">
                        <FilePlus className="w-4 h-4" />
                        Crear Primera Cotización
                    </Link>
                </div>
            </div>
        </div>
    );
}
