const fs = require('fs');
const { execSync } = require('child_process');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const lines = envLocal.split('\n');

for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('#')) continue;

    let [key, ...valueParts] = line.split('=');
    let value = valueParts.join('=');
    if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1).replace(/\\n/g, '\n');
    }

    // Skip those that are already there (like API keys if we want, or just update)
    if (key === 'NEXT_PUBLIC_FIREBASE_API_KEY' || key === 'GEMINI_API_KEY') continue;

    console.log(`Adding ${key}...`);
    try {
        // We write the value to a temp file and redirect to stdin
        fs.writeFileSync('.temp_val', value);
        execSync(`npx -y vercel env add ${key} production < .temp_val`, { stdio: 'inherit' });
        execSync(`npx -y vercel env add ${key} preview < .temp_val`, { stdio: 'inherit' });
        execSync(`npx -y vercel env add ${key} development < .temp_val`, { stdio: 'inherit' });
    } catch (e) {
        console.error(`Failed to add ${key}:`, e.message);
    }
}

if (fs.existsSync('.temp_val')) fs.unlinkSync('.temp_val');
console.log("Done adding env vars.");
