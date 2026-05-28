import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, 
  Home, 
  List, 
  Settings, 
  TrendingUp,
  TrendingDown,
  Clock,
  Loader2,
  RefreshCw,
  Trash2,
  AlertCircle,
  Edit2,
  RotateCcw,
  X,
  Search,
  SlidersHorizontal,
} from 'lucide-react';

interface Transaction {
  id: number;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description?: string;
  createdAt: string;
  deletedAt?: string | null;
}

export default function Transactions() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('transaksi');
  const [viewMode, setViewMode] = useState<'aktif' | 'sampah'>('aktif');
  const [period, setPeriod] = useState<'hari' | 'minggu' | 'bulan' | 'semua'>('hari');
  
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [deletedTransactions, setDeletedTransactions] = useState<Transaction[]>([]);
  
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState<number | null>(null);

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Edit state
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const token = localStorage.getItem('token');
  const isDummy = token === 'dummy-token-123';

  const fmt = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

  const fetchTransactions = useCallback(async () => {
    if (isDummy) {
      setAllTransactions([]);
      setDeletedTransactions([]);
      setBalance(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Fetch Active
      const res = await fetch(`http://${window.location.hostname}:4000/api/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setAllTransactions(json.data.transactions || []);
          setBalance(json.data.balance || 0);
        }
      }
      // Fetch Deleted
      const resDel = await fetch(`http://${window.location.hostname}:4000/api/transactions/deleted`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resDel.ok) {
        const jsonDel = await resDel.json();
        if (jsonDel.success) {
          setDeletedTransactions(jsonDel.data || []);
        }
      }
    } catch {
      setError('Tidak dapat terhubung ke server.');
    } finally {
      setLoading(false);
    }
  }, [token, isDummy]);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) { navigate('/login'); return; }
    fetchTransactions();
  }, [navigate, fetchTransactions]);

  const handleDelete = async (id: number) => {
    if (!confirm('Pindahkan transaksi ini ke riwayat sampah?')) return;
    setProcessingId(id);
    try {
      const res = await fetch(`http://${window.location.hostname}:4000/api/transactions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchTransactions(); // Refresh all
      } else {
        const err = await res.json();
        alert(err.message || 'Gagal menghapus transaksi.');
      }
    } catch {
      alert('Terjadi kesalahan koneksi.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRestore = async (id: number) => {
    if (!confirm('Pulihkan transaksi ini? Saldo Anda akan disesuaikan kembali.')) return;
    setProcessingId(id);
    try {
      const res = await fetch(`http://${window.location.hostname}:4000/api/transactions/${id}/restore`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchTransactions(); // Refresh all
      } else {
        const err = await res.json();
        alert(err.message || 'Gagal memulihkan transaksi.');
      }
    } catch {
      alert('Terjadi kesalahan koneksi.');
    } finally {
      setProcessingId(null);
    }
  };

  const openEditModal = (tx: Transaction) => {
    setEditingTx(tx);
    setEditAmount(tx.amount.toString());
    setEditCategory(tx.category);
    setEditDesc(tx.description || '');
  };

  const handleSaveEdit = async () => {
    if (!editingTx) return;
    setProcessingId(editingTx.id);
    try {
      const res = await fetch(`http://${window.location.hostname}:4000/api/transactions/${editingTx.id}`, {
        method: 'PUT',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: parseInt(editAmount, 10),
          category: editCategory,
          description: editDesc,
        })
      });
      if (res.ok) {
        setEditingTx(null);
        fetchTransactions(); // Refresh
      } else {
        const err = await res.json();
        alert(err.message || 'Gagal mengedit transaksi.');
      }
    } catch {
      alert('Terjadi kesalahan koneksi.');
    } finally {
      setProcessingId(null);
    }
  };

  // Filter berdasarkan periode (Hanya untuk yang aktif)
  const filterByPeriod = (txs: Transaction[]): Transaction[] => {
    const now = new Date();
    return txs.filter(t => {
      const date = new Date(t.createdAt);
      if (period === 'hari') return date.toDateString() === now.toDateString();
      if (period === 'minggu') {
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        return date >= weekAgo;
      }
      if (period === 'bulan') return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      return true;
    });
  };

  const currentTransactions = viewMode === 'aktif' ? filterByPeriod(allTransactions) : deletedTransactions;

  // All unique categories for the filter chips
  const allCategories = useMemo(() =>
    [...new Set(allTransactions.map(t => t.category))].sort(),
    [allTransactions]
  );

  // Apply search + category filter on top of period filter
  const displayedTransactions = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return currentTransactions.filter(t => {
      const matchSearch = !q ||
        t.description?.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q);
      const matchCat = !categoryFilter || t.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [currentTransactions, searchQuery, categoryFilter]);

  const periodIncome = displayedTransactions
    .filter(t => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);
  const periodExpense = displayedTransactions
    .filter(t => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);

  const savedUser = localStorage.getItem('user');
  const user = savedUser ? JSON.parse(savedUser) : null;
  const hasPremiumFeatures = user?.package && ['starter', 'premium', 'pro'].includes(user.package);

  return (
    <div className="min-h-screen bg-[#f1f5f9] pb-24 font-sans flex flex-col items-center">
      
      {/* MODAL EDIT */}
      {editingTx && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-slate-800">Edit Transaksi</h3>
              <button onClick={() => setEditingTx(null)} className="w-8 h-8 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-full flex items-center justify-center">
                <X size={18} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Nominal</label>
                <input 
                  type="number" 
                  value={editAmount}
                  onChange={e => setEditAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Kategori</label>
                <input 
                  type="text" 
                  value={editCategory}
                  onChange={e => setEditCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Keterangan</label>
                <textarea 
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  rows={3}
                />
              </div>
              <button
                onClick={handleSaveEdit}
                disabled={processingId === editingTx.id}
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl flex justify-center items-center gap-2 transition-colors disabled:opacity-50"
              >
                {processingId === editingTx.id && <Loader2 size={16} className="animate-spin" />}
                Simpan Perubahan
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Container */}
      <div className="w-full max-w-lg">
        
        {/* Header Title */}
        <header className="p-6 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">Manajemen Transaksi</h1>
          <button
            onClick={fetchTransactions}
            className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-orange-500 transition-colors shadow-sm"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </header>

        <main className="px-5 space-y-4">



          {/* Error state */}
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-3 flex items-center gap-3">
              <AlertCircle size={16} className="text-red-500 shrink-0" />
              <p className="text-xs text-red-600 font-medium">{error}</p>
            </div>
          )}
          
          {/* Active Mode Elements */}
          {viewMode === 'aktif' && (
            <>
              {/* 1. Saldo Card */}
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl p-6 text-white shadow-xl shadow-orange-100 relative overflow-hidden">
                <div className="flex items-center gap-2 text-white/80 text-xs font-semibold mb-3">
                  <span className="p-1 bg-white/20 rounded-full">💰</span>
                  <span>Saldo Total (Aktif)</span>
                  <Wallet size={16} className="ml-auto opacity-80" />
                </div>
                {loading ? (
                  <Loader2 size={20} className="animate-spin text-white/70 mb-4" />
                ) : (
                  <div className="text-3xl font-black mb-1 tracking-tight">
                    {fmt(balance)}
                  </div>
                )}
                <div className="text-[10px] text-white/70 font-medium">
                  {displayedTransactions.length} transaksi • periode {period === 'hari' ? 'hari ini' : period === 'minggu' ? 'minggu ini' : period === 'bulan' ? 'bulan ini' : 'semua'}
                </div>
                <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              </div>

              {/* Ringkasan periode */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50">
                  <p className="text-[10px] font-bold text-gray-400 mb-1 flex items-center gap-1"><TrendingUp size={10} /> Pemasukan</p>
                  <p className="text-base font-black text-orange-500">{loading ? '...' : fmt(periodIncome)}</p>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50">
                  <p className="text-[10px] font-bold text-gray-400 mb-1 flex items-center gap-1"><TrendingDown size={10} /> Pengeluaran</p>
                  <p className="text-base font-black text-rose-500">{loading ? '...' : fmt(periodExpense)}</p>
                </div>
              </div>

              {/* 2. Mode & Periode Tabs (Combined Area) */}
              <div className="space-y-3">
                {/* Mode Tabs */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode('aktif')}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex justify-center gap-2 items-center ${
                      viewMode === 'aktif' ? 'bg-orange-500 text-white shadow-md shadow-orange-200' : 'bg-white text-slate-500 border border-slate-200'
                    }`}
                  >
                    <List size={14} /> Transaksi Aktif
                  </button>
                  <button
                    onClick={() => setViewMode('sampah')}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex justify-center gap-2 items-center ${
                      viewMode === 'sampah' ? 'bg-slate-800 text-white shadow-md shadow-slate-200' : 'bg-white text-slate-500 border border-slate-200'
                    }`}
                  >
                    <Trash2 size={14} /> Riwayat Sampah
                  </button>
                </div>

                {/* Periode Tabs */}
                <div className="bg-white rounded-2xl p-1 shadow-sm border border-gray-100 flex items-center">
                  {(['hari', 'minggu', 'bulan', 'semua'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all capitalize ${
                        period === p ? 'bg-[#1e293b] text-white shadow-md' : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      {p === 'hari' ? 'Hari Ini' : p === 'minggu' ? 'Minggu' : p === 'bulan' ? 'Bulan' : 'Semua'}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {viewMode === 'sampah' && (
            <div className="bg-slate-100 border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center">
              <Trash2 size={24} className="text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-600">Riwayat Terhapus</p>
              <p className="text-[10px] text-slate-400 mt-1">Transaksi di sini tidak dihitung ke dalam Saldo Total Anda.</p>
            </div>
          )}

          {/* Search & Filter */}
          {viewMode === 'aktif' && (
            <div className="space-y-3">
              {/* Search bar */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari transaksi..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(f => !f)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm transition-colors ${
                    showFilters || categoryFilter
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-white text-gray-500 border-gray-200'
                  }`}
                >
                  <SlidersHorizontal size={16} />
                </button>
              </div>

              {/* Category chips */}
              <AnimatePresence>
                {(showFilters || categoryFilter) && allCategories.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      <button
                        onClick={() => setCategoryFilter('')}
                        className={`shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                          !categoryFilter ? 'bg-orange-500 text-white' : 'bg-white text-gray-500 border border-gray-200'
                        }`}
                      >
                        Semua
                      </button>
                      {allCategories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => setCategoryFilter(cat === categoryFilter ? '' : cat)}
                          className={`shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                            categoryFilter === cat ? 'bg-orange-500 text-white' : 'bg-white text-gray-500 border border-gray-200'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Result count */}
              {(searchQuery || categoryFilter) && (
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-bold text-gray-400">
                    {displayedTransactions.length} hasil ditemukan
                  </span>
                  <button
                    onClick={() => { setSearchQuery(''); setCategoryFilter(''); }}
                    className="text-[10px] font-bold text-orange-500 underline"
                  >
                    Reset filter
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Keterangan fitur */}
          {!hasPremiumFeatures && !isDummy && (
            <div className="flex items-center gap-2 text-[10px] text-slate-400 px-1 bg-slate-100 p-2 rounded-lg">
              <AlertCircle size={12} className="text-orange-500" />
              Fitur Edit & Hapus transaksi hanya tersedia untuk Paket Starter ke atas.
              <button onClick={() => navigate('/pilih-paket')} className="text-orange-500 font-bold underline">Upgrade</button>
            </div>
          )}

          {/* 3. Daftar Transaksi */}
          <div className="space-y-3 min-h-[200px] mt-2">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-16 gap-3"
                >
                  <Loader2 size={28} className="animate-spin text-orange-400" />
                  <p className="text-xs text-gray-400">Memuat transaksi...</p>
                </motion.div>
              ) : displayedTransactions.length === 0 ? (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-16 space-y-2 opacity-50"
                >
                  <p className="text-2xl">{viewMode === 'sampah' ? '🗑️' : '📭'}</p>
                  <p className="text-sm font-medium text-gray-500">Belum ada transaksi</p>
                  <p className="text-xs text-gray-400">
                    {viewMode === 'sampah' ? 'Tempat sampah kosong' : 'Mulai catat via WhatsApp'}
                  </p>
                </motion.div>
              ) : (
                <motion.div 
                  key={viewMode + period}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
                >
                  {displayedTransactions.map((tx) => (
                    <div key={tx.id} className="rounded-2xl p-4 shadow-sm border bg-white border-gray-50 flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          tx.type === 'income' ? 'bg-orange-50 text-orange-500' : 'bg-rose-50 text-rose-500'
                        } ${viewMode === 'sampah' ? 'grayscale opacity-60' : ''}`}>
                          {tx.type === 'income' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                        </div>
                        <div>
                          <p className={`text-sm font-bold ${viewMode === 'sampah' ? 'text-slate-500 line-through' : 'text-gray-800'}`}>
                            {tx.description || tx.category}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">{tx.category}</span>
                            <span className="text-[10px] text-gray-300">•</span>
                            <span className="text-[10px] text-gray-400 flex items-center gap-1">
                              <Clock size={10} />
                              {new Date(tx.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className={`text-sm font-black ${tx.type === 'income' ? 'text-orange-500' : 'text-gray-800'} ${viewMode === 'sampah' ? 'opacity-50' : ''}`}>
                          {tx.type === 'income' ? '+' : '-'} {fmt(tx.amount)}
                        </p>
                        
                        {/* Aksi */}
                        {hasPremiumFeatures && (
                          <div className="flex gap-1">
                            {viewMode === 'aktif' ? (
                              <>
                                <button
                                  onClick={() => openEditModal(tx)}
                                  className="w-8 h-8 rounded-xl bg-blue-50 text-blue-500 hover:bg-blue-100 hover:text-blue-600 flex items-center justify-center transition-colors"
                                  title="Edit Transaksi"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  onClick={() => handleDelete(tx.id)}
                                  disabled={processingId === tx.id}
                                  className="w-8 h-8 rounded-xl bg-rose-50 text-rose-400 hover:bg-rose-100 hover:text-rose-600 flex items-center justify-center transition-colors disabled:opacity-50"
                                  title="Hapus Transaksi"
                                >
                                  {processingId === tx.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleRestore(tx.id)}
                                disabled={processingId === tx.id}
                                className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-500 hover:bg-emerald-100 hover:text-emerald-600 flex items-center justify-center transition-colors shadow-sm disabled:opacity-50"
                                title="Pulihkan Transaksi"
                              >
                                {processingId === tx.id ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </main>
      </div>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 flex justify-between items-center z-50">
        <NavItem 
          icon={<Home size={20} />} 
          label="Beranda" 
          active={activeTab === 'beranda'} 
          onClick={() => { setActiveTab('beranda'); navigate('/dashboard'); }} 
        />
        <NavItem 
          icon={<List size={20} />} 
          label="Transaksi" 
          active={activeTab === 'transaksi'} 
          onClick={() => setActiveTab('transaksi')} 
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
