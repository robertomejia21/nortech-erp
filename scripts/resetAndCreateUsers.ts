/**
 * Script para resetear y crear usuarios para Nortech ERP
 * 
 * Ejecutar con: npx ts-node --esm scripts/resetAndCreateUsers.ts
 */

import { initializeApp, cert } from 'firebase-admin/app';
import type { ServiceAccount } from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Configurar dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env.local') });

// Buscar credenciales
const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    path.join(process.env.HOME || '', 'Downloads', 'north3-8274b-firebase-adminsdk-fbsvc-a0dfaacefe.json');

if (!fs.existsSync(credentialsPath)) {
    console.error('❌ No se encontró el archivo de credenciales de Firebase Admin SDK');
    console.error('   Esperado en:', credentialsPath);
    process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(credentialsPath, 'utf8')) as ServiceAccount;

// Inicializar Firebase Admin
initializeApp({
    credential: cert(serviceAccount),
});

const auth = getAuth();
const db = getFirestore();

// Nuevos usuarios a crear
const newUsers = [
    {
        email: 'robertoregueira12@gmail.com',
        displayName: 'Roberto Regueira',
        role: 'WAREHOUSE',
        phone: '+525527422128',
        password: 'NortechWarehouse2024!'
    },
    {
        email: 'seryocu7@gmail.com',
        displayName: 'Sergio Yocupicio',
        role: 'WAREHOUSE',
        phone: '+526861953804',
        password: 'NortechWarehouse2024!'
    },
    {
        email: 'smarquez@northsupplierco.com',
        displayName: 'Sergio Marquez',
        role: 'ADMIN',
        phone: '+526861345973',
        password: 'NortechAdmin2024!'
    },
    {
        email: 'maguirre@northsupplierco.com',
        displayName: 'Miguel Aguirre',
        role: 'SALES',
        phone: '+526863640299',
        password: 'NortechSales2024!'
    },
    {
        email: 'service@northsupplierco.com',
        displayName: 'Sofia Reséndiz',
        role: 'ADMIN',
        phone: '+526862220781',
        password: 'NortechSales2024!'
    },
    {
        email: 'administracionnorth@northsupplierco.com',
        displayName: 'Fernanda Lopez',
        role: 'FINANCE',
        phone: '+526861145768',
        password: 'NortechFinance2024!'
    }
];

async function deleteAllUsers() {
    console.log('🗑️  Eliminando todos los usuarios existentes...');
    try {
        const listUsersResult = await auth.listUsers(1000);
        const uids = listUsersResult.users.map(user => user.uid);

        if (uids.length > 0) {
            await auth.deleteUsers(uids);
            console.log(`✅ ${uids.length} usuarios eliminados exitosamente.`);

            // También limpiar la colección de usuarios en Firestore para evitar huérfanos
            console.log('🗑️  Limpiando colección de usuarios en Firestore...');
            const usersRef = db.collection('users');
            const snapshot = await usersRef.get();
            if (!snapshot.empty) {
                const batch = db.batch();
                snapshot.docs.forEach(doc => {
                    batch.delete(doc.ref);
                });
                await batch.commit();
                console.log(`✅ ${snapshot.size} documentos de usuario eliminados de Firestore.`);
            }
        } else {
            console.log('ℹ️  No hay usuarios para eliminar.');
        }
    } catch (error: any) {
        console.error('❌ Error eliminando usuarios:', error);
        throw error;
    }
}

async function createNewUsers() {
    console.log('🚀 Creando nuevos usuarios...');

    for (const userData of newUsers) {
        try {
            // Crear en Authentication
            const userRecord = await auth.createUser({
                email: userData.email,
                password: userData.password,
                displayName: userData.displayName,
                phoneNumber: userData.phone,
                emailVerified: true,
            });

            // Crear en Firestore con el rol
            await db.collection('users').doc(userRecord.uid).set({
                email: userData.email,
                displayName: userData.displayName,
                role: userData.role,
                phoneNumber: userData.phone,
                createdAt: new Date(),
                createdBy: 'system-reset-script',
                isActive: true
            });

            console.log(`✅ Usuario creado: ${userData.displayName} (${userData.role}) - ${userData.email}`);
        } catch (error: any) {
            console.error(`❌ Error creando ${userData.displayName}:`, error.message);
        }
    }
}

async function main() {
    console.log('\n⚠️  ADVERTENCIA: Este script borrará TODOS los usuarios y creará nuevos.\n');
    console.log('Inicio en 3 segundos...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    try {
        await deleteAllUsers();
        await createNewUsers();

        console.log('\n✨ Proceso finalizado exitosamente ✨\n');
        console.log('Credenciales Generadas:');
        newUsers.forEach(u => {
            console.log(`User: ${u.email} | Pass: ${u.password} | Role: ${u.role}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error fatal:', error);
        process.exit(1);
    }
}

main();
