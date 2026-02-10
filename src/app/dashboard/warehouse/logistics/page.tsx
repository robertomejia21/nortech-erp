"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { Link, MapPin, Truck, Calendar, Clock, Download, Plus, Search, Filter } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Define TypeScript Interfaces for Logistics Data
interface Shipment {
    id: string;
    trackingNumber: string;
    carrier: string;
    status: 'pending' | 'in_transit' | 'delivered' | 'delayed' | 'cancelled';
    origin: string;
    destination: string;
    estimatedDelivery: any; // Firestore Timestamp
    actualDelivery?: any;
    itemsCount: number;
    weight: number; // in kg
    cost: number;
}

const mockShipments: Shipment[] = [
    {
        id: "1",
        trackingNumber: "TRK-8829103",
        carrier: "FedEx",
        status: "in_transit",
        origin: "Monterrey, NL",
        destination: "Ciudad de México, CDMX",
        estimatedDelivery: { seconds: Date.now() / 1000 + 86400 }, // tomorrow
        itemsCount: 120,
        weight: 450.5,
        cost: 3200.00
    },
    {
        id: "2",
        trackingNumber: "DHL-992831",
        carrier: "DHL Express",
        status: "delivered",
        origin: "Guadalajara, JAL",
        destination: "Monterrey, NL",
        estimatedDelivery: { seconds: Date.now() / 1000 - 86400 }, // yesterday
        actualDelivery: { seconds: Date.now() / 1000 - 80000 },
        itemsCount: 50,
        weight: 120.0,
        cost: 1500.00
    },
    {
        id: "3",
        trackingNumber: "EST-7721",
        carrier: "Estafeta",
        status: "pending",
        origin: "Laredo, TX",
        destination: "Monterrey, NL",
        estimatedDelivery: { seconds: Date.now() / 1000 + 172800 }, // 2 days
        itemsCount: 1500,
        weight: 2300.0,
        cost: 12500.00
    },
    {
        id: "4",
        trackingNumber: "UPS-5512",
        carrier: "UPS",
        status: "delayed",
        origin: "Tijuana, BC",
        destination: "Cancún, QR",
        estimatedDelivery: { seconds: Date.now() / 1000 + 432000 }, // 5 days
        itemsCount: 10,
        weight: 25.0,
        cost: 850.00
    }
];

