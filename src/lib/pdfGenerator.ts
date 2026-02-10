
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from './utils';

export const generateQuotePDF = (quote: any, client: any, user: any) => {
    const doc = new jsPDF();

    // --- Header ---
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text("COTIZACIÓN", 150, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Folio: ${quote.folio || 'PENDIENTE'}`, 150, 28);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 150, 34);

    // Logo Placeholder
    doc.setFillColor(230, 230, 230);
    doc.rect(14, 10, 40, 40, 'F');
    doc.setFontSize(12);
    doc.setTextColor(150, 150, 150);
    doc.text("Logo", 22, 32);

    // Company Info (Nortech) - Mock
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text("NORTECH S.A. de C.V.", 60, 20);
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text("Av. Industrial 123, Parque Tecnológico", 60, 26);
    doc.text("Monterrey, NL, CP 64000", 60, 32);
    doc.text("RFC: NOR000101XYZ", 60, 38);
    doc.text("Tel: (81) 1234-5678", 60, 44);

    // --- Client Info ---
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 55, 196, 55);

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text("DATOS DEL CLIENTE", 14, 62);

    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(`Cliente: ${client.razonSocial || 'Por definir'}`, 14, 69);
    doc.text(`RFC: ${client.rfc || 'XEXX010101000'}`, 14, 75);
    doc.text(`Atención: ${client.contactName || 'Encargado de Compras'}`, 14, 81);
    doc.text(`Email: ${client.email || ''}`, 100, 69);
    doc.text(`Tel: ${client.phone || ''}`, 100, 75);

    // --- Items Table ---
    const tableColumn = ["Cant.", "Descripción", "P. Unit", "Moneda", "Importe"];
    const tableRows: any[] = [];

    quote.items.forEach((item: any) => {
        const unitPrice = item.unitPrice || 0;
        const quantity = item.quantity || 0;
        const totalPrice = item.totalPrice || (unitPrice * quantity);
        const itemCurrency = item.currency || "MXN";

        const itemData = [
            quantity,
            item.productName || item.description || "N/A",
            formatCurrency(unitPrice, itemCurrency),
            itemCurrency,
            formatCurrency(totalPrice, itemCurrency)
        ];
        tableRows.push(itemData);
    });

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 90,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] },
        styles: { fontSize: 8 },
        columnStyles: {
            0: { cellWidth: 15 },
            2: { halign: 'right' },
            3: { halign: 'center' },
            4: { halign: 'right' }
        }
    });

    // --- Totals ---
    // @ts-ignore
    const finalY = doc.lastAutoTable.finalY + 10;
    const quoteCurrency = quote.financials.currency || "MXN";

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);

    // Show Exchange Rate if mixed
    if (quote.financials.exchangeRate && quote.financials.exchangeRate !== 1) {
        doc.text(`T.C. Aplicado: 1 USD = ${quote.financials.exchangeRate} MXN`, 14, finalY);
    }

    doc.setTextColor(0, 0, 0);
    doc.text("Subtotal:", 140, finalY);
    doc.text(formatCurrency(quote.financials.subtotal, quoteCurrency), 196, finalY, { align: 'right' });

    doc.text(`IVA (${(quote.financials.taxRate * 100).toFixed(0)}%):`, 140, finalY + 6);
    doc.text(formatCurrency(quote.financials.taxAmount, quoteCurrency), 196, finalY + 6, { align: 'right' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total (${quoteCurrency}):`, 140, finalY + 14);
    doc.text(formatCurrency(quote.financials.total, quoteCurrency), 196, finalY + 14, { align: 'right' });

    // --- Footer / Terms ---
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const termsY = finalY + 30;
    doc.text("Términos y Condiciones:", 14, termsY);
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);

    const terms = quote.notes || "Precios sujetos a cambio sin previo aviso. Tiempo de entrega estimado: 3-5 días hábiles.";
    const splitTerms = doc.splitTextToSize(terms, 180);
    doc.text(splitTerms, 14, termsY + 6);

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generado por: ${user.email} - Nortech ERP System`, 105, 290, { align: 'center' });

    // Save
    doc.save(`Cotizacion_${quote.folio || 'Draft'}.pdf`);
};
