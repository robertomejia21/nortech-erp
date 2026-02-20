import * as pdfjsLib from 'pdfjs-dist';

// Define the worker script path so it loads correctly in Next.js
// We use the CDN to avoid complex Webpack configuration issues in Next.js for the worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface ConstanciaData {
    rfc?: string;
    razonSocial?: string;
    zipCode?: string;
}

export async function parseConstancia(file: File): Promise<ConstanciaData> {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument(arrayBuffer);
        const pdfDocument = await loadingTask.promise;

        let fullText = '';

        // Constancia important data is usually on the first or second page
        const numPages = Math.min(pdfDocument.numPages, 2);

        for (let i = 1; i <= numPages; i++) {
            const page = await pdfDocument.getPage(i);
            const textContent = await page.getTextContent();

            // Extract the text items and join them
            const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');

            fullText += pageText + ' ';
        }

        console.log("Extracted PDF Text Length:", fullText.length);

        // Call the new Next.js API route instead of the Server Action
        // This avoids Vercel "Server Components render" crash with the GenAI SDK
        const response = await fetch('/api/parse-document', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rawText: fullText })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Fallo en la API de procesamiento");
        }

        const data: ConstanciaData = await response.json();

        return data;

    } catch (error: any) {
        console.error("Error parsing PDF Constancia:", error);
        throw new Error(error?.message || "Error al procesar el PDF o conectar con la IA.");
    }
}
