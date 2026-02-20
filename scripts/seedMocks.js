const admin = require('firebase-admin');
const path = require('path');
const crypto = require('crypto');

const serviceAccount = require(path.join(process.env.HOME, 'Downloads', 'north3-8274b-firebase-adminsdk-fbsvc-a0dfaacefe.json'));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

// Helpers
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomPrice = (min, max) => Number((Math.random() * (max - min) + min).toFixed(2));
const randomStatus = () => {
    const r = Math.random();
    if (r < 0.2) return 'DRAFT';
    if (r < 0.6) return 'SENT';
    return 'FINALIZED'; // finalized means accepted/won
};

// Mock Data Source
const VENDEDORES = [
    "o6q2lq1Wv0ON8cTEnA1x9R8KigO2", // Let's try to fetch actual sales reps later, or just create if missing
];

const SUPPLIERS = [
    "TechGlobal Solutions", "Industrias Foxconn", "ABB Mexico", "Siemens Automatización",
    "Rockwell Automation", "Schneider Electric MX", "Omron Electronics", "Cisco Systems",
    "Hewlett Packard Ent", "Dell Technologies"
];

const CLIENTS = [
    { razonSocial: "Manufacturas del Norte S.A. de C.V.", rfc: "MNO010101XYZ", email: "compras@manunorte.com" },
    { razonSocial: "Ensambladora Tijuana, S.A.", rfc: "ETI010101ABC", email: "adquisiciones@ensamblatij.com" },
    { razonSocial: "Aeroespacial Baja MFI", rfc: "AER123456789", email: "proveedores@aerobaja.com" },
    { razonSocial: "Medical Devices LLC MX", rfc: "MED987654321", email: "procurement@medicaldev.mx" },
    { razonSocial: "Automotriz de Hermosillo, S.A. de C.V.", rfc: "AHE112233445", email: "compras@autoherm.com.mx" },
    { razonSocial: "Logística Fronteriza del Noroeste", rfc: "LFN223344556", email: "pagos@logisticafro.com" },
    { razonSocial: "Sistemas Industriales de Sonora", rfc: "SIS334455667", email: "admin@sis-sonora.com" },
    { razonSocial: "Empacadora Mexicali, S. de R.L.", rfc: "EME445566778", email: "gerencia@empacadoramx.com" },
    { razonSocial: "Tecnología Agrícola del Valle", rfc: "TAV556677889", email: "ventas@tecagricola.com" },
    { razonSocial: "Constructora Peninsular", rfc: "CPE667788990", email: "proyectos@conspen.com" }
];

const PRODUCT_PREFIXES = ["Sensor", "Controlador", "Motor", "Actuador", "Válvula", "Switch", "Panel", "Cable", "Fuente de Poder", "Módulo"];
const PRODUCT_SUFFIXES = ["Ind", "Pro", "Max", "Lite", "X", "V2", "Serie 5000", "Compact"];

