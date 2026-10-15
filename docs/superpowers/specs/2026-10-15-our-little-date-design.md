# Our Little Date — spesifikasi desain

Tanggal: 15 Oktober 2026  
Status: rancangan awal disetujui; spesifikasi ini menunggu review pengguna.  
Lokasi: `C:\KULIAH\Arn\ARNOLD-PROJECT\DATE-PLAN`  
Repository: https://github.com/Arndyka/Date-Plan

## 1. Tujuan dan kebutuhan yang disepakati

Membuat website date planner berbahasa Indonesia untuk pengguna dan pasangan. Keduanya dapat membuka dan mengedit rencana dari HP masing-masing, dengan data tersimpan di server dan perubahan tersinkronisasi. Website harus berguna untuk menyiapkan kegiatan, lokasi, anggaran, kalender, dan referensi TikTok, serta terasa romantis, lucu, dan rapi.

Pengguna telah menyetujui rancangan fitur awal dan meminta animasi. Referensi visual adalah repository `Arndyka/birthday-bloom.argels`. Source tetap berada di repository tujuan milik pengguna. Publikasi ditargetkan melalui GitHub Pages.

Keberhasilan berarti dua akun berbeda dalam satu ruang pasangan dapat bekerja pada rencana yang sama; akun di luar ruang tidak dapat membaca datanya; fitur inti berfungsi di layar HP; dan situs yang dipublikasikan memiliki konfigurasi backend yang benar. Preview atau demo lokal tidak dianggap bukti sinkronisasi atau deployment selesai.

## 2. Pendekatan yang dipilih

- Frontend: React, TypeScript, dan Vite, dengan CSS bertema khusus.
- Hosting frontend: GitHub Pages melalui GitHub Actions, base path `/Date-Plan/`.
- Routing berbasis hash agar tautan langsung tetap bekerja pada hosting statis.
- Backend: Supabase Auth, PostgreSQL, dan Realtime. Migrasi SQL disimpan dalam repository.
- Akun: email dan password; tersedia pendaftaran, login, logout, konfirmasi email sesuai konfigurasi proyek, serta pemulihan password.
- Bahasa utama Indonesia, mata uang rupiah, zona waktu jadwal Asia/Jakarta.

React + Firebase merupakan alternatif yang telah dipertimbangkan. Supabase dipilih karena relasi ruang, anggota, rencana, dan kegiatan cocok untuk database relasional dengan kebijakan akses per ruang.

GitHub Pages menyajikan aplikasi publik; isi ruang pasangan tetap memerlukan autentikasi dan izin database. Kunci rahasia backend tidak pernah dikirim ke browser atau disimpan dalam Git. Frontend hanya memakai URL Supabase dan publishable key yang memang diperuntukkan bagi klien.

## 3. Identitas visual dan animasi

Nama tampilan awal: **Our Little Date**. Nama panggilan pasangan dapat diubah melalui pengaturan ruang.

Palet mengikuti referensi: cream `#fffaf4`, blush `#fbe4e9`, pink `#f2a5ba`, berry `#aa3f68`, wine `#7d2948`, sage `#87977b`, dan teks gelap `#3d252d`. Judul memakai serif romantis; teks, angka anggaran, dan kontrol memakai sans-serif yang mudah dibaca. Elemen dekoratif berupa bunga, hati, label kecil, dan kartu menyerupai scrapbook.

Foto pribadi dan musik dari repository referensi tidak otomatis disalin. Referensi digunakan untuk bahasa visualnya. Dekorasi ringan dibuat dengan CSS atau SVG, tanpa ketergantungan pada gambar eksternal untuk fungsi inti.

Animasi yang direncanakan:

- Bunga dekoratif bergoyang perlahan pada area sambutan, dengan jumlah terbatas.
- Kartu masuk dengan fade dan pergeseran kecil, tanpa menghambat akses konten.
- Transisi panel, dialog, hover, dan tombol sekitar 150–250 ms.
- Countdown diperbarui tanpa pengumuman screen reader setiap detik.
- Indikator simpan dan sinkronisasi yang jelas.
- Confetti singkat setelah pengguna menandai date selesai, hanya sekali per tindakan.
- `prefers-reduced-motion` menonaktifkan gerakan dekoratif, pergeseran, dan confetti.

Tidak ada autoplay audio atau gerakan yang menghalangi pengisian formulir. Animasi hanya memakai transform/opacity bila memungkinkan dan dihentikan ketika tidak terlihat.

