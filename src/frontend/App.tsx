import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CheckCircle, Phone, MessageCircle, AlertCircle, AppWindow, Mail, MapPin } from 'lucide-react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Login from './Login';
import Syarat from './Syarat';
import Dashboard from './Dashboard';
import Transactions from './Transactions';
import PilihPaket from './PilihPaket';
import Settings from './Settings';
import MenungguKonfirmasi from './MenungguKonfirmasi';
import AdminPanel from './AdminPanel';
import PaketDashboard from './PaketDashboard';

// User badge component (top)
const UserBadge = () => (
  <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-600 px-4 py-2 rounded-full text-sm font-medium mb-6">
    <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
    1.000+ user terdaftar
  </div>
);

// Highlighted text component
const Highlight = ({ children }: { children: React.ReactNode | string }) => (
  <span className="bg-orange-200 px-1">{children}</span>
);

// Chat message bubble component
const ChatBubble = ({ 
  message, 
  isExpense = true 
}: { 
  message: string; 
  isExpense?: boolean;
}) => (
  <div className="flex justify-end mb-4">
    <div className="bg-[#dcf8c6] text-gray-800 px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-xs text-sm">
      {message}
    </div>
  </div>
);

// Response card component
const ResponseCard = ({
  type,
  category,
  amount,
  balance,
  isNegative = false
}: {
  type: string;
  category: string;
  amount: string;
  balance: string;
  isNegative?: boolean;
}) => (
  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4 ml-4 max-w-xs">
    <div className="flex items-center gap-2 text-orange-500 mb-2">
      <CheckCircle size={16} />
      <span className="text-sm font-semibold">Tercatat!</span>
    </div>
    <div className="space-y-1 text-sm text-gray-600">
      <p>{type}: <span className="font-medium text-gray-900">{amount}</span></p>
      <p>Kategori: <span className="font-medium text-gray-900">{category}</span></p>
      <p>Saldo {type === 'Pengeluaran' ? 'hari ini' : 'bulan ini'}: 
        <span className={`font-medium ${isNegative ? 'text-red-500' : 'text-orange-500'}`}>
          {balance}
        </span>
      </p>
    </div>
  </div>
);

// Testimonial notification component with rotating testimonials
const testimonials = [
  { name: "Yulia", initial: "Y", package: "Lite", days: 2 },
  { name: "Budi", initial: "B", package: "Starter", days: 1 },
  { name: "Anisa", initial: "A", package: "Premium", days: 3 },
  { name: "Rudi", initial: "R", package: "Pro", days: 1 },
  { name: "Siti", initial: "S", package: "Lite", days: 2 },
  { name: "Andi", initial: "A", package: "Starter", days: 1 },
  { name: "Dewi", initial: "D", package: "Premium", days: 3 },
  { name: "Fajar", initial: "F", package: "Lite", days: 2 },
  { name: "Maya", initial: "M", package: "Pro", days: 1 },
  { name: "Hendra", initial: "H", package: "Starter", days: 3 },
  { name: "Rina", initial: "R", package: "Premium", days: 2 },
  { name: "Tono", initial: "T", package: "Lite", days: 1 },
  { name: "Lina", initial: "L", package: "Pro", days: 3 },
  { name: "Eko", initial: "E", package: "Starter", days: 2 },
  { name: "Nina", initial: "N", package: "Premium", days: 1 }
];

const TestimonialNotification = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev: number) => (prev + 1) % testimonials.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const current = testimonials[currentIndex];

  return (
    <motion.div
      key={currentIndex}
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.5 }}
      className="fixed bottom-6 left-6 bg-white rounded-xl p-4 shadow-lg border border-gray-100 max-w-xs z-50"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
          {current.initial}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{current.name}</p>
          <p className="text-xs text-gray-500">berlangganan paket <span className="text-orange-500 font-medium">{current.package}</span> 1 bulan</p>
          <p className="text-xs text-gray-400 mt-1">{current.days} hari yang lalu</p>
        </div>
      </div>
    </motion.div>
  );
};

