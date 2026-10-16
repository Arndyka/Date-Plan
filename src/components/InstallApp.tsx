import { useState } from 'react';
import { Download, Smartphone, RefreshCw, Check } from 'lucide-react';
import { usePwa, installApp, activateUpdate } from '../pwa';
import { Dialog } from './UI';

export function InstallApp() {
  const state = usePwa();
  const [help, setHelp] = useState(false);
  return (
    <section className="panel install-card" aria-labelledby="install-heading">
      <img src={`${import.meta.env.BASE_URL}icons/icon-192.png`} width="72" height="72" alt="" />
      <div className="install-copy">
        <p className="eyebrow">A LITTLE CLOSER TO US</p>
        <h2 id="install-heading">Date-Plan di layar utama.</h2>
        <p>
          Buka rencana kalian dari ikon aplikasi di HP. Login dan sinkronisasi tetap membutuhkan
          internet.
        </p>
        {state.standalone ? (
          <p className="installed-note">
            <Check size={17} />
            Date-Plan siap di layar utamamu.
          </p>
        ) : (
          <button
            className="btn"
            disabled={state.busy}
            onClick={() => (state.prompt ? void installApp() : setHelp(true))}
          >
            <Download size={17} />
            {state.busy ? 'Membuka pemasangan…' : 'Pasang di HP'}
          </button>
        )}
        <button className="link-button install-help" onClick={() => setHelp(true)}>
          Cara memasang
        </button>
        {state.feedback && <p role="status">{state.feedback}</p>}
      </div>
      {help && (
        <Dialog title="Pasang Date-Plan di HP" onClose={() => setHelp(false)}>
          <div className="install-instructions">
            <Smartphone size={28} />
            <h3>Android · Chrome</h3>
            <p>
              Buka Date-Plan di Chrome. Ketuk menu ⋮, lalu pilih <strong>Instal aplikasi</strong>{' '}
              atau <strong>Tambahkan ke layar utama</strong>. Ikuti petunjuk browser.
            </p>
            <h3>iPhone · Safari</h3>
            <p>
              Buka Date-Plan di Safari, ketuk <strong>Bagikan</strong>, lalu{' '}
              <strong>Tambahkan ke Layar Utama</strong>. Aktifkan <strong>Buka sebagai App</strong>{' '}
              jika tersedia, lalu ketuk Tambah.
            </p>
            <h3>Laptop · Chrome atau Edge</h3>
            <p>Gunakan ikon instal di bilah alamat atau menu browser untuk memasang Date-Plan.</p>
            <p className="info-note">
              Kalau dibuka dari WhatsApp atau Instagram, buka tautannya di Chrome atau Safari
              dahulu. Nama menu dan ketersediaan pemasangan bisa berbeda menurut perangkat.
            </p>
            <p className="muted">
              Saat koneksi terputus, halaman offline membantu kamu mencoba kembali. Rencana bersama
              dimuat setelah internet tersambung.
            </p>
          </div>
          <button className="btn full" onClick={() => setHelp(false)}>
            Mengerti
          </button>
        </Dialog>
      )}
    </section>
  );
}
export function AppUpdateNotice() {
  const state = usePwa();
  if (!state.waiting) return null;
  return (
    <aside className="app-update" aria-label="Pembaruan aplikasi">
      <div>
        <strong>Versi baru Date-Plan tersedia.</strong>
        <p>Simpan perubahanmu dahulu, lalu muat ulang.</p>
      </div>
      <button className="btn small" onClick={activateUpdate}>
        <RefreshCw size={16} />
        Muat ulang versi baru
      </button>
    </aside>
  );
}
