import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Users, Loader2, AlertCircle } from 'lucide-react';

export default function Partner() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [partnerPhones, setPartnerPhones] = useState<string[]>([]);
  const [isSavingPartner, setIsSavingPartner] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!savedUser) { navigate('/login'); return; }
    
    const parsedUser = JSON.parse(savedUser);
    setUser(parsedUser);
    
    const maxPMap: Record<string, number> = { starter: 1, premium: 2, pro: 4 };
    const currentMaxPartners = maxPMap[parsedUser.package] || 0;
    const phones = parsedUser.partnerPhone ? parsedUser.partnerPhone.split(',') : [];
    setPartnerPhones(Array.from({ length: currentMaxPartners }, (_, idx) => phones[idx] || ''));

    // Fetch latest user data
    if (token && token !== 'dummy-token-123') {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(json => {
          if (json.success && json.data?.user) {
            localStorage.setItem('user', JSON.stringify(json.data.user));
            setUser(json.data.user);
            const newMax = maxPMap[json.data.user.package] || 0;
            const newPhones = json.data.user.partnerPhone ? json.data.user.partnerPhone.split(',') : [];
            setPartnerPhones(Array.from({ length: newMax }, (_, idx) => newPhones[idx] || ''));
          }
        })
        .catch(err => console.error('Failed to fetch user profile', err));
    }
  }, [navigate]);

  const handleSavePartner = async () => {
    setIsSavingPartner(true);
    setError('');
    const cleanPhones = partnerPhones
      .map(p => p.trim())
      .filter(p => p.length > 0)
      .join(',');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/auth/partner', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ partnerPhone: cleanPhones })
      });
      const resData = await res.json();
      if (resData.success) {
        alert('Sukses menyimpan nomor pasangan/tim!');
        setUser({ ...user, partnerPhone: resData.partnerPhone });
        localStorage.setItem('user', JSON.stringify({ ...user, partnerPhone: resData.partnerPhone }));
      } else {
        setError(resData.message || 'Gagal menyimpan');
      }
    } catch (err) {
      setError('Terjadi kesalahan jaringan');
    }
    setIsSavingPartner(false);
  };

  const maxPartnersMap: Record<string, number> = {
    starter: 1,
    premium: 2,
    pro: 4
  };
  const maxPartners = user ? (maxPartnersMap[user.package] || 0) : 0;
  const isPremium = user && ['starter', 'premium', 'pro'].includes(user.package);

  return (
    <div className="min-h-screen bg-[#f1f5f9] pb-24 font-sans flex flex-col items-center">
      <div className="w-full max-w-lg">
        {/* Header Title */}
        <header className="p-6 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-800 shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-gray-800">Kelola Anggota Tim</h1>
        </header>

        <main className="px-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-3 flex items-center gap-3">
              <AlertCircle size={16} className="text-red-500 shrink-0" />
              <p className="text-xs text-red-600 font-medium">{error}</p>
            </div>
          )}

          {!isPremium ? (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 text-center">
              <Users size={48} className="text-orange-200 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-800 mb-2">Fitur Premium</h3>
              <p className="text-sm text-gray-500 mb-6">Paket Anda saat ini tidak mendukung fitur Kelola Pasangan / Tim. Silakan tingkatkan paket Anda untuk menikmati fitur ini.</p>
              <button onClick={() => navigate('/pilih-paket')} className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl shadow-md shadow-orange-200 hover:from-orange-600 hover:to-orange-700 transition-all">
                Upgrade Paket
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <Users size={16} className="text-orange-500" />
                  {maxPartners === 1 ? 'Kelola Akun Pasangan' : 'Kelola Anggota Tim'}
                </h3>
                <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">Aktif</span>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                {maxPartners === 1
                  ? 'Masukkan nomor WhatsApp pasangan Anda. Segala pencatatan transaksi dari nomor ini akan otomatis memotong saldo bersama Anda.'
                  : `Masukkan hingga ${maxPartners} nomor WhatsApp anggota tim Anda. Segala pencatatan transaksi dari nomor-nomor ini akan terpusat ke saldo Anda.`}
              </p>
              
              <div className="space-y-3">
                {partnerPhones.map((phone, idx) => (
                  <div key={idx}>
                    <label htmlFor={`partner-phone-${idx}`} className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">
                      {maxPartners === 1 ? 'Nomor WA Pasangan' : `Nomor WA Anggota #${idx + 1}`}
                    </label>
                    <input
                      id={`partner-phone-${idx}`}
                      type="text"
                      placeholder="Contoh: 628123456789"
                      value={phone}
                      onChange={(e) => {
                        const updated = [...partnerPhones];
                        updated[idx] = e.target.value;
                        setPartnerPhones(updated);
                      }}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
                    />
                  </div>
                ))}
                
                <button 
                  onClick={handleSavePartner}
                  disabled={isSavingPartner}
                  className="w-full py-2.5 bg-orange-500 text-white rounded-xl text-xs font-bold hover:bg-orange-600 transition-colors shadow-md shadow-orange-100 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSavingPartner && <Loader2 size={14} className="animate-spin" />}
                  {isSavingPartner ? 'Menyimpan...' : maxPartners === 1 ? 'Simpan Nomor Pasangan' : 'Simpan Anggota Tim'}
                </button>
                {user?.partnerPhone && (
                  <p className="text-[10px] text-green-600 font-medium text-center bg-green-50 p-2 rounded-lg">
                    Nomor {user.partnerPhone.split(',').join(', ')} saat ini terhubung. Pasangan/anggota tim Anda dapat langsung mencatat transaksi via WhatsApp!
                  </p>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
