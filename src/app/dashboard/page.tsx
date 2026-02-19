"use client";

import { useAuthStore } from "@/store/useAuthStore";
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    FileText,
    Package,
    Users,
    ArrowUpRight,
    Clock,
    CheckCircle2,
    AlertCircle
} from "lucide-react";
import Link from "next/link";
import SalesDashboard from "@/components/dashboard/SalesDashboard";
import SuperAdminDashboard from "@/components/dashboard/SuperAdminDashboard";
import AdminDashboard from "@/components/dashboard/AdminDashboard";

const stats = [
    {
        title: "Ingresos Totales",
        value: "$1,240,500",
        change: "+12.5%",
        trend: "up",
        icon: DollarSign,
        accent: "blue",
    },
    {
        title: "Cotizaciones Pendientes",
        value: "45",
        change: "Requiere Acción",
        trend: "neutral",
        icon: FileText,
        accent: "amber",
    },
    {
        title: "Envíos Activos",
        value: "12",
        change: "-2.0%",
        trend: "down",
        icon: Package,
        accent: "purple",
    },
    {
        title: "Utilidad Neta",
        value: "$320,000",
        change: "+8.2%",
        trend: "up",
        icon: TrendingUp,
        accent: "emerald",
    },
];

const salesData = [
    { name: "Sara", value: 65, quota: 165, target: 150, conversion: 52, deals: 12 },
    { name: "Jaime", value: 85, quota: 135, target: 120, conversion: 65, deals: 15 },
    { name: "Miguel", value: 70, quota: 98, target: 100, conversion: 43, deals: 10 },
    { name: "Lisa", value: 75, quota: 118, target: 110, conversion: 56, deals: 13 },
    { name: "Tomás", value: 60, quota: 72, target: 80, conversion: 33, deals: 8 },
    { name: "Ana", value: 80, quota: 125, target: 115, conversion: 67, deals: 14 },
];

const recentActivity = [
    {
        user: "Juan D.",
        action: "creó factura",
        target: "#INV-4402 • $1,200.00",
        time: "10m",
        avatar: "JD",
        color: "bg-accent-emerald",
    },
    {
        user: "Sistema Logística",
        action: "actualizó envío",
        target: "#992 a 'En Camino'",
        time: "30m",
        avatar: "SL",
        color: "bg-accent-purple",
    },
    {
        user: "Sara M.",
        action: "agregó prospecto",
        target: "TechCorp Inc. • Potencial Alto",
        time: "1h",
        avatar: "SM",
        color: "bg-accent-blue",
    },
    {
        user: "Miguel K.",
        action: "rechazó cotización",
        target: "#QT-2021 • Disputa de precio",
        time: "2h",
        avatar: "MK",
        color: "bg-accent-amber",
    },
];

const shortcuts = {
    SUPERADMIN: [
        { name: "Gestión de Usuarios", icon: Users, href: "/dashboard/users" },
        { name: "Finanzas Globales", icon: DollarSign, href: "/dashboard/finance" },
        { name: "Catálogo de Productos", icon: Package, href: "/dashboard/sales/products" },
        { name: "Reportes de Ventas", icon: TrendingUp, href: "/dashboard/sales/reports" },
    ],
    ADMIN: [
        { name: "Nueva Cotización", icon: FileText, href: "/dashboard/sales/quotes" },
        { name: "Ver Clientes", icon: Users, href: "/dashboard/sales/clients" },
        { name: "Revisar Almacén", icon: Package, href: "/dashboard/warehouse" },
        { name: "Estado Financiero", icon: DollarSign, href: "/dashboard/finance" },
    ],
    SALES: [
        { name: "Nueva Cotización", icon: FileText, href: "/dashboard/sales/quotes" },
        { name: "Ver Clientes", icon: Users, href: "/dashboard/sales/clients" },
        { name: "Mis Ventas", icon: TrendingUp, href: "/dashboard/sales/orders" },
    ],
    WAREHOUSE: [
        { name: "Recepción", icon: Package, href: "/dashboard/warehouse/receivals" },
        { name: "Inventario", icon: CheckCircle2, href: "/dashboard/warehouse/inventory" },
    ],
    FINANCE: [
        { name: "Facturación", icon: FileText, href: "/dashboard/finance/invoices" },
        { name: "Cuentas por Cobrar", icon: DollarSign, href: "/dashboard/finance/receivables" },
    ]
};