export default function LogisticsPage() {
    const { user } = useAuthStore();
    const [shipments, setShipments] = useState<Shipment[]>(mockShipments); // Use mock for now, replace with diff query later
    const [loading, setLoading] = useState(false); // Set to true if fetching real data
    const [filterStatus, setFilterStatus] = useState<string>("all");

    // Example fetch logic (commented out until collection exists)
    /*
    useEffect(() => {
        const fetchShipments = async () => {
             setLoading(true);
             try {
                 const q = query(collection(db, "shipments"), orderBy("createdAt", "desc"), limit(20));
                 const snapshot = await getDocs(q);
                 const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Shipment));
                 setShipments(data);
             } catch (error) {
                 console.error("Error fetching shipments:", error);
             } finally {
                 setLoading(false);
             }
        };
        fetchShipments();
    }, []);
    */

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'delivered': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
            case 'in_transit': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
            case 'pending': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
            case 'delayed': return 'bg-red-500/10 text-red-600 border-red-500/20';
            default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'delivered': return 'Entregado';
            case 'in_transit': return 'En Tránsito';
            case 'pending': return 'Pendiente';
            case 'delayed': return 'Retrasado';
            case 'cancelled': return 'Cancelado';
            default: return status;
        }
    };

    const filteredShipments = filterStatus === "all"
        ? shipments
        : shipments.filter(s => s.status === filterStatus);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Logística y Envíos</h1>
                    <p className="text-muted-foreground mt-1">Gestiona el flujo de mercancías, rastreo y entregas.</p>
                </div>
                <div className="flex gap-2">
                    <button className="btn-secondary flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Exportar Reporte
                    </button>
                    <button className="btn-primary flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Nuevo Envío
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="card-premium p-4 flex flex-col justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Envíos Activos</p>
                        <h3 className="text-2xl font-bold text-foreground mt-2">{shipments.filter(s => s.status === 'in_transit').length}</h3>
                    </div>
                    <div className="mt-4 flex items-center text-xs text-blue-500">
                        <Truck className="w-3 h-3 mr-1" />
                        En camino
                    </div>
                </div>
                <div className="card-premium p-4 flex flex-col justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Entregas Hoy</p>
                        <h3 className="text-2xl font-bold text-foreground mt-2">
                            {shipments.filter(s => s.status === 'delivered').length} {/* Mock logic */}
                        </h3>
                    </div>
                    <div className="mt-4 flex items-center text-xs text-emerald-500">
                        <Calendar className="w-3 h-3 mr-1" />
                        Completados
                    </div>
                </div>
                <div className="card-premium p-4 flex flex-col justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Retrasos</p>
                        <h3 className="text-2xl font-bold text-foreground mt-2">{shipments.filter(s => s.status === 'delayed').length}</h3>
                    </div>
                    <div className="mt-4 flex items-center text-xs text-red-500">
                        <Clock className="w-3 h-3 mr-1" />
                        Requieren Atención
                    </div>
                </div>
                <div className="card-premium p-4 flex flex-col justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Costo Logístico (Mes)</p>
                        <h3 className="text-2xl font-bold text-foreground mt-2">{formatCurrency(shipments.reduce((acc, curr) => acc + curr.cost, 0))}</h3>
                    </div>
                    <div className="mt-4 flex items-center text-xs text-muted-foreground">
                        Total acumulado
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Shipments List */}
                <div className="lg:col-span-2 card-premium p-0 overflow-hidden bg-card border-border">
                    <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
                        <h3 className="font-bold text-foreground">Envíos Recientes</h3>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Buscar guía..."
                                    className="h-8 pl-8 pr-3 text-xs bg-background border border-border rounded-lg focus:outline-none focus:border-accent-blue w-40"
                                />
                            </div>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="h-8 text-xs bg-background border border-border rounded-lg px-2 focus:outline-none focus:border-accent-blue"
                            >
                                <option value="all">Todos los estados</option>
                                <option value="in_transit">En Tránsito</option>
                                <option value="delivered">Entregados</option>
                                <option value="pending">Pendientes</option>
                                <option value="delayed">Retrasados</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                                <tr>
                                    <th className="px-4 py-3 text-left">Guía / Carrier</th>
                                    <th className="px-4 py-3 text-left">Ruta</th>
                                    <th className="px-4 py-3 text-left">Estado</th>
                                    <th className="px-4 py-3 text-right">Entrega Est.</th>
                                    <th className="px-4 py-3 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredShipments.map((shipment) => (
                                    <tr key={shipment.id} className="hover:bg-muted/30 transition-colors group">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-foreground">{shipment.trackingNumber}</div>
                                            <div className="text-xs text-muted-foreground">{shipment.carrier}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center text-xs">
                                                    <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                                                    <span className="truncate max-w-[120px]" title={shipment.origin}>{shipment.origin}</span>
                                                </div>
                                                <div className="flex items-center text-xs">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></div>
                                                    <span className="truncate max-w-[120px]" title={shipment.destination}>{shipment.destination}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusColor(shipment.status)}`}>
                                                {getStatusLabel(shipment.status)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right text-muted-foreground">
                                            {new Date(shipment.estimatedDelivery.seconds * 1000).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button className="text-accent-blue hover:text-accent-blue/80 text-xs font-medium hover:underline">
                                                Ver Detalles
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredShipments.length === 0 && (
                            <div className="py-12 text-center text-muted-foreground">
                                No se encontraron envíos con los filtros actuales.
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar / Quick Actions */}
                <div className="space-y-6">
                    {/* Map Placeholder */}
                    <div className="card-premium p-4 bg-card h-64 flex flex-col relative overflow-hidden group">
                        <div className="absolute inset-0 bg-accent-blue/5 z-0"></div>
                        {/* This would be a real map in production */}
                        <div className="flex-1 flex items-center justify-center border-2 border-dashed border-accent-blue/20 rounded-lg bg-background/50 z-10">
                            <div className="text-center">
                                <MapPin className="w-8 h-8 text-accent-blue mx-auto mb-2 animate-bounce" />
                                <p className="text-sm font-medium text-muted-foreground">Mapa en Tiempo Real</p>
                                <p className="text-xs text-muted-foreground/60">(Próximamente)</p>
                            </div>
                        </div>
                        <div className="mt-4 z-10">
                            <h3 className="font-bold text-foreground">Rastreo en Vivo</h3>
                            <p className="text-xs text-muted-foreground">Visualiza la ubicación de tu flota.</p>
                        </div>
                    </div>

                    {/* Carriers Performance */}
                    <div className="card-premium p-4">
                        <h3 className="font-bold text-foreground mb-4">Rendimiento de Carriers</h3>
                        <div className="space-y-4">
                            {[
                                { name: "DHL Express", score: 98, color: "bg-yellow-500" },
                                { name: "FedEx", score: 92, color: "bg-purple-500" },
                                { name: "Estafeta", score: 85, color: "bg-red-500" },
                            ].map((carrier) => (
                                <div key={carrier.name}>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="font-medium text-foreground">{carrier.name}</span>
                                        <span className="text-muted-foreground">{carrier.score}% a tiempo</span>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${carrier.color}`}
                                            style={{ width: `${carrier.score}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
