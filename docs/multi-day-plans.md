# Rencana beberapa hari

Edit rencana menyediakan tanggal mulai dan tanggal selesai. Tanggal selesai yang kosong berarti hari yang sama. Jam mulai mengacu pada hari pertama, jam selesai pada hari terakhir, semuanya WIB. Contoh: 23 Oktober pukul 23.00 sampai 25 Oktober pukul 18.00.

Setiap kegiatan memilih tanggal dalam rentang rencana. Isi tanggal selesai kegiatan jika melewati tengah malam; kosong berarti hari yang sama. Rundown dikelompokkan menurut tanggal mulai kegiatan, dan tombol urutan bekerja dalam hari yang sama. Peringatan bentrok membandingkan tanggal dan jam penuh sehingga sarapan pada dua hari berbeda tidak dianggap bentrok. Budget tetap total seluruh perjalanan. Batas kegiatan mengikuti tanggal perjalanan, bukan jam berangkat/pulang.

Kalender internal menampilkan rencana pada setiap tanggal yang tercakup. Google Calendar dan file ICS memakai waktu mulai pada tanggal pertama serta waktu selesai pada tanggal terakhir. Salinan kalender eksternal yang sudah disimpan perlu diperbarui kembali setelah perubahan.

Rencana dan kegiatan lama dipertahankan sebagai jadwal satu hari. Mengubah rentang tidak memindahkan tanggal kegiatan otomatis. Jika kegiatan lama berada di luar rentang yang diinginkan, perluas rentang lebih dahulu, pindahkan tanggal kegiatan, baru persempit rentang. Contoh rencana lama 22 Oktober yang ingin menjadi 23–25: ubah akhir menjadi 25, pindahkan kegiatan tanggal 22 ke tanggal yang sesuai, lalu ubah awal menjadi 23.

Validasi berlaku di UI, demo, dan database. Penulisan kegiatan mengunci rencana induk selama validasi sehingga perubahan rentang bersamaan tidak bisa meninggalkan kegiatan di luar rentang. Versi record tetap menjaga draft saat pasangan mengedit. Migrasi mengisi tanggal baru dari tanggal lama dan menaikkan versi; klien lama yang menyimpan perubahan biasa tanpa kunci tanggal baru tidak menghapus tanggal yang tersimpan. Gunakan versi aplikasi terbaru untuk mengedit rentang tanggal.
