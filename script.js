let listData = [];
let templateFileBuffer = null;

// Membaca file template excel yang diupload user
document.getElementById('fileTemplate').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        templateFileBuffer = new Uint8Array(e.target.result);
    };
    reader.readAsArrayBuffer(file);
});

// Tambah data ke tabel sementara
document.getElementById('btnTambah').addEventListener('click', function() {
    const tgl = document.getElementById('tgl').value;
    const namaPelanggan = document.getElementById('namaPelanggan').value;
    const jumlah = document.getElementById('jumlah').value;

    if (!tgl || !namaPelanggan || !jumlah) {
        alert('Semua kolom data harus diisi!');
        return;
    }

    listData.push({ tgl, namaPelanggan, jumlah: Number(jumlah) });
    renderTabel();
    
    // Reset input data (kecuali tanggal jika ingin cepat)
    document.getElementById('namaPelanggan').value = '';
    document.getElementById('jumlah').value = '';
});

function renderTabel() {
    const tbody = document.querySelector('#tabelData tbody');
    tbody.innerHTML = '';

    listData.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.tgl}</td>
            <td>${item.namaPelanggan}</td>
            <td>${item.jumlah}</td>
            <td><button onclick="hapusData(${index})" style="background-color: #dc3545;">Hapus</button></td>
        `;
        tbody.appendChild(tr);
    });
}

function hapusData(index) {
    listData.splice(index, 1);
    renderTabel();
}

// Proses Ekspor ke Excel berdasarkan Template
document.getElementById('btnExport').addEventListener('click', function() {
    if (listData.length === 0) {
        alert('Belum ada data yang dimasukkan untuk direkap!');
        return;
    }

    if (!templateFileBuffer) {
        alert('Silakan upload file template Excel terlebih dahulu!');
        return;
    }

    try {
        // Membaca workbook dari template yang diupload
        const workbook = XLSX.read(templateFileBuffer, { type: 'array' });
        
        // Ambil sheet pertama dari template
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Contoh penulisan data ke cell tertentu pada template Excel
        // Sesuaikan koordinat cell (misal: A10, B10, dst.) dengan form template Excel Anda
        let startRow = 10; // Baris awal pada template tempat data mulai dimasukkan
        
        listData.forEach((item, index) => {
            let currentRow = startRow + index;
            
            // Asumsi kolom A = Tanggal, B = Nama Pelanggan, C = Jumlah
            XLSX.utils.sheet_add_aoa(worksheet, [[item.tgl, item.namaPelanggan, item.jumlah]], { origin: `A${currentRow}` });
        });

        // Generate file baru dan download
        const bulanVal = document.getElementById('bulan').value || 'periode';
        XLSX.writeFile(workbook, `Rekap_Order_${bulanVal}.xlsx`);
    } catch (error) {
        console.error(error);
        alert('Terjadi kesalahan saat memproses file Excel.');
    }
});
