const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    path.join(process.env.HOME || '', 'Downloads', 'north3-8274b-firebase-adminsdk-fbsvc-a0dfaacefe.json');

const serviceAccount = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

const db = admin.firestore();

async function simulateSalesFlow() {
    console.log('🚀 Starting Backend Sales Flow Simulation...');

    // 1. Create a Lead
    const leadRef = await db.collection('leads').add({
        client: 'Cliente Prueba Script',
        amount: 5000,
        task: 'Script Test Lead',
        priority: 'high',
        status: 'leads',
        salesRepId: 'script-test-user',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`✅ [1/4] Lead Created: ${leadRef.id}`);

    // 2. Simulate Conversion to Quote (Update Lead Status)
    await leadRef.update({
        status: 'quotes',
        progress: 40,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`✅ [2/4] Lead Updated to 'quotes': ${leadRef.id}`);

    // 3. Create Quote Document
    const quoteRef = await db.collection('quotations').add({
        clientId: 'script-client-id', // Simplified
        leadId: leadRef.id,
        salesRepId: 'script-test-user',
        items: [
            { productId: 'prod-123', name: 'Tornillo Industrial Script', quantity: 100, price: 50 }
        ],
        financials: { subtotal: 5000, tax: 800, total: 5800 },
        status: 'DRAFT',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`✅ [3/4] Quote Created: ${quoteRef.id}`);

    // 4. Simulate Approval & Order Creation
    await quoteRef.update({
        status: 'APPROVED',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const orderRef = await db.collection('orders').add({
        quoteId: quoteRef.id,
        clientId: 'script-client-id',
        items: [
            { productId: 'prod-123', name: 'Tornillo Industrial Script', quantity: 100, price: 50 }
        ],
        status: 'PENDING',
        total: 5800,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`✅ [4/4] Order Created from Quote: ${orderRef.id}`);
    console.log('🎉 Backend Sales Flow Verification Successful!');
    process.exit(0);
}

simulateSalesFlow().catch(console.error);
