"use client";

import { useState, useEffect } from "react";
import {
    Users as UsersIcon,
    FileText,
    Target,
    CheckCircle2,
    DollarSign,
    MoreHorizontal,
    Calendar,
    AlertCircle,
    ArrowRight,
    ArrowLeft,
    Zap,
    MessageSquare,
    Clock,
    UserPlus,
    X,
    Loader2,
    TrendingUp as TrendingUpIcon,
    FilePlus
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { collection, query, getDocs, addDoc, serverTimestamp, where, updateDoc, doc, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";

const stageProgress: Record<string, number> = {
    leads: 10,
    quotes: 40,
    negotiation: 70,
    won: 100
};

interface CRMItem {
    id: string;
    client: string;
    amount: number;
    daysPast: number;
    task: string;
    priority: "low" | "medium" | "high" | "critical";
    status: string;
    progress: number;
    collaborators: string[];
}

interface CRMStage {
    id: string;
    title: string;
    color: string;
    items: CRMItem[];
}

interface CRMPipelineProps {
    onTotalsUpdate?: (totals: { totalValue: number; activitiesToday: number }) => void;
}

const CRM_STAGES = [
    { id: "leads", title: "Prospectos", color: "blue" },
    { id: "quotes", title: "Cotización", color: "amber" },
    { id: "negotiation", title: "Negociando", color: "purple" },
    { id: "won", title: "Ganada", color: "emerald" }
];

export default function CRMPipeline({ onTotalsUpdate }: CRMPipelineProps) {
    const { user, role } = useAuthStore();
    const router = useRouter();
    const [stages, setStages] = useState<CRMStage[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeMessage, setActiveMessage] = useState<string | null>(null);
    const [dragOverStage, setDragOverStage] = useState<string | null>(null);

    // Fetch Leads and Quotations from Firestore
    useEffect(() => {
        if (!user) return;

        // OPTIMIZATION: Load from cache immediately
        const cacheKey = `crm_stages_${user.uid}`;
        const cachedStages = localStorage.getItem(cacheKey);
        if (cachedStages) {
            try {
                setStages(JSON.parse(cachedStages));
                setLoading(false);
            } catch (e) {
                console.error("Error parsing CRM cache", e);
            }
        }

        let qLeads;
        let qQuotes;

        if (role === 'SUPERADMIN' || role === 'ADMIN') {
            qLeads = query(collection(db, "leads"));
            qQuotes = query(collection(db, "quotations"));
        } else {
            qLeads = query(collection(db, "leads"), where("salesRepId", "==", user.uid));
            qQuotes = query(collection(db, "quotations"), where("salesRepId", "==", user.uid));
        }

        const fetchClients = async () => {
            // Cache clients map specifically
            const clientCacheKey = 'crm_clients_map';
            const cachedClients = localStorage.getItem(clientCacheKey);
            let clientMap: any = cachedClients ? JSON.parse(cachedClients) : {};

            try {
                // Fetch fresh clients in background/parallel
                const snap = await getDocs(collection(db, "clients"));
                const freshMap = snap.docs.reduce((acc, d) => ({ ...acc, [d.id]: d.data().razonSocial }), {} as any);
                localStorage.setItem(clientCacheKey, JSON.stringify(freshMap));
                return freshMap;
            } catch (e) {
                console.error("Error fetching clients, using cache", e);
                return clientMap; // Fallback to cache if offline
            }
        };

        const setupListeners = async () => {
            const clientMap = await fetchClients();

            const unsubscribeLeads = onSnapshot(qLeads, (leadsSnap) => {
                const unsubscribeQuotes = onSnapshot(qQuotes, (quotesSnap) => {
                    const leads = leadsSnap.docs.map(doc => {
                        const data = doc.data();
                        return {
                            id: doc.id,
                            type: 'LEAD',
                            client: data.client, // Leads store client name directly often
                            amount: data.amount,
                            task: data.task || "Seguimiento",
                            priority: data.priority || "medium",
                            status: data.status,
                            progress: data.progress || 10,
                            createdAt: data.createdAt,
                            daysPast: data.createdAt ? Math.floor((Date.now() - data.createdAt.toMillis()) / (1000 * 60 * 60 * 24)) : 0,
                            collaborators: data.collaborators || []
                        };
                    });

                    const quotes = quotesSnap.docs.map(doc => {
                        const data = doc.data();
                        // Map Quotation Status to CRM Stage
                        let crmStatus = "quotes";
                        if (data.status === "FINALIZED" || data.status === "SENT") crmStatus = "negotiation";
                        if (data.status === "APPROVED") crmStatus = "won";

                        return {
                            id: doc.id,
                            type: 'QUOTE',
                            client: clientMap[data.clientId] || data.clientName || "Cliente Desconocido", // Fallback to clientName if stored
                            amount: data.financials?.total || 0,
                            task: "Cotización enviada",
                            priority: "high",
                            status: crmStatus,
                            progress: data.status === "FINALIZED" ? 70 : 40,
                            createdAt: data.createdAt,
                            daysPast: data.createdAt ? Math.floor((Date.now() - data.createdAt.toMillis()) / (1000 * 60 * 60 * 24)) : 0,
                            collaborators: []
                        };
                    });

                    // Merge and Deduplicate/Sort
                    const allItems = [...leads, ...quotes].sort((a, b) => {
                        const dateA = a.createdAt?.seconds || 0;
                        const dateB = b.createdAt?.seconds || 0;
                        return dateB - dateA;
                    });

                    const groupedStages = CRM_STAGES.map(stage => ({
                        ...stage,
                        items: allItems.filter(item => item.status === stage.id)
                    }));

                    setStages(groupedStages as any);
                    setLoading(false);

                    // Update Cache
                    localStorage.setItem(cacheKey, JSON.stringify(groupedStages));
                });

                return () => unsubscribeQuotes();
            });

            return () => unsubscribeLeads();
        };

        let cleanup: any;
        setupListeners().then(c => cleanup = c);

        return () => { if (cleanup) cleanup(); };
    }, [user, role]);

    // New Lead Modal State
    const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
    const [newLeadData, setNewLeadData] = useState({ client: "", amount: "", task: "", priority: "medium" as const });

    // Dynamic Totals Calculation
    useEffect(() => {
        if (onTotalsUpdate) {
            const totalValue = stages.reduce((acc, stage) =>
                acc + stage.items.reduce((sum, item) => sum + item.amount, 0), 0
            );
            const activitiesToday = stages.reduce((acc, stage) =>
                acc + stage.items.filter(item => item.status !== 'won').length, 0
            );
            onTotalsUpdate({ totalValue, activitiesToday });
        }
    }, [stages, onTotalsUpdate]);

    // Invite Modal State
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [selectedCard, setSelectedCard] = useState<{ id: string; stageId: string; client: string } | null>(null);
    const [availableUsers, setAvailableUsers] = useState<any[]>([]);
    const [isFetchingUsers, setIsFetchingUsers] = useState(false);

    const moveCard = async (itemId: string, fromStageId: string, toStageId: string) => {
        if (fromStageId === toStageId) return;

        try {
            // Find the item to check its type
            const item = stages.flatMap(s => s.items).find(i => i.id === itemId);
            if (!item) return;

            if ((item as any).type === 'QUOTE') {
                let newStatus = "DRAFT";
                if (toStageId === 'negotiation') newStatus = "FINALIZED";
                if (toStageId === 'won') newStatus = "FINALIZED"; // Or "APPROVED" if you have it

                await updateDoc(doc(db, "quotations", itemId), {
                    status: newStatus,
                    updatedAt: serverTimestamp()
                });
            } else {
                await updateDoc(doc(db, "leads", itemId), {
                    status: toStageId,
                    progress: stageProgress[toStageId] || 0,
                    updatedAt: serverTimestamp()
                });
            }

            setActiveMessage(`Oportunidad movida a ${CRM_STAGES.find(s => s.id === toStageId)?.title}`);
            setTimeout(() => setActiveMessage(null), 3000);
        } catch (error) {
            console.error("Error moving item:", error);
        }
    };

    const handleRedirectToNewQuote = () => {
        setIsNewLeadModalOpen(false);
        router.push("/dashboard/sales/quotes/new");
    };

    const handleCreateLead = async (e: React.FormEvent, shouldRedirect: boolean = false) => {
        e.preventDefault();
        if (!user) return;

        // Capture current data before clearing form
        const leadData = {
            client: newLeadData.client,
            amount: Number(newLeadData.amount),
            task: newLeadData.task || "Contacto inicial",
            priority: newLeadData.priority,
            status: shouldRedirect ? "quotes" : "leads",
            progress: shouldRedirect ? 40 : 10,
            collaborators: [],
            salesRepId: user.uid,
            salesRepName: user.displayName || user.email || "Agente",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        // UI OPTIMIZATION: Close modal immediately giving instant feedback
        setIsNewLeadModalOpen(false);
        setNewLeadData({ client: "", amount: "", task: "", priority: "medium" });

        try {
            await addDoc(collection(db, "leads"), leadData);

            if (shouldRedirect) {
                const params = new URLSearchParams({ client: leadData.client, amount: leadData.amount.toString() });
                router.push(`/dashboard/sales/quotes/new?${params.toString()}`);
            } else {
                setActiveMessage(`Nueva oportunidad creada para ${leadData.client} 🚀`);
                setTimeout(() => setActiveMessage(null), 3000);
            }
        } catch (error) {
            console.error("Error creating lead:", error);
            alert("Error al crear la oportunidad, revisa tu conexión.");
            // Re-open in case of failure to prevent data loss
            setIsNewLeadModalOpen(true);
            setNewLeadData({
                client: leadData.client,
                amount: leadData.amount.toString(),
                task: leadData.task === "Contacto inicial" ? "" : leadData.task,
                priority: leadData.priority as any
            });
        }
    };

    const handleDragStart = (e: React.DragEvent, itemId: string, fromStageId: string) => {
        e.dataTransfer.setData("itemId", itemId);
        e.dataTransfer.setData("fromStageId", fromStageId);
        e.dataTransfer.effectAllowed = "move";
        const target = e.currentTarget as HTMLElement;
        target.classList.add('opacity-40');
    };

    const handleDragEnd = (e: React.DragEvent) => {
        setDragOverStage(null);
        const target = e.currentTarget as HTMLElement;
        target.classList.remove('opacity-40');
    };

    const handleDragOver = (e: React.DragEvent, stageId: string) => {
        e.preventDefault();
        setDragOverStage(stageId);
    };

    const handleDrop = (e: React.DragEvent, toStageId: string) => {
        e.preventDefault();
        const itemId = e.dataTransfer.getData("itemId");
        const fromStageId = e.dataTransfer.getData("fromStageId");
        moveCard(itemId, fromStageId, toStageId);
        setDragOverStage(null);
    };

    const handleInviteClick = async (itemId: string, stageId: string, client: string) => {
        setSelectedCard({ id: itemId, stageId, client });
        setIsInviteModalOpen(true);
        setIsFetchingUsers(true);

        try {
            const q = query(collection(db, "users"), where("role", "in", ["SALES", "ADMIN", "SUPERADMIN"]));
            const querySnapshot = await getDocs(q);
            const users = querySnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(u => u.id !== user?.uid); // Exclude self
            setAvailableUsers(users);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setIsFetchingUsers(false);
        }
    };

    const sendInvite = async (invitedUser: any) => {
        if (!selectedCard) return;

        try {
            // Update local state to show new collaborator
            const newStages = stages.map(stage => {
                if (stage.id === selectedCard.stageId) {
                    return {
                        ...stage,
                        items: stage.items.map(item => {
                            if (item.id === selectedCard.id) {
                                return {
                                    ...item,
                                    collaborators: [...(item.collaborators || []), invitedUser.name || invitedUser.email]
                                };
                            }
                            return item;
                        })
                    };
                }
                return stage;
            });
            setStages(newStages);

            // Create Firestore Notification
            await addDoc(collection(db, "notifications"), {
                userId: invitedUser.id,
                title: "Nueva Invitación de Colaboración",
                message: `${user?.displayName || 'Un compañero'} te ha invitado a colaborar en la oportunidad de ${selectedCard.client}.`,
                read: false,
                createdAt: serverTimestamp(),
                link: `/dashboard/sales/crm`
            });

            setActiveMessage(`Invitación enviada a ${invitedUser.name || invitedUser.email}`);
            setIsInviteModalOpen(false);
            setTimeout(() => setActiveMessage(null), 3000);
        } catch (error) {
            console.error("Error sending invite:", error);
            alert("Error al enviar la invitación.");
        }
    };

    return (
        <div className="space-y-4 relative">
            {activeMessage && (
                <div className="fixed bottom-10 right-10 z-[60] animate-in slide-in-from-right duration-300">
                    <div className="bg-primary text-primary-foreground px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/20">
                        <Zap className="w-5 h-5 fill-current text-white" />
                        <span className="font-bold">{activeMessage}</span>
                    </div>
                </div>
            )}

            {/* Invite Modal */}
            {isInviteModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsInviteModalOpen(false)} />
                    <div className="relative bg-card border border-border w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-border flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-foreground">Invitar Colaborador</h3>
                                <p className="text-xs text-muted-foreground mt-1">Selecciona a quién quieres invitar para {selectedCard?.client}</p>
                            </div>
                            <button onClick={() => setIsInviteModalOpen(false)} className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 max-h-[400px] overflow-y-auto">
                            {isFetchingUsers ? (
                                <div className="py-10 flex flex-col items-center gap-3">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                    <p className="text-xs text-muted-foreground">Buscando compañeros...</p>
                                </div>
                            ) : availableUsers.length === 0 ? (
                                <p className="text-center py-6 text-muted-foreground italic text-sm">No se encontraron otros vendedores disponibles.</p>
                            ) : (
                                <div className="space-y-2">
                                    {availableUsers.map(u => (
                                        <button
                                            key={u.id}
                                            onClick={() => sendInvite(u)}
                                            className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-black text-white group-hover:bg-primary group-hover:text-white transition-all">
                                                    {(u.name || u.email).substring(0, 2).toUpperCase()}
                                                </div>
                                                <div className="text-left">
                                                    <p className="font-bold text-sm text-foreground">{u.name || 'Sin Nombre'}</p>
                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{u.role}</p>
                                                </div>
                                            </div>
                                            <UserPlus className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* New Lead Modal */}
            {isNewLeadModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsNewLeadModalOpen(false)} />
                    <div className="relative bg-card border border-border w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-border flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-foreground">Nueva Oportunidad</h3>
                                <p className="text-xs text-muted-foreground mt-1">El proceso inicia siempre como un nuevo prospecto</p>
                            </div>
                            <button onClick={() => setIsNewLeadModalOpen(false)} className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateLead} className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Cliente / Empresa</label>
                                <input
                                    required
                                    className="w-full bg-muted/30 border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                    placeholder="Nombre del cliente..."
                                    value={newLeadData.client}
                                    onChange={e => setNewLeadData({ ...newLeadData, client: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Monto Proyectado</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <input
                                            required
                                            type="number"
                                            className="w-full bg-muted/30 border border-border rounded-xl p-3 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                            placeholder="0.00"
                                            value={newLeadData.amount}
                                            onChange={e => setNewLeadData({ ...newLeadData, amount: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Prioridad</label>
                                    <select
                                        className="w-full bg-muted/30 border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                                        value={newLeadData.priority}
                                        onChange={e => setNewLeadData({ ...newLeadData, priority: e.target.value as any })}
                                    >
                                        <option value="low">Baja</option>
                                        <option value="medium">Media</option>
                                        <option value="high">Alta</option>
                                        <option value="critical">Crítica</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Siguiente Acción</label>
                                <input
                                    className="w-full bg-muted/30 border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                    placeholder="Ej: Llamada de presentación"
                                    value={newLeadData.task}
                                    onChange={e => setNewLeadData({ ...newLeadData, task: e.target.value })}
                                />
                            </div>
                            <div className="space-y-3">
                                <button type="submit" className="btn-primary w-full py-3 rounded-xl font-black shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all">
                                    Crear Prospecto
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => handleCreateLead(e, true)}
                                    className="btn-primary w-full py-3 rounded-xl font-black shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                                >
                                    <FilePlus className="w-4 h-4" />
                                    Crear y Cotizar Ahora
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between px-2 mb-2">
                <div>
                    <h3 className="text-lg font-black text-foreground tracking-tight">Tu Pipeline Interactivo</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5 font-medium italic opacity-70">
                        Solo los prospectos inician el proceso de venta.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsNewLeadModalOpen(true)}
                        className="btn-primary py-1.5 px-4 rounded-lg text-[10px] font-black transition-all hover:shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:scale-105 active:scale-95"
                    >
                        + Nueva Oportunidad
                    </button>
                </div>
            </div>

            <div className="flex lg:grid lg:grid-cols-4 gap-4 overflow-x-auto pb-4 px-2 scrollbar-hide">
                {loading ? (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4">
                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                        <p className="text-muted-foreground font-medium">Cargando pipeline...</p>
                    </div>
                ) : stages.map((stage) => (
                    <div
                        key={stage.id}
                        className="flex flex-col min-w-[270px] group/stage"
                        onDragOver={(e) => handleDragOver(e, stage.id)}
                        onDragLeave={() => setDragOverStage(null)}
                        onDrop={(e) => handleDrop(e, stage.id)}
                    >
                        {/* Header Columna */}
                        <div className="flex items-center justify-between mb-3 px-3 py-1.5 rounded-xl bg-card/10 backdrop-blur-sm border border-white/5">
                            <div className="flex items-center gap-2.5">
                                <div className={`w-2 h-2 rounded-full bg-accent-${stage.color} shadow-[0_0_8px_rgba(var(--accent-${stage.color}),0.6)]`} />
                                <h4 className="font-black text-[12px] uppercase tracking-tighter text-foreground/90">{stage.title}</h4>
                                <span className="bg-zinc-800 text-white px-1.5 py-0.5 rounded-md text-[9px] font-black border border-white/10">
                                    {stage.items.length}
                                </span>
                            </div>
                        </div>

                        {/* Drop Zone / Tasks List */}
                        <div className={`flex-1 space-y-3 p-3 rounded-[1.5rem] border-2 transition-all duration-300 min-h-[480px] ${dragOverStage === stage.id
                            ? 'bg-primary/5 border-dashed border-primary/40 shadow-[inset_0_0_30px_rgba(var(--primary),0.05)]'
                            : 'bg-muted/10 border-transparent shadow-inner'
                            }`}>
                            {stage.items.length === 0 && !dragOverStage && (
                                <div className="h-40 flex flex-col items-center justify-center text-center opacity-30">
                                    <Target className="w-8 h-8 mb-2" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Sin oportunidades</p>
                                </div>
                            )}

                            {stage.items.map((item) => (
                                <CRMCard
                                    key={item.id}
                                    item={item}
                                    color={stage.color}
                                    onMove={(dir: 'left' | 'right') => {
                                        const stageOrder = ["leads", "quotes", "negotiation", "won"];
                                        const idx = stageOrder.indexOf(stage.id);
                                        const toIdx = dir === 'right' ? idx + 1 : idx - 1;
                                        moveCard(item.id, stage.id, stageOrder[toIdx]);
                                    }}
                                    onDragStart={(e) => handleDragStart(e, item.id, stage.id)}
                                    onDragEnd={handleDragEnd}
                                    onInvite={() => handleInviteClick(item.id, stage.id, item.client)}
                                    onComplete={() => setActiveMessage(`Actividad completada para ${item.client} ✨`)}
                                    onConvertToQuote={(item) => {
                                        // Redirect to quote form with client name pre-filled if possible
                                        const params = new URLSearchParams({ client: item.client, amount: item.amount.toString() });
                                        window.location.href = `/dashboard/sales/quotes/new?${params.toString()}`;
                                    }}
                                    showLeft={stage.id !== 'leads'}
                                    showRight={stage.id !== 'won'}
                                />
                            ))}

                            {stage.id === "leads" && (
                                <button
                                    onClick={() => setIsNewLeadModalOpen(true)}
                                    className="w-full py-4 rounded-xl border-2 border-dashed border-border/20 hover:border-primary/40 hover:bg-primary/5 transition-all text-[10px] font-black text-muted-foreground hover:text-primary flex items-center justify-center gap-2 group/add opacity-50 hover:opacity-100"
                                >
                                    <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center group-hover/add:bg-primary group-hover/add:text-white transition-all">
                                        <span className="text-sm">+</span>
                                    </div>
                                    Nueva Oportunidad
                                </button>
                            )}
                        </div>

                        {/* Stage Summary Footer - Compact & Visible */}
                        <div className="mt-3 px-1">
                            <div className="bg-card/40 backdrop-blur-md border border-white/5 p-3 rounded-2xl shadow-lg relative overflow-hidden group/footer">
                                {/* Glow Accent */}
                                <div className={`absolute top-0 left-0 w-full h-0.5 bg-accent-${stage.color} opacity-30 shadow-[0_0_10px_rgba(var(--accent-${stage.color}),0.5)]`} />

                                <div className="flex items-center justify-between relative z-10">
                                    <div>
                                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.15em] mb-0.5 flex items-center gap-1.5">
                                            <Calendar className={`w-3 h-3 text-accent-${stage.color}`} />
                                            Valor Etapa
                                        </p>
                                        <p className="text-lg font-black text-foreground tracking-tight drop-shadow-sm">
                                            {formatCurrency(stage.items.reduce((acc, i) => acc + i.amount, 0))}
                                        </p>
                                    </div>
                                    <div className={`w-9 h-9 rounded-xl bg-accent-${stage.color}/10 flex items-center justify-center border border-accent-${stage.color}/20 group-hover/footer:scale-105 transition-transform`}>
                                        <DollarSign className={`w-5 h-5 text-accent-${stage.color}`} />
                                    </div>
                                </div>

                                {/* Background Pattern Decor */}
                                <div className="absolute -bottom-4 -right-4 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity rotate-12">
                                    <Target className="w-24 h-24" />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

interface CRMCardProps {
    item: any;
    color: string;
    onMove: (direction: 'left' | 'right') => void;
    onDragStart: (e: React.DragEvent) => void;
    onDragEnd: (e: React.DragEvent) => void;
    onInvite: () => void;
    onComplete: () => void;
    showLeft: boolean;
    showRight: boolean;
    onConvertToQuote?: (item: any) => void;
}

function CRMCard({ item, color, onMove, onDragStart, onDragEnd, onInvite, onComplete, showLeft, showRight, onConvertToQuote }: CRMCardProps) {
    const priorityConfig: any = {
        low: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
        medium: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        high: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        critical: "bg-red-500/10 text-red-500 border-red-500/30 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.1)]"
    };

    const getStageAction = (status: string, defaultTask: string) => {
        switch (status) {
            case 'leads': return "Crear cotización";
            case 'quotes': return "Enviar cotización";
            case 'negotiation': return "Enviar orden de compra";
            case 'won': return "Solicitar factura";
            default: return defaultTask;
        }
    };

    return (
        <div
            draggable
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            className="card-premium p-3.5 bg-card border-border/40 hover:border-primary/60 hover:shadow-[0_15px_30px_-10px_rgba(0,0,0,0.5)] transition-all duration-300 group relative cursor-grab active:cursor-grabbing hover:-translate-y-0.5"
        >
            {/* Header with Priority and Movement Buttons */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${priorityConfig[item.priority]}`}>
                        {item.priority}
                    </span>
                    {item.type === 'QUOTE' && (
                        <span className="text-[7px] font-black bg-accent-blue/20 text-accent-blue px-1.5 py-0.5 rounded border border-accent-blue/30 uppercase tracking-tighter">
                            COTIZACIÓN
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    {showLeft && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onMove('left'); }}
                            className="p-1.5 hover:bg-zinc-800 rounded-lg text-muted-foreground hover:text-white transition-all"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                    )}
                    {showRight && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onMove('right'); }}
                            className="p-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg transition-all"
                        >
                            <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Client and Value */}
            <div>
                <h5 className="font-black text-foreground text-sm leading-tight mb-1.5 group-hover:text-primary transition-colors pr-6 line-clamp-1">
                    {item.client}
                </h5>

                <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-emerald-500" />
                        <span className="font-black text-foreground">{formatCurrency(item.amount)}</span>
                    </div>
                    <span className="opacity-20">|</span>
                    <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{item.daysPast}d</span>
                    </div>
                </div>
            </div>

            {/* Interactive Suggested Activity */}
            <div
                onClick={onComplete}
                className="p-3 rounded-xl bg-zinc-900/60 border border-white/5 hover:border-primary/40 group-hover:bg-primary/5 transition-all cursor-pointer relative overflow-hidden"
            >
                <div className="flex items-center gap-1.5 mb-1.5">
                    <Zap className="w-3 h-3 text-accent-cyan fill-current animate-pulse" />
                    <span className="text-[9px] font-black uppercase text-accent-cyan tracking-widest">Acción</span>
                </div>
                <div className="flex items-center justify-between gap-1.5">
                    <p className="text-[12px] font-black text-foreground/90 leading-tight line-clamp-1">
                        {getStageAction(item.status, item.task)}
                    </p>
                    {item.status === 'quotes' && item.type !== 'QUOTE' ? (
                        <button
                            onClick={(e) => { e.stopPropagation(); if (onConvertToQuote) onConvertToQuote(item); }}
                            className="bg-accent-amber/20 text-accent-amber p-1.5 rounded-lg hover:bg-accent-amber hover:text-white transition-all group/btn flex items-center gap-1.5"
                            title="Convertir a Cotización Real"
                        >
                            <FilePlus className="w-3.5 h-3.5" />
                            <span className="text-[8px] font-bold">CREAR COTIZACIÓN</span>
                        </button>
                    ) : (
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center translate-x-3 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                        </div>
                    )}
                </div>
            </div>

            {/* Progress Footer */}
            <div className="mt-5 flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex -space-x-2">
                    {(item.collaborators || []).slice(0, 2).map((label: string, i: number) => (
                        <div key={i} className="w-6 h-6 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 border-2 border-background flex items-center justify-center text-[8px] font-black text-zinc-300 shadow-lg" title={label}>
                            {label.substring(0, 1).toUpperCase()}
                        </div>
                    ))}
                    <button
                        onClick={(e) => { e.stopPropagation(); onInvite(); }}
                        className="w-6 h-6 rounded-full bg-primary border-2 border-background flex items-center justify-center text-[8px] font-black text-white shadow-lg hover:scale-110 active:scale-95 transition-all"
                    >
                        +
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 bg-zinc-800/50 rounded-full overflow-hidden border border-white/5">
                        <div
                            className={`h-full bg-accent-${color} shadow-[0_0_8px_rgba(var(--accent-${color}),0.5)] transition-all duration-1000`}
                            style={{ width: `${item.progress}%` }}
                        />
                    </div>
                    <span className="text-[9px] font-black text-muted-foreground uppercase opacity-70">
                        {item.progress}%
                    </span>
                </div>
            </div>
        </div>
    );
}
