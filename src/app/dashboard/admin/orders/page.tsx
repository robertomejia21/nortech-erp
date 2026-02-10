"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, query, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Plus, Search, Truck } from "lucide-react";
import { formatDate } from "@/lib/utils";

type Order = {
    id: string;
    quotationId: string; // We'd fetch quote details in a real app
    supplierId: string;
    status: string;
    createdAt: any;
};

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            const list: Order[] = [];
            querySnapshot.forEach((doc) => {
                list.push({ id: doc.id, ...doc.data() } as Order);
            });
            setOrders(list);
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight">Órdenes de <span className="text-primary italic">Compra</span></h1>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">Gestión interna de adquisiciones y logística de suministros.</p>
                </div>
                <Link
                    href="/dashboard/admin/orders/new"
                    className="btn-primary flex items-center gap-2 px-8"
                >
                    <Plus className="w-5 h-5" />
                    Generar OC
                </Link>
            </div>

            <div className="bg-card/40 backdrop-blur-xl rounded-[2rem] border border-border/50 shadow-2xl p-4">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5 transition-colors group-focus-within:text-primary" />
                    <input
                        type="text"
                        placeholder="Filtrar por ID, proveedor o estatus..."
                        className="input-dark pl-12 bg-background/50 border-none"
                    />
                </div>
            </div>

            <div className="bg-card/40 backdrop-blur-xl rounded-[2.5rem] border border-border/50 shadow-2xl overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-[400px] gap-4">
                        <Truck className="w-10 h-10 animate-bounce text-primary/50" />
                        <p className="text-muted-foreground font-medium">Sincronizando base de datos...</p>
                    </div>
                ) : (
                    <table className="table-dark">
                        <thead>
                            <tr>
                                <th>Folio / ID</th>
                                <th>Fecha Registro</th>
                                <th>Estatus Operativo</th>
                                <th className="text-right">Gestión</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => (
                                <tr key={order.id} className="group cursor-pointer">
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs ring-1 ring-primary/20 group-hover:bg-primary group-hover:text-white transition-all">
                                                OC
                                            </div>
                                            <div>
                                                <p className="font-black text-foreground uppercase tracking-wider text-xs">#{order.id.slice(0, 8)}</p>
                                                <p className="text-[10px] text-muted-foreground font-medium">Proveedor Asignado</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-foreground">
                                                {order.createdAt?.seconds ? formatDate(new Date(order.createdAt.seconds * 1000)) : 'No registrada'}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Calendario</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${order.status === 'DELIVERED' ? 'bg-success/10 text-success border-success/20' :
                                                order.status === 'GOODS_RECEIVED' ? 'bg-primary/10 text-primary border-primary/20' :
                                                    'bg-warning/10 text-warning border-warning/20'
                                            }`}>
                                            {order.status === 'GOODS_RECEIVED' ? 'Recibido' :
                                                order.status === 'DELIVERED' ? 'Entregado' :
                                                    order.status || 'PROCESANDO'}
                                        </span>
                                    </td>
                                    <td className="text-right">
                                        <button className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors border border-border/50 px-4 py-2 rounded-xl group-hover:border-primary/30">
                                            Abrir Expediente
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {orders.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="py-32 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-30">
                                            <Truck className="w-16 h-16" />
                                            <p className="text-lg font-bold">No se encontraron órdenes generadas</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
