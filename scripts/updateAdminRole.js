
const admin = require('firebase-admin');
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');

if (!serviceAccount.project_id) {
    console.error('Error: FIREBASE_SERVICE_ACCOUNT_KEY is missing or invalid.');
    process.exit(1);
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function updateAdminRole() {
    const email = 'admin@nortech.com';
    console.log(`Looking up user: ${email}...`);

    try {
        const user = await admin.auth().getUserByEmail(email);
        console.log(`Found User UID: ${user.uid}`);

        const userRef = db.collection('users').doc(user.uid);
        const doc = await userRef.get();

        if (doc.exists) {
            console.log(`Current Role: ${doc.data().role}`);
            await userRef.update({ role: 'SUPERADMIN' });
            console.log(`✅ Role successfully updated to 'SUPERADMIN' for ${email}`);
        } else {
            console.log('User Document not found in Firestore! Creating one...');
            await userRef.set({
                email: email,
                role: 'SUPERADMIN',
                createdAt: new Date()
            });
            console.log(`✅ User document created with 'SUPERADMIN' role.`);
        }
    } catch (error) {
        console.error('Error updating user role:', error);
    }
    process.exit(0);
}

updateAdminRole();
