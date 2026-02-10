import * as admin from 'firebase-admin';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(
    readFileSync('/Users/robertomejia/Downloads/north3-8274b-firebase-adminsdk-fbsvc-a0dfaacefe.json', 'utf8')
);

// Handle default export for ES modules
const adminApp = (admin as any).default || admin;

if (!adminApp.apps || adminApp.apps.length === 0) {
    adminApp.initializeApp({
        credential: adminApp.credential.cert(serviceAccount)
    });
}

const db = adminApp.firestore();

async function verify() {
    console.log('--- Diagnóstico de Firestore ---');

    const email = 'admin@nortech.com';
    console.log(`Buscando usuario por correo: ${email}...`);

    const usersSnap = await db.collection('users').where('email', '==', email).limit(1).get();

    if (usersSnap.empty) {
        console.log('❌ Error: No se encontró ningún usuario con ese correo.');
    } else {
        const userDoc = usersSnap.docs[0];
        console.log(`✅ Usuario encontrado (UID: ${userDoc.id})`);
        console.log('Datos:', userDoc.data());

        if (userDoc.data().role !== 'SUPERADMIN') {
            console.log('⚠️ Aviso: El rol no es SUPERADMIN. Actualizando...');
            await userDoc.ref.update({ role: 'SUPERADMIN' });
            console.log('✅ Rol actualizado a SUPERADMIN.');
        } else {
            console.log('✅ El usuario ya es SUPERADMIN.');
        }
    }

    console.log('\nVerificando colecciones...');
    const collections = ['clients', 'suppliers', 'quotations', 'orders'];
    for (const col of collections) {
        const snap = await db.collection(col).limit(1).get();
        console.log(`- Colección "${col}": ${snap.empty ? 'Vacía' : 'Tiene datos'}`);
    }
}

verify().catch(console.error);
