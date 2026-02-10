const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const dotenv = require('dotenv');
const path = require('path');

// Cargar el .env.local manualmente para probar
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const clean = (str) => {
    if (!str) return "";
    return str.replace(/^["']|["']$/g, '').trim();
};

const projectId = clean(process.env.FIREBASE_SERVICE_ACCOUNT_PROJECT_ID);
const clientEmail = clean(process.env.FIREBASE_SERVICE_ACCOUNT_CLIENT_EMAIL);
let privateKey = clean(process.env.FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY);
if (privateKey.includes('\\n')) {
    privateKey = privateKey.split('\\n').join('\n');
}

console.log("--- TEST DE CREDENCIALES ---");
console.log("Project:", projectId);
console.log("Email:", clientEmail);
console.log("Key Length:", privateKey.length);
console.log("Key Valid Start:", privateKey.startsWith("-----BEGIN PRIVATE KEY-----"));
console.log("Key Valid End:", privateKey.endsWith("-----END PRIVATE KEY-----"));

try {
    const app = initializeApp({
        credential: cert({
            projectId,
            clientEmail,
            privateKey,
        }),
    }, "tester-app");

    getAuth(app).createCustomToken("test-uid")
        .then(() => console.log("✅ ÉXITO: Las credenciales funcionan correctamente."))
        .catch(err => {
            console.error("❌ ERROR DE AUTENTICACIÓN:", err.message);
            if (err.message.includes("default credentials")) {
                console.log("💡 El error sugiere que cert() no recibió un formato de llave válido.");
            }
        });
} catch (error) {
    console.error("❌ ERROR AL INICIALIZAR APP:", error.message);
}
