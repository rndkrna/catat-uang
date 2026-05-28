import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Get args
const args = process.argv.slice(2);
const phoneNumber = args[0];
const packageType = args[1]; // 'lite', 'starter', 'premium', 'pro', 'free'
const durationDays = args[2] ? parseInt(args[2]) : 30; // default 30 days

if (!phoneNumber || !packageType) {
  console.log('Usage: node admin-upgrade.js <phone_number> <package_type> [duration_in_days]');
  console.log('Example: node admin-upgrade.js 628123456789 premium 30');
  process.exit(1);
}

const dbPath = process.env.SQLITE_PATH || './data/tulisduit.db';
if (!fs.existsSync(dbPath)) {
  console.error(`Database not found at ${dbPath}`);
  process.exit(1);
}

const db = new Database(dbPath);

try {
  // Check if user exists
  const user = db.prepare('SELECT * FROM users WHERE phoneNumber = ?').get(phoneNumber);
  
  if (!user) {
    console.error(`User with phone ${phoneNumber} not found.`);
    process.exit(1);
  }

  // Calculate expiry date
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + durationDays);

  // Update user
  const stmt = db.prepare('UPDATE users SET package = ?, packageExpiresAt = ? WHERE phoneNumber = ?');
  stmt.run(packageType, expiresAt.toISOString(), phoneNumber);

  console.log(`✅ Success! User ${phoneNumber} upgraded to ${packageType} package.`);
  console.log(`📅 Valid until: ${expiresAt.toLocaleString()}`);

} catch (err) {
  console.error('Error updating package:', err.message);
} finally {
  db.close();
}