async function main() {
    console.log("🚀 Starting DB Seed...");

    // 1. Get real users to assign as sales reps
    const usersSnap = await db.collection('users').where('role', '==', 'SALES').get();
    let salesReps = [];
    if (!usersSnap.empty) {
        salesReps = usersSnap.docs.map(doc => doc.id);
        console.log(`Found ${salesReps.length} sales reps.`);
    } else {
        // Fetch any users if no SALES found
        const allUsers = await db.collection('users').limit(5).get();
        salesReps = allUsers.docs.map(doc => doc.id);
        console.log(`No explicit SALES reps found. Using ${salesReps.length} random users.`);
    }

    if (salesReps.length === 0) {
        console.log("No users found to assign quotes. Creating a dummy one.");
        salesReps = ["dummy_sales_rep_1"];
    }

    // 2. Generate  Suppliers
    console.log("📦 Generating 10 Suppliers...");
    const supplierIds = [];
    for (const sName of SUPPLIERS) {
        const docRef = await db.collection('suppliers').add({
            name: sName,
            rfc: sName.substring(0, 3).toUpperCase() + randomInt(100000, 999999) + 'XYZ',
            contactName: "Contacto de " + sName,
            email: "ventas@" + sName.replace(/\s+/g, '').toLowerCase() + ".com",
            phone: "686-" + randomInt(1000000, 9999999),
            creditTerms: randomItem(["Contado", "Neto 30 Dias", "Neto 15 Dias"]),
            street: "Calle Industria " + randomInt(1, 100),
            city: "Mexicali",
            state: "Baja California",
            zipCode: "21000",
            notes: "Proveedor auto-generado",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        supplierIds.push({ id: docRef.id, name: sName });
    }

    // 3. Generate Products (6-8 per supplier)
    console.log("🛒 Generating Products...");
    const productsList = [];
    for (const sup of supplierIds) {
        const numProducts = randomInt(6, 8);
        for (let i = 0; i < numProducts; i++) {
            const pName = `${randomItem(PRODUCT_PREFIXES)} ${randomItem(PRODUCT_SUFFIXES)}`;
            const sku = pName.substring(0, 3).toUpperCase() + "-" + randomInt(1000, 9999);
            const basePrice = randomPrice(50, 5000);

            const docRef = await db.collection('products').add({
                name: pName,
                sku: sku,
                description: `Producto industrial ${pName} de alta calidad.`,
                basePrice: basePrice,
                unit: randomItem(['PZA', 'M', 'KG']),
                supplierId: sup.id,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            productsList.push({ id: docRef.id, name: pName, basePrice, sku, supplierId: sup.id, supplierName: sup.name });
        }
    }

    // 4. Generate Clients
    console.log("🏢 Generating Clients...");
    const clientIds = [];
    for (const c of CLIENTS) {
        const docRef = await db.collection('clients').add({
            ...c,
            phone: "686-" + randomInt(1000000, 9999999),
            address: "Zona Industrial " + randomInt(1, 10) + ", Mexicali",
            taxRate: 0.08,
            status: "ACTIVE",
            salesRepId: randomItem(salesReps),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        clientIds.push({ id: docRef.id, razonSocial: c.razonSocial, taxRate: 0.08, salesRepId: randomItem(salesReps) });
    }

    // 5. Generate Quotes (30 quotes, multiple closed, some draft, some sent)
    console.log("📝 Generating 30 Quotes...");
    let quotesCreated = 0;

    // Distribute quotes over the last 90 days to populate dashboard charts
    const now = new Date();

    for (let i = 0; i < 30; i++) {
        const client = randomItem(clientIds);
        const rep = client.salesRepId || randomItem(salesReps);

        // Pick 1 to 5 items for this quote
        const numItems = randomInt(1, 5);
        const quoteItems = [];
        for (let j = 0; j < numItems; j++) {
            const p = randomItem(productsList);
            quoteItems.push({
                productId: p.id,
                productName: p.name,
                quantity: randomInt(1, 100),
                basePrice: p.basePrice,
                importCost: randomPrice(10, 200),
                freightCost: randomPrice(20, 500),
                margin: 0.30, // 30% margin
                currency: randomItem(['MXN', 'USD']),
                supplierId: p.supplierId,
                supplierName: p.supplierName
            });
        }

        let subtotal = 0;
        const exchangeRate = 18.20;
        const qCurrency = randomItem(['MXN', 'USD']);

        const enrichedItems = quoteItems.map(item => {
            const cost = item.basePrice + item.importCost + item.freightCost;
            const itemCurrency = item.currency;
            let currentPrice = cost * (1 + item.margin);

            if (itemCurrency !== qCurrency) {
                if (itemCurrency === "USD" && qCurrency === "MXN") {
                    currentPrice = currentPrice * exchangeRate;
                } else if (itemCurrency === "MXN" && qCurrency === "USD") {
                    currentPrice = currentPrice / exchangeRate;
                }
            }

            subtotal += currentPrice * item.quantity;
            return {
                ...item,
                unitPrice: currentPrice
            };
        });

        const taxRate = client.taxRate || 0.08;
        const taxAmount = subtotal * taxRate;
        const total = subtotal + taxAmount;

        // Random date within last 90 days
        const daysAgo = randomInt(0, 90);
        const quoteDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));

        await db.collection('quotations').add({
            folio: `COT-2026-${randomInt(1000, 9999)}`,
            clientId: client.id,
            salesRepId: rep,
            items: enrichedItems,
            financials: {
                subtotal, taxRate, taxAmount, total, currency: qCurrency, exchangeRate
            },
            notes: "Cotización generada automáticamente.",
            status: randomStatus(),
            createdAt: admin.firestore.Timestamp.fromDate(quoteDate),
            updatedAt: admin.firestore.Timestamp.fromDate(quoteDate)
        });
        quotesCreated++;
    }


    // 6. Generate Orders based on Finalized Quotes
    console.log("📦 Generating 20 Orders...");
    let ordersCreated = 0;

    // We will create orders for the first 20 clients/quotes (or whatever is available)
    for (let i = 0; i < 20; i++) {
        const client = randomItem(clientIds);
        const rep = client.salesRepId || randomItem(salesReps);

        // Pick 1 to 5 items for this order
        const numItems = randomInt(1, 5);
        const orderItems = [];
        for (let j = 0; j < numItems; j++) {
            const p = randomItem(productsList);
            orderItems.push({
                productId: p.id,
                productName: p.name,
                quantity: randomInt(1, 100),
                basePrice: p.basePrice,
                importCost: randomPrice(10, 200),
                freightCost: randomPrice(20, 500),
                margin: 0.30, // 30% margin
                currency: randomItem(['MXN', 'USD']),
                supplierId: p.supplierId,
                supplierName: p.supplierName
            });
        }

        let subtotal = 0;
        const exchangeRate = 18.20;
        const qCurrency = randomItem(['MXN', 'USD']);

        const enrichedItems = orderItems.map(item => {
            const cost = item.basePrice + item.importCost + item.freightCost;
            const itemCurrency = item.currency;
            let currentPrice = cost * (1 + item.margin);

            if (itemCurrency !== qCurrency) {
                if (itemCurrency === "USD" && qCurrency === "MXN") {
                    currentPrice = currentPrice * exchangeRate;
                } else if (itemCurrency === "MXN" && qCurrency === "USD") {
                    currentPrice = currentPrice / exchangeRate;
                }
            }

            subtotal += currentPrice * item.quantity;
            return {
                ...item,
                unitPrice: currentPrice
            };
        });

        const taxRate = Math.floor(subtotal) % 2 === 0 ? 0.16 : 0.08;
        const taxAmount = subtotal * taxRate;
        const total = subtotal + taxAmount;

        // Random date within last 90 days
        const daysAgo = randomInt(0, 90);
        const orderDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));

        const possibleStatuses = ['PENDING', 'APPROVED', 'PO_SENT', 'COMPLETED', 'CANCELLED'];

        await db.collection('orders').add({
            quoteId: `quote-${randomInt(1000, 9999)}`,
            quoteFolio: `COT-2026-${randomInt(1000, 9999)}`,
            clientId: client.id,
            clientName: client.razonSocial,
            salesRepId: rep,
            items: enrichedItems,
            financials: {
                subtotal, taxRate, taxAmount, total, currency: qCurrency, exchangeRate: 18.20
            },
            clientOcFolio: `OC-${randomInt(10000, 99999)}`,
            clientOcUrl: "",
            status: randomItem(possibleStatuses),
            type: 'SALES_ORDER',
            createdAt: admin.firestore.Timestamp.fromDate(orderDate),
            updatedAt: admin.firestore.Timestamp.fromDate(orderDate)
        });
        ordersCreated++;
    }

    console.log(`✅ Success! Seeded: 
    - ${supplierIds.length} Suppliers
    - ${productsList.length} Products
    - ${clientIds.length} Clients
    - ${quotesCreated} Quotes
    - ${ordersCreated} Orders`);
}

main().catch(console.error);
