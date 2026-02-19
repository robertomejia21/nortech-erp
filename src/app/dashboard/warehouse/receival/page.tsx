"use client";

import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs, updateDoc, doc, arrayUnion, addDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2, Upload, CheckCircle, FileText } from "lucide-react";
import { formatDate } from "@/lib/utils";

type Order = {
    id: string;
    quotationId: string;
    quoteFolio?: string;
    clientName?: string;
    supplierId: string;
    supplierName?: string;
    type?: string;
    status: string;
    createdAt: any;
    createdBy?: string;
    documents?: { name: string; type: string; url: string }[];
    parentSalesOrderId?: string; // For linking back to sales rep
};

export default function ReceivalPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState<string | null>(null);

    useEffect(() => {
        fetchPendingOrders();
    }, []);

    const fetchPendingOrders = async () => {
        setLoading(true);
        try {
            // Warehouse cares about approved sales orders and those in purchasing process
            const q = query(
                collection(db, "orders"),
                where("status", "in", ["APPROVED", "PO_SENT", "PO_CREATED", "GOODS_RECEIVED"])
            );
            const querySnapshot = await getDocs(q);
            const list: Order[] = [];
            querySnapshot.forEach((doc: any) => {
                const data = doc.data();
                list.push({
                    id: doc.id,
                    ...data,
                    // Map quotationId if missed in some docs (legacy)
                    quotationId: data.quotationId || data.quoteId
                } as Order);
            });
            setOrders(list);
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkReceived = async (orderId: string) => {
        if (!confirm("¿Confirmar recepción de mercancía? Esto notificará a ventas.")) return;
        try {
            await updateDoc(doc(db, "orders", orderId), {
                status: "GOODS_RECEIVED"
            });

            // Notify Sales Layout
            const order = orders.find(o => o.id === orderId);
            // Check if it's a PO and has a parent
            // The logic below assumes that if it doesn't have parentSalesOrderId, we might notify createdBy directly if available
            // But requirement specifically asked for identifying Sales Rep

            let targetUserId = order?.createdBy; // Default to whoever created this record (Admin)

            if (order && (order as any).parentSalesOrderId) {
                const parentId = (order as any).parentSalesOrderId;
                try {
                    const parentDoc = await getDoc(doc(db, "orders", parentId));
                    if (parentDoc.exists()) {
                        const pData = parentDoc.data();
                        // Priority: salesRepId > createdBy
                        targetUserId = pData.salesRepId || pData.createdBy;
                    }
                } catch (e) { console.error("Error fetching parent order for notification:", e); }
            }

            if (targetUserId) {
                await addDoc(collection(db, "notifications"), {
                    userId: targetUserId,
                    title: "Mercancía Recibida",
                    message: `Almacén ha recibido la mercancía de la orden ${order?.quoteFolio || order?.id}.`,
                    link: `/dashboard/sales/orders/${(order as any).parentSalesOrderId || orderId}`,
                    read: false,
                    createdAt: serverTimestamp()
                });
            }

            fetchPendingOrders(); // Refresh
        } catch (error) {
            console.error("Error updating order:", error);
        }
    };

    const handleFileUpload = async (orderId: string, event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploading(orderId);
        try {
            // Find the order to get the creator
            const order = orders.find((o: Order) => o.id === orderId);
            if (!order) return;

            // MOCK UPLOAD: In real app, upload to Firebase Storage here
            // const storageRef = ref(storage, `orders/${orderId}/${file.name}`);
            // await uploadBytes(storageRef, file);
            // const url = await getDownloadURL(storageRef);

            // Simulating upload delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            const mockUrl = `https://fake-storage.com/${file.name}`;

            await updateDoc(doc(db, "orders", orderId), {
                documents: arrayUnion({
                    name: file.name,
                    type: file.name.endsWith("xml") ? "XML" : "PDF",
                    url: mockUrl,
                    uploadedAt: new Date().toISOString()
                })
            });

            // Create Notification
            if (order.createdBy) {
                await addDoc(collection(db, "notifications"), {
                    userId: order.createdBy,
                    title: "Documento Cargado en Almacén",
                    message: `Se ha subido ${file.name} para la Orden OC-${order.id.slice(0, 6).toUpperCase()}`,
                    read: false,
                    createdAt: serverTimestamp(),
                    link: `/dashboard/admin/orders`
                });
            }

            alert("Documento cargado y notificación enviada.");
            fetchPendingOrders();
        } catch (error) {
            console.error("Error uploading:", error);
            alert("Error al cargar documento");
        } finally {
            setUploading(null);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-black text-foreground tracking-tight">Recepción de <span className="text-primary italic">Mercancía</span></h1>
                <p className="text-muted-foreground mt-1 text-sm font-medium">Controla y documenta la entrada de productos al almacén central.</p>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    <p className="text-muted-foreground font-medium animate-pulse">Escaneando órdenes pendientes...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {orders.map((order: Order) => (
                        <div key={order.id} className="bg-card/40 backdrop-blur-xl p-8 rounded-[2rem] border border-border/50 shadow-2xl flex flex-col md:flex-row justify-between gap-8 transition-all hover:border-primary/30 group relative overflow-hidden">
                            {/* Decorative background element */}
                            <div className="absolute -right-20 -top-20 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none transition-transform group-hover:scale-150 duration-700" />

                            <div className="flex-1 relative">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="font-black bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] tracking-widest uppercase border border-primary/20">
                                        OC-{order.id.slice(0, 6).toUpperCase()}
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${order.status === 'GOODS_RECEIVED'
                                        ? 'bg-success/10 text-success border-success/20' :
                                        order.status === 'APPROVED'
                                            ? 'bg-primary/10 text-primary border-primary/20' :
                                            'bg-warning/10 text-warning border-warning/20'
                                        }`}>
                                        {order.status === 'APPROVED' ? 'Listas para Recibir' :
                                            order.status === 'PO_SENT' ? 'En Tránsito' :
                                                order.status === 'GOODS_RECEIVED' ? 'Recibido' : order.status}
                                    </span>
                                </div>

                                <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                                    {order.clientName || 'Cliente Industrial'}
                                </h3>

                                <div className="space-y-2">
                                    <p className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                                        <FileText className="w-3.5 h-3.5 opacity-50" />
                                        <span>Folio Cotización: <span className="text-foreground">{order.quoteFolio || order.quotationId?.slice(0, 8)}</span></span>
                                    </p>
                                    {order.supplierName && (
                                        <p className="text-xs font-black text-primary/80 uppercase tracking-widest">
                                            Proveedor: {order.supplierName}
                                        </p>
                                    )}
                                </div>

                                {/* Documents List */}
                                {order.documents && order.documents.length > 0 && (
                                    <div className="mt-6 flex flex-wrap gap-2">
                                        {order.documents!.map((doc: any, idx: number) => (
                                            <a
                                                key={idx}
                                                href={doc.url}
                                                target="_blank"
                                                className="flex items-center gap-2 text-[10px] font-black bg-muted/30 border border-border/50 px-3 py-2 rounded-xl text-foreground hover:bg-primary hover:text-primary-foreground transition-all shadow-sm"
                                            >
                                                <Upload className="w-3 h-3" /> {doc.name.toUpperCase()}
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-3 justify-center relative min-w-[220px]">
                                <label className={`
                                    flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest cursor-pointer transition-all border-2
                                    ${uploading === order.id
                                        ? 'bg-muted/20 border-border/50 text-muted-foreground'
                                        : 'bg-card border-border hover:border-primary/50 hover:bg-primary/5 text-foreground shadow-lg'}
                                `}>
                                    {uploading === order.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Upload className="w-4 h-4 text-primary" />
                                    )}
                                    <span>{uploading === order.id ? 'Subiendo...' : 'Cargar XML/PDF'}</span>
                                    <input
                                        type="file"
                                        accept=".pdf,.xml"
                                        className="hidden"
                                        disabled={!!uploading}
                                        onChange={(e: any) => handleFileUpload(order.id, e)}
                                    />
                                </label>

                                {order.status === 'PO_CREATED' && (
                                    <button
                                        onClick={() => handleMarkReceived(order.id)}
                                        className="w-full flex items-center justify-center gap-3 bg-emerald-600 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-500 shadow-xl shadow-emerald-900/20 active:scale-95 transition-all"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        Confirmar Recepción
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}

                    {orders.length === 0 && (
                        <div className="py-24 text-center rounded-[3rem] border-4 border-dashed border-border/30 bg-muted/5">
                            <div className="w-20 h-20 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="w-10 h-10 text-muted-foreground/30" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground">Operación al Día</h3>
                            <p className="text-muted-foreground mt-2 max-w-xs mx-auto">No se encontraron órdenes pendientes de recepción en este momento.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
