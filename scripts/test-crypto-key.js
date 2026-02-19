const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

let rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY || '';

// Clean up key (same logic as before)
if (rawKey.startsWith('"') && rawKey.endsWith('"')) {
    rawKey = rawKey.slice(1, -1);
}
const privateKey = rawKey.replace(/\\n/g, '\n');

console.log('Testing key validity with crypto module...');

try {
    const sign = crypto.createSign('SHA256');
    sign.update('some data to sign');
    const signature = sign.sign(privateKey, 'base64');
    console.log('✅ Key is valid! Signed data successfully.');
    console.log('Signature length:', signature.length);
} catch (error) {
    console.error('❌ Key is invalid according to crypto module:', error.message);
}
