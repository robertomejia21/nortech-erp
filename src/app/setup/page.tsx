"use client";

import { useState, useEffect } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Shield, Loader2, CheckCircle2, AlertTriangle, Users, Key } from "lucide-react";

// Mapping of emails to their expected roles and names
const KNOWN_USERS: Record<string, { role: string; name: string; pass: string }> = {
    'admin@nortech.com': { role: 'SUPERADMIN', name: 'Super Admin', pass: 'NortechAdmin2024!' },
    'finanzas@nortech.com': { role: 'FINANCE', name: 'Admin Finanzas', pass: 'NortechFinance2024!' },
    'contabilidad@nortech.com': { role: 'FINANCE', name: 'Contabilidad', pass: 'NortechFinance2024!' },
    'almacen@nortech.com': { role: 'WAREHOUSE', name: 'Encargado Almacén', pass: 'NortechWarehouse2024!' },
    'vendedor1@nortech.com': { role: 'SALES', name: 'Vendedor 1', pass: 'NortechSales2024!' },
    'vendedor2@nortech.com': { role: 'SALES', name: 'Vendedor 2', pass: 'NortechSales2024!' },
    'vendedor3@nortech.com': { role: 'SALES', name: 'Vendedor 3', pass: 'NortechSales2024!' },
};

