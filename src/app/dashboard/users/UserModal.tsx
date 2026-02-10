"use client";

import { useState } from "react";
import { X, Loader2, Shield, Mail, User, DollarSign } from "lucide-react";

type UserModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    user?: any; // To support future editing
};

export default function UserModal({ isOpen, onClose, onSubmit, user }: UserModalProps) {
    const [formData, setFormData] = useState({
        name: user?.name || "",
        email: user?.email || "",
        role: user?.role || "SALES",
        monthlyGoal: user?.monthlyGoal || 0,
    });
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit({
                ...formData,
                monthlyGoal: Number(formData.monthlyGoal)
            });
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-border flex justify-between items-center">
                    <h2 className="text-xl font-bold text-foreground">
                        {user ? "Editar Usuario" : "Registrar Nuevo Usuario"}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                            <User className="w-4 h-4 text-accent-blue" />
                            Nombre Completo
                        </label>
                        <input
                            required
                            type="text"
                            placeholder="Ej. Juan Pérez"
                            className="input-dark w-full"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                            <Mail className="w-4 h-4 text-accent-blue" />
                            Correo Electrónico
                        </label>
                        <input
                            required
                            type="email"
                            placeholder="usuario@nortech.com"
                            className="input-dark w-full"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            disabled={!!user}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                            <Shield className="w-4 h-4 text-accent-blue" />
                            Rol del Sistema
                        </label>
                        <select
                            className="input-dark w-full"
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        >
                            <option value="ADMIN">ADMINISTRADOR (Gestión)</option>
                            <option value="SALES">VENDEDOR (Operativo)</option>
                            <option value="WAREHOUSE">ALMACÉN (Logística)</option>
                            <option value="FINANCE">CONTABILIDAD (Pagos)</option>
                            {/* SUPERADMIN removal: strictly one superadmin allowed */}
                        </select>
                    </div>

                    {formData.role === "SALES" && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-emerald-500" />
                                Meta Mensual de Ventas ($)
                            </label>
                            <input
                                type="number"
                                placeholder="0.00"
                                className="input-dark w-full"
                                value={formData.monthlyGoal}
                                onChange={(e) => setFormData({ ...formData, monthlyGoal: e.target.value })}
                            />
                        </div>
                    )}

                    {!user && (
                        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400">
                            <strong>Aviso:</strong> Se creará el usuario con una contraseña temporal. El usuario deberá cambiarla en su primer inicio de sesión.
                        </div>
                    )}

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 btn-ghost border border-border"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 btn-primary"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                            ) : (
                                user ? "Actualizar" : "Crear Usuario"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
