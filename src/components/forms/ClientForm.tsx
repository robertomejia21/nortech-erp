"use client";

import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";

export default function ClientForm() {
    const { user } = useAuthStore();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        razonSocial: "",
        rfc: "",
        email: "",
        phone: "",
        address: "",
        taxRate: 0.08, // Default 8%
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            alert("No hay sesión de usuario activa. Por favor inicie sesión nuevamente.");
            return;
        }

        setLoading(true);
        try {
            // Determine status based on completeness
            // Note: Razon Social is required by UI, but we check here too
            const isComplete = formData.razonSocial && formData.rfc && formData.email;
            const status = isComplete ? "ACTIVE" : "DRAFT";

            console.log("Saving client...", { ...formData, salesRepId: user.uid, status });

            await addDoc(collection(db, "clients"), {
                ...formData,
                salesRepId: user.uid,
                status,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            router.push("/dashboard/sales/clients");
            router.refresh();
        } catch (error: any) {
            console.error("Error saving client:", error);
            alert(`Error al guardar el cliente: ${error.message || "Error desconocido"}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-[2rem] overflow-hidden shadow-2xl relative">
                {/* Decorative background element */}
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

                <form onSubmit={handleSubmit} className="relative p-8 md:p-12 space-y-10">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mb-2">
                            Gestión de Directorio
                        </div>
                        <h2 className="text-4xl font-black text-foreground tracking-tight">
                            Registrar <span className="text-primary italic">Nuevo Cliente</span>
                        </h2>
                        <p className="text-muted-foreground text-sm font-medium">
                            Completa los datos fiscales para integrar al nuevo prospecto a la red de North Tech.
                        </p>
                    </div>

                    <div className="space-y-8">
                        {/* Razón Social */}
                        <div className="group space-y-2">
                            <label className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1 transition-colors group-focus-within:text-primary">
                                Razón Social <span className="text-primary">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.razonSocial}
                                onChange={(e) => setFormData({ ...formData, razonSocial: e.target.value })}
                                className="w-full bg-muted/20 border-2 border-border/50 rounded-2xl p-4 text-base font-bold text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/50 focus:bg-primary/5 transition-all outline-none"
                                placeholder="PROVEEDORA INDUSTRIAL S.A. DE C.V."
                            />
                        </div>

                        {/* RFC & Email Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="group space-y-2">
                                <label className="flex items-center justify-between text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1 transition-colors group-focus-within:text-primary">
                                    <span>RFC</span>
                                    <span className="text-accent-blue text-[9px] lowercase font-medium opacity-70 italic">(Requerido para venta)</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.rfc}
                                    onChange={(e) => setFormData({ ...formData, rfc: e.target.value.toUpperCase() })}
                                    className="w-full bg-muted/20 border-2 border-border/50 rounded-2xl p-4 text-base font-bold text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/50 focus:bg-primary/5 transition-all outline-none"
                                    placeholder="XAXX010101000"
                                />
                            </div>
                            <div className="group space-y-2">
                                <label className="flex items-center justify-between text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1 transition-colors group-focus-within:text-primary">
                                    <span>Correo Electrónico</span>
                                    <span className="text-accent-blue text-[9px] lowercase font-medium opacity-70 italic">(Requerido para venta)</span>
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-muted/20 border-2 border-border/50 rounded-2xl p-4 text-base font-bold text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/50 focus:bg-primary/5 transition-all outline-none"
                                    placeholder="fiscal@empresa.com"
                                />
                            </div>
                        </div>

                        {/* Dirección */}
                        <div className="group space-y-2">
                            <label className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1 transition-colors group-focus-within:text-primary">
                                Dirección Fiscal
                            </label>
                            <textarea
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className="w-full bg-muted/20 border-2 border-border/50 rounded-2xl p-4 text-base font-bold text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/50 focus:bg-primary/5 transition-all outline-none min-h-[120px] resize-none"
                                placeholder="Col. Industrial, Calle Norte #101, CP 21000, Mexicali B.C."
                            />
                        </div>

                        {/* IVA Selector - Premium Style */}
                        <div className="bg-muted/10 border border-border/50 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 transition-all hover:bg-muted/20">
                            <div className="space-y-1">
                                <p className="text-sm font-black text-foreground uppercase tracking-wider">Configuración de Impuestos</p>
                                <p className="text-xs text-muted-foreground font-medium">Define la tasa de IVA según la ubicación del cliente.</p>
                            </div>
                            <div className="flex bg-card border border-border rounded-2xl p-1.5 shadow-inner">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, taxRate: 0.08 })}
                                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${formData.taxRate === 0.08
                                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105'
                                        : 'text-muted-foreground hover:bg-muted'
                                        }`}
                                >
                                    8% <span className="ml-1 opacity-50 font-normal">Frontera</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, taxRate: 0.16 })}
                                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${formData.taxRate === 0.16
                                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105'
                                        : 'text-muted-foreground hover:bg-muted'
                                        }`}
                                >
                                    16% <span className="ml-1 opacity-50 font-normal">Nacional</span>
                                </button>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-6 flex flex-col md:flex-row gap-4 items-center">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full md:flex-1 bg-primary text-primary-foreground py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Save className="w-5 h-5" />
                                )}
                                Finalizar Registro
                            </button>
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="w-full md:w-auto px-10 py-5 rounded-2xl bg-card border border-border text-foreground font-black text-sm uppercase tracking-widest hover:bg-muted transition-all"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
