"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthStore } from "@/store/useAuthStore";
import {
    Plus, Search, FileText, Filter, MoreHorizontal,
    Download, Eye, Send, Loader2, Pencil, Trash2, XCircle, Undo2, Trash
} from "lucide-react";
import { updateDoc, doc, deleteDoc } from "firebase/firestore";
import { formatCurrency, formatDate } from "@/lib/utils";

type Quote = {
    id: string;
    folio: string;
    clientId: string;
    financials: { total: number };
    status: string;
    createdAt: any;
};

const statusConfig = {
    ACCEPTED: { label: "Aprobada", class: "badge-success" },
    SENT: { label: "Enviada", class: "badge-info" },
    DRAFT: { label: "Borrador", class: "bg-muted text-muted-foreground" },
    REJECTED: { label: "Rechazada", class: "badge-error" },
    CANCELLED: { label: "Cancelada", class: "bg-red-500/10 text-red-500 border-red-500/20" },
};

export default function QuotesPage() {
    const { user, role } = useAuthStore();
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
    const [cancelling, setCancelling] = useState(false);
    const [showTrash, setShowTrash] = useState(false);

    useEffect(() => {
        if (user) {
            // OPTIMIZATION: Load from cache first
            const cacheKey = `quotes_${user.uid}`;
            const cached = localStorage.getItem(cacheKey);
            let isBackground = false;

            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    setQuotes(parsed);
                    setLoading(false);
                    isBackground = true;
                } catch (e) {
                    console.error("Cache parse error", e);
                }
            }
            fetchQuotes(isBackground);
        }
    }, [user, role]);

    const fetchQuotes = async (isBackground = false) => {
        if (!isBackground) setLoading(true);
        try {
            let q;
            if (role === 'SUPERADMIN' || role === 'ADMIN') {
                q = query(collection(db, "quotations"), orderBy("createdAt", "desc"));
            } else {
                q = query(
                    collection(db, "quotations"),
                    where("salesRepId", "==", user?.uid)
                );
            }

            const querySnapshot = await getDocs(q);
            const list: Quote[] = [];
            querySnapshot.forEach((doc) => {
                list.push({ id: doc.id, ...doc.data() } as Quote);
            });
            setQuotes(list);

            // Update cache
            if (user?.uid) {
                localStorage.setItem(`quotes_${user.uid}`, JSON.stringify(list));
            }
        } catch (error) {
            console.error("Error fetching quotes:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelClick = (id: string) => {
        setSelectedQuoteId(id);
        setIsCancelModalOpen(true);
    };

    const confirmCancel = async () => {
        if (!selectedQuoteId) return;
        setCancelling(true);
        try {
            await updateDoc(doc(db, "quotations", selectedQuoteId), {
                status: 'CANCELLED'
            });
            fetchQuotes(); // Refresh list
            setIsCancelModalOpen(false);
        } catch (error) {
            console.error("Error cancelling quote:", error);
            alert("Error al cancelar la cotización.");
        } finally {
            setCancelling(false);
        }
    };

    const confirmPermanentDelete = async (id: string) => {
        if (!confirm("¿ELIMINAR PERMANENTEMENTE? Esta acción no se puede deshacer y el folio se perderá.")) return;
        setLoading(true);
        try {
            await deleteDoc(doc(db, "quotations", id));
            fetchQuotes();
        } catch (error) {
            console.error("Error deleting quote:", error);
            alert("Error al eliminar.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Historial de Cotizaciones</h1>
                    <p className="text-muted-foreground mt-1">Gestiona todas tus propuestas comerciales</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowTrash(!showTrash)}
                        className={`btn-ghost border flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${showTrash ? 'bg-red-500/10 border-red-500/50 text-red-500' : 'border-border text-muted-foreground hover:bg-muted'}`}
                    >
                        <Trash2 className="w-4 h-4" />
                        {showTrash ? 'Ver Activas' : `Papelera (${quotes.filter((q: Quote) => q.status === 'CANCELLED').length})`}
                    </button>
                    <Link
                        href="/dashboard/sales/quotes/new"
                        className="btn-primary flex items-center gap-2 justify-center"
                    >
                        <Plus className="w-4 h-4" />
                        Nueva Cotización
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="card-premium p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar por folio o cliente..."
                            className="input-dark pl-10 w-full"
                        />
                    </div>
                    <div className="flex gap-2">
                        <select className="input-dark text-sm">
                            <option>Todos los Estados</option>
                            <option>Borrador</option>
                            <option>Enviada</option>
                            <option>Aprobada</option>
                            <option>Rechazada</option>
                        </select>
                        <button className="btn-ghost flex items-center gap-2">
                            <Filter className="w-4 h-4" />
                            Más Filtros
                        </button>
                    </div>
                </div>
            </div>

            {/* Status Information for Trash */}
            {showTrash && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3 text-amber-500 text-sm animate-in slide-in-from-top-2">
                    <XCircle className="w-5 h-5 shrink-0" />
                    <p>Las cotizaciones en la papelera se eliminarán permanentemente después de 30 días.</p>
                </div>
            )}

            {/* Table */}
            <div className="card-premium overflow-hidden bg-card">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-accent-blue" />
                    </div>
                ) : quotes.length === 0 ? (
                    <div className="text-center py-12">
                        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                        <h3 className="text-lg font-medium text-foreground mb-1">No hay cotizaciones</h3>
                        <p className="text-muted-foreground mb-4">Comienza creando tu primera cotización</p>
                        <Link href="/dashboard/sales/quotes/new" className="btn-primary inline-flex">
                            <Plus className="w-4 h-4 mr-2" />
                            Nueva Cotización
                        </Link>
                    </div>
                ) : (
                    <table className="table-dark">
                        <thead>
                            <tr>
                                <th>Folio</th>
                                <th>Fecha</th>
                                <th>Total</th>
                                <th>Estatus</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {quotes
                                .filter((q: Quote) => showTrash ? q.status === 'CANCELLED' : q.status !== 'CANCELLED')
                                .map((quote: Quote) => {
                                    const status = statusConfig[quote.status as keyof typeof statusConfig] || statusConfig.DRAFT;
                                    return (
                                        <tr key={quote.id}>
                                            <td>
                                                <Link
                                                    href={`/dashboard/sales/quotes/${quote.id}`}
                                                    className="text-accent-blue hover:underline flex items-center gap-2 font-mono font-medium"
                                                >
                                                    <FileText className="w-4 h-4" />
                                                    {quote.folio}
                                                </Link>
                                            </td>
                                            <td className="text-muted-foreground">
                                                {quote.createdAt?.seconds
                                                    ? formatDate(new Date(quote.createdAt.seconds * 1000))
                                                    : '-'}
                                            </td>
                                            <td className="font-bold">
                                                {formatCurrency(quote.financials?.total || 0)}
                                            </td>
                                            <td>
                                                <span className={`badge ${status.class}`}>
                                                    {status.label}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-1">
                                                    <Link
                                                        href={`/dashboard/sales/quotes/${quote.id}`}
                                                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                                                        title="Ver Detalle"
                                                    >
                                                        <Eye className="w-4 h-4 text-muted-foreground" />
                                                    </Link>
                                                    {quote.status !== 'ORDERED' && quote.status !== 'CANCELLED' && (
                                                        <Link
                                                            href={`/dashboard/sales/quotes/${quote.id}/edit`}
                                                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                                                            title="Modificar"
                                                        >
                                                            <Pencil className="w-4 h-4 text-accent-blue" />
                                                        </Link>
                                                    )}
                                                    {!showTrash && quote.status !== 'ORDERED' && (
                                                        <button
                                                            onClick={() => handleCancelClick(quote.id)}
                                                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Mover a Papelera"
                                                        >
                                                            <Trash2 className="w-4 h-4 text-red-500" />
                                                        </button>
                                                    )}
                                                    {showTrash && (
                                                        <>
                                                            <button
                                                                onClick={async () => {
                                                                    if (confirm("¿Restaurar esta cotización?")) {
                                                                        await updateDoc(doc(db, "quotations", quote.id), { status: 'DRAFT' });
                                                                        fetchQuotes();
                                                                    }
                                                                }}
                                                                className="p-2 hover:bg-emerald-50 rounded-lg transition-colors"
                                                                title="Restaurar"
                                                            >
                                                                <Undo2 className="w-4 h-4 text-emerald-500" />
                                                            </button>
                                                            <button
                                                                onClick={() => confirmPermanentDelete(quote.id)}
                                                                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Eliminar Permanente"
                                                            >
                                                                <Trash className="w-4 h-4 text-red-700" />
                                                            </button>
                                                        </>
                                                    )}
                                                    <button
                                                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                                                        title="Descargar PDF"
                                                    >
                                                        <Download className="w-4 h-4 text-muted-foreground" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                )}
            </div>
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
                            <p className="text-sm text-muted-foreground mt-1">¿Estás seguro de que deseas cancelar esta cotización?</p>
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
