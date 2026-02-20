"use client";

import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { parseConstancia } from "@/lib/parseConstancia";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { Loader2, Save, UploadCloud, FileText, CheckCircle } from "lucide-react";

interface SupplierFormProps {
    redirectUrl?: string;
}

export default function SupplierForm({ redirectUrl = "/dashboard/admin/suppliers" }: SupplierFormProps) {
    const router = useRouter();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState<{ [key: string]: boolean }>({});

    const [formData, setFormData] = useState({
        name: "",
        rfc: "",
        contactName: "",
        email: "",
        phone: "",
        creditTerms: "Contado",
        street: "",
        city: "",
        state: "",
        zipCode: "",
        notes: "",
        taxSituationUrl: "", // Constancia
        complianceOpinionUrl: "" // Opinión
    });

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'taxSituationUrl' | 'complianceOpinionUrl') => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(prev => ({ ...prev, [field]: true }));
        try {
            // Create a reference
            const storageRef = ref(storage, `suppliers/docs/${Date.now()}_${file.name}`);

            // Upload
            const snapshot = await uploadBytes(storageRef, file);

            // Get URL
            const url = await getDownloadURL(snapshot.ref);

            setFormData(prev => ({ ...prev, [field]: url }));

            // Auto-fill logic using parseConstancia
            if (field === 'taxSituationUrl') {
                try {
                    const extractedData = await parseConstancia(file);

                    setFormData(prev => ({
                        ...prev,
                        name: prev.name || extractedData.razonSocial || "",
                        rfc: prev.rfc || extractedData.rfc || "",
                        zipCode: prev.zipCode || extractedData.zipCode || "",
                    }));
                } catch (parseError) {
                    console.error("Failed to parse PDF:", parseError);
                    // Don't block upload if parsing fails
                }
            }

        } catch (error: any) {
            console.error("Error uploading file:", error);
            alert(`Error al subir el archivo: ${error.message || error.code || 'Desconocido'}`);
        } finally {
            setUploading(prev => ({ ...prev, [field]: false }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            alert("Error: No has iniciado sesión.");
            return;
        }

        setLoading(true);
        try {
            await addDoc(collection(db, "suppliers"), {
                ...formData,
                createdBy: user.uid,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            const willCreateAnother = confirm("Proveedor guardado exitosamente. ¿Deseas registrar otro?");
            if (willCreateAnother) {
                setFormData({
                    name: "",
                    rfc: "",
                    contactName: "",
                    email: "",
                    phone: "",
                    creditTerms: "Contado",
                    street: "",
                    city: "",
                    state: "",
                    zipCode: "",
                    notes: "",
                    taxSituationUrl: "",
                    complianceOpinionUrl: ""
                });
                window.scrollTo(0, 0);
            } else {
                router.push(redirectUrl);
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
        <form onSubmit={handleSubmit} className="bg-zinc-950 p-8 rounded-2xl shadow-2xl border border-zinc-900 max-w-5xl mx-auto text-zinc-100">
            <div className="flex items-center gap-3 mb-8 border-b border-zinc-800 pb-4">
                <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                    Alta de Proveedor y Documentación
                </h2>
            </div>

            {/* SECTION 1: DOCUMENTATION (FIRST as requested) */}
            <div className="mb-10 bg-zinc-900/50 p-6 rounded-xl border border-zinc-800/50">
                <h3 className="text-lg font-semibold text-blue-400 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Documentación Fiscal (Carga Automática)
                </h3>
                <p className="text-xs text-zinc-500 mb-6">
                    Sube la Constancia de Situación Fiscal y la Opinión de Cumplimiento para completar el expediente digital.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Constancia Upload */}
                    <div className="relative group">
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Constancia de Situación Fiscal
                        </label>
                        <div className={`border-2 border-dashed rounded-xl p-8 transition-all text-center flex flex-col items-center justify-center min-h-[160px]
                            ${formData.taxSituationUrl ? 'border-emerald-500/50 bg-emerald-900/10' : 'border-zinc-700 hover:border-blue-500 bg-zinc-900 hover:bg-zinc-800/80'}`}>

                            {uploading['taxSituationUrl'] ? (
                                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                            ) : formData.taxSituationUrl ? (
                                <>
                                    <CheckCircle className="w-10 h-10 text-emerald-500 mb-2" />
                                    <span className="text-emerald-400 text-sm font-medium">Archivo Cargado</span>
                                    <p className="text-zinc-500 text-xs mt-1">Listo para procesar</p>
                                </>
                            ) : (
                                <>
                                    <UploadCloud className="w-10 h-10 text-zinc-500 mb-3 group-hover:text-blue-400 transition-colors" />
                                    <span className="text-zinc-400 text-sm">Arrastra o haz clic para subir</span>
                                    <p className="text-zinc-600 text-xs mt-1">PDF, JPG, PNG</p>
                                </>
                            )}

                            <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => handleFileUpload(e, 'taxSituationUrl')}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                disabled={uploading['taxSituationUrl'] || !!formData.taxSituationUrl}
                            />
                        </div>
                    </div>

                    {/* Opinion Upload */}
                    <div className="relative group">
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Opinión de Cumplimiento
                        </label>
                        <div className={`border-2 border-dashed rounded-xl p-8 transition-all text-center flex flex-col items-center justify-center min-h-[160px]
                            ${formData.complianceOpinionUrl ? 'border-emerald-500/50 bg-emerald-900/10' : 'border-zinc-700 hover:border-blue-500 bg-zinc-900 hover:bg-zinc-800/80'}`}>

                            {uploading['complianceOpinionUrl'] ? (
                                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                            ) : formData.complianceOpinionUrl ? (
                                <>
                                    <CheckCircle className="w-10 h-10 text-emerald-500 mb-2" />
                                    <span className="text-emerald-400 text-sm font-medium">Archivo Cargado</span>
                                </>
                            ) : (
                                <>
                                    <UploadCloud className="w-10 h-10 text-zinc-500 mb-3 group-hover:text-blue-400 transition-colors" />
                                    <span className="text-zinc-400 text-sm">Arrastra o haz clic para subir</span>
                                </>
                            )}

                            <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => handleFileUpload(e, 'complianceOpinionUrl')}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                disabled={uploading['complianceOpinionUrl'] || !!formData.complianceOpinionUrl}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Basic Info */}
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-blue-400 mb-4">Información General</h3>

                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1 ml-1 uppercase tracking-wider">
                            Razón Social <span className="text-red-500">*</span>
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

                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1 ml-1 uppercase tracking-wider">
                            RFC <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.rfc}
                            onChange={(e) => setFormData({ ...formData, rfc: e.target.value.toUpperCase() })}
                            className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all placeholder:text-zinc-600 font-mono tracking-wide"
                            placeholder="GHI789012XYZ"
                            maxLength={13}
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
