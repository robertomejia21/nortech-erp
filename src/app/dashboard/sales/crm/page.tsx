"use client";

import { useState } from "react";
import CRMPipeline from "@/components/dashboard/CRMPipeline";
import { ArrowLeft, Target, TrendingUp, Zap } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

export default function CRMPage() {
    const [totals, setTotals] = useState({ totalValue: 0, activitiesToday: 0 });

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header section with Stats Context */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Link href="/dashboard" className="p-2 hover:bg-muted rounded-full transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                        <span className="text-xs font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full">Sales Hub</span>
                    </div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
                        <Target className="w-8 h-8 text-primary" />
                        CRM Pipeline Operativo
                    </h1>
                    <p className="text-muted-foreground mt-1 max-w-xl">
                        Gestiona tus leads, cotizaciones y negociaciones en un solo tablero visual. Arrastra para avanzar y completa las actividades sugeridas para cerrar más ventas.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="bg-card border border-border p-4 rounded-2xl shadow-sm flex items-center gap-4 min-w-[200px]">
                        <div className="p-3 bg-emerald-500/10 rounded-xl">
                            <TrendingUp className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Valor Total Pipeline</p>
                            <p className="text-xl font-black text-foreground">
                                {formatCurrency(totals.totalValue)}
                            </p>
                        </div>
                    </div>
                    <div className="bg-card border border-border p-4 rounded-2xl shadow-sm flex items-center gap-4 min-w-[200px]">
                        <div className="p-3 bg-accent-blue/10 rounded-xl">
                            <Zap className="w-5 h-5 text-accent-blue" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Actividades Hoy</p>
                            <p className="text-xl font-black text-foreground">{totals.activitiesToday} Pendientes</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* The Main Pipeline */}
            <div className="bg-card/30 border border-border/50 rounded-3xl p-6 backdrop-blur-sm">
                <CRMPipeline onTotalsUpdate={setTotals} />
            </div>
        </div>
    );
}
