/**
 * Script para crear usuarios de prueba en Firebase
 * 
 * Ejecutar con: node scripts/createUsers.js
 * 
 * IMPORTANTE: Este script requiere las credenciales de Firebase Admin SDK
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Buscar el archivo de credenciales
const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    path.join(process.env.HOME || '', 'Downloads', 'north3-8274b-firebase-adminsdk-fbsvc-a0dfaacefe.json');

if (!fs.existsSync(credentialsPath)) {
    console.error('❌ No se encontró el archivo de credenciales de Firebase Admin SDK');
    console.error('   Esperado en:', credentialsPath);
    console.error('   Configura GOOGLE_APPLICATION_CREDENTIALS o coloca el archivo en ~/Downloads/');
    process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

// Inicializar Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const auth = admin.auth();
const db = admin.firestore();

// Usuarios a crear
const usersToCreate = [
    {
        email: 'admin@nortech.com',
        password: 'NortechAdmin2024!',
        displayName: 'Administrador Principal',
        role: 'SUPERADMIN'
    },
    {
        email: 'finanzas@nortech.com',
        password: 'NortechFinance2024!',
        displayName: 'Carlos Finanzas',
        role: 'ADMIN'
    },
    {
        email: 'vendedor1@nortech.com',
        password: 'NortechSales2024!',
        displayName: 'María García',
        role: 'SALES'
    },
    {
        email: 'vendedor2@nortech.com',
        password: 'NortechSales2024!',
        displayName: 'Juan Pérez',
        role: 'SALES'
    },
    {
        email: 'vendedor3@nortech.com',
        password: 'NortechSales2024!',
        displayName: 'Ana López',
        role: 'SALES'
    },
    {
        email: 'almacen@nortech.com',
        password: 'NortechWarehouse2024!',
        displayName: 'Roberto Almacén',
        role: 'WAREHOUSE'
    },
    {
        email: 'contabilidad@nortech.com',
        password: 'NortechFinance2024!',
        displayName: 'Laura Contabilidad',
        role: 'FINANCE'
    },
];

async function createUser(userData) {
    try {
        let uid;

        // Verificar si el usuario ya existe
        try {
            const existingUser = await auth.getUserByEmail(userData.email);
            console.log(`⚠️  Usuario ya existe: ${userData.email} (${existingUser.uid})`);
            uid = existingUser.uid;
        } catch (error) {
            if (error.code !== 'auth/user-not-found') throw error;

            // Crear usuario en Firebase Auth
            const userRecord = await auth.createUser({
                email: userData.email,
                password: userData.password,
                displayName: userData.displayName,
                emailVerified: true,
            });
            uid = userRecord.uid;
            console.log(`✅ Usuario creado: ${userData.email} (${userData.role})`);
        }

        // Crear/actualizar documento en Firestore con el rol
        await db.collection('users').doc(uid).set({
            email: userData.email,
            displayName: userData.displayName,
            role: userData.role,
            updatedAt: new Date(),
        }, { merge: true });

        return uid;
    } catch (error) {
        console.error(`❌ Error creando ${userData.email}:`, error.message);
        return null;
    }
}

async function main() {
    console.log('\n🚀 Iniciando creación de usuarios para Nortech ERP...\n');
    console.log('═'.repeat(50));

    for (const user of usersToCreate) {
        await createUser(user);
    }

    console.log('═'.repeat(50));
    console.log('\n✅ Proceso completado!\n');
    console.log('📋 Credenciales de acceso:');
    console.log('─'.repeat(50));

    for (const user of usersToCreate) {
        console.log(`   ${user.role.padEnd(12)} | ${user.email.padEnd(25)} | ${user.password}`);
    }

    console.log('─'.repeat(50));
    console.log('\n⚠️  Recuerda cambiar las contraseñas en producción!\n');

    process.exit(0);
}

main().catch(console.error);
