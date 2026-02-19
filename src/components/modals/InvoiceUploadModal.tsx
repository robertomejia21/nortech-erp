"use client";

import { useState } from "react";
import { Upload, X, FileText, Loader2, CheckCircle2 } from "lucide-react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";

type InvoiceUploadModalProps = {
    isOpen: boolean;
    onClose: () => void;
    order: any;
    onUploadComplete: () => void;
};

export default function InvoiceUploadModal({ isOpen, onClose, order, onUploadComplete }: InvoiceUploadModalProps) {
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [xmlFile, setXmlFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    if (!isOpen || !order) return null;

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pdfFile && !xmlFile) return;

        setLoading(true);
        try {
            const updates: any = {};
            const invoiceFiles = [];

            // Upload PDF
            if (pdfFile) {
                const pdfRef = ref(storage, `invoices/${order.id}/${Date.now()}_${pdfFile.name}`);
                await uploadBytes(pdfRef, pdfFile);
                const pdfUrl = await getDownloadURL(pdfRef);
                invoiceFiles.push({ type: 'PDF', url: pdfUrl, name: pdfFile.name, uploadedAt: new Date().toISOString() });
                updates.invoicePdfUrl = pdfUrl; // Legacy/Simple access
            }

            // Upload XML
            if (xmlFile) {
                const xmlRef = ref(storage, `invoices/${order.id}/${Date.now()}_${xmlFile.name}`);
                await uploadBytes(xmlRef, xmlFile);
                const xmlUrl = await getDownloadURL(xmlRef);
                invoiceFiles.push({ type: 'XML', url: xmlUrl, name: xmlFile.name, uploadedAt: new Date().toISOString() });
                updates.invoiceXmlUrl = xmlUrl; // Legacy/Simple access
            }

            // Update Firestore
            const orderRef = doc(db, "orders", order.id);
            await updateDoc(orderRef, {
                ...updates,
                invoiceFiles: arrayUnion(...invoiceFiles),
                invoiceStatus: 'UPLOADED'
            });

            onUploadComplete();
            onClose();
            alert("✅ Factura subida exitosamente.");
        } catch (error) {
            console.error("Error uploading invoice:", error);
            alert("❌ Error al subir los archivos.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95">
                <div className="p-6 border-b border-border bg-muted/20 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Upload className="w-5 h-5 text-primary" />
                            Subir Factura
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">Sube los archivos fiscales para la orden <span className="font-mono font-bold text-foreground">{order.quoteFolio}</span></p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full">
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                <form onSubmit={handleUpload} className="p-6 space-y-6">
                    {/* PDF Upload */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <FileText className="w-4 h-4 text-red-500" /> Archivo PDF
                        </label>
                        <div className="border-2 border-dashed border-border rounded-xl p-6 hover:bg-muted/50 transition-colors text-center cursor-pointer relative group">
                            <input
                                type="file"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                accept=".pdf"
                                onChange={e => setPdfFile(e.target.files?.[0] || null)}
                            />
                            {pdfFile ? (
                                <p className="text-sm font-bold text-primary truncate">{pdfFile.name}</p>
                            ) : (
                                <p className="text-xs text-muted-foreground">Clic para seleccionar PDF</p>
                            )}
                        </div>
                    </div>

                    {/* XML Upload */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-500" /> Archivo XML
                        </label>
                        <div className="border-2 border-dashed border-border rounded-xl p-6 hover:bg-muted/50 transition-colors text-center cursor-pointer relative group">
                            <input
                                type="file"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                accept=".xml"
                                onChange={e => setXmlFile(e.target.files?.[0] || null)}
                            />
                            {xmlFile ? (
                                <p className="text-sm font-bold text-primary truncate">{xmlFile.name}</p>
                            ) : (
                                <p className="text-xs text-muted-foreground">Clic para seleccionar XML</p>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || (!pdfFile && !xmlFile)}
                        className="w-full btn-primary bg-primary hover:bg-primary/90 text-primary-foreground py-3 shadow-lg"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Subir Archivos"}
                    </button>
                </form>
            </div>
        </div>
    );
}
