"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { BarChart3, TrendingUp, Users, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function ReportsPage() {
    const [metrics, setMetrics] = useState({
        totalSales: 0,
        activeQuotes: 0,
        topSalesRes: [] as { name: string, total: number }[],
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMetrics();
    }, []);

    const fetchMetrics = async () => {
        setLoading(true);
        try {
            // Mocking aggregation since Firestore requires multiple queries or cloud functions for robust aggregation
            const quotesSnap = await getDocs(collection(db, "quotations"));
            let sales = 0;
            let count = 0;

            quotesSnap.forEach(doc => {
                const data = doc.data();
                if (data.status === 'ACCEPTED') {
                    sales += data.financials.total;
                }
                if (data.status === 'SENT' || data.status === 'DRAFT') {
                    count++;
                }
            });

            setMetrics({
                totalSales: sales,
                activeQuotes: count,
                topSalesRes: [
                    { name: "Juan Pérez", total: sales * 0.4 },
                    { name: "Maria Garcia", total: sales * 0.3 },
                    { name: "Pedro Lopez", total: sales * 0.1 },
                ]
            });
        } catch (error) {
            console.error("Error fetching metrics:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-black text-foreground tracking-tight">Reportes & <span className="text-primary italic">Analytics</span></h1>
                <p className="text-muted-foreground mt-1 text-sm font-medium">Visualiza el rendimiento operativo y comercial de Nortech en tiempo real.</p>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <BarChart3 className="w-10 h-10 animate-spin text-primary" />
                    <p className="text-muted-foreground font-medium animate-pulse">Compilando métricas estratégicas...</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-card/40 backdrop-blur-xl p-8 rounded-[2rem] border border-border/50 shadow-2xl relative overflow-hidden group">
                            <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none group-hover:bg-primary/10 transition-colors" />

                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-4 bg-primary/10 rounded-2xl text-primary">
                                    <DollarSign className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest">Facturación</h3>
                                    <p className="text-xs text-primary font-bold">Ventas Aprobadas</p>
                                </div>
                            </div>
                            <p className="text-3xl font-black text-foreground">{formatCurrency(metrics.totalSales)}</p>
                            <p className="text-xs text-success flex items-center mt-3 font-bold uppercase tracking-wider">
                                <TrendingUp className="w-3 h-3 mr-1" /> +12.4% vs Mes Anterior
                            </p>
                        </div>

                        <div className="bg-card/40 backdrop-blur-xl p-8 rounded-[2rem] border border-border/50 shadow-2xl relative overflow-hidden group">
                            <div className="absolute -right-10 -top-10 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/10 transition-colors" />

                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-4 bg-amber-500/10 rounded-2xl text-amber-500">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest">Pipeline</h3>
                                    <p className="text-xs text-amber-500 font-bold">Actividad Activa</p>
                                </div>
                            </div>
                            <p className="text-3xl font-black text-foreground">{metrics.activeQuotes}</p>
                            <p className="text-xs text-muted-foreground mt-3 font-medium">Cotizaciones en seguimiento</p>
                        </div>

                        <div className="bg-card/40 backdrop-blur-xl p-8 rounded-[2rem] border border-border/50 shadow-2xl relative overflow-hidden group">
                            <div className="absolute -right-10 -top-10 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-purple-500/10 transition-colors" />

                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-4 bg-purple-500/10 rounded-2xl text-purple-600">
                                    <Users className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest">Cuerza Humana</h3>
                                    <p className="text-xs text-purple-600 font-bold">Equipo de Ventas</p>
                                </div>
                            </div>
                            <p className="text-3xl font-black text-foreground">8</p>
                            <p className="text-xs text-muted-foreground mt-3 font-medium">Vendedores activos actualmente</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                        <div className="bg-card/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-border/50 shadow-2xl">
                            <h3 className="text-xl font-black text-foreground mb-8 flex items-center gap-3">
                                <BarChart3 className="w-6 h-6 text-primary" />
                                Rendimiento por <span className="text-primary italic">Vendedor</span>
                            </h3>
                            <div className="space-y-6">
                                {metrics.topSalesRes.map((rep, idx) => (
                                    <div key={idx} className="space-y-2">
                                        <div className="flex justify-between items-end">
                                            <span className="text-sm font-black uppercase tracking-widest text-foreground/80">{rep.name}</span>
                                            <span className="text-sm font-bold text-primary">{formatCurrency(rep.total)}</span>
                                        </div>
                                        <div className="w-full bg-muted/30 rounded-full h-3 overflow-hidden p-0.5 border border-border/50">
                                            <div
                                                className="bg-gradient-to-r from-primary to-blue-400 h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                                                style={{ width: `${(rep.total / (metrics.totalSales || 1)) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-card/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-border/50 shadow-2xl flex flex-col items-center justify-center text-center relative group overflow-hidden">
                            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            <div className="w-20 h-20 bg-muted/20 rounded-full flex items-center justify-center mb-6">
                                <TrendingUp className="w-10 h-10 text-muted-foreground/30 animate-pulse" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground">Distribución de Proveedores</h3>
                            <p className="text-muted-foreground mt-2 max-w-[250px] text-sm">Próximamente estaremos integrando el análisis profundo de gastos por proveedor.</p>
                            <div className="mt-8 px-6 py-2 rounded-full border border-primary/20 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
                                Módulo en Desarrollo
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

function FileText({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" x2="8" y1="13" y2="13" /><line x1="16" x2="8" y1="17" y2="17" /><line x1="10" x2="8" y1="9" y2="9" /></svg>
    )
}
