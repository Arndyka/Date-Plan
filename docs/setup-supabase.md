# Menghubungkan ruang pasangan ke Supabase

Gunakan proyek khusus untuk aplikasi ini. Migrasi menambahkan tabel/fungsi pada schema `public`; jangan menjalankannya pada proyek lain dengan tabel bernama sama tanpa review.

1. Buka SQL Editor proyek, jalankan seluruh isi `supabase/migrations/202610150001_initial.sql` satu kali. Migrasi bersifat transaksional. Jangan menonaktifkan RLS untuk mengatasi error.
2. Pada Authentication, aktifkan provider Email/password. Gunakan konfirmasi email untuk akun produksi; konfigurasikan pengiriman email sesuai kebutuhan proyek dan batas layanan yang tersedia.
3. Tetapkan **Site URL** ke `https://arndyka.github.io/Date-Plan/`. Tambahkan URL tersebut serta `http://127.0.0.1:5173/Date-Plan/` dan `http://127.0.0.1:5174/Date-Plan/` ke daftar redirect yang diizinkan untuk pengembangan. Tautan pemulihan password kembali ke halaman utama dan diproses oleh Supabase Auth.
4. Migrasi menambahkan tabel aplikasi ke publication `supabase_realtime` jika publication itu ada. Periksa pengaturan Realtime dan pastikan tersedia untuk tabel yang dimigrasikan. RLS tetap berlaku untuk klien.
5. Ambil **Project URL** dan **publishable key** (atau legacy anon key) dari pengaturan API. Isi `.env.local` lokal dan dua Actions variables pada GitHub sesuai README. Redeploy setelah variabel berubah.
6. Daftarkan akun pertama, konfirmasi email, lalu buat ruang. Pada Pengaturan buat undangan. Buka link menggunakan browser/perangkat kedua, masuk dengan akun berbeda, lalu terima undangan. Kode hanya dapat dipakai sekali, kedaluwarsa dalam tujuh hari, dan ruang dibatasi dua orang.
7. Coba menambah dan mengedit kegiatan dari kedua perangkat. Perubahan diberitahukan melalui Realtime dan dimuat ulang. Saat transport Realtime tidak tersedia, aplikasi juga memperbarui data berkala setiap 20 detik saat tab aktif, serta saat jaringan/tab kembali aktif.
8. Uji dua formulir edit terbuka untuk record yang sama. Penyimpanan kedua harus melaporkan konflik dan mempertahankan isi formulir. Muat ulang versi terbaru sebelum menerapkan kembali perubahan yang masih diinginkan.

## Privasi dan kunci

Publishable/anon key boleh dikirim ke browser karena akses dilindungi Auth, grants, dan RLS. Service-role key dapat melewati RLS dan **tidak boleh** digunakan di frontend atau GitHub Pages. Access token pengelolaan Supabase hanya untuk alat administrasi yang aman; tidak diperlukan di source aplikasi.

URL dan publishable key saja tidak memberi izin menerapkan SQL. Gunakan koneksi Supabase yang berwenang atau SQL Editor akun pemilik untuk menerapkan migrasi. Jangan meminta pengguna mengirim password database ke repository.

## Konfigurasi CLI proyek ini

Proyek tujuan: `rwdwbvnunsnampznfhyv`. `supabase/config.toml` hanya mendeklarasikan pengaturan Auth yang dibutuhkan aplikasi, agar konfigurasi layanan lain tidak ikut ditimpa. Setelah login pemilik tersedia:

Sebelum menjalankan `config diff` atau `config push`, muat `SUPABASE_SMTP_EMAIL` dan `SUPABASE_SMTP_PASS` dari file lokal yang diabaikan Git, seperti contoh PowerShell pada bagian SMTP di bawah. Password tidak disimpan langsung di TOML.

```sh
supabase link --project-ref rwdwbvnunsnampznfhyv
supabase db push --dry-run
supabase db push
supabase config diff --project-ref rwdwbvnunsnampznfhyv
supabase config push --project-ref rwdwbvnunsnampznfhyv
```

Tinjau daftar migrasi dan diff sebelum menjalankannya. Jangan gunakan `db reset` pada proyek hosted. File `.env.local`, metadata `.temp`, dan binary alat lokal tidak dimasukkan ke Git.

## SMTP Gmail

SMTP produksi menggunakan `smtp.gmail.com:465` (TLS), nama pengirim **Our Little Date**, dan App Password Google. Konfirmasi email tetap aktif. Batas pengiriman Auth ditetapkan 10 email per jam, cukup untuk penggunaan dua orang; batas layanan Gmail tetap berlaku.

Buat App Password khusus Date-Plan melalui [Google Account](https://myaccount.google.com/apppasswords), setelah mengaktifkan Verifikasi 2 Langkah. Simpan konfigurasi berikut di `.env.smtp.local` yang diabaikan Git, dengan nilai milik sendiri:

```dotenv
SUPABASE_SMTP_EMAIL=alamat-pengirim@gmail.com
SUPABASE_SMTP_PASS=app_password_tanpa_spasi
```

Untuk memperbarui konfigurasi dari PowerShell:

```powershell
Get-Content -LiteralPath '.env.smtp.local' | ForEach-Object {
  if ($_ -match '^(SUPABASE_SMTP_[A-Z]+)=(.*)$') {
    [Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process')
  }
}
try {
  supabase config diff --project-ref rwdwbvnunsnampznfhyv
  # Setelah meninjau diff:
  supabase config push --project-ref rwdwbvnunsnampznfhyv
} finally {
  Remove-Item Env:SUPABASE_SMTP_EMAIL,Env:SUPABASE_SMTP_PASS
}
```

App Password hanya untuk server Auth; jangan gunakan variabel `VITE_*` atau mengunggah file tersebut ke Git. Jika App Password dicabut atau password Google diganti, perbarui kredensial SMTP sebelum mengirim email berikutnya. Panduan: [Google App Password](https://support.google.com/mail/answer/185833) dan [Supabase SMTP](https://supabase.com/docs/guides/auth/auth-smtp).

## Pemeriksaan minimum sebelum memakai data asli

- Akun luar tidak melihat ruang, anggota, jadwal, catatan, wishlist, dan jurnal milik pasangan.
- Akun kedua hanya masuk lewat undangan yang valid; akun ketiga ditolak.
- Kedua anggota dapat mengedit rencana; jurnal/rating hanya dapat diubah penulisnya.
- Nominal negatif, jam terbalik, dan tautan yang tidak valid ditolak database.
- Logout menghapus data privat dari state aplikasi, walau cache server tetap menyimpan record sesuai kebijakan proyek.
- Undangan yang dicabut atau kedaluwarsa tidak bisa dipakai.

Pengujian database lokal tersedia melalui `npm test`. Gunakan akun uji dan data uji terpisah untuk pemeriksaan integrasi Auth/Realtime pada layanan yang sebenarnya; jangan reset database produksi.
