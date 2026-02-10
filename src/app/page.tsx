"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, AlertCircle, Lock, Mail } from "lucide-react";
import Image from "next/image";

export default function Home() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push("/dashboard");
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                setError("Credenciales incorrectas. Verifica tu correo y contraseña.");
            } else if (err.code === 'auth/too-many-requests') {
                setError("Demasiados intentos fallidos. Intenta más tarde.");
            } else {
                setError("Ocurrió un error al iniciar sesión.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen bg-background bg-mesh">
            {/* Left Side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
                {/* Decorative gradient orbs */}
                <div className="absolute top-20 left-20 w-72 h-72 bg-accent-blue/20 rounded-full blur-3xl" />
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent-purple/20 rounded-full blur-3xl" />

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="relative w-12 h-12">
                            <div className="absolute inset-0 rounded-xl bg-accent-blue/30 blur-lg" />
                            <Image
                                src="/logo.png"
                                alt="Nortech Logo"
                                fill
                                className="object-contain relative"
                            />
                        </div>
                        <h1 className="text-3xl font-bold text-foreground">Nortech</h1>
                    </div>
                    <p className="text-muted-foreground">Tu Aliado Estratégico Industrial</p>
                </div>

                <div className="relative z-10 space-y-6">
                    <h2 className="text-4xl font-bold text-foreground leading-tight">
                        Superando Desafíos<br />
                        <span className="text-gradient">en el Ámbito Industrial</span>
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-md">
                        Sistema interno de gestión para ventas, inventario, finanzas y logística de North Tech.
                    </p>


                    <div className="grid grid-cols-1 gap-3 pt-4">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-accent-blue" />
                            <p className="text-sm text-muted-foreground"><span className="text-foreground font-medium">Experiencia sólida</span> para abordar cualquier desafío industrial</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-accent-cyan" />
                            <p className="text-sm text-muted-foreground"><span className="text-foreground font-medium">Soluciones personalizadas</span> adaptadas a tus necesidades</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-accent-emerald" />
                            <p className="text-sm text-muted-foreground"><span className="text-foreground font-medium">Gestión eficiente</span> con resultados sostenibles</p>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 flex items-center gap-2 text-muted-foreground text-sm">
                    <Lock className="w-4 h-4" />
                    <span>Sistema interno de North Tech - Acceso restringido</span>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="flex flex-col items-center gap-4 mb-8 lg:hidden">
                        <div className="relative w-16 h-16">
                            <div className="absolute inset-0 rounded-xl bg-accent-blue/30 blur-lg" />
                            <Image
                                src="/logo.png"
                                alt="Nortech Logo"
                                fill
                                className="object-contain relative"
                            />
                        </div>
                        <h1 className="text-2xl font-bold text-foreground">Nortech ERP</h1>
                    </div>

                    <div className="card-premium p-8">
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-foreground">Iniciar Sesión</h2>
                            <p className="text-muted-foreground mt-1">Ingresa tus credenciales para acceder</p>
                        </div>

                        <form onSubmit={handleLogin} className="flex flex-col gap-5">
                            {error && (
                                <div className="p-4 bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-lg flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-foreground">
                                    Correo Electrónico
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="ejemplo@nortech.com"
                                        className="input-dark pl-12"
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-foreground">
                                        Contraseña
                                    </label>
                                    <button type="button" className="text-xs text-accent-blue hover:underline">
                                        ¿Olvidaste tu contraseña?
                                    </button>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="input-dark pl-12"
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary py-3 text-base font-semibold mt-2 disabled:opacity-50"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Ingresando...
                                    </span>
                                ) : (
                                    "Ingresar"
                                )}
                            </button>
                        </form>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm mt-6">
                        <CheckCircle2 className="w-4 h-4 text-success" />
                        <span>Sistema Seguro & Encriptado</span>
                    </div>
                </div>
            </div>
        </main>
    );
}
