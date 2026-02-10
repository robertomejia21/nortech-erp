// Script para resetear la contraseña del admin
require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

// Inicializar Firebase Admin
let rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY || '';
// Limpiar la llave: quitar comillas si las tiene y procesar saltos de línea
if (rawKey.startsWith('"') && rawKey.endsWith('"')) {
    rawKey = rawKey.slice(1, -1);
}
const privateKey = rawKey.replace(/\\n/g, '\n');

const serviceAccount = {
    projectId: process.env.FIREBASE_SERVICE_ACCOUNT_PROJECT_ID,
    clientEmail: process.env.FIREBASE_SERVICE_ACCOUNT_CLIENT_EMAIL,
    privateKey: privateKey
};

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

async function resetAdminPassword() {
    try {
        const email = 'admin@nortech.com';
        const newPassword = 'Admin123!';

        // Buscar el usuario por email
        const user = await admin.auth().getUserByEmail(email);

        // Actualizar la contraseña
        await admin.auth().updateUser(user.uid, {
            password: newPassword
        });

        console.log('✅ Contraseña actualizada exitosamente!');
        console.log('📧 Email:', email);
        console.log('🔑 Nueva contraseña:', newPassword);
        console.log('\nPuedes iniciar sesión con estas credenciales.');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error al resetear contraseña:', error.message);
        process.exit(1);
    }
}

resetAdminPassword();