// WhatsApp floating button
const WhatsAppFloat = () => (
  <motion.a
    href="https://wa.me/15556459494?text=Halo"
    target="_blank"
    rel="noopener noreferrer"
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    transition={{ delay: 0.5, type: "spring" }}
    whileHover={{ scale: 1.1 }}
    className="fixed bottom-6 right-6 w-14 h-14 bg-[#25d366] rounded-full flex items-center justify-center shadow-lg z-50 cursor-pointer"
  >
    <img src="/images/logosb.png" alt="WhatsApp" className="w-8 h-8" />
  </motion.a>
);

// Pain Point Item Component
const PainPointItem = ({ title, description }: { title: string; description: string }) => (
  <div className="flex items-start gap-3 mb-4">
    <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
      <AlertCircle size={14} className="text-red-500" />
    </div>
    <div>
      <p className="text-sm font-semibold text-gray-900">{title}</p>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  </div>
);

// Solution Box Component
const SolutionBox = () => (
  <div className="bg-orange-100 border-l-4 border-orange-500 rounded-r-lg p-4 mb-12">
    <p className="text-sm text-gray-800">
      <span className="font-semibold">Solusinya?</span> Catat langsung di <span className="font-semibold">WhatsApp</span> — aplikasi yang sudah kamu buka tiap hari!
    </p>
  </div>
);

// Feature Item Component
const FeatureItem = ({ title, description, highlightedText }: { title: string; description: string; highlightedText?: string }) => (
  <div className="flex items-start gap-3 mb-4">
    <div className="w-5 h-5 bg-orange-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
      <CheckCircle size={12} className="text-orange-500" />
    </div>
    <div className="text-sm text-gray-700">
      <span className="font-semibold text-gray-900">{title}</span>
      {' — '}
      {highlightedText ? (
        <>
          {description.split(highlightedText)[0]}
          <span className="bg-orange-200 px-1">{highlightedText}</span>
          {description.split(highlightedText)[1]}
        </>
      ) : (
        description
      )}
    </div>
  </div>
);

// Step Card Component
const StepCard = ({ number, title, description }: { number: number; title: string; description: string }) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
    <div className="w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
      {number}
    </div>
    <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-sm text-gray-600">{description}</p>
  </div>
);

// Contact Section Component
const ContactSection = () => (
  <div className="mt-16 text-center">
    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
      Hubungi <span className="bg-orange-200 px-1">Kami</span>
    </h2>
    <div className="bg-white rounded-2xl border border-gray-200 p-6 max-w-lg mx-auto text-left">
      <div className="flex items-start gap-4 mb-6">
        <Mail size={20} className="text-orange-500 mt-1" />
        <div>
          <p className="font-semibold text-gray-700 text-sm">Email</p>
          <p className="text-orange-500">fauzanalditester@gmail.com</p>
        </div>
      </div>
      <div className="flex items-start gap-4 mb-6">
        <Phone size={20} className="text-orange-500 mt-1" />
        <div>
          <p className="font-semibold text-gray-700 text-sm">WhatsApp</p>
          <p className="text-orange-500">083844570735</p>
        </div>
      </div>
      <div className="flex items-start gap-4">
        <MapPin size={20} className="text-orange-500 mt-1" />
        <div>
          <p className="font-semibold text-gray-700 text-sm">Alamat</p>
          <p className="text-gray-600">Jl. R.A. Kartini, Batu IX, Kec. Tanjungpinang Timur., Kota Tanjung Pinang, Kepulauan Riau 29125</p>
        </div>
      </div>
    </div>
  </div>
);

// FAQ Item Component
type FAQItemProps = { question: string; answer: string; isOpen: boolean; onClick: () => void };
const FAQItem = ({ question, answer, isOpen, onClick }: FAQItemProps) => (
  <div className={`border border-gray-200 rounded-lg mb-4 ${isOpen ? 'bg-gray-50' : ''}`}>
    <button 
      onClick={onClick}
      className="w-full py-4 px-4 flex items-center justify-between text-left"
    >
      <span className="font-semibold text-gray-900">{question}</span>
      <span className="text-orange-500 text-xl">{isOpen ? '−' : '+'}</span>
    </button>
    {isOpen && (
      <motion.div 
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        className="pb-4"
      >
        <p className="text-sm text-gray-600 px-4">{answer}</p>
      </motion.div>
    )}
  </div>
);

