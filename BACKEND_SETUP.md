# Tulis Duit — Panduan Setup Backend & Meta WhatsApp Cloud API

## 📁 Struktur Proyek

```
catatuang-main/
├── src/
│   ├── frontend/              # React + Vite frontend
│   │   ├── App.tsx            # Landing page & routing
│   │   ├── Login.tsx          # Halaman login
│   │   ├── Dashboard.tsx      # Dashboard utama
│   │   ├── Transactions.tsx   # Riwayat transaksi
│   │   ├── Settings.tsx       # Pengaturan akun
│   │   ├── PilihPaket.tsx     # Pilih & bayar paket
│   │   └── AdminPanel.tsx     # Panel admin (password protected)
│   └── backend/
│       ├── index.ts           # Entry point (Hono server, port 4000)
│       ├── routes/
│       │   ├── auth.ts        # Login, change-password
│       │   ├── transactions.ts # CRUD transaksi
│       │   ├── payments.ts    # Kelola pembayaran paket
│       │   └── whatsapp.ts    # Meta WhatsApp Cloud API webhook
│       ├── services/
│       │   ├── database.ts    # SQLite via better-sqlite3
│       │   └── whatsapp.ts    # Kirim pesan via Meta Graph API
│       └── utils/
│           ├── parser.ts      # Parse pesan WA → transaksi
│           └── password.ts    # Generate & format nomor HP
├── data/                      # File database SQLite (auto-created)
├── .env.example               # Template variabel environment
└── docker-compose.yml
```

---

## 🚀 Cara Menjalankan (Lokal)

### 1. Install dependensi
```bash
npm install
```

### 2. Buat file `.env`
```bash
cp .env.example .env
```
Lalu isi nilai-nilainya (lihat bagian **Konfigurasi .env** di bawah).

### 3. Jalankan backend
```bash
npm run backend
# Backend berjalan di http://localhost:4000
```

### 4. Jalankan frontend (tab/terminal baru)
```bash
npm run dev
# Frontend berjalan di http://localhost:3000
```

---

## ⚙️ Konfigurasi `.env`

```env
# URL publik aplikasi (tanpa trailing slash)
APP_URL="http://localhost:3000"

# Path database SQLite
SQLITE_PATH="./data/tulisduit.db"

# Meta WhatsApp Cloud API
WHATSAPP_PHONE_NUMBER_ID="1234567890123456"
WHATSAPP_ACCESS_TOKEN="EAAxxxxxxxxxxxxxxx"
WHATSAPP_VERIFY_TOKEN="string_rahasia_bebas_kamu_buat_sendiri"

# Gemini AI (opsional, untuk scan struk)
GEMINI_API_KEY="MY_GEMINI_API_KEY"
```

---

## 📡 Setup Meta WhatsApp Cloud API

### Langkah 1 — Buat Meta App
1. Buka [https://developers.facebook.com/apps/](https://developers.facebook.com/apps/)
2. Klik **Create App** → pilih **Business**
3. Masukkan nama app, misal: `Tulis Duit`

### Langkah 2 — Tambahkan WhatsApp ke App
1. Di dashboard app, klik **Add Product** → cari **WhatsApp** → klik **Set Up**
2. Ikuti panduan untuk menambahkan nomor WhatsApp bisnis

### Langkah 3 — Ambil Credentials
Di menu **WhatsApp > API Setup**:
- **Phone Number ID** → salin ke `WHATSAPP_PHONE_NUMBER_ID`
- **Temporary Access Token** → salin ke `WHATSAPP_ACCESS_TOKEN`
  > Untuk production, buat **Permanent Token** via System User di Business Manager

### Langkah 4 — Setup Webhook
1. Di menu **WhatsApp > Configuration**, klik **Edit** pada Webhook
2. Isi:
   - **Callback URL**: `https://domain-kamu.com/api/whatsapp/webhook`
   - **Verify Token**: isi dengan nilai `WHATSAPP_VERIFY_TOKEN` di `.env`-mu
3. Klik **Verify and Save**
4. Subscribe ke field: **messages**

> **💡 Untuk testing lokal**, gunakan [ngrok](https://ngrok.com/):
> ```bash
> ngrok http 4000
> # Gunakan URL ngrok sebagai Callback URL
> ```

### Langkah 5 — Test Kirim Pesan
Kirim pesan dari nomor WA kamu ke nomor bot → sistem akan auto-registrasi dan balas otomatis.

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Keterangan |
|--------|----------|-----------|
| POST | `/api/auth/login` | Login dengan nomor WA + password |
| POST | `/api/auth/change-password` | Ganti password (butuh token) |

### Transaksi
| Method | Endpoint | Keterangan |
|--------|----------|-----------|
| GET | `/api/transactions` | Ambil semua transaksi + saldo (butuh token) |
| POST | `/api/transactions` | Buat transaksi baru (butuh token) |
| DELETE | `/api/transactions/:id` | Hapus transaksi (butuh token) |

### Pembayaran
| Method | Endpoint | Keterangan |
|--------|----------|-----------|
| POST | `/api/payments` | Buat request upgrade paket |
| GET | `/api/payments` | Lihat semua pending (admin) |
| POST | `/api/payments/:id/approve` | Approve pembayaran (admin) |

### WhatsApp
| Method | Endpoint | Keterangan |
|--------|----------|-----------|
| POST | `/api/whatsapp/webhook` | Terima pesan dari Meta |
| GET | `/api/whatsapp/webhook` | Verifikasi webhook oleh Meta |

---

## 💬 Perintah Bot WhatsApp

| Pesan User | Fungsi |
|------------|--------|
| `bantuan` | Tampilkan panduan |
| `saldo` | Cek saldo saat ini |
| `harian` / `rekap` | Rekap transaksi hari ini |
| `mingguan` | Rekap 7 hari terakhir |
| `bulanan` | Rekap bulan ini |
| `limit` / `kuota` | Cek sisa kuota bulan ini |
| `upgrade` | Lihat paket berbayar |
| `saldo awal 1jt` | Set saldo awal |
| `reset saldo` | Reset saldo ke 0 |
| `50k makan siang` | Catat pengeluaran Rp 50.000 |
| `+2jt gaji` | Catat pemasukan Rp 2.000.000 |

---

## 🔐 Admin Panel

Akses: `http://localhost:3000/admin-dashboard`

Password default: `admin@tulisduit2025`

> **Ganti password** di baris 10 file `src/frontend/AdminPanel.tsx`:
> ```ts
> const ADMIN_PASSWORD = 'ganti_dengan_password_kamu';
> ```

---

## 🐳 Deploy dengan Docker

```bash
# Build + jalankan
docker-compose up -d

# Lihat log
docker-compose logs -f
```

Pastikan variabel di `.env` sudah menggunakan URL production, bukan `localhost`.
