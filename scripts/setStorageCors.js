const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const serviceAccount = require(path.join(process.env.HOME, 'Downloads', 'north3-8274b-firebase-adminsdk-fbsvc-a0dfaacefe.json'));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: "north3-8274b.firebasestorage.app"
    });
}

async function setCors() {
    console.log("Setting CORS rules for Firebase Storage...");
    const bucket = admin.storage().bucket();

    // Set CORS config
    const corsConfig = [
        {
            origin: ["*"], // Vercel domains
            method: ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"],
            responseHeader: ["Content-Type", "Authorization", "Content-Length", "User-Agent", "x-goog-resumable"],
            maxAgeSeconds: 3600
        }
    ];

    await bucket.setCorsConfiguration(corsConfig);
    console.log("CORS Configuration successfully updated.");
}

async function updateSecurityRules() {
    console.log("Setting Security Rules for Firebase Storage...");

    // Unfortunately, Firebase Admin SDK natively doesn't support setting Storage Security rules easily without 
    // the securityRules() module for Firebase Rules API (which requires the googleapis library).
    // The easiest fallback is for the user to just copy-paste the rules in the Firebase Console UI.
}

setCors().catch(console.error);
