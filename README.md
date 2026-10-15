# Our Little Date 🌷

A little plan, a lot of love. Date planner berbahasa Indonesia untuk dua orang, dengan tema cream–blush, ilustrasi piknik, dan animasi lembut.

Website: **https://arndyka.github.io/Date-Plan/**. Supabase sudah aktif: ruang pasangan, undangan, dan sinkronisasi langsung telah diuji pada website publik. SMTP Gmail sudah terhubung; email konfirmasi diterima dan tautannya berhasil memverifikasi akun uji. Demo lokal juga tersedia.

## Fitur

- Rencana date, rundown yang dapat diurutkan, lokasi dan rute Google Maps.
- Estimasi/aktual budget, kontribusi masing-masing, pembagian biaya, dan checklist.
- Kalender dengan catatan, tautan Google Calendar, dan ekspor `.ics`.
- Papan inspirasi TikTok: tautan, pemutar opsional, kategori, catatan, dan kaitan ke rencana.
- Wishlist dengan vote, acak ide berdasarkan kategori/budget, dan jurnal date selesai.
- Akun email/password, ruang pasangan privat, undangan sekali pakai, dan data Supabase yang dilindungi RLS.
- Demo terpisah dengan penyimpanan lokal, backup JSON, layout mobile, keyboard dialog, dan reduced motion.

## Jalankan lokal

Gunakan Node.js 24. Di Windows PowerShell, gunakan `npm.cmd` jika `npm.ps1` diblokir execution policy.

```sh
npm ci
npm run dev
```

Buka URL `/Date-Plan/` yang dicetak Vite. Tanpa konfigurasi Supabase, aplikasi menampilkan mode demo yang ditandai jelas; login bersama belum tersedia. Demo bukan sinkronisasi antar-HP.

## Backend dan deployment

Ikuti [setup Supabase](docs/setup-supabase.md). Salin `.env.example` ke `.env.local` untuk pengembangan. Untuk produksi, isi repository **Actions variables**:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Keduanya memang konfigurasi publik browser. Jangan memasukkan service-role key, secret API key, password database, atau access token ke variabel `VITE_*`.

Aktifkan Settings → Pages → Source: **GitHub Actions**. Push ke `main` menjalankan verifikasi, build, dan deployment melalui `.github/workflows/deploy.yml`. Hash routing mendukung refresh halaman detail pada GitHub Pages.

## Pengujian

```sh
npm test
npm run typecheck
npm run build
npm run test:e2e
```

Unit/integrasi database memakai Vitest dan PGlite (PostgreSQL nyata di WASM). Browser tests memakai Playwright dengan Edge yang sudah terpasang di Windows, untuk desktop dan emulasi iPhone. Pada host selain Windows, konfigurasi otomatis memakai Chromium; siapkan dengan `npx playwright install chromium`. Untuk menguji build produksi atau URL live, set `PLAYWRIGHT_BASE_URL` ke URL lengkap yang diakhiri `/Date-Plan/` sebelum menjalankan browser tests.

Pengujian produksi terpisah tersedia melalui `node tests/remote-smoke.mjs`, dengan environment `DATEPLAN_PUBLIC_KEY` dan `DATEPLAN_ADMIN_KEY`. Pengujian ini membuat tiga akun sementara dan satu ruang, memeriksa Auth/RLS/Realtime melalui API dan browser desktop/mobile, lalu menghapus data ujinya sendiri. Jalankan hanya dengan akses administrasi yang berwenang; jangan memasukkan admin key ke frontend atau Git. Tes ini tidak mengirim email. Lihat [catatan verifikasi](docs/verification.md) untuk hasil dan batas cakupannya.

## Batasan yang disengaja

- Google Calendar dibuka dengan isian lengkap; pengguna menekan Simpan. Perubahan berikutnya di website tidak otomatis mengubah salinan eksternal.
- TikTok disimpan sebagai tautan. Video tidak diunduh atau diunggah ulang; tautan pendek/privat memiliki fallback buka di TikTok.
- Maps membuka pencarian/rute tanpa Places API berbayar atau izin GPS wajib.
- Saat offline, data yang sudah dimuat bisa dibaca dan isian formulir dipertahankan selama halaman terbuka. Penulisan cloud memerlukan koneksi.
- Satu ruang per akun, maksimal dua anggota. Tidak ada upload foto/video, transfer uang, atau pergantian pasangan melalui UI.
- Export JSON adalah cadangan untuk diunduh; import otomatis belum tersedia.

## Struktur

`src/domain`: tipe dan aturan murni. `src/data`: adapter demo/cloud dan status sinkronisasi. `src/auth`: login dan setup ruang. `src/features`: layar planner. `src/components`: UI bersama dan ilustrasi SVG. `supabase/migrations`: schema, validasi, RPC, dan RLS. `tests`: PostgreSQL dan browser journeys.

Tema terinspirasi [birthday-bloom.argels](https://github.com/Arndyka/birthday-bloom.argels). Foto pribadi dan audio dari referensi tidak disalin. Ilustrasi SVG dibuat khusus untuk planner ini. Font Google Fonts memiliki fallback sistem; aplikasi tetap berfungsi jika layanan font tidak tersedia.