// Landing Page Component
function LandingPage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const faqs = [
    {
      question: "Bagaimana cara catat keuangan via WhatsApp?",
      answer: "Cukup chat ke nomor Tulis Duit dengan format sederhana, contoh: '50k jajan kopi' untuk pengeluaran atau '+2jt gaji' untuk pemasukan. Sistem akan otomatis mencatat transaksi Anda."
    },
    {
      question: "Berapa harga berlangganan Tulis Duit?",
      answer: "Mulai dari Rp15.000/bulan untuk paket Lite (200 teks, 20 struk). Ada juga paket Starter Rp29k, Premium Rp49k, dan Pro Rp99k dengan fitur unlimited."
    },
    {
      question: "Apakah bisa export laporan ke Excel?",
      answer: "Ya. Paket Premium dan Pro memiliki fitur export laporan ke format CSV yang bisa dibuka di Excel untuk analisis lebih lanjut."
    },
    {
      question: "Apakah ada dashboard web untuk melihat transaksi?",
      answer: "Ya, semua paket berbayar memiliki akses ke dashboard web untuk melihat detail transaksi, edit, dan hapus catatan."
    },
    {
      question: "Bagaimana cara pembayaran?",
      answer: "Pembayaran bisa dilakukan via Transfer Bank atau QRIS. Setelah pembayaran dikonfirmasi, akun Anda akan langsung aktif dalam 1 menit."
    },
    {
      question: "Apakah saya bisa mencatat pemasukan dan pengeluaran sekaligus?",
      answer: "Ya, bisa sekaliigus. Anda bisa mencatat pemasukan dan pengeluaran dalam satu kali chat tanpa perlu dipisah."
    },
    {
      question: "Bagaimana cara menghapus atau mengedit catatan yang sudah dikirim?",
      answer: "Hapus dan edit hanya bisa dilakukan lewat dashboard web, tersedia mulai dari paket Starter."
    },
    {
      question: "Bagaimana cara melihat laporan keuangan saya?",
      answer: "Ringkasan bisa dilihat lewat bot WhatsApp, dan rincian lengkap bisa diakses lewat dashboard web."
    },
    {
      question: "Bisa tidak lihat laporan bulanan atau mingguan secara otomatis?",
      answer: "Ya, rincian laporan bulanan dan mingguan bisa diakses lewat bot WhatsApp dan dashboard web secara lengkap."
    },
    {
      question: "Apakah ada masa percobaan gratis?",
      answer: "Ya, ada free tier dengan 10x catat dan 3x struk per bulan. Tanpa perlu bayar."
    },
    {
      question: "Apakah data keuangan saya aman dan tidak dilihat orang lain?",
      answer: "Ya, aman. Privasi Anda kami jamin dan hanya Anda yang bisa mengakses data keuangan Anda sendiri."
    },
    {
      question: "Apakah bot WhatsApp ini resmi dan terverifikasi?",
      answer: "Ya, bot yang kami gunakan resmi dari WhatsApp API Official Meta, bukan bot pihak ketiga."
    },
    {
      question: "Bisakah saya mengakses data dari nomor WA yang berbeda?",
      answer: "Ya, dengan fitur tambah pasangan atau catat bersama, tersedia mulai dari paket Starter."
    },
    {
      question: "Bagaimana cara reset atau memulai ulang akun saya?",
      answer: "Lewat bot WhatsApp, cukup ketik 'Reset Saldo' untuk memulai ulang akun Anda."
    },
    {
      question: "Bagaimana cara berlangganan?",
      answer: "Bisa lewat dashboard web maupun bot WhatsApp, cukup ketik 'Upgrade' untuk melihat pilihan paket."
    }
  ];

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 pt-12 pb-24">
        {/* Badge */}
        <div className="text-center">
          <UserBadge />
        </div>

        {/* Hero Section */}
        <div className="text-center mt-4 mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
            Lupa <Highlight>Catat</Highlight> Pengeluaran?<br />
            Malas <Highlight>Buka</Highlight> Aplikasi?
          </h1>
          <p className="text-gray-600 max-w-xl mx-auto leading-relaxed">
            Cukup chat di WhatsApp seperti ngobrol sama teman.<br />
            Ketik <span className="text-yellow-600 font-medium">"25k jajan kopi"</span> — langsung tercatat otomatis!
          </p>
        </div>

        {/* Chat Demo Section - User's Image */}
        <div className="max-w-md mx-auto mb-12">
          <img 
            src="/images/gambar3.png" 
            alt="WhatsApp Chat Demo" 
            className="w-full rounded-3xl shadow-lg"
          />
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <motion.a
            href="https://wa.me/15556459494?text=Halo"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-orange-500 text-white px-8 py-4 rounded-full font-semibold shadow-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <img src="/images/logobaru1.png" alt="WhatsApp" className="w-8 h-8" />
            Mulai Catat Via WhatsApp
          </motion.a>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link
              to="/login"
              className="border-2 border-orange-500 text-orange-500 px-8 py-4 rounded-full font-semibold hover:bg-orange-100 transition-colors flex items-center justify-center gap-2"
            >
              <AppWindow size={20} />
              Akses Aplikasi Sekarang
            </Link>
          </motion.div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 my-16"></div>

        {/* Pain Points Section */}
        <section className="max-w-2xl mx-auto mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Kenapa Catatan Keuangan Selalu <Highlight>Berantakan</Highlight>?
          </h2>
          
          <PainPointItem 
            title="Lupa catat" 
            description="Beli kopi, makan siang, parkir... eh udah lupa dicatat" 
          />
          <PainPointItem 
            title="Malas buka aplikasi" 
            description="Harus login, pilih kategori, isi form... ribet!" 
          />
          <PainPointItem 
            title="Gak konsisten" 
            description="Semangat 3 hari, lupa 1 minggu, data gak akurat" 
          />
        </section>

        {/* Solution Box */}
        <section className="max-w-2xl mx-auto">
          <SolutionBox />
        </section>

        {/* Divider */}
        <div className="border-t border-gray-200 my-16"></div>

        {/* Features Section */}
        <section className="max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Semudah Chat <Highlight>Teman</Highlight>
          </h2>
          
          <FeatureItem 
            title="Format super simple" 
            description='Ketik "50k makan siang" atau "+500k freelance"'
            highlightedText="50k makan siang"
          />
          <FeatureItem 
            title="Catat banyak sekaligus" 
            description="Bisa catat banyak transaksi dalam 1 chat"
            highlightedText="1 chat"
          />
          <FeatureItem 
            title="Cek saldo & rekap harian" 
            description='Cukup ketik "saldo" atau "rekap"'
            highlightedText="saldo"
          />
          <FeatureItem 
            title="Export ke CSV/Excel" 
            description="Download laporan lengkap untuk analisis"
          />
          <FeatureItem 
            title="Dashboard Web" 
            description="Cek detail transaksi & edit/delete via web"
          />
          <FeatureItem 
            title="Catat Bersama Pasangan" 
            description="Tambahkan nomor WA pasangan untuk mencatat keuangan bersama (tidak tersedia di paket Lite)"
          />

          {/* Two Images Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            <img 
              src="/images/contoh1.png" 
              alt="Contoh 1" 
              className="w-full rounded-2xl shadow-md"
            />
            <img 
              src="/images/contoh2.png" 
              alt="Contoh 2" 
              className="w-full rounded-2xl shadow-md"
            />
          </div>
        </section>

        {/* Dashboard Web Section */}
        <section className="max-w-4xl mx-auto mt-16">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Dashboard Web yang <Highlight>Lengkap</Highlight>
          </h2>
          <p className="text-gray-600 mb-8">
            Cek detail transaksi, edit atau hapus catatan dengan mudah via dashboard web.
          </p>

          {/* Dashboard Images */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <img 
              src="/images/dashboard1.png" 
              alt="Dashboard 1" 
              className="w-full rounded-2xl shadow-md"
            />
            <img 
              src="/images/dashboard2.png" 
              alt="Dashboard 2" 
              className="w-full rounded-2xl shadow-md"
            />
          </div>
        </section>

        {/* Sudah Terbukti Membantu Section */}
        <section className="max-w-4xl mx-auto mt-16">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Sudah <Highlight>Terbukti</Highlight> Membantu
          </h2>

          {/* Three Proof Images */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <img 
              src="/images/bukti4.png" 
              alt="Bukti 1" 
              className="w-full rounded-2xl shadow-md"
            />
            <img 
              src="/images/bukti2.png" 
              alt="Bukti 2" 
              className="w-full rounded-2xl shadow-md"
            />
            <img 
              src="/images/bukti3.png" 
              alt="Bukti 3" 
              className="w-full rounded-2xl shadow-md"
            />
          </div>

          {/* Bukti Pelanggan Berlangganan */}
          <h3 className="text-xl md:text-2xl font-bold text-gray-900 mt-12 mb-8">
            Bukti <Highlight>Pelanggan</Highlight> Berlangganan:
          </h3>

          {/* Two Customer Images */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <img 
              src="/images/pelanggan1.png" 
              alt="Pelanggan 1" 
              className="w-full rounded-2xl shadow-md"
            />
            <img 
              src="/images/pelanggan2.png" 
              alt="Pelanggan 2" 
              className="w-full rounded-2xl shadow-md"
            />
          </div>

          {/* Pricing Section */}
          <div className="mt-16">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
              Pilih Paket <Highlight>Sesuai Kebutuhan</Highlight>
            </h2>

            {/* Pricing Table */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-12 bg-gray-50 border-b border-gray-200 px-6 py-4 text-sm text-gray-600">
                <div className="col-span-3">Paket</div>
                <div className="col-span-3">Harga</div>
                <div className="col-span-6">Fitur</div>
              </div>

              {/* Lite */}
              <div className="grid grid-cols-12 px-6 py-4 border-b border-gray-100 items-center">
                <div className="col-span-3 font-semibold text-gray-900">Lite</div>
                <div className="col-span-3">
                  <span className="text-orange-500 font-bold text-lg">Rp15k</span>
                  <span className="text-gray-500 text-sm">/bln</span>
                </div>
                <div className="col-span-6 text-sm text-gray-600">
                  <p>200 teks, 20 struk/bulan</p>
                  <p className="text-gray-400 line-through">Catat bersama pasangan tidak tersedia</p>
                </div>
              </div>

              {/* Starter */}
              <div className="grid grid-cols-12 px-6 py-4 border-b border-gray-100 items-center">
                <div className="col-span-3 font-semibold text-gray-900">Starter</div>
                <div className="col-span-3">
                  <span className="text-orange-500 font-bold text-lg">Rp29k</span>
                  <span className="text-gray-500 text-sm">/bln</span>
                </div>
                <div className="col-span-6 text-sm text-gray-600">
                  <p>450 teks, 90 struk, edit/delete via web</p>
                  <p className="text-orange-500">Catat bersama: tambah 1 nomor</p>
                </div>
              </div>

              {/* Premium - Highlighted */}
              <div className="grid grid-cols-12 px-6 py-4 border-b border-gray-100 items-center bg-orange-100">
                <div className="col-span-3 font-semibold text-gray-900 flex items-center gap-1">
                  Premium
                  <span>★</span>
                </div>
                <div className="col-span-3">
                  <span className="text-orange-500 font-bold text-lg">Rp49k</span>
                  <span className="text-gray-500 text-sm">/bln</span>
                </div>
                <div className="col-span-6 text-sm text-gray-600">
                  <p>1200 teks, 250 struk, export CSV</p>
                  <p className="text-orange-500">Catat bersama: tambah 2 nomor</p>
                </div>
              </div>

              {/* Pro */}
              <div className="grid grid-cols-12 px-6 py-4 items-center">
                <div className="col-span-3 font-semibold text-gray-900">Pro</div>
                <div className="col-span-3">
                  <span className="text-orange-500 font-bold text-lg">Rp99k</span>
                  <span className="text-gray-500 text-sm">/bln</span>
                </div>
                <div className="col-span-6 text-sm text-gray-600">
                  <p>Unlimited teks & struk, export CSV, dukungan prioritas</p>
                  <p className="text-orange-500">Catat bersama: tambah 4 nomor</p>
                </div>
              </div>
            </div>

            {/* Footer Note */}
            <div className="flex items-center gap-2 mt-4 text-sm text-gray-600">
              <span className="text-orange-500">✓</span>
              <span>Bayar via Transfer/QRIS — Langsung aktif dalam 1 menit</span>
            </div>

            {/* Rekomendasi Paket */}
            <div className="bg-gray-50 rounded-2xl p-6 mt-8">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span>🎯</span> Rekomendasi Paket
              </h3>
              
              <div className="space-y-4">
                <div className="border-b border-gray-200 pb-4">
                  <p className="text-sm text-gray-700">
                    <span className="text-orange-500 font-semibold">Lite</span> — Cocok untuk <span className="bg-orange-200 px-1">mahasiswa/pelajar</span>. Catat uang jajan & pengeluaran harian (~6 catatan/hari)
                  </p>
                </div>
                <div className="border-b border-gray-200 pb-4">
                  <p className="text-sm text-gray-700">
                    <span className="text-orange-500 font-semibold">Starter</span> — Cocok untuk <span className="bg-orange-200 px-1">rumah tangga</span>. Kelola keuangan keluarga dengan mudah
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-700">
                    <span className="text-orange-500 font-semibold">Premium</span> — Cocok untuk <span className="bg-orange-200 px-1">UMKM, warung & freelance</span>. Fitur lengkap + export CSV
                  </p>
                </div>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="mt-16">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
                Pertanyaan yang <Highlight>Sering Ditanyakan</Highlight>
              </h2>
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                {faqs.map((faq, index) => (
                  <div key={index}>
                    <FAQItem 
                      question={faq.question}
                      answer={faq.answer}
                      isOpen={openFAQ === index}
                      onClick={() => { setOpenFAQ(openFAQ === index ? null : index); }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Call to Action Section */}
            <div className="mt-16 text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Siap Rapikan Keuanganmu?
              </h2>
              <p className="text-gray-600 mb-8 max-w-xl mx-auto">
                Mulai sekarang dengan Rp15.000/bulan saja!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.a
                  href="https://wa.me/15556459494?text=Halo"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-orange-500 text-white px-8 py-4 rounded-full font-semibold shadow-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <img src="/images/logobaru1.png" alt="WhatsApp" className="w-8 h-8" />
                  Chat WA & Mulai Sekarang
                </motion.a>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link
                    to="/login"
                    className="border-2 border-orange-500 text-orange-500 px-8 py-4 rounded-full font-semibold hover:bg-orange-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <AppWindow size={20} />
                    Akses Aplikasi Sekarang
                  </Link>
                </motion.div>
              </div>
            </div>

            {/* Contact Section */}
            <ContactSection />
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-200 mt-16 pt-12 pb-12">
          <div className="max-w-4xl mx-auto px-6">
            {/* Copyright */}
            <p className="text-gray-400 text-sm mb-2 text-center">
              © 2026 Tulis Duit - Aplikasi Pencatat Keuangan via WhatsApp
            </p>

            {/* Tagline */}
            <p className="text-gray-400 text-xs max-w-2xl mx-auto text-center">
              Catat pengeluaran harian + Laporan keuangan otomatis + Export CSV/Excel + Scan struk belanja + Cocok untuk: UMKM, mahasiswa, rumah tangga & freelancer
            </p>
          </div>
        </footer>
      </main>

      {/* Floating Elements */}
      <TestimonialNotification />
      <WhatsAppFloat />
    </div>
  );
}

// Main App with Routing
export default function App() {



  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/pilih-paket" element={<PilihPaket />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/Syarat" element={<Syarat />} />
        <Route path="/menunggu-konfirmasi" element={<MenungguKonfirmasi />} />
        <Route path="/admin-dashboard" element={<AdminPanel />} />
        <Route path="/fitur-eksklusif" element={<PaketDashboard />} />
      </Routes>
    </Router>
  );
}
