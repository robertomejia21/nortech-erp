const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

let rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY || '';

if (rawKey.startsWith('"') && rawKey.endsWith('"')) {
    rawKey = rawKey.slice(1, -1);
}

// 1. Remove comments/headers temporarily to get just the base64 body
let body = rawKey
    .replace(/\\n/g, '') // remove literal \n if any
    .replace(/\n/g, '')  // remove actual newlines
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, ''); // remove all whitespace

// 2. Format body into 64-char lines
const chunkedBody = body.match(/.{1,64}/g).join('\n');

// 3. Reconstruct PEM
const reformattedKey = `-----BEGIN PRIVATE KEY-----\n${chunkedBody}\n-----END PRIVATE KEY-----`;

console.log('--- Reformatted Key Debug ---');
console.log('Format:', reformattedKey.substring(0, 50) + '...');
console.log('Length:', reformattedKey.length);
console.log('-----------------------------');

try {
    const sign = crypto.createSign('SHA256');
    sign.update('some data to sign');
    const signature = sign.sign(reformattedKey, 'base64');
    console.log('✅ Reformatted Key is valid!');

    // If valid, use this logic in verify-users script
} catch (error) {
    console.error('❌ Reformatted Key is STILL invalid:', error.message);
}
