import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function Syarat() {
  console.log('[Syarat] Component rendering');
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white font-sans">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Back Button */}
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="text-sm">Kembali</span>
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Syarat & Ketentuan</h1>
          <p className="text-gray-500 text-sm">Tulis Duit Via WhatsApp</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Pendahuluan</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Tulis Duit Via WhatsApp adalah layanan pencatatan keuangan sederhana melalui WhatsApp yang ditujukan untuk kebutuhan personal dan usaha mikro/kecil. Dengan menggunakan layanan ini, pengguna dianggap telah membaca, memahami, dan menyetujui ketentuan layanan serta kebijakan privasi berikut.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Ruang Lingkup Layanan</h2>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              Layanan  Tulis Duit Via WhatsApp memungkinkan pengguna untuk:
            </p>
            <ul className="text-sm text-gray-600 leading-relaxed list-disc list-inside space-y-1">
              <li>Mencatat pemasukan dan pengeluaran</li>
              <li>Melihat kembali ringkasan dan riwayat catatan keuangan</li>
              <li>Mengelola catatan keuangan pribadi melalui WhatsApp</li>
            </ul>
            <p className="text-sm text-gray-600 leading-relaxed mt-3">
              Layanan ini bukan aplikasi akuntansi resmi dan tidak menggantikan pencatatan keuangan profesional.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Data yang Dikumpulkan</h2>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              Kami mengumpulkan data yang diperlukan untuk menjalankan layanan, yaitu:
            </p>
            <ul className="text-sm text-gray-600 leading-relaxed list-disc list-inside space-y-1">
              <li>Nomor WhatsApp pengguna</li>
              <li>Data transaksi yang dikirim oleh pengguna (pemasukan, pengeluaran, catatan)</li>
              <li>Waktu dan tanggal pencatatan</li>
            </ul>
            <p className="text-sm text-gray-600 leading-relaxed mt-3">
              Kami tidak mengumpulkan data seperti KTP, rekening bank, password, atau data sensitif lainnya.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Penggunaan Data</h2>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              Data pengguna digunakan hanya untuk:
            </p>
            <ul className="text-sm text-gray-600 leading-relaxed list-disc list-inside space-y-1">
              <li>Menyimpan dan menampilkan kembali catatan keuangan pengguna</li>
              <li>Menjalankan fitur utama layanan</li>
            </ul>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              Data tidak digunakan untuk:
            </p>
            <ul className="text-sm text-gray-600 leading-relaxed list-disc list-inside space-y-1">
              <li>Iklan</li>
              <li>Analisis komersial</li>
              <li>Penjualan data kepada pihak ketiga</li>
              <li>Kepentingan di luar fungsi layanan</li>
            </ul>
            <p className="text-sm text-gray-600 leading-relaxed mt-3">
              Owner aplikasi tidak membaca atau memantau isi catatan keuangan pengguna secara manual.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Keamanan Data</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Kami berupaya menjaga keamanan data pengguna melalui pengelolaan sistem yang wajar dan bertanggung jawab. Namun, pengguna memahami bahwa tidak ada sistem digital yang sepenuhnya bebas dari risiko gangguan teknis.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Tanggung Jawab Pengguna</h2>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              Pengguna bertanggung jawab penuh atas:
            </p>
            <ul className="text-sm text-gray-600 leading-relaxed list-disc list-inside space-y-1">
              <li>Kebenaran data yang dicatat</li>
              <li>Kesalahan input atau perintah yang dikirim melalui WhatsApp</li>
              <li>Akses ke akun WhatsApp milik sendiri</li>
            </ul>
            <p className="text-sm text-gray-600 leading-relaxed mt-3">
               Tulis Duit Via WhatsApp tidak bertanggung jawab atas kerugian yang timbul akibat kesalahan input atau penggunaan layanan yang tidak sesuai.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Penghapusan Data</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Pengguna dapat meminta penghapusan data dengan menghubungi layanan  Tulis Duit Via WhatsApp melalui kontak resmi. Setelah penghapusan dilakukan, data tidak dapat dipulihkan kembali.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Perubahan Layanan</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Kami berhak melakukan perubahan, pembaruan, atau penghentian layanan sewaktu-waktu demi peningkatan kualitas sistem. Perubahan penting akan diinformasikan melalui media yang tersedia.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Penutup</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Dengan menggunakan  Tulis Duit Via WhatsApp, pengguna menyetujui seluruh ketentuan yang tercantum dalam dokumen ini. Jika pengguna tidak menyetujui ketentuan ini, disarankan untuk tidak menggunakan layanan.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Kontak</h2>
            <div className="space-y-2 text-sm">
              <p className="text-gray-600">
                <span className="font-medium">Email:</span>{' '}
                <a href="mailto:fauzanalditester@gmail.com" className="text-orange-600 hover:underline">
                fauzanalditester@gmail.com
              </a>
              </p>
              <p className="text-gray-600">
                <span className="font-medium">WhatsApp:</span>{' '}
                <span className="text-orange-600">083844570735</span>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
