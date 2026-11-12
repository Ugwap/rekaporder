# Rekap Order — Villa Parfum

Aplikasi web satu halaman untuk mencatat rekap order per toko dan mengekspornya
ke file Excel 12 bulan (satu sheet per bulan). Semua kode aplikasi ada di dalam
`index.html`, jadi cukup di-deploy ke GitHub Pages.

**Demo:** https://ugwap.github.io/rekaporder/

---

## Tema terang & gelap

Tombol bulat di pojok kanan atas mengganti tampilan antara mode terang dan
gelap. Pilihan disimpan di `localStorage` (kunci `rekaporder-tema`), jadi tetap
dipakai saat halaman dibuka lagi. Kalau pengguna belum pernah memilih, tampilan
mengikuti tema sistem (terang/gelap).

---

## Alur pemakaian

1. **Pilih tanggal** transaksi di bagian **Input Rekap**.
2. **Ketik nama toko.** Daftar saran muncul dari database. Nama yang salah
   ketik otomatis dibetulkan saat Tab/klik keluar (mis. `anyr` → `Anyer - 2`).
   Nama yang masih ambigu (mis. `a` atau `cilegon`) tidak dipaksa, tinggal
   pilih dari daftar.
3. **Cabang terisi otomatis** dari data toko (read-only).
4. **Isi nominal** lalu klik **+ Tambah ke Daftar**.
5. Ulangi untuk toko/tanggal berikutnya.
6. Pilih **Tahun Rekap**, lalu klik **Download Rekap Order (Excel 12 Bulan)**.

### Revisi data

Kalau **tanggal dan nama toko** yang sama sudah ada di daftar, input baru
**tidak langsung masuk**. Aplikasi menandai kolom **Keterangan Revisi** sebagai
wajib dan menampilkan peringatan:

> ⚠ Toko ini sudah diinput pada 07 Nov 2026. Isi keterangan revisi — data lama
> akan ditimpa.

Alurnya:

1. Isi **Keterangan Revisi** (mis. *“Salah input nominal, dikoreksi dari 100rb
   ke 150rb”*).
2. Klik **+ Tambah ke Daftar** lagi.
3. Nominal lama **ditimpa** dengan nominal baru, dan revisi tercatat di
   **Daftar Revisi**.

Pengecekan hanya berlaku untuk kombinasi **tanggal + nama toko** yang persis
sama. Tanggal beda atau toko beda tetap masuk sebagai data baru. Kalau satu
baris dihapus dari preview, revisi milik baris itu ikut terhapus supaya isi
export tetap sinkron.

### Input Toko Baru

Bagian **Input Toko Baru** dipakai untuk menambah toko langsung ke database,
tanpa upload CSV:

- **Nama Toko** (wajib)
- **Cabang** (wajib)
- **Regional** (opsional — kalau kosong, pengelompokan memakai cabang)

Klik **+ Simpan Toko ke Database**. Data langsung masuk ke tabel
`public."TOKO"` di Supabase, lalu daftar toko di halaman ini ikut diperbarui.
Toko dengan nama + cabang yang sama tidak bisa ditambahkan dua kali.

Kalau database menolak (pesan *row-level security*), jalankan
`perbaiki-toko.sql` sekali seperti dijelaskan di bawah, lalu klik
**↻ Muat ulang data toko dari Supabase**.

### Export Excel

Ada **dua** file export:

| Tombol | File | Isi |
|---|---|---|
| **Download Rekap Order (Excel 12 Bulan)** | `Rekap_Order_<TAHUN>.xlsx` | 12 sheet rekap |
| **Download Rekap Revisi** | `Rekap_Revisi_<TAHUN>.xlsx` | 1 sheet `REKAP REVISI` |

**Rekap Order**

- Hasil export selalu berisi **12 sheet**: `JANUARI` sampai `DESEMBER` untuk
  tahun yang dipilih.
- Setiap sheet memakai format rekap Villa Parfum:
  - kop/logo di kiri atas,
  - judul **REKAP PERMINTAAN BARANG TAHUN &lt;TAHUN&gt;**,
  - nama bulan,
  - blok **REGIONAL ...** berisi kolom nama toko,
  - baris tanggal 1 sampai akhir bulan (format `dd-mmm-yy`),
  - nominal rupiah (`Rp`) rata kanan,
  - baris **TOTAL** berisi formula `SUM` per toko.
- Data dikelompokkan per bulan → regional → toko → tanggal.
- Kalau tanggal + toko yang sama diinput ulang, nilainya **ditimpa** (bukan
  dijumlahkan) dan wajib disertai keterangan revisi.
- Hanya data dengan tahun yang dipilih dan toko yang terdaftar di database
  yang dimasukkan. Data lain dilaporkan sebagai "dilewati" setelah export.

**Rekap Revisi**

