import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  MessageCircle, 
  Wallet, 
  Lock, 
  LogOut, 
  ChevronRight,
  Home,
  List,
  Settings as SettingsIcon,
  X,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

// --- Modal Ubah Password ---
function ChangePasswordModal({ onClose, user }: { onClose: () => void; user: any }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password baru minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        setTimeout(() => onClose(), 2000);
      } else {
        setError(data.message || 'Gagal mengubah password.');
      }
    } catch {
      setError('Tidak dapat terhubung ke server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 z-10"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">Ubah Password</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200">
            <X size={16} />
          </button>
        </div>

        {success ? (
          <div className="text-center py-6">
            <CheckCircle size={40} className="text-green-500 mx-auto mb-3" />
            <p className="text-sm font-bold text-green-700">Password berhasil diubah!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Password Lama</label>
              <div className="relative">
                <input
                  type={showOld ? 'text' : 'password'}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                />
                <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showOld ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Password Baru</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 6 karakter"
                  required
                  minLength={6}
                  className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Konfirmasi Password Baru</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password baru"
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl font-bold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 size={16} className="animate-spin" /> Menyimpan...</> : 'Simpan Password Baru'}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}

// --- Modal Saldo Awal ---
function SetSaldoModal({ onClose, currentUser }: { onClose: () => void; currentUser: any }) {
  const [saldo, setSaldo] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Format tampilan rupiah saat user mengetik
  const handleSaldoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    setSaldo(raw);
  };

  const formattedSaldo = saldo
    ? new Intl.NumberFormat('id-ID').format(Number(saldo))
    : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saldo || Number(saldo) < 0) {
      setError('Masukkan nominal saldo yang valid (boleh 0).');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'income',
          amount: Number(saldo),
          category: 'Saldo Awal',
          description: 'Saldo awal yang disetel manual',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        setTimeout(() => onClose(), 2000);
      } else {
        setError(data.message || 'Gagal menyimpan saldo.');
      }
    } catch {
      setError('Tidak dapat terhubung ke server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 z-10"
      >
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-gray-900">Set Saldo Awal</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200">
            <X size={16} />
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-5">
          Masukkan jumlah uang yang sudah Anda miliki saat ini agar saldo awal tercatat dengan benar.
        </p>

        {success ? (
          <div className="text-center py-6">
            <CheckCircle size={40} className="text-green-500 mx-auto mb-3" />
            <p className="text-sm font-bold text-green-700">Saldo awal berhasil disimpan!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nominal Saldo (Rp)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">Rp</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formattedSaldo}
                  onChange={handleSaldoChange}
                  placeholder="0"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-bold"
                />
              </div>
              {saldo && (
                <p className="text-xs text-gray-400 mt-1">
                  = Rp {new Intl.NumberFormat('id-ID').format(Number(saldo))}
                </p>
              )}
            </div>

            <div className="bg-orange-50 rounded-xl p-3">
              <p className="text-xs text-orange-700">
                ⚠️ Saldo awal akan dicatat sebagai pemasukan dengan kategori "Saldo Awal". Sebaiknya diisi hanya sekali.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl font-bold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 size={16} className="animate-spin" /> Menyimpan...</> : 'Simpan Saldo Awal'}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}

// --- Main Settings Component ---
export default function Settings() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showSaldo, setShowSaldo] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      navigate('/login');
    } else {
      setUser(JSON.parse(savedUser));
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) return null;

  const packageLabel = user.package
    ? user.package.charAt(0).toUpperCase() + user.package.slice(1)
    : 'Free';

  return (
    <>
      <AnimatePresence>
        {showChangePassword && (
          <ChangePasswordModal onClose={() => setShowChangePassword(false)} user={user} />
        )}
        {showSaldo && (
          <SetSaldoModal onClose={() => setShowSaldo(false)} currentUser={user} />
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-[#f8fafc] pb-32 font-sans flex flex-col items-center">
        {/* Container */}
        <div className="w-full max-w-lg px-6">
          
          {/* Header */}
          <header className="py-8 text-center">
            <h1 className="text-xl font-bold text-gray-800">Pengaturan</h1>
          </header>

          <main className="space-y-4">
            
            {/* Profile Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center">
                  <User size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{user.name || 'Pengguna'}</h3>
                  <p className="text-sm text-gray-500">{user.phoneNumber}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-50">
                <p className="text-xs font-medium text-gray-400">
                  Tier: <span className="text-orange-500 font-bold capitalize">{user.package || 'free'}</span>
                  {user.packageExpiresAt && (
                    <span className="ml-2 text-gray-400">
                      (aktif hingga {new Date(user.packageExpiresAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })})
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Menu Items */}
            <div className="space-y-3">
              
              {/* WhatsApp Bot */}
              <a
                href="https://wa.me/15556459494"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between group hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="text-orange-500">
                    <MessageCircle size={22} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">WhatsApp Bot</h4>
                    <p className="text-[10px] text-gray-400">Chat untuk catat transaksi</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-orange-600">Buka</span>
              </a>

              {/* Saldo Awal */}
              <button
                onClick={() => setShowSaldo(true)}
                className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between group cursor-pointer hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="text-orange-500">
                    <Wallet size={22} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">Saldo Awal</h4>
                    <p className="text-[10px] text-gray-400">Set saldo awal akun Anda</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-300" />
              </button>

              {/* Ubah Password */}
              <button
                onClick={() => setShowChangePassword(true)}
                className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between group cursor-pointer hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="text-gray-400">
                    <Lock size={22} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">Ubah Password</h4>
                    <p className="text-[10px] text-gray-400">Perbarui password akun</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-300" />
              </button>

              {/* Upgrade Paket (jika bukan Pro) */}
              {user.package !== 'pro' && (
                <button
                  onClick={() => navigate('/pilih-paket')}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-4 shadow-sm border border-orange-400 flex items-center justify-between group hover:from-orange-600 hover:to-orange-700 transition-all text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-white">
                      <Wallet size={22} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {user.package === 'free' ? 'Upgrade ke Paket Berbayar' : 'Tingkatkan Paket'}
                      </h4>
                      <p className="text-[10px] text-white/80">Mulai dari Rp15.000/bulan</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-white/70" />
                </button>
              )}

              {/* Keluar */}
              <button 
                onClick={handleLogout}
                className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 group hover:bg-rose-50 transition-colors text-left"
              >
                <div className="text-rose-500">
                  <LogOut size={22} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-rose-500">Keluar</h4>
                  <p className="text-[10px] text-gray-400">Logout dari akun</p>
                </div>
              </button>

            </div>

            {/* Footer Info */}
            <div className="pt-8 text-center space-y-1">
              <p className="text-[10px] font-bold text-gray-400">Tulis Duit v1.0.0</p>
              <p className="text-[10px] text-gray-300">Pencatatan keuangan via WhatsApp</p>
            </div>

          </main>
        </div>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 flex justify-between items-center z-50">
          <NavItem 
            icon={<Home size={20} />} 
            label="Beranda" 
            onClick={() => navigate('/dashboard')} 
          />
          <NavItem 
            icon={<List size={20} />} 
            label="Transaksi" 
            onClick={() => navigate('/transactions')} 
          />
          <NavItem 
            icon={<SettingsIcon size={20} />} 
            label="Pengaturan" 
            active 
            onClick={() => {}} 
          />
        </nav>
      </div>
    </>
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
