# Pasang Date-Plan di HP

Buka [Date-Plan](https://arndyka.github.io/Date-Plan/) langsung di browser HP. Date-Plan menggunakan PWA seperti Spendly: ikon sendiri di layar utama dan jendela aplikasi pada browser yang mendukung. Tidak perlu mengunduh APK.

## Android

1. Buka tautan di Chrome dan masuk ke akunmu.
2. Buka **Lainnya → Pengaturan → Pasang di HP**.
3. Ikuti petunjuk pemasangan. Jika dialog pemasangan tidak muncul, gunakan menu Chrome **⋮ → Instal aplikasi** atau **Tambahkan ke layar utama**.

## iPhone

1. Buka tautan di Safari.
2. Ketuk **Bagikan → Tambahkan ke Layar Utama**.
3. Aktifkan **Buka sebagai App** jika tersedia, lalu ketuk **Tambah**.

Nama menu dapat berbeda menurut versi browser. Tautan yang dibuka dari WhatsApp atau Instagram sebaiknya dibuka dahulu di Chrome atau Safari. Pada laptop, Chrome dan Edge menyediakan ikon instal di bilah alamat atau melalui menu browser.

## Akun, koneksi, dan pembaruan

Masuk dengan akun Date-Plan yang sama. Jika aplikasi meminta login lagi, data pasangan tetap tersimpan di ruang Supabase yang sama; jangan membuat ruang baru. Arnold dan Angel dapat memasang aplikasi di HP masing-masing.

Login dan sinkronisasi memerlukan internet. Cache aplikasi hanya berisi aset tampilan; data akun dan respons Supabase tidak disimpan oleh service worker. Saat aplikasi dibuka atau dimuat ulang tanpa koneksi, halaman offline menyediakan tombol **Coba lagi**. Isian yang belum disimpan tidak menjadi antrean sinkronisasi offline.

Saat ada versi baru, simpan pekerjaanmu lalu tekan **Muat ulang versi baru**. Pembaruan dari tab lain tidak memuat ulang tab yang sedang kamu gunakan secara paksa.

Manifest, ikon, petunjuk pemasangan, pembaruan dua tab, dan halaman offline diuji melalui browser desktop serta emulasi HP. Pemasangan ke layar utama pada perangkat fisik belum diverifikasi; ketersediaannya mengikuti [dukungan browser PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable).
