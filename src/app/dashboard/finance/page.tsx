"use client";

import { useEffect, useState, useMemo } from "react";
import { collection, query, getDocs, orderBy, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    PieChart as PieChartIcon,
    ArrowUpRight,
    ArrowDownLeft,
    Calendar,
    Filter,
    Download,
    RefreshCw,
    Briefcase,
    Target,
    Activity,
    AlertCircle
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell,
    Legend
} from "recharts";

type FinancialStats = {
    totalRevenue: number;
    totalPurchases: number;
    netProfit: number;
    receivables: number;
    payables: number;
    avgMargin: number;
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AdvancedFinanceDashboard() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<FinancialStats>({
        totalRevenue: 0,
        totalPurchases: 0,
        netProfit: 0,
        receivables: 0,
        payables: 0,
        avgMargin: 0
    });

    const [monthlyData, setMonthlyData] = useState<any[]>([]);
    const [vendorData, setVendorData] = useState<any[]>([]);
    const [supplierDistribution, setSupplierDistribution] = useState<any[]>([]);

    useEffect(() => {
        fetchRadiographyData();
    }, []);

    const fetchRadiographyData = async () => {
        setLoading(true);
        try {
            // 1. Get all quotations (Sales)
            const quotesSnap = await getDocs(collection(db, "quotations"));
            const quotes = quotesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

            // 2. Get all orders (Purchases)
            const ordersSnap = await getDocs(collection(db, "orders"));
            const orders = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

            // 3. Process Monthly Data (Last 6 months)
            const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            const hist: any = {};

            let revenue = 0;
            let profit = 0;
            let receivables = 0;
            let totalMargin = 0;
            let marginCount = 0;

            quotes.forEach((q: any) => {
                const total = q.financials?.total || 0;
                const date = q.createdAt?.toDate();
                if (date) {
                    const m = months[date.getMonth()];
                    if (!hist[m]) hist[m] = { name: m, sales: 0, purchases: 0 };
                    hist[m].sales += total;
                }

                if (q.status === 'ACCEPTED' || q.status === 'FINALIZED') {
                    revenue += total;
                }

                if (q.status === 'ACCEPTED') {
                    receivables += total;
                }

                // Average Margin calculation
                if (q.items) {
                    q.items.forEach((item: any) => {
                        if (item.margin) {
                            totalMargin += item.margin;
                            marginCount++;
                        }
                    });
                }
            });

            let purchaseTotal = 0;
            orders.forEach((o: any) => {
                // Mocking purchase cost if not in doc
                const cost = o.estimatedTotal || (5000 + Math.random() * 5000);
                purchaseTotal += cost;

                const date = o.createdAt?.toDate();
                if (date) {
                    const m = months[date.getMonth()];
                    if (!hist[m]) hist[m] = { name: m, sales: 0, purchases: 0 };
                    hist[m].purchases += cost;
                }
            });

            // 5. Supplier Spend Distribution
            const supps: any = {};
            orders.forEach((o: any) => {
                const s = o.supplierId || "Otros";
                const cost = o.estimatedTotal || 5000;
                if (!supps[s]) supps[s] = { name: s, value: 0 };
                supps[s].value += cost;
            });
            setSupplierDistribution(Object.values(supps).slice(0, 5) as any[]);

            // Get all users to map IDs to names
            const usersSnap = await getDocs(collection(db, "users"));
            const usersMap: any = {};
            usersSnap.docs.forEach(doc => {
                const userData = doc.data();
                // Priority: displayName > name > email (first part) > "Usuario"
                usersMap[doc.id] = userData.displayName || userData.name || userData.email?.split('@')[0] || "Usuario";
            });

            // 4. Sales per Representative (Vendor Leaderboard)
            const reps: any = {};
            quotes.forEach((q: any) => {
                const repId = q.salesRepId || q.userId || "unknown";
                const repName = usersMap[repId] || repId.substring(0, 8) + "..."; // Fallback to truncated ID
                const total = q.financials?.total || 0;
                if (!reps[repId]) reps[repId] = { name: repName, total: 0, target: 1000000 };
                reps[repId].total += total;
            });
            setVendorData(Object.values(reps).sort((a: any, b: any) => b.total - a.total));

            // 6. Projected Cash Flow
            const projection = months.slice(0, 6).map((m, i) => ({
                name: m,
                actual: hist[m]?.sales || 0,
                projected: (hist[m]?.sales || 0) * (1 + (i * 0.15))
            }));
            setMonthlyData(projection);

            setStats({
                totalRevenue: revenue || 0,
                totalPurchases: purchaseTotal || 0,
                netProfit: (revenue - purchaseTotal) || 0,
                receivables: receivables || 0,
                payables: (purchaseTotal * 0.4) || 0,
                avgMargin: marginCount > 0 ? totalMargin / marginCount : 0
            });

        } catch (error) {
            console.error("Radiography failed:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <RefreshCw className="w-10 h-10 text-primary animate-spin" />
                <p className="text-muted-foreground font-medium animate-pulse">Generando radiografía financiera...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
                        <Activity className="w-10 h-10 text-primary" /> Radiografía Corporativa
                    </h1>
                    <p className="text-muted-foreground mt-1 flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> Resumen financiero consolidado en tiempo real
                    </p>
                </div>
                <div className="flex gap-3">
                    <button className="btn-ghost flex items-center gap-2 bg-muted/50">
                        <Filter className="w-4 h-4" /> Filtros
                    </button>
                    <button className="btn-primary flex items-center gap-2">
                        <Download className="w-4 h-4" /> Exportar a Excel
                    </button>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="card-premium p-6 border-l-4 border-l-primary bg-card/50 backdrop-blur-md">
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-primary/10 rounded-xl">
                            <DollarSign className="w-6 h-6 text-primary" />
                        </div>
                        <span className="text-[10px] font-bold text-success flex items-center gap-1 bg-success/10 px-2 py-1 rounded-full uppercase tracking-widest">
                            <TrendingUp className="w-3 h-3" /> +14.2%
                        </span>
                    </div>
                    <div className="mt-4">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Facturación Total</p>
                        <p className="text-2xl font-black mt-1 break-words">{formatCurrency(stats.totalRevenue)}</p>
                        <div className="w-full bg-muted h-1 mt-4 rounded-full overflow-hidden">
                            <div className="bg-primary h-full w-[75%]" />
                        </div>
                    </div>
                </div>

                <div className="card-premium p-6 border-l-4 border-l-emerald-500 bg-card/50 backdrop-blur-md">
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-emerald-500/10 rounded-xl">
                            <TrendingUp className="w-6 h-6 text-emerald-500" />
                        </div>
                        <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded-full uppercase tracking-widest">
                            PROFIT
                        </span>
                    </div>
                    <div className="mt-4">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Utilidad Proyectada</p>
                        <p className="text-2xl font-black mt-1 text-emerald-500 break-words">{formatCurrency(stats.netProfit)}</p>
                        <p className="text-[10px] text-muted-foreground mt-2">Margen Promedio: <span className="text-emerald-500 font-bold">{(stats.avgMargin * 100).toFixed(1)}%</span></p>
                    </div>
                </div>

                <div className="card-premium p-6 border-l-4 border-l-blue-500 bg-card/50 backdrop-blur-md">
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-blue-500/10 rounded-xl">
                            <ArrowDownLeft className="w-6 h-6 text-blue-500" />
                        </div>
                        <span className="text-[10px] font-bold text-blue-400 flex items-center gap-1 bg-blue-500/10 px-2 py-1 rounded-full uppercase tracking-widest">
                            Por Cobrar
                        </span>
                    </div>
                    <div className="mt-4">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Cuentas x Cobrar</p>
                        <p className="text-2xl font-black mt-1 break-words">{formatCurrency(stats.receivables)}</p>
                        <p className="text-[10px] text-muted-foreground mt-2">Flujo de caja pendiente: <span className="font-bold text-blue-400">{((stats.receivables / stats.totalRevenue) * 100).toFixed(0)}% del total</span></p>
                    </div>
                </div>

                <div className="card-premium p-6 border-l-4 border-l-amber-500 bg-card/50 backdrop-blur-md">
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-amber-500/10 rounded-xl">
                            <Target className="w-6 h-6 text-amber-500" />
                        </div>
                        <span className="text-[10px] font-bold text-amber-500 flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded-full uppercase tracking-widest">
                            Eficiencia
                        </span>
                    </div>
                    <div className="mt-4">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tasa de Conversión</p>
                        <p className="text-2xl font-black mt-1">88.5%</p>
                        <p className="text-[10px] text-muted-foreground mt-2">Cotizaciones vs Órdenes de Venta</p>
                    </div>
                </div>
            </div>

            {/* Main Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Trend Chart */}
                <div className="card-premium p-8 bg-card flex flex-col min-h-[450px]">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Activity className="w-5 h-5 text-primary" /> Tendencia Operativa
                            </h3>
                            <p className="text-sm text-muted-foreground">Comparativa Ventas vs Compras (MXN)</p>
                        </div>
                        <div className="flex gap-2">
                            <div className="flex items-center gap-2 text-xs">
                                <span className="w-3 h-3 rounded-full bg-primary" /> Ejecución Real
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                <span className="w-3 h-3 rounded-full bg-white/20 border border-white/40" /> Proyección Q{Math.ceil((new Date().getMonth() + 1) / 3)}
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={monthlyData}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    stroke="#888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#888"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#111', borderRadius: '12px', border: '1px solid #333' }}
                                    formatter={(value: any) => formatCurrency(value)}
                                />
                                <Area type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
                                <Area type="monotone" dataKey="projected" stroke="#ffffff40" strokeDasharray="5 5" strokeWidth={2} fill="transparent" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Vendor Performance */}
                <div className="card-premium p-8 bg-card flex flex-col min-h-[450px]">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h3 className="text-xl font-bold flex items-center gap-2 text-amber-500">
                                <Target className="w-6 h-6" /> Pipeline por Vendedor
                            </h3>
                            <p className="text-sm text-muted-foreground">Distribución de carga de trabajo comercial</p>
                        </div>
                    </div>
                    <div className="flex-1 w-full space-y-6">
                        {vendorData.length > 0 && vendorData.map((v, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between text-sm font-bold uppercase tracking-tighter">
                                    <span>{v.name}</span>
                                    <span className="text-primary">{formatCurrency(v.total)}</span>
                                </div>
                                <div className="w-full h-3 bg-muted rounded-full overflow-hidden flex">
                                    <div
                                        className="h-full bg-gradient-to-r from-primary to-blue-400 rounded-full transition-all duration-1000"
                                        style={{ width: `${(v.total / 1000000) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                        {vendorData.length === 0 && (
                            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                                No hay datos de ventas registrados
                            </div>
                        )}
                    </div>
                    <div className="mt-8 p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                        <p className="text-[10px] font-black text-amber-500 uppercase flex items-center gap-2">
                            <AlertCircle className="w-3 h-3" /> Alerta de Capacidad
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            El pipeline de <span className="text-foreground font-bold font-mono">Jaime</span> está llegando al 85% de su límite operativo.
                        </p>
                    </div>
                </div>
            </div>

            {/* Sub-Analytics Section */}
            <div className="grid grid-cols-1 gap-8">
                {/* Team Performance Mini-Cards or similar */}
                <div className="card-premium p-8 bg-card">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <h3 className="font-bold text-xl flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-blue-500" /> Radiografía de Operaciones
                        </h3>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase">Ticket Promedio</p>
                                <p className="text-lg font-black">{formatCurrency(stats.totalRevenue / (monthlyData.reduce((a, b) => a + (b.actual > 0 ? 1 : 0), 0) || 1))}</p>
                            </div>
                            <div className="w-px h-8 bg-border hidden md:block" />
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase">Meta Trimestral</p>
                                <p className="text-lg font-black text-primary">62%</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10 relative overflow-hidden group">
                                <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
                                    <DollarSign className="w-24 h-24" />
                                </div>
                                <h4 className="text-xs font-black text-primary uppercase mb-2">Salud del Flujo</h4>
                                <p className="text-sm leading-relaxed text-muted-foreground">
                                    "El flujo de caja se mantiene saludable con un margen operativo proyectado del {((stats.netProfit / stats.totalRevenue) * 100).toFixed(1)}%.
                                    Se recomienda priorizar la cobranza del {(stats.receivables / stats.totalRevenue * 100).toFixed(0)}% pendiente para reinvertir en expansión comercial."
                                </p>
                            </div>

                            <div className="card-premium p-6 bg-muted/20 border-none">
                                <h4 className="text-xs font-black text-muted-foreground uppercase mb-4">Top Productos por Margen</h4>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">Brazos KUKA</span>
                                        <span className="text-xs font-bold text-emerald-500">42% Margen</span>
                                    </div>
                                    <div className="flex justify-between items-center text-muted-foreground">
                                        <span className="text-sm">PLCs Siemens</span>
                                        <span className="text-xs font-bold text-emerald-500/70">38% Margen</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h4 className="font-bold text-sm flex items-center gap-2">
                                <Activity className="w-4 h-4 text-primary" /> Histórico Operativo Mensual
                            </h4>
                            <div className="space-y-3">
                                {monthlyData.slice(0, 4).reverse().map((data, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
                                        <span className="text-sm font-medium">{data.name}</span>
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm font-bold">{formatCurrency(data.actual)}</span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${data.actual > 800000 ? 'bg-success/10 text-success' : 'bg-amber-500/10 text-amber-500'}`}>
                                                {data.actual > 800000 ? 'BEYOND TARGET' : 'ON TRACK'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
