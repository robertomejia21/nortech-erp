"use client";

import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";

export default function ProductForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        sku: "",
        description: "",
        basePrice: 0,
        unit: "PZA",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await addDoc(collection(db, "products"), {
                ...formData,
                basePrice: Number(formData.basePrice),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            router.push("/dashboard/admin/products");
            router.refresh();
        } catch (error) {
            console.error("Error saving product:", error);
            alert("Error al guardar el producto");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Registrar Nuevo Producto/Servicio</h2>

            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Nombre del Producto <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                            placeholder="Válvula de Control 2''"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">SKU / Código</label>
                        <input
                            type="text"
                            value={formData.sku}
                            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                            placeholder="VAL-001"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                        rows={2}
                        placeholder="Detalles técnicos..."
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Precio Base (MXN) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            required
                            min="0"
                            step="0.01"
                            value={formData.basePrice}
                            onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                            placeholder="0.00"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Unidad de Medida</label>
                        <select
                            value={formData.unit}
                            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white"
                        >
                            <option value="PZA">Pieza (PZA)</option>
                            <option value="SER">Servicio (SER)</option>
                            <option value="KG">Kilogramo (KG)</option>
                            <option value="M">Metro (M)</option>
                            <option value="L">Litro (L)</option>
                        </select>
                    </div>
                </div>

                <div className="pt-4 flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-slate-800 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-900 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Guardar Producto
                    </button>
                </div>
            </div>
        </form>
    );
}
