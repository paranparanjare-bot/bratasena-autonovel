# Arsitektur & Spesifikasi Teknis Pengembangan Web Reader

Dokumen ini mencatat keputusan dan kesepakatan teknis yang telah disetujui bersama untuk pengembangan sistem web reader novel dengan fitur login, koin, sistem referal, dan integrasi Telegram Bot.

---

## 1. Stack Teknologi (Infrastruktur)

*   **Version Control & Repository:** GitHub (tetap wajib sebagai pusat kode/naskah).
*   **Web Hosting:** Cloudflare Pages (dihubungkan langsung ke repositori GitHub).
*   **Backend Serverless API:** Cloudflare Workers.
*   **Database:** Cloudflare D1 (Serverless SQL Database berbasis SQLite).
*   **Aset & Media (Optional):** Cloudflare R2 (Penyimpanan gambar cover & ilustrasi secara eksternal jika folder repositori mendekati limit).

---

## 2. Sistem Autentikasi & Keamanan Konten

*   **Penyembunyian File Fisik:** File teks bab novel (`.txt`/`.md`) tidak boleh diakses langsung secara publik via folder statis. File disimpan secara privat (atau di R2 privat).
*   **Akses via API Gateway:** Pembaca meminta konten bab melalui API di Cloudflare Workers. Workers akan memverifikasi sesi login dan hak akses pengguna sebelum mengirimkan teks novel.
*   **Login Admin Segan (2FA/OTP):** Login ke halaman web admin dilindungi OTP 6-digit. OTP digenerate oleh Workers dan dikirimkan langsung ke Telegram pribadi Admin.

---

## 3. Sistem Koin (Monetisasi)

*   **Status Bab:**
    *   **Gratis (Free):** Dapat dibaca oleh semua pengunjung tanpa login (misalnya Bab 1 s.d. 3).
    *   **Premium (Locked):** Memerlukan koin untuk membukanya (misalnya 5 koin per bab). Sekali dibeli, bab terbuka permanen untuk akun tersebut.
*   **Alur Pembelian Koin Manual:**
    1.  User memilih paket koin di web (misal: 50 Koin = Rp10.000).
    2.  Web menampilkan QRIS/No. Rekening/E-Wallet (DANA, GoPay, ShopeePay).
    3.  User mentransfer secara manual, lalu mengisi form konfirmasi pembayaran dengan mengunggah foto bukti transfer.
    4.  Klaim tersimpan di database D1 dengan status `Pending`.

---

## 4. Sistem Referal 3 Tingkat (Multi-Level Referral)

*   **Pendaftaran via Link:** Pengguna baru yang mendaftar melalui link referal (`/register?ref=userid`) akan dicatat sebagai bawahan dari pengundang.
*   **Bagi Hasil Komisi Pembelian Koin:**
    *   **Tingkat 1 (Langsung):** Mendapat komisi **10%** koin saat bawahan langsung membeli koin.
    *   **Tingkat 2:** Mendapat komisi **5%** koin.
    *   **Tingkat 3:** Mendapat komisi **2%** koin.
*   **Pencegahan Spam:** Komisi hanya diberikan berdasarkan transaksi pembelian koin riil oleh bawahan, bukan dari pendaftaran akun kosong.

---

## 5. Integrasi Telegram Bot (Mobile Admin Panel)

*   **Batasan Akses:** Bot dikunci khusus menggunakan Telegram Chat ID unik milik Admin agar tidak dapat diakses orang asing.
*   **Notifikasi Klaim Pembayaran Masuk:**
    *   Workers mengirim pesan otomatis ke Telegram Admin saat ada user mengirim konfirmasi transfer.
    *   Pesan berisi: Nama User, Paket Koin, Nama Pengirim Transfer, dan Lampiran Foto Bukti Transfer.
    *   Disediakan dua tombol interaktif di bawah pesan Telegram: `[ Setujui ]` dan `[ Tolak ]`.
*   **Persetujuan via Telegram:**
    *   Mengklik `[ Setujui ]` langsung mengeksekusi penambahan koin ke user, membagikan komisi referal 3 tingkat, dan mengubah status database menjadi `Berhasil`.
    *   Mengklik `[ Tolak ]` membatalkan klaim dan menandai transaksi gagal.