- Satu sheet `REKAP REVISI` berisi log perubahan tahun terpilih.
- Kolom: **NO**, **NAMA TOKO**, **TANGGAL**, **REVISI** (keterangan yang diisi
  saat menimpa data).
- Tanggal memakai format `dd-mmm-yy`, header dibekukan (freeze pane), dan siap
  dicetak (fit to width).
- Kalau belum ada revisi, tombol ini memberi pesan dan tidak membuat file.


---

## Sumber data toko

Aplikasi memakai Supabase:

```
SUPABASE_URL      = https://vnvxknlpwjquzbmrzaju.supabase.co
SUPABASE_ANON_KEY = sb_publishable_fyxNidWq9fkGExXJNzad_w_V-_-XV-b
Tabel             = public."TOKO"
```

Kolom yang dipakai:

| kolom       | keterangan                         |
|-------------|------------------------------------|
| `nama_toko` | nama toko, mis. `Anyer - 2`        |
| `cabang`    | cabang/wilayah, mis. `CILEGON`     |
| `regional`  | opsional; kalau kosong pakai cabang |

Saat halaman dibuka, aplikasi membaca `TOKO` dari Supabase. Kalau tabel belum
bisa dibaca (RLS/kolom salah), aplikasi memakai **data cadangan 202 toko** yang
sudah ditanam di `index.html`. Status di header akan bertuliskan
**“Data cadangan”** dan muncul banner kuning berisi tombol
**⬇ Unduh SQL perbaikan**.

### Memperbaiki tabel TOKO (sekali saja)

1. Buka aplikasi, klik **⬇ Unduh SQL perbaikan** pada banner kuning
   (atau salin lewat tombol **Salin SQL**). File bernama `perbaiki-toko.sql`.
2. Buka **Supabase → SQL Editor**.
3. Tempel seluruh isi file, lalu klik **Run**.
4. Kembali ke aplikasi dan klik **↻ Muat ulang data toko dari Supabase**.

SQL tersebut **tidak menghapus data**:

- membuat tabel `public."TOKO"` kalau belum ada,
- mengganti nama kolom lama hasil impor CSV
  (`"Anyer - 2"` → `nama_toko`, `"CILEGON"` → `cabang`),
- menambah kolom `nama_toko`, `cabang`, `regional` kalau belum ada,
- melengkapi 202 toko cadangan yang belum ada (tanpa menghapus/menduplikasi),
- membuat RLS policy **baca** dan **tambah** untuk role `anon`/`authenticated`,
- memberi `grant select, insert` pada tabel,
- meminta PostgREST memuat ulang schema cache (`notify pgrst`).

### Import massal lewat Table Editor (opsional)

Kalau ingin mengisi banyak toko sekaligus, file CSV untuk
**Table Editor → Import data from CSV** harus punya baris judul yang sama
persis dengan nama kolom tabel:

```csv
nama_toko,cabang,regional
Anyer - 2,CILEGON,
Pekayon,BEKASI,
```

Cara paling aman tetap menjalankan `perbaiki-toko.sql` karena sekaligus
mengatur RLS dan mengisi 202 toko. Kalau ingin memakai nama tabel lain, ubah
konstanta `TABLE_TOKO` di `index.html`.

---

## Menjalankan secara lokal

```powershell
cd rekaporder
python -m http.server 8766 --bind 127.0.0.1
# buka http://127.0.0.1:8766/index.html
```

Tidak perlu build tool. Semua dependensi dimuat dari CDN:

- ExcelJS (`exceljs@4.4.0`) untuk membuat Excel lengkap dengan style, merge,
  dan logo,
- Supabase JS (`@supabase/supabase-js@2`) untuk baca/tambah tabel `TOKO`.

---

## Tampilan & PWA

- Di layar lebar (≥900px) formulir tampil di kolom kiri, sedangkan preview dan
  export di kolom kanan. Di HP tetap satu kolom seperti sebelumnya.
- `manifest.json` membuat aplikasi bisa dipasang ke home screen (Add to Home
  Screen) dan berjalan dalam mode `standalone`.
- Ikon aplikasi memakai `icon-192.png` dan `icon-512.png`, dengan warna tema
  `#16a085` (hijau Villa Parfum).

---

## Deploy

Repo ini sudah terhubung ke GitHub Pages:

- Branch: `main`
- Path: `/`
- URL: https://ugwap.github.io/rekaporder/

Setiap push ke `main` akan otomatis men-deploy ulang.

---

## Struktur file

```
index.html       # seluruh aplikasi (UI, logika, logo, data cadangan 202 toko)
manifest.json    # manifest PWA (nama, ikon, warna, mode standalone)
icon-192.png     # ikon PWA 192x192
icon-512.png     # ikon PWA 512x512
README.md        # dokumentasi ini
```
