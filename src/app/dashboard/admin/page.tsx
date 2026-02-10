import Link from "next/link";
import { Users, Truck, FileText } from "lucide-react";

export default function AdminDashboardPage() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
            <Link href="/dashboard/users" className="card-premium p-6 group bg-card transition-all hover:scale-[1.02]">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-accent-blue/10 dark:bg-accent-blue/20 rounded-xl text-accent-blue group-hover:bg-accent-blue/20 dark:group-hover:bg-accent-blue/30 transition-colors">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-foreground group-hover:text-accent-blue transition-colors">Usuarios</h3>
                        <p className="text-sm text-muted-foreground">Gestionar acceso y roles del sistema</p>
                    </div>
                </div>
            </Link>

            <Link href="/dashboard/admin/suppliers" className="card-premium p-6 group bg-card transition-all hover:scale-[1.02]">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-500/10 dark:bg-purple-500/20 rounded-xl text-purple-600 group-hover:bg-purple-500/20 dark:group-hover:bg-purple-500/30 transition-colors">
                        <Truck className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-foreground group-hover:text-purple-600 transition-colors">Proveedores</h3>
                        <p className="text-sm text-muted-foreground">Alta y baja de proveedores</p>
                    </div>
                </div>
            </Link>
        </div>
    );
}
