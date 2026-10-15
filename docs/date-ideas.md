# Koleksi ide date

Koleksi awal berisi 60 ide: 54 aktivitas umum yang ditulis khusus untuk aplikasi dan enam aktivitas dengan referensi tempat Bandung. Ini bukan daftar semua ide yang mungkin. Budget merupakan alokasi perencanaan total untuk dua orang, bukan klaim tarif resmi; transportasi, bahan, pemesanan, dan kondisi pribadi bisa mengubah kebutuhan biaya.

Enam pilihan berganti setiap Senin pukul 00.00 Asia/Jakarta. Pilihan ditentukan oleh minggu dan kota tersimpan, sehingga kedua anggota ruang melihat rekomendasi yang sama. Halaman yang tetap terbuka mengecek pergantian minggu setiap menit dan saat tab aktif kembali. Kota disimpan pada `spaces.recommendation_city`, dilindungi RLS dan pemeriksaan versi yang sama dengan pengaturan ruang lainnya.

Bandung memiliki pilihan tempat khusus. Untuk kota lain, aplikasi menampilkan aktivitas umum dan tautan pencarian Maps dengan nama kota tersebut. Pencarian tidak menjamin tersedianya tempat atau slot aktivitas. Pilihan di rumah tidak memiliki tautan Maps.

## Referensi tempat

Sumber diperiksa pada 15 Oktober 2026. Jadwal dan tarif tidak disalin ke katalog agar tidak dianggap sebagai informasi langsung. Tautan sumber juga tersedia pada kartu ide.

- [Braga — Indonesia Travel](https://www.indonesia.travel/id/id/travel-ideas/culture/menikmati-berbagai-sudut-paling-instagenic-di-jalan-braga): lokasi kawasan dan referensi berjalan/fotografi.
- [Museum Geologi — situs resmi](https://museum.geologi.esdm.go.id/): jenis koleksi, layanan kunjungan, dan lokasi museum.
- [Kawasan bersejarah Bandung — Indonesia Travel](https://www.indonesia.travel/id/id/travel-ideas/heritage/sehari-di-bandung-ini-4-spot-bersejarah-yang-bisa-dikunjungi): konteks kawasan Asia Afrika.
- [Saung Angklung Udjo — Indonesia Travel](https://www.indonesia.travel/id/id/travel-ideas/adventure/bandung---saung-mang-udjo): pertunjukan budaya dan lokasi.
- [Aktivitas Bandung — Indonesia Travel](https://www.indonesia.travel/gb/en/travel-ideas/adventure/10-exciting-family-friendly-experiences-for-your-weekend-in-bandung): forest walk Babakan Siliwangi.
- [Tahura Djuanda — situs resmi](https://tahuradjuanda.jabarprov.go.id/): destinasi alam dan akses ke informasi pengelola.

Panduan pengalaman baru bersama mengambil inspirasi umum dari [Greater Good, UC Berkeley](https://greatergood.berkeley.edu/podcasts/item/how_to_reconnect_with_your_partner). Prompt aktivitas bukan salinan artikel dan bukan jaminan manfaat psikologis. Nilai utamanya adalah membantu memilih aktivitas yang nyaman, realistis, dan disukai berdua.

## Kompatibilitas

Split bill, kolom kontribusi, dan perhitungan utang dihapus dari tampilan serta logika ringkasan anggaran. Payload `share` dan `paidFirst` masih ada sebagai metadata kompatibilitas schema lama; keduanya tidak ditawarkan sebagai fitur dan tidak dipakai menghitung pembagian. Penyimpanan kegiatan baru menulis `paidFirst: 0`. Data lama tetap dapat dibuka dan diedit tanpa menghapus rencana.

Nama Arnold & Angel menjadi default ruang baru dan demo. Nama ruang/profil yang sudah disimpan tidak ditimpa otomatis. Anggota lama dapat memilih nama panggilannya dari Pengaturan; pilihan ini tidak mengubah autentikasi atau hak akses akun.
