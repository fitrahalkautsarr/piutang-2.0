import React, { useState } from 'react';
import { Invoice } from '../types';
import { formatIDR } from '../data/initialData';

interface ImportScreenProps {
  onImportConfirmed: (newInvoices: Invoice[]) => void;
  onShowToast: (title: string, message: string, type?: 'success' | 'info' | 'warn') => void;
  onNavigate: (screen: any) => void;
}

interface ImportRow {
  rowNum: number;
  invoiceNo: string;
  customer: string;
  invDate: string;
  dueDate: string;
  amount: number;
  status: 'valid' | 'duplicate' | 'error';
  statusLabel: string;
  diagnostic: string;
}

export const ImportScreen: React.FC<ImportScreenProps> = ({
  onImportConfirmed,
  onShowToast,
  onNavigate,
}) => {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentFile, setCurrentFile] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'error' | 'dup'>('all');
  const [isSpecModalOpen, setIsSpecModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const sampleRows: ImportRow[] = [
    {
      rowNum: 1,
      invoiceNo: 'INV/2026/09/BR-01042',
      customer: 'PT Semen Tonasa (Holding)',
      invDate: '2026-09-01',
      dueDate: '2026-10-01',
      amount: 845000000,
      status: 'valid',
      statusLabel: 'VALID',
      diagnostic: 'Data lengkap, format tanggal ISO terverifikasi SAP',
    },
    {
      rowNum: 2,
      invoiceNo: 'INV/2026/09/BR-01043',
      customer: 'CV Bosowa Transport Utama',
      invDate: '2026-09-05',
      dueDate: '2026-10-05',
      amount: 142300000,
      status: 'valid',
      statusLabel: 'VALID',
      diagnostic: 'Rekanan aktif dalam database master',
    },
    {
      rowNum: 3,
      invoiceNo: 'INV/2026/08/BR-00912',
      customer: 'PT Pelayaran Nusantara Perkasa',
      invDate: '2026-08-14',
      dueDate: '2026-09-14',
      amount: 320000000,
      status: 'duplicate',
      statusLabel: 'DUPLIKASI',
      diagnostic: 'Faktur sudah tercatat di Buku Besar (Posting 16-Aug-2026)',
    },
    {
      rowNum: 4,
      invoiceNo: 'INV/2026/09/BR-01044',
      customer: 'UD Biringkassi Mitra Sejahtera',
      invDate: '2026-09-10',
      dueDate: '2026-10-10',
      amount: 45000000,
      status: 'valid',
      statusLabel: 'VALID',
      diagnostic: 'Format angka numerik terverifikasi',
    },
    {
      rowNum: 5,
      invoiceNo: '',
      customer: 'PT Makassar Logistik Terminal',
      invDate: '2026-09-12',
      dueDate: '2026-10-12',
      amount: 67500000,
      status: 'error',
      statusLabel: 'FORMAT ERROR',
      diagnostic: 'Nomor Invoice KOSONG (Wajib Unique Key)',
    },
    {
      rowNum: 6,
      invoiceNo: 'INV/2026/09/BR-01045',
      customer: 'PT Tonasa Lines Maritim',
      invDate: '2026-09-15',
      dueDate: '2026-10-15',
      amount: 198000000,
      status: 'valid',
      statusLabel: 'VALID',
      diagnostic: 'Pencocokan nama rekanan berhasil (ID: VEND-9801)',
    },
    {
      rowNum: 7,
      invoiceNo: 'INV/2026/09/BR-01046',
      customer: 'Koperasi Karyawan Tonasa (Kopkar)',
      invDate: '2026-09-18',
      dueDate: '2026-10-18',
      amount: 28900000,
      status: 'valid',
      statusLabel: 'VALID',
      diagnostic: 'Data lengkap, PO SPK terasosiasi: SPK/2026/088',
    },
    {
      rowNum: 8,
      invoiceNo: 'INV/2026/09/BR-01047',
      customer: 'PT Daya Cipta Solusi',
      invDate: '18-OKT-2026',
      dueDate: 'Bulan Depan',
      amount: 55000000,
      status: 'error',
      statusLabel: 'FORMAT ERROR',
      diagnostic: 'Format Jatuh Tempo tidak valid ("Bulan Depan" bukan tanggal)',
    },
  ];

  const [dataset, setDataset] = useState<ImportRow[]>([]);

  const handleSimulateLoad = () => {
    setIsProcessing(true);
    setCurrentFile('SAP_AR_TONASA_202610.xlsx');

    setTimeout(() => {
      setDataset(sampleRows);
      setIsProcessing(false);
      setActiveStep(3); // Validated & Duplicate Check
      onShowToast('Berkas Divalidasi', '8 baris data berhasil diurai dan diverifikasi integritasnya.');
    }, 900);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const fileName = e.target.files[0].name;
      setCurrentFile(fileName);
      handleSimulateLoad();
    }
  };

  const handleCommitSync = () => {
    const validRows = dataset.filter((d) => d.status === 'valid');
    if (validRows.length === 0) {
      onShowToast('Tidak Ada Data Valid', 'Tidak ada data valid yang dapat disinkronkan.', 'warn');
      return;
    }

    const newInvoices: Invoice[] = validRows.map((row, idx) => ({
      id: `INV-IMP-${Date.now()}-${idx}`,
      no: row.invoiceNo,
      customer: row.customer,
      issueDate: row.invDate,
      dueDate: row.dueDate,
      amount: row.amount,
      paid: 0,
      balance: row.amount,
      status: 'current',
      followUpNote: 'Diimpor otomatis via ERP Tonasa Bridge',
    }));

    onImportConfirmed(newInvoices);
    setActiveStep(4);
    setIsSuccessModalOpen(true);
  };

  // Calculations
  const validCount = dataset.filter((d) => d.status === 'valid').length;
  const dupCount = dataset.filter((d) => d.status === 'duplicate').length;
  const errCount = dataset.filter((d) => d.status === 'error').length;
  const sumValidSaldo = dataset
    .filter((d) => d.status === 'valid')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const displayedRows = dataset.filter((row) => {
    if (activeFilter === 'error') return row.status === 'error';
    if (activeFilter === 'dup') return row.status === 'duplicate';
    return true;
  });

  return (
    <div className="flex flex-col w-full">
      <div className="px-margin py-space-xl flex flex-col gap-space-xl max-w-7xl mx-auto w-full">
        {/* Top Action & Context Banner */}
        <div className="bg-surface-canvas rounded-xl p-space-lg shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-space-lg border border-surface-border">
          <div className="flex flex-col min-w-0 max-w-3xl">
            <div className="flex items-center gap-space-sm mb-space-xs">
              <span className="px-space-sm py-0.5 rounded-full bg-brand-crimson-subtle text-brand-crimson font-label-badge text-label-badge tracking-wider uppercase">
                MODUL P-07 • SINKRONISASI DATA OPERASIONAL &amp; AUDIT
              </span>
              <span className="text-caption font-caption text-secondary">•</span>
              <span className="text-caption font-caption text-secondary">ERP Tonasa Bridge Rev 4.2</span>
            </div>
            <h1 className="font-headline-corporate text-headline-corporate text-on-surface tracking-tight">
              Impor Data &amp; Rekonsiliasi Berkas Piutang
            </h1>
            <p className="font-body-tabular text-body-tabular text-secondary mt-space-xs">
              Unggah berkas Excel/CSV mutasi piutang dari ERP Semen Tonasa atau berkas cabang dengan sistem validasi format otomatis, deteksi duplikasi faktur, dan pratinjau rekonsiliasi saldo.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-space-sm shrink-0">
            <button
              onClick={() => onShowToast('Unduh Template', 'Berkas Tonasa_AR_Import_Template_v2.xlsx berhasil diunduh.')}
              className="px-space-md py-space-sm rounded-lg bg-surface-subtle hover:bg-surface-container text-on-surface font-body-tabular-bold text-body-tabular transition-all shadow-sm flex items-center gap-space-xs cursor-pointer border border-surface-border"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px] text-secondary">download</span>
              <span>Unduh Format Template (.xlsx)</span>
            </button>
            <button
              onClick={() => setIsSpecModalOpen(true)}
              className="px-space-md py-space-sm rounded-lg hover:bg-surface-subtle text-on-surface-variant font-body-tabular text-body-tabular transition-all flex items-center gap-space-xs cursor-pointer border border-surface-border/50"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">menu_book</span>
              <span>Panduan Standar Kolom ERP</span>
            </button>
            <button
              onClick={() => onShowToast('Log Riwayat', 'Membuka riwayat log sinkronisasi 90 hari terakhir.', 'info')}
              className="px-space-md py-space-sm rounded-lg bg-secondary-fixed text-on-secondary-fixed hover:bg-secondary-fixed-dim font-body-tabular-bold text-body-tabular transition-all shadow-sm flex items-center gap-space-xs cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">history</span>
              <span>Log Riwayat Impor</span>
            </button>
          </div>
        </div>

        {/* Step Progress Wizard Bar */}
        <div className="bg-surface-canvas rounded-xl p-space-md shadow-sm border border-surface-border">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-space-sm relative">
            {/* Step 1 */}
            <div
              className={`flex items-center gap-space-md p-space-sm rounded-lg transition-all ${
                activeStep === 1 ? 'bg-brand-crimson text-on-primary shadow-sm' : 'bg-surface-subtle text-secondary'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full font-body-tabular-bold flex items-center justify-center text-body-tabular shrink-0 ${
                  activeStep === 1 ? 'bg-on-primary text-brand-crimson' : 'bg-surface-muted text-secondary'
                }`}
              >
                1
              </div>
              <div className="flex flex-col min-w-0">
                <span className={`font-body-tabular-bold text-body-tabular leading-tight truncate ${activeStep === 1 ? 'text-on-primary' : 'text-on-surface'}`}>
                  Unggah Berkas
                </span>
                <span className="font-caption text-caption opacity-80 text-[11px] truncate">
                  Format .xlsx atau .csv
                </span>
              </div>
            </div>

            {/* Step 2 */}
            <div
              className={`flex items-center gap-space-md p-space-sm rounded-lg transition-all ${
                activeStep === 2 ? 'bg-brand-crimson text-on-primary shadow-sm' : 'bg-surface-subtle text-secondary'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full font-body-tabular-bold flex items-center justify-center text-body-tabular shrink-0 ${
                  activeStep === 2 ? 'bg-on-primary text-brand-crimson' : 'bg-surface-muted text-secondary'
                }`}
              >
                2
              </div>
              <div className="flex flex-col min-w-0">
                <span className={`font-body-tabular-bold text-body-tabular leading-tight truncate ${activeStep === 2 ? 'text-on-primary' : 'text-on-surface'}`}>
                  Pemetaan Kolom
                </span>
                <span className="font-caption text-caption text-secondary text-[11px] truncate">
                  Header mapping SAP
                </span>
              </div>
            </div>

            {/* Step 3 */}
            <div
              className={`flex items-center gap-space-md p-space-sm rounded-lg transition-all ${
                activeStep === 3 ? 'bg-brand-crimson text-on-primary shadow-sm' : 'bg-surface-subtle text-secondary'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full font-body-tabular-bold flex items-center justify-center text-body-tabular shrink-0 ${
                  activeStep === 3 ? 'bg-on-primary text-brand-crimson' : 'bg-surface-muted text-secondary'
                }`}
              >
                3
              </div>
              <div className="flex flex-col min-w-0">
                <span className={`font-body-tabular-bold text-body-tabular leading-tight truncate ${activeStep === 3 ? 'text-on-primary' : 'text-on-surface'}`}>
                  Validasi &amp; Cek Duplikasi
                </span>
                <span className="font-caption text-caption opacity-80 text-[11px] truncate">
                  Pemeriksaan integritas
                </span>
              </div>
            </div>

            {/* Step 4 */}
            <div
              className={`flex items-center gap-space-md p-space-sm rounded-lg transition-all ${
                activeStep === 4 ? 'bg-brand-crimson text-on-primary shadow-sm' : 'bg-surface-subtle text-secondary'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full font-body-tabular-bold flex items-center justify-center text-body-tabular shrink-0 ${
                  activeStep === 4 ? 'bg-on-primary text-brand-crimson' : 'bg-surface-muted text-secondary'
                }`}
              >
                4
              </div>
              <div className="flex flex-col min-w-0">
                <span className={`font-body-tabular-bold text-body-tabular leading-tight truncate ${activeStep === 4 ? 'text-on-primary' : 'text-on-surface'}`}>
                  Konfirmasi Sinkronisasi
                </span>
                <span className="font-caption text-caption text-secondary text-[11px] truncate">
                  Commit saldo ke database
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Drag & Drop Zone and Rule Cards Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg items-start">
          {/* Upload Dropzone */}
          <div className="xl:col-span-7 flex flex-col gap-space-md">
            <div className="bg-surface-canvas rounded-xl p-space-xl shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center text-center relative overflow-hidden group min-h-[340px] border-2 border-dashed border-surface-border">
              <input
                accept=".xlsx,.xls,.csv"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                onChange={handleFileChange}
                type="file"
              />
              <div className="w-20 h-20 rounded-full bg-brand-crimson-subtle flex items-center justify-center text-brand-crimson mb-space-md group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[44px]">cloud_upload</span>
              </div>
              <h3 className="font-headline-corporate text-title-md text-on-surface mb-space-xs">
                Tarik &amp; Lepaskan Berkas Excel atau CSV ke Sini
              </h3>
              <p className="font-body-tabular text-body-tabular text-secondary max-w-lg mb-space-lg">
                Maksimal ukuran file 25 MB. Mendukung format standar ekspor SAP/ERP Semen Tonasa dan template pembukuan PT Biringkassi Raya.
              </p>
              <div className="flex items-center gap-space-md z-10 pointer-events-none mb-space-lg">
                <button
                  className="px-space-xl py-space-sm rounded-lg bg-brand-crimson hover:bg-brand-crimson-hover text-on-primary font-body-tabular-bold text-body-tabular shadow-md transition-all flex items-center gap-space-xs pointer-events-auto cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">file_open</span>
                  <span>Pilih File dari Komputer</span>
                </button>
              </div>
              <div className="flex items-center gap-space-xs flex-wrap justify-center">
                <span className="text-caption font-caption text-secondary mr-space-xs">Ekstensi Diterima:</span>
                <span className="px-space-sm py-0.5 rounded bg-surface-subtle font-label-badge text-label-badge text-secondary font-bold border border-surface-border">
                  .XLSX
                </span>
                <span className="px-space-sm py-0.5 rounded bg-surface-subtle font-label-badge text-label-badge text-secondary font-bold border border-surface-border">
                  .CSV
                </span>
                <span className="px-space-sm py-0.5 rounded bg-surface-subtle font-label-badge text-label-badge text-secondary font-bold border border-surface-border">
                  .XLS
                </span>
              </div>

              {/* Status Indicator Overlay */}
              {isProcessing && (
                <div className="absolute inset-0 bg-surface-canvas/95 flex flex-col items-center justify-center p-space-lg z-30">
                  <span className="material-symbols-outlined text-[48px] text-brand-crimson animate-spin mb-space-md">
                    progress_activity
                  </span>
                  <h4 className="font-headline-corporate text-title-md text-on-surface">
                    Membaca Struktur Baris &amp; Skema Kolom...
                  </h4>
                  <p className="font-body-tabular text-body-tabular text-secondary mt-space-xs font-mono">
                    {currentFile || 'BKR_AR_MUTATION_OCT2026.xlsx'}
                  </p>
                  <div className="w-64 h-2 bg-surface-container rounded-full mt-space-md overflow-hidden">
                    <div className="h-full bg-brand-crimson rounded-full animate-pulse w-3/4"></div>
                  </div>
                </div>
              )}
            </div>

            {/* Security Quick Note */}
            <div className="flex items-center gap-space-sm px-space-md py-space-sm bg-surface-canvas rounded-lg shadow-sm border border-surface-border">
              <span className="material-symbols-outlined text-[18px] text-status-current-text shrink-0">verified</span>
              <span className="font-caption text-caption text-secondary">
                Setiap data yang disinkronkan akan ditandatangani audit token log dengan ID Karyawan dan Timestamp resmi ERP Tonasa.
              </span>
            </div>
          </div>

          {/* Upload Rules Deck */}
          <div className="xl:col-span-5 flex flex-col gap-space-md">
            {/* Rule Card 1 */}
            <div className="bg-surface-canvas rounded-xl p-space-md shadow-sm relative overflow-hidden border border-surface-border">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand-crimson"></div>
              <div className="flex items-start gap-space-md pl-space-xs">
                <div className="w-10 h-10 rounded-lg bg-brand-crimson-subtle flex items-center justify-center text-brand-crimson shrink-0">
                  <span className="material-symbols-outlined text-[20px]">key</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-body-tabular-bold text-body-tabular-bold text-on-surface">
                      Aturan Kunci Unik (Unique Key)
                    </h4>
                    <span className="px-space-xs py-0.5 rounded bg-status-severe-bg text-status-severe-text font-label-badge text-label-badge">
                      WAJIB
                    </span>
                  </div>
                  <p className="font-caption text-caption text-secondary mt-space-xs">
                    Nomor Invoice bertindak sebagai Kunci Unik. Sistem mendeteksi otomatis duplikasi faktur pada database pusat Semen Tonasa dan menandai status peringatan sebelum commit.
                  </p>
                </div>
              </div>
            </div>

            {/* Rule Card 2 */}
            <div className="bg-surface-canvas rounded-xl p-space-md shadow-sm relative overflow-hidden border border-surface-border">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-status-due-text"></div>
              <div className="flex items-start gap-space-md pl-space-xs">
                <div className="w-10 h-10 rounded-lg bg-status-due-bg flex items-center justify-center text-status-due-text shrink-0">
                  <span className="material-symbols-outlined text-[20px]">fact_check</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-body-tabular-bold text-body-tabular-bold text-on-surface">Validasi Wajib Non-Null</h4>
                    <span className="px-space-xs py-0.5 rounded bg-status-due-bg text-status-due-text font-label-badge text-label-badge">
                      INTEGRITAS
                    </span>
                  </div>
                  <p className="font-caption text-caption text-secondary mt-space-xs">
                    Kolom <strong className="text-on-surface font-semibold">No. Invoice</strong>, <strong className="text-on-surface font-semibold">Nama Pelanggan/ID</strong>, <strong className="text-on-surface font-semibold">Tgl Faktur</strong>, <strong className="text-on-surface font-semibold">Jatuh Tempo</strong>, dan <strong className="text-on-surface font-semibold">Nilai Tagihan</strong> tidak boleh kosong.
                  </p>
                </div>
              </div>
            </div>

            {/* Rule Card 3 */}
            <div className="bg-surface-canvas rounded-xl p-space-md shadow-sm relative overflow-hidden border border-surface-border">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-secondary"></div>
              <div className="flex items-start gap-space-md pl-space-xs">
                <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-secondary shrink-0">
                  <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-body-tabular-bold text-body-tabular-bold text-on-surface">Format Angka &amp; Tanggal</h4>
                    <span className="px-space-xs py-0.5 rounded bg-surface-container text-on-surface font-label-badge text-label-badge">
                      STANDARD
                    </span>
                  </div>
                  <p className="font-caption text-caption text-secondary mt-space-xs">
                    Format angka murni tanpa simbol mata uang (<span className="font-mono">15000000.00</span>). Format tanggal yang diizinkan ISO (<span className="font-mono">YYYY-MM-DD</span>) atau standar Indonesia (<span className="font-mono">DD/MM/YYYY</span>).
                  </p>
                </div>
              </div>
            </div>

            {/* Status Jalur Pemeriksaan */}
            <div className="bg-surface-subtle rounded-xl p-space-md shadow-inner flex flex-col gap-space-xs border border-surface-border">
              <div className="flex items-center justify-between">
                <span className="font-label-badge text-label-badge text-secondary uppercase tracking-wider">
                  STATUS JALUR PEMERIKSAAN
                </span>
                <span className="text-caption font-caption text-status-current-text font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-status-current-text inline-block"></span> Sistem Normal
                </span>
              </div>
              <div className="flex items-center justify-between text-caption font-caption text-secondary pt-space-xs border-t border-surface-border">
                <span>Server Buffer: 128 MB</span>
                <span>Timeout Limit: 60s</span>
                <span>Encoding: UTF-8</span>
              </div>
            </div>
          </div>
        </div>

        {/* Preview & Status Section */}
        <div className="bg-surface-canvas rounded-xl shadow-sm overflow-hidden flex flex-col border border-surface-border">
          {/* Section Header */}
          <div className="p-space-lg flex flex-col lg:flex-row lg:items-center justify-between gap-space-md bg-surface-subtle border-b border-surface-border">
            <div className="flex flex-col">
              <h2 className="font-headline-corporate text-headline-corporate text-on-surface">
                Pratinjau Hasil Pembacaan Berkas &amp; Status Validasi
              </h2>
              <p className="font-caption text-caption text-secondary">
                Verifikasi visual sebelum data dimasukkan ke buku besar piutang aktif.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-space-sm">
              <button
                onClick={handleSimulateLoad}
                className="px-space-md py-space-sm rounded-lg bg-surface-canvas hover:bg-surface-container text-on-surface font-body-tabular-bold text-body-tabular transition-all shadow-sm flex items-center gap-space-xs cursor-pointer border border-surface-border"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px] text-brand-crimson">database</span>
                <span>Coba Gunakan Data Sampel Simulasi</span>
              </button>
              <button
                onClick={handleCommitSync}
                disabled={validCount === 0}
                className={`px-space-lg py-space-sm rounded-lg font-body-tabular-bold text-body-tabular transition-all flex items-center gap-space-xs cursor-pointer shadow-sm ${
                  validCount > 0
                    ? 'bg-brand-crimson hover:bg-brand-crimson-hover text-on-primary'
                    : 'bg-surface-muted text-secondary cursor-not-allowed opacity-60'
                }`}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">publish</span>
                <span>Sinkronkan ke Database Piutang</span>
              </button>
            </div>
          </div>

          {/* Diagnostic Metric Pills */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-space-xs p-space-md bg-surface-canvas border-b border-surface-border">
            <div className="p-space-sm rounded bg-surface-subtle flex flex-col border border-surface-border">
              <span className="text-caption font-label-badge text-secondary uppercase tracking-wider">TOTAL BARIS TERBACA</span>
              <span className="font-headline-corporate text-title-md text-on-surface font-bold mt-space-xs">
                {dataset.length} Baris
              </span>
            </div>
            <div className="p-space-sm rounded bg-status-current-bg text-status-current-text flex flex-col border border-status-current-text/20">
              <span className="text-caption font-label-badge uppercase tracking-wider">BARIS VALID (SIAP REKONSILIASI)</span>
              <span className="font-headline-corporate text-title-md font-bold mt-space-xs">
                {validCount} Faktur
              </span>
            </div>
            <div className="p-space-sm rounded bg-status-due-bg text-status-due-text flex flex-col border border-status-due-text/20">
              <span className="text-caption font-label-badge uppercase tracking-wider">PERINGATAN / DUPLIKASI</span>
              <span className="font-headline-corporate text-title-md font-bold mt-space-xs">
                {dupCount} Isu
              </span>
            </div>
            <div className="p-space-sm rounded bg-status-overdue-bg text-status-overdue-text flex flex-col border border-status-overdue-text/20">
              <span className="text-caption font-label-badge uppercase tracking-wider">ERROR FORMAT (DITOLAK)</span>
              <span className="font-headline-corporate text-title-md font-bold mt-space-xs">
                {errCount} Baris
              </span>
            </div>
            <div className="p-space-sm rounded bg-surface-subtle flex flex-col border border-surface-border">
              <span className="text-caption font-label-badge text-brand-crimson uppercase tracking-wider font-bold">TOTAL SALDO BARU</span>
              <span className="font-headline-corporate text-title-md text-brand-crimson font-bold mt-space-xs truncate">
                {formatIDR(sumValidSaldo)}
              </span>
            </div>
          </div>

          {/* Filter Tabs Bar */}
          <div className="px-space-lg py-space-sm bg-surface-canvas flex items-center justify-between flex-wrap gap-space-md border-b border-surface-border">
            <div className="flex items-center gap-space-xs">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-space-md py-1.5 rounded-lg font-body-tabular-bold text-caption transition-all cursor-pointer ${
                  activeFilter === 'all'
                    ? 'bg-brand-crimson text-on-primary'
                    : 'bg-surface-subtle hover:bg-surface-container text-on-surface-variant'
                }`}
              >
                Tampilkan Semua ({dataset.length})
              </button>
              <button
                onClick={() => setActiveFilter('error')}
                className={`px-space-md py-1.5 rounded-lg font-body-tabular-bold text-caption transition-all cursor-pointer ${
                  activeFilter === 'error'
                    ? 'bg-brand-crimson text-on-primary'
                    : 'bg-surface-subtle hover:bg-surface-container text-on-surface-variant'
                }`}
              >
                Hanya Error ({errCount})
              </button>
              <button
                onClick={() => setActiveFilter('dup')}
                className={`px-space-md py-1.5 rounded-lg font-body-tabular-bold text-caption transition-all cursor-pointer ${
                  activeFilter === 'dup'
                    ? 'bg-brand-crimson text-on-primary'
                    : 'bg-surface-subtle hover:bg-surface-container text-on-surface-variant'
                }`}
              >
                Hanya Duplikasi ({dupCount})
              </button>
            </div>
            <div className="flex items-center gap-space-sm text-caption text-secondary">
              <span className="material-symbols-outlined text-[16px]">info</span>
              <span>Audit trace terintegrasi dengan validasi SAP S/4HANA BAPI</span>
            </div>
          </div>

          {/* Preview Data Table */}
          <div className="overflow-x-auto w-full min-h-[320px] relative">
            <table className="w-full text-left font-body-tabular text-body-tabular border-collapse">
              <thead>
                <tr className="bg-surface-subtle text-secondary font-label-numeric text-label-numeric uppercase tracking-wider h-10 border-b border-surface-border">
                  <th className="px-space-md py-2 w-16 text-center">BARIS</th>
                  <th className="px-space-md py-2">NO. INVOICE</th>
                  <th className="px-space-md py-2">PELANGGAN / REKANAN</th>
                  <th className="px-space-md py-2">TGL INVOICE</th>
                  <th className="px-space-md py-2">JATUH TEMPO</th>
                  <th className="px-space-md py-2 text-right">NILAI TAGIHAN (RP)</th>
                  <th className="px-space-md py-2 text-center">STATUS VALIDASI</th>
                  <th className="px-space-md py-2">KETERANGAN DIAGNOSTIK</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {displayedRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-space-xl text-center bg-surface-canvas">
                      <div className="flex flex-col items-center justify-center max-w-md mx-auto py-space-xl">
                        <div className="w-16 h-16 rounded-full bg-surface-subtle flex items-center justify-center text-secondary mb-space-md border border-surface-border">
                          <span className="material-symbols-outlined text-[36px]">table_view</span>
                        </div>
                        <h4 className="font-headline-corporate text-title-md text-on-surface">
                          Belum Ada Berkas yang Diunggah
                        </h4>
                        <p className="font-body-tabular text-body-tabular text-secondary mt-space-xs mb-space-lg text-center">
                          Silakan pilih atau seret berkas data tagihan ke area unggah di atas untuk memulai proses verifikasi otomatis sebelum disimpan ke buku besar piutang.
                        </p>
                        <button
                          onClick={handleSimulateLoad}
                          className="px-space-lg py-space-sm rounded-lg bg-surface-subtle hover:bg-surface-container text-brand-crimson font-body-tabular-bold text-body-tabular transition-all flex items-center gap-space-xs shadow-sm cursor-pointer border border-surface-border"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[18px]">play_circle</span>
                          <span>Coba Gunakan Data Sampel Simulasi</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayedRows.map((row) => {
                    let badgeClass = 'bg-status-current-bg text-status-current-text';
                    if (row.status === 'duplicate') badgeClass = 'bg-status-due-bg text-status-due-text';
                    else if (row.status === 'error') badgeClass = 'bg-status-overdue-bg text-status-overdue-text';

                    return (
                      <tr key={row.rowNum} className="hover:bg-surface-subtle transition-colors h-12 text-sm">
                        <td className="px-space-md py-2 font-mono text-[12px] text-center text-secondary">
                          {row.rowNum}
                        </td>
                        <td className={`px-space-md py-2 font-body-tabular-bold font-semibold font-mono ${row.invoiceNo ? 'text-on-surface' : 'text-status-overdue-text italic'}`}>
                          {row.invoiceNo || 'TIDAK TERSEDIA'}
                        </td>
                        <td className="px-space-md py-2 text-on-surface truncate max-w-[240px]">
                          {row.customer}
                        </td>
                        <td className="px-space-md py-2 font-mono text-[12px] text-secondary">{row.invDate}</td>
                        <td className="px-space-md py-2 font-mono text-[12px] text-secondary">{row.dueDate}</td>
                        <td className="px-space-md py-2 text-right font-body-tabular-bold font-mono font-semibold text-on-surface">
                          {formatIDR(row.amount)}
                        </td>
                        <td className="px-space-md py-2 text-center">
                          <span className={`inline-block px-space-sm py-0.5 rounded-full font-label-badge text-[10px] ${badgeClass}`}>
                            {row.statusLabel}
                          </span>
                        </td>
                        <td className="px-space-md py-2 text-caption text-secondary truncate max-w-[280px]" title={row.diagnostic}>
                          {row.diagnostic}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="p-space-md bg-surface-subtle flex items-center justify-between flex-wrap gap-space-md text-caption font-caption text-secondary border-t border-surface-border">
            <div className="flex items-center gap-space-md">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-status-current-text inline-block"></span> Valid
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-status-due-text inline-block"></span> Duplikasi / Flag
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-status-overdue-text inline-block"></span> Format Error
              </span>
            </div>
            <div>
              <span>Menampilkan {displayedRows.length} dari {dataset.length} entri</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: ERP Column Spec */}
      {isSpecModalOpen && (
        <div className="fixed inset-0 bg-inverse-surface/60 z-50 flex items-center justify-center p-space-md backdrop-blur-sm">
          <div className="bg-surface-canvas rounded-xl shadow-xl max-w-2xl w-full overflow-hidden flex flex-col border border-surface-border animate-in fade-in zoom-in-95 duration-150">
            <div className="p-space-lg bg-surface-subtle flex items-center justify-between border-b border-surface-border">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-brand-crimson">account_tree</span>
                <h3 className="font-headline-corporate text-title-md text-on-surface">
                  Panduan Standar Kolom ERP Semen Tonasa
                </h3>
              </div>
              <button
                onClick={() => setIsSpecModalOpen(false)}
                className="w-8 h-8 rounded hover:bg-surface-container flex items-center justify-center text-secondary cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="p-space-lg flex flex-col gap-space-md overflow-y-auto max-h-[716px]">
              <p className="font-body-tabular text-body-tabular text-secondary">
                Sistem pengurai data PT Biringkassi Raya mendukung sinkronisasi otomatis jika kolom pada file Excel / CSV Anda memiliki nama header sesuai tabel pemetaan berikut:
              </p>
              <table className="w-full text-left font-body-tabular text-caption border-collapse">
                <thead>
                  <tr className="bg-surface-subtle text-secondary font-label-numeric uppercase border-b border-surface-border">
                    <th className="p-space-sm">Kolom Target</th>
                    <th className="p-space-sm">Format Data</th>
                    <th className="p-space-sm">Alias Header Diterima</th>
                    <th className="p-space-sm">Wajib</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  <tr>
                    <td className="p-space-sm font-semibold text-on-surface">No. Invoice</td>
                    <td className="p-space-sm text-secondary">String (Alfanumerik)</td>
                    <td className="p-space-sm font-mono text-[11px] text-brand-crimson">INVOICE_NO, NO_FAKTUR, BILLING_DOC</td>
                    <td className="p-space-sm font-bold text-status-overdue-text">YA</td>
                  </tr>
                  <tr>
                    <td className="p-space-sm font-semibold text-on-surface">ID Pelanggan</td>
                    <td className="p-space-sm text-secondary">String / ID Rekanan</td>
                    <td className="p-space-sm font-mono text-[11px]">CUSTOMER_CODE, KODE_DEBITUR</td>
                    <td className="p-space-sm font-bold text-status-overdue-text">YA</td>
                  </tr>
                  <tr>
                    <td className="p-space-sm font-semibold text-on-surface">Nama Pelanggan</td>
                    <td className="p-space-sm text-secondary">Teks</td>
                    <td className="p-space-sm font-mono text-[11px]">CUSTOMER_NAME, NAMA_REKANAN</td>
                    <td className="p-space-sm font-bold text-status-overdue-text">YA</td>
                  </tr>
                  <tr>
                    <td className="p-space-sm font-semibold text-on-surface">Tgl Invoice</td>
                    <td className="p-space-sm text-secondary">YYYY-MM-DD / DD/MM/YYYY</td>
                    <td className="p-space-sm font-mono text-[11px]">INVOICE_DATE, TGL_FAKTUR</td>
                    <td className="p-space-sm font-bold text-status-overdue-text">YA</td>
                  </tr>
                  <tr>
                    <td className="p-space-sm font-semibold text-on-surface">Jatuh Tempo</td>
                    <td className="p-space-sm text-secondary">YYYY-MM-DD / DD/MM/YYYY</td>
                    <td className="p-space-sm font-mono text-[11px]">DUE_DATE, TGL_JATUH_TEMPO</td>
                    <td className="p-space-sm font-bold text-status-overdue-text">YA</td>
                  </tr>
                  <tr>
                    <td className="p-space-sm font-semibold text-on-surface">Nilai Tagihan</td>
                    <td className="p-space-sm text-secondary">Desimal / Float</td>
                    <td className="p-space-sm font-mono text-[11px]">AMOUNT, TOTAL_PIUTANG</td>
                    <td className="p-space-sm font-bold text-status-overdue-text">YA</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="p-space-md bg-surface-subtle flex justify-end border-t border-surface-border">
              <button
                onClick={() => setIsSpecModalOpen(false)}
                className="px-space-lg py-space-sm rounded-lg bg-surface-canvas hover:bg-surface-container text-on-surface font-body-tabular-bold text-body-tabular cursor-pointer border border-surface-border"
                type="button"
              >
                Tutup Informasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Commit Success */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 bg-inverse-surface/60 z-50 flex items-center justify-center p-space-md backdrop-blur-sm">
          <div className="bg-surface-canvas rounded-xl shadow-xl max-w-lg w-full p-space-xl flex flex-col items-center text-center border border-surface-border animate-in fade-in zoom-in-95 duration-150">
            <div className="w-16 h-16 rounded-full bg-status-current-bg text-status-current-text flex items-center justify-center mb-space-md">
              <span className="material-symbols-outlined text-[36px]">task_alt</span>
            </div>
            <h3 className="font-headline-corporate text-title-md text-on-surface">
              Rekonsiliasi Selesai &amp; Tersimpan
            </h3>
            <p className="font-body-tabular text-body-tabular text-secondary mt-space-xs mb-space-lg">
              Sebanyak <span className="font-bold text-on-surface">{validCount}</span> faktur piutang valid telah berhasil diintegrasikan ke buku besar operasional PT Biringkassi Raya. Dokumen log audit: <strong className="font-mono text-brand-crimson">REC-20261014-9982</strong>.
            </p>
            <div className="w-full flex gap-space-sm">
              <button
                onClick={() => {
                  setIsSuccessModalOpen(false);
                  onNavigate('daftar-piutang-invoice');
                }}
                className="flex-1 py-space-sm rounded-lg bg-brand-crimson hover:bg-brand-crimson-hover text-on-primary font-body-tabular-bold text-body-tabular shadow-sm cursor-pointer"
                type="button"
              >
                Lihat di Daftar Piutang
              </button>
              <button
                onClick={() => setIsSuccessModalOpen(false)}
                className="px-space-md py-space-sm rounded-lg bg-surface-subtle hover:bg-surface-container text-secondary font-body-tabular text-body-tabular cursor-pointer border border-surface-border"
                type="button"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
