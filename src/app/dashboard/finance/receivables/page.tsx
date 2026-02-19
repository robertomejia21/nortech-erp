"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthStore } from "@/store/useAuthStore";
import {
    Search, DollarSign, FileText, Calendar,
    CheckCircle2, AlertCircle, ArrowUpRight, Filter, Upload
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import PaymentModal from "@/components/modals/PaymentModal";
import InvoiceUploadModal from "@/components/modals/InvoiceUploadModal";

export default function ReceivablesPage() {
    const { role } = useAuthStore();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    useEffect(() => {
        fetchReceivables();
    }, []);

    const fetchReceivables = async () => {
        setLoading(true);
        try {
            // Fetch orders that are APPROVED or PO_SENT (assuming these are ready to be paid/in progress)
            // or explicitly checking for payment status if it existed.
            // For now, we list all active orders that might need payment.
            const q = query(
                collection(db, "orders"),
                where("status", "in", ["APPROVED", "PO_SENT", "GOODS_RECEIVED", "COMPLETED", "PAID"]),
                orderBy("createdAt", "desc")
            );

            const querySnapshot = await getDocs(q);
            const list: any[] = [];
            querySnapshot.forEach((doc) => {
                list.push({ id: doc.id, ...doc.data() });
            });
            setOrders(list);
        } catch (error) {
            console.error("Error fetching receivables:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenPayment = (order: any) => {
        setSelectedOrder(order);
        setIsPaymentModalOpen(true);
    };

    const handleOpenUpload = (order: any) => {
        setSelectedOrder(order);
        setIsUploadModalOpen(true);
    };

    const filteredOrders = orders.filter(order =>
        order.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.quoteFolio?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalReceivable = filteredOrders.reduce((acc, order) => {
        if (order.status === 'PAID') return acc;
        return acc + (order.financials?.total || 0);
    }, 0);

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Cuentas por Cobrar</h1>
                    <p className="text-muted-foreground mt-1">Gestión de flujo de efectivo y cobros pendientes.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Buscar cliente o folio..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-card border border-border rounded-lg py-2 pl-10 pr-4 text-sm w-64 focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card-premium p-6 bg-card border-l-4 border-l-blue-500">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total por Cobrar</p>
                    <p className="text-3xl font-black mt-2 text-foreground">{formatCurrency(totalReceivable)}</p>
                </div>
                <div className="card-premium p-6 bg-card border-l-4 border-l-emerald-500">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Facturas Cargadas</p>
                    <p className="text-3xl font-black mt-2 text-emerald-500">
                        {orders.filter(o => o.invoiceStatus === 'UPLOADED').length}
                    </p>
                </div>
            </div>

            {/* List */}
            <div className="card-premium overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-muted-foreground">
                            <tr>
                                <th className="p-4 text-left font-bold">Folio / Cliente</th>
                                <th className="p-4 text-left font-bold">Estado Fiscal</th>
                                <th className="p-4 text-left font-bold">Estado Pago</th>
                                <th className="p-4 text-right font-bold">Monto Total</th>
                                <th className="p-4 text-center font-bold">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Cargando...</td></tr>
                            ) : filteredOrders.length > 0 ? (
                                filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-muted/30 transition-colors group">
                                        <td className="p-4">
                                            <div className="font-bold text-foreground flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-primary" />
                                                {order.quoteFolio}
                                            </div>
                                            <div className="text-xs text-muted-foreground font-medium">{order.clientName}</div>
                                            <div className="text-[10px] text-muted-foreground">
                                                {order.createdAt?.seconds ? formatDate(new Date(order.createdAt.seconds * 1000)) : '---'}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {order.invoiceStatus === 'UPLOADED' ? (
                                                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full w-fit">
                                                    <CheckCircle2 className="w-3 h-3" /> Factura OK
                                                </span>
                                            ) : (
                                                <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-100 w-fit">
                                                    Pendiente Factura
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {order.status === 'PAID' ? (
                                                <span className="bg-emerald-100 text-emerald-700 border-emerald-200 px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase">
                                                    PAGADO
                                                </span>
                                            ) : (
                                                <span className="bg-blue-100 text-blue-700 border-blue-200 px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase">
                                                    POR COBRAR
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right font-bold font-mono text-base">
                                            {formatCurrency(order.financials?.total || 0)}
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleOpenUpload(order)}
                                                    className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-primary transition-colors"
                                                    title="Subir Factura (PDF/XML)"
                                                >
                                                    <Upload className="w-4 h-4" />
                                                </button>
                                                {order.status !== 'PAID' && (
                                                    <button
                                                        onClick={() => handleOpenPayment(order)}
                                                        className="btn-primary px-3 py-1.5 text-[10px] font-bold shadow-md hover:shadow-lg transition-all"
                                                    >
                                                        REGISTRAR COBRO
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-muted-foreground">
                                        No hay cuentas por cobrar pendientes.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                order={selectedOrder}
                onPaymentComplete={() => {
                    fetchReceivables();
                }}
            />

            <InvoiceUploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                order={selectedOrder}
                onUploadComplete={() => {
                    fetchReceivables();
                }}
            />
        </div>
    );
}
