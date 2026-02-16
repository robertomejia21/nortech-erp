const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    path.join(process.env.HOME || '', 'Downloads', 'north3-8274b-firebase-adminsdk-fbsvc-a0dfaacefe.json');

const serviceAccount = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function checkAdminRole() {
    console.log('Checking role for admin@nortech.com...');
    try {
        const user = await admin.auth().getUserByEmail('admin@nortech.com');
        const doc = await db.collection('users').doc(user.uid).get();
        if (doc.exists) {
            console.log('User Role in Firestore:', doc.data().role);
            console.log('Full Doc Data:', doc.data());
        } else {
            console.log('User Document not found in Firestore!');
        }
    } catch (error) {
        console.error('Error fetching user:', error);
    }
    process.exit(0);
}

checkAdminRole();
