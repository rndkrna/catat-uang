import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Clock, ArrowLeft, MessageCircle } from 'lucide-react';

export default function MenungguKonfirmasi() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#fcfcfd] flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-[32px] p-8 shadow-xl shadow-orange-100/50 border border-slate-100 text-center relative overflow-hidden">
        {/* Decor */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-orange-50 rounded-full blur-[60px] pointer-events-none"></div>
        
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.4 }}
          className="relative z-10"
        >
          <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
            >
              <Clock size={40} className="text-orange-500" />
            </motion.div>
          </div>
          
          <h1 className="text-2xl font-black text-slate-900 mb-2">Menunggu Konfirmasi</h1>
          <p className="text-slate-500 font-medium mb-8">
            Pembayaran Anda sedang kami proses. Mohon tunggu admin melakukan pengecekan maksimal 1x24 jam.
          </p>

          <div className="bg-orange-50 rounded-2xl p-4 mb-8 text-left flex items-start gap-3 border border-orange-100">
            <div className="mt-1 text-orange-500"><MessageCircle size={20} /></div>
            <div>
              <p className="text-sm font-bold text-orange-900 mb-1">Ingin proses lebih cepat?</p>
              <p className="text-xs text-orange-700 mb-3">Anda bisa menghubungi admin via WhatsApp dengan melampirkan bukti transfer.</p>
              <button 
                onClick={() => window.open('https://wa.me/15556459494?text=Halo%20Admin,%20saya%20sudah%20melakukan%20pembayaran%20untuk%20berlangganan.%20Tolong%20dicek%20ya!', '_blank')}
                className="text-xs font-black bg-orange-500 text-white px-4 py-2 rounded-xl hover:bg-orange-600 transition-colors"
              >
                Chat Admin Sekarang
              </button>
            </div>
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft size={18} />
            Kembali ke Beranda
          </button>
        </motion.div>
      </div>
    </div>
  );
}
