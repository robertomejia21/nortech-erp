import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function UnauthorizedPage() {
    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-4 text-center">
            <ShieldAlert className="w-16 h-16 text-red-500" />
            <h1 className="text-2xl font-bold text-slate-900">Acceso Restringido</h1>
            <p className="text-slate-600 max-w-md">
                No tienes los permisos necesarios para acceder a esta sección. Si crees que esto es un error, contacta al administrador.
            </p>
            <Link
                href="/dashboard"
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
                Volver al Inicio
            </Link>
        </div>
    );
}
