"use client";

import { useState, useEffect } from "react";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatCurrency } from "@/lib/utils";
import {
    Loader2,
    Plus,
    User as UserIcon,
    Mail,
    Trash2,
    Edit2,
    Search,
    MoreVertical
} from "lucide-react";
import { createUserAction, updateUserAction, deleteUserAction } from "@/app/dashboard/users/actions";
import UserModal from "@/app/dashboard/users/UserModal";

type UserData = {
    id: string;
    name: string;
    email: string;
    role: "SUPERADMIN" | "ADMIN" | "SALES" | "WAREHOUSE" | "FINANCE";
    monthlyGoal?: number;
    createdAt: any;
};

const roleConfig = {
    SUPERADMIN: { label: "Super Admin", class: "bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-500/20 dark:text-indigo-400 dark:border-indigo-500/30" },
    ADMIN: { label: "Admin", class: "bg-slate-200 text-slate-700 border-slate-300 dark:bg-zinc-500/20 dark:text-zinc-300 dark:border-zinc-500/30" },
    SALES: { label: "Vendedor", class: "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30" },
    WAREHOUSE: { label: "Almacén", class: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30" },
    FINANCE: { label: "Finanzas", class: "bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30" },
};

export default function UserManagementSection() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<UserData | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    useEffect(() => {
        const q = query(collection(db, "users"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list: UserData[] = [];
            snapshot.forEach((doc) => {
                list.push({ id: doc.id, ...doc.data() } as UserData);
            });
            setUsers(list);
            setLoading(false);
        }, (error) => {
            console.error("🔥 Error cargando usuarios:", error);
            setLoading(false);
            alert("Error al cargar usuarios. Revisa la consola.");
        });

        return () => unsubscribe();
    }, []);

    const handleCreateOrUpdateUser = async (data: any) => {
        try {
            let result;
            if (editingUser) {
                result = await updateUserAction(editingUser.id, data);
            } else {
                result = await createUserAction(data);
            }

            if (!result.success) {
                alert("Error: " + result.error);
            } else {
                alert(editingUser ? "Usuario actualizado." : "Usuario creado exitosamente.");
                setEditingUser(null);
                setShowModal(false);
            }
        } catch (error) {
            console.error("Error inesperado:", error);
            alert("Ocurrió un error inesperado.");
        }
    };

    const handleDeleteUser = async (uid: string) => {
        if (confirm("¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.")) {
            console.log("🔵 Cliente: Iniciando eliminación de usuario:", uid);
            try {
                const result = await deleteUserAction(uid);
                console.log("🔵 Cliente: Resultado de eliminación:", result);

                if (result.success) {
                    alert("✅ Usuario eliminado correctamente");
                } else {
                    const errorMsg = `❌ Error al eliminar usuario:\n\n${result.error || 'Error desconocido'}\n\nRevisa la consola del navegador (F12) para más detalles.`;
                    console.error("Error completo:", result);
                    alert(errorMsg);
                }
            } catch (error: any) {
                const errorMsg = `❌ Error inesperado:\n\n${error.message || error}\n\nRevisa la consola del navegador (F12) para más detalles.`;
                console.error("Error capturado:", error);
                alert(errorMsg);
            }
        }
    };

    const filteredUsers = users.filter(u =>
        (u.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.email || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-foreground">Gestión de Usuarios</h2>
                    <p className="text-sm text-muted-foreground mt-1">Administra el acceso y roles del personal del ERP</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={async (e) => {
                            const btn = e.currentTarget;
                            const originalText = btn.innerHTML;
                            btn.innerHTML = "<span class='animate-spin inline-block mr-1'>⏳</span>...";
                            btn.disabled = true;
                            try {
                                await deleteUserAction("DIAGNOSE_ONLY");
                                alert("Diagnóstico enviado a la terminal. Revísala para ver los resultados.");
                            } catch (e) {
                                console.error(e);
                            } finally {
                                btn.innerHTML = originalText;
                                btn.disabled = false;
                            }
                        }}
                        className="p-2.5 rounded-full border border-zinc-500/30 text-zinc-400 hover:text-indigo-400 hover:border-indigo-500/30 transition-all active:scale-95"
                        title="Diagnosticar Credenciales"
                    >
                        <Search className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setShowModal(true)}
                        className="btn-primary flex items-center justify-center gap-2 group"
                    >
                        <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                        Nuevo Usuario
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="card-premium p-4 bg-card">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o correo..."
                        className="input-dark w-full pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* User List */}
            <div className="card-premium overflow-hidden bg-card border-border">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="w-10 h-10 animate-spin text-accent-blue" />
                        <p className="text-muted-foreground animate-pulse font-medium">Cargando base de usuarios...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table-dark">
                            <thead>
                                <tr>
                                    <th className="w-12">Avatar</th>
                                    <th>Usuario</th>
                                    <th>Contacto</th>
                                    <th>Meta (Ventas)</th>
                                    <th>Rol del Sistema</th>
                                    <th className="text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((user) => {
                                    const config = roleConfig[user.role] || roleConfig.SALES;
                                    return (
                                        <tr key={user.id} className="group">
                                            <td>
                                                <div className="w-9 h-9 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary font-bold shadow-inner">
                                                    {(user.name || "U").charAt(0).toUpperCase()}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-foreground">{user.name}</span>
                                                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">ID: {user.id.slice(0, 8)}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Mail className="w-3 h-3 text-primary" />
                                                    <span className="text-sm">{user.email}</span>
                                                </div>
                                            </td>
                                            <td>
                                                {user.role === "SALES" ? (
                                                    <span className="text-sm font-bold text-foreground">
                                                        {formatCurrency(user.monthlyGoal || 0)}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground opacity-30">—</span>
                                                )}
                                            </td>
                                            <td>
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${config.class} uppercase tracking-wider`}>
                                                    {config.label}
                                                </span>
                                            </td>
                                            <td className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => {
                                                            setEditingUser(user);
                                                            setShowModal(true);
                                                        }}
                                                        className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                                                        title="Editar Usuario"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>

                                                    <div className="relative">
                                                        <button
                                                            onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                                                            className={`p-2 rounded-lg transition-colors ${openMenuId === user.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                                                        >
                                                            <MoreVertical className="w-4 h-4" />
                                                        </button>

                                                        {openMenuId === user.id && (
                                                            <>
                                                                <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                                                                <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-xl z-20 py-1 animate-in fade-in zoom-in-95 duration-200">
                                                                    <button
                                                                        onClick={() => {
                                                                            setOpenMenuId(null);
                                                                            setEditingUser(user);
                                                                            setShowModal(true);
                                                                        }}
                                                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                                                                    >
                                                                        <Edit2 className="w-4 h-4" /> Editar Detalles
                                                                    </button>
                                                                    <div className="h-px bg-border my-1" />
                                                                    <button
                                                                        onClick={() => {
                                                                            setOpenMenuId(null);
                                                                            handleDeleteUser(user.id);
                                                                        }}
                                                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" /> Eliminar Usuario
                                                                    </button>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredUsers.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-3 opacity-30">
                                                <UserIcon className="w-12 h-12" />
                                                <p className="text-lg font-medium">No se encontraron usuarios</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <UserModal
                isOpen={showModal}
                user={editingUser}
                onClose={() => {
                    setShowModal(false);
                    setEditingUser(null);
                }}
                onSubmit={handleCreateOrUpdateUser}
            />

        </div>
    );
}
