# Implementasi Pembayaran Paket (Cara Paling Gampang)

Menurut saya, cara **paling gampang, cepat, dan aman** untuk aplikasi Anda saat ini adalah menggunakan **Konfirmasi Manual via WhatsApp**. 

Kenapa ini paling gampang?
1. **Tidak Pusing Verifikasi**: Anda tidak perlu mendaftar ke Payment Gateway (seperti Midtrans/Xendit) yang butuh verifikasi KTP, NPWP, dan rekening bank.
2. **Tidak Ada Potongan**: 100% uang langsung masuk ke rekening Anda tanpa dipotong biaya admin Payment Gateway.
3. **Cocok dengan Tema Aplikasi**: Karena aplikasi ini bernama "Tulis Duit Via WhatsApp", user sudah terbiasa berinteraksi dengan nomor WhatsApp Anda.

---

## Alur Kerja (Workflow) yang Akan Dibuat:

1. **Di Halaman Pilih Paket**:
   Ketika user menekan tombol "Berlangganan" pada salah satu paket, mereka akan diarahkan langsung ke WhatsApp Admin dengan format pesan otomatis.
   *Contoh Pesan*: `"Halo Admin, saya ingin berlangganan Paket Lite (Rp 15.000). Nomor akun saya: 08123456789. Ini bukti transfernya..."*

2. **Proses Admin (Anda)**:
   Anda menerima chat tersebut, mengecek mutasi rekening/e-wallet Anda. Jika uang sudah masuk, Anda tinggal mengubah status akun mereka di database.

3. **Perubahan Database**:
   Kita akan menambahkan kolom baru di tabel `users` pada file `database.ts`:
   - `package` (tipe paket: 'free', 'lite', 'starter', 'premium', dll)
   - `packageExpiresAt` (tanggal kedaluwarsa paket)

4. **Update Halaman Dashboard**:
   Dashboard akan mengecek paket user saat ini.
   - Jika paket = `free`, tampilannya biasa saja.
   - Jika paket = `lite` / `premium`, akan muncul *Badge* 👑 Premium dan fitur-fitur yang sebelumnya terkunci menjadi terbuka.

---

## > [!IMPORTANT]
## User Review Required

Apakah Anda setuju dengan alur **Pembayaran Manual via WhatsApp** ini? 

Jika Anda setuju, saya akan langsung mengeksekusinya dengan langkah-langkah berikut:
1. Menambahkan kolom `package` dan `packageExpiresAt` ke database SQLite.
2. Mengubah tombol "Berlangganan" di halaman `PilihPaket.tsx` agar mengarahkan user ke WhatsApp dengan format pesanan.
3. Mengupdate Dashboard agar fitur berubah sesuai paket yang dibeli.
4. Membuat script kecil/API rahasia agar Anda (sebagai admin) gampang mengaktifkan paket user tanpa harus repot buka file database.

Silakan berikan persetujuan Anda atau koreksi jika ada yang ingin diubah!
