import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  MessageCircle, 
  Home, 
  List, 
  Settings, 
  ChevronRight,
  Star,
  Shield,
  Users,
  Download,
  Zap,
  Sparkles,
  Crown,
  Loader2,
  RefreshCw,
  Lock,
  BarChart2,
  X,
  Clock,
  Search,
  ChevronLeft,
  Tag,
  AlertTriangle,
  Calendar,
  PieChart as PieChartIcon,
} from 'lucide-react';

interface Transaction {
  id: number;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description?: string;
  createdAt: string;
}

interface DashboardData {
  balance: number;
  totalIncome: number;
  totalExpense: number;
  todayIncome: number;
  todayExpense: number;
  todayCount: number;
  transactions: Transaction[];
}

// ─── Large-expense threshold (configurable) ───────────────────────────────────
const LARGE_EXPENSE_THRESHOLD = 500_000;

// ─── Category colour palette ──────────────────────────────────────────────────
const CATEGORY_COLORS = [
  '#f97316', '#ef4444', '#8b5cf6', '#06b6d4',
  '#10b981', '#f59e0b', '#ec4899', '#6366f1',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

const fmtShort = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}rb`;
  return String(n);
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  // Dashboard section tabs
  const [dashSection, setDashSection] = useState<'overview' | 'grafik' | 'transaksi'>('overview');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Partner state
  const [partnerPhoneInput, setPartnerPhoneInput] = useState('');
  const [isSavingPartner, setIsSavingPartner] = useState(false);

  // Transaction list state
  const [txSearch, setTxSearch] = useState('');
  const [txCategoryFilter, setTxCategoryFilter] = useState('');
  const [txPage, setTxPage] = useState(1);
  const TX_PER_PAGE = 8;

  // Transaction detail modal
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Stats period
  const [statsPeriod, setStatsPeriod] = useState<'minggu' | 'bulan'>('minggu');

  // Dismissed large-expense notifications
  const [dismissedAlerts, setDismissedAlerts] = useState<number[]>([]);

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
      const response = await fetch(`http://${window.location.hostname}:4000/api/transactions/export`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.status === 403) {
        navigate('/pilih-paket');
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
      const res = await fetch(`http://${window.location.hostname}:4000/api/auth/partner`, {
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
      if (token === 'dummy-token-123') {
        setData({ balance: 0, totalIncome: 0, totalExpense: 0, todayIncome: 0, todayExpense: 0, todayCount: 0, transactions: [] });
        setLoading(false);
      } else {
        fetchData(token);
      }
    }
  }, [navigate, fetchData]);

  // ─── Derived data (memoised) ────────────────────────────────────────────────
  const transactions = useMemo(() => data?.transactions ?? [], [data]);

  // Chart data: last 7 days or last 4 weeks
  const chartData = useMemo(() => {
    if (statsPeriod === 'minggu') {
      const days: { label: string; income: number; expense: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        const label = d.toLocaleDateString('id-ID', { weekday: 'short' });
        const income = transactions
          .filter(t => t.type === 'income' && t.createdAt.startsWith(key))
          .reduce((s, t) => s + t.amount, 0);
        const expense = transactions
          .filter(t => t.type === 'expense' && t.createdAt.startsWith(key))
          .reduce((s, t) => s + t.amount, 0);
        days.push({ label, income, expense });
      }
      return days;
    } else {
      const weeks: { label: string; income: number; expense: number }[] = [];
      for (let i = 3; i >= 0; i--) {
        const end = new Date();
        end.setDate(end.getDate() - i * 7);
        const start = new Date(end);
        start.setDate(start.getDate() - 6);
        const label = `${start.getDate()}/${start.getMonth() + 1}`;
        const income = transactions
          .filter(t => {
            const d = new Date(t.createdAt);
            return t.type === 'income' && d >= start && d <= end;
          })
          .reduce((s, t) => s + t.amount, 0);
        const expense = transactions
          .filter(t => {
            const d = new Date(t.createdAt);
            return t.type === 'expense' && d >= start && d <= end;
          })
          .reduce((s, t) => s + t.amount, 0);
        weeks.push({ label, income, expense });
      }
      return weeks;
    }
  }, [transactions, statsPeriod]);

  // Category breakdown (expenses only)
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        map[t.category] = (map[t.category] ?? 0) + t.amount;
      });
    const total = Object.values(map).reduce((s, v) => s + v, 0);
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({
        name,
        value,
        pct: total > 0 ? Math.round((value / total) * 100) : 0,
      }));
  }, [transactions]);

  // Stats for current period
  const periodStats = useMemo(() => {
    const now = new Date();
    const filtered = transactions.filter(t => {
      const d = new Date(t.createdAt);
      if (statsPeriod === 'minggu') {
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        return d >= weekAgo;
      }
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const income = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { income, expense, net: income - expense, count: filtered.length };
  }, [transactions, statsPeriod]);

  // Large expense notifications (not dismissed)
  const largeExpenses = useMemo(() =>
    transactions
      .filter(t => t.type === 'expense' && t.amount >= LARGE_EXPENSE_THRESHOLD && !dismissedAlerts.includes(t.id))
      .slice(0, 3),
    [transactions, dismissedAlerts]
  );

  // Filtered + paginated transactions for the Transaksi tab
  const allCategories = useMemo(() =>
    [...new Set(transactions.map(t => t.category))].sort(),
    [transactions]
  );

  const filteredTx = useMemo(() => {
    const q = txSearch.toLowerCase();
    return transactions.filter(t => {
      const matchSearch = !q || t.description?.toLowerCase().includes(q) || t.category.toLowerCase().includes(q);
      const matchCat = !txCategoryFilter || t.category === txCategoryFilter;
      return matchSearch && matchCat;
    });
  }, [transactions, txSearch, txCategoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredTx.length / TX_PER_PAGE));
  const pagedTx = filteredTx.slice((txPage - 1) * TX_PER_PAGE, txPage * TX_PER_PAGE);

  if (!user) return null;

  const token = localStorage.getItem('token');
  const isDummy = token === 'dummy-token-123';

  return (
    <>
      {/* ── Transaction Detail Modal ─────────────────────────────────────── */}
      <AnimatePresence>
        {selectedTx && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTx(null)}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.97 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden z-10"
            >
              {/* Coloured top strip */}
              <div className={`h-2 w-full ${selectedTx.type === 'income' ? 'bg-orange-500' : 'bg-rose-500'}`} />
              <div className="p-6">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                      selectedTx.type === 'income' ? 'bg-orange-50 text-orange-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {selectedTx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                    </span>
                    <p className="text-2xl font-black mt-2 text-gray-900">
                      {selectedTx.type === 'income' ? '+' : '-'}{fmt(selectedTx.amount)}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedTx(null)}
                    className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-3">
                  <DetailRow icon={<Tag size={14} />} label="Kategori" value={selectedTx.category} />
                  {selectedTx.description && (
                    <DetailRow icon={<ChevronRight size={14} />} label="Keterangan" value={selectedTx.description} />
                  )}
                  <DetailRow
                    icon={<Clock size={14} />}
                    label="Tanggal"
                    value={new Date(selectedTx.createdAt).toLocaleDateString('id-ID', {
                      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  />
                  <DetailRow
                    icon={<Clock size={14} />}
                    label="Waktu"
                    value={new Date(selectedTx.createdAt).toLocaleTimeString('id-ID', {
                      hour: '2-digit', minute: '2-digit',
                    })}
                  />
                </div>

                <button
                  onClick={() => setSelectedTx(null)}
                  className="mt-6 w-full py-3 bg-slate-100 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-200 transition-colors"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-[#f1f5f9] pb-24 font-sans flex flex-col items-center">
        <div className="w-full max-w-lg bg-[#f1f5f9]">

          {/* ── Header ──────────────────────────────────────────────────── */}
          <header className="p-6 flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-800">Tulis Duit</h1>
            <div className="flex items-center gap-2">
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
                onClick={() => navigate(!user.package || user.package === 'free' ? '/pilih-paket' : '/pilih-paket')}
                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm hover:opacity-80 transition-opacity ${
                  user.package === 'pro' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                  user.package === 'premium' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                  user.package === 'starter' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                  user.package === 'lite' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                  'bg-slate-100 text-slate-500 border border-slate-200'
                }`}
              >
                {user.package === 'pro' && <Crown size={12} />}
                {user.package === 'premium' && <Shield size={12} />}
                {user.package === 'starter' && <Sparkles size={12} />}
                {user.package === 'lite' && <Zap size={12} />}
                {user.package || 'Free'} Plan
              </button>
            </div>
          </header>

          <main className="px-5 space-y-5">

            {/* Demo notice */}
            {isDummy && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-3 flex items-center gap-3">
                <Zap size={16} className="text-yellow-500 shrink-0" />
                <p className="text-xs text-yellow-700 font-medium">
                  Mode demo aktif.{' '}
                  <button onClick={() => navigate('/login')} className="underline font-bold">
                    Login dengan akun asli
                  </button>{' '}
                  untuk melihat data nyata.
                </p>
              </div>
            )}

            {/* Error */}
            {error && !isDummy && (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-center">
                <p className="text-xs text-red-600 font-medium mb-2">{error}</p>
                <button onClick={() => fetchData(token!)} className="text-xs font-bold text-red-500 underline">
                  Coba lagi
                </button>
              </div>
            )}

            {/* ── Large-expense notifications ──────────────────────────── */}
            <AnimatePresence>
              {largeExpenses.map(tx => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-start gap-3"
                >
                  <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-amber-800">Pengeluaran Besar Terdeteksi</p>
                    <p className="text-[10px] text-amber-700 truncate">
                      {tx.description || tx.category} — <span className="font-bold">{fmt(tx.amount)}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => setDismissedAlerts(prev => [...prev, tx.id])}
                    className="text-amber-400 hover:text-amber-600 shrink-0"
                  >
                    <X size={14} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* ── Saldo Card ───────────────────────────────────────────── */}
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
                <div className="text-3xl font-black mb-1 tracking-tight">
                  {data ? fmt(data.balance) : 'Rp 0'}
                </div>
              )}
              <div className="text-[10px] text-white/70 font-medium mt-3">
                Kumulatif semua waktu • {transactions.length} transaksi
              </div>
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            </motion.div>

            {/* ── Section Tabs ─────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl p-1 shadow-sm border border-gray-100 flex items-center">
              {([
                { key: 'overview', label: 'Ringkasan', icon: <Wallet size={13} /> },
                { key: 'grafik',   label: 'Grafik',    icon: <BarChart2 size={13} /> },
                { key: 'transaksi',label: 'Transaksi', icon: <List size={13} /> },
              ] as const).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setDashSection(tab.key)}
                  className={`flex-1 py-2.5 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                    dashSection === tab.key
                      ? 'bg-[#1e293b] text-white shadow-md'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {tab.icon}{tab.label}
                </button>
              ))}
            </div>

            {/* ══════════════════════════════════════════════════════════ */}
            {/* OVERVIEW TAB                                               */}
            {/* ══════════════════════════════════════════════════════════ */}
            <AnimatePresence mode="wait">
              {dashSection === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-5"
                >
                  {/* Hari Ini */}
                  <div className="space-y-3">
                    <SectionLabel>Hari Ini</SectionLabel>
                    <div className="grid grid-cols-2 gap-3">
                      <StatCard
                        label="Masuk"
                        value={loading ? null : fmt(data?.todayIncome ?? 0)}
                        icon={<TrendingUp size={14} />}
                        color="orange"
                      />
                      <StatCard
                        label="Keluar"
                        value={loading ? null : fmt(data?.todayExpense ?? 0)}
                        icon={<TrendingDown size={14} />}
                        color="rose"
                      />
                    </div>
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex justify-between items-center">
                      <span className="text-xs font-semibold text-gray-500">Transaksi Hari Ini</span>
                      <span className="text-sm font-black text-gray-800">
                        {loading ? '...' : (data?.todayCount ?? 0)}
                      </span>
                    </div>
                  </div>

                  {/* Breakdown Keseluruhan */}
                  <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-800 mb-5 flex items-center gap-2">
                      <span className="text-orange-500">$</span> Breakdown Keseluruhan
                    </h3>
                    <div className="space-y-4">
                      <BreakdownItem icon="📈" label="Total Pemasukan"
                        amount={loading ? '...' : `+${fmt(data?.totalIncome ?? 0)}`} color="text-orange-500" />
                      <BreakdownItem icon="📉" label="Total Pengeluaran"
                        amount={loading ? '...' : `-${fmt(data?.totalExpense ?? 0)}`} color="text-rose-500" />
                      <div className="border-t border-gray-100 pt-4">
                        <BreakdownItem icon="💰" label="Saldo Bersih"
                          amount={loading ? '...' : fmt(data?.balance ?? 0)}
                          color={(data?.balance ?? 0) >= 0 ? 'text-gray-900' : 'text-rose-600'} />
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp CTA */}
                  <a
                    href="https://wa.me/15556459494?text=Halo"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:bg-orange-50 hover:border-orange-100 transition-colors"
                  >
                    <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center shrink-0">
                      <MessageCircle size={28} />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-gray-800">Catat Transaksi</h4>
                      <p className="text-[10px] text-gray-500">Kirim pesan ke WhatsApp</p>
                    </div>
                    <span className="bg-orange-500 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md shadow-orange-100">
                      Buka
                    </span>
                  </a>

                  {/* Partner (Starter+) */}
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
                        Masukkan nomor WhatsApp pasangan Anda agar transaksi mereka otomatis tercatat bersama.
                      </p>
                      <div className="space-y-3">
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Nomor WA Pasangan</label>
                          <input
                            type="text"
                            placeholder="Contoh: 628123456789"
                            value={partnerPhoneInput}
                            onChange={e => setPartnerPhoneInput(e.target.value)}
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
                            Nomor {user.partnerPhone} terhubung.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Export */}
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                        <Download size={16} className="text-blue-500" />
                        Laporan Keuangan
                      </h3>
                      {!['starter', 'premium', 'pro'].includes(user?.package || 'free') && (
                        <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-1 rounded-full font-bold flex items-center gap-1">
                          Starter+ <Lock size={10} />
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={handleExport} className="py-2.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors">
                        Export PDF
                      </button>
                      <button onClick={handleExport} className="py-2.5 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors">
                        Export CSV
                      </button>
                    </div>
                  </div>

                  {/* Upgrade */}
                  {user.package !== 'pro' && (
                    <button
                      onClick={() => navigate('/pilih-paket')}
                      className="w-full bg-gradient-to-r from-purple-600 via-pink-500 to-rose-500 p-4 rounded-2xl text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-pink-200 transition-transform active:scale-[0.98]"
                    >
                      <Star size={18} fill="currentColor" className="text-yellow-300" />
                      <span>{user.package === 'free' ? 'Upgrade ke Premium/Pro' : 'Tingkatkan Paket Anda'}</span>
                    </button>
                  )}

                  {/* Free quota */}
                  {user.package === 'free' && (
                    <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex items-start gap-3">
                      <Zap size={18} className="text-orange-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-orange-900">Batas Kuota Gratis</p>
                        <p className="text-[10px] text-orange-700/70">
                          Anda menggunakan {transactions.length} dari 10 kuota pencatatan bulan ini.
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ══════════════════════════════════════════════════════════ */}
              {/* GRAFIK TAB                                                 */}
              {/* ══════════════════════════════════════════════════════════ */}
              {dashSection === 'grafik' && (
                <motion.div
                  key="grafik"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-5"
                >
                  {/* Period toggle */}
                  <div className="flex gap-2">
                    {(['minggu', 'bulan'] as const).map(p => (
                      <button
                        key={p}
                        onClick={() => setStatsPeriod(p)}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          statsPeriod === p
                            ? 'bg-orange-500 text-white shadow-md shadow-orange-200'
                            : 'bg-white text-slate-500 border border-slate-200'
                        }`}
                      >
                        <Calendar size={12} />
                        {p === 'minggu' ? '7 Hari Terakhir' : 'Bulan Ini'}
                      </button>
                    ))}
                  </div>

                  {/* Stats summary */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center">
                      <p className="text-[10px] font-bold text-gray-400 mb-1">Pemasukan</p>
                      <p className="text-sm font-black text-orange-500">{fmtShort(periodStats.income)}</p>
                    </div>
                    <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center">
                      <p className="text-[10px] font-bold text-gray-400 mb-1">Pengeluaran</p>
                      <p className="text-sm font-black text-rose-500">{fmtShort(periodStats.expense)}</p>
                    </div>
                    <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center">
                      <p className="text-[10px] font-bold text-gray-400 mb-1">Selisih</p>
                      <p className={`text-sm font-black ${periodStats.net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {periodStats.net >= 0 ? '+' : ''}{fmtShort(periodStats.net)}
                      </p>
                    </div>
                  </div>

                  {/* Area chart */}
                  <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <BarChart2 size={15} className="text-orange-500" />
                      Pemasukan vs Pengeluaran
                    </h3>
                    {loading ? (
                      <div className="h-48 flex items-center justify-center">
                        <Loader2 size={24} className="animate-spin text-orange-400" />
                      </div>
                    ) : transactions.length === 0 ? (
                      <div className="h-48 flex flex-col items-center justify-center opacity-40 gap-2">
                        <BarChart2 size={32} className="text-gray-300" />
                        <p className="text-xs text-gray-400">Belum ada data transaksi</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={180}>
                        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={fmtShort} />
                          <Tooltip
                            formatter={(value: number, name: string) => [fmt(value), name === 'income' ? 'Pemasukan' : 'Pengeluaran']}
                            contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 11 }}
                          />
                          <Area type="monotone" dataKey="income" stroke="#f97316" strokeWidth={2} fill="url(#incomeGrad)" dot={false} />
                          <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} fill="url(#expenseGrad)" dot={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                    {/* Legend */}
                    <div className="flex items-center gap-4 mt-3 justify-center">
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500">
                        <span className="w-3 h-1.5 rounded-full bg-orange-500 inline-block" /> Pemasukan
                      </span>
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500">
                        <span className="w-3 h-1.5 rounded-full bg-rose-500 inline-block" /> Pengeluaran
                      </span>
                    </div>
                  </div>

                  {/* Category breakdown */}
                  <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <PieChartIcon size={15} className="text-orange-500" />
                      Kategori Pengeluaran
                    </h3>
                    {loading ? (
                      <div className="h-40 flex items-center justify-center">
                        <Loader2 size={24} className="animate-spin text-orange-400" />
                      </div>
                    ) : categoryData.length === 0 ? (
                      <div className="h-40 flex flex-col items-center justify-center opacity-40 gap-2">
                        <PieChartIcon size={32} className="text-gray-300" />
                        <p className="text-xs text-gray-400">Belum ada pengeluaran</p>
                      </div>
                    ) : (
                      <div className="flex gap-4 items-center">
                        {/* Donut */}
                        <div className="shrink-0">
                          <PieChart width={110} height={110}>
                            <Pie
                              data={categoryData}
                              cx={50}
                              cy={50}
                              innerRadius={30}
                              outerRadius={50}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {categoryData.map((_, i) => (
                                <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                              ))}
                            </Pie>
                          </PieChart>
                        </div>
                        {/* Legend list */}
                        <div className="flex-1 space-y-2 min-w-0">
                          {categoryData.map((cat, i) => (
                            <div key={cat.name} className="flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                              />
                              <span className="text-[11px] font-semibold text-gray-700 truncate flex-1">{cat.name}</span>
                              <span className="text-[10px] font-black text-gray-500 shrink-0">{cat.pct}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Top categories bar list */}
                  {categoryData.length > 0 && (
                    <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                      <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Tag size={15} className="text-orange-500" />
                        Top Pengeluaran
                      </h3>
                      <div className="space-y-3">
                        {categoryData.map((cat, i) => (
                          <div key={cat.name}>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-semibold text-gray-700 truncate max-w-[60%]">{cat.name}</span>
                              <span className="text-xs font-black text-gray-800">{fmt(cat.value)}</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${cat.pct}%` }}
                                transition={{ duration: 0.6, delay: i * 0.08 }}
                                className="h-full rounded-full"
                                style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ══════════════════════════════════════════════════════════ */}
              {/* TRANSAKSI TAB                                              */}
              {/* ══════════════════════════════════════════════════════════ */}
              {dashSection === 'transaksi' && (
                <motion.div
                  key="transaksi"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  {/* Search */}
                  <div className="relative">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Cari transaksi..."
                      value={txSearch}
                      onChange={e => { setTxSearch(e.target.value); setTxPage(1); }}
                      className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
                    />
                  </div>

                  {/* Category filter */}
                  {allCategories.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                      <button
                        onClick={() => { setTxCategoryFilter(''); setTxPage(1); }}
                        className={`shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                          !txCategoryFilter ? 'bg-orange-500 text-white' : 'bg-white text-gray-500 border border-gray-200'
                        }`}
                      >
                        Semua
                      </button>
                      {allCategories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => { setTxCategoryFilter(cat); setTxPage(1); }}
                          className={`shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                            txCategoryFilter === cat ? 'bg-orange-500 text-white' : 'bg-white text-gray-500 border border-gray-200'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Result count */}
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      {filteredTx.length} transaksi ditemukan
                    </span>
                    <span className="text-[10px] text-gray-400">
                      Hal {txPage}/{totalPages}
                    </span>
                  </div>

                  {/* List */}
                  <div className="space-y-3 min-h-[200px]">
                    {loading ? (
                      <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <Loader2 size={28} className="animate-spin text-orange-400" />
                        <p className="text-xs text-gray-400">Memuat transaksi...</p>
                      </div>
                    ) : pagedTx.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 opacity-50 gap-2">
                        <p className="text-2xl">📭</p>
                        <p className="text-sm font-medium text-gray-500">Tidak ada transaksi</p>
                        <p className="text-xs text-gray-400">Coba ubah filter atau kata kunci</p>
                      </div>
                    ) : (
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={`${txPage}-${txCategoryFilter}-${txSearch}`}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="space-y-3"
                        >
                          {pagedTx.map(tx => (
                            <button
                              key={tx.id}
                              onClick={() => setSelectedTx(tx)}
                              className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-50 flex items-center justify-between hover:border-orange-100 hover:bg-orange-50/30 transition-colors text-left"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                  tx.type === 'income' ? 'bg-orange-50 text-orange-500' : 'bg-rose-50 text-rose-500'
                                }`}>
                                  {tx.type === 'income' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-bold text-gray-800 truncate max-w-[160px]">
                                    {tx.description || tx.category}
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">{tx.category}</span>
                                    <span className="text-[10px] text-gray-300">•</span>
                                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                      <Clock size={9} />
                                      {new Date(tx.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <p className={`text-sm font-black ${tx.type === 'income' ? 'text-orange-500' : 'text-gray-800'}`}>
                                  {tx.type === 'income' ? '+' : '-'}{fmtShort(tx.amount)}
                                </p>
                                <ChevronRight size={14} className="text-gray-300" />
                              </div>
                            </button>
                          ))}
                        </motion.div>
                      </AnimatePresence>
                    )}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-3 pt-2">
                      <button
                        onClick={() => setTxPage(p => Math.max(1, p - 1))}
                        disabled={txPage === 1}
                        className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 disabled:opacity-30 hover:border-orange-300 hover:text-orange-500 transition-colors shadow-sm"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <button
                          key={p}
                          onClick={() => setTxPage(p)}
                          className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                            p === txPage
                              ? 'bg-orange-500 text-white shadow-md shadow-orange-200'
                              : 'bg-white border border-gray-200 text-gray-500 hover:border-orange-300'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                      <button
                        onClick={() => setTxPage(p => Math.min(totalPages, p + 1))}
                        disabled={txPage === totalPages}
                        className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 disabled:opacity-30 hover:border-orange-300 hover:text-orange-500 transition-colors shadow-sm"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}

                  {/* Link to full transactions page */}
                  <button
                    onClick={() => navigate('/transactions')}
                    className="w-full py-3 bg-white border border-gray-200 rounded-2xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <List size={14} />
                    Kelola Semua Transaksi
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

          </main>
        </div>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 flex justify-between items-center z-50">
          <NavItem icon={<Home size={20} />} label="Beranda" active onClick={() => {}} />
          <NavItem
            icon={<List size={20} />}
            label="Transaksi"
            onClick={() => navigate('/transactions')}
          />
          <NavItem
            icon={<Settings size={20} />}
            label="Pengaturan"
            onClick={() => navigate('/settings')}
          />
        </nav>
      </div>
    </>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-center">
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">— {children} —</span>
    </div>
  );
}

function StatCard({
  label, value, icon, color,
}: {
  label: string;
  value: string | null;
  icon: React.ReactNode;
  color: 'orange' | 'rose';
}) {
  const colours = {
    orange: { bg: 'bg-white border-orange-50', text: 'text-orange-500', icon: 'bg-orange-50 text-orange-500' },
    rose:   { bg: 'bg-white border-rose-50',   text: 'text-rose-500',   icon: 'bg-rose-50 text-rose-500' },
  }[color];
  return (
    <div className={`${colours.bg} rounded-2xl p-4 shadow-sm border relative overflow-hidden`}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-bold text-gray-700">{label}</span>
        <span className={`p-1 rounded ${colours.icon}`}>{icon}</span>
      </div>
      <p className={`text-base font-black ${colours.text}`}>
        {value === null ? <Loader2 size={16} className="animate-spin" /> : value}
      </p>
      <div className={`absolute bottom-0 right-0 w-8 h-8 ${colours.icon} opacity-30 rounded-tl-full`} />
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
      <span className="text-gray-400 mt-0.5 shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-semibold text-gray-800 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function BreakdownItem({ icon, label, amount, color = 'text-gray-900' }: {
  icon: string; label: string; amount: string; color?: string;
}) {
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

function NavItem({ icon, label, active, onClick }: {
  icon: React.ReactNode; label: string; active?: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-all duration-200 ${
        active ? 'text-orange-500' : 'text-gray-400 hover:text-gray-600'
      }`}
    >
      <div className={`${active ? 'scale-110' : ''} transition-transform`}>{icon}</div>
      <span className="text-[10px] font-bold">{label}</span>
    </button>
  );
}
