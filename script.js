// Konfigurasi Koneksi Supabase 
const SUPABASE_URL = 'https://YOUR_SUPABASE_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'https://vnvxknlpwjquzbmrzaju.supabase.co/rest/v1/';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let daftarData = [];
let templateBuffer = null;
let masterToko = [];

// Ambil data toko & regional dari Supabase
async function muatDataToko() {
    try {
        const { data, error } = await _supabase.from('toko').select('*');
        if (error) throw error;
        
        masterToko = data;
        const datalist = document.getElementById('listCabang');
        datalist.innerHTML = '';
        
        masterToko.forEach(item => {
            const option = document.createElement('option');
            option.value = item.nama_toko;
            option.label = `Regional: ${item.regional}`;
            datalist.appendChild(option);
        });
    } catch (err) {
        console.error('Gagal memuat data toko dari Supabase:', err);
    }
}

muatDataToko();

// Baca file template Excel yang diupload user
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
    let cabang = document.getElementById('inputCabang').value.trim();
    const nominal = parseFloat(document.getElementById('inputNominal').value);

    if (!tanggal || !cabang || isNaN(nominal)) {
        alert('Mohon lengkapi Tanggal, Nama Cabang, dan Nominal dengan benar!');
        return;
    }

    daftarData.push({ tanggal, cabang, nominal });
    renderTabelPreview();

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

// Proses Ekspor ke Excel berdasarkan Template
document.getElementById('btnExport').addEventListener('click', function() {
    if (daftarData.length === 0) {
        alert('Belum ada data yang dimasukkan!');
        return;
    }

    if (!templateBuffer) {
        alert('Silakan upload file template Excel master terlebih dahulu!');
        return;
    }

    const selectBulan = document.getElementById('selectBulan');
    const namaBulan = selectBulan.options[selectBulan.selectedIndex].text.toUpperCase();
    const bulanIndex = parseInt(selectBulan.value);
    const tahunAktif = new Date().getFullYear();

    try {
        const workbook = XLSX.read(templateBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[bulanIndex] || workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Petakan data input ke sel matriks excel berdasarkan template
        daftarData.forEach(item => {
            let tglObj = new Date(item.tanggal);
            if (tglObj.getMonth() === bulanIndex) {
                let hari = tglObj.getDate(); // 1 sampai 31
                let targetBaris = 4 + hari; // Sesuaikan baris tanggal di template Anda
                
                let colIndex = -1;
                let c = 1;
                while (true) {
                    let cellAddress = XLSX.utils.encode_cell({ r: 3, c: c });
                    let cell = worksheet[cellAddress];
                    if (!cell) break;
                    if (cell.v.toString().trim().toUpperCase() === item.cabang.toUpperCase()) {
                        colIndex = c;
                        break;
                    }
                    c++;
                }

                if (colIndex !== -1) {
                    let targetCell = XLSX.utils.encode_cell({ r: targetBaris - 1, c: colIndex });
                    let nilaiSebelumnya = worksheet[targetCell] ? Number(worksheet[targetCell].v) || 0 : 0;
                    XLSX.utils.sheet_add_aoa(worksheet, [[nilaiSebelumnya + item.nominal]], { origin: targetCell });
                }
            }
        });

        XLSX.writeFile(workbook, `Rekap_Order_${namaBulan}_${tahunAktif}.xlsx`);
    } catch (err) {
        console.error(err);
        alert('Terjadi kesalahan saat memproses file Excel.');
    }
});
