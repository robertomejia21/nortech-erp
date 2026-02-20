"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, addDoc, serverTimestamp, doc, updateDoc, getDoc, setDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Loader2, Plus, Trash2, Calculator, Users, Package,
    FileText, Send, CheckCircle2, ChevronRight, ChevronLeft,
    Printer, Download, Search, X, Check, Truck, Edit2, Coins, HelpCircle, AlertTriangle
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { generateQuotePDF } from "@/lib/pdfGenerator";

type Client = { id: string; razonSocial: string; taxRate: number; rfc?: string; email?: string; phone?: string; contactName?: string };
type Supplier = { id: string; name: string };
type Product = { id: string; name: string; basePrice: number; sku: string; supplierId?: string; supplierName?: string };

type QuoteItem = {
    productId: string;
    productName: string;
    quantity: number;
    basePrice: number;
    importCost: number;
    freightCost: number;
    margin: number; // 0.30 for 30%
    currency?: "MXN" | "USD";
    supplierId?: string;
    supplierName?: string;
};

const STEPS = [
    { number: 1, title: "Cliente y Prospecto", icon: Users },
    { number: 2, title: "Selección de Productos", icon: Package },
    { number: 3, title: "Calculadora de Precios", icon: Calculator },
    { number: 4, title: "Formalización y Envío", icon: FileText },
];

