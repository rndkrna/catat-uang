import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Download, Users, Zap, Crown, Rocket, ArrowLeft } from 'lucide-react';

export default function PaketDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/transactions/export', {
        headers: { Authorization: `Bearer ${token}` },
      });

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

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      navigate('/login');
    } else {
      const u = JSON.parse(savedUser);
      if (!u.package || u.package === 'free') {
        navigate('/pilih-paket');
      } else {
        setUser(u);
      }
    }
  }, [navigate]);

  if (!user) return null;

  // Determine theme based on package
  let theme = {
    bg: 'bg-orange-50',
    text: 'text-orange-900',
    primary: 'bg-orange-600',
    primaryText: 'text-orange-600',
    border: 'border-orange-200',
    icon: <Zap size={40} className="text-orange-600" />
  };

  if (user.package === 'premium') {
    theme = {
      bg: 'bg-blue-50',
      text: 'text-blue-900',
      primary: 'bg-blue-600',
      primaryText: 'text-blue-600',
      border: 'border-blue-200',
      icon: <ShieldCheck size={40} className="text-blue-600" />
    };
  } else if (user.package === 'pro') {
    theme = {
      bg: 'bg-amber-50',
      text: 'text-amber-900',
      primary: 'bg-amber-500',
      primaryText: 'text-amber-600',
      border: 'border-amber-200',
      icon: <Rocket size={40} className="text-amber-600" />
    };
  }

  return (
    <div className={`min-h-screen ${theme.bg} font-sans`}>
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/dashboard')}
              className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-black text-slate-900">Fitur Eksklusif</h1>
          </div>
          <div className={`px-4 py-1.5 rounded-full ${theme.bg} ${theme.primaryText} border ${theme.border} text-xs font-black uppercase tracking-wider flex items-center gap-2`}>
            {user.package === 'pro' && <Crown size={14} />}
            Paket {user.package}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="bg-white rounded-[32px] p-8 md:p-12 shadow-sm border border-slate-100 mb-8 flex flex-col md:flex-row items-center gap-8 text-center md:text-left relative overflow-hidden">
          <div className="relative z-10 w-24 h-24 rounded-3xl bg-slate-50 shadow-inner flex items-center justify-center shrink-0 border-2 border-white">
            {theme.icon}
          </div>
          <div className="relative z-10">
            <h2 className={`text-3xl font-black ${theme.text} mb-2`}>Selamat Datang di Layanan {user.package.toUpperCase()}</h2>
            <p className="text-slate-600 font-medium">Anda sekarang dapat menikmati seluruh fitur unggulan yang tersedia pada paket ini.</p>
          </div>
          <div className={`absolute -right-20 -bottom-20 w-64 h-64 ${theme.primary} opacity-5 rounded-full blur-[40px] pointer-events-none`}></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Export Feature */}
          <div className="bg-white rounded-[24px] p-8 border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
            <div className={`w-14 h-14 rounded-2xl ${theme.bg} ${theme.primaryText} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
              <Download size={24} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Export Data Laporan</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              Unduh laporan keuangan Anda dalam format CSV atau PDF. Sangat cocok untuk diolah kembali di Excel atau untuk pelaporan bisnis.
            </p>
            <button 
              onClick={handleExport}
              className={`w-full py-3 rounded-xl font-bold text-sm bg-slate-50 text-slate-700 hover:${theme.primary} hover:text-white transition-colors border border-slate-200 hover:border-transparent`}>
              Download CSV Sekarang
            </button>
          </div>

          {/* Tim/Pasangan Feature */}
          <div className="bg-white rounded-[24px] p-8 border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
            <div className={`w-14 h-14 rounded-2xl ${theme.bg} ${theme.primaryText} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
              <Users size={24} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Manajemen Anggota</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              Tambahkan nomor WhatsApp pasangan atau anggota tim agar mereka bisa ikut mencatat pemasukan dan pengeluaran secara tersinkronisasi.
            </p>
            <button className={`w-full py-3 rounded-xl font-bold text-sm bg-slate-50 text-slate-700 hover:${theme.primary} hover:text-white transition-colors border border-slate-200 hover:border-transparent`}>
              Kelola Anggota Tim
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
