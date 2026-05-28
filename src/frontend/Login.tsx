import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Lock, Lightbulb, ArrowLeft, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [waNumber, setWaNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Normalisasi nomor: hilangkan +, spasi, dash — pastikan diawali 62
  const normalizePhone = (num: string): string => {
    let n = num.replace(/[\s\-+]/g, '');
    if (n.startsWith('0')) n = '62' + n.slice(1);
    if (!n.startsWith('62')) n = '62' + n;
    return n;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const normalized = normalizePhone(waNumber);
    if (normalized.length < 10 || normalized.length > 15) {
      setError('Nomor WhatsApp tidak valid. Contoh: 08123456789 atau 628123456789');
      return;
    }
    if (password.length < 6) {
      setError('Password minimal 6 karakter.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`http://${window.location.hostname}:4000/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: normalized,
          password: password,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        localStorage.setItem('token', result.data.token);
        localStorage.setItem('user', JSON.stringify(result.data.user));
        navigate('/dashboard');
      } else {
        setError(result.message || 'Login gagal. Nomor WA atau password salah.');
      }
    } catch (err) {
      setError('Tidak dapat terhubung ke server. Pastikan backend sudah berjalan.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      <div className="max-w-md mx-auto px-6 py-12">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="text-sm">Kembali</span>
        </button>

        {/* Logo Section */}
        <div className="text-center mb-8">
          <img src="/images/favicon.png" alt="Tulis Duit" className="w-20 h-20 mx-auto mb-4 rounded-2xl shadow-sm object-cover" />
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Tulis Duit</h1>
          <p className="text-gray-500 text-sm">Kelola keuangan via WhatsApp</p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <form onSubmit={handleSubmit}>
            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl">
                {error}
              </div>
            )}

            {/* WhatsApp Number */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nomor WhatsApp
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Phone size={16} />
                </div>
                <input
                  type="tel"
                  value={waNumber}
                  onChange={(e) => setWaNumber(e.target.value)}
                  placeholder="08123456789"
                  disabled={isLoading}
                  required
                  className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm disabled:opacity-50"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Format: 08xxx, 628xxx, atau +628xxx</p>
            </div>

            {/* Password */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                  required
                  minLength={6}
                  className="w-full pl-9 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Memproses...
                </>
              ) : (
                'Masuk'
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Belum punya akun?{' '}
              <a
                href="https://wa.me/15556459494?text=Halo%2C+saya+ingin+daftar+Tulis+Duit"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-600 hover:text-orange-700 font-medium"
              >
                Chat WhatsApp untuk daftar
              </a>
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Kirim pesan pertama untuk membuat akun otomatis
            </p>
          </div>

          {/* Terms */}
          <p className="text-xs text-gray-400 text-center mt-4">
            Dengan mendaftar, Anda menyetujui{' '}
            <a href="/Syarat" className="text-orange-600 hover:text-orange-700 underline">
              Syarat & Ketentuan
            </a>
          </p>
        </div>

        {/* Tips Section */}
        <div className="flex items-start gap-3 mb-8 px-2">
          <Lightbulb size={16} className="text-yellow-500 mt-0.5 shrink-0" />
          <p className="text-sm text-gray-600">
            Tips: Password Anda dikirimkan otomatis melalui WhatsApp saat pertama mendaftar.
          </p>
        </div>

        {/* Contact Section */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Kontak & Pusat Bantuan:</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <span className="text-gray-500 w-20 shrink-0">Email:</span>
              <a href="mailto:fauzanalditester@gmail.com" className="text-orange-600 hover:underline">
                fauzanalditester@gmail.com
              </a>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-500 w-20 shrink-0">Telepon:</span>
              <a href="tel:083844570735" className="text-orange-600">083844570735</a>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-500 w-20 shrink-0">Alamat:</span>
              <span className="text-gray-600 text-xs leading-relaxed">
                Jl. R.A. Kartini, Batu IX, Kec. Tanjungpinang Timur., Kota Tanjung Pinang, Kepulauan Riau 29125
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
