"use client";

import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { db, storage } from "@/lib/firebase";
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
    Loader2,
    User,
    Mail,
    Shield,
    Image as ImageIcon,
    Save,
    Upload,
    Bell,
    Palette,
    Check,
    Megaphone,
    Send,
    Activity
} from "lucide-react";
import { useTheme } from "next-themes";
import Image from "next/image";

type UserProfile = {
    displayName: string;
    email: string;
    role: string;
    photoURL: string;
    phoneNumber?: string;
    preferences: {
        theme: "light" | "dark" | "system" | "theme-hub";
        accentColor: "blue" | "purple" | "emerald" | "amber";
        notifications: {
            email: boolean;
            push: boolean;
            sales: boolean;
            system: boolean;
        }
    }
};

const defaultProfile: UserProfile = {
    displayName: "",
    email: "",
    role: "",
    photoURL: "",
    preferences: {
        theme: "system",
        accentColor: "blue",
        notifications: {
            email: true,
            push: true,
            sales: true,
            system: true,
        }
    }
};

export default function ProfilePage() {
    const { user, role } = useAuthStore();
    const { theme, setTheme } = useTheme();
    const [profile, setProfile] = useState<UserProfile>(defaultProfile);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [sendingGlobal, setSendingGlobal] = useState(false);
    const [globalNotif, setGlobalNotif] = useState({ title: "", message: "" });
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!user) return;
        const fetchProfile = async () => {
            try {
                const docRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setProfile({ ...defaultProfile, ...docSnap.data() as any });
                } else {
                    // Initialize if missing
                    const initialData = {
                        displayName: user.displayName || "Usuario North",
                        email: user.email || "",
                        role: role || "SALES",
                        photoURL: user.photoURL || "",
                        preferences: defaultProfile.preferences
                    };
                    setProfile(initialData);
                    // Optionally create the doc here if needed, but usually done on creation
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [user, role]);

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            const docRef = doc(db, "users", user.uid);
            await updateDoc(docRef, profile);

            // Update theme immediately if changed
            if (profile.preferences.theme !== theme) {
                setTheme(profile.preferences.theme);
            }
            // Update CSS variable or global state for accent color if implemented

            alert("Perfil actualizado correctamente.");
        } catch (error) {
            console.error("Error saving profile:", error);
            alert("Error al guardar cambios.");
        } finally {
            setSaving(false);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!user || !file) return;

        try {
            setSaving(true);
            const storageRef = ref(storage, `avatars/${user.uid}/${file.name}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            setProfile(prev => ({ ...prev, photoURL: downloadURL }));

            // Update Firestore immediately for photo
            const docRef = doc(db, "users", user.uid);
            await updateDoc(docRef, { photoURL: downloadURL });

            alert("Foto de perfil actualizada.");
        } catch (error) {
            console.error("Error uploading photo:", error);
            alert("Error al subir la imagen.");
        } finally {
            setSaving(false);
        }
    };

    const handleSendGlobal = async () => {
        if (!globalNotif.title || !globalNotif.message) return alert("Título y mensaje son obligatorios.");
        setSendingGlobal(true);
        try {
            await addDoc(collection(db, "notifications"), {
                ...globalNotif,
                isGlobal: true,
                createdAt: serverTimestamp(),
                read: false, // Default to false, though global ones might not track read individual state perfectly, we'll keep it for now.
                userId: "SYSTEM", // Placeholder for global
                type: "ANNOUNCEMENT"
            });
            alert("Notificación global enviada correctamente.");
            setGlobalNotif({ title: "", message: "" });
        } catch (error) {
            console.error("Error sending global notification:", error);
            alert("Error al enviar notificación.");
        } finally {
            setSendingGlobal(false);
        }
    };
    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-accent-blue" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Mi Perfil</h1>
                    <p className="text-muted-foreground mt-1">Gestiona tu información personal y preferencias del sistema.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn-primary flex items-center gap-2 px-6"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Guardar Cambios
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column: Identity Card */}
                <div className="md:col-span-1 space-y-6">
                    <div className="card-premium p-6 text-center">
                        <div className="relative w-32 h-32 mx-auto mb-4 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <div className="absolute inset-0 rounded-full border-4 border-background shadow-xl overflow-hidden bg-muted/50">
                                {profile.photoURL ? (
                                    <Image
                                        src={profile.photoURL}
                                        alt="Profile"
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-accent-blue/10 text-accent-blue">
                                        <User className="w-12 h-12" />
                                    </div>
                                )}
                            </div>
                            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Upload className="w-6 h-6 text-white" />
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handlePhotoUpload}
                            />
                        </div>

                        <h2 className="text-xl font-bold text-foreground">{profile.displayName || "Usuario"}</h2>
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-accent-blue/10 text-accent-blue border border-accent-blue/20 mt-2">
                            {profile.role || "USUARIO"}
                        </span>
                    </div>

                    <div className="card-premium p-6 bg-muted/20">
                        <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                            <Shield className="w-4 h-4 text-accent-blue" />
                            Seguridad
                        </h3>
                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between items-center p-3 bg-background rounded-lg border border-border">
                                <span className="text-muted-foreground">Contraseña</span>
                                <button className="text-accent-blue hover:underline text-xs font-medium">Cambiar</button>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-background rounded-lg border border-border opacity-50 cursor-not-allowed">
                                <span className="text-muted-foreground">2FA</span>
                                <span className="text-xs bg-muted px-2 py-1 rounded">Próximamente</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Information & Settings */}
                <div className="md:col-span-2 space-y-6">

                    {/* Public Information */}
                    <div className="card-premium p-6">
                        <h3 className="font-bold text-foreground mb-6 flex items-center gap-2 pb-4 border-b border-border">
                            <User className="w-5 h-5 text-accent-blue" />
                            Información Personal
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5 block">Nombre Completo</label>
                                <input
                                    type="text"
                                    value={profile.displayName}
                                    onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                                    className="input-dark w-full"
                                    placeholder="Tu nombre"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5 block">Teléfono</label>
                                <input
                                    type="tel"
                                    value={profile.phoneNumber || ""}
                                    onChange={(e) => setProfile({ ...profile, phoneNumber: e.target.value })}
                                    className="input-dark w-full"
                                    placeholder="+52 (000) 000-0000"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5 block">Correo Electrónico (No editable)</label>
                                <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border border-border rounded-lg text-muted-foreground">
                                    <Mail className="w-4 h-4" />
                                    <span>{profile.email}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* System Preferences */}
                    <div className="card-premium p-6">
                        <h3 className="font-bold text-foreground mb-6 flex items-center gap-2 pb-4 border-b border-border">
                            <Palette className="w-5 h-5 text-accent-blue" />
                            Apariencia del Sistema
                        </h3>

                        <div className="space-y-6">
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 block">Color de Acento (Tema)</label>
                                <div className="flex gap-3">
                                    {['blue', 'purple', 'emerald', 'amber'].map((color) => (
                                        <button
                                            key={color}
                                            onClick={() => setProfile({
                                                ...profile,
                                                preferences: { ...profile.preferences, accentColor: color as any }
                                            })}
                                            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${profile.preferences.accentColor === color
                                                ? 'border-foreground scale-110 shadow-lg'
                                                : 'border-transparent opacity-70 hover:opacity-100 hover:scale-105'
                                                } bg-${color === 'blue' ? 'blue-500' : color === 'purple' ? 'purple-500' : color === 'emerald' ? 'emerald-500' : 'amber-500'}`}
                                        >
                                            {profile.preferences.accentColor === color && <Check className="w-5 h-5 text-white" />}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">Elige el color principal para botones y destaques.</p>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 block">Estilo de Interfaz</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {[
                                        { id: 'light', label: 'Claro' },
                                        { id: 'dark', label: 'Oscuro (Premium)' },
                                        { id: 'theme-hub', label: 'Nortech Hub' },
                                        { id: 'system', label: 'Sistema' }
                                    ].map((mode) => (
                                        <button
                                            key={mode.id}
                                            onClick={() => {
                                                setProfile({
                                                    ...profile,
                                                    preferences: { ...profile.preferences, theme: mode.id as any }
                                                });
                                                setTheme(mode.id);
                                            }}
                                            className={`px-3 py-4 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-2 ${profile.preferences.theme === mode.id
                                                ? 'bg-primary/10 border-primary text-primary shadow-lg shadow-primary/5'
                                                : 'bg-background border-border text-muted-foreground hover:bg-muted'
                                                }`}
                                        >
                                            <div className={`w-full h-8 rounded-md mb-1 ${mode.id === 'dark' ? 'bg-zinc-900 border border-white/10' : mode.id === 'theme-hub' ? 'bg-[#fcf8f4] border border-[#ccff00]' : 'bg-gray-100 border border-gray-200'}`} />
                                            {mode.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notifications */}
                    <div className="card-premium p-6">
                        <h3 className="font-bold text-foreground mb-6 flex items-center gap-2 pb-4 border-b border-border">
                            <Bell className="w-5 h-5 text-accent-blue" />
                            Preferencias de Notificaciones
                        </h3>
                        <div className="space-y-4">
                            {[
                                { id: 'email', label: 'Notificaciones por Correo', desc: 'Recibir resúmenes semanales y alertas importantes.' },
                                { id: 'push', label: 'Notificaciones Push (Navegador)', desc: 'Alertas en tiempo real mientras usas el sistema.' },
                                { id: 'sales', label: 'Actualizaciones de Ventas', desc: 'Alertas sobre nuevas órdenes o cambios de estado.' },
                                { id: 'system', label: 'Avisos del Sistema', desc: 'Mantenimiento, actualizaciones y seguridad.' },
                            ].map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors">
                                    <div>
                                        <p className="font-medium text-foreground text-sm">{item.label}</p>
                                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={(profile.preferences.notifications as any)[item.id]}
                                            onChange={(e) => setProfile({
                                                ...profile,
                                                preferences: {
                                                    ...profile.preferences,
                                                    notifications: {
                                                        ...profile.preferences.notifications,
                                                        [item.id]: e.target.checked
                                                    }
                                                }
                                            })}
                                        />
                                        <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-blue"></div>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Admin Only: Global Notifications Section */}
                    {(role === 'SUPERADMIN' || role === 'ADMIN') && (
                        <div className="card-premium p-6 border-l-4 border-l-accent-amber bg-accent-amber/5">
                            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2 pb-2 border-b border-border/50">
                                <Megaphone className="w-5 h-5 text-accent-amber" />
                                Herramientas de Administración: Notificaciones Globales
                            </h3>
                            <p className="text-sm text-muted-foreground mb-6">
                                Las notificaciones enviadas aquí aparecerán instantáneamente en el panel de todos los usuarios del sistema.
                                Úsalas para avisos de mantenimiento, actualizaciones o comunicados generales.
                            </p>

                            <div className="space-y-4">
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5 block">Título del Aviso</label>
                                        <input
                                            type="text"
                                            value={globalNotif.title}
                                            onChange={(e) => setGlobalNotif({ ...globalNotif, title: e.target.value })}
                                            className="input-dark w-full bg-background"
                                            placeholder="Ej: Mantenimiento del Sistema"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5 block">Mensaje Completo</label>
                                        <textarea
                                            value={globalNotif.message}
                                            onChange={(e) => setGlobalNotif({ ...globalNotif, message: e.target.value })}
                                            className="input-dark w-full bg-background min-h-[100px] py-3"
                                            placeholder="Detalla aquí la información que verán todos los usuarios..."
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        onClick={() => setGlobalNotif({ title: "", message: "" })}
                                        className="btn-ghost text-xs"
                                    >
                                        Limpiar
                                    </button>
                                    <button
                                        onClick={handleSendGlobal}
                                        disabled={sendingGlobal}
                                        className="btn-primary bg-accent-amber hover:bg-amber-600 text-black border-none flex items-center gap-2 px-6 shadow-lg shadow-amber-500/20"
                                    >
                                        {sendingGlobal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                        <span className="font-bold">Enviar a Todos</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