## 4. Navigasi dan alur penggunaan

Desktop menggunakan sidebar ringkas. Mobile memakai navigasi bawah untuk Beranda, Rencana, Kalender, Inspirasi, dan menu Lainnya. Budget, checklist, dan lokasi tersedia di dalam detail rencana; wishlist, kenangan, serta pengaturan dapat diakses dari Lainnya.

Alur pengguna baru:

1. Mendaftar atau masuk.
2. Membuat ruang pasangan atau menerima undangan.
3. Mengisi nama panggilan dan nama ruang.
4. Membuat rencana pertama, memilih tanggal dan jam, lalu menambahkan kegiatan.
5. Mengundang pasangan dan melihat perubahan bersama.

Data contoh hanya tersedia dalam mode demo yang ditandai jelas. Demo tidak dicampurkan ke ruang pengguna dan tidak mengklaim tersinkronisasi.

## 5. Fitur inti

### Beranda

Menampilkan rencana berikutnya, countdown, total estimasi dan aktual rencana tersebut, kegiatan terdekat, serta checklist yang belum selesai. Saat belum ada rencana, tampilkan ajakan membuat rencana pertama. Rencana lampau tidak menghasilkan countdown negatif.

### Rencana dan rundown

Pengguna dapat membuat, melihat, mengubah, serta menghapus rencana date. Rencana memiliki judul, tanggal, jam mulai dan selesai, catatan, batas anggaran, dan status draft/terjadwal/selesai/dibatalkan.

Kegiatan memiliki judul, jam mulai dan selesai, lokasi, catatan, kategori, estimasi biaya, pengeluaran aktual, serta penanda selesai. Urutan dapat diubah dengan tombol naik/turun yang dapat digunakan melalui keyboard dan HP. Jadwal tumpang tindih diberi peringatan. Jam selesai wajib setelah jam mulai; waktu disimpan sebagai timestamp dengan zona waktu yang jelas.

Rencana cadangan jika hujan berupa catatan alternatif di rencana. Menghapus rencana meminta konfirmasi dan juga menghapus data turunannya secara konsisten.

### Budget

Nominal disimpan sebagai bilangan bulat rupiah, bukan floating point. Nilai negatif atau tidak valid ditolak. Estimasi, aktual, dan sisa terhadap batas anggaran dihitung dari data kegiatan.

Setiap pengeluaran aktual memiliki penanggung bayar: anggota pertama, anggota kedua, atau bersama. Jika bersama, masukkan nominal kontribusi masing-masing dengan jumlah sama dengan pengeluaran. Pembagian kewajiban default 50:50 dan dapat diubah sebagai persentase di tingkat rencana; total persentase harus 100%. Selisih kontribusi dan kewajiban ditampilkan sebagai ringkasan patungan, tanpa proses pembayaran. Pembulatan rupiah ditempatkan secara konsisten pada anggota kedua.

### Lokasi dan Google Maps

Simpan nama tempat, alamat, serta tautan Maps opsional per kegiatan atau wishlist. Tombol lokasi membuka pencarian Google Maps; tombol rute membuka petunjuk arah ke tujuan. Tidak memerlukan akses lokasi perangkat untuk menyimpan tempat.

Versi awal tidak menjanjikan autocomplete Places atau peta interaktif berbayar. Nama/alamat dan tautan Maps tetap memberi akses lokasi yang berguna. URL yang dibuka divalidasi, memakai HTTPS, dan tidak dapat menjalankan skrip.

### Kalender dan save the date

Kalender bulanan menampilkan rencana serta catatan tanggal. Pengguna dapat berpindah bulan, kembali ke hari ini, membuka detail rencana, dan menambah/mengubah/menghapus catatan.

Rencana yang memiliki jadwal muncul otomatis di kalender aplikasi. Untuk kalender eksternal tersedia tautan Google Calendar dengan judul, lokasi, catatan, waktu mulai dan selesai yang terisi; tersedia juga unduhan `.ics`. Pengguna tetap mengonfirmasi penyimpanan di aplikasi kalender. Ekspor berulang memakai UID stabil untuk rencana yang sama, tetapi perilaku duplikat bergantung pada aplikasi kalender tujuan.

Penulisan otomatis ke akun Google, sinkronisasi dua arah, dan pengingat server tidak termasuk versi awal karena memerlukan integrasi OAuth dan layanan tambahan. Antarmuka menjelaskan bahwa perubahan rencana di website tidak otomatis memperbarui salinan kalender eksternal.

