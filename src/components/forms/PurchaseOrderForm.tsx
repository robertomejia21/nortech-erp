"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, where, addDoc, serverTimestamp, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type Supplier = { id: string; name: string };
type Quote = { id: string; folio: string; financials: { total: number } };

export default function PurchaseOrderForm() {
    const { user } = useAuthStore();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [quotes, setQuotes] = useState<Quote[]>([]);

    const [formData, setFormData] = useState({
        supplierId: "",
        quotationId: "", // Linked Quote
        notes: "",
    });

    useEffect(() => {
        const loadData = async () => {
            const suppSnap = await getDocs(query(collection(db, "suppliers"), orderBy("name")));
            setSuppliers(suppSnap.docs.map(d => ({ id: d.id, ...d.data() } as Supplier)));

            // Only show accepted/sent quotes that don't have an order yet (logic omitted for simplicity)
            const quoteSnap = await getDocs(query(collection(db, "quotations"), orderBy("createdAt", "desc")));
            setQuotes(quoteSnap.docs.map(d => ({ id: d.id, ...d.data() } as Quote)));
        };
        loadData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await addDoc(collection(db, "orders"), {
                ...formData,
                status: "PO_CREATED",
                createdBy: user?.uid,
                createdAt: serverTimestamp(),
                documents: [], // Array for XML/PDFs
            });

            router.push("/dashboard/admin/orders");
        } catch (error) {
            console.error("Error creating PO:", error);
            alert("Error al crear Orden de Compra");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Generar Orden de Compra Interna</h2>

            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Cotización Vinculada <span className="text-red-500">*</span>
                    </label>
                    <select
                        required
                        value={formData.quotationId}
                        onChange={(e) => setFormData({ ...formData, quotationId: e.target.value })}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white"
                    >
                        <option value="">Seleccionar Cotización...</option>
                        {quotes.map(q => (
                            <option key={q.id} value={q.id}>
                                {q.folio} - {formatCurrency(q.financials.total)}
                            </option>
                        ))}
                    </select>
                    <p className="text-xs text-slate-500 mt-1">La OC debe estar vinculada a una venta para trazabilidad.</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Proveedor <span className="text-red-500">*</span>
                    </label>
                    <select
                        required
                        value={formData.supplierId}
                        onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white"
                    >
                        <option value="">Seleccionar Proveedor...</option>
                        {suppliers.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Notas Internas</label>
                    <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                        rows={3}
                        placeholder="Instrucciones para almacén o condiciones especiales..."
                    />
                </div>

                <div className="pt-4 flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-purple-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Generar Orden
                    </button>
                </div>
            </div>
        </form>
    );
}
