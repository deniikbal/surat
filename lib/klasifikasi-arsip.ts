// Sumber data resmi: Daftar Klasifikasi Arsip SMAN 1 Bantarujeg.
// Isi = apa adanya dari berkas klasifikasi.json (termasuk duplikat/gap kode — belum dirapikan).
// JANGAN edit manual; sumber kebenaran = file ini.

export type KlasifikasiNode = {
  kode: string
  nama: string
  urusan?: string
  children?: KlasifikasiNode[]
}

export const klasifikasiArsip: KlasifikasiNode[] = [
  {
    kode: "TU",
    nama: "Ketatausahaan",
    urusan: "fasilitatif",
    children: [
      {
        kode: "TU.01",
        nama: "Persuratan",
        children: [
          { kode: "TU.01.01", nama: "Pengurusan Surat Masuk" },
          { kode: "TU.01.02", nama: "Pengurusan Surat Keluar" }
        ]
      },
      { kode: "TU.02", nama: "Penggandaan Surat Masuk", children: [] },
      { kode: "TU.03", nama: "Agenda Kegiatan", children: [] },
      { kode: "TU.04", nama: "Rapat/Rakor/Rakernis", children: [] }
    ]
  },
  {
    kode: "PL",
    nama: "Perlengkapan",
    urusan: "fasilitatif",
    children: [
      { kode: "PL.01", nama: "Analisa Kebutuhan", children: [] },
      { kode: "PL.03", nama: "Penerimaan / Realisasi Pengadaan", children: [
        { kode: "PL.03.00", nama: "Alat Tulis Kantor" },
        { kode: "PL.03.01", nama: "Perlengkapan Kantor" },
        { kode: "PL.03.02", nama: "Tanah dan Bangunan" },
        { kode: "PL.03.05", nama: "Peralatan Kearsipan" }
      ]},
      { kode: "PL.06", nama: "Pemeliharaan", children: [] },
      { kode: "PL.07", nama: "Inventarisasi", children: [] },
      { kode: "PL.08", nama: "Penghapusan", children: [] }
    ]
  },
  {
    kode: "RT",
    nama: "Kerumahtanggaan",
    urusan: "fasilitatif",
    children: []
  },
  {
    kode: "KPG",
    nama: "Kepegawaian",
    urusan: "fasilitatif",
    children: [
      { kode: "KPG.02", nama: "Pengadaan Pegawai", children: [] },
      {
        kode: "KPG.03",
        nama: "Pembinaan Karir Pegawai",
        children: [
          {
            kode: "KPG.03.01",
            nama: "Diklat/Kursus/Magang/Tugas Belajar/Ujian Dinas/Ijin Belajar Pegawai",
            children: [
              { kode: "KPG.03.01.01", nama: "Surat Perintah/Surat Tugas/SK/Surat Ijin" },
              { kode: "KPG.03.01.02", nama: "Laporan Kegiatan Pengembangan Diri" },
              { kode: "KPG.03.01.03", nama: "Surat Tanda Tamat Pendidikan dan Pelatihan (STTPL)/Sertifikat" }
            ]
          },
          { kode: "KPG.03.02", nama: "Daftar Penilaian Pelaksanaan Pekerjaan (DP 3) / Standar Kinerja Pegawai (SKP)" },
          { kode: "KPG.03.03", nama: "Daftar Usul Penetapan Angka Kredit" }
        ]
      },
      {
        kode: "KPG.04",
        nama: "Disiplin Pegawai",
        children: [
          { kode: "KPG.04.01", nama: "Daftar Hadir" },
          { kode: "KPG.04.02", nama: "Rekapitulasi Daftar Hadir" }
        ]
      },
      { kode: "KPG.05", nama: "Berkas Hukuman Disiplin", children: [] },
      { kode: "KPG.06", nama: "Penghargaan dan Tanda Jasa", children: [] },
      {
        kode: "KPG.04",
        nama: "Mutasi Pegawai",
        children: []
      },
      {
        kode: "KPG.05",
        nama: "Mutasi Keluarga",
        children: [
          { kode: "KPG.05.01", nama: "Surat Izin Pernikahan/Perceraian" }
        ]
      },
      { kode: "KPG.06", nama: "Usul Kenaikan Pangkat/Golongan/Jabatan", children: [] },
      {
        kode: "KPG.11",
        nama: "Administrasi Pegawai",
        children: [
          { kode: "KPG.11.01", nama: "Surat Perintah Dinas/Surat Tugas" },
          { kode: "KPG.11.02", nama: "Cuti Besar" },
          { kode: "KPG.11.03", nama: "Cuti Sakit, Cuti Bersalin, Cuti Tahunan" },
          { kode: "KPG.11.04", nama: "Cuti Alasan Penting" },
          { kode: "KPG.11.05", nama: "Cuti Diluar Tanggungan Negara (CLTN)" }
        ]
      },
      { kode: "KPG.12", nama: "Dokumentasi Identitas Pegawai", children: [] },
      { kode: "KPG.13", nama: "Berkas Kepegawaian dan Daftar Urut Kepangkatan (DUK)", children: [] },
      { kode: "KPG.14", nama: "Berkas Pengurusan Kenaikan Gaji Berkala", children: [] },
      {
        kode: "KPG.15",
        nama: "Kesejahteraan Pegawai",
        children: [
          { kode: "KPG.15.01", nama: "Berkas tentang Layanan Pemeliharaan Kesehatan Pegawai" },
          { kode: "KPG.15.02", nama: "Berkas tentang Layanan Asuransi Pegawai/ASKES" }
        ]
      }
    ]
  },
  {
    kode: "KU",
    nama: "Keuangan",
    urusan: "fasilitatif",
    children: [
      {
        kode: "KU.02.10",
        nama: "Dokumen Belanja Langsung",
        children: [
          { kode: "KU.02.10.01", nama: "Belanja Pegawai" },
          { kode: "KU.02.10.02", nama: "Belanja Barang Jasa" },
          { kode: "KU.02.10.03", nama: "Belanja Modal" }
        ]
      },
      {
        kode: "KU.05",
        nama: "Dokumen Penatausahaan Keuangan",
        children: [
          { kode: "KU.05.01", nama: "Surat Penyediaan Dana (SPD)" },
          { kode: "KU.05.02", nama: "Surat Permohonan Pembayaran (SPP)" },
          { kode: "KU.05.03", nama: "Surat Perintah Membayar (SPM)" },
          { kode: "KU.05.04", nama: "Surat Perintah Pencairan Dana (SP2D)" }
        ]
      },
      {
        kode: "KU.06",
        nama: "Pertanggungjawaban Penggunaan Dana",
        children: [
          { kode: "KU.06.01", nama: "Buku Kas Umum (BKU)" },
          { kode: "KU.06.02", nama: "Buku Kas Pembantu (BKP)" },
          { kode: "KU.06.03", nama: "Ringkasan Perincian Pengeluaran Objek" },
          { kode: "KU.06.04", nama: "Rekening Koran Bank" },
          { kode: "KU.06.05", nama: "Pertanggungjawaban Fungsional dan Administrasi" },
          { kode: "KU.06.06", nama: "Bukti Penyetoran Pajak" },
          { kode: "KU.06.07", nama: "Register Penutupan Kas" },
          { kode: "KU.06.08", nama: "Berita Acara Pemeriksaan" },
          { kode: "KU.06.09", nama: "Laporan Realisasi Anggaran (LRA), Neraca, Catatan Atas Laporan Keuangan (CaLK), Arsip Data Komputer (ADK)" },
          { kode: "KU.06.10", nama: "Laporan Pendapatan Negara" },
          { kode: "KU.06.11", nama: "Laporan Keadaan Kredit Anggaran" }
        ]
      },
      { kode: "KU.07", nama: "Daftar Gaji", children: [] },
      { kode: "KU.08", nama: "Kartu Gaji", children: [] }
    ]
  },
  {
    kode: "AR",
    nama: "Kearsipan",
    urusan: "fasilitatif",
    children: [
      {
        kode: "AR.01",
        nama: "Kebijakan",
        children: [
          { kode: "AR.01.02", nama: "Tata Naskah Dinas" }
        ]
      }
    ]
  },
  {
    kode: "PK",
    nama: "Pendidikan",
    urusan: "substantif",
    children: [
      { kode: "PK.01.01.02", nama: "MoU (Memorandum of Understanding)" },
      {
        kode: "PK.03",
        nama: "Pembinaan Pendidikan",
        children: [
          { kode: "PK.03.03", nama: "Pendidikan Menengah", children: [
            { kode: "PK.03.03.01", nama: "Sekolah Menengah Atas (Kurikulum, Bahan Ajar, Pelatihan, Bintek/Sosialisasi, Lomba, Sayembara, Festival)" },
            { kode: "PK.03.03.02", nama: "Sekolah Menengah Atas (Block Grant, BOS, Bantuan Siswa Miskin)" },
            { kode: "PK.03.03.04", nama: "Pendidikan Khusus/PK-LK (Kelembagaan: UKS, Pendidikan Jasmani Adaftif, Pendidikan Inklusi, Block Grant, Bintek)" },
            { kode: "PK.03.03.05", nama: "Pendidik dan Tenaga Pendidik (Pendataan, Pemetaan, Pembinaan, Penilaian Prestasi, Kesejahteraan, Bintek)" },
            { kode: "PK.03.03.06", nama: "Pendidik dan Tenaga Pendidik (Peningkatan Kualitas: Standar, Uji, Sertifikasi Kompetensi)" },
            { kode: "PK.03.03.07", nama: "Pendidik dan Tenaga Pendidik (Block Grant, Penghargaan Guru dan Tenaga Kependidikan)" }
          ]}
        ]
      },
      {
        kode: "PK.07",
        nama: "Penilaian Pendidikan",
        children: [
          { kode: "PK.07.01", nama: "Penilaian Akademik" },
          { kode: "PK.07.02", nama: "Penilaian Non Akademik" },
          { kode: "PK.07.03", nama: "Analisis dan Sistem Informasi Penilaian" }
        ]
      }
    ]
  },
  {
    kode: "PUS",
    nama: "Perpustakaan",
    urusan: "substantif",
    children: [
      {
        kode: "PUS.02",
        nama: "Pengembangan Koleksi dan Pengolahan Bahan Pustaka",
        children: [
          {
            kode: "PUS.02.01",
            nama: "Akuisisi",
            children: [
              { kode: "PUS.02.01.01", nama: "Pembelian" },
              { kode: "PUS.02.01.02", nama: "Hibah" },
              { kode: "PUS.02.01.03", nama: "Hadiah" },
              { kode: "PUS.02.01.04", nama: "Tukar Menukar" },
              { kode: "PUS.02.01.05", nama: "Implementasi Undang-Undang KCKR" },
              { kode: "PUS.02.01.06", nama: "Terbitan Internal" },
              { kode: "PUS.02.01.07", nama: "Pendistribusian Bahan Pustaka Surplus" },
              { kode: "PUS.02.01.08", nama: "Inventarisasi Bahan Pustaka (Buku Induk)" }
            ]
          },
          { kode: "PUS.02.02", nama: "Pengolahan Bahan Pustaka" }
        ]
      }
    ]
  }
]

// Flatten pohon → daftar pilihan untuk dropdown (kode + nama).
// Format: "KODE — Nama" (kode dipakai sebagai value di DB).
export const klasifikasiFlat: { kode: string; nama: string; label: string }[] = (() => {
  const out: { kode: string; nama: string; label: string }[] = []
  const walk = (nodes: KlasifikasiNode[], prefix = "") => {
    for (const n of nodes) {
      const label = `${prefix}${n.kode} — ${n.nama}`
      out.push({ kode: n.kode, nama: n.nama, label })
      if (n.children?.length) walk(n.children, prefix)
    }
  }
  walk(klasifikasiArsip)
  return out
})()
