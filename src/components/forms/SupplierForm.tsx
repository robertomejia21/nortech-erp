"use client";

import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";

export default function SupplierForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        contactName: "",
        email: "",
        phone: "",
        creditTerms: "Contado",
        street: "",
        city: "",
        state: "",
        zipCode: "",
        notes: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await addDoc(collection(db, "suppliers"), {
                ...formData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            const willCreateAnother = confirm("Proveedor guardado. ¿Deseas registrar otro?");
            if (willCreateAnother) {
                setFormData({
                    name: "",
                    contactName: "",
                    email: "",
                    phone: "",
                    creditTerms: "Contado",
                    street: "",
                    city: "",
                    state: "",
                    zipCode: "",
                    notes: ""
                });
            } else {
                router.push("/dashboard/admin/suppliers");
                router.refresh();
            }
        } catch (error) {
            console.error("Error saving supplier:", error);
            alert("Error al guardar el proveedor");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-zinc-950 p-8 rounded-2xl shadow-2xl border border-zinc-900 max-w-4xl mx-auto text-zinc-100">
            <div className="flex items-center gap-3 mb-8 border-b border-zinc-800 pb-4">
                <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                    Registrar Nuevo Proveedor
                </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Basic Info */}
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-blue-400 mb-4">Información General</h3>

                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1 ml-1 uppercase tracking-wider">
                            Empresa <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all placeholder:text-zinc-600"
                            placeholder="Ej. Distribuidora Global S.A."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1 ml-1 uppercase tracking-wider">Contacto</label>
                            <input
                                type="text"
                                value={formData.contactName}
                                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                                className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                                placeholder="Nombre completo"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1 ml-1 uppercase tracking-wider">Teléfono</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                                placeholder="(00) 0000-0000"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1 ml-1 uppercase tracking-wider">Correo Electrónico</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                            placeholder="contacto@empresa.com"
                        />
                    </div>
                </div>

                {/* Right Column: Conditions & Location */}
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-blue-400 mb-4">Condiciones y Ubicación</h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1 ml-1 uppercase tracking-wider">Términos de Crédito</label>
                            <select
                                value={formData.creditTerms}
                                onChange={(e) => setFormData({ ...formData, creditTerms: e.target.value })}
                                className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all text-zinc-300"
                            >
                                <option value="Contado">Contado</option>
                                <option value="Neto 7 Dias">Neto 7 Días</option>
                                <option value="Neto 15 Dias">Neto 15 Días</option>
                                <option value="Neto 30 Dias">Neto 30 Días</option>
                                <option value="Neto 60 Dias">Neto 60 Días</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1 ml-1 uppercase tracking-wider">Calle y Número</label>
                            <input
                                type="text"
                                value={formData.street}
                                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                                className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                                placeholder="Av. Reforma 123"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1 ml-1 uppercase tracking-wider">Ciudad</label>
                            <input
                                type="text"
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                                placeholder="Ciudad"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1 ml-1 uppercase tracking-wider">Estado</label>
                            <input
                                type="text"
                                value={formData.state}
                                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                                placeholder="Estado"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1 ml-1 uppercase tracking-wider">Código Postal</label>
                        <input
                            type="text"
                            value={formData.zipCode}
                            onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                            className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                            placeholder="00000"
                        />
                    </div>
                </div>
            </div>

            <div className="mt-8">
                <label className="block text-xs font-medium text-zinc-400 mb-1 ml-1 uppercase tracking-wider">Notas Adicionales</label>
                <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all resize-none"
                    placeholder="Información adicional relevante..."
                />
            </div>

            <div className="pt-8 flex justify-end border-t border-zinc-800 mt-8">
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-900/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Guardar Proveedor
                </button>
            </div>
        </form>
    );
}
