import test from 'node:test';
import assert from 'node:assert/strict';
import { parseTransactionMessage } from './parser.js';

test('parseTransactionMessage parses various Indonesian nominal formats correctly', async () => {
  // Test expense with 'k'
  const res1 = await parseTransactionMessage('kopi 10k');
  assert.ok(res1);
  assert.equal(res1.length, 1);
  assert.equal(res1[0].amount, 10000);
  assert.equal(res1[0].type, 'expense');

  // Test expense with 'rb' (Indonesian ribu)
  const res2 = await parseTransactionMessage('kopi 10rb');
  assert.ok(res2);
  assert.equal(res2.length, 1);
  assert.equal(res2[0].amount, 10000); // This currently fails (returns 10)
  assert.equal(res2[0].type, 'expense');

  // Test expense with 'ribu'
  const res3 = await parseTransactionMessage('makan siang 15ribu');
  assert.ok(res3);
  assert.equal(res3.length, 1);
  assert.equal(res3[0].amount, 15000); // This currently fails (returns 15)
  assert.equal(res3[0].type, 'expense');

  // Test income with 'jt'
  const res4 = await parseTransactionMessage('+5jt gaji');
  assert.ok(res4);
  assert.equal(res4.length, 1);
  assert.equal(res4[0].amount, 5000000);
  assert.equal(res4[0].type, 'income');

  // Test income with 'juta'
  const res5 = await parseTransactionMessage('+1.5juta bonus');
  assert.ok(res5);
  assert.equal(res5.length, 1);
  assert.equal(res5[0].amount, 1500000);
  assert.equal(res5[0].type, 'income');

  // Test plain number with dot thousands separator
  const res6 = await parseTransactionMessage('makan 10.000');
  assert.ok(res6);
  assert.equal(res6.length, 1);
  assert.equal(res6[0].amount, 10000);

  // Test plain number with comma thousands separator
  const res7 = await parseTransactionMessage('makan 10,000');
  assert.ok(res7);
  assert.equal(res7.length, 1);
  assert.equal(res7[0].amount, 10000);

  // Test decimal with comma and suffix
  const res8 = await parseTransactionMessage('bensin 12,5k');
  assert.ok(res8);
  assert.equal(res8.length, 1);
  assert.equal(res8[0].amount, 12500);
});
