"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthStore } from "@/store/useAuthStore";
import { ArrowLeft, Save, Loader2, Building2 } from "lucide-react";
import Link from "next/link";

export default function NewSupplierPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        contactName: "",
        email: "",
        phone: "",
        category: "GENERAL",
        creditTerms: "CONTADO",
        customCreditTerms: "",
        street: "",
        city: "",
        state: "",
        zipCode: "",
        notes: ""
    });

    const [files, setFiles] = useState<{
        constancia: File | null;
        opinion: File | null;
    }>({
        constancia: null,
        opinion: null
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        try {
            const finalCreditTerms = formData.creditTerms === "OTRO"
                ? formData.customCreditTerms
                : formData.creditTerms;

            await addDoc(collection(db, "suppliers"), {
                ...formData,
                creditTerms: finalCreditTerms,
                hasConstancia: !!files.constancia,
                hasOpinion: !!files.opinion,
                createdBy: user.uid,
                createdAt: serverTimestamp(),
            });
            router.push("/dashboard/sales/suppliers");
        } catch (error) {
            console.error("Error creating supplier:", error);
            alert("Error al crear el proveedor. Verifica los permisos.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard/sales/suppliers"
                    className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Nuevo Proveedor</h1>
                    <p className="text-muted-foreground">Registra un nuevo aliado industrial</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="card-premium p-6 space-y-4 bg-card">
                        <div className="flex items-center gap-2 mb-2 text-accent-blue font-semibold">
                            <Building2 className="w-4 h-4" />
                            <span>Información General</span>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Nombre / Razón Social *</label>
                            <input
                                required
                                type="text"
                                className="input-dark w-full"
                                placeholder="Nombre de la empresa"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Categoría</label>
                            <select
                                className="input-dark w-full"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            >
                                <option value="GENERAL">General</option>
                                <option value="MATERIALES">Materiales</option>
                                <option value="SERVICIOS">Servicios Técnicos</option>
                                <option value="MAQUINARIA">Maquinaria</option>
                                <option value="QUIMICOS">Químicos</option>
                            </select>
                        </div>
                    </div>

                    <div className="card-premium p-6 space-y-4 bg-card">
                        <div className="flex items-center gap-2 mb-2 text-accent-blue font-semibold">
                            <Save className="w-4 h-4" />
                            <span>Contacto</span>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Nombre del Contacto</label>
                            <input
                                type="text"
                                className="input-dark w-full"
                                placeholder="Ej. Juan Pérez"
                                value={formData.contactName}
                                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Correo Electrónico</label>
                            <input
                                type="email"
                                className="input-dark w-full"
                                placeholder="proveedor@empresa.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Teléfono</label>
                            <input
                                type="tel"
                                className="input-dark w-full"
                                placeholder="+52 ..."
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="card-premium p-6 space-y-4 bg-card">
                        <h3 className="text-sm font-medium text-accent-blue flex items-center gap-2 mb-2">
                            <span>Documentación Fiscal</span>
                        </h3>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Constancia de Situación Fiscal</label>
                                <div className="relative group">
                                    <input
                                        type="file"
                                        accept=".pdf,.jpg,.png"
                                        className="hidden"
                                        id="constancia-upload"
                                        onChange={(e) => setFiles({ ...files, constancia: e.target.files?.[0] || null })}
                                    />
                                    <label
                                        htmlFor="constancia-upload"
                                        className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-accent-blue/50 hover:bg-muted/50 transition-all"
                                    >
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                                            <p className="mb-1 text-xs text-foreground group-hover:text-accent-blue truncate w-full">
                                                {files.constancia ? files.constancia.name : "Subir PDF o Imagen"}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground uppercase">Constancia SAT</p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Opinión del SAT</label>
                                <div className="relative group">
                                    <input
                                        type="file"
                                        accept=".pdf,.jpg,.png"
                                        className="hidden"
                                        id="opinion-upload"
                                        onChange={(e) => setFiles({ ...files, opinion: e.target.files?.[0] || null })}
                                    />
                                    <label
                                        htmlFor="opinion-upload"
                                        className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-accent-blue/50 hover:bg-muted/50 transition-all"
                                    >
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                                            <p className="mb-1 text-xs text-foreground group-hover:text-accent-blue truncate w-full">
                                                {files.opinion ? files.opinion.name : "Subir PDF o Imagen"}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground uppercase">Opinión de cumplimiento</p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card-premium p-6 space-y-4 bg-card">
                        <h3 className="text-sm font-medium text-accent-blue flex items-center gap-2 mb-2">
                            <span>Condiciones y Ubicación</span>
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Términos de Crédito</label>
                                <select
                                    className="input-dark w-full"
                                    value={formData.creditTerms}
                                    onChange={(e) => setFormData({ ...formData, creditTerms: e.target.value })}
                                >
                                    <option value="CONTADO">Contado</option>
                                    <option value="NETO 15">Neto 15 días</option>
                                    <option value="NETO 30">Neto 30 días</option>
                                    <option value="NETO 60">Neto 60 días</option>
                                    <option value="OTRO">Otro...</option>
                                </select>
                            </div>

                            {formData.creditTerms === "OTRO" && (
                                <div className="space-y-2 animate-in slide-in-from-top-2">
                                    <label className="text-sm font-medium text-foreground">Especifique Términos</label>
                                    <input
                                        required
                                        type="text"
                                        className="input-dark w-full"
                                        placeholder="Ej. Neto 45 días"
                                        value={formData.customCreditTerms}
                                        onChange={(e) => setFormData({ ...formData, customCreditTerms: e.target.value })}
                                    />
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">Calle y Número</label>
                                    <input
                                        type="text"
                                        className="input-dark w-full"
                                        placeholder="Ej. Av. Reforma 123"
                                        value={formData.street}
                                        onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">Ciudad</label>
                                        <input
                                            type="text"
                                            className="input-dark w-full"
                                            placeholder="Ej. Monterrey"
                                            value={formData.city}
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">Estado</label>
                                        <input
                                            type="text"
                                            className="input-dark w-full"
                                            placeholder="Ej. Nuevo León"
                                            value={formData.state}
                                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">Código Postal</label>
                                    <input
                                        type="text"
                                        className="input-dark w-full"
                                        placeholder="Ej. 64000"
                                        value={formData.zipCode}
                                        onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Notas Adicionales</label>
                            <textarea
                                className="input-dark w-full min-h-[100px]"
                                placeholder="Información adicional relevante..."
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <Link
                        href="/dashboard/sales/suppliers"
                        className="btn-secondary px-6"
                    >
                        Cancelar
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary px-10 flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Guardar Proveedor
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
