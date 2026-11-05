# Rekap Order — Villa Parfum

Aplikasi web satu halaman untuk mencatat rekap order bulanan per toko dan
mengekspornya ke template Excel. Semua data aplikasi ada di dalam
`index.html`, jadi cukup di-deploy ke GitHub Pages.

**Demo:** https://ugwap.github.io/rekaporder/

---

## Alur pemakaian

1. **Pilih tanggal.** Bulan rekap di bagian 3 otomatis mengikuti tanggal.
2. **Ketik nama toko.** Daftar saran muncul dari database. Nama yang salah
   ketik otomatis dibetulkan saat Tab/klik keluar (mis. `anyr` → `Anyer - 2`).
   Nama yang masih ambigu (mis. `a` atau `cilegon`) tidak dipaksa, tinggal
   pilih dari daftar.
3. **Cabang terisi otomatis.** Cabang diambil dari database berdasarkan toko
   yang dipilih (read-only).
4. **Isi nominal** lalu klik **+ Tambah ke Daftar**.
5. Ulangi untuk toko/tanggal berikutnya, lalu klik **Download Rekap Excel
   Bulanan**.

### Export Excel

- Upload dulu file template master (`.xlsx`) di bagian 3.
- Pilih bulan pada `selectBulan` (tersinkron dari tanggal).
- Sheet yang dipakai adalah sheet ke-`bulan+1` di workbook template.
- Nominal ditulis di **baris 4 (header) → cari kolom cabang/nama toko** dan
  **baris `4 + hari`** (tanggal 1 = baris 5). Nilai lama di sel ditambahkan,
  format sel template tidak dihapus.
- Nama file: `Rekap_Order_<BULAN>_<TAHUN>.xlsx`.

---

## Sumber data toko

Aplikasi memakai Supabase:

```
SUPABASE_URL      = https://vnvxknlpwjquzbmrzaju.supabase.co
SUPABASE_ANON_KEY = sb_publishable_fyxNidWq9fkGExXJNzad_w_V-_-XV-b
Tabel             = public."TOKO"
```

Tabel `TOKO` idealnya punya kolom:

| kolom       | keterangan                         |
|-------------|------------------------------------|
| `nama_toko` | nama toko, mis. `Anyer - 2`        |
| `cabang`    | cabang/wilayah, mis. `CILEGON`     |
| `regional`  | opsional                           |

Saat halaman dibuka, aplikasi mencoba membaca `TOKO` lebih dulu. Kalau tabel
belum bisa dibaca (RLS/kolom salah), aplikasi memakai **CSV yang pernah
di-upload** atau **data cadangan `DATATOKO.csv` (202 toko)** yang sudah
ditanam di `index.html`. Status di header akan bertuliskan **“Data cadangan”**
/ **“CSV lokal”** dan muncul banner kuning berisi tombol
**⬇ Unduh SQL perbaikan**.

### Upload CSV data toko (tanpa Supabase)

Di bagian **2. Data Toko**, klik **Upload CSV Data Toko**. Formatnya:

```csv
nama toko,cabang
Pekayon,BEKASI
Bintara,BEKASI
Anyer - 2,CILEGON
```

- Satu toko per baris, urutan kolom: **nama toko, cabang**.
- Baris judul **boleh ada** (`nama_toko,cabang,regional`) atau **tidak ada**.
- Pemisah boleh koma (`,`) atau titik koma (`;`).
- Nama yang mengandung koma harus diapit tanda kutip:
  `"Toko, Dengan Koma",CILEGON`.
- Encoding: UTF-8.
- CSV disimpan di browser (localStorage), jadi tetap dipakai setelah refresh
  dan otomatis menjadi cadangan kalau Supabase tidak bisa dibaca.

### Format CSV untuk import ke Supabase

Kalau ingin mengisi tabel lewat **Table Editor → Import data from CSV**, file
harus punya baris judul yang **sama persis** dengan nama kolom tabel:

```csv
nama_toko,cabang,regional
Anyer - 2,CILEGON,
Pekayon,BEKASI,
```

Lalu pastikan tabelnya punya kolom `nama_toko`, `cabang`, dan `regional`
(atau jalankan dulu `perbaiki-toko.sql`). Cara paling aman tetap menjalankan
SQL perbaikan karena sekaligus mengatur RLS dan mengisi 202 toko. Kalau ingin
memakai nama tabel lain, ubah konstanta `TABLE_TOKO` di `index.html`.

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
- mengisi 202 toko cadangan **hanya kalau tabel masih kosong**,
- membuat RLS policy baca + `grant select` untuk role `anon`,
- meminta PostgREST memuat ulang schema cache (`notify pgrst`).

Kalau tabel `TOKO` memang sudah berisi data yang benar, langkah insert akan
dilewati dan data lama tetap utuh.

---

## Menjalankan secara lokal

```powershell
cd rekaporder
python -m http.server 8766 --bind 127.0.0.1
# buka http://127.0.0.1:8766/index.html
```

Tidak perlu build tool. Semua dependensi dimuat dari CDN:

- SheetJS (`xlsx@0.18.5`) untuk baca/tulis Excel,
- Supabase JS (`@supabase/supabase-js@2`) untuk baca tabel `TOKO`.

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
index.html   # seluruh aplikasi (UI, logika, data cadangan 202 toko)
README.md    # dokumentasi ini
```
