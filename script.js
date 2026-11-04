let daftarData = [];
let templateBuffer = null;

// Daftar nama cabang default sesuai contoh gambar Anda
const daftarCabangDefault = ["RAWALUMBU", "HARAPAN BARU", "PEKAYON", "BINTARA", "BONTENG", "CARINGIN 1"];

// Baca file template jika diupload user
document.getElementById('fileTemplate').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        templateBuffer = new Uint8Array(e.target.result);
        alert('Template Excel berhasil dimuat!');
    };
    reader.readAsArrayBuffer(file);
});

// Tombol tambah data
document.getElementById('btnTambah').addEventListener('click', function() {
    const tanggal = document.getElementById('inputTanggal').value;
    let cabang = document.getElementById('inputCabang').value.trim().toUpperCase();
    const nominal = parseFloat(document.getElementById('inputNominal').value);

    if (!tanggal || !cabang || isNaN(nominal)) {
        alert('Mohon lengkapi Tanggal, Nama Cabang, dan Nominal dengan benar!');
        return;
    }

    daftarData.push({ tanggal, cabang, nominal });
    renderTabelPreview();

    // Reset input form nominal & cabang (biar cepat input berikutnya)
    document.getElementById('inputNominal').value = '';
    document.getElementById('inputCabang').value = '';
});

function renderTabelPreview() {
    const tbody = document.querySelector('#tabelPreview tbody');
    tbody.innerHTML = '';

    daftarData.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.tanggal}</td>
            <td>${item.cabang}</td>
            <td>Rp ${item.nominal.toLocaleString('id-ID')}</td>
            <td><button class="btn-danger" onclick="hapusData(${index})">Hapus</button></td>
        `;
        tbody.appendChild(tr);
    });
}

function hapusData(index) {
    daftarData.splice(index, 1);
    renderTabelPreview();
}

// Proses Ekspor ke format Excel matrik (Tanggal di baris, Cabang di kolom)
document.getElementById('btnExport').addEventListener('click', function() {
    if (daftarData.length === 0) {
        alert('Belum ada data yang dimasukkan!');
        return;
    }

    const selectBulan = document.getElementById('selectBulan');
    const namaBulan = selectBulan.options[selectBulan.selectedIndex].text.toUpperCase();
    const bulanIndex = parseInt(selectBulan.value);
    const tahunAktif = new Date().getFullYear();

    try {
        let workbook;
        let worksheet;

        if (templateBuffer) {
            // Jika user pakai template sendiri
            workbook = XLSX.read(templateBuffer, { type: 'array' });
            const sheetName = workbook.SheetNames[bulanIndex] || workbook.SheetNames[0];
            worksheet = workbook.Sheets[sheetName];
        } else {
            // Buat worksheet baru otomatis sesuai struktur layout gambar Anda
            workbook = XLSX.utils.book_new();
            let wsData = [
                ["", "", "", "REKAP PERMINTAAN BARANG TAHUN " + tahunAktif],
                ["", "", "", namaBulan],
                [],
                ["TGL", ...daftarCabangDefault, "TOTAL"]
            ];

            // Tentukan jumlah hari dalam bulan tersebut
            const jumlahHari = new Date(tahunAktif, bulanIndex + 1, 0).getDate();
            
            for (let d = 1; d <= jumlahHari; d++) {
                let tglFormat = String(d).padStart(2, '0') + '-' + namaBulan.substring(0,3) + '-' + String(tahunAktif).slice(-2);
                let rowData = [tglFormat];
                
                // Isi kosong dulu untuk setiap cabang
                daftarCabangDefault.forEach(() => rowData.push(""));
                rowData.push(""); // Kolom Total
                wsData.push(rowData);
            }

            worksheet = XLSX.utils.aoa_to_sheet(wsData);
            XLSX.utils.book_append_sheet(workbook, worksheet, namaBulan);
        }

        // Petakan data input user ke dalam sel matriks Excel
        // Berdasarkan struktur: Header TGL ada di baris 4 (index 3), kolom Cabang mulai dari kolom ke-2 (index 1)
        // Baris Tanggal 1 dimulai dari baris ke-5 (index 4)
        
        daftarData.forEach(item => {
            let tglObj = new Date(item.tanggal);
            if (tglObj.getMonth() === bulanIndex) {
                let hari = tglObj.getDate(); // 1 sampai 31
                let targetBaris = 4 + hari; // Baris Excel disesuaikan dengan tanggal
                
                // Cari kolom cabang di baris ke-4
                let colIndex = -1;
                let c = 1;
                while (true) {
                    let cellAddress = XLSX.utils.encode_cell({ r: 3, c: c });
                    let cell = worksheet[cellAddress];
                    if (!cell) break;
                    if (cell.v.toString().toUpperCase() === item.cabang) {
                        colIndex = c;
                        break;
                    }
                    c++;
                }

                // Jika cabang ditemukan di tabel, masukkan nominalnya
                if (colIndex !== -1) {
                    let targetCell = XLSX.utils.encode_cell({ r: targetBaris - 1, c: colIndex });
                    let nilaiSebelumnya = worksheet[targetCell] ? Number(worksheet[targetCell].v) || 0 : 0;
                    
                    XLSX.utils.sheet_add_aoa(worksheet, [[nilaiSebelumnya + item.nominal]], { origin: targetCell });
                }
            }
        });

        // Download file excel
        XLSX.writeFile(workbook, `Rekap_Order_${namaBulan}_${tahunAktif}.xlsx`);

    } catch (err) {
        console.error(err);
        alert('Terjadi kesalahan saat memproses file Excel.');
    }
});
