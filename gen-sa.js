const fs = require('fs');
const envLocal = fs.readFileSync('.env.local', 'utf8');
const lines = envLocal.split('\n');
let projectId = "", clientEmail = "", privateKey = "";
for (let line of lines) {
    line = line.trim();
    if (line.startsWith('FIREBASE_SERVICE_ACCOUNT_PROJECT_ID=')) projectId = line.split('=')[1];
    if (line.startsWith('FIREBASE_SERVICE_ACCOUNT_CLIENT_EMAIL=')) clientEmail = line.split('=')[1];
    if (line.startsWith('FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY=')) {
        privateKey = line.substring('FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY='.length);
        if (privateKey.startsWith('"') && privateKey.endsWith('"')) privateKey = privateKey.slice(1, -1).replace(/\\n/g, '\n');
    }
}
fs.writeFileSync('serviceAccountKey.json', JSON.stringify({
    type: "service_account", project_id: projectId, private_key: privateKey, client_email: clientEmail
}, null, 2));
