"use client";

import QuoteForm from "@/components/forms/QuoteForm";
import { useParams } from "next/navigation";

export default function EditQuotePage() {
    const params = useParams();
    const id = params.id as string;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Modificar Cotización</h1>
                <p className="text-muted-foreground mt-1">Edita los detalles de tu propuesta comercial</p>
            </div>
            <QuoteForm initialId={id} />
        </div>
    );
}
