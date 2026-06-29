# 📚 Bratasena — Digital Library

Perpustakaan digital untuk novel **Bratasena — Tahta Darah** dan novel-novel mendatang.

**🌐 Baca online:** [paranparanjare-bot.github.io/bratasena-autonovel](https://paranparanjare-bot.github.io/bratasena-autonovel/)

---

## 📖 Novel Tersedia

| Novel | Season | Bab | Status |
|-------|--------|-----|--------|
| Bratasena — Tahta Darah | 4 | 80 | ✅ Selesai |

## 🗂️ Struktur Repo

```
├── index.html            ← Landing page
├── library.html          ← Perpustakaan (daftar novel)
├── reader.html           ← Pembaca novel
├── build-novels-db.py    ← Script generate database novel
├── css/
│   └── style.css         ← Stylesheet dark academia
├── js/
│   ├── auth.js           ← Login/signup (localStorage)
│   ├── app.js            ← Utilities, tema, navigasi
│   ├── library.js        ← Render perpustakaan
│   └── reader.js         ← Pembaca bab
├── novels/
│   ├── novels.json       ← Database novel (auto-generated)
│   └── bratasena/        ← Folder per novel
│       ├── info.json     ← Metadata novel
│       ├── cover.jpg     ← Sampul 2:3 (optional)
│       ├── season-01/    ← Warisan Berdarah (bab 01-20)
│       ├── season-02/    ← Bayang Naga (bab 21-40)
│       ├── season-03/    ← Kepala Naga Pertama (bab 41-60)
│       └── season-04/    ← Api dari Timur (bab 61-80)
└── bible/                ← Dokumen lore & continuity guide
```

## ➕ Menambah Novel Baru

1. Buat folder di `novels/` — misal `novels/judul-baru/`
2. Isi `novels/judul-baru/info.json`:

```json
{
  "title": "Judul Novel",
  "author": "Nama Penulis",
  "description": "Sinopsis singkat",
  "genre": "Genre",
  "seasons": {
    "season-01": "Nama Season 1",
    "season-02": "Nama Season 2"
  }
}
```

3. Letakkan file `.txt` di `season-XX/` — nama file harus mengandung nomor bab.
4. Jalankan: `python3 build-novels-db.py`
5. Commit dan push — perpustakaan otomatis update.

## 🔐 Akun Pengguna

Login/disimpan di **localStorage browser perangkat**. Tidak ada server backend.

- ✅ Daftar sekali, tersimpan di HP
- ⚠️ Ganti HP = daftar ulang (akun tidak bisa dipindah)
- ❌ Privasi data sepenuhnya di tangan pengguna

## 🎨 Fitur

- **Landing page** dengan slot gambar 9:16 (kustomisasi)
- **Library** dengan grid sampul
- **Reader** dengan tema Dark/Sepia/Light
- **Kontrol ukuran font**
- **Bookmark** per bab
- **Progress tracking** (otomatis lanjut bab yang belum selesai)
- **Swipe navigasi** di HP
- **Responsive** — HP-first

## 🏗️ Build & Deploy

Site ini static murni. Cukup push ke branch `main` dengan GitHub Pages enabled:
- Source: **Deploy from branch**
- Branch: `main`
- Folder: `/ (root)`

Atau manual: `git push origin main`
