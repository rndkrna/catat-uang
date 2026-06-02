import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Check, Sparkles, Zap, ShieldCheck, CreditCard, Rocket, Globe, QrCode, Clock, Copy, CheckCircle2, X } from 'lucide-react';

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  id: string;
  name: string;
  tagline: string;
  price: number;
  originalPrice?: number;
  icon: React.ReactNode;
  color: string;
  accent: string;
  features: PlanFeature[];
  isPopular?: boolean;
  isCurrent?: boolean;
}

type PriceData = {
  rawTotal: number;
  formatted: string;
  periodText: string;
  savings: string | null;
  monthlyRate: string;
  isFree: boolean;
};

export default function PilihPaket() {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('quarterly');
  const [showPayment, setShowPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [activePlan, setActivePlan] = useState<Plan | null>(null);
  const [uniqueDiscount, setUniqueDiscount] = useState(0);

  const getOriginalTotal = (basePrice: number, originalMonthlyPrice?: number): number => {
    const originalMonthly = originalMonthlyPrice || basePrice;
    if (selectedPeriod === 'monthly') return originalMonthly;
    if (selectedPeriod === 'quarterly') return originalMonthly * 3;
    if (selectedPeriod === 'yearly') return originalMonthly * 12;
    return originalMonthly;
  };

  const getPeriodDiscount = (basePrice: number, originalMonthlyPrice?: number): number => {
    const originalTotal = getOriginalTotal(basePrice, originalMonthlyPrice);
    const finalTotal = getPrice(basePrice, originalMonthlyPrice).rawTotal;
    return Math.max(0, originalTotal - finalTotal);
  };

  const plans: Plan[] = [
    {
      id: 'free',
      name: 'Free',
      tagline: 'Cocok untuk mencoba',
      price: 0,
      icon: <Globe className="w-5 h-5" />,
      color: 'from-slate-50 to-slate-100',
      accent: 'text-slate-500',
      isCurrent: true,
      features: [
        { text: '10 pencatatan teks/bulan', included: true },
        { text: '3 scan struk/bulan', included: true },
        { text: 'Edit & hapus transaksi', included: false },
        { text: 'Laporan PDF & CSV', included: false },
        { text: 'Dukungan komunitas', included: true },
      ]
    },
    {
      id: 'lite',
      name: 'Lite',
      tagline: 'Untuk kebutuhan dasar',
      price: 15000,
      originalPrice: 18000,
      icon: <Zap className="w-5 h-5" />,
      color: 'from-orange-50 to-orange-100',
      accent: 'text-orange-600',
      features: [
        { text: '200 pencatatan teks/bulan', included: true },
        { text: '20 scan struk/bulan', included: true },
        { text: 'Edit & hapus transaksi', included: false },
        { text: 'Laporan PDF & CSV', included: false },
        { text: 'Dukungan prioritas', included: true },
      ]
    },
    {
      id: 'starter',
      name: 'Starter',
      tagline: 'Paling favorit untuk rumah tangga',
      price: 28000,
      originalPrice: 35000,
      icon: <Sparkles className="w-5 h-5" />,
      color: 'from-orange-50 to-orange-100',
      accent: 'text-orange-600',
      isPopular: true,
      features: [
        { text: '450 pencatatan teks/bulan', included: true },
        { text: '90 scan struk/bulan', included: true },
        { text: 'Edit & hapus transaksi', included: true },
        { text: 'Laporan PDF & CSV', included: true },
        { text: '1 akun bersama pasangan', included: true },
      ]
    },
    {
      id: 'premium',
      name: 'Premium',
      tagline: 'Solusi lengkap untuk profesional',
      price: 40000,
      originalPrice: 50000,
      icon: <ShieldCheck className="w-5 h-5" />,
      color: 'from-blue-50 to-blue-100',
      accent: 'text-blue-600',
      features: [
        { text: '1200 pencatatan teks/bulan', included: true },
        { text: '250 scan struk/bulan', included: true },
        { text: 'Edit & hapus transaksi', included: true },
        { text: 'Laporan PDF & CSV (Export)', included: true },
        { text: '2 akun bersama (Pasangan/Tim)', included: true },
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      tagline: 'Performa tanpa batas',
      price: 80000,
      originalPrice: 100000,
      icon: <Rocket className="w-5 h-5" />,
      color: 'from-amber-50 to-amber-100',
      accent: 'text-amber-600',
      features: [
        { text: 'Pencatatan teks unlimited', included: true },
        { text: 'Scan struk unlimited', included: true },
        { text: 'Edit & hapus transaksi', included: true },
        { text: 'Laporan PDF & CSV', included: true },
        { text: '4 akun bersama (Tim/Keluarga)', included: true },
        { text: 'Prioritas dukungan 24/7', included: true },
      ]
    }
  ];

  const getPrice = (basePrice: number, originalMonthlyPrice?: number): PriceData => {
    if (basePrice === 0) {
      return {
        rawTotal: 0,
        formatted: 'Gratis',
        periodText: '',
        savings: null,
        monthlyRate: '',
        isFree: true,
      };
    }
    
    let total = basePrice;
    let periodText = '/ bln';
    let savings = 0;
    const originalMonthly = originalMonthlyPrice || basePrice;

    if (selectedPeriod === 'monthly') {
      total = basePrice;
      periodText = ' / bln';
      savings = originalMonthly - basePrice;
    } else if (selectedPeriod === 'quarterly') {
      total = basePrice * 3 * 0.7; // 30% discount
      periodText = ' / 3 bln';
      savings = (originalMonthly * 3) - total;
    } else if (selectedPeriod === 'yearly') {
      total = basePrice * 12 * 0.7; // 30% discount
      periodText = ' / thn';
      savings = (originalMonthly * 12) - total;
    }

    // Rounding to clean thousands
    total = Math.round(total / 1000) * 1000;
    savings = Math.round(savings / 1000) * 1000;

    return {
      rawTotal: total,
      formatted: new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(total),
      periodText,
      savings: savings > 0 ? `Hemat ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(savings)}` : null,
      monthlyRate: `Sekitar ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(total / (selectedPeriod === 'monthly' ? 1 : selectedPeriod === 'quarterly' ? 3 : 12))}/bln`,
      isFree: false,
    };
  };

  return (
    <div className="min-h-screen bg-[#fcfcfd] text-slate-900 font-sans selection:bg-orange-100 pb-20">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-50 rounded-full blur-[120px] opacity-60"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-50 rounded-full blur-[120px] opacity-60"></div>
      </div>

      <div className="relative z-10">
        {/* Navbar */}
        <nav className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-all font-medium group"
          >
            <div className="w-8 h-8 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center group-hover:bg-slate-50 transition-colors">
              <ArrowLeft size={16} />
            </div>
            <span>Kembali</span>
          </button>
          
          <div className="flex items-center gap-2 bg-orange-50 px-4 py-1.5 rounded-full">
            <ShieldCheck size={14} className="text-orange-600" />
            <span className="text-[11px] font-bold text-orange-700 uppercase tracking-wider">Pembayaran Aman via QRIS</span>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="max-w-4xl mx-auto text-center pt-12 pb-16 px-6">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight mb-6"
          >
            Pilih Paket <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-orange-400">Terbaik Anda</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-base sm:text-lg text-slate-500 font-medium max-w-2xl mx-auto mb-10"
          >
            Mulai dari pencatatan harian hingga manajemen keuangan keluarga profesional. Bebas pilih sesuai kebutuhan Anda.
          </motion.p>

          {/* Period Switcher */}
          <div className="flex flex-col sm:inline-flex sm:flex-row p-1.5 bg-slate-100/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 mb-12 w-full sm:w-auto max-w-sm sm:max-w-none mx-auto gap-1 sm:gap-0">
            {[
              { id: 'monthly', label: '1 Bulan', tag: 'Hemat 20%' },
              { id: 'quarterly', label: '3 Bulan', tag: 'Hemat 30%' },
              { id: 'yearly', label: 'Tahunan', tag: 'Hemat 30%' }
            ].map((period) => (
              <button
                key={period.id}
                onClick={() => setSelectedPeriod(period.id as any)}
                className={`relative px-4 sm:px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 w-full sm:w-auto ${
                  selectedPeriod === period.id ? 'text-white' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {selectedPeriod === period.id && (
                  <motion.div 
                    layoutId="period-bg"
                    className="absolute inset-0 bg-orange-600 rounded-xl shadow-lg shadow-orange-200"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">{period.label}</span>
                {period.tag && (
                  <span className={`relative z-10 text-[9px] px-2 py-0.5 rounded-full ${
                    selectedPeriod === period.id ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-600'
                  }`}>
                    {period.tag}
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Plans Grid */}
        <section className="max-w-7xl mx-auto px-6 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {plans.map((plan, index) => (
              <PricingCard 
                key={plan.id} 
                plan={plan} 
                priceData={getPrice(plan.price, plan.originalPrice)} 
                index={index}
                isQuarterly={selectedPeriod === 'quarterly'}
                isYearly={selectedPeriod === 'yearly'}
                onSelect={() => {
                  if (!plan.isCurrent) {
                    setActivePlan(plan);
                    setUniqueDiscount(Math.floor(Math.random() * 899) + 100);
                    setShowPayment(true);
                  }
                }}
              />
            ))}
          </div>
        </section>

        {/* Payment Modal with QRIS and WhatsApp Redirect */}
        <AnimatePresence>
          {showPayment && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowPayment(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
              >
                <div className="p-6 sm:p-8">
                  {/* Modal Header */}
                  <div className="flex items-start justify-between gap-4 mb-8">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900">Pembayaran QRIS</h2>
                      <p className="text-xs sm:text-sm text-slate-500 font-medium">Selesaikan pembayaran untuk mengaktifkan paket</p>
                    </div>
                    <button 
                      onClick={() => setShowPayment(false)}
                      className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors shrink-0"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Order Summary */}
                  <div className="bg-slate-50 rounded-2xl p-4 mb-6 border border-slate-100">
                    {/* Header: Package Icon & Name */}
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-200/60">
                      <div className={`w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center ${activePlan?.accent} shrink-0`}>
                        {activePlan?.icon}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Paket Dipilih</p>
                        <p className="text-sm font-black text-slate-900">{activePlan?.name} — {selectedPeriod === 'monthly' ? '1 Bulan' : selectedPeriod === 'quarterly' ? '3 Bulan' : 'Tahunan'}</p>
                      </div>
                    </div>

                    {/* Detailed Pricing breakdown */}
                    <div className="space-y-2.5 text-xs font-medium text-slate-600 mb-4">
                      {/* Original Price (if discount exists) */}
                      {activePlan && getPeriodDiscount(activePlan.price, activePlan.originalPrice) > 0 && (
                        <div className="flex justify-between items-center">
                          <span>Harga Normal ({selectedPeriod === 'monthly' ? '1 Bulan' : selectedPeriod === 'quarterly' ? '3 Bulan' : '1 Tahun'})</span>
                          <span className="line-through text-slate-400">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(getOriginalTotal(activePlan.price, activePlan.originalPrice))}
                          </span>
                        </div>
                      )}

                      {/* Period Discount (if discount exists) */}
                      {activePlan && getPeriodDiscount(activePlan.price, activePlan.originalPrice) > 0 && (
                        <div className="flex justify-between items-center text-orange-600">
                          <span>Diskon Paket</span>
                          <span>
                            - {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(getPeriodDiscount(activePlan.price, activePlan.originalPrice))}
                          </span>
                        </div>
                      )}

                      {/* Package Total Price */}
                      <div className="flex justify-between items-center">
                        <span>Harga Paket ({selectedPeriod === 'monthly' ? '1 Bulan' : selectedPeriod === 'quarterly' ? '3 Bulan' : 'Tahunan'})</span>
                        <span className="font-bold text-slate-900">
                          {activePlan && new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(getPrice(activePlan.price, activePlan.originalPrice).rawTotal)}
                        </span>
                      </div>

                      {/* Unique Code / New User Promo */}
                      <div className="flex justify-between items-center text-orange-600 py-2 border-t border-slate-200 border-dashed">
                        <span className="font-bold">Promo Akun Baru (Kode Unik)</span>
                        <span className="font-bold">
                          - Rp {uniqueDiscount}
                        </span>
                      </div>
                    </div>
                    
                    {/* Final Payment Total */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-1 sm:gap-0 pt-2.5 border-t border-slate-200">
                      <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Pembayaran</p>
                      <p className="text-xl sm:text-2xl font-black text-orange-600">
                        {activePlan && new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(getPrice(activePlan.price, activePlan.originalPrice).rawTotal - uniqueDiscount)}
                      </p>
                    </div>
                  </div>

                  {/* QR Section */}
                  <div className="text-center mb-8">
                    <div className="relative inline-block p-4 bg-white rounded-3xl border-2 border-slate-100 shadow-inner mb-4">
                      <img 
                        src="/images/qris.jpeg" 
                        alt="QRIS" 
                        className="w-48 h-48 rounded-xl object-cover"
                      />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center">
                        <QrCode size={24} className="text-orange-500" />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center gap-2 text-slate-500 mb-2">
                      <Clock size={16} />
                      <span className="text-sm font-bold">Harap simpan bukti pembayaran</span>
                    </div>
                  </div>

                  {/* Warning */}
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 flex gap-3">
                    <div className="mt-0.5 text-orange-600">
                      <CheckCircle2 size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-orange-800 mb-1">Bayar sesuai Total Pembayaran!</p>
                      <p className="text-xs text-orange-600/80 leading-relaxed">Sistem akan memverifikasi otomatis berdasarkan nominal Promo Akun Baru di atas. Jika nominal transfer berbeda, paket tidak akan aktif.</p>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="space-y-3 mb-8">
                    {[
                      'Buka aplikasi e-wallet atau Mobile Banking.',
                      'Pilih fitur Scan/Bayar dan arahkan ke kode QR di atas.',
                      'Ketik nominal transfer TEPAT SESUAI Total Pembayaran.',
                      'Selesaikan pembayaran.',
                      'Klik tombol di bawah ini (tidak perlu kirim bukti transfer).'
                    ].map((step, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                          {i + 1}
                        </div>
                        <p className="text-[13px] text-slate-600 font-medium">{step}</p>
                      </div>
                    ))}
                  </div>

                  {/* WhatsApp Button */}
                  <button 
                    onClick={async () => {
                      if (!activePlan) return;
                      
                      const savedUser = localStorage.getItem('user');
                      if (!savedUser) {
                        alert('Sesi telah habis, silakan login kembali.');
                        navigate('/login');
                        return;
                      }
                      
                      const userObj = JSON.parse(savedUser);
                      const totalTransfer = activePlan ? getPrice(activePlan.price, activePlan.originalPrice).rawTotal - uniqueDiscount : 0;
                      
                      try {
                        const res = await fetch('/api/payments', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            userId: userObj.id,
                            package: activePlan.id,
                            amount: totalTransfer
                          })
                        });
                        
                        if (res.ok) {
                          navigate('/menunggu-konfirmasi');
                        } else {
                          const data = await res.json();
                          alert(data.message || 'Gagal mengirim data pembayaran.');
                        }
                      } catch (error) {
                        console.error('Payment error:', error);
                        alert('Terjadi kesalahan koneksi.');
                      }
                    }}
                    className="w-full py-4 bg-orange-600 text-white rounded-2xl text-sm font-black hover:bg-orange-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-200"
                  >
                    Saya Sudah Transfer Sesuai Nominal
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Trusted By / Features Bar */}
        <section className="max-w-7xl mx-auto px-6">
          <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm flex flex-wrap items-center justify-around gap-8 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 mb-2">
                <CreditCard size={20} />
              </div>
              <p className="text-sm font-bold">QRIS Otomatis</p>
              <p className="text-[11px] text-slate-400">Aktif dalam 60 detik</p>
            </div>
            <div className="w-px h-12 bg-slate-100 hidden md:block"></div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-2">
                <ShieldCheck size={20} />
              </div>
              <p className="text-sm font-bold">Aman & Terjamin</p>
              <p className="text-[11px] text-slate-400">Data terenkripsi penuh</p>
            </div>
            <div className="w-px h-12 bg-slate-100 hidden md:block"></div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 mb-2">
                <Zap size={20} />
              </div>
              <p className="text-sm font-bold">Tanpa Batas</p>
              <p className="text-[11px] text-slate-400">Mulai dari Gratis</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function PricingCard({
  plan,
  priceData,
  index,
  isQuarterly,
  isYearly,
  onSelect,
}: {
  // `key` adalah atribut khusus di React; tambah di sini agar TypeScript tidak komplain saat dipakai di list.
  key?: string;
  plan: Plan;
  priceData: PriceData;
  index: number;
  isQuarterly: boolean;
  isYearly: boolean;
  onSelect: () => void;
}) {
  const originalMonthly = plan.originalPrice || plan.price;
  let originalPriceForPeriod = originalMonthly;
  if (isQuarterly) originalPriceForPeriod = originalMonthly * 3;
  if (isYearly) originalPriceForPeriod = originalMonthly * 12;

  const hasDiscount = originalPriceForPeriod > priceData.rawTotal;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -8 }}
      className={`relative group bg-white rounded-[32px] p-8 border ${
        plan.isPopular ? 'border-orange-200 shadow-xl shadow-orange-100/50 scale-[1.03]' : 'border-slate-100 shadow-sm'
      } flex flex-col h-full transition-all duration-300`}
    >
      {plan.isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg shadow-orange-200 uppercase tracking-wider z-20">
          Pilihan Terbaik
        </div>
      )}

      {plan.isCurrent && (
        <div className="absolute top-4 right-6 text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
          Paket Anda
        </div>
      )}

      <div className="mb-8 h-32 flex flex-col justify-start">
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${plan.color} ${plan.accent} flex items-center justify-center mb-6 shadow-sm shrink-0`}>
          {plan.icon}
        </div>
        <h3 className="text-2xl font-black text-slate-900 mb-1">{plan.name}</h3>
        <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2">{plan.tagline}</p>
      </div>

      <div className="mb-8 h-28 flex flex-col justify-center border-y border-slate-50 py-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={priceData.formatted}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col justify-center"
          >
            {hasDiscount && (
              <span className="text-xs font-bold text-slate-400 line-through mb-0.5">
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(originalPriceForPeriod)}
              </span>
            )}
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                {typeof priceData === 'string' ? priceData : priceData.formatted}
              </span>
              {typeof priceData !== 'string' && (
                <span className="text-sm font-bold text-slate-400">{priceData.periodText}</span>
              )}
            </div>
            
            <div className="h-4 mt-1">
              {priceData.monthlyRate && (
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tighter">
                  {priceData.monthlyRate}
                </p>
              )}
            </div>

            <div className="h-6 mt-3">
              {priceData.savings && (
                <div className="inline-block bg-orange-50 text-orange-600 text-[10px] font-black px-3 py-1 rounded-lg border border-orange-100">
                  {priceData.savings}
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="space-y-4 mb-10 flex-1">
        {plan.features.map((feature, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
              feature.included ? 'bg-orange-50 text-orange-600' : 'bg-slate-50 text-slate-300'
            }`}>
              <Check size={12} strokeWidth={3} />
            </div>
            <span className={`text-[13px] font-bold leading-tight ${
              feature.included ? 'text-slate-700' : 'text-slate-300 line-through'
            }`}>
              {feature.text}
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={onSelect}
        className={`w-full py-4 rounded-2xl text-sm font-black transition-all duration-300 flex items-center justify-center gap-2 ${
          plan.isCurrent 
            ? 'bg-slate-100 text-slate-400 cursor-default'
            : plan.isPopular 
              ? 'bg-orange-600 text-white shadow-lg shadow-orange-100 hover:bg-orange-700 hover:shadow-orange-200 active:scale-[0.98]'
              : 'bg-white text-slate-900 border-2 border-slate-100 hover:border-orange-100 hover:bg-orange-50/50 active:scale-[0.98]'
        }`}
      >
        {plan.isCurrent ? 'Aktif Saat Ini' : 'Pilih Paket'}
        {!plan.isCurrent && <Sparkles size={16} className="opacity-50" />}
      </button>
    </motion.div>
  );
}
