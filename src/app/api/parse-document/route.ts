import { NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
    // FORCE READ AT RUNTIME
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    // DEBUG LOGGING TO VERCEL CONSOLE
    console.log("=== API ROUTE EXECUTION ===");
    console.log("Environment Keys Count:", Object.keys(process.env).length);
    console.log("GEMINI_API_KEY Type:", typeof process.env.GEMINI_API_KEY);
    console.log("Loaded API Key Length:", apiKey ? apiKey.length : 0);

    try {
        const body = await req.json();
        const { rawText } = body;

        if (!rawText) {
            return NextResponse.json({ error: "No text provided" }, { status: 400 });
        }

        if (!apiKey) {
            console.error("Missing GEMINI_API_KEY in Vercel Edge Runtime.");
            // We expose exactly what we see for debugging
            return NextResponse.json({ error: `Missing API Key Configuration. Env Keys total: ${Object.keys(process.env).length}` }, { status: 500 });
        }

        const ai = new GoogleGenAI({ apiKey: apiKey });


        const prompt = `
Eres un asistente experto en contabilidad mexicana. 
A continuación te proporcionaré el texto sin formato extraído de un archivo PDF de una 'Constancia de Situación Fiscal' del SAT (México).

Por favor, extrae exactamente estos 3 campos de texto:
1. RFC (R.F.C.)
2. Razón Social (Denominación/Razón Social o el Nombre completo si es persona física)
3. Código Postal (CP / ZipCode)

Devuelve tu respuesta ÚNICAMENTE como un objeto JSON válido, sin formato markdown (\`\`\`json) ni texto adicional.
Las llaves del JSON deben ser exactamente:
{
  "rfc": "...",
  "razonSocial": "...",
  "zipCode": "..."
}

Si no encuentras un dato, déjalo como string vacío "".

Texto del documento:
---
${rawText}
---
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                temperature: 0.1,
                responseMimeType: "application/json"
            }
        });

        const resultText = response.text;

        if (!resultText) {
            throw new Error("No response from AI");
        }

        const data = JSON.parse(resultText);
        return NextResponse.json(data);

    } catch (error: any) {
        console.error("API POST Error extracting document with AI:", error);
        return NextResponse.json(
            { error: error?.message || "Failed to process document" },
            { status: 500 }
        );
    }
}
