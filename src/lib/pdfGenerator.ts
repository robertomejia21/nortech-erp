
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from './utils';
// import { logoBase64 } from './assets/logo'; // Assuming we might have a logo, or we keep the placeholder

export const generateQuotePDF = (quote: any, client: any, user: any) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // --- Header Section ---
    // Logo Placeholder (Triangle shape from image simulation)
    // doc.addImage(logoBase64, 'PNG', 10, 10, 30, 30); 
    // Drawing a placeholder logo manually if no image
    doc.setFillColor(0, 0, 0);
    doc.triangle(25, 10, 15, 30, 35, 30, 'F');
    doc.setFillColor(255, 255, 255);
    doc.triangle(25, 18, 20, 28, 30, 28, 'F');

    doc.setFontSize(22);
    doc.setFont('times', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text("North Tech Supplier S. de R.L. de C.V.", 60, 20);

    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text("NORTH TECH", 10, 38);

    // Company Info
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text("RFC: NTS210112JQ7", 110, 30);
    doc.text("Tel: +52 1 686 222 0781", 60, 44);
    doc.text("Email: service@northsupplierco.com", 60, 50);
    doc.setFont('helvetica', 'normal');
    doc.text("Av. Cañitas #1638, Colonia Zacatecas C.P. 21070, Mexicali,", 80, 40);
    doc.text("B.C", 130, 44);

    // Quote # Box
    const boxX = 160;
    const boxY = 48;
    doc.setFillColor(0, 0, 0);
    doc.rect(boxX, boxY, 40, 6, 'F'); // Header bg
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text("Quote #", boxX + 12, boxY + 4);

    doc.setFillColor(240, 240, 240);
    doc.rect(boxX, boxY + 6, 40, 8, 'F'); // Content bg
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.text(`${quote.folio || 'PENDIENTE'}`, boxX + 20, boxY + 11, { align: 'center' });

    // Greeting
    doc.setFontSize(11);
    doc.setFont('times', 'normal');
    doc.text("Muchas gracias por considerar nuestra compañía para sus cotizaciones.", 105, 65, { align: 'center' });

    // --- Customer Info Grid ---
    // Using autoTable to replicate the specific black header layout
    autoTable(doc, {
        startY: 70,
        head: [
            [
                { content: 'Sold to customer', styles: { halign: 'center', fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold' } },
                { content: 'Contact', styles: { halign: 'center', fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold' } },
                { content: 'Address', styles: { halign: 'center', fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold' } }
            ]
        ],
        body: [
            [
                { content: client.razonSocial || 'CLIENTE MOSTRADOR', styles: { halign: 'center' } },
                { content: client.contactName || '', styles: { halign: 'center' } },
                { content: `${client.address || 'Mexicali, Baja California'}`, styles: { halign: 'center' } }
            ]
        ],
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 1, lineColor: [0, 0, 0], lineWidth: 0.1 },
        columnStyles: {
            0: { cellWidth: 70 },
            1: { cellWidth: 40 },
            2: { cellWidth: 'auto' }
        }
    });

    // Second Row of Customer Info
    autoTable(doc, {
        // @ts-ignore
        startY: doc.lastAutoTable.finalY,
        head: [
            [
                { content: 'Phone', styles: { halign: 'center', fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold' } },
                { content: 'E-mail', colSpan: 2, styles: { halign: 'center', fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold' } },
                { content: 'Terms', styles: { halign: 'center', fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold' } },
                { content: 'Date', styles: { halign: 'center', fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold' } }
            ]
        ],
        body: [
            [
                { content: client.phone || '', styles: { halign: 'center' } },
                { content: client.email || '', colSpan: 2, styles: { halign: 'center' } },
                { content: '15 dias', styles: { halign: 'center' } }, // Static as per image, or dynamic if needed
                { content: new Date().toLocaleDateString(), styles: { halign: 'center' } }
            ]
        ],
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 1, lineColor: [0, 0, 0], lineWidth: 0.1 },
        columnStyles: {
            0: { cellWidth: 50 },
            1: { cellWidth: 'auto' }, // Email spans
            3: { cellWidth: 30 },
            4: { cellWidth: 30 }
        }
    });

    // --- Items Table ---
    const itemsBody = quote.items.map((item: any, index: number) => [
        index + 1,
        item.quantity,
        item.partNumber || 'N/A', // Assuming partNumber exists, else N/A
        item.productName || item.description,
        formatCurrency(item.unitPrice),
        formatCurrency(item.total || (item.unitPrice * item.quantity))
    ]);

    // Fill empty rows to make it look like the sheet
    /*
    while (itemsBody.length < 5) {
        itemsBody.push(['', '', '', '', '', '']);
    }
    */

    autoTable(doc, {
        // @ts-ignore
        startY: doc.lastAutoTable.finalY + 5,
        head: [['LN', 'QTY', 'PN', 'DESCRIPTION', 'UNIT PRICE', 'TOTAL']],
        body: itemsBody,
        theme: 'grid',
        headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
        styles: { fontSize: 9, cellPadding: 2, lineColor: [0, 0, 0], lineWidth: 0.1, textColor: [0, 0, 0] },
        columnStyles: {
            0: { cellWidth: 15, halign: 'center' },
            1: { cellWidth: 20, halign: 'center' },
            2: { cellWidth: 30 },
            3: { cellWidth: 'auto' },
            4: { cellWidth: 30, halign: 'right' },
            5: { cellWidth: 30, halign: 'right' }
        }
    });

    // --- Footer Section ---
    // @ts-ignore
    let yPos = doc.lastAutoTable.finalY + 10;

    // Check for page break
    if (yPos > 240) {
        doc.addPage();
        yPos = 20;
    }

    const leftColX = 14;
    const rightColX = 140;

    // Conditions Table (Left)
    autoTable(doc, {
        startY: yPos,
        margin: { left: 14 },
        tableWidth: 100, // Half page width roughly
        head: [[{ content: 'Condiciones', styles: { halign: 'center', fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold' } }]],
        body: [
            ['Precios considerando entrega en planta'],
            [{ content: 'COTIZACION VALIDA POR 15 DIAS', styles: { textColor: [255, 0, 0], fontStyle: 'bold' } }],
            ['moneda: pesos mexicanos'],
            [{ content: 'Entrega: ' + (quote.deliveryTime || '3-5') + ' dias habiles', styles: { textColor: [255, 0, 0] } }]
        ],
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 1.5, lineColor: [0, 0, 0], lineWidth: 0.1 }
    });

    // Totals Table (Right)
    // We manually draw the black background for the totals
    const financials = quote.financials || { subtotal: 0, taxAmount: 0, total: 0 };

    // Subtotal
    doc.setFillColor(0, 0, 0);
    // doc.rect(rightColX, yPos, 60, 24, 'F'); // Background block

    // Using autoTable for totals to align perfectly
    autoTable(doc, {
        startY: yPos + 18, // Align bottom of totals with bottom of conditions roughly? No, right side.
        margin: { left: rightColX },
        tableWidth: 60,
        body: [
            [
                { content: 'Subtotal', styles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold' } },
                { content: formatCurrency(financials.subtotal), styles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], halign: 'right', fontStyle: 'bold' } }
            ],
            [
                { content: 'Iva 8%', styles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold' } },
                { content: formatCurrency(financials.taxAmount), styles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], halign: 'right', fontStyle: 'bold' } }
            ],
            [
                { content: 'Total', styles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold' } },
                { content: formatCurrency(financials.total), styles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], halign: 'right', fontStyle: 'bold' } }
            ]
        ],
        theme: 'plain', // No borders, just bg
        styles: { fontSize: 12, cellPadding: 2 }
    });

    // --- Footer Notes ---
    // @ts-ignore
    const finalY = doc.lastAutoTable.finalY + 10;

    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.text("NOTAS: Se necesita PO para procesar, después de que PO esta liberado no hay cancelación.", 14, finalY + 10);

    // Save
    doc.save(`Cotizacion_${quote.folio || 'Draft'}.pdf`);
};
