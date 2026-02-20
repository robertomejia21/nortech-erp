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

        // Clean up extra spaces to make regex easier
        const normalizedText = fullText.replace(/\s+/g, ' ');

        const data: ConstanciaData = {};

        // --- 1. Extract RFC ---
        // RFC format: 3-4 letters, 6 digits, 3 alphanumeric
        const rfcRegex = /[A-ZÑ&]{3,4}\d{6}[A-V1-9][A-Z1-9][0-9A]/i;
        const rfcMatch = normalizedText.match(rfcRegex);
        if (rfcMatch) {
            data.rfc = rfcMatch[0].toUpperCase();
        }

        // --- 2. Extract Razon Social / Nombre ---
        // Usually follows "Denominación/Razón Social:" or "Nombre, Denominación o Razón Social:"
        // and ends before "Régimen Capital:" or "Nombre Comercial:"
        const razonSocialRegex = /(?:Denominación\/Razón Social:|Nombre, Denominación o Razón Social:)\s*(.*?)(?=\s*(?:Régimen Capital:|Nombre Comercial:|RFC:))/i;
        const razonSocialMatch = normalizedText.match(razonSocialRegex);

        if (razonSocialMatch && razonSocialMatch[1]) {
            data.razonSocial = razonSocialMatch[1].trim();
        } else {
            // Backup for physical persons (Personas Físicas)
            // Sometimes it's right after the RFC and "Nombre (s) Primer Apellido Segundo Apellido"
            const pfNameRegex = /Nombre \(s\)\s*Primer Apellido\s*Segundo Apellido\s*([A-ZÑÁÉÍÓÚ\s]+)(?=CURP|idCIF|Registro)/i;
            const pfMatch = normalizedText.match(pfNameRegex);
            if (pfMatch && pfMatch[1]) {
                data.razonSocial = pfMatch[1].trim();
            }
        }

        // --- 3. Extract Zip Code (Código Postal) ---
        // Usually follows "Código Postal:"
        const zipRegex = /C[oó]digo Postal:\s*(\d{5})/i;
        const zipMatch = normalizedText.match(zipRegex);
        if (zipMatch) {
            data.zipCode = zipMatch[1];
        }

        return data;

    } catch (error) {
        console.error("Error parsing PDF Constancia:", error);
        return {}; // Return empty object on failure so it doesn't break the app
    }
}
