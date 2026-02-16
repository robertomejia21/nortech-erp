
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type BusinessPulse = {
    sentiment: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'CRITICAL';
    title: string;
    message: string;
    recommendation: string;
    icon: string;
    color: string;
};

interface DashboardStats {
    revenue: number;
    pendingQuotes: number;
    activeDeals: number;
    netProfit: number;
}

export const analyzeBusinessHealth = (stats: DashboardStats): BusinessPulse => {
    // 1. Define Thresholds (Simulated "AI" Logic)
    const healthyRevenue = 1000000;
    const healthyPipeline = 30; // Min pending quotes
    const healthyDeals = 10; // Min active deals

    // 2. Evaluate Metrics
    const isRevenueHealthy = stats.revenue >= healthyRevenue;
    const isPipelineHealthy = stats.pendingQuotes >= healthyPipeline;
    const isActivityHealthy = stats.activeDeals >= healthyDeals;

    // 3. Determine Sentiment
    // EXCELLENT: All metrics healthy
    if (isRevenueHealthy && isPipelineHealthy && isActivityHealthy) {
        return {
            sentiment: 'EXCELLENT',
            title: "Crecimiento Sostenido 🚀",
            message: "La empresa muestra una tracción excepcional. Los ingresos superan el objetivo y el pipeline de ventas está robusto, asegurando flujo de caja para el próximo trimestre.",
            recommendation: "Es momento de invertir en expansión de inventario o nuevos canales de venta.",
            icon: "🚀",
            color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
        };
    }

    // GOOD: Revenue healthy, but slight dip in activity
    if (isRevenueHealthy && (!isPipelineHealthy || !isActivityHealthy)) {
        return {
            sentiment: 'GOOD',
            title: "Estabilidad con Alerta 🌤️",
            message: "Los números financieros son sólidos, pero la actividad comercial (cotizaciones/envíos) muestra una leve desaceleración. Podría impactar el cierre de mes.",
            recommendation: "Incentiva al equipo de ventas a reactivar prospectos dormidos.",
            icon: "🌤️",
            color: "text-blue-500 bg-blue-500/10 border-blue-500/20"
        };
    }

    // WARNING: Revenue low, but high activity (potential turnover)
    if (!isRevenueHealthy && isPipelineHealthy) {
        return {
            sentiment: 'WARNING',
            title: "Potencial Latente ⏳",
            message: "Hay mucha actividad en el pipeline, pero no se está cerrando suficiente facturación. El equipo está trabajando, pero falta concretar.",
            recommendation: "Revisa los descuentos o tiempos de entrega para acelerar el cierre de tratos.",
            icon: "⏳",
            color: "text-amber-500 bg-amber-500/10 border-amber-500/20"
        };
    }

    // CRITICAL: Everything low
    return {
        sentiment: 'CRITICAL',
        title: "Atención Requerida ⚠️",
        message: "Detectamos una caída simultánea en ingresos y actividad comercial. Es crítico intervenir para evitar problemas de flujo de caja.",
        recommendation: "Convoca una reunión de emergencia con Ventas y Finanzas.",
        icon: "⚠️",
        color: "text-red-500 bg-red-500/10 border-red-500/20"
    };
};

export const notifySalesRep = async (salesRepId: string, message: string, href: string) => {
    try {
        await addDoc(collection(db, "notifications"), {
            userId: salesRepId,
            message,
            href,
            createdAt: serverTimestamp(),
            read: false,
            type: 'PAYMENT_RECEIVED'
        });
        console.log("🔔 Notificación enviada a " + salesRepId + ": " + message);
    } catch (error) {
        console.error("Error sending notification:", error);
    }
};