### Inspirasi TikTok

Simpan URL TikTok, judul buatan pengguna, kategori, catatan, dan hubungan opsional ke rencana. Pengguna dapat mengedit, menghapus, dan memfilter referensi.

URL harus HTTPS dengan hostname TikTok yang valid. Video publik dengan URL yang mendukung embed dapat ditampilkan setelah pengguna memilih memuatnya. Tautan pendek, video privat, atau embed yang ditolak tetap memiliki tombol buka di TikTok. Tidak mengunduh, menyalin, atau mengunggah ulang file video.

## 6. Fitur tambahan yang disepakati

- **Wishlist tempat:** simpan nama, lokasi, kisaran biaya, kategori, dan vote satu kali per anggota; vote dapat dibatalkan.
- **Acak ide date:** pilih dari wishlist atau kumpulan ide bawaan berdasarkan kategori dan batas budget; tampilkan pesan jelas jika tidak ada yang cocok. Hasil tidak dianggap rekomendasi tempat aktual yang telah diverifikasi.
- **Checklist:** daftar barang/tugas per rencana, penanggung jawab opsional, dan status selesai.
- **Jurnal kenangan:** setelah date, simpan tulisan singkat, momen favorit, dan rating pribadi per anggota. Unggah foto/video tidak termasuk versi awal.
- **Catatan manis:** teks pendek di beranda yang dapat diedit kedua anggota, tanpa pengiriman pesan eksternal.

## 7. Model data dan batas akses

Entitas utama:

| Entitas | Isi dan relasi |
| --- | --- |
| profiles | ID pengguna Auth dan nama panggilan |
| spaces | Nama ruang, pembuat, catatan manis |
| space_members | Relasi pengguna ke ruang, maksimal dua anggota |
| space_invites | Hash token undangan, pembuat, kedaluwarsa, status penggunaan |
| plans | Ruang, jadwal, status, batas budget, rasio patungan, catatan cadangan |
| activities | Rencana, urutan, jadwal, lokasi, estimasi/aktual, kontribusi anggota |
| calendar_notes | Ruang, tanggal lokal, judul dan isi |
| inspirations | Ruang, rencana opsional, URL TikTok, judul, kategori, catatan |
| wishlist_items | Ruang, tempat, lokasi, kategori, estimasi biaya |
| wishlist_votes | Wishlist dan anggota; unik per pasangan item/anggota |
| checklist_items | Rencana, isi, anggota penanggung jawab opsional, status |
| memories | Rencana, penulis, jurnal, rating; unik per rencana/penulis |

Record yang bisa diedit memiliki waktu dibuat, waktu diperbarui, serta versi untuk mendeteksi konflik. Record turunan mengacu ke induk melalui foreign key. Database memvalidasi nilai anggaran, rentang rating, dan keanggotaan penanggung jawab.

RLS diberlakukan pada seluruh tabel yang dapat diakses dari klien. Anggota hanya dapat membaca/mengubah data ruangnya. Profil dan undangan tidak memiliki endpoint daftar publik. Penulis mengelola rating/jurnal pribadinya, sedangkan kedua anggota dapat membacanya. Anggota tidak dapat mengganti foreign key untuk memindahkan data ke ruang lain.

Pembuatan ruang serta penerimaan undangan menggunakan transaksi/RPC database. Token undangan acak berentropi tinggi, sekali pakai, berlaku tujuh hari, disimpan sebagai hash, dan hanya dapat diterima akun yang sudah login. Penerimaan mengunci ruang untuk mencegah dua permintaan bersamaan melampaui dua anggota. Pembuat dapat mencabut undangan. Token tidak ditaruh di log dan dihapus dari URL setelah diproses.

Versi awal membatasi satu ruang aktif per akun. Tidak ada penggantian pasangan atau pengeluaran anggota melalui UI; perluasan siklus keanggotaan berada di luar lingkup ini. Logout tersedia pada setiap perangkat.

## 8. Sinkronisasi, validasi, dan penanganan kesalahan

Database adalah sumber data utama. Realtime memberi tahu klien ketika data yang boleh diakses berubah; klien mengambil ulang data terkait. Saat tab aktif kembali atau jaringan pulih, lakukan refresh agar perubahan yang terlewat tetap muncul.

Simpan perubahan dengan nomor versi yang diharapkan. Jika versi berubah karena pasangan mengedit record yang sama, hentikan penimpaan, pertahankan isian pengguna, dan tawarkan memuat versi terbaru. Penghapusan atau akses yang dicabut ditangani sebagai kondisi nyata, bukan pesan sukses.

