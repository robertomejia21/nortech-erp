const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const lines = envLocal.split('\n');

let projectId = "";
let clientEmail = "";
let privateKey = "";

for (let line of lines) {
    line = line.trim();
    if (line.startsWith('FIREBASE_SERVICE_ACCOUNT_PROJECT_ID=')) projectId = line.split('=')[1];
    if (line.startsWith('FIREBASE_SERVICE_ACCOUNT_CLIENT_EMAIL=')) clientEmail = line.split('=')[1];
    if (line.startsWith('FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY=')) {
        privateKey = line.substring('FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY='.length);
        if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
            privateKey = privateKey.slice(1, -1).replace(/\\n/g, '\n');
        }
    }
}

const serviceAccount = {
    type: "service_account",
    project_id: projectId,
    private_key_id: "some_id",
    private_key: privateKey,
    client_email: clientEmail,
    client_id: "some_id",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(clientEmail)}`
};

fs.writeFileSync('serviceAccountKey.json', JSON.stringify(serviceAccount, null, 2));
console.log("Service account generated.");