export default function SetupPage() {
    const [email, setEmail] = useState("admin@nortech.com");
    const [password, setPassword] = useState("NortechAdmin2024!");
    const [role, setRole] = useState("SUPERADMIN");
    const [name, setName] = useState("Super Admin");

    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");
    const router = useRouter();

    // Auto-fill details when email matches known user
    useEffect(() => {
        if (KNOWN_USERS[email]) {
            setRole(KNOWN_USERS[email].role);
            setName(KNOWN_USERS[email].name);
            setPassword(KNOWN_USERS[email].pass);
        }
    }, [email]);

    const performRestore = async (email: string, password: string, role: string, name: string) => {
        // 1. Try to Login first
        let userCredential;
        try {
            userCredential = await signInWithEmailAndPassword(auth, email, password);
        } catch (loginError: any) {
            if (loginError.code === 'auth/user-not-found' || loginError.code === 'auth/invalid-credential') {
                // 2. If not found, Create User
                try {
                    userCredential = await createUserWithEmailAndPassword(auth, email, password);
                } catch (createError: any) {
                    throw createError;
                }
            } else if (loginError.code === 'auth/wrong-password') {
                throw new Error(`Contraseña incorrecta para ${email}`);
            } else {
                throw loginError;
            }
        }

        if (!userCredential?.user) throw new Error("Error de autenticación.");

        // 3. Force update Role in Firestore
        const uid = userCredential.user.uid;
        const userRef = doc(db, "users", uid);

        const userSnap = await getDoc(userRef);

        const userData = {
            email: email,
            name: name,
            role: role,
            updatedAt: new Date().toISOString(),
            active: true,
            ...(!userSnap.exists() && { createdAt: new Date().toISOString() })
        };

        await setDoc(userRef, userData, { merge: true });
        return true;
    };

    const handleRestoreAll = async () => {
        setStatus("loading");
        setMessage("Iniciando restauración masiva...");

        try {
            for (const [uEmail, uData] of Object.entries(KNOWN_USERS)) {
                setMessage(`Procesando ${uEmail}...`);
                await performRestore(uEmail, uData.pass, uData.role, uData.name);
            }
            setStatus("success");
            setMessage("¡Todos los usuarios han sido restaurados exitosamente!");
        } catch (error: any) {
            console.error(error);
            setStatus("error");
            setMessage(`Error en restauración masiva: ${error.message}`);
        }
    };

    const handleRecovery = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("loading");
        setMessage(`Procesando cuenta de ${name}...`);

        try {
            // 1. Try to Login first
            let userCredential;
            let isNewUser = false;

            try {
                setMessage("1/3 Verificando credenciales...");
                userCredential = await signInWithEmailAndPassword(auth, email, password);
            } catch (loginError: any) {
                if (loginError.code === 'auth/user-not-found' || loginError.code === 'auth/invalid-credential') {
                    // 2. If not found, Create User
                    setMessage("2/3 Creando usuario nuevo en Firebase...");
                    try {
                        userCredential = await createUserWithEmailAndPassword(auth, email, password);
                        isNewUser = true;
                    } catch (createError: any) {
                        throw createError;
                    }
                } else if (loginError.code === 'auth/wrong-password') {
                    // Offer password reset
                    setMessage("⚠️ Contraseña incorrecta.");
                    if (confirm(`La contraseña de ${email} es incorrecta. ¿Enviar correo de restablecimiento?`)) {
                        await sendPasswordResetEmail(auth, email);
                        alert(`Correo enviado a ${email}. Por favor revisa tu bandeja y sigue el enlace.`);
                        throw new Error("Correo de restablecimiento enviado via Firebase.");
                    } else {
                        throw new Error("El usuario existe pero la contraseña es diferente. No se puede sobrescribir.");
                    }
                } else {
                    throw loginError;
                }
            }

            if (!userCredential?.user) throw new Error("Error de autenticación.");

            // 3. Force update Role in Firestore
            const uid = userCredential.user.uid;
            const userRef = doc(db, "users", uid);

            setMessage(`3/3 Configurando rol ${role}...`);

            const userSnap = await getDoc(userRef);

            const userData = {
                email: email,
                name: name,
                role: role,
                updatedAt: new Date().toISOString(),
                active: true,
                ...(!userSnap.exists() && { createdAt: new Date().toISOString() })
            };

            await setDoc(userRef, userData, { merge: true });

            setStatus("success");
            setMessage(`¡Cuenta configurada! Rol: ${role}`);

        } catch (error: any) {
            console.error(error);
            setStatus("error");
            setMessage(error.message || "Error desconocido");
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
            <div className="max-w-xl w-full bg-zinc-900 border border-zinc-800 rounded-xl p-8 shadow-2xl">
                <div className="flex items-center gap-3 mb-6 text-emerald-500">
                    <Shield className="w-8 h-8" />
                    <div>
                        <h1 className="text-2xl font-bold">Consola de Recuperación</h1>
                        <p className="text-zinc-500 text-sm">Gestiona usuarios manualmente</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-6">
                    {Object.entries(KNOWN_USERS).map(([uEmail, uData]) => (
                        <button
                            key={uEmail}
                            onClick={() => setEmail(uEmail)}
                            className={`p-2 text-xs text-left rounded-lg border transition-all ${email === uEmail
                                ? "bg-emerald-900/30 border-emerald-500/50 text-emerald-200"
                                : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                                }`}
                        >
                            <div className="font-bold">{uData.role}</div>
                            <div className="truncate">{uEmail}</div>
                        </button>
                    ))}
                </div>

                <form onSubmit={handleRecovery} className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Nombre</label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Contraseña</label>
                            <input
                                type="text"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Rol</label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 outline-none text-white"
                            >
                                <option value="SUPERADMIN">SUPERADMIN</option>
                                <option value="ADMIN">ADMIN</option>
                                <option value="FINANCE">FINANCE</option>
                                <option value="SALES">SALES</option>
                                <option value="WAREHOUSE">WAREHOUSE</option>
                            </select>
                        </div>
                    </div>

                    <div className="h-2"></div>

                    {status === "error" && (
                        <div className="p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-200 text-sm">
                            {message}
                        </div>
                    )}

                    {status === "success" && (
                        <div className="p-3 bg-emerald-900/30 border border-emerald-800 rounded-lg text-emerald-200 text-sm flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={status === "loading"}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
                    >
                        {status === "loading" ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                {message}
                            </>
                        ) : (
                            <>
                                <Key className="w-4 h-4" />
                                Restaurar Usuario Seleccionado
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-6 pt-6 border-t border-zinc-800 flex justify-between">
                    <button
                        onClick={() => router.push("/login")}
                        className="text-sm text-zinc-500 hover:text-white transition-colors"
                    >
                        ← Volver al Login
                    </button>
                    <div className="text-xs text-zinc-600">
                        Solo uso administrativo
                    </div>
                </div>
            </div>
        </div>
    );
}
