import 'dotenv/config';
import { db } from './src/backend/services/database.js';

async function run() {
  await db.connect();
  console.log('Database connected.');
  
  const users = await db.getAllUsers();
  console.log('Users count:', users.length);
  console.log('Users list:', users.map(u => ({ id: u.id, phone: u.phoneNumber, package: u.package })));

  for (const user of users) {
    const txs = await db.getTransactions(user.id);
    console.log(`User ${user.phoneNumber} transactions count:`, txs.length);
    console.log(`Last 5 transactions for ${user.phoneNumber}:`, txs.slice(0, 5));
  }
}

run().catch(console.error);