Status antarmuka membedakan memuat, menyimpan, tersimpan, offline, konflik, dan gagal. Jangan mengklaim perubahan tersimpan sebelum server mengonfirmasi. Saat offline, halaman yang sudah terbuka dapat tetap dibaca dan isian yang belum terkirim dipertahankan dalam memori; penyimpanan tidak tersedia sampai tersambung kembali. Tidak ada antrean penulisan offline tersembunyi.

Validasi dilakukan di frontend dan database. Konten pengguna dirender sebagai teks, bukan HTML mentah. Pesan error tampil dekat isian yang bermasalah tanpa membocorkan informasi rahasia. Kredensial login, token undangan, dan data privat tidak masuk log aplikasi.

## 9. Struktur implementasi

Pisahkan shell/navigasi, komponen UI bersama, fitur rencana, kalender, budget, inspirasi, wishlist, dan pengaturan. Akses Supabase berada pada lapisan layanan; perhitungan uang, konversi waktu, validasi URL, dan ekspor kalender berada pada modul fungsi murni yang dapat diuji.

Repository berisi source, migrasi database, contoh variabel lingkungan tanpa nilai rahasia, workflow deployment, dokumentasi setup, dan pengujian. Artefak build dan variabel lingkungan lokal diabaikan Git.

## 10. Pengujian dan kriteria penerimaan

- Build produksi dan pemeriksaan TypeScript berhasil.
- Unit test memeriksa hitungan budget/patungan, pembulatan, rentang jadwal, pergantian tanggal zona waktu, URL eksternal, dan format/escaping ICS.
- Pengujian database membuktikan akun luar ditolak, dua anggota berbagi data, token undangan tidak bisa digunakan ulang, batas dua anggota tetap berlaku saat permintaan bersamaan, dan konflik versi tidak menimpa data diam-diam.
- Alur browser: signup/login, buat ruang, gabung lewat undangan, CRUD rencana dan kegiatan, budget, checklist, kalender/note, wishlist/vote, TikTok, jurnal, dan logout.
- Dua sesi terpisah memverifikasi sinkronisasi data dan penanganan edit bersamaan.
- Periksa empty state, kegagalan jaringan, retry, input tidak valid, dan embed TikTok yang gagal.
- Periksa layar 360 px, 390 px, tablet, dan desktop: tidak ada overflow mendatar; formulir dan dialog dapat digulir; navigasi mudah dijangkau.
- Keyboard, label formulir, focus ring, focus trap pada dialog, pengembalian fokus, kontras, dan reduced motion diperiksa.
- Verifikasi versi produksi melalui URL GitHub Pages, termasuk refresh tautan detail dan akses asset pada base path repository.

## 11. Deployment dan ketergantungan eksternal

Repository telah di-clone dan remote `origin` menunjuk ke repository yang diberikan pengguna. Hak push, konfigurasi Pages, serta keberhasilan workflow belum diverifikasi. Git credential manager tersedia; GitHub CLI belum tersedia pada pemeriksaan awal.

Sinkronisasi nyata membutuhkan proyek Supabase milik pengguna, URL proyek, publishable key, migrasi yang diterapkan, konfigurasi Auth redirect untuk URL produksi, serta konfigurasi Realtime. Kredensial administratif tetap di lingkungan aman dan tidak diminta untuk ditempel di source.

Izin push dan aktivasi GitHub Pages perlu diverifikasi pada tahap deployment. Pembuatan layanan berbayar atau langganan tidak diasumsikan disetujui. Jika layanan atau akses belum tersedia, pekerjaan source, migrasi, dan pengujian lokal tetap diselesaikan; laporan akhir menyebut tepat bagian yang belum dapat diverifikasi.

## 12. Batas lingkup dan langkah berikutnya

Tidak termasuk pembayaran, chat pasangan, upload video/foto, scraping TikTok, Places berbayar, push notification terjadwal, atau sinkronisasi Google Calendar dua arah. Fitur-fitur tersebut tidak diperlukan untuk memenuhi planner versi awal yang telah disepakati.

Setelah pengguna menyetujui dokumen ini, buat rencana implementasi tertulis, kemudian minta review rencana serta pilihan metode pelaksanaan sesuai workflow skill yang berlaku. Spesifikasi ini belum merupakan implementasi dan tidak menandakan aplikasi telah dipublikasikan.