export default function DashboardPage() {
    const { user, role } = useAuthStore();

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Buenos Días";
        if (hour < 18) return "Buenas Tardes";
        return "Buenas Noches";
    };

    return (
        <div className="space-y-6 animate-in">
            {/* Shared Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">
                        {getGreeting()}, <span className="text-primary">{user?.displayName?.split(" ")[0] || "Usuario"}</span>
                    </h1>
                    <p className="text-muted-foreground mt-1 text-lg">
                        {role === 'SALES'
                            ? "Aquí tienes un resumen de tu rendimiento y cartera."
                            : "Esto es lo que está pasando con la empresa hoy."
                        }
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-card border border-border px-4 py-2.5 rounded-xl shadow-sm">
                        <Clock className="w-4 h-4 text-primary" />
                        <span className="font-medium">{new Date().toLocaleDateString("es-MX", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
                    </div>
                </div>
            </div>

            {/* Role-Specific Dashboard Content */}
            {role === 'SALES' ? (
                <SalesDashboard />
            ) : role === 'SUPERADMIN' ? (
                <SuperAdminDashboard
                    stats={stats}
                    shortcuts={shortcuts['SUPERADMIN'] || []}
                />
            ) : role === 'ADMIN' ? (
                <AdminDashboard
                    stats={stats}
                    shortcuts={shortcuts['ADMIN'] || []}
                />
            ) : (
                <div className="space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {stats.map((stat, index) => {
                            const colorClasses = [
                                { bg: 'bg-finance/10 dark:bg-finance/20', text: 'text-finance', border: 'border-finance/20' },
                                { bg: 'bg-sales/10 dark:bg-sales/20', text: 'text-sales', border: 'border-sales/20' },
                                { bg: 'bg-inventory/10 dark:bg-inventory/20', text: 'text-inventory', border: 'border-inventory/20' },
                                { bg: 'bg-finance/10 dark:bg-finance/20', text: 'text-finance', border: 'border-finance/20' },
                            ][index];

                            return (
                                <div key={stat.title} className={`card-premium p-5 group bg-card border-l-2 ${colorClasses.border}`}>
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

                    {/* Charts and Activity Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 card-premium p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-foreground">Ventas por Representante</h3>
                                    <p className="text-sm text-muted-foreground">Resumen del Tercer Trimestre</p>
                                </div>
                                <Link
                                    href="/dashboard/sales/reports"
                                    className="text-primary text-sm font-medium flex items-center gap-1 hover:underline"
                                >
                                    Ver Reporte Completo
                                    <ArrowUpRight className="w-4 h-4" />
                                </Link>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {salesData.map((person) => {
                                    const progress = (person.quota / person.target) * 100;
                                    const isOverQuota = progress >= 100;

                                    return (
                                        <Link
                                            key={person.name}
                                            href="/dashboard/sales/reports"
                                            className="flex flex-col items-center gap-4 p-5 rounded-xl bg-muted/30 border border-border hover:border-primary/50 hover:bg-muted/50 transition-all group shadow-sm hover:shadow-md cursor-pointer"
                                        >
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm group-hover:scale-110 transition-transform">
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
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="card-premium p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-foreground">Actividad Reciente</h3>
                                    <p className="text-sm text-muted-foreground">Últimas acciones del sistema</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {recentActivity.map((activity, i) => (
                                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                                        <div className={`w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm font-mono`}>
                                            {activity.avatar}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-foreground">
                                                <span className="font-medium">{activity.user}</span>
                                                <span className="text-muted-foreground"> {activity.action}</span>
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">{activity.target}</p>
                                        </div>
                                        <span className="text-xs text-muted-foreground flex-shrink-0">{activity.time}</span>
                                    </div>
                                ))}
                            </div>

                            <Link
                                href="/dashboard/activity"
                                className="w-full mt-4 block text-center text-sm text-primary hover:text-primary/80 transition-colors font-medium border border-border hover:border-primary/50 rounded-lg py-2.5 hover:bg-primary/5"
                            >
                                Ver Toda la Actividad
                            </Link>
                        </div>
                    </div>

                    {/* Quick Shortcuts */}
                    <div className="card-premium p-6 bg-card">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Accesos Rápidos</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {(shortcuts[role as keyof typeof shortcuts] || shortcuts.ADMIN).map((shortcut) => (
                                <Link
                                    key={shortcut.name}
                                    href={shortcut.href}
                                    className="flex flex-col items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border hover:border-primary/50 hover:bg-muted/50 transition-all group shadow-sm hover:shadow-md"
                                >
                                    <div className="p-3 rounded-lg bg-background group-hover:bg-primary/10 dark:group-hover:bg-primary/20 transition-colors shadow-inner">
                                        <shortcut.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                    </div>
                                    <span className="text-sm font-medium text-foreground">{shortcut.name}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
