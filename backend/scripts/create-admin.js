'use strict';
const mysql = require('mysql2/promise');
const crypto = require('node:crypto');
let bcrypt;
try { bcrypt = require('bcryptjs'); } catch { bcrypt = null; }
async function hashPassword(password) {
  if (bcrypt) return bcrypt.hash(password, 12);
  const salt = crypto.randomBytes(16);
  const hash = await new Promise((resolve, reject) => crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (error, value) => error ? reject(error) : resolve(value)));
  return `scrypt$16384$8$1$${salt.toString('hex')}$${hash.toString('hex')}`;
}

async function main() {
  const [, , fullName, rawEmail, password] = process.argv;
  if (!fullName || !rawEmail || !password) {
    console.error('Usage: node scripts/create-admin.js "Name" admin@example.com "password"');
    process.exitCode = 1;
    return;
  }
  if (password.length < 8) throw new Error('Password must be at least 8 characters.');
  const db = await mysql.createConnection({
    host: process.env.VYRO_DB_HOST || '127.0.0.1',
    port: Number(process.env.VYRO_DB_PORT || 3307),
    database: process.env.VYRO_DB_NAME || 'vyro_db',
    user: process.env.VYRO_DB_USER || 'vyro_app',
    password: process.env.VYRO_DB_PASS || '',
    ssl: /^(1|true|yes)$/i.test(process.env.VYRO_DB_SSL || 'false') ? { minVersion: 'TLSv1.2' } : undefined,
    charset: 'utf8mb4',
  });
  try {
    const hash = await hashPassword(password);
    await db.execute('INSERT INTO users (full_name,email,password_hash,is_admin) VALUES (?,?,?,1)', [fullName.trim(), rawEmail.trim().toLowerCase(), hash]);
    console.log(`Admin account created for ${rawEmail.trim().toLowerCase()}.`);
  } finally { await db.end(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
