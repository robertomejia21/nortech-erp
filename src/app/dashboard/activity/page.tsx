"use client";

import { useState } from "react";
import {
    Clock,
    Filter,
    Search,
    FileText,
    Package,
    DollarSign,
    Users,
    TrendingUp,
    AlertCircle,
    CheckCircle2,
    XCircle,
    ArrowLeft
} from "lucide-react";
import Link from "next/link";

type ActivityType = 'all' | 'quotes' | 'invoices' | 'shipments' | 'clients' | 'system';

interface Activity {
    id: string;
    user: string;
    action: string;
    target: string;
    time: string;
    timestamp: Date;
    avatar: string;
    type: ActivityType;
    status?: 'success' | 'warning' | 'error' | 'info';
}

const allActivities: Activity[] = [
    {
        id: '1',
        user: "Juan D.",
        action: "creó factura",
        target: "#INV-4402 • $1,200.00",
        time: "10m",
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
        avatar: "JD",
        type: 'invoices',
        status: 'success'
    },
    {
        id: '2',
        user: "Sistema Logística",
        action: "actualizó envío",
        target: "#992 a 'En Camino'",
        time: "30m",
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        avatar: "SL",
        type: 'shipments',
        status: 'info'
    },
    {
        id: '3',
        user: "Sara M.",
        action: "agregó prospecto",
        target: "TechCorp Inc. • Potencial Alto",
        time: "1h",
        timestamp: new Date(Date.now() - 60 * 60 * 1000),
        avatar: "SM",
        type: 'clients',
        status: 'success'
    },
    {
        id: '4',
        user: "Miguel K.",
        action: "rechazó cotización",
        target: "#QT-2021 • Disputa de precio",
        time: "2h",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        avatar: "MK",
        type: 'quotes',
        status: 'warning'
    },
    {
        id: '5',
        user: "Ana López",
        action: "aprobó cotización",
        target: "#QT-2020 • $5,400.00",
        time: "3h",
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
        avatar: "AL",
        type: 'quotes',
        status: 'success'
    },
    {
        id: '6',
        user: "Sistema",
        action: "generó reporte",
        target: "Ventas Q3 2024",
        time: "4h",
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        avatar: "SY",
        type: 'system',
        status: 'info'
    },
    {
        id: '7',
        user: "Roberto Almacén",
        action: "recibió mercancía",
        target: "OC-#445 • 250 unidades",
        time: "5h",
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
        avatar: "RA",
        type: 'shipments',
        status: 'success'
    },
    {
        id: '8',
        user: "Laura Contabilidad",
        action: "procesó pago",
        target: "#PAY-1123 • $8,900.00",
        time: "6h",
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
        avatar: "LC",
        type: 'invoices',
        status: 'success'
    },
    {
        id: '9',
        user: "Jaime Ventas",
        action: "actualizó cliente",
        target: "Industrias XYZ • Nuevo contacto",
        time: "7h",
        timestamp: new Date(Date.now() - 7 * 60 * 60 * 1000),
        avatar: "JV",
        type: 'clients',
        status: 'info'
    },
    {
        id: '10',
        user: "Sistema",
        action: "envió recordatorio",
        target: "Factura vencida #INV-4301",
        time: "8h",
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
        avatar: "SY",
        type: 'system',
        status: 'warning'
    },
];

const filterOptions: { value: ActivityType; label: string; icon: any }[] = [
    { value: 'all', label: 'Todas', icon: Filter },
    { value: 'quotes', label: 'Cotizaciones', icon: FileText },
    { value: 'invoices', label: 'Facturas', icon: DollarSign },
    { value: 'shipments', label: 'Envíos', icon: Package },
    { value: 'clients', label: 'Clientes', icon: Users },
    { value: 'system', label: 'Sistema', icon: TrendingUp },
];

export default function ActivityPage() {
    const [filter, setFilter] = useState<ActivityType>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredActivities = allActivities.filter(activity => {
        const matchesFilter = filter === 'all' || activity.type === filter;
        const matchesSearch = searchQuery === '' ||
            activity.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
            activity.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
            activity.target.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesFilter && matchesSearch;
    });

    const getStatusIcon = (status?: string) => {
        switch (status) {
            case 'success':
                return <CheckCircle2 className="w-4 h-4 text-success" />;
            case 'warning':
                return <AlertCircle className="w-4 h-4 text-warning" />;
            case 'error':
                return <XCircle className="w-4 h-4 text-destructive" />;
            default:
                return <Clock className="w-4 h-4 text-primary" />;
        }
    };

    return (
        <div className="space-y-6 animate-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard"
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">
                            Actividad del Sistema
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Historial completo de acciones y eventos
                        </p>
                    </div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="card-premium p-6">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Buscar actividad..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input-field pl-10 w-full"
                        />
                    </div>

                    {/* Filter Buttons */}
                    <div className="flex gap-2 flex-wrap">
                        {filterOptions.map((option) => {
                            const Icon = option.icon;
                            const isActive = filter === option.value;

                            return (
                                <button
                                    key={option.value}
                                    onClick={() => setFilter(option.value)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${isActive
                                            ? 'bg-primary text-primary-foreground border-primary'
                                            : 'bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span className="text-sm font-medium">{option.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Activity List */}
            <div className="card-premium p-6">
                <div className="space-y-1">
                    {filteredActivities.length === 0 ? (
                        <div className="text-center py-12">
                            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">
                                No se encontraron actividades
                            </p>
                        </div>
                    ) : (
                        filteredActivities.map((activity) => (
                            <div
                                key={activity.id}
                                className="flex items-start gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors border-b border-border last:border-0"
                            >
                                {/* Avatar */}
                                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm font-mono">
                                    {activity.avatar}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-sm text-foreground">
                                                <span className="font-medium">{activity.user}</span>
                                                <span className="text-muted-foreground"> {activity.action}</span>
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {activity.target}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-2">
                                                {activity.timestamp.toLocaleString('es-MX', {
                                                    weekday: 'short',
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            {getStatusIcon(activity.status)}
                                            <span className="text-xs text-muted-foreground">
                                                {activity.time}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
