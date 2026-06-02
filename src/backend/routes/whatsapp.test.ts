import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';

import whatsappRouter from './whatsapp.js';
import { db } from '../services/database.js';

test('POST /api/whatsapp/webhook tidak crash saat menghitung kuota (await db.getTransactions)', async (t) => {
  // Set mock env vars
  const origEnv = {
    WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
    WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN,
  };
  process.env.WHATSAPP_PHONE_NUMBER_ID = '123456';
  process.env.WHATSAPP_ACCESS_TOKEN = 'mock_token';

  // Mock axios
  const originalPost = axios.post;
  const originalGet = axios.get;
  axios.post = async () => ({ data: { success: true } }) as any;
  axios.get = async () => ({ data: { display_phone_number: '628111111111', verified_name: 'Mock' } }) as any;

  // Patch db methods untuk test (hindari akses Supabase beneran)
  const original = {
    getUserByPhoneNumber: db.getUserByPhoneNumber.bind(db),
    getTransactions: db.getTransactions.bind(db),
    getBalance: db.getBalance.bind(db),
  };

  db.getUserByPhoneNumber = async () =>
    ({
      id: 1,
      phoneNumber: '628111111111',
      password: 'x',
      name: 'User',
      package: 'free',
      createdAt: new Date().toISOString(),
      packageExpiresAt: null,
      partnerPhone: null,
    }) as any;

  db.getTransactions = async () => [];
  db.getBalance = async () => 0;

  t.after(() => {
    db.getUserByPhoneNumber = original.getUserByPhoneNumber as any;
    db.getTransactions = original.getTransactions as any;
    db.getBalance = original.getBalance as any;
    axios.post = originalPost;
    axios.get = originalGet;
    process.env.WHATSAPP_PHONE_NUMBER_ID = origEnv.WHATSAPP_PHONE_NUMBER_ID;
    process.env.WHATSAPP_ACCESS_TOKEN = origEnv.WHATSAPP_ACCESS_TOKEN;
  });

  const payload = {
    object: 'whatsapp_business_account',
    entry: [
      {
        changes: [
          {
            value: {
              messages: [
                {
                  from: '628111111111',
                  type: 'text',
                  text: { body: 'saldo' },
                },
              ],
            },
          },
        ],
      },
    ],
  };

  const res = await whatsappRouter.request('http://localhost/webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  assert.equal(res.status, 200);

  const json = await res.json();
  assert.equal(json.status, 'saldo_sent');
});
