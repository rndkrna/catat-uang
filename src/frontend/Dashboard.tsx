import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  MessageCircle, 
  Home, 
  List, 
  Settings, 
  ChevronRight,
  Plus,
  Star,
  Shield,
  Users,
  Download,
  Zap,
  Sparkles,
  Crown,
  Loader2,
  RefreshCw,
  Lock
} from 'lucide-react';

interface DashboardData {
  balance: number;
  totalIncome: number;
  totalExpense: number;
  todayIncome: number;
  todayExpense: number;
  todayCount: number;
  transactions: any[];
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transaksi' | 'pengaturan'>('dashboard');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Partner state
  const [partnerPhoneInput, setPartnerPhoneInput] = useState('');
  const [isSavingPartner, setIsSavingPartner] = useState(false);

  // Format Rupiah
  const fmt = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

  const fetchData = useCallback(async (token: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`http://${window.location.hostname}:4000/api/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Gagal mengambil data');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        throw new Error(json.message || 'Gagal');
      }
    } catch (err: any) {
      setError('Tidak dapat terhubung ke server. Pastikan backend berjalan.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleExport = async () => {
    if (isDummy) return navigate('/login');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/transactions/export', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.status === 403) {
        // Jika bukan paket premium, arahkan ke fitur eksklusif
        navigate('/fitur-eksklusif');
        return;
      }
      
      if (!response.ok) {
        alert('Gagal mengunduh laporan. Silakan coba lagi.');
        return;
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'laporan_tulisduit.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat mengunduh laporan.');
    }
  };

  const handleSavePartner = async () => {
    setIsSavingPartner(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:4000/api/auth/partner', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ partnerPhone: partnerPhoneInput })
      });
      const resData = await res.json();
      if (resData.success) {
        alert('Sukses menyimpan nomor pasangan!');
        // Update local user state
        setUser({ ...user, partnerPhone: resData.partnerPhone });
        localStorage.setItem('user', JSON.stringify({ ...user, partnerPhone: resData.partnerPhone }));
      } else {
        alert(resData.message || 'Gagal menyimpan');
      }
    } catch (error) {
      alert('Terjadi kesalahan jaringan');
    }
    setIsSavingPartner(false);
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!savedUser || !token) {
      navigate('/login');
    } else {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setPartnerPhoneInput(parsedUser.partnerPhone || '');
      // Jika dummy token, skip fetch dan tampilkan data kosong
      if (token === 'dummy-token-123') {
        setData({ balance: 0, totalIncome: 0, totalExpense: 0, todayIncome: 0, todayExpense: 0, todayCount: 0, transactions: [] });
        setLoading(false);
      } else {
        fetchData(token);
      }
    }
  }, [navigate, fetchData]);

  if (!user) return null;

  const token = localStorage.getItem('token');
  const isDummy = token === 'dummy-token-123';

  return (
    <div className="min-h-screen bg-[#f1f5f9] pb-24 font-sans flex flex-col items-center">
      {/* Container - Max width to feel like a mobile app on desktop */}
      <div className="w-full max-w-lg bg-[#f1f5f9]">
        
        {/* Header Title */}
        <header className="p-6 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">Tulis Duit</h1>
          <div className="flex items-center gap-2">
            {/* Tombol refresh */}
            {!isDummy && (
              <button
                onClick={() => fetchData(token!)}
                className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-orange-500 transition-colors shadow-sm"
                title="Refresh data"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>
            )}
            <button 
              onClick={() => {
                if (!user.package || user.package === 'free') {
                  navigate('/pilih-paket');
                } else {
                  navigate('/fitur-eksklusif');
                }
              }}
              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm hover:opacity-80 transition-opacity ${
              user.package === 'pro' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
              user.package === 'premium' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
              user.package === 'starter' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
              user.package === 'lite' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
              'bg-slate-100 text-slate-500 border border-slate-200 cursor-pointer'
            }`}>
              {user.package === 'pro' && <Crown size={12} />}
              {user.package === 'premium' && <Shield size={12} />}
              {user.package === 'starter' && <Sparkles size={12} />}
              {user.package === 'lite' && <Zap size={12} />}
              {user.package || 'Free'} Plan
            </button>
          </div>
        </header>

        <main className="px-5 space-y-6">
          
          {/* Demo mode notice */}
          {isDummy && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-3 flex items-center gap-3">
              <Zap size={16} className="text-yellow-500 shrink-0" />
              <p className="text-xs text-yellow-700 font-medium">
                Mode demo aktif. <button onClick={() => navigate('/login')} className="underline font-bold">Login dengan akun asli</button> untuk melihat data transaksi nyata.
              </p>
            </div>
          )}

