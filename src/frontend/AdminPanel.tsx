import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Check, Loader2, RefreshCw, Lock, Eye, EyeOff, LogOut } from 'lucide-react';

// Password admin — ganti sesuai kebutuhan
const ADMIN_PASSWORD = 'admin@tulisduit2025';
const ADMIN_SESSION_KEY = 'admin_authenticated';

export default function AdminPanel() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');

  const [payments, setPayments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'payments' | 'users'>('payments');
  const [updatingUser, setUpdatingUser] = useState<number | null>(null);

  // Cek session admin
  useEffect(() => {
    const auth = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (auth === 'true') setIsAuthenticated(true);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Password salah. Coba lagi.');
      setPasswordInput('');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    setIsAuthenticated(false);
    setPayments([]);
  };

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/api/payments');
      const data = await res.json();
      if (data.success) {
        setPayments(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    }
    setLoading(false);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/api/admin/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === 'payments') fetchPayments();
      if (activeTab === 'users') fetchUsers();
    }
  }, [isAuthenticated, activeTab]);

  const handleApprove = async (id: number) => {
    if (!confirm('Anda yakin ingin meng-approve pembayaran ini?')) return;
    
    setApproving(id);
    try {
      const res = await fetch(`http://localhost:4000/api/payments/${id}/approve`, {
        method: 'POST'
      });
      if (res.ok) {
        setPayments(payments.filter(p => p.id !== id));
      } else {
        alert('Gagal melakukan approve');
      }
    } catch (error) {
      alert('Terjadi kesalahan jaringan');
    }
    setApproving(null);
  };

  const handleUpdatePackage = async (userId: number, newPkg: string) => {
    if (!confirm(`Ubah paket user ini menjadi ${newPkg.toUpperCase()}?`)) return;
    
    setUpdatingUser(userId);
    try {
      const res = await fetch(`http://localhost:4000/api/admin/users/${userId}/package`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ package: newPkg })
      });
      if (res.ok) {
        // Refresh users
        fetchUsers();
        alert('Paket berhasil diubah!');
      } else {
        alert('Gagal mengubah paket');
      }
    } catch (error) {
      alert('Terjadi kesalahan jaringan');
    }
    setUpdatingUser(null);
  };

  // --- LOGIN SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock size={28} className="text-orange-600" />
            </div>
            <h1 className="text-2xl font-black text-slate-900">Admin Panel</h1>
            <p className="text-slate-500 text-sm mt-1">Tulis Duit — Akses Terbatas</p>
          </div>

          <form onSubmit={handleLogin} className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
            {authError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl">
                {authError}
              </div>
            )}
            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-700 mb-2">Password Admin</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Masukkan password admin"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm pr-12"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700 transition-colors"
            >
              Masuk ke Admin Panel
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-6">
            Halaman ini hanya untuk admin Tulis Duit.
          </p>
        </div>
      </div>
    );
  }

  // --- ADMIN DASHBOARD ---
  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
              <Shield className="text-orange-600" size={32} />
              Admin Dashboard
            </h1>
            <p className="text-slate-500 font-medium mt-1">Manajemen Persetujuan Upgrade Paket</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={activeTab === 'payments' ? fetchPayments : fetchUsers}
              className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-50 border border-red-100 px-4 py-2 rounded-xl text-sm font-bold text-red-600 hover:bg-red-100 transition-colors"
            >
              <LogOut size={16} />
              Keluar
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
              activeTab === 'payments' 
                ? 'bg-orange-600 text-white' 
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Approval Pembayaran
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
              activeTab === 'users' 
                ? 'bg-orange-600 text-white' 
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Kelola User
          </button>
        </div>

        {/* Tab Content: Payments */}
        {activeTab === 'payments' && (
          <>
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center">
                <p className="text-3xl font-black text-orange-600">{payments.length}</p>
                <p className="text-xs text-slate-500 font-bold mt-1">Menunggu Approval</p>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center">
                <p className="text-3xl font-black text-slate-900">
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0, notation: 'compact' }).format(
                    payments.reduce((s, p) => s + p.amount, 0)
                  )}
                </p>
                <p className="text-xs text-slate-500 font-bold mt-1">Total Nominal Pending</p>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center">
                <p className="text-3xl font-black text-green-600">
                  {new Set(payments.map(p => p.userPhone)).size}
                </p>
                <p className="text-xs text-slate-500 font-bold mt-1">User Berbeda</p>
              </div>
            </div>

            <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold border-b border-slate-100">
                      <th className="px-6 py-4">ID</th>
                      <th className="px-6 py-4">Pengguna</th>
                      <th className="px-6 py-4">Paket Tujuan</th>
                      <th className="px-6 py-4">Nominal</th>
                      <th className="px-6 py-4">Waktu Request</th>
                      <th className="px-6 py-4">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading && payments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                          <Loader2 size={24} className="animate-spin mx-auto mb-2" />
                          Memuat data pembayaran...
                        </td>
                      </tr>
                    ) : payments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                          ✅ Semua pembayaran sudah diproses. Tidak ada yang menunggu.
                        </td>
                      </tr>
                    ) : (
                      payments.map(payment => (
                        <tr key={payment.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-slate-900">#{payment.id}</td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-bold text-slate-900">{payment.userName || 'Tanpa Nama'}</p>
                            <p className="text-xs text-slate-500">{payment.userPhone}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800 uppercase tracking-wider">
                              {payment.package}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-slate-900">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(payment.amount)}
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500">
                            {new Date(payment.createdAt).toLocaleString('id-ID')}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleApprove(payment.id)}
                              disabled={approving === payment.id}
                              className="flex items-center gap-1.5 bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-600 transition-colors disabled:opacity-50"
                            >
                              {approving === payment.id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Check size={14} />
                              )}
                              ACC / Setuju
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Tab Content: Users */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold border-b border-slate-100">
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Nomor WhatsApp</th>
                    <th className="px-6 py-4">Paket Saat Ini</th>
                    <th className="px-6 py-4">Aksi (Ubah Paket)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading && users.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                        <Loader2 size={24} className="animate-spin mx-auto mb-2" />
                        Memuat data pengguna...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">
                        Belum ada pengguna terdaftar.
                      </td>
                    </tr>
                  ) : (
                    users.map(user => (
                      <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">#{user.id}</td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-slate-900">{user.phoneNumber}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                            user.package === 'premium' || user.package === 'pro' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-slate-100 text-slate-800'
                          }`}>
                            {user.package}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {['free', 'lite', 'starter', 'premium', 'pro'].map(pkg => (
                              <button
                                key={pkg}
                                onClick={() => handleUpdatePackage(user.id, pkg)}
                                disabled={updatingUser === user.id || user.package === pkg}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                  user.package === pkg
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                {pkg.toUpperCase()}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
}