export default function QuoteForm({ initialId }: { initialId?: string }) {
    const { user, isLoading: authLoading } = useAuthStore();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [currentStep, setCurrentStep] = useState(1);

    // Data State
    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(true);
    const [clients, setClients] = useState<Client[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [isCatalogOpen, setIsCatalogOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCatalogIds, setSelectedCatalogIds] = useState<string[]>([]);

    // Support Request State
    const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
    const [supportMessage, setSupportMessage] = useState("");
    const [supportLoading, setSupportLoading] = useState(false);

    // Form State
    const [selectedClientId, setSelectedClientId] = useState("");
    const [newClientMode, setNewClientMode] = useState(false);
    const [newClientData, setNewClientData] = useState({ razonSocial: "", rfc: "", email: "", phone: "", contactName: "" });
    const [newProductMode, setNewProductMode] = useState(false);
    const [newProductData, setNewProductData] = useState({ name: "", sku: "", basePrice: 0, supplierId: "" });
    const [clientSearch, setClientSearch] = useState("");
    const [isEditingClient, setIsEditingClient] = useState(false);

    const [items, setItems] = useState<QuoteItem[]>([]);
    const [taxRate, setTaxRate] = useState(0.08);
    const [currency, setCurrency] = useState<"MXN" | "USD">("MXN");
    const [notes, setNotes] = useState("");
    const [folio, setFolio] = useState("");
    const [exchangeRate, setExchangeRate] = useState(1);
    const [globalSettings, setGlobalSettings] = useState({
        ivaRate: 0.16,
        importRate: 0.10,
        defaultMargin: 0.30,
        exchangeRate: 18.20
    });

    // Calculated Values
    const [subtotal, setSubtotal] = useState(0);
    const [taxAmount, setTaxAmount] = useState(0);
    const [total, setTotal] = useState(0);

    // Initial Load
    useEffect(() => {
        const loadData = async () => {
            if (authLoading || !user) return;
            try {
                setDataLoading(true);
                const clientsSnap = await getDocs(collection(db, "clients"));
                const clientList = clientsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Client))
                    .sort((a, b) => (a.razonSocial || "").localeCompare(b.razonSocial || ""));
                setClients(clientList);

                const [productsSnap, suppliersSnap] = await Promise.all([
                    getDocs(collection(db, "products")),
                    getDocs(collection(db, "suppliers"))
                ]);

                const supplierList = suppliersSnap.docs.map(d => ({ id: d.id, ...d.data() } as any))
                    .sort((a: any, b: any) => (a.name || "").localeCompare(b.name || ""));
                setSuppliers(supplierList);

                const sortedProducts = productsSnap.docs.map(d => {
                    const data = d.data();
                    const s = supplierList.find(sup => sup.id === data.supplierId);
                    return { id: d.id, ...data, supplierName: s?.name } as Product;
                }).sort((a, b) => (a.name || "").localeCompare(b.name || ""));

                setProducts(sortedProducts);

                // Load existing quote if initialId is provided
                if (initialId) {
                    const quoteRef = doc(db, "quotations", initialId);
                    const quoteSnap = await getDoc(quoteRef);
                    if (quoteSnap.exists()) {
                        const q = quoteSnap.data();
                        setSelectedClientId(q.clientId);
                        setItems(q.items || []);
                        setNotes(q.notes || "");
                        setCurrency(q.financials?.currency || "MXN");
                        setTaxRate(q.financials?.taxRate || 0.08);
                        setFolio(q.folio || "");
                        setExchangeRate(q.financials?.exchangeRate || 1);
                    }
                }
                // Handle Search Params (Conversion from CRM)
                if (!initialId) {
                    const clientParam = searchParams.get("client");
                    if (clientParam) {
                        const matchedClient = clientList.find(c =>
                            c.razonSocial.toLowerCase() === clientParam.toLowerCase() ||
                            c.razonSocial.toLowerCase().includes(clientParam.toLowerCase())
                        );
                        if (matchedClient) {
                            setSelectedClientId(matchedClient.id);
                        } else {
                            // If no exact match, at least set the search filter
                            setClientSearch(clientParam);
                        }
                    }
                }
            } catch (err) {
                console.error("Error loading data:", err);
            } finally {
                setDataLoading(false);
            }
        };

        const fetchGlobalSettings = async () => {
            try {
                const docRef = doc(db, "config", "business");
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const settings = docSnap.data();
                    setGlobalSettings(settings as any);
                    // Only set defaults if NOT editing
                    if (!initialId) {
                        setTaxRate(settings.ivaRate || 0.16);
                        setExchangeRate(settings.exchangeRate || 18.20);
                    }
                }
            } catch (error) {
                console.error("Error fetching global settings:", error);
            }
        };

        loadData();
        fetchGlobalSettings();
    }, [user, authLoading, initialId]);

    // --- Support Request Handler ---
    const handleSupportRequest = async () => {
        if (!supportMessage.trim()) return alert("Por favor describe tu solicitud.");
        setSupportLoading(true);
        try {
            // Find admins to notify
            const q = query(collection(db, "users"), where("role", "in", ["ADMIN", "SUPERADMIN"]));
            const adminsSnap = await getDocs(q);

            const promises = adminsSnap.docs.map(adminDoc =>
                addDoc(collection(db, "notifications"), {
                    userId: adminDoc.id,
                    title: "Solicitud de Soporte en Cotización",
                    message: `${user?.displayName || 'Vendedor'} necesita ayuda: "${supportMessage}"`,
                    type: "SUPPORT_REQUEST",
                    read: false,
                    createdAt: serverTimestamp(),
                    link: "/dashboard/sales/quotes" // Or deep link if possible
                })
            );

            await Promise.all(promises);
            alert("Solicitud enviada a los administradores.");
            setIsSupportModalOpen(false);
            setSupportMessage("");
        } catch (error) {
            console.error("Error sending support request:", error);
            alert("Error al enviar solicitud.");
        } finally {
            setSupportLoading(false);
        }
    };

    // Recalculate Totals
    useEffect(() => {
        const newSubtotal = items.reduce((acc, item) => {
            const itemCurrency = item.currency || "MXN";
            const cost = item.basePrice + (item.importCost || 0) + (item.freightCost || 0);
            const priceInItemCurrency = cost * (1 + item.margin);

            let priceInQuoteCurrency = priceInItemCurrency;
            if (itemCurrency !== currency) {
                if (itemCurrency === "USD" && currency === "MXN") {
                    priceInQuoteCurrency = priceInItemCurrency * exchangeRate;
                } else if (itemCurrency === "MXN" && currency === "USD") {
                    priceInQuoteCurrency = priceInItemCurrency / exchangeRate;
                }
            }

            return acc + (priceInQuoteCurrency * item.quantity);
        }, 0);

        setSubtotal(newSubtotal);
        setTaxAmount(newSubtotal * taxRate);
        setTotal(newSubtotal * (1 + taxRate));
    }, [items, taxRate, currency, exchangeRate]);

    // Update tax rate from client
    useEffect(() => {
        if (selectedClientId && !newClientMode) {
            const client = clients.find(c => c.id === selectedClientId);
            if (client) setTaxRate(client.taxRate || 0.08);
        }
    }, [selectedClientId, clients, newClientMode]);

    // --- Actions ---

    const handleSaveClient = async () => {
        if (!newClientData.razonSocial) return alert("Razón Social es obligatoria");

        // OPTIMISTIC UPDATE: Immediate UI feedback
        const isEdit = isEditingClient && selectedClientId;
        const optimisticId = isEdit ? selectedClientId : doc(collection(db, "clients")).id;

        const optimisticClient = {
            id: optimisticId,
            ...newClientData,
            taxRate: 0.16
        } as Client;

        if (isEdit) {
            setClients(clients.map(c => c.id === optimisticId ? { ...c, ...newClientData } : c));
        } else {
            setClients([...clients, optimisticClient]);
            setSelectedClientId(optimisticId);
        }

        // Close modal immediately
        setNewClientMode(false);
        setNewClientData({ razonSocial: "", rfc: "", email: "", phone: "", contactName: "" });
        setIsEditingClient(false);

        // Background Save
        try {
            if (isEdit) {
                await updateDoc(doc(db, "clients", optimisticId), {
                    ...newClientData,
                    updatedAt: serverTimestamp()
                });
            } else {
                await setDoc(doc(db, "clients", optimisticId), {
                    ...newClientData,
                    createdAt: serverTimestamp(),
                    salesRepId: user?.uid,
                    status: "DRAFT",
                    taxRate: 0.16
                });
            }
        } catch (err) {
            console.error("Background save error:", err);
            alert("Error guardando en la nube. Revisa tu conexión.");
        }
    };

    const handleCreateProduct = async () => {
        if (!newProductData.name || !newProductData.basePrice || !newProductData.supplierId) return alert("Nombre, Precio Base y Proveedor son obligatorios");
        setLoading(true);
        try {
            const docRef = await addDoc(collection(db, "products"), {
                ...newProductData,
                createdAt: serverTimestamp(),
                createdBy: user?.uid,
            });
            const newProduct = { id: docRef.id, ...newProductData, supplierName: (suppliers as any).find((s: any) => s.id === newProductData.supplierId)?.name } as Product;
            setProducts([...products, newProduct]);
            setNewProductMode(false);
            setNewProductData({ name: "", sku: "", basePrice: 0, supplierId: "" });
            setLoading(false);
            // Optionally auto-add to items if list is empty or specific action
        } catch (e) {
            console.error("Error creating product:", e);
            alert("Error al crear producto.");
            setLoading(false);
        }
    };

    const addItem = () => {
        setItems([...items, {
            productId: "", productName: "", quantity: 1,
            basePrice: 0, importCost: 0, freightCost: 0, margin: globalSettings.defaultMargin || 0.30,
            currency: "MXN",
            supplierId: "", supplierName: ""
        }]);
    };

    const updateItem = (index: number, field: keyof QuoteItem, value: any) => {
        const newItems = [...items];
        if (field === "productId") {
            const product = products.find(p => p.id === value);
            newItems[index] = {
                ...newItems[index],
                productId: value,
                productName: product?.name || "",
                basePrice: product?.basePrice || 0,
                supplierId: product?.supplierId || "",
                supplierName: product?.supplierName || ""
            };
        } else {
            // @ts-ignore
            newItems[index][field] = value;
        }
        setItems(newItems);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const validateStep1 = () => {
        if (newClientMode) return !!newClientData.razonSocial;
        return !!selectedClientId;
    };

    const validateFinal = () => {
        // "Block if Name, Email or RFC missing"
        const client = clients.find(c => c.id === selectedClientId);
        if (!client) return false;
        // Basic check, allows Draft state but warns
        if (!client.rfc || !client.email || !client.razonSocial) {
            const proceed = confirm("El cliente tiene datos faltantes (RFC/Email). Se guardará como BORRADOR. ¿Deseas continuar?");
            return proceed;
        }
        return true;
    };

    const handleSubmit = async (status: 'DRAFT' | 'SENT') => {
        if (!user || !selectedClientId) return;

        if (status === 'SENT' && !validateFinal()) return;

        setLoading(true);
        try {
            const finalFolio = folio || `COT-${Date.now().toString().slice(-6)}`;

            // Enrich items with calculated unit prices for reporting and display
            const enrichedItems = items.map(item => {
                const cost = (item.basePrice || 0) + (item.importCost || 0) + (item.freightCost || 0);
                const unitPrice = cost * (1 + (item.margin || 0));
                return { ...item, unitPrice };
            });

            const quoteData = {
                clientId: selectedClientId,
                salesRepId: user.uid,
                items: enrichedItems,
                financials: { subtotal, taxRate, taxAmount, total, currency, exchangeRate },
                notes,
                status: status === 'SENT' ? 'FINALIZED' : 'DRAFT',
                createdAt: serverTimestamp(),
                folio: finalFolio,
            };

            if (initialId) {
                await updateDoc(doc(db, "quotations", initialId), {
                    ...quoteData,
                    status: status === 'SENT' ? 'FINALIZED' : 'DRAFT', // Keep finalized if it was draft or viceversa
                    updatedAt: serverTimestamp(),
                });
            } else {
                await addDoc(collection(db, "quotations"), quoteData);
            }

            if (status === 'SENT') {
                const client = clients.find(c => c.id === selectedClientId);
                // Prompt PDF download
                if (confirm("Cotización guardada. ¿Deseas descargar el PDF ahora?")) {
                    // @ts-ignore
                    generateQuotePDF({ ...quoteData, folio: finalFolio }, client, user);
                }
            }

            router.push(initialId ? `/dashboard/sales/quotes/${initialId}` : "/dashboard/sales/quotes");
        } catch (error) {
            console.error("Error saving quote:", error);
            alert("Error al guardar.");
        } finally {
            setLoading(false);
        }
    };

    const handleGeneratePDF = () => {
        const client = clients.find(c => c.id === selectedClientId) || newClientData;
        const quoteCheck = {
            folio: folio || "PREVIEW",
            items,
            financials: { subtotal, taxRate, taxAmount, total, currency },
            notes
        };
        // @ts-ignore
        generateQuotePDF(quoteCheck, client, user);
    };

    if (authLoading || dataLoading) {
        return <div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in pb-20">
            {/* Wizard Header */}
            <div className="flex flex-col gap-4 mb-8 bg-card p-4 rounded-xl border border-border shadow-sm">
                <div className="flex justify-between items-center border-b border-border pb-4 mb-2">
                    <h1 className="text-xl font-bold text-foreground">Nueva Cotización</h1>
                    <button
                        onClick={() => setIsSupportModalOpen(true)}
                        className="btn-ghost text-xs flex items-center gap-2 text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
                    >
                        <HelpCircle className="w-4 h-4" />
                        Solicitar Ayuda / Requerimiento Especial
                    </button>
                </div>
                <div className="flex justify-between items-center">
                    {STEPS.map((step, idx) => (
                        <div
                            key={step.number}
                            className={`flex items-center cursor-pointer group ${idx !== STEPS.length - 1 ? 'flex-1' : ''}`}
                            onClick={() => {
                                // Only allow navigating to previous steps or next one if valid
                                if (step.number < currentStep) {
                                    setCurrentStep(step.number);
                                } else if (step.number === currentStep + 1) {
                                    // Simulate 'Next' button validation
                                    if (currentStep === 1 && !validateStep1()) return alert("Completa el cliente.");
                                    if (currentStep === 2 && items.length === 0) return alert("Agrega productos.");
                                    setCurrentStep(step.number);
                                }
                            }}
                        >
                            <div
                                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all group-hover:scale-110 ${currentStep >= step.number
                                    ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20'
                                    : 'bg-muted border-muted-foreground/20 text-muted-foreground'
                                    }`}
                            >
                                <step.icon className="w-5 h-5" />
                            </div>
                            <div className="ml-3 mr-3 hidden sm:block">
                                <p className={`text-xs font-bold uppercase tracking-wider ${currentStep >= step.number ? 'text-foreground' : 'text-muted-foreground'}`}>
                                    Paso {step.number}
                                </p>
                                <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{step.title}</p>
                            </div>
                            {idx !== STEPS.length - 1 && (
                                <div className={`h-1 flex-1 mx-4 rounded-full ${currentStep > step.number ? 'bg-primary' : 'bg-muted'}`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Step Content */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm min-h-[400px]">

                    {/* --- Step 1: Client --- */}
                    {currentStep === 1 && (
                        <div className="space-y-6 max-w-2xl mx-auto">
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold">¿A quién vamos a cotizar?</h2>
                                <p className="text-muted-foreground">Busca un cliente existente o registra uno nuevo rápidamente.</p>
                            </div>

                            {!newClientMode ? (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Buscar Cliente</label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <input
                                                type="text"
                                                placeholder="Filtrar por nombre o RFC..."
                                                className="input-dark pl-10 w-full"
                                                value={clientSearch}
                                                onChange={(e) => setClientSearch(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <select
                                            value={selectedClientId}
                                            onChange={(e) => setSelectedClientId(e.target.value)}
                                            className="input-dark flex-1 p-3 text-lg"
                                        >
                                            <option value="">Selecciona un cliente...</option>
                                            {clients
                                                .filter(c =>
                                                    c.razonSocial.toLowerCase().includes(clientSearch.toLowerCase()) ||
                                                    (c.rfc && c.rfc.toLowerCase().includes(clientSearch.toLowerCase()))
                                                )
                                                .map(c => (
                                                    <option key={c.id} value={c.id}>{c.razonSocial} - {c.rfc || 'Sin RFC'}</option>
                                                ))}
                                            {clientSearch && clients.filter(c =>
                                                c.razonSocial.toLowerCase().includes(clientSearch.toLowerCase()) ||
                                                (c.rfc && c.rfc.toLowerCase().includes(clientSearch.toLowerCase()))
                                            ).length === 0 && (
                                                    <option disabled value="">No se encontraron resultados para "{clientSearch}"</option>
                                                )}
                                        </select>
                                        <button
                                            onClick={() => {
                                                setIsEditingClient(false);
                                                setNewClientData({ razonSocial: clientSearch, rfc: "", email: "", phone: "", contactName: "" });
                                                setNewClientMode(true);
                                            }}
                                            className="btn-secondary whitespace-nowrap px-6"
                                        >
                                            <Plus className="w-5 h-5 mr-2" /> Nuevo
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4 bg-muted/20 p-6 rounded-xl border border-border animate-in zoom-in-95">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold flex items-center gap-2 text-lg">
                                            <Users className="w-5 h-5 text-primary" />
                                            {isEditingClient ? "Editar Cliente" : "Nuevo Prospecto"}
                                        </h3>
                                        <button onClick={() => {
                                            setNewClientMode(false);
                                            setIsEditingClient(false);
                                        }} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="text-xs uppercase font-bold text-muted-foreground">Razón Social *</label>
                                            <input
                                                value={newClientData.razonSocial}
                                                onChange={e => setNewClientData({ ...newClientData, razonSocial: e.target.value })}
                                                className="input-dark w-full"
                                                placeholder="Nombre de la empresa"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs uppercase font-bold text-muted-foreground">RFC</label>
                                            <input
                                                value={newClientData.rfc}
                                                onChange={e => setNewClientData({ ...newClientData, rfc: e.target.value })}
                                                className="input-dark w-full"
                                                placeholder="XEXX010101000"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs uppercase font-bold text-muted-foreground">Email</label>
                                            <input
                                                value={newClientData.email}
                                                onChange={e => setNewClientData({ ...newClientData, email: e.target.value })}
                                                className="input-dark w-full"
                                                placeholder="contacto@empresa.com"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2 pt-4">
                                        <button onClick={() => {
                                            setNewClientMode(false);
                                            setIsEditingClient(false);
                                        }} className="btn-ghost text-sm">Cancelar</button>
                                        <button onClick={handleSaveClient} disabled={loading} className="btn-primary text-sm">
                                            {loading ? <Loader2 className="animate-spin w-4 h-4" /> : (isEditingClient ? "Actualizar Cliente" : "Guardar Prospecto")}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {selectedClientId && !newClientMode && (
                                <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/10 rounded-lg animate-in fade-in">
                                    <div className="flex items-center gap-4 text-primary">
                                        <CheckCircle2 className="w-6 h-6" />
                                        <div>
                                            <p className="font-bold text-lg">Cliente Seleccionado</p>
                                            <p className="opacity-80">IVA configurado al {(taxRate * 100).toFixed(0)}%</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const client = clients.find(c => c.id === selectedClientId);
                                            if (client) {
                                                setNewClientData({
                                                    razonSocial: client.razonSocial,
                                                    rfc: client.rfc || "",
                                                    email: client.email || "",
                                                    phone: client.phone || "",
                                                    contactName: client.contactName || ""
                                                });
                                                setIsEditingClient(true);
                                                setNewClientMode(true);
                                            }
                                        }}
                                        className="btn-ghost flex items-center gap-2 text-primary hover:bg-primary/10 px-4 py-2 rounded-lg transition-all"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                        Editar Info
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* --- Step 2: Product --- */}
                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center bg-muted/20 p-4 rounded-xl border border-border">
                                <div>
                                    <h2 className="text-xl font-bold">Configuración de Productos</h2>
                                    <p className="text-muted-foreground text-sm">Agrega los ítems y define sus costos base.</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setNewProductMode(!newProductMode)}
                                        className={`btn-secondary text-sm shadow-sm hover:shadow-md transition-all ${newProductMode ? 'bg-primary/10 text-primary border-primary/20' : ''}`}
                                    >
                                        <Package className="w-4 h-4 mr-2" /> {newProductMode ? 'Cancelar Nuevo' : 'Nuevo Producto'}
                                    </button>
                                    <button
                                        onClick={() => setIsCatalogOpen(true)}
                                        className="btn-secondary text-sm shadow-sm hover:shadow-md transition-all"
                                    >
                                        <Search className="w-4 h-4 mr-2" /> Seleccionar Catálogo
                                    </button>
                                    <button onClick={addItem} className="btn-primary text-sm shadow-sm hover:shadow-md transition-all">
                                        <Plus className="w-4 h-4 mr-2" /> Agregar Item
                                    </button>
                                </div>
                            </div>

                            {/* New Product Form */}
                            {newProductMode && (
                                <div className="bg-card border-2 border-primary/10 rounded-xl p-6 shadow-lg animate-in slide-in-from-top-4 mb-6">
                                    <h3 className="font-bold flex items-center gap-2 mb-4 text-primary">
                                        <Plus className="w-5 h-5" /> Registrar Nuevo Producto al Catálogo
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="text-xs uppercase font-bold text-muted-foreground block mb-1">Nombre del Producto *</label>
                                            <input
                                                className="input-dark w-full"
                                                placeholder="Ej. Laptop Dell XPS 15"
                                                value={newProductData.name}
                                                onChange={e => setNewProductData({ ...newProductData, name: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs uppercase font-bold text-muted-foreground block mb-1">SKU / Código</label>
                                            <input
                                                className="input-dark w-full"
                                                placeholder="DELL-XPS-15"
                                                value={newProductData.sku}
                                                onChange={e => setNewProductData({ ...newProductData, sku: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs uppercase font-bold text-muted-foreground block mb-1">Precio Base (Costo) *</label>
                                            <input
                                                type="number"
                                                className="input-dark w-full"
                                                placeholder="0.00"
                                                value={newProductData.basePrice}
                                                onChange={e => setNewProductData({ ...newProductData, basePrice: Number(e.target.value) })}
                                            />
                                        </div>
                                        <div className="md:col-span-3 mt-4">
                                            <label className="text-xs uppercase font-bold text-muted-foreground block mb-1">Proveedor *</label>
                                            <select
                                                className="input-dark w-full"
                                                value={newProductData.supplierId}
                                                onChange={e => setNewProductData({ ...newProductData, supplierId: e.target.value })}
                                            >
                                                <option value="">Seleccionar proveedor...</option>
                                                {suppliers.map((s: any) => (
                                                    <option key={s.id} value={s.id}>{s.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2 mt-4">
                                        <button onClick={() => setNewProductMode(false)} className="btn-ghost text-sm">Cancelar</button>
                                        <button onClick={handleCreateProduct} disabled={loading} className="btn-primary text-sm">
                                            {loading ? <Loader2 className="animate-spin w-4 h-4" /> : "Guardar Producto"}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="bg-card rounded-xl border border-border overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50 text-xs text-muted-foreground uppercase font-bold tracking-wider">
                                        <tr>
                                            <th className="p-4 text-left">Producto</th>
                                            <th className="p-4 text-center">Cant.</th>
                                            <th className="p-4 text-right">Costo Base</th>
                                            <th className="p-4 text-right">Importación</th>
                                            <th className="p-4 text-right">Flete</th>
                                            <th className="p-4 text-center">Moneda</th>
                                            <th className="p-4 text-center">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {items.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-muted/10 transition-colors">
                                                <td className="p-3 pl-4">
                                                    <div className="relative">
                                                        <select
                                                            className="input-dark w-full min-w-[250px] font-medium"
                                                            value={item.productId}
                                                            onChange={(e) => updateItem(idx, 'productId', e.target.value)}
                                                        >
                                                            <option value="">Seleccionar del catálogo...</option>
                                                            {products.map(p => (
                                                                <option key={p.id} value={p.id}>
                                                                    {p.name} {p.sku ? `[${p.sku}]` : ''} - {p.supplierName ? `(${p.supplierName})` : ''}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <input
                                                        type="number" min="1"
                                                        className="input-dark w-20 text-center font-bold"
                                                        value={item.quantity}
                                                        onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                                                    />
                                                </td>
                                                <td className="p-3 text-right">
                                                    <input
                                                        type="number" min="0"
                                                        className="input-dark w-28 text-right font-mono"
                                                        value={item.basePrice}
                                                        onChange={(e) => updateItem(idx, 'basePrice', Number(e.target.value))}
                                                    />
                                                </td>
                                                <td className="p-3 text-right">
                                                    <input
                                                        type="number" min="0"
                                                        className="input-dark w-28 text-right font-mono"
                                                        value={item.importCost}
                                                        onChange={(e) => updateItem(idx, 'importCost', Number(e.target.value))}
                                                    />
                                                </td>
                                                <td className="p-3 text-right">
                                                    <input
                                                        type="number" min="0"
                                                        className="input-dark w-28 text-right font-mono"
                                                        value={item.freightCost}
                                                        onChange={(e) => updateItem(idx, 'freightCost', Number(e.target.value))}
                                                    />
                                                </td>
                                                <td className="p-3 text-center">
                                                    <select
                                                        className="input-dark text-xs font-bold w-full"
                                                        value={item.currency || "MXN"}
                                                        onChange={(e) => updateItem(idx, 'currency', e.target.value)}
                                                    >
                                                        <option value="MXN">MXN</option>
                                                        <option value="USD">USD</option>
                                                    </select>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <button onClick={() => removeItem(idx)} className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {items.length === 0 && (
                                    <div className="text-center py-16 text-muted-foreground">
                                        <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        <p>No hay productos agregados.</p>
                                        <div className="flex justify-center gap-4 mt-4">
                                            <button onClick={() => setNewProductMode(true)} className="text-primary hover:underline text-sm font-medium">
                                                Crear Nuevo
                                            </button>
                                            <span className="text-muted-foreground">•</span>
                                            <button onClick={addItem} className="text-primary hover:underline text-sm font-medium">
                                                Seleccionar Existente
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* --- Catalog Modal --- */}
                    {isCatalogOpen && (
                        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
                            <div className="bg-card w-full max-w-4xl rounded-2xl border border-border shadow-2xl p-6 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h2 className="text-2xl font-bold flex items-center gap-2">
                                            <Package className="w-6 h-6 text-primary" /> Catálogo de Productos
                                        </h2>
                                        <p className="text-muted-foreground text-sm">Selecciona múltiples productos para agregar a la cotización.</p>
                                    </div>
                                    <button onClick={() => setIsCatalogOpen(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
                                        <X className="w-5 h-5 text-muted-foreground" />
                                    </button>
                                </div>

                                <div className="mb-4 relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder="Buscar por nombre, SKU o proveedor..."
                                        className="input-dark pl-10 w-full"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        autoFocus
                                    />
                                </div>

                                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pb-4">
                                        {products.filter(p =>
                                            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            p.supplierName?.toLowerCase().includes(searchTerm.toLowerCase())
                                        ).map(p => {
                                            const isSelected = selectedCatalogIds.includes(p.id);
                                            return (
                                                <div
                                                    key={p.id}
                                                    onClick={() => {
                                                        if (isSelected) {
                                                            setSelectedCatalogIds(selectedCatalogIds.filter(id => id !== p.id));
                                                        } else {
                                                            setSelectedCatalogIds([...selectedCatalogIds, p.id]);
                                                        }
                                                    }}
                                                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer group flex flex-col justify-between h-full ${isSelected ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' : 'border-border hover:border-muted-foreground/30 bg-muted/5'
                                                        }`}
                                                >
                                                    <div>
                                                        <div className="flex justify-between items-start mb-2">
                                                            <span className="text-[10px] font-mono text-muted-foreground uppercase">{p.sku || "Sin SKU"}</span>
                                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-primary border-primary text-primary-foreground scale-110' : 'border-border group-hover:border-primary/50'
                                                                }`}>
                                                                {isSelected && <Check className="w-3 h-3 stroke-[4px]" />}
                                                            </div>
                                                        </div>
                                                        <h4 className={`font-bold text-sm mb-1 group-hover:text-primary transition-colors ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                                                            {p.name}
                                                        </h4>
                                                        <p className="text-[10px] text-muted-foreground mb-3 flex items-center gap-1">
                                                            <Truck className="w-3 h-3" /> {p.supplierName || "S/P"}
                                                        </p>
                                                    </div>
                                                    <div className="flex justify-between items-center border-t border-border/20 pt-2">
                                                        <span className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Costo Base</span>
                                                        <span className="font-black text-foreground">{formatCurrency(p.basePrice)}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t border-border flex items-center justify-between">
                                    <div className="text-sm font-medium">
                                        <span className="text-primary font-bold">{selectedCatalogIds.length}</span> productos seleccionados
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => {
                                                setSelectedCatalogIds([]);
                                                setIsCatalogOpen(false);
                                            }}
                                            className="btn-ghost py-2.5 px-6"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            disabled={selectedCatalogIds.length === 0}
                                            onClick={() => {
                                                const selectedProducts = products.filter(p => selectedCatalogIds.includes(p.id));
                                                const newItems = selectedProducts.map(p => ({
                                                    productId: p.id,
                                                    productName: p.name,
                                                    quantity: 1,
                                                    basePrice: p.basePrice,
                                                    importCost: 0,
                                                    freightCost: 0,
                                                    margin: globalSettings.defaultMargin || 0.30,
                                                    currency: "MXN" as const,
                                                    supplierId: p.supplierId,
                                                    supplierName: p.supplierName
                                                }));

                                                // Add to items, removing any initial empty row if it's there
                                                const currentItems = (items.length === 1 && items[0].productId === "") ? [] : items;
                                                setItems([...currentItems, ...newItems]);

                                                setSelectedCatalogIds([]);
                                                setIsCatalogOpen(false);
                                            }}
                                            className="btn-primary py-2.5 px-8 flex items-center gap-2"
                                        >
                                            <Plus className="w-4 h-4" /> Agregar Seleccionados
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- Step 3: Pricing --- */}
                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row justify-between items-center bg-primary/5 p-6 rounded-xl border border-primary/10 gap-4">
                                <div>
                                    <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                                        <Calculator className="w-6 h-6" /> Calculadora de Precios
                                    </h2>
                                    <p className="text-muted-foreground text-sm mt-1">Ajusta el margen de utilidad para ver el precio final.</p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-1 bg-background p-1.5 rounded-lg border border-border shadow-sm">
                                        <button
                                            onClick={() => setCurrency('MXN')}
                                            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${currency === 'MXN' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-muted'}`}
                                        >MXN</button>
                                        <button
                                            onClick={() => setCurrency('USD')}
                                            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${currency === 'USD' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-muted'}`}
                                        >USD</button>
                                    </div>
                                    <div className="flex items-center gap-1 bg-background p-1.5 rounded-lg border border-border shadow-sm">
                                        <button
                                            onClick={() => setTaxRate(0.08)}
                                            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${taxRate === 0.08 ? 'bg-emerald-500 text-white shadow-md' : 'text-muted-foreground hover:bg-muted'}`}
                                        >IVA 8%</button>
                                        <button
                                            onClick={() => setTaxRate(0.16)}
                                            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${taxRate === 0.16 ? 'bg-emerald-500 text-white shadow-md' : 'text-muted-foreground hover:bg-muted'}`}
                                        >IVA 16%</button>
                                    </div>
                                    {(currency === 'MXN' && items.some(i => i.currency === 'USD')) || (currency === 'USD' && items.some(i => i.currency === 'MXN')) ? (
                                        <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-lg animate-in slide-in-from-right">
                                            <div className="text-blue-500 p-2 bg-blue-500/10 rounded-full">
                                                <Coins className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] items-center gap-2 uppercase font-black text-blue-500 block">Tipo de Cambio (1 USD = ? MXN)</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    className="bg-transparent border-none text-lg font-bold text-blue-500 focus:ring-0 p-0 w-24"
                                                    value={exchangeRate}
                                                    onChange={(e) => setExchangeRate(Number(e.target.value))}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-muted-foreground text-xs opacity-50 px-4 italic">
                                            * Monedas coinciden. No se requiere T.C.
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {items.map((item, idx) => {
                                    const cost = item.basePrice + item.importCost + item.freightCost;
                                    const price = cost * (1 + item.margin);
                                    const profit = price - cost;

                                    return (
                                        <div key={idx} className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 p-2 bg-primary/10 rounded-bl-xl border-l border-b border-primary/10">
                                                <span className="text-xs font-bold text-primary font-mono">#{idx + 1}</span>
                                            </div>
                                            <h3 className="font-bold text-foreground mb-4 pr-8 line-clamp-3 leading-tight" title={item.productName}>{item.productName || "Producto sin nombre"}</h3>

                                            <div className="space-y-4">
                                                <div className="flex justify-between text-sm items-center">
                                                    <span className="text-muted-foreground">Moneda Item:</span>
                                                    <span className="font-bold text-primary">{item.currency || "MXN"}</span>
                                                </div>

                                                <div className="flex justify-between text-sm items-center">
                                                    <span className="text-muted-foreground">Costo Total Base:</span>
                                                    <span className="font-mono font-medium">{formatCurrency(cost)} {item.currency || "MXN"}</span>
                                                </div>

                                                <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
                                                    <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-2 flex items-center justify-between">
                                                        <span className="flex items-center gap-1">
                                                            Margen de Utilidad
                                                            {item.margin < 0.15 && (
                                                                <span className="bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded text-[9px] flex items-center gap-1">
                                                                    <AlertTriangle className="w-3 h-3" /> Min 15%
                                                                </span>
                                                            )}
                                                        </span>
                                                        <span className={item.margin < 0.15 ? "text-amber-500 font-black text-sm" : "text-primary text-xs"}>
                                                            {(item.margin * 100).toFixed(0)}%
                                                        </span>
                                                    </label>
                                                    <input
                                                        type="range" min="0" max="100" step="1"
                                                        value={Math.round(item.margin * 100)}
                                                        onChange={(e) => updateItem(idx, 'margin', Number(e.target.value) / 100)}
                                                        className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${item.margin < 0.15 ? "bg-amber-500/20 accent-amber-500" : "bg-muted accent-primary"}`}
                                                    />
                                                </div>

                                                <div className="pt-3 border-t border-border mt-3">
                                                    <div className={`flex justify-between items-center mb-1 ${item.margin < 0.15 ? 'bg-amber-500/5 border-amber-500/20 focus-within:border-amber-500/50 focus-within:bg-amber-500/10 focus-within:ring-amber-500/20' : 'bg-emerald-500/5 border-emerald-500/20 focus-within:border-emerald-500/50 focus-within:bg-emerald-500/10 focus-within:ring-emerald-500/20'} p-2 rounded-lg border focus-within:ring-2 transition-all`}>
                                                        <span className={`text-sm font-bold ${item.margin < 0.15 ? 'text-amber-600 dark:text-amber-500' : 'text-emerald-700 dark:text-emerald-400'}`}>Precio Venta:</span>
                                                        <div className={`flex items-center text-xl font-black ${item.margin < 0.15 ? 'text-amber-600 dark:text-amber-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                                            <Edit2 className={`w-3 h-3 mr-1 ${item.margin < 0.15 ? 'text-amber-500/50' : 'text-emerald-500/50'}`} />
                                                            <span className="mr-0.5">$</span>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                className={`w-24 bg-transparent border-b-2 border-dashed border-emerald-500/30 text-right focus:border-emerald-500/80 focus:ring-0 p-0 font-black ${item.margin < 0.15 ? 'text-amber-600 dark:text-amber-500 border-amber-500/30 focus:border-amber-500/80' : 'text-emerald-600 dark:text-emerald-400'} [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none min-w-[80px] transition-colors hover:border-emerald-500`}
                                                                value={Number(price.toFixed(2))}
                                                                onChange={(e) => {
                                                                    const val = parseFloat(e.target.value);
                                                                    if (cost > 0 && !isNaN(val)) {
                                                                        updateItem(idx, 'margin', (val / cost) - 1);
                                                                    } else if (e.target.value === "") {
                                                                        updateItem(idx, 'margin', -1);
                                                                    }
                                                                }}
                                                            />
                                                            <span className="ml-1 text-sm font-bold uppercase">{item.currency || "MXN"}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs mt-3 px-1">
                                                        <span className="text-muted-foreground">Total Línea ({item.quantity}):</span>
                                                        <span className="font-bold">{formatCurrency(price * item.quantity)} {item.currency || "MXN"}</span>
                                                    </div>
                                                    <div className={`text-right text-[11px] font-black mt-1 px-1 ${item.margin < 0.15 ? "text-amber-600" : "text-emerald-600/80"}`}>
                                                        + Ganancia: {formatCurrency(profit * item.quantity)} {item.currency || "MXN"}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="bg-foreground text-background p-6 rounded-xl flex flex-col sm:flex-row justify-between items-center shadow-xl">
                                <span className="font-bold text-lg mb-2 sm:mb-0">Total Estimado de Venta</span>
                                <div className="text-right">
                                    <span className="text-3xl font-bold">{formatCurrency(total)} <span className="text-lg opacity-70 font-normal">{currency}</span></span>
                                    <p className="text-sm opacity-70">Incluye IVA</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- Step 4: Review --- */}
                    {currentStep === 4 && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="card-premium p-6">
                                        <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                                            <FileText className="w-5 h-5 text-primary" />
                                            Notas y Condiciones
                                        </h3>
                                        <p className="text-xs text-muted-foreground mb-2">Agrega detalles como tiempo de entrega, cuentas bancarias, etc.</p>
                                        <textarea
                                            className="input-dark w-full h-40 font-mono text-sm leading-relaxed"
                                            placeholder="ESTA COTIZACIÓN TIENE UNA VIGENCIA DE 30 DÍAS... TIEMPO DE ENTREGA: INMEDIATO..."
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                        />
                                    </div>
                                    <div className="card-premium p-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/20 border-border">
                                        <div>
                                            <h3 className="font-bold text-lg">Vista Previa</h3>
                                            <p className="text-sm text-muted-foreground">Genera el documento para verificar antes de guardar.</p>
                                        </div>
                                        <button onClick={handleGeneratePDF} className="btn-secondary flex items-center gap-2 px-6 py-3">
                                            <Printer className="w-4 h-4" /> Generar PDF
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="card-premium p-6 bg-primary/5 border-primary/20">
                                        <h3 className="font-bold text-foreground uppercase tracking-widest text-xs mb-6 border-b border-primary/10 pb-2">Resumen Financiero</h3>
                                        <div className="space-y-3 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Subtotal</span>
                                                <span className="font-mono font-medium">{formatCurrency(subtotal)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">IVA ({(taxRate * 100).toFixed(0)}%)</span>
                                                <span className="font-mono font-medium">{formatCurrency(taxAmount)}</span>
                                            </div>
                                            <div className="flex justify-between pt-4 border-t border-primary/20 font-bold text-xl items-end">
                                                <span>Total</span>
                                                <span className="text-primary font-mono">{formatCurrency(total)} {currency}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleSubmit('SENT')}
                                        disabled={loading}
                                        className="w-full btn-primary py-4 text-sm font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group transition-all hover:scale-[1.02]"
                                    >
                                        {loading ? <Loader2 className="animate-spin" /> : <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                                        Finalizar y Enviar
                                    </button>

                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => handleSubmit('DRAFT')}
                                            disabled={loading}
                                            className="btn-secondary text-xs"
                                        >
                                            Guardar Borrador
                                        </button>
                                        <button
                                            onClick={() => router.push('/dashboard/sales/quotes')}
                                            className="btn-ghost border border-border text-xs"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Navigation */}
                <div className="flex justify-between pt-6 border-t border-border mt-8">
                    <button
                        onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                        disabled={currentStep === 1}
                        className="btn-ghost px-6 disabled:opacity-30 hover:bg-muted font-medium flex items-center gap-2"
                    >
                        <ChevronLeft className="w-4 h-4" /> Anterior
                    </button>

                    {currentStep < 4 && (
                        <button
                            onClick={() => {
                                if (currentStep === 1 && !validateStep1()) {
                                    return alert("Por favor selecciona un cliente o registra uno nuevo para continuar.");
                                }
                                if (currentStep === 2 && items.length === 0) {
                                    return alert("Agrega al menos un producto para cotizar.");
                                }
                                setCurrentStep(Math.min(4, currentStep + 1));
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="btn-primary px-10 py-3 shadow-md hover:shadow-lg flex items-center gap-2"
                        >
                            Siguiente <ChevronRight className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* --- Support Modal --- */}
            {isSupportModalOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-card w-full max-w-lg rounded-2xl border border-amber-500/20 shadow-2xl p-6 animate-in zoom-in-95">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-bold flex items-center gap-2 text-amber-500">
                                    <HelpCircle className="w-6 h-6" />
                                    Solicitar Soporte
                                </h3>
                                <p className="text-muted-foreground text-sm mt-1">
                                    Describe tu requerimiento especial o duda para que un administrador te asista.
                                </p>
                            </div>
                            <button onClick={() => setIsSupportModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <textarea
                                className="input-dark w-full h-32 resize-none"
                                placeholder="Ej: No encuentro el producto X en el catálogo, necesito un descuento especial para este cliente..."
                                value={supportMessage}
                                onChange={(e) => setSupportMessage(e.target.value)}
                                autoFocus
                            />

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    onClick={() => setIsSupportModalOpen(false)}
                                    className="btn-ghost text-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSupportRequest}
                                    disabled={supportLoading || !supportMessage.trim()}
                                    className="btn-primary bg-amber-500 hover:bg-amber-600 text-white border-amber-600 text-sm flex items-center gap-2"
                                >
                                    {supportLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    Enviar Solicitud
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
