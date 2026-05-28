#!/usr/bin/env node
/**
 * start-dev.js
 * 
 * Script helper untuk menjalankan backend + ngrok sekaligus
 * dan otomatis update APP_URL di .env
 * 
 * Cara pakai:
 *   node start-dev.js
 */

import { spawn, exec } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '.env');

// ── Pastikan .env ada ──────────────────────────────────────────────────────
if (!existsSync(envPath)) {
  if (existsSync(join(__dirname, '.env.example'))) {
    const example = readFileSync(join(__dirname, '.env.example'), 'utf-8');
    writeFileSync(envPath, example);
    console.log('✅ File .env dibuat dari .env.example');
    console.log('⚠️  Isi dulu WHATSAPP_PHONE_NUMBER_ID dan WHATSAPP_ACCESS_TOKEN di .env!\n');
  }
}

// ── Jalankan backend ──────────────────────────────────────────────────────
console.log('🚀 Memulai backend di port 4000...');
const backend = spawn('npm', ['run', 'backend'], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname,
});
backend.on('error', (err) => console.error('❌ Gagal menjalankan backend:', err));

// ── Jalankan frontend ──────────────────────────────────────────────────────
console.log('🚀 Memulai frontend (Vite) di port 3000...');
const frontend = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname,
});
frontend.on('error', (err) => console.error('❌ Gagal menjalankan frontend:', err));

// Tunggu backend siap, lalu jalankan ngrok
setTimeout(() => {
  console.log('\n🌐 Memulai ngrok tunnel ke port 4000...');
  const ngrok = spawn('ngrok', ['http', '4000', '--log=stdout'], {
    shell: true,
    cwd: __dirname,
  });

  let urlFound = false;

  ngrok.stdout.on('data', (data) => {
    const text = data.toString();
    
    // Tangkap URL ngrok dari log
    const match = text.match(/url=(https:\/\/[^\s]+)/);
    if (match && !urlFound) {
      urlFound = true;
      const ngrokUrl = match[1];
      
      console.log('\n' + '═'.repeat(60));
      console.log(`✅ ngrok aktif: ${ngrokUrl}`);
      console.log('═'.repeat(60));
      console.log('\n📋 Salin info berikut ke Meta Dashboard:');
      console.log(`   Callback URL : ${ngrokUrl}/api/whatsapp/webhook`);
      console.log('\n📝 Updating APP_URL di .env...');
      
      // Update APP_URL di .env
      try {
        let envContent = readFileSync(envPath, 'utf-8');
        if (envContent.includes('APP_URL=')) {
          envContent = envContent.replace(/APP_URL=.*/g, `APP_URL="${ngrokUrl}"`);
        } else {
          envContent += `\nAPP_URL="${ngrokUrl}"\n`;
        }
        writeFileSync(envPath, envContent);
        console.log(`✅ APP_URL di .env diupdate ke: ${ngrokUrl}`);
      } catch (e) {
        console.error('⚠️  Gagal update .env:', e.message);
      }
      
      console.log('\n💡 Langkah selanjutnya:');
      console.log('   1. Buka: https://developers.facebook.com/apps/');
      console.log('   2. WhatsApp > Configuration > Webhook > Edit');
      console.log(`   3. Callback URL: ${ngrokUrl}/api/whatsapp/webhook`);
      console.log('   4. Verify Token: (sesuai WHATSAPP_VERIFY_TOKEN di .env)');
      console.log('   5. Subscribe ke field: messages');
      console.log('\n⚠️  URL ini berubah setiap kali ngrok direstart!');
      console.log('    Ulangi langkah di atas jika restart.\n');
    }
  });

  ngrok.stderr.on('data', (data) => {
    const text = data.toString();
    if (text.includes('ERR_NGROK')) {
      console.error('❌ Error ngrok:', text);
      if (text.includes('authentication')) {
        console.log('\n💡 Daftar akun gratis di https://ngrok.com dan jalankan:');
        console.log('   ngrok config add-authtoken <token_kamu>');
      }
    }
  });

  ngrok.on('error', (err) => {
    console.error('❌ ngrok tidak ditemukan. Install dulu:');
    console.log('   winget install ngrok.ngrok');
    console.log('   atau download dari: https://ngrok.com/download');
  });

}, 3000); // Tunggu 3 detik sebelum ngrok dijalankan

process.on('SIGINT', () => {
  console.log('\n⛔ Menghentikan semua proses...');
  backend.kill();
  if (typeof frontend !== 'undefined') frontend.kill();
  process.exit(0);
});
