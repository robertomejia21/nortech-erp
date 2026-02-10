import * as admin from "firebase-admin";

// Función para limpiar y obtener las credenciales del entorno
function getCleanedConfig() {
    const projectId = process.env.FIREBASE_SERVICE_ACCOUNT_PROJECT_ID?.trim().replace(/^["']|["']$/g, '').trim();
    const clientEmail = process.env.FIREBASE_SERVICE_ACCOUNT_CLIENT_EMAIL?.trim().replace(/^["']|["']$/g, '').trim();
    let privateKey = process.env.FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY?.trim().replace(/^["']|["']$/g, '').trim();

    if (privateKey) {
        // Reemplazar escapes de texto \n por saltos de línea reales
        privateKey = privateKey.replace(/\\n/g, '\n');
    }

    return { projectId, clientEmail, privateKey };
}

// Inicializar Firebase Admin solo si no está ya inicializado
if (!admin.apps.length) {
    const { projectId, clientEmail, privateKey } = getCleanedConfig();

    if (projectId && clientEmail && privateKey && privateKey.length > 100) {
        try {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId,
                    clientEmail,
                    privateKey,
                }),
            });
            console.log("✅ Firebase Admin inicializado:", projectId);
        } catch (error: any) {
            console.error("❌ Error inicializando Firebase Admin:", error.message);
            // Inicializar con fallback para evitar crashes
            admin.initializeApp({ projectId: "nortech-fallback" });
        }
    } else {
        console.error("❌ Credenciales incompletas:", {
            hasProjectId: !!projectId,
            hasEmail: !!clientEmail,
            keyLength: privateKey?.length || 0
        });
        // Inicializar con fallback
        admin.initializeApp({ projectId: "nortech-fallback" });
    }
}

// Exportar los servicios
export const adminAuth = admin.auth();
export const adminDb = admin.firestore();

// Función de diagnóstico
export function diagnoseAdminConfig() {
    const { projectId, clientEmail, privateKey } = getCleanedConfig();
    console.log("\n==========================================");
    console.log("🔍 DIAGNÓSTICO DE CREDENCIALES");
    console.log("==========================================");
    console.log("Project ID:", projectId || "❌ FALTANTE");
    console.log("Email:", clientEmail || "❌ FALTANTE");
    console.log("Key Format:", privateKey?.includes("PRIVATE KEY") ? "✅ VÁLIDO" : "❌ INVÁLIDO");
    console.log("Key Length:", privateKey?.length || 0);
    console.log("==========================================\n");
}
