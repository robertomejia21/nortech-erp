"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
    Loader2,
    LayoutDashboard,
    Users,
    Package,
    FileText,
    Truck,
    Settings,
    DollarSign,
    ShoppingCart,
    BarChart3,
    LogOut,
    Bell,
    Search,
    ChevronDown,
    ShoppingBag,
    Target
} from "lucide-react";
import NotificationDropdown from "@/components/ui/NotificationDropdown";
import ThemeToggle from "@/components/ui/ThemeToggle";

const navigation = {
    SUPERADMIN: [
        { name: "Panel Principal", href: "/dashboard", icon: LayoutDashboard },
        { name: "CRM Pipeline", href: "/dashboard/sales/crm", icon: Target },
        { name: "Usuarios", href: "/dashboard/users", icon: Users },
        { name: "Cotizaciones", href: "/dashboard/sales/quotes", icon: FileText },
        { name: "Ventas / Órdenes", href: "/dashboard/sales/orders", icon: ShoppingBag },
        { name: "Productos", href: "/dashboard/sales/products", icon: Package },
        { name: "Clientes", href: "/dashboard/sales/clients", icon: Users },
        { name: "Proveedores", href: "/dashboard/sales/suppliers", icon: Truck },
        { name: "Almacén", href: "/dashboard/warehouse", icon: Package },
        { name: "Finanzas", href: "/dashboard/finance", icon: DollarSign },
    ],
    ADMIN: [
        { name: "Panel Principal", href: "/dashboard", icon: LayoutDashboard },
        { name: "CRM Pipeline", href: "/dashboard/sales/crm", icon: Target },
        { name: "Usuarios", href: "/dashboard/users", icon: Users },
        { name: "Cotizaciones", href: "/dashboard/sales/quotes", icon: FileText },
        { name: "Ventas / Órdenes", href: "/dashboard/sales/orders", icon: ShoppingBag },
        { name: "Productos", href: "/dashboard/sales/products", icon: Package },
        { name: "Clientes", href: "/dashboard/sales/clients", icon: Users },
        { name: "Proveedores", href: "/dashboard/sales/suppliers", icon: Truck },
        { name: "Almacén", href: "/dashboard/warehouse", icon: Package },
        { name: "Finanzas", href: "/dashboard/finance", icon: DollarSign },
    ],
    SALES: [
        { name: "Panel Principal", href: "/dashboard", icon: LayoutDashboard },
        { name: "CRM Pipeline", href: "/dashboard/sales/crm", icon: Target },
        { name: "Cotizaciones", href: "/dashboard/sales/quotes", icon: FileText },
        { name: "Órdenes de Venta", href: "/dashboard/sales/orders", icon: ShoppingBag },
        { name: "Productos", href: "/dashboard/sales/products", icon: Package },
        { name: "Clientes", href: "/dashboard/sales/clients", icon: Users },
        { name: "Proveedores", href: "/dashboard/sales/suppliers", icon: Truck },
    ],
    WAREHOUSE: [
        { name: "Panel Principal", href: "/dashboard", icon: LayoutDashboard },
        { name: "Entradas / Recepciones", href: "/dashboard/warehouse/receivals", icon: Package },
        { name: "Órdenes de Compra", href: "/dashboard/warehouse/orders", icon: FileText },
        { name: "Inventario", href: "/dashboard/warehouse/inventory", icon: ShoppingCart },
    ],
    FINANCE: [
        { name: "Panel Principal", href: "/dashboard", icon: LayoutDashboard },
        { name: "Facturación", href: "/dashboard/finance/invoices", icon: FileText },
        { name: "Cuentas por Cobrar", href: "/dashboard/finance/receivables", icon: DollarSign },
    ],
};

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, role, isLoading, logout } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isLoading && !user) {
            router.push("/");
        }
    }, [user, isLoading, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background bg-mesh">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
                        <Loader2 className="w-10 h-10 animate-spin text-primary relative" />
                    </div>
                    <p className="text-muted-foreground">Cargando...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    const userRole = role as keyof typeof navigation;
    const navItems = navigation[userRole] || navigation.SALES;

    const handleLogout = async () => {
        try {
            await signOut(auth);
            logout();
            router.push("/");
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    return (
        <div className="flex h-screen bg-background overflow-hidden transition-colors duration-300">
            {/* Sidebar */}
            <aside className="w-72 bg-card border-r border-border hidden lg:flex flex-col transition-colors duration-300">
                {/* Logo */}
                <div className="p-6 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10">
                            <div className="absolute inset-0 rounded-lg bg-primary/20 blur-lg" />
                            <Image
                                src="/logo.png"
                                alt="Nortech Logo"
                                fill
                                className="object-contain relative"
                            />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-foreground tracking-tight">Nortech</h2>
                            <p className="text-xs text-muted-foreground">ERP & CRM Sistema</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Menú Principal
                    </p>
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={isActive ? "nav-item-active" : "nav-item"}
                            >
                                <item.icon className="w-5 h-5" />
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* User Section */}
                <div className="p-4 border-t border-border">
                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors group">
                        <Link href="/dashboard/profile" className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-500 to-zinc-700 flex items-center justify-center text-white font-bold text-sm shadow-sm relative overflow-hidden">
                                {user.photoURL ? (
                                    <Image src={user.photoURL} alt="Avatar" fill className="object-cover" />
                                ) : (
                                    user.email?.charAt(0).toUpperCase()
                                )}
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                                <p className="text-sm font-medium text-foreground truncate group-hover:text-accent-blue transition-colors">{user.displayName || user.email}</p>
                                <p className="text-xs text-muted-foreground capitalize flex items-center gap-1">
                                    {role} <Settings className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </p>
                            </div>
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="p-2 text-muted-foreground hover:text-destructive hover:bg-muted rounded-lg transition-colors ml-1"
                            title="Cerrar Sesión"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Header */}
                <header className="h-16 bg-card/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-6 sticky top-0 z-10 transition-colors duration-300">
                    <div className="flex items-center gap-4">
                        {/* Mobile menu button would go here */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Buscar órdenes, facturas..."
                                className="input-dark pl-10 w-64 text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                        <NotificationDropdown />
                        <Link href="/dashboard/sales/quotes/new" className="btn-primary text-sm flex items-center gap-2">
                            <span>+ Nueva Cotización</span>
                        </Link>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-6 bg-mesh dark:bg-mesh relative transition-colors duration-300">
                    <div className="absolute inset-0 bg-white dark:bg-transparent -z-10" />
                    {children}
                </main>
            </div>
        </div>
    );
}
