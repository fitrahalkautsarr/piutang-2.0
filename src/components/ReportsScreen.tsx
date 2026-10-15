import React, { useState } from 'react';
import { Invoice } from '../types';
import { formatIDR, calculateAgingDays } from '../data/initialData';

interface ReportsScreenProps {
  invoices: Invoice[];
  onLoadSample: () => void;
  onShowToast: (title: string, message: string, type?: 'success' | 'info' | 'warn') => void;
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({
  invoices,
  onLoadSample,
  onShowToast,
}) => {
  const [activePreset, setActivePreset] = useState<'ledger' | 'aging' | 'overdue' | 'promise'>('ledger');
  const [dateStart, setDateStart] = useState('2026-10-01');
  const [dateEnd, setDateEnd] = useState('2026-10-14');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterRegion, setFilterRegion] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterMinVal, setFilterMinVal] = useState('');
  const [filterMaxVal, setFilterMaxVal] = useState('');

  // Modals
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);

  // Filtered rows
  const filteredRows = invoices.filter((inv) => {
    if (filterStatus === 'CURRENT' && calculateAgingDays(inv.dueDate) > 0) return false;
    if (filterStatus === 'OVERDUE' && (calculateAgingDays(inv.dueDate) <= 0 || calculateAgingDays(inv.dueDate) > 60)) return false;
    if (filterStatus === 'SEVERE' && calculateAgingDays(inv.dueDate) <= 90) return false;

    const min = parseFloat(filterMinVal);
    if (!isNaN(min) && inv.balance < min) return false;
    const max = parseFloat(filterMaxVal);
    if (!isNaN(max) && inv.balance > max) return false;

    return true;
  });

  const totalSaldo = filteredRows.reduce((a, c) => a + c.balance, 0);
  const totalTagihan = filteredRows.reduce((a, c) => a + c.amount, 0);
  const totalDibayar = filteredRows.reduce((a, c) => a + c.paid, 0);

  // Group by customer for aggregated report rows
  const partnerMap: Record<
    string,
    {
      code: string;
      name: string;
      faktur: number;
      totalAmount: number;
      paidAmount: number;
      balance: number;
      avgAge: number;
      status: string;
      statusClass: string;
      notes: string;
    }
  > = {};

  filteredRows.forEach((inv) => {
    const cust = inv.customer;
    const days = calculateAgingDays(inv.dueDate, dateEnd);

    if (!partnerMap[cust]) {
      let statusLabel = '0 - 30 Hari';
      let statusClass = 'bg-status-current-bg text-status-current-text';
      if (inv.balance <= 0) {
        statusLabel = 'Lunas / Tertutup';
        statusClass = 'bg-surface-subtle text-secondary';
      } else if (days > 90) {
        statusLabel = '> 90 Hari (Macet)';
        statusClass = 'bg-brand-crimson text-on-primary';
      } else if (days > 60) {
        statusLabel = '61 - 90 Hari';
        statusClass = 'bg-status-overdue-bg text-status-overdue-text';
      } else if (days > 30) {
        statusLabel = '31 - 60 Hari';
        statusClass = 'bg-status-due-bg text-status-due-text';
      }

      partnerMap[cust] = {
        code: inv.customerCode || 'CUST-0091',
        name: inv.customer,
        faktur: 0,
        totalAmount: 0,
        paidAmount: 0,
        balance: 0,
        avgAge: Math.max(0, days),
        status: statusLabel,
        statusClass,
        notes: inv.followUpNote || 'Sesuai jadwal penagihan reguler operasional.',
      };
    }

    partnerMap[cust].faktur += 1;
    partnerMap[cust].totalAmount += inv.amount;
    partnerMap[cust].paidAmount += inv.paid;
    partnerMap[cust].balance += inv.balance;
  });

  const reportData = Object.values(partnerMap);

  const getHeadingTitle = () => {
    switch (activePreset) {
      case 'aging':
        return 'Pratinjau: Laporan Matriks Rekapitulasi Umur Piutang (Aging Summary)';
      case 'overdue':
        return 'Pratinjau: Laporan Monitoring Tagihan Kritis & Overdue Prioritas';
      case 'promise':
        return 'Pratinjau: Laporan Realisasi Komitmen & Efektivitas Janji Bayar';
      case 'ledger':
      default:
        return 'Pratinjau: Laporan Buku Pembantu Piutang (AR Ledger)';
    }
  };

  const handleApplyFilter = () => {
    onShowToast('Filter Diterapkan', `Laporan dihitung ulang dengan cut-off ${dateEnd}.`);
  };

  const handleResetFilter = () => {
    setFilterCategory('ALL');
    setFilterRegion('ALL');
    setFilterStatus('ALL');
    setFilterMinVal('');
    setFilterMaxVal('');
    onShowToast('Filter Direset', 'Parameter filter dikembalikan ke pengaturan awal.', 'info');
  };

  return (
    <div className="flex flex-col w-full">
      {/* Sub-Header & Action Control Bar */}
      <section className="bg-surface-canvas border-b border-surface-border px-margin py-space-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md max-w-7xl mx-auto w-full">
          <div className="space-y-space-xs max-w-3xl">
            <div className="flex items-center gap-space-xs">
              <span className="inline-flex items-center px-space-sm py-0.5 rounded bg-brand-crimson-subtle text-brand-crimson font-label-badge text-label-badge tracking-wider border border-brand-crimson/20 uppercase">
                MODUL P-08 • Pelaporan Finansial &amp; Audit Internal
              </span>
              <span className="text-caption font-caption text-secondary">• Standar SAP &amp; Audit Tonasa Group</span>
            </div>
            <h1 className="font-headline-corporate text-headline-corporate text-on-surface uppercase tracking-tight">
              Pusat Laporan Operasional Piutang Usaha
            </h1>
            <p className="font-body-tabular text-caption text-secondary">
              Hasilkan laporan berkala saldo piutang terbuka, rekapan jatuh tempo, matriks aging schedule, dan efektivitas penagihan dengan filter dinamis dan ekspor audit siap cetak.
            </p>
          </div>

          {/* Action Group */}
          <div className="flex flex-wrap items-center gap-space-sm self-start lg:self-center">
            <button
              onClick={() => setIsScheduleOpen(true)}
              className="inline-flex items-center gap-space-xs px-space-md py-2 rounded-lg bg-surface text-secondary hover:bg-surface-muted hover:text-on-surface font-body-tabular-bold text-caption border border-surface-border transition-all cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">schedule</span>
              <span>Jadwalkan Otomatis</span>
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-space-xs px-space-md py-2 rounded-lg bg-surface-canvas text-on-surface hover:bg-surface-subtle font-body-tabular-bold text-caption border border-surface-border transition-all shadow-sm cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px] text-brand-crimson">print</span>
              <span>Cetak PDF Rekapitulasi</span>
            </button>
            <button
              onClick={() => onShowToast('Ekspor XLSX', 'Mengunduh laporan aktif konsolidasi ke format Excel XLSX.')}
              className="inline-flex items-center gap-space-xs px-space-md py-2 rounded-lg bg-brand-crimson text-on-primary hover:bg-brand-crimson-hover font-body-tabular-bold text-caption transition-all shadow-sm cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">table_view</span>
              <span>Ekspor Laporan Aktif (.XLSX)</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Work Content */}
      <div className="max-w-7xl mx-auto w-full px-margin space-y-space-lg pt-space-lg pb-space-xl">
        {/* Interactive Report Presets (Archetypes) */}
        <section>
          <div className="flex items-center justify-between mb-space-sm">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-brand-crimson text-[20px]">dataset</span>
              <h2 className="font-title-md text-title-md text-on-surface">Pilih Format &amp; Model Laporan</h2>
            </div>
            <span className="font-caption text-caption text-secondary">Klik jenis laporan untuk menyesuaikan skema data</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-md">
            {/* Preset 1 */}
            <div
              onClick={() => setActivePreset('ledger')}
              className={`cursor-pointer rounded-lg bg-surface-canvas p-space-md transition-all relative overflow-hidden group border-2 ${
                activePreset === 'ledger' ? 'border-brand-crimson' : 'border-surface-border hover:border-brand-crimson/50'
              }`}
            >
              {activePreset === 'ledger' && (
                <div className="absolute top-0 right-0 bg-brand-crimson text-on-primary font-label-badge text-label-badge px-space-sm py-0.5 rounded-bl">
                  AKTIF
                </div>
              )}
              <div className="flex items-start gap-space-sm">
                <div className="w-9 h-9 rounded bg-brand-crimson-subtle flex items-center justify-center shrink-0 text-brand-crimson">
                  <span className="material-symbols-outlined text-[20px]">menu_book</span>
                </div>
                <div className="space-y-space-xs min-w-0">
                  <h3 className="font-body-tabular-bold text-caption font-bold text-on-surface truncate">
                    Buku Pembantu Piutang (AR Ledger)
                  </h3>
                  <p className="font-caption text-caption text-secondary line-clamp-2 leading-relaxed">
                    Rincian seluruh tagihan terbuka, pembayaran tercatat, dan sisa saldo per debitur per nomor rekening.
                  </p>
                </div>
              </div>
              <div className="mt-space-md pt-space-xs border-t border-surface-border flex items-center justify-between text-caption text-secondary">
                <span className="font-label-numeric text-[11px]">Format: Rincian Lengkap</span>
                <span className="material-symbols-outlined text-brand-crimson text-[16px]">check_circle</span>
              </div>
            </div>

            {/* Preset 2 */}
            <div
              onClick={() => setActivePreset('aging')}
              className={`cursor-pointer rounded-lg bg-surface-canvas p-space-md transition-all relative overflow-hidden group border-2 ${
                activePreset === 'aging' ? 'border-brand-crimson' : 'border-surface-border hover:border-brand-crimson/50'
              }`}
            >
              {activePreset === 'aging' && (
                <div className="absolute top-0 right-0 bg-brand-crimson text-on-primary font-label-badge text-label-badge px-space-sm py-0.5 rounded-bl">
                  AKTIF
                </div>
              )}
              <div className="flex items-start gap-space-sm">
                <div className="w-9 h-9 rounded bg-surface-subtle flex items-center justify-center shrink-0 text-secondary group-hover:text-brand-crimson">
                  <span className="material-symbols-outlined text-[20px]">pie_chart</span>
                </div>
                <div className="space-y-space-xs min-w-0">
                  <h3 className="font-body-tabular-bold text-caption font-bold text-on-surface truncate">
                    Matriks Umur Piutang (Aging)
                  </h3>
                  <p className="font-caption text-caption text-secondary line-clamp-2 leading-relaxed">
                    Pengelompokan saldo berdasarkan bucket Current, 1-30, 31-60, 61-90, dan &gt;90 hari untuk review manajemen.
                  </p>
                </div>
              </div>
              <div className="mt-space-md pt-space-xs border-t border-surface-border flex items-center justify-between text-caption text-secondary">
                <span className="font-label-numeric text-[11px]">Format: Matriks 5 Bucket</span>
                <span className="material-symbols-outlined text-secondary/40 text-[16px]">arrow_forward</span>
              </div>
            </div>

            {/* Preset 3 */}
            <div
              onClick={() => setActivePreset('overdue')}
              className={`cursor-pointer rounded-lg bg-surface-canvas p-space-md transition-all relative overflow-hidden group border-2 ${
                activePreset === 'overdue' ? 'border-brand-crimson' : 'border-surface-border hover:border-brand-crimson/50'
              }`}
            >
              {activePreset === 'overdue' && (
                <div className="absolute top-0 right-0 bg-brand-crimson text-on-primary font-label-badge text-label-badge px-space-sm py-0.5 rounded-bl">
                  AKTIF
                </div>
              )}
              <div className="flex items-start gap-space-sm">
                <div className="w-9 h-9 rounded bg-surface-subtle flex items-center justify-center shrink-0 text-secondary group-hover:text-status-overdue-text">
                  <span className="material-symbols-outlined text-[20px]">warning</span>
                </div>
                <div className="space-y-space-xs min-w-0">
                  <h3 className="font-body-tabular-bold text-caption font-bold text-on-surface truncate">
                    Tagihan Jatuh Tempo &amp; Overdue
                  </h3>
                  <p className="font-caption text-caption text-secondary line-clamp-2 leading-relaxed">
                    Daftar invoice mendekati jatuh tempo dan tagihan macet yang membutuhkan surat teguran resmi atau SPP.
                  </p>
                </div>
              </div>
              <div className="mt-space-md pt-space-xs border-t border-surface-border flex items-center justify-between text-caption text-secondary">
                <span className="font-label-numeric text-[11px]">Format: Tagihan Kritis</span>
                <span className="material-symbols-outlined text-secondary/40 text-[16px]">arrow_forward</span>
              </div>
            </div>

            {/* Preset 4 */}
            <div
              onClick={() => setActivePreset('promise')}
              className={`cursor-pointer rounded-lg bg-surface-canvas p-space-md transition-all relative overflow-hidden group border-2 ${
                activePreset === 'promise' ? 'border-brand-crimson' : 'border-surface-border hover:border-brand-crimson/50'
              }`}
            >
              {activePreset === 'promise' && (
                <div className="absolute top-0 right-0 bg-brand-crimson text-on-primary font-label-badge text-label-badge px-space-sm py-0.5 rounded-bl">
                  AKTIF
                </div>
              )}
              <div className="flex items-start gap-space-sm">
                <div className="w-9 h-9 rounded bg-surface-subtle flex items-center justify-center shrink-0 text-secondary group-hover:text-brand-crimson">
                  <span className="material-symbols-outlined text-[20px]">assignment_turned_in</span>
                </div>
                <div className="space-y-space-xs min-w-0">
                  <h3 className="font-body-tabular-bold text-caption font-bold text-on-surface truncate">
                    Efektivitas Janji Bayar
                  </h3>
                  <p className="font-caption text-caption text-secondary line-clamp-2 leading-relaxed">
                    Evaluasi komitmen pembayaran debitur yang terealisasi vs ingkar janji per penanggung jawab lapangan.
                  </p>
                </div>
              </div>
              <div className="mt-space-md pt-space-xs border-t border-surface-border flex items-center justify-between text-caption text-secondary">
                <span className="font-label-numeric text-[11px]">Format: KPI Kolektabilitas</span>
                <span className="material-symbols-outlined text-secondary/40 text-[16px]">arrow_forward</span>
              </div>
            </div>
          </div>
        </section>

        {/* Multi-Filter Bar */}
        <section>
          <div className="bg-surface-canvas rounded-lg border border-surface-border p-space-md shadow-sm">
            <div className="flex flex-col gap-space-md">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-space-md">
                {/* Cut Off Range */}
                <div className="space-y-space-xs">
                  <label className="block font-label-badge text-label-badge uppercase text-secondary">
                    Periode Cut-Off Laporan
                  </label>
                  <div className="flex items-center gap-space-xs">
                    <input
                      value={dateStart}
                      onChange={(e) => setDateStart(e.target.value)}
                      className="w-full h-9 px-space-sm bg-surface-canvas text-caption font-body-tabular text-on-surface border border-surface-border rounded focus:border-brand-crimson focus:outline-none"
                      type="date"
                    />
                    <span className="text-caption text-secondary">s/d</span>
                    <input
                      value={dateEnd}
                      onChange={(e) => setDateEnd(e.target.value)}
                      className="w-full h-9 px-space-sm bg-surface-canvas text-caption font-body-tabular text-on-surface border border-surface-border rounded focus:border-brand-crimson focus:outline-none"
                      type="date"
                    />
                  </div>
                </div>

                {/* Kategori Mitra */}
                <div className="space-y-space-xs">
                  <label className="block font-label-badge text-label-badge uppercase text-secondary">
                    Kategori Mitra Bisnis
                  </label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full h-9 px-space-sm bg-surface-canvas text-caption font-body-tabular text-on-surface border border-surface-border rounded focus:border-brand-crimson focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">Semua Mitra &amp; Segmentasi</option>
                    <option value="DIST">Distributor Semen Kantong</option>
                    <option value="CURAH">Pelanggan Semen Curah</option>
                    <option value="PROYEK">Kontraktor &amp; Proyek BUMN</option>
                    <option value="INTERNAL">Unit Kerja Semen Tonasa Group</option>
                  </select>
                </div>

                {/* Wilayah Operasional */}
                <div className="space-y-space-xs">
                  <label className="block font-label-badge text-label-badge uppercase text-secondary">
                    Wilayah Pemasaran
                  </label>
                  <select
                    value={filterRegion}
                    onChange={(e) => setFilterRegion(e.target.value)}
                    className="w-full h-9 px-space-sm bg-surface-canvas text-caption font-body-tabular text-on-surface border border-surface-border rounded focus:border-brand-crimson focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">Semua Wilayah Operasional</option>
                    <option value="SULSEL">Sulawesi Selatan &amp; Barat</option>
                    <option value="SULTENG">Sulawesi Tengah &amp; Tenggara</option>
                    <option value="MALUKU">Maluku &amp; Maluku Utara</option>
                    <option value="PAPUA">Papua &amp; Papua Barat</option>
                    <option value="KALIMANTAN">Kalimantan Timur &amp; Selatan</option>
                  </select>
                </div>

                {/* Status Kolektibilitas */}
                <div className="space-y-space-xs">
                  <label className="block font-label-badge text-label-badge uppercase text-secondary">
                    Status Kolektibilitas
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full h-9 px-space-sm bg-surface-canvas text-caption font-body-tabular text-on-surface border border-surface-border rounded focus:border-brand-crimson focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">Semua Status Kolektibilitas</option>
                    <option value="CURRENT">Lancar (Belum Jatuh Tempo)</option>
                    <option value="DUE">Jatuh Tempo Hari Ini (0 Hari)</option>
                    <option value="OVERDUE">Terlambat (1 - 60 Hari)</option>
                    <option value="SEVERE">Kolektibilitas Macet (&gt;90 Hari)</option>
                  </select>
                </div>

                {/* Batas Nominal Range */}
                <div className="space-y-space-xs">
                  <label className="block font-label-badge text-label-badge uppercase text-secondary">
                    Batas Nominal Saldo (IDR)
                  </label>
                  <div className="flex items-center gap-space-xs">
                    <input
                      value={filterMinVal}
                      onChange={(e) => setFilterMinVal(e.target.value)}
                      className="w-1/2 h-9 px-space-xs text-caption font-body-tabular text-on-surface border border-surface-border rounded focus:border-brand-crimson focus:outline-none"
                      placeholder="Min (Rp)"
                      type="text"
                    />
                    <span className="text-caption text-secondary">-</span>
                    <input
                      value={filterMaxVal}
                      onChange={(e) => setFilterMaxVal(e.target.value)}
                      className="w-1/2 h-9 px-space-xs text-caption font-body-tabular text-on-surface border border-surface-border rounded focus:border-brand-crimson focus:outline-none"
                      placeholder="Max (Rp)"
                      type="text"
                    />
                  </div>
                </div>
              </div>

              {/* Sub-Row Controls */}
              <div className="flex flex-wrap items-center justify-between gap-space-sm pt-space-xs border-t border-surface-border/70">
                <div className="flex items-center gap-space-sm text-caption text-secondary">
                  <span className="flex items-center gap-1 font-caption">
                    <span className="w-2 h-2 rounded-full bg-status-current-text inline-block"></span>
                    Basis Akuntansi: <strong>Stelsel Akrual (Accrual Basis)</strong>
                  </span>
                  <span className="hidden md:inline">•</span>
                  <span className="hidden md:inline font-caption">Koneksi ERP SAP S/4HANA: Real-Time Sync</span>
                </div>
                <div className="flex items-center gap-space-xs">
                  <button
                    onClick={handleResetFilter}
                    className="px-space-md py-1.5 rounded text-caption font-body-tabular text-secondary hover:text-on-surface hover:bg-surface-subtle transition-all cursor-pointer"
                    type="button"
                  >
                    Reset Filter
                  </button>
                  <button
                    onClick={() => onShowToast('Preset Disimpan', 'Preset filter kustom berhasil disimpan sebagai preferensi user.')}
                    className="px-space-md py-1.5 rounded text-caption font-body-tabular-bold text-on-surface hover:bg-surface-subtle border border-surface-border transition-all cursor-pointer"
                    type="button"
                  >
                    Simpan Preset Filter
                  </button>
                  <button
                    onClick={handleApplyFilter}
                    className="inline-flex items-center gap-space-xs px-space-md py-1.5 rounded bg-brand-crimson text-on-primary hover:bg-brand-crimson-hover font-body-tabular-bold text-caption transition-all shadow-sm cursor-pointer"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[16px]">filter_alt</span>
                    <span>Terapkan Filter</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Report Metadata Header & Summary Metrics */}
        <section>
          <div className="bg-surface-canvas rounded-lg border border-surface-border p-space-lg shadow-sm space-y-space-md">
            {/* Report Header Metadata Strip */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-space-md border-b border-surface-border gap-space-sm">
              <div className="space-y-0.5">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-brand-crimson text-[20px]">description</span>
                  <h2 className="font-headline-corporate text-title-md font-bold text-on-surface">
                    {getHeadingTitle()}
                  </h2>
                </div>
                <p className="font-caption text-caption text-secondary">
                  Dokumen resmi unit penagihan internal PT Biringkassi Raya • PT Semen Tonasa (Persero) Tbk.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-space-sm">
                <div className="bg-surface-subtle px-space-sm py-1 rounded border border-surface-border flex items-center gap-space-xs text-caption">
                  <span className="text-secondary font-label-badge text-[11px] uppercase">Cut-Off:</span>
                  <span className="font-body-tabular-bold text-on-surface">{dateEnd}</span>
                </div>
                <div className="bg-surface-subtle px-space-sm py-1 rounded border border-surface-border flex items-center gap-space-xs text-caption">
                  <span className="text-secondary font-label-badge text-[11px] uppercase">Petugas:</span>
                  <span className="font-body-tabular text-on-surface">Bagian Piutang Operasional</span>
                </div>
                <div className="bg-status-current-bg text-status-current-text px-space-sm py-1 rounded border border-status-current-text/20 flex items-center gap-space-xs font-label-badge text-label-badge uppercase">
                  <span className="material-symbols-outlined text-[14px]">verified</span>
                  <span>Draft Terverifikasi</span>
                </div>
              </div>
            </div>

            {/* 4 Mini Summary Metric Chips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
              {/* Metric 1 */}
              <div className="p-space-md rounded bg-surface-subtle border border-surface-border/80 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-label-badge text-label-badge text-secondary uppercase">Total Saldo Tercatat</span>
                  <span className="material-symbols-outlined text-secondary text-[18px]">account_balance_wallet</span>
                </div>
                <div className="mt-space-sm">
                  <div className="font-headline-corporate text-headline-corporate text-on-surface truncate">
                    {formatIDR(totalSaldo)}
                  </div>
                  <div className="font-caption text-caption text-secondary mt-0.5">
                    {reportData.length} akun debitur aktif
                  </div>
                </div>
              </div>

              {/* Metric 2 */}
              <div className="p-space-md rounded bg-surface-subtle border border-surface-border/80 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-label-badge text-label-badge text-secondary uppercase">Total Pelanggan Terdaftar</span>
                  <span className="material-symbols-outlined text-secondary text-[18px]">domain</span>
                </div>
                <div className="mt-space-sm">
                  <div className="font-headline-corporate text-headline-corporate text-on-surface">
                    {reportData.length} Mitra
                  </div>
                  <div className="font-caption text-caption text-secondary mt-0.5">Wilayah Sulawesi &amp; IBT</div>
                </div>
              </div>

              {/* Metric 3 */}
              <div className="p-space-md rounded bg-surface-subtle border border-surface-border/80 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-label-badge text-label-badge text-secondary uppercase">Faktur Belum Lunas</span>
                  <span className="material-symbols-outlined text-secondary text-[18px]">receipt_long</span>
                </div>
                <div className="mt-space-sm">
                  <div className="font-headline-corporate text-headline-corporate text-on-surface">
                    {filteredRows.filter((i) => i.balance > 0).length} Lembar
                  </div>
                  <div className="font-caption text-caption text-secondary mt-0.5">Termin pembayaran terbuka</div>
                </div>
              </div>

              {/* Metric 4 */}
              <div className="p-space-md rounded bg-surface-subtle border border-surface-border/80 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-label-badge text-label-badge text-secondary uppercase">Rata-Rata Keterlambatan (DSO)</span>
                  <span className="material-symbols-outlined text-secondary text-[18px]">speed</span>
                </div>
                <div className="mt-space-sm">
                  <div className="font-headline-corporate text-headline-corporate text-on-surface">
                    {reportData.length > 0 ? '41 Hari' : '0 Hari'}
                  </div>
                  <div className="font-caption text-caption text-secondary mt-0.5">Target Tonasa Group: ≤ 45 Hari</div>
                </div>
              </div>
            </div>

            {/* Report Table */}
            <div className="border border-surface-border rounded overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-body-tabular text-body-tabular">
                  <thead>
                    <tr className="bg-surface-subtle border-b-2 border-surface-border h-10 font-body-tabular-bold text-caption text-secondary uppercase tracking-wider">
                      <th className="py-space-xs px-space-md w-12 text-center">NO</th>
                      <th className="py-space-xs px-space-md">KODE &amp; NAMA MITRA</th>
                      <th className="py-space-xs px-space-md text-center">JML FAKTUR</th>
                      <th className="py-space-xs px-space-md text-right">TOTAL TAGIHAN (RP)</th>
                      <th className="py-space-xs px-space-md text-right">SUDAH DIBAYAR (RP)</th>
                      <th className="py-space-xs px-space-md text-right">SALDO TERBUKA (RP)</th>
                      <th className="py-space-xs px-space-md text-center">UMUR RATA-RATA</th>
                      <th className="py-space-xs px-space-md text-center">STATUS KOLEKTIBILITAS</th>
                      <th className="py-space-xs px-space-md">CATATAN TINDAK LANJUT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.length === 0 ? (
                      <tr>
                        <td className="p-0" colSpan={9}>
                          <div className="py-16 px-space-lg flex flex-col items-center justify-center text-center bg-surface-canvas">
                            <div className="w-16 h-16 rounded-full bg-brand-crimson-subtle flex items-center justify-center text-brand-crimson mb-space-md border border-brand-crimson/20">
                              <span className="material-symbols-outlined text-[36px]">find_in_page</span>
                            </div>
                            <h3 className="font-title-md text-title-md text-on-surface mb-space-xs">
                              Belum Ada Data Laporan untuk Periode Ini
                            </h3>
                            <p className="font-body-tabular text-caption text-secondary max-w-lg mb-space-lg leading-relaxed">
                              Tabel laporan akan terisi otomatis berdasarkan data faktur dan transaksi yang tersimpan. Anda dapat mengubah parameter filter atau mengimpor data transaksi terlebih dahulu untuk kalkulasi audit.
                            </p>
                            <div className="flex items-center gap-space-sm">
                              <button
                                onClick={onLoadSample}
                                className="inline-flex items-center gap-space-xs px-space-lg py-2 rounded-lg bg-brand-crimson text-on-primary hover:bg-brand-crimson-hover font-body-tabular-bold text-caption transition-all shadow-sm cursor-pointer"
                                type="button"
                              >
                                <span className="material-symbols-outlined text-[18px]">rule_folder</span>
                                <span>Muat Contoh Format Laporan</span>
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      reportData.map((row, idx) => (
                        <tr key={idx} className="border-b border-surface-border hover:bg-surface-subtle transition-all h-12 text-caption">
                          <td className="py-space-xs px-space-md text-center font-label-numeric text-secondary">{idx + 1}</td>
                          <td className="py-space-xs px-space-md font-body-tabular">
                            <div className="font-body-tabular-bold text-on-surface">{row.name}</div>
                            <div className="font-caption text-secondary text-[11px] font-mono">{row.code}</div>
                          </td>
                          <td className="py-space-xs px-space-md text-center font-label-numeric font-bold">{row.faktur}</td>
                          <td className="py-space-xs px-space-md text-right font-label-numeric font-mono">{formatIDR(row.totalAmount)}</td>
                          <td className="py-space-xs px-space-md text-right font-label-numeric font-mono text-status-current-text">{formatIDR(row.paidAmount)}</td>
                          <td className="py-space-xs px-space-md text-right font-label-numeric font-mono font-bold text-brand-crimson">{formatIDR(row.balance)}</td>
                          <td className="py-space-xs px-space-md text-center font-label-numeric">{row.avgAge} Hari</td>
                          <td className="py-space-xs px-space-md text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full font-label-badge text-[10px] uppercase font-bold ${row.statusClass}`}>
                              {row.status}
                            </span>
                          </td>
                          <td className="py-space-xs px-space-md font-caption text-secondary max-w-xs truncate" title={row.notes}>
                            {row.notes}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {reportData.length > 0 && (
                <div className="px-space-md py-space-sm bg-surface-subtle border-t border-surface-border flex items-center justify-between text-caption text-secondary">
                  <div>
                    <span className="font-label-numeric">
                      Menampilkan <strong className="text-on-surface">{reportData.length}</strong> dari{' '}
                      <strong className="text-on-surface">{reportData.length}</strong> data debitur terkonsolidasi
                    </span>
                  </div>
                  <div className="flex items-center gap-space-xs">
                    <button className="px-space-sm py-1 border border-surface-border bg-surface-canvas rounded text-caption font-body-tabular disabled:opacity-50 cursor-not-allowed" disabled>
                      Sebelumnya
                    </button>
                    <span className="px-space-sm py-1 bg-brand-crimson text-on-primary font-body-tabular-bold rounded text-[11px]">1</span>
                    <button className="px-space-sm py-1 border border-surface-border bg-surface-canvas rounded text-caption font-body-tabular disabled:opacity-50 cursor-not-allowed" disabled>
                      Selanjutnya
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Export Options Footer Toolbar */}
        <section>
          <div className="bg-surface-canvas rounded-lg border border-surface-border p-space-md shadow-sm flex flex-col md:flex-row items-center justify-between gap-space-md">
            <div className="flex items-center gap-space-sm">
              <span className="w-8 h-8 rounded bg-surface-subtle flex items-center justify-center text-brand-crimson shrink-0 border border-surface-border">
                <span className="material-symbols-outlined text-[20px]">ios_share</span>
              </span>
              <div className="space-y-0.5">
                <span className="font-body-tabular-bold text-caption font-bold text-on-surface block">
                  Pusat Distribusi Dokumen Laporan
                </span>
                <span className="font-caption text-caption text-secondary">
                  Unduh format audit terstandar atau kirimkan salinan langsung ke unit terkait
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-space-xs">
              <button
                onClick={() => onShowToast('Unduh Excel', 'Menyiapkan berkas Excel (.xlsx) siap audit...')}
                className="inline-flex items-center gap-space-xs px-space-md py-2 rounded bg-surface text-on-surface hover:bg-surface-subtle border border-surface-border font-body-tabular-bold text-caption transition-all cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px] text-status-current-text">table_chart</span>
                <span>Download Excel (.xlsx)</span>
              </button>
              <button
                onClick={() => onShowToast('Unduh CSV', 'Menyiapkan berkas CSV UTF-8...')}
                className="inline-flex items-center gap-space-xs px-space-md py-2 rounded bg-surface text-on-surface hover:bg-surface-subtle border border-surface-border font-body-tabular-bold text-caption transition-all cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px] text-secondary">data_object</span>
                <span>Download CSV</span>
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-space-xs px-space-md py-2 rounded bg-surface text-on-surface hover:bg-surface-subtle border border-surface-border font-body-tabular-bold text-caption transition-all cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px] text-brand-crimson">picture_as_pdf</span>
                <span>Download PDF Resmi</span>
              </button>
              <button
                onClick={() => setIsEmailOpen(true)}
                className="inline-flex items-center gap-space-xs px-space-md py-2 rounded bg-brand-crimson text-on-primary hover:bg-brand-crimson-hover font-body-tabular-bold text-caption transition-all shadow-sm cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">mail</span>
                <span>Kirim via Email ke Bagian Keuangan</span>
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Modal: Jadwalkan Laporan Otomatis */}
      {isScheduleOpen && (
        <div className="fixed inset-0 z-50 bg-inverse-surface/60 backdrop-blur-sm flex items-center justify-center p-space-md">
          <div className="bg-surface-canvas rounded-lg border border-surface-border max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="h-1 bg-brand-crimson w-full"></div>
            <div className="p-space-lg">
              <div className="flex items-center justify-between pb-space-sm border-b border-surface-border">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-brand-crimson">schedule_send</span>
                  <h3 className="font-headline-corporate text-title-md font-bold text-on-surface">
                    Jadwalkan Distribusi Laporan Otomatis
                  </h3>
                </div>
                <button
                  onClick={() => setIsScheduleOpen(false)}
                  className="text-secondary hover:text-on-surface cursor-pointer"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setIsScheduleOpen(false);
                  onShowToast('Jadwal Disimpan', 'Jadwal distribusi laporan otomatis berhasil disimpan di sistem ERP.');
                }}
                className="space-y-space-md mt-space-md"
              >
                <div className="space-y-space-xs">
                  <label className="block font-label-badge text-label-badge uppercase text-secondary">
                    Jenis Laporan Berkala
                  </label>
                  <select className="w-full h-9 px-space-sm bg-surface-canvas text-caption font-body-tabular text-on-surface border border-surface-border rounded focus:border-brand-crimson focus:outline-none cursor-pointer">
                    <option>Laporan Buku Pembantu Piutang (AR Ledger)</option>
                    <option>Laporan Matriks Umur Piutang (Aging Summary)</option>
                    <option>Laporan Tagihan Jatuh Tempo &amp; Kritis Overdue</option>
                    <option>Laporan Rekonsiliasi Janji Bayar</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-space-md">
                  <div className="space-y-space-xs">
                    <label className="block font-label-badge text-label-badge uppercase text-secondary">
                      Frekuensi Kirim
                    </label>
                    <select className="w-full h-9 px-space-sm bg-surface-canvas text-caption font-body-tabular text-on-surface border border-surface-border rounded cursor-pointer">
                      <option>Setiap Hari Senin (Mingguan)</option>
                      <option>Hari Terakhir Bulan (Bulanan)</option>
                      <option>Setiap Tanggal 15 &amp; 30</option>
                      <option>Harian (Pukul 07.30 WITA)</option>
                    </select>
                  </div>
                  <div className="space-y-space-xs">
                    <label className="block font-label-badge text-label-badge uppercase text-secondary">
                      Format Lampiran
                    </label>
                    <select className="w-full h-9 px-space-sm bg-surface-canvas text-caption font-body-tabular text-on-surface border border-surface-border rounded cursor-pointer">
                      <option>Excel (.xlsx) + Ringkasan PDF</option>
                      <option>Hanya Excel (.xlsx)</option>
                      <option>Hanya PDF Bersegel</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-space-xs">
                  <label className="block font-label-badge text-label-badge uppercase text-secondary">
                    Email Penerima (Pisahkan tanda koma)
                  </label>
                  <input
                    defaultValue="keuangan@biringkassiraya.co.id, auditor.internal@sementonasa.co.id"
                    className="w-full h-9 px-space-sm text-caption font-body-tabular text-on-surface border border-surface-border rounded focus:border-brand-crimson focus:outline-none"
                    type="text"
                  />
                  <span className="font-caption text-caption text-secondary">
                    Salinan otomatis dikirimkan dengan otentikasi server PT Semen Tonasa
                  </span>
                </div>

                <div className="pt-space-sm flex items-center justify-end gap-space-sm border-t border-surface-border">
                  <button
                    onClick={() => setIsScheduleOpen(false)}
                    className="px-space-md py-2 border border-surface-border rounded text-caption font-body-tabular text-secondary hover:bg-surface-subtle cursor-pointer"
                    type="button"
                  >
                    Batal
                  </button>
                  <button
                    className="px-space-md py-2 bg-brand-crimson text-on-primary hover:bg-brand-crimson-hover rounded text-caption font-body-tabular-bold shadow-sm cursor-pointer"
                    type="submit"
                  >
                    Simpan &amp; Aktifkan Jadwal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Kirim Email Cepat */}
      {isEmailOpen && (
        <div className="fixed inset-0 z-50 bg-inverse-surface/60 backdrop-blur-sm flex items-center justify-center p-space-md">
          <div className="bg-surface-canvas rounded-lg border border-surface-border max-w-md w-full shadow-2xl overflow-hidden border border-surface-border animate-in fade-in zoom-in-95 duration-150">
            <div className="h-1 bg-brand-crimson w-full"></div>
            <div className="p-space-lg">
              <div className="flex items-center justify-between pb-space-sm border-b border-surface-border">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-brand-crimson">forward_to_inbox</span>
                  <h3 className="font-headline-corporate text-title-md font-bold text-on-surface">
                    Kirim Salinan Laporan
                  </h3>
                </div>
                <button
                  onClick={() => setIsEmailOpen(false)}
                  className="text-secondary hover:text-on-surface cursor-pointer"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setIsEmailOpen(false);
                  onShowToast('Laporan Dikirim', 'Laporan resmi berhasil dikirimkan via antrean email aman SAP Tonasa.');
                }}
                className="space-y-space-md mt-space-md"
              >
                <div className="space-y-space-xs">
                  <label className="block font-label-badge text-label-badge uppercase text-secondary">Tujuan Divisi</label>
                  <select className="w-full h-9 px-space-sm bg-surface-canvas text-caption font-body-tabular text-on-surface border border-surface-border rounded cursor-pointer">
                    <option>Dept. Keuangan &amp; Akuntansi PT Biringkassi Raya</option>
                    <option>Direktorat Keuangan PT Semen Tonasa</option>
                    <option>Tim Penagihan Lapangan / Kolektor</option>
                    <option>Audit Satuan Pengawas Internal (SPI)</option>
                  </select>
                </div>

                <div className="space-y-space-xs">
                  <label className="block font-label-badge text-label-badge uppercase text-secondary">
                    Pesan Pengantar Tambahan
                  </label>
                  <textarea
                    className="w-full p-space-xs text-caption font-body-tabular text-on-surface border border-surface-border rounded focus:border-brand-crimson focus:outline-none"
                    placeholder="Tuliskan catatan khusus atau instruksi penagihan..."
                    rows={3}
                  />
                </div>

                <div className="pt-space-sm flex items-center justify-end gap-space-sm border-t border-surface-border">
                  <button
                    onClick={() => setIsEmailOpen(false)}
                    className="px-space-md py-2 border border-surface-border rounded text-caption font-body-tabular text-secondary cursor-pointer"
                    type="button"
                  >
                    Tutup
                  </button>
                  <button
                    className="px-space-md py-2 bg-brand-crimson text-on-primary hover:bg-brand-crimson-hover rounded text-caption font-body-tabular-bold cursor-pointer"
                    type="submit"
                  >
                    Kirim Dokumen Sekarang
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
