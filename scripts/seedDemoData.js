const admin = require('firebase-admin');
const serviceAccount = require(require('path').join(process.env.HOME, 'Downloads', 'north3-8274b-firebase-adminsdk-fbsvc-a0dfaacefe.json'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

async function seedData() {
    try {
        console.log("🌱 Iniciando sembrado de datos...");

        // 1. Get Sales Rep UID (vendedor1)
        const user = await auth.getUserByEmail('vendedor1@nortech.com');
        const salesRepId = user.uid;
        console.log(`👤 Vendedor encontrado: ${salesRepId}`);

        // 2. Create Leads
        const leads = [
            {
                companyName: "Industrias del Norte SA",
                contactName: "Ing. Roberto Gomez",
                email: "roberto@industriasnorte.com",
                phone: "686-555-0101",
                status: "negotiation",
                value: 45000,
                salesRepId,
                createdAt: new Date()
            },
            {
                companyName: "Manufacturas Baja",
                contactName: "Lic. Ana Torres",
                email: "ana@manbaja.com",
                phone: "686-555-0202",
                status: "leads",
                value: 12000,
                salesRepId,
                createdAt: new Date()
            },
            {
                companyName: "ElectroComponentes MX",
                contactName: "Carlos Ruiz",
                email: "cruiz@electrocomp.mx",
                phone: "664-555-0303",
                status: "quotes",
                value: 28500,
                salesRepId,
                createdAt: new Date()
            }
        ];

        for (const lead of leads) {
            await db.collection('leads').add(lead);
            console.log(`✅ Lead creado: ${lead.companyName}`);
        }

        // 3. Create Quotations
        const quotes = [
            {
                folio: "QT-2024-001",
                clientName: "Industrias del Norte SA",
                total: 45000,
                status: "SENT",
                salesRepId,
                items: [
                    { description: "Bomba Hidráulica IND-500", quantity: 2, unitPrice: 20000, total: 40000 },
                    { description: "Kit de Sellos", quantity: 2, unitPrice: 2500, total: 5000 }
                ],
                createdAt: new Date(Date.now() - 86400000 * 2) // 2 days ago
            },
            {
                folio: "QT-2024-002",
                clientName: "ElectroComponentes MX",
                total: 28500,
                status: "DRAFT",
                salesRepId,
                items: [
                    { description: "Sensor de Presión P-200", quantity: 10, unitPrice: 2850, total: 28500 }
                ],
                createdAt: new Date()
            }
        ];

        for (const quote of quotes) {
            await db.collection('quotations').add(quote);
            console.log(`✅ Cotización creada: ${quote.folio}`);
        }

        console.log("🏁 Sembrado completo. Listo para la demo.");
    } catch (error) {
        console.error("❌ Error:", error);
    }
}

seedData();
