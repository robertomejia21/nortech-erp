"use client";

import { useState, useEffect } from "react";
import { X, Loader2, DollarSign, CreditCard, Banknote, CheckCircle2, ShoppingBag } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { notifySalesRep } from "@/lib/businessLogic";

type Item = {
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
};

type PaymentModalProps = {
    isOpen: boolean;
    onClose: () => void;
    order: any; // Using any for flexibility, but should be typed
    onPaymentComplete: () => void;
};

export default function PaymentModal({ isOpen, onClose, order, onPaymentComplete }: PaymentModalProps) {
    const [loading, setLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'TRANSFER'>('TRANSFER');
    const [items, setItems] = useState<Item[]>([]);

    useEffect(() => {
        if (order && order.items) {
            setItems(order.items.map((item: any) => ({
                productName: item.productName || "Producto",
                quantity: Number(item.quantity) || 0,
                unitPrice: Number(item.unitPrice) || 0,
                total: (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)
            })));
        }
    }, [order]);

    if (!isOpen || !order) return null;

    const handlePayment = async () => {
        setLoading(true);
        try {
            // 1. Update Order Status
            const orderRef = doc(db, "orders", order.id);
            await updateDoc(orderRef, {
                status: 'PAID', // Or 'COMPLETED' based on specific workflow, assumes PAID for finance
                paymentMethod,
                paidAt: serverTimestamp(),
                // If this finalizes the order cycle depending on business logic:
                // status: 'COMPLETED' 
            });

            // 2. Notify Verification (Sales Rep)
            if (order.salesRepId) {
                await notifySalesRep(
                    order.salesRepId,
                    `Pago recibido para Orden #${order.quoteFolio} via ${paymentMethod}`,
                    `/dashboard/sales/orders/${order.id}`
                );
            }

            onPaymentComplete();
            onClose();
        } catch (error) {
            console.error("Payment Error:", error);
            alert("Error al procesar el pago. Intente nuevamente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-card border border-border w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
                    <div>
                        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <DollarSign className="w-6 h-6 text-primary" /> Registrar Cobro
                        </h2>
                        <p className="text-sm text-muted-foreground">Orden <span className="font-mono text-primary font-bold">{order.quoteFolio}</span> • {order.clientName}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* Items List (Requirement: Detailed List) */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wider">
                            <ShoppingBag className="w-4 h-4 text-primary" /> Detalle de Conceptos
                        </h3>
                        <div className="rounded-xl border border-border bg-card overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 text-muted-foreground text-xs font-bold uppercase">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Producto / Servicio</th>
                                        <th className="px-4 py-3 text-center">Cant.</th>
                                        <th className="px-4 py-3 text-right">Importe</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {items.map((item, i) => (
                                        <tr key={i} className="hover:bg-muted/5">
                                            <td className="px-4 py-3 font-medium">{item.productName}</td>
                                            <td className="px-4 py-3 text-center text-muted-foreground">{item.quantity}</td>
                                            <td className="px-4 py-3 text-right font-mono">{formatCurrency(item.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-muted/20 font-bold border-t border-border">
                                    <tr>
                                        <td colSpan={2} className="px-4 py-3 text-right text-muted-foreground">Total a Cobrar:</td>
                                        <td className="px-4 py-3 text-right text-lg text-primary">{formatCurrency(order.financials?.total || 0)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Payment Method Selection */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Método de Pago</h3>
                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { id: 'TRANSFER', label: 'Transferencia', icon: Banknote },
                                { id: 'CARD', label: 'Tarjeta Crédito/Débito', icon: CreditCard },
                                { id: 'CASH', label: 'Efectivo', icon: DollarSign },
                            ].map((method) => (
                                <button
                                    key={method.id}
                                    onClick={() => setPaymentMethod(method.id as any)}
                                    className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-all ${paymentMethod === method.id
                                            ? 'bg-primary/10 border-primary text-primary shadow-lg shadow-primary/10'
                                            : 'bg-card border-border text-muted-foreground hover:border-primary/50'
                                        }`}
                                >
                                    <method.icon className="w-6 h-6" />
                                    <span className="text-xs font-bold">{method.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-border bg-muted/20 flex gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 btn-ghost border border-border bg-background"
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handlePayment}
                        disabled={loading}
                        className="flex-1 btn-primary text-lg py-6 shadow-xl shadow-primary/20"
                    >
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "CONFIRMAR PAGO"}
                    </button>
                </div>
            </div>
        </div>
    );
}
