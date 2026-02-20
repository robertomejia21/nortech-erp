"use client";

import { useEffect, useState, useRef } from "react";
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase"; // Ensure storage is exported from firebase.ts
import {
    Loader2, Printer, Mail, ArrowLeft, FileCheck, Upload,
    AlertCircle, CheckCircle2, Edit2, Trash2, XCircle
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

// Types
type Client = { razonSocial: string; rfc: string; email: string; address: string };
type QuoteItem = {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number; // This is the sell price calculated in form
    basePrice: number;
    importCost: number;
    freightCost: number;
    margin: number;
    supplierId?: string;
    supplierName?: string;
};
type Quote = {
    id: string;
    folio: string;
    clientId: string;
    items: QuoteItem[];
    financials: { subtotal: number; taxRate: number; taxAmount: number; total: number; currency: string };
    createdAt: any;
    notes: string;
    status: 'DRAFT' | 'FINALIZED' | 'ACCEPTED' | 'ORDERED' | 'CANCELLED';
    orderId?: string; // If converted
};

export default function QuoteDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuthStore();
    const id = params.id as string;

    const [quote, setQuote] = useState<Quote | null>(null);
    const [client, setClient] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Conversion Modal State
    const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
    const [ocFile, setOcFile] = useState<File | null>(null);
    const [ocFolio, setOcFolio] = useState("");
    const [converting, setConverting] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
    const [finalizing, setFinalizing] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [cancelling, setCancelling] = useState(false);

    useEffect(() => {
        if (id) fetchQuote();
    }, [id]);

    const fetchQuote = async () => {
        try {
            const docRef = doc(db, "quotations", id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const qData = { id: docSnap.id, ...docSnap.data() } as Quote;
                setQuote(qData);

                if (qData.clientId) {
                    const clientRef = doc(db, "clients", qData.clientId);
                    const clientSnap = await getDoc(clientRef);
                    if (clientSnap.exists()) {
                        setClient(clientSnap.data());
                    }
                }
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleFinalizeQuote = () => {
        setIsFinalizeModalOpen(true);
    };

    const confirmFinalize = async () => {
        if (!quote) return;
        setFinalizing(true);

        try {
            await updateDoc(doc(db, "quotations", quote.id), {
                status: 'FINALIZED'
            });


            setSuccessMessage("✅ Cotización finalizada exitosamente. Ahora puedes enviarla al cliente y registrar la OC cuando la recibas.");
            fetchQuote(); // Refresh data

            // Auto-hide after 5 seconds
            setTimeout(() => setSuccessMessage(null), 5000);

            setIsFinalizeModalOpen(false);
        } catch (error) {
            console.error("Error finalizando cotización:", error);
            alert("❌ Error al finalizar la cotización. Intenta de nuevo.");
        } finally {
            setFinalizing(false);
        }
    };

    const confirmCancel = async () => {
        if (!quote) return;
        setCancelling(true);

        try {
            await updateDoc(doc(db, "quotations", quote.id), {
                status: 'CANCELLED'
            });

            setSuccessMessage("🚫 Cotización cancelada.");
            fetchQuote(); // Refresh data
            setIsCancelModalOpen(false);
        } catch (error) {
            console.error("Error cancelando cotización:", error);
            alert("❌ Error al cancelar la cotización.");
        } finally {
            setCancelling(false);
        }
    };

    const confirmAccept = async () => {
        if (!quote) return;
        setConverting(true);

        try {
            await updateDoc(doc(db, "quotations", quote.id), {
                status: 'ACCEPTED'
            });

            setSuccessMessage("✅ Venta confirmada. Enviada a Administración para generar OC.");
            fetchQuote();

            setTimeout(() => setSuccessMessage(null), 5000);
            setIsConvertModalOpen(false);
        } catch (error) {
            console.error("Error confirmando venta:", error);
            alert("❌ Error al confirmar la venta. Intenta de nuevo.");
        } finally {
            setConverting(false);
        }
    };

    if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div>;
    if (!quote) return <div className="p-20 text-center">Cotización no encontrada.</div>;

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'DRAFT': return <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">BORRADOR</span>;
            case 'FINALIZED': return <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-600 text-xs font-bold">ENVIADA / FINALIZADA</span>;
            case 'ACCEPTED': return <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold">VENDIDA (ESPERANDO OC)</span>;
            case 'ORDERED': return <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-600 text-xs font-bold">OC GENERADA</span>;
            case 'CANCELLED': return <span className="px-3 py-1 rounded-full bg-red-100 text-red-600 text-xs font-bold">CANCELADA</span>;
            default: return <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold">{status}</span>;
        }
    };

    return (
        <div className="max-w-5xl mx-auto pb-20">
            {/* Nav & Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 print:hidden">
                <Link href="/dashboard/sales/quotes" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Volver a Cotizaciones
                </Link>

                <div className="flex items-center gap-3">
                    {quote.status === 'DRAFT' && (
                        <button
                            onClick={handleFinalizeQuote}
                            className="btn-primary shadow-lg shadow-blue-500/20 flex items-center gap-2"
                        >
                            <CheckCircle2 className="w-4 h-4" /> Finalizar Cotización
                        </button>
                    )}
                    {quote.status === 'FINALIZED' && (
                        <button
                            onClick={() => setIsConvertModalOpen(true)}
                            className="btn-primary bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 flex items-center gap-2 animate-pulse"
                        >
                            <FileCheck className="w-4 h-4" /> Confirmar Venta
                        </button>
                    )}
                    {quote.status === 'ORDERED' && (
                        <Link href={`/dashboard/sales/orders/${quote.orderId}`} className="btn-secondary text-emerald-600 border-emerald-200 bg-emerald-50 hover:bg-emerald-100">
                            Ver Orden de Venta
                        </Link>
                    )}
                    {(quote.status === 'DRAFT' || quote.status === 'FINALIZED') && (
                        <Link
                            href={`/dashboard/sales/quotes/${quote.id}/edit`}
                            className="btn-premium-ghost"
                        >
                            <Edit2 className="w-3.5 h-3.5" /> Modificar
                        </Link>
                    )}
                    {quote.status !== 'ORDERED' && quote.status !== 'CANCELLED' && quote.status !== 'ACCEPTED' && (
                        <button
                            onClick={() => setIsCancelModalOpen(true)}
                            className="btn-premium-danger"
                        >
                            <Trash2 className="w-3.5 h-3.5" /> Cancelar
                        </button>
                    )}
                    <button
                        onClick={handlePrint}
                        className="btn-premium-ghost"
                    >
                        <Printer className="w-3.5 h-3.5" /> Imprimir
                    </button>
                    <button
                        onClick={() => window.location.href = `mailto:${client?.email}?subject=Cotización ${quote.folio}&body=Adjunto encontrará la cotización.`}
                        className="btn-premium-ghost"
                    >
                        <Mail className="w-3.5 h-3.5" /> Enviar
                    </button>
                </div>
            </div>

            {/* Status Banner */}
            <div className="mb-6 flex items-center gap-4 p-4 bg-card border border-border rounded-xl shadow-sm">
                <div className="flex-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Estado Actual</p>
                    <div className="mt-1 flex items-center gap-2">
                        {getStatusBadge(quote.status)}
                        <span className="text-sm font-mono text-muted-foreground">| Folio: {quote.folio}</span>
                    </div>
                </div>
                {quote.status === 'DRAFT' && (
                    <div className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        <span>Cotización en borrador. Finalízala para enviarla.</span>
                    </div>
                )}
            </div>

            {/* Success Message Banner */}
            {successMessage && (
                <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-500 rounded-xl shadow-lg animate-in slide-in-from-top duration-300">
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200 flex-1">{successMessage}</p>
                        <button
                            onClick={() => setSuccessMessage(null)}
                            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-200 transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}

            {/* Preview Document */}
            <div className="bg-white text-slate-900 p-8 md:p-16 shadow-2xl rounded-sm print:shadow-none print:p-0 min-h-[1000px] relative">

                {/* Header */}
                <div className="flex justify-between items-start mb-12 border-b-2 border-slate-900 pb-8">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 bg-slate-900 text-white flex items-center justify-center font-bold text-3xl">N</div>
                        <div>
                            <h1 className="text-3xl font-bold uppercase tracking-tight text-slate-900">Nortech</h1>
                            <p className="text-sm text-slate-500 font-medium">INDUSTRIAL SOLUTIONS</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-4xl font-extrabold text-slate-200">COTIZACIÓN</h2>
                        <p className="text-xl font-bold font-mono text-slate-900 mt-1">{quote.folio}</p>
                        <p className="text-sm text-slate-500 mt-2">
                            {quote.createdAt?.seconds ? formatDate(new Date(quote.createdAt.seconds * 1000)) : 'Fecha Pendiente'}
                        </p>
                    </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-12 mb-12">
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Facturar A:</h3>
                        <div className="space-y-1 text-sm">
                            <p className="font-bold text-lg text-slate-900">{client?.razonSocial || "---"}</p>
                            <p className="text-slate-600">{client?.rfc || "---"}</p>
                            <p className="text-slate-600 max-w-xs">{client?.address || "Dirección no registrada"}</p>
                            <p className="text-blue-600 underline">{client?.email}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Condiciones Comerciales</h3>
                        <div className="space-y-2 text-sm text-slate-600">
                            <div className="flex justify-end gap-4">
                                <span>Moneda:</span>
                                <span className="font-bold text-slate-900">{quote.financials.currency || "MXN"}</span>
                            </div>
                            <div className="flex justify-end gap-4">
                                <span>Vigencia:</span>
                                <span className="font-bold text-slate-900">15 Días</span>
                            </div>
                            <div className="flex justify-end gap-4">
                                <span>Atención:</span>
                                <span className="font-bold text-slate-900">{user?.displayName || "Ventas Nortech"}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div className="mb-12">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-900 text-white uppercase text-xs font-bold">
                            <tr>
                                <th className="py-3 px-4 text-left rounded-tl-lg">Descripción</th>
                                <th className="py-3 px-4 text-center">Cant.</th>
                                <th className="py-3 px-4 text-right">P. Unitario</th>
                                <th className="py-3 px-4 text-right rounded-tr-lg">Importe</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {quote.items.map((item, idx) => {
                                // Calculate unit price if not saved (backward compatibility)
                                const cost = (item.basePrice || 0) + (item.importCost || 0) + (item.freightCost || 0);
                                const unitPrice = item.unitPrice || (cost * (1 + (item.margin || 0)));

                                return (
                                    <tr key={idx} className="group hover:bg-slate-50">
                                        <td className="py-4 px-4 font-medium text-slate-800">
                                            {item.productName}
                                        </td>
                                        <td className="py-4 px-4 text-center text-slate-600">{item.quantity}</td>
                                        <td className="py-4 px-4 text-right text-slate-600 font-mono">{formatCurrency(unitPrice)}</td>
                                        <td className="py-4 px-4 text-right font-bold text-slate-900 font-mono">{formatCurrency(unitPrice * item.quantity)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Footer Totals */}
                <div className="flex flex-col md:flex-row justify-between items-start gap-12">
                    <div className="flex-1">
                        {quote.notes && (
                            <div className="bg-slate-50 p-6 rounded-lg text-xs text-slate-500 border border-slate-100">
                                <h4 className="font-bold text-slate-700 mb-2 uppercase tracking-wide">Términos y Condiciones</h4>
                                <p className="whitespace-pre-wrap leading-relaxed">{quote.notes}</p>
                            </div>
                        )}
                        <div className="mt-8 pt-8 border-t border-slate-100">
                            <h4 className="font-bold text-slate-900 mb-2">Información Bancaria</h4>
                            <p className="text-xs text-slate-500">Banco: BBVA Bancomer | Cuenta: 0123456789 | CLABE: 012345678901234567</p>
                            <p className="text-xs text-slate-500 mt-1">Favor de enviar comprobante de pago a cobranza@nortech.com</p>
                        </div>
                    </div>

                    <div className="w-full md:w-80">
                        <div className="space-y-4">
                            <div className="flex justify-between text-slate-600 text-sm">
                                <span>Subtotal</span>
                                <span>{formatCurrency(quote.financials.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-slate-600 text-sm">
                                <span>IVA ({(quote.financials.taxRate * 100).toFixed(0)}%)</span>
                                <span>{formatCurrency(quote.financials.taxAmount)}</span>
                            </div>
                            <div className="flex justify-between text-slate-900 text-2xl font-bold border-t-2 border-slate-900 pt-4 items-end">
                                <span className="text-sm font-normal text-slate-500 self-center">TOTAL</span>
                                <span>{formatCurrency(quote.financials.total)}</span>
                            </div>
                            <div className="text-right text-xs text-slate-400 font-medium">
                                {quote.financials.currency || "MXN"}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stamp */}
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 opacity-10 pointer-events-none">
                    <div className="w-64 h-64 border-8 border-slate-900 rounded-full flex items-center justify-center rotate-12">
                        <span className="text-4xl font-black uppercase text-slate-900">NORTECH ORIGINAL</span>
                    </div>
                </div>
            </div>

            {/* Convert Modal */}
            {isConvertModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsConvertModalOpen(false)} />
                    <div className="relative bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95">
                        <div className="p-6 border-b border-border bg-emerald-500/10">
                            <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                Confirmar Venta
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">¿El cliente aceptó la cotización?</p>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
                                <p className="flex items-start gap-2">
                                    <span className="text-emerald-500 mt-0.5">✓</span>
                                    <span>Se notificará a Administración para autorizarla.</span>
                                </p>
                                <p className="flex items-start gap-2">
                                    <span className="text-emerald-500 mt-0.5">✓</span>
                                    <span>La administración generará la Orden de Compra interna.</span>
                                </p>
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsConvertModalOpen(false)}
                                    disabled={converting}
                                    className="flex-1 btn-ghost border border-border"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmAccept}
                                    disabled={converting}
                                    className="flex-1 btn-primary bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                    {converting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Sí, Confirmar Venta"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Finalize Confirmation Modal */}
            {isFinalizeModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsFinalizeModalOpen(false)} />
                    <div className="relative bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95">
                        <div className="p-6 border-b border-border bg-blue-50 dark:bg-blue-950/30">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                Finalizar Cotización
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">¿Estás seguro de que deseas finalizar esta cotización?</p>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
                                <p className="flex items-start gap-2">
                                    <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                                    <span>La cotización quedará lista para enviar al cliente</span>
                                </p>
                                <p className="flex items-start gap-2">
                                    <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                                    <span>Podrás imprimir y enviar por correo</span>
                                </p>
                                <p className="flex items-start gap-2">
                                    <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                                    <span>Cuando el cliente acepte, podrás registrar su OC</span>
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsFinalizeModalOpen(false)}
                                    disabled={finalizing}
                                    className="flex-1 btn-ghost border border-border"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmFinalize}
                                    disabled={finalizing}
                                    className="flex-1 btn-primary bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    {finalizing ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Sí, Finalizar"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Cancel Confirmation Modal */}
            {isCancelModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsCancelModalOpen(false)} />
                    <div className="relative bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95">
                        <div className="p-6 border-b border-border bg-red-50 dark:bg-red-950/30">
                            <h2 className="text-xl font-bold flex items-center gap-2 text-red-600">
                                <XCircle className="w-5 h-5" />
                                Cancelar Cotización
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">¿Estás seguro de que deseas cancelar esta cotización? Esta acción no se puede deshacer de forma sencilla.</p>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsCancelModalOpen(false)}
                                    disabled={cancelling}
                                    className="flex-1 btn-ghost border border-border"
                                >
                                    No, mantener
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmCancel}
                                    disabled={cancelling}
                                    className="flex-1 btn-primary bg-red-600 hover:bg-red-700 text-white"
                                >
                                    {cancelling ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Sí, Cancelar"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
