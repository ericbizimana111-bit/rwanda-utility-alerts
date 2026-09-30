/**
 * Creates an administrator, or promotes an existing account to admin.
 *
 *   npm run create-admin -- <phone> <password> [firstName] [lastName]
 *   npm run create-admin -- 0788123456 "a-strong-password" Aline Uwase
 *
 * Reads the database settings from apps/api/.env.
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
        const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
        if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2];
    }
}

function normalizeRwandaPhone(input) {
    const match = /^(?:\+?250|0)?(7[2389]\d{7})$/.exec(String(input || '').replace(/[\s\-().]/g, ''));
    return match ? `0${match[1]}` : null;
}

async function main() {
    const [rawPhone, password, firstName = 'Admin', lastName = 'User'] = process.argv.slice(2);
    const phone = normalizeRwandaPhone(rawPhone);

    if (!phone || !password) {
        console.error('Usage: npm run create-admin -- <rwandan-phone> <password> [firstName] [lastName]');
        process.exit(1);
    }
    if (password.length < 8) {
        console.error('Use a password of at least 8 characters for admin accounts.');
        process.exit(1);
    }

    const client = new Client({
        host: process.env.DATABASE_HOST || 'localhost',
        port: Number(process.env.DATABASE_PORT || 5433),
        user: process.env.DATABASE_USER || 'utility_admin',
        password: process.env.DATABASE_PASSWORD || 'utility_password',
        database: process.env.DATABASE_NAME || 'utility_alerts',
    });
    await client.connect();

    try {
        const hash = await bcrypt.hash(password, 10);
        const existing = await client.query('SELECT id FROM users WHERE phone = $1', [phone]);

        if (existing.rowCount) {
            await client.query(`UPDATE users SET role = 'ADMIN', password = $1, "updatedAt" = now() WHERE phone = $2`, [hash, phone]);
            console.log(`Promoted ${phone} to ADMIN and updated the password.`);
        } else {
            await client.query(
                `INSERT INTO users (phone, "firstName", "lastName", password, role, "notificationsEnabled")
                 VALUES ($1, $2, $3, $4, 'ADMIN', true)`,
                [phone, firstName, lastName, hash],
            );
            console.log(`Created ADMIN account ${phone}.`);
        }
    } finally {
        await client.end();
    }
}

main().catch((error) => {
    console.error(`Failed: ${error.message}`);
    console.error('Is the API database running, and has the API been started once to create the tables?');
    process.exit(1);
});
