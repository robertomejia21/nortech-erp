import * as pdfjsLib from 'pdfjs-dist';

// Define the worker script path so it loads correctly in Next.js
// We use the CDN to avoid complex Webpack configuration issues in Next.js for the worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

import { extractSupplierInfoWithAI } from '@/app/actions/parseDocument';

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

        // Let the Gemini AI handle the messy unstructured text
        const data = await extractSupplierInfoWithAI(fullText);

        return data;

    } catch (error: any) {
        console.error("Error parsing PDF Constancia:", error);
        throw new Error(error?.message || "Error al procesar el PDF o conectar con la IA.");
    }
}