          {/* Error state */}
          {error && !isDummy && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-center">
              <p className="text-xs text-red-600 font-medium mb-2">{error}</p>
              <button
                onClick={() => fetchData(token!)}
                className="text-xs font-bold text-red-500 underline"
              >
                Coba lagi
              </button>
            </div>
          )}

          {/* 1. Saldo Total Card (Orange Theme) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl p-6 text-white shadow-xl shadow-orange-200 relative overflow-hidden"
          >
            <div className="flex items-center gap-2 text-white/80 text-xs font-semibold mb-3">
              <span className="p-1 bg-white/20 rounded-full">💰</span>
              <span>Saldo Total</span>
              <Wallet size={16} className="ml-auto opacity-80" />
            </div>
            {loading ? (
              <div className="flex items-center gap-2 mb-4">
                <Loader2 size={20} className="animate-spin text-white/70" />
                <span className="text-white/70 text-sm">Memuat...</span>
              </div>
            ) : (
              <div className="text-3xl font-black mb-4 tracking-tight">
                {data ? fmt(data.balance) : 'Rp 0'}
              </div>
            )}
            <div className="text-[10px] text-white/70 font-medium">
              Kumulatif semua waktu • {data?.transactions?.length ?? 0} transaksi
            </div>
            {/* Decorative background circle */}
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          </motion.div>

          {/* 2. Breakdown Keseluruhan */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span className="text-orange-500">$</span> Breakdown Keseluruhan
            </h3>
            
            <div className="space-y-5">
              <BreakdownItem 
                icon="📊" 
                label="Saldo Awal" 
                amount="Rp 0" 
              />
              <BreakdownItem 
                icon="📈" 
                label="Total Pemasukan" 
                amount={loading ? '...' : `+${data ? fmt(data.totalIncome) : 'Rp 0'}`}
                color="text-orange-500" 
              />
              <BreakdownItem 
                icon="📉" 
                label="Total Pengeluaran" 
                amount={loading ? '...' : `-${data ? fmt(data.totalExpense) : 'Rp 0'}`}
                color="text-rose-500" 
              />
            </div>
          </div>

          {/* 3. Hari Ini Section */}
          <div className="space-y-4">
            <div className="text-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">--- Hari Ini ---</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Masuk Card */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-orange-50 relative overflow-hidden">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1 bg-orange-50 rounded text-orange-500">📈</span>
                    <span className="text-xs font-bold text-gray-700">Masuk</span>
                  </div>
                  <TrendingUp size={14} className="text-orange-500" />
                </div>
                <p className="text-lg font-black text-orange-500">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : (data ? fmt(data.todayIncome) : 'Rp 0')}
                </p>
                <div className="absolute bottom-0 right-0 w-8 h-8 bg-orange-50/50 rounded-tl-full"></div>
              </div>

              {/* Keluar Card */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-rose-50 relative overflow-hidden">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1 bg-rose-50 rounded text-rose-500">📉</span>
                    <span className="text-xs font-bold text-gray-700">Keluar</span>
                  </div>
                  <TrendingDown size={14} className="text-rose-500" />
                </div>
                <p className="text-lg font-black text-rose-500">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : (data ? fmt(data.todayExpense) : 'Rp 0')}
                </p>
                <div className="absolute bottom-0 right-0 w-8 h-8 bg-rose-50/50 rounded-tl-full"></div>
              </div>
            </div>

            {/* Transaksi Hari Ini Counter */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex justify-between items-center">
              <span className="text-xs font-semibold text-gray-500">Transaksi Hari Ini</span>
              <span className="text-sm font-black text-gray-800">
                {loading ? '...' : (data?.todayCount ?? 0)}
              </span>
            </div>
          </div>

          {/* 4. WhatsApp CTA */}
          <a
            href="https://wa.me/15556459494?text=Halo"
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4 hover:bg-orange-50 hover:border-orange-100 transition-colors"
          >
            <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center shrink-0">
              <MessageCircle size={28} />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-gray-800">Catat Transaksi</h4>
              <p className="text-[10px] text-gray-500">Kirim pesan ke WhatsApp</p>
            </div>
            <span className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-100">
              Buka
            </span>
          </a>

          {/* Package Specific Features */}
          
          {/* 1. Starter/Premium/Pro: Akun Bersama */}
          {(['starter', 'premium', 'pro'].includes(user.package)) && (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <Users size={16} className="text-orange-500" />
                  Kelola Akun Pasangan
                </h3>
                <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">Aktif</span>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Masukkan nomor WhatsApp pasangan Anda. Segala ketikan pengeluaran dari nomor ini akan otomatis memotong saldo gabungan ini.
              </p>
              
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Nomor WA Pasangan</label>
                  <input
                    type="text"
                    placeholder="Contoh: 628123456789"
                    value={partnerPhoneInput}
                    onChange={(e) => setPartnerPhoneInput(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
                  />
                </div>
                <button 
                  onClick={handleSavePartner}
                  disabled={isSavingPartner}
                  className="w-full py-2.5 bg-orange-500 text-white rounded-xl text-xs font-bold hover:bg-orange-600 transition-colors shadow-md shadow-orange-100 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSavingPartner && <Loader2 size={14} className="animate-spin" />}
                  {isSavingPartner ? 'Menyimpan...' : 'Simpan Nomor Pasangan'}
                </button>
                {user.partnerPhone && (
                  <p className="text-[10px] text-green-600 font-medium text-center bg-green-50 p-2 rounded-lg">
                    Nomor {user.partnerPhone} saat ini terhubung. Pasangan Anda dapat langsung mencatat transaksi via WhatsApp!
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 2. Export Data (Tampil untuk semua, tapi diproteksi saat diklik) */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <Download size={16} className="text-blue-500" />
                Laporan Keuangan
              </h3>
              {!['starter', 'premium', 'pro'].includes(user?.package || 'free') && (
                <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-1 rounded-full font-bold flex items-center gap-1">
                  Premium <Lock size={10} />
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={handleExport}
                className="py-2.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
              >
                Export PDF
              </button>
              <button 
                onClick={handleExport}
                className="py-2.5 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
              >
                Export CSV
              </button>
            </div>
          </div>

          {/* 3. Pro Only: Business Insights */}
          {user.package === 'pro' && (
            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-6 text-white shadow-xl">
              <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
                <Crown size={16} className="text-yellow-400" />
                Business Insights
              </h3>
              <p className="text-xs text-white/70 mb-4">Analisis mendalam tentang arus kas bisnis Anda tersedia di sini.</p>
              <div className="h-20 bg-white/10 rounded-2xl border border-white/20 flex items-center justify-center italic text-white/40 text-xs">
                Grafik Analitik Premium
              </div>
            </div>
          )}

          {/* Upgrade Button (Only for non-Pro) */}
          {user.package !== 'pro' && (
            <button 
              onClick={() => navigate('/pilih-paket')}
              className="w-full bg-gradient-to-r from-purple-600 via-pink-500 to-rose-500 p-4 rounded-2xl text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-pink-200 transition-transform active:scale-[0.98]"
            >
              <Star size={18} fill="currentColor" className="text-yellow-300" />
              <span>{user.package === 'free' ? 'Upgrade ke Premium/Pro' : 'Tingkatkan Paket Anda'}</span>
            </button>
          )}

          {/* Limit Notification for Free Users */}
          {user.package === 'free' && (
            <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex items-start gap-3">
              <Zap size={18} className="text-orange-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-orange-900">Batas Kuota Gratis</p>
                <p className="text-[10px] text-orange-700/70">
                  Anda menggunakan {data?.transactions?.length ?? 0} dari 10 kuota pencatatan bulan ini.
                </p>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* 6. Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 flex justify-between items-center z-50">
        <NavItem 
          icon={<Home size={20} />} 
          label="Beranda" 
          active={activeTab === 'beranda'} 
          onClick={() => setActiveTab('beranda')} 
        />
        <NavItem 
          icon={<List size={20} />} 
          label="Transaksi" 
          active={activeTab === 'transaksi'} 
          onClick={() => {
            setActiveTab('transaksi');
            navigate('/transactions');
          }} 
        />
        <NavItem 
          icon={<Settings size={20} />} 
          label="Pengaturan" 
          active={activeTab === 'pengaturan'} 
          onClick={() => navigate('/settings')} 
        />
      </nav>
    </div>
  );
}

function BreakdownItem({ icon, label, amount, color = "text-gray-900" }: { icon: string, label: string, amount: string, color?: string }) {
  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-3">
        <span className="text-lg">{icon}</span>
        <span className="text-xs font-semibold text-gray-500 group-hover:text-gray-700 transition-colors">{label}</span>
      </div>
      <span className={`text-sm font-bold ${color}`}>{amount}</span>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: any, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-all duration-200 ${
        active ? 'text-orange-500' : 'text-gray-400 hover:text-gray-600'
      }`}
    >
      <div className={`${active ? 'scale-110' : ''} transition-transform`}>
        {icon}
      </div>
      <span className="text-[10px] font-bold">{label}</span>
    </button>
  );
}
