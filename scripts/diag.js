const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = JSON.parse(
    fs.readFileSync('/Users/robertomejia/Downloads/north3-8274b-firebase-adminsdk-fbsvc-a0dfaacefe.json', 'utf8')
);

if (admin.apps.length === 0) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function check() {
    console.log('--- Diagnóstico de Usuarios ---');
    const snap = await db.collection('users').get();
    console.log('Total usuarios:', snap.size);
    snap.forEach(doc => {
        console.log(`UID: ${doc.id} | Email: ${doc.data().email} | Role: ${doc.data().role}`);
    });

    console.log('\n--- Diagnóstico de Colecciones ---');
    const collections = ['clients', 'products', 'quotations'];
    for (const col of collections) {
        const cSnap = await db.collection(col).get();
        console.log(`Colección "${col}": ${cSnap.size} documentos.`);
    }
}

check().catch(err => {
    console.error('Error en diagnóstico:', err);
    process.exit(1);
});
