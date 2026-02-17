"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthStore } from "@/store/useAuthStore";
import { Plus, Search, UserCircle, Briefcase, Filter, BarChart, CheckCircle2, Clock, MoveRight, MoreHorizontal, AtSign, MapPin, ArrowUpRight } from "lucide-react";

type Client = {
    id: string;
    razonSocial: string;
    email: string;
    rfc: string;
    status: "ACTIVE" | "DRAFT";
    taxRate: number;
};

export default function ClientsPage() {
    const { user, role } = useAuthStore();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        if (user && role) {
            // OPTIMIZATION: Load from cache first
            const cacheKey = `clients_list_${user.uid}`;
            const cached = localStorage.getItem(cacheKey);
            let isBackground = false;

            if (cached) {
                try {
                    setClients(JSON.parse(cached));
                    setLoading(false);
                    isBackground = true;
                } catch (e) {
                    console.error("Cache parse error", e);
                }
            }
            fetchClients(isBackground);
        }
    }, [user, role]);

    const fetchClients = async (isBackground = false) => {
        if (!user || !role) return;
        if (!isBackground) setLoading(true);
        try {
            let q;
            if (role === 'SUPERADMIN' || role === 'ADMIN') {
                q = query(collection(db, "clients"));
            } else {
                q = query(
                    collection(db, "clients"),
                    where("salesRepId", "==", user.uid)
                );
            }

            const querySnapshot = await getDocs(q);
            const list: Client[] = [];
            querySnapshot.forEach((doc) => {
                list.push({ id: doc.id, ...doc.data() } as Client);
            });
            setClients(list);

            // Update cache
            if (user?.uid) {
                localStorage.setItem(`clients_list_${user.uid}`, JSON.stringify(list));
            }
        } catch (error) {
            console.error("Error fetching clients:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredClients = clients.filter(client =>
        client.razonSocial?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.rfc?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 min-h-screen pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">Clientes</h1>
                    <p className="text-muted-foreground mt-1">Gestiona tus relaciones comerciales</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Buscar cliente..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-card border border-border rounded-full py-2 pl-10 pr-4 text-sm w-64 focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm hover:shadow-md"
                        />
                    </div>
                    <button className="p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors">
                        <Filter className="w-5 h-5" />
                    </button>
                    <Link
                        href="/dashboard/sales/clients/new"
                        className="bg-primary text-primary-foreground px-5 py-2.5 rounded-full font-medium hover:opacity-90 transition-all shadow-md hover:shadow-lg flex items-center gap-2 text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Nuevo Cliente</span>
                    </Link>
                </div>
            </div>

            {/* Metrics Section (Visual placeholder to match design) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-2 bg-card rounded-3xl p-6 border border-border shadow-sm">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-foreground">Nuevos Clientes</h3>
                            <p className="text-sm text-muted-foreground">Rendimiento mensual</p>
                        </div>
                        <BarChart className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex items-end gap-2 h-32 w-full mt-4 justify-between px-4">
                        {[40, 65, 45, 80, 55, 70, 40, 60].map((h, i) => (
                            <div key={i} className="w-full bg-muted/40 rounded-t-lg relative group">
                                <div
                                    className="absolute bottom-0 left-0 right-0 bg-primary/20 group-hover:bg-primary/40 transition-colors rounded-t-lg"
                                    style={{ height: `${h}%` }}
                                >
                                    {h === 80 && ( // Highlight peak
                                        <div className="absolute inset-0 bg-primary rounded-t-lg opacity-100" />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-muted-foreground px-2">
                        <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                    </div>
                </div>

                <div className="bg-card rounded-3xl p-6 border border-border shadow-sm flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-accent-blue/10 rounded-full blur-3xl rounded-bl-none" />
                    <div className="relative">
                        <h3 className="text-4xl font-bold text-foreground mb-1">{clients.length}</h3>
                        <p className="text-sm text-muted-foreground">Clientes Totales</p>
                    </div>

                    <div className="relative mt-8">
                        <div className="flex items-center gap-4 mb-3">
                            <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center text-success">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">Activos</p>
                                <p className="text-xs text-muted-foreground">Listos para venta</p>
                            </div>
                            <span className="ml-auto font-bold text-foreground">
                                {clients.filter(c => c.status === 'ACTIVE').length}
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center text-warning">
                                <Clock className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">Nuevos</p>
                                <p className="text-xs text-muted-foreground">Pendientes de info</p>
                            </div>
                            <span className="ml-auto font-bold text-foreground">
                                {clients.filter(c => c.status === 'DRAFT').length}
                            </span>
                        </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-border flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Meta mensual</span>
                        <span className="text-sm font-medium flex items-center gap-1 text-success">
                            +12% <MoveRight className="w-3 h-3" />
                        </span>
                    </div>
                </div>
            </div>

            {/* Client Grid */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-foreground">Listado de Clientes</h2>
                    <div className="flex gap-2 text-sm text-muted-foreground">
                        <span className="px-3 py-1 bg-card rounded-full border border-border shadow-sm text-foreground font-medium">Todos</span>
                        <span className="px-3 py-1 hover:bg-card rounded-full cursor-pointer transition-colors">Activos</span>
                        <span className="px-3 py-1 hover:bg-card rounded-full cursor-pointer transition-colors">Nuevos</span>
                    </div>
                </div>

                {loading ? (
                    <div className="py-20 text-center">
                        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                    </div>
                ) : filteredClients.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {filteredClients.map((client) => (
                            <div key={client.id} className="bg-card hover:bg-accent/5 rounded-2xl p-5 border border-border shadow-sm hover:shadow-md transition-all group flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                                {client.razonSocial?.charAt(0).toUpperCase() || "C"}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-sm text-foreground truncate w-32" title={client.razonSocial}>
                                                    {client.razonSocial || "Sin Nombre"}
                                                </h3>
                                                <p className="text-[10px] text-muted-foreground truncate w-32">
                                                    {client.id.slice(0, 8)}...
                                                </p>
                                            </div>
                                        </div>
                                        <button className="text-muted-foreground hover:text-foreground">
                                            <MoreHorizontal className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Briefcase className="w-3.5 h-3.5" />
                                            <span className="truncate">{client.rfc || "RFC Pendiente"}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <AtSign className="w-3.5 h-3.5" />
                                            <span className="truncate">{client.email || "No email"}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <MapPin className="w-3.5 h-3.5" />
                                            <span className="truncate">México</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-border pt-4 flex items-center justify-between">
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${client.status === 'ACTIVE'
                                        ? 'bg-success/5 text-success border-success/20'
                                        : 'bg-warning/5 text-warning border-warning/20'
                                        }`}>
                                        {client.status === 'ACTIVE' ? 'Activo' : 'Nuevo'}
                                    </span>

                                    <Link
                                        href={`/dashboard/sales/quotes?clientId=${client.id}`}
                                        className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                                    >
                                        Ver <ArrowUpRight className="w-3 h-3" />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-card rounded-2xl border border-dashed border-border">
                        <UserCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-20" />
                        <h3 className="text-lg font-medium text-foreground">No se encontraron clientes</h3>
                        <p className="text-sm text-muted-foreground mt-1">Intenta con otra búsqueda o registra uno nuevo.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

