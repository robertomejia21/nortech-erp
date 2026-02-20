const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function check() {
    const snap = await db.collection("clients").get();
    console.log("Clients count:", snap.size);
    snap.forEach(doc => console.log(doc.id, doc.data()));
    process.exit();
}
check();
