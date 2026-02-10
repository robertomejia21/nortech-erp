"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
    Settings,
    Save,
    Percent,
    Globe,
    DollarSign,
    Info,
    CheckCircle2,
    AlertCircle,
    Building2,
    ShieldCheck
} from "lucide-react";

type GlobalSettings = {
    ivaRate: number;
    importRate: number;
    defaultMargin: number;
    exchangeRate: number;
    companyName: string;
    currency: string;
};

export default function BusinessSettingsPage() {
    const [settings, setSettings] = useState<GlobalSettings>({
        ivaRate: 0.16,
        importRate: 0.10,
        defaultMargin: 0.30,
        exchangeRate: 18.20,
        companyName: "Nortech S.A. de C.V.",
        currency: "MXN"
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const docRef = doc(db, "config", "business");
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setSettings(docSnap.data() as GlobalSettings);
                }
            } catch (error) {
                console.error("Error fetching settings:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);
        try {
            await setDoc(doc(db, "config", "business"), {
                ...settings,
                updatedAt: serverTimestamp()
            });
            setMessage({ type: 'success', text: "Configuración guardada correctamente." });
        } catch (error) {
            console.error("Error saving settings:", error);
            setMessage({ type: 'error', text: "Error al guardar la configuración." });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Settings className="w-8 h-8 text-primary" /> Configuración de Negocio
                    </h1>
                    <p className="text-muted-foreground mt-1">Variables globales y parámetros operativos del ERP.</p>
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-xl border flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-destructive/10 border-destructive/20 text-destructive'
                    }`}>
                    {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <span className="text-sm font-medium">{message.text}</span>
                </div>
            )}

            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* General Business Info */}
                <div className="card-premium p-6 bg-card space-y-4">
                    <h3 className="text-lg font-bold flex items-center gap-2 border-b border-border pb-4">
                        <Building2 className="w-5 h-5 text-accent-blue" /> Información General
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Nombre de la Empresa</label>
                            <input
                                type="text"
                                className="input-dark w-full"
                                value={settings.companyName}
                                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Moneda por Defecto</label>
                            <select
                                className="input-dark w-full"
                                value={settings.currency}
                                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                            >
                                <option value="MXN">Pesos (MXN)</option>
                                <option value="USD">Dólares (USD)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Tax & Financials */}
                <div className="card-premium p-6 bg-card space-y-4">
                    <h3 className="text-lg font-bold flex items-center gap-2 border-b border-border pb-4">
                        <ShieldCheck className="w-5 h-5 text-emerald-500" /> Parámetros Fiscales
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Tasa de IVA Global (%)</label>
                            <div className="relative">
                                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="number"
                                    step="0.01"
                                    className="input-dark w-full pl-10"
                                    value={settings.ivaRate * 100}
                                    onChange={(e) => setSettings({ ...settings, ivaRate: parseFloat(e.target.value) / 100 })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Tipo de Cambio Base</label>
                            <div className="relative">
                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="number"
                                    step="0.01"
                                    className="input-dark w-full pl-10"
                                    value={settings.exchangeRate}
                                    onChange={(e) => setSettings({ ...settings, exchangeRate: parseFloat(e.target.value) })}
                                />
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                                <Info className="w-3 h-3" /> Usado como sugerencia en nuevas cotizaciones.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Margins and Operations */}
                <div className="card-premium p-6 bg-card md:col-span-2 space-y-4">
                    <h3 className="text-lg font-bold flex items-center gap-2 border-b border-border pb-4">
                        <DollarSign className="w-5 h-5 text-amber-500" /> Costos y Operación
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Tasa Promedio de Importación (%)</label>
                            <div className="relative">
                                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="number"
                                    step="0.01"
                                    className="input-dark w-full pl-10"
                                    value={settings.importRate * 100}
                                    onChange={(e) => setSettings({ ...settings, importRate: parseFloat(e.target.value) / 100 })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Margen de Utilidad Sugerido (%)</label>
                            <div className="relative">
                                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="number"
                                    step="0.01"
                                    className="input-dark w-full pl-10"
                                    value={settings.defaultMargin * 100}
                                    onChange={(e) => setSettings({ ...settings, defaultMargin: parseFloat(e.target.value) / 100 })}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-2 flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="btn-primary px-8 flex items-center gap-2"
                    >
                        {saving ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : <Save className="w-4 h-4" />}
                        {saving ? "Guardando..." : "Guardar Cambios"}
                    </button>
                </div>
            </form>
        </div>
    );
}
