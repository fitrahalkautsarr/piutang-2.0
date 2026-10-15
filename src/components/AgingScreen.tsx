import React, { useState } from 'react';
import { Invoice } from '../types';
import { formatIDR, calculateAgingDays } from '../data/initialData';

interface AgingScreenProps {
  invoices: Invoice[];
  onAddInvoice: (inv: Partial<Invoice>) => void;
  onLoadSample: () => void;
  onShowToast: (title: string, message: string, type?: 'success' | 'info' | 'warn') => void;
}

export const AgingScreen: React.FC<AgingScreenProps> = ({
  invoices,
  onAddInvoice,
  onLoadSample,
  onShowToast,
}) => {
  const [cutoffDate, setCutoffDate] = useState('2026-10-14');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [searchCustomer, setSearchCustomer] = useState('');
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [isSimModalOpen, setIsSimModalOpen] = useState(false);

  // Simulation Form inside Modal
  const [simInvNumber, setSimInvNumber] = useState('INV-2026-BR-0881');
  const [simCustomer, setSimCustomer] = useState('PT Semen Tonasa (Pabrik 4)');
  const [simAmount, setSimAmount] = useState('750000000');
  const [simDueDate, setSimDueDate] = useState('2026-09-01');

  // Compute aging metrics dynamically from actual invoices using cutoffDate
  const filteredInvoices = invoices.filter((inv) => {
    if (inv.balance <= 0) return false;
    if (customerFilter !== 'all' && !inv.customer.toLowerCase().includes(customerFilter.toLowerCase())) {
      return false;
    }
    if (searchCustomer && !inv.customer.toLowerCase().includes(searchCustomer.toLowerCase()) && !inv.no.toLowerCase().includes(searchCustomer.toLowerCase())) {
      return false;
    }
    return true;
  });

  let sumCurrent = 0, countCurrent = 0;
  let sum1to30 = 0, count1to30 = 0;
  let sum31to60 = 0, count31to60 = 0;
  let sum61to90 = 0, count61to90 = 0;
  let sumOver90 = 0, countOver90 = 0;
  let grandTotal = 0;

  // Group by customer for the matrix
  const customerMap: Record<
    string,
    {
      code: string;
      name: string;
      invoices: number;
      current: number;
      d1_30: number;
      d31_60: number;
      d61_90: number;
      over90: number;
      total: number;
    }
  > = {};

  filteredInvoices.forEach((inv) => {
    const days = calculateAgingDays(inv.dueDate, cutoffDate);
    const balance = inv.balance;
    grandTotal += balance;

    const custKey = inv.customer;
    if (!customerMap[custKey]) {
      customerMap[custKey] = {
        code: inv.customerCode || 'CUST-GEN',
        name: inv.customer,
        invoices: 0,
        current: 0,
        d1_30: 0,
        d31_60: 0,
        d61_90: 0,
        over90: 0,
        total: 0,
      };
    }
    customerMap[custKey].invoices += 1;
    customerMap[custKey].total += balance;

    if (days <= 0) {
      sumCurrent += balance;
      countCurrent += 1;
      customerMap[custKey].current += balance;
    } else if (days <= 30) {
      sum1to30 += balance;
      count1to30 += 1;
      customerMap[custKey].d1_30 += balance;
    } else if (days <= 60) {
      sum31to60 += balance;
      count31to60 += 1;
      customerMap[custKey].d31_60 += balance;
    } else if (days <= 90) {
      sum61to90 += balance;
      count61to90 += 1;
      customerMap[custKey].d61_90 += balance;
    } else {
      sumOver90 += balance;
      countOver90 += 1;
      customerMap[custKey].over90 += balance;
    }
  });

  const customerRows = Object.values(customerMap);

  // Bar chart percentages
  const pCur = grandTotal > 0 ? Math.round((sumCurrent / grandTotal) * 100) : 0;
  const p1 = grandTotal > 0 ? Math.round((sum1to30 / grandTotal) * 100) : 0;
  const p31 = grandTotal > 0 ? Math.round((sum31to60 / grandTotal) * 100) : 0;
  const p61 = grandTotal > 0 ? Math.round((sum61to90 / grandTotal) * 100) : 0;
  const pOver = grandTotal > 0 ? Math.round((sumOver90 / grandTotal) * 100) : 0;

  // Real-time calculation inside modal
  const simDays = calculateAgingDays(simDueDate, cutoffDate);
  let simClassification = 'CURRENT (LANCAR)';
  let simBadgeClass = 'bg-status-current-bg text-status-current-text';
  let simSOP = 'Konfirmasi tanda terima berita acara & pemantauan jatuh tempo.';
  if (simDays > 90) {
    simClassification = '> 90 HARI (MACET)';
    simBadgeClass = 'bg-brand-crimson text-on-primary';
    simSOP = 'Pencairan Bank Garansi & pelimpahan berkas hukum ke Tonasa Holding.';
  } else if (simDays > 60) {
    simClassification = '61 - 90 HARI';
    simBadgeClass = 'bg-status-overdue-bg text-status-overdue-text';
    simSOP = 'Penerbitan Surat Peringatan II (SP 2) & pembatasan muatan klinker semen.';
  } else if (simDays > 30) {
    simClassification = '31 - 60 HARI';
    simBadgeClass = 'bg-amber-100 text-amber-800';
    simSOP = 'Penerbitan Surat Peringatan I (SP 1) & konfirmasi komitmen bayar.';
  } else if (simDays > 0) {
    simClassification = '1 - 30 HARI';
    simBadgeClass = 'bg-status-due-bg text-status-due-text';
    simSOP = 'Peringatan santun & penagihan desk collection telepon.';
  }

  const handleApplySimToTable = () => {
    const numAmt = parseFloat(simAmount) || 500000000;
    onAddInvoice({
      no: simInvNumber || `INV-SIM-${Date.now().toString().slice(-4)}`,
      customer: simCustomer,
      issueDate: '2026-08-01',
      dueDate: simDueDate,
      amount: numAmt,
      paid: 0,
      balance: numAmt,
      status: simDays > 0 ? (simDays > 90 ? 'severe' : 'overdue') : 'current',
      followUpNote: 'Simulasi formula SOP-KEU-BR-08',
    });
    setIsSimModalOpen(false);
    onShowToast('Faktur Simulasi Diinjeksi', `Invoice ${simInvNumber} masuk ke matriks aging.`);
  };

  return (
    <div className="flex flex-col w-full">
      {/* Top Banner / Operational Sub-Header */}
      <section className="w-full bg-surface-canvas px-margin py-space-lg shadow-sm border-b border-surface-border">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-space-lg max-w-7xl mx-auto w-full">
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center gap-space-sm">
              <span className="inline-flex items-center px-space-sm py-0.5 rounded-full bg-brand-crimson-subtle text-brand-crimson font-label-badge text-label-badge tracking-wider uppercase">
                FITUR P-04 AUDIT LEVEL
              </span>
              <span className="text-secondary font-caption text-caption">• Standar Keuangan Semen Tonasa</span>
            </div>
            <div className="flex items-baseline gap-space-md">
              <h1 className="font-headline-corporate text-headline-corporate text-on-surface">
                Analisis Umur Piutang (Aging Schedule)
              </h1>
              <span className="hidden sm:inline-block px-space-sm py-0.5 rounded bg-surface-container text-secondary font-label-numeric text-caption border border-surface-border/60">
                SOP-KEU-BR-08
              </span>
            </div>
            <p className="font-body-tabular text-body-tabular text-secondary max-w-3xl">
              Matriks pengelompokan saldo piutang usaha per mitra logistik &amp; distributor berdasarkan interval keterlambatan jatuh tempo per tanggal acuan cut-off operasional.
            </p>
          </div>

          {/* Action Cluster */}
          <div className="flex flex-wrap items-center gap-space-md">
            <button
              onClick={() => setIsSimModalOpen(true)}
              className="inline-flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-tabular-bold text-body-tabular transition-all shadow-sm cursor-pointer border border-surface-border/50"
            >
              <span className="material-symbols-outlined text-[18px] text-brand-crimson">calculate</span>
              <span>Simulasi Kalkulasi</span>
            </button>

            <div className="relative inline-block text-left">
              <button
                onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                className="inline-flex items-center gap-space-xs px-space-md py-2.5 rounded-lg bg-brand-crimson hover:bg-brand-crimson-hover text-on-primary font-body-tabular-bold text-body-tabular transition-all shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                <span>Ekspor Matriks Aging</span>
                <span className="material-symbols-outlined text-[16px]">expand_more</span>
              </button>

              {exportDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-xl bg-surface-canvas shadow-xl border border-surface-border z-30 p-space-xs animate-in fade-in zoom-in-95 duration-150">
                  <button
                    onClick={() => {
                      setExportDropdownOpen(false);
                      onShowToast('Ekspor XLSX', 'Berkas matriks aging sedang diunduh dalam format XLSX Audit.');
                    }}
                    className="w-full text-left flex items-center gap-space-sm px-space-md py-space-sm rounded-lg hover:bg-surface text-on-surface font-body-tabular text-body-tabular cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-status-current-text text-[18px]">table_view</span>
                    <span>Format Excel (.xlsx)</span>
                  </button>
                  <button
                    onClick={() => {
                      setExportDropdownOpen(false);
                      onShowToast('Cetak PDF', 'Mempersiapkan dokumen rekapitulasi audit siap cetak.');
                    }}
                    className="w-full text-left flex items-center gap-space-sm px-space-md py-space-sm rounded-lg hover:bg-surface text-on-surface font-body-tabular text-body-tabular cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-brand-crimson text-[18px]">picture_as_pdf</span>
                    <span>Dokumen Cetak (.pdf)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto w-full px-margin space-y-space-lg pt-space-lg pb-margin">
        {/* Interactive Filter Toolbar */}
        <section className="w-full">
          <div className="w-full bg-surface-canvas rounded-xl shadow-sm p-space-md border border-surface-border">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md items-end">
              <div className="flex flex-col gap-space-xs">
                <label className="font-label-badge text-label-badge text-secondary uppercase tracking-wider">
                  Tanggal Cut-off Acuan
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[18px]">
                    calendar_today
                  </span>
                  <input
                    value={cutoffDate}
                    onChange={(e) => setCutoffDate(e.target.value)}
                    className="w-full h-10 pl-10 pr-3 rounded-lg bg-surface-subtle font-label-numeric text-body-tabular text-on-surface border border-surface-border focus:bg-surface-canvas focus:outline-none transition-all"
                    type="date"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-space-xs">
                <label className="font-label-badge text-label-badge text-secondary uppercase tracking-wider">
                  Penyaringan Pelanggan / Entitas
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[18px]">
                    domain
                  </span>
                  <select
                    value={customerFilter}
                    onChange={(e) => setCustomerFilter(e.target.value)}
                    className="w-full h-10 pl-10 pr-8 rounded-lg bg-surface-subtle font-body-tabular text-body-tabular text-on-surface border border-surface-border focus:bg-surface-canvas focus:outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="all">Semua Mitra &amp; Rekanan ({invoices.length} Terdata)</option>
                    <option value="tonasa">PT Semen Tonasa (Holding)</option>
                    <option value="bosowa">Grup Rekanan Bosowa</option>
                    <option value="biringkassi">UD Biringkassi Megah</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary text-[18px] pointer-events-none">
                    unfold_more
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-space-xs">
                <label className="font-label-badge text-label-badge text-secondary uppercase tracking-wider">
                  Tipe Transaksi Piutang
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[18px]">
                    receipt_long
                  </span>
                  <select className="w-full h-10 pl-10 pr-8 rounded-lg bg-surface-subtle font-body-tabular text-body-tabular text-on-surface border border-surface-border focus:bg-surface-canvas focus:outline-none transition-all appearance-none cursor-pointer">
                    <option>Semua (Jasa Angkutan, Semen, Sewa)</option>
                    <option>Jasa Angkutan Kapal &amp; Truk</option>
                    <option>Distribusi Semen Curah &amp; Kantong</option>
                    <option>Sewa Alat Berat &amp; Dermaga</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary text-[18px] pointer-events-none">
                    unfold_more
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-space-sm">
                <button
                  onClick={() => onShowToast('Filter Diterapkan', `Kalkulasi aging diperbarui berdasarkan cut-off ${cutoffDate}.`)}
                  className="flex-1 h-10 rounded-lg bg-secondary-container hover:bg-secondary-fixed text-on-secondary-fixed-variant font-body-tabular-bold text-body-tabular transition-all flex items-center justify-center gap-space-xs cursor-pointer border border-surface-border/40"
                >
                  <span className="material-symbols-outlined text-[18px]">filter_alt</span>
                  <span>Terapkan Filter</span>
                </button>
                <button
                  onClick={() => {
                    setCutoffDate('2026-10-14');
                    setCustomerFilter('all');
                    setSearchCustomer('');
                    onShowToast('Filter Direset', 'Parameter cut-off dikembalikan ke 14 Oktober 2026.', 'info');
                  }}
                  className="h-10 w-10 rounded-lg bg-surface-subtle hover:bg-surface-muted text-secondary flex items-center justify-center transition-all border border-surface-border cursor-pointer"
                  title="Reset Parameter"
                >
                  <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 5 Aging Classification Buckets */}
        <section className="w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-space-md">
            {/* 1. Current */}
            <div className="relative bg-surface-canvas rounded-xl shadow-sm p-space-md overflow-hidden flex flex-col justify-between border border-surface-border">
              <div className="absolute top-0 left-0 right-0 h-1 bg-status-current-text"></div>
              <div>
                <div className="flex items-center justify-between mb-space-xs">
                  <span className="font-label-badge text-label-badge text-secondary uppercase tracking-wider">Current</span>
                  <span className="px-space-sm py-0.5 rounded-full bg-status-current-bg text-status-current-text font-label-badge text-label-badge font-bold">
                    Lancar
                  </span>
                </div>
                <span className="font-caption text-caption text-secondary">Belum Jatuh Tempo</span>
                <div className="mt-space-sm font-display-lg-mobile lg:font-display-lg text-display-lg-mobile lg:text-display-lg font-bold text-on-surface tracking-tight truncate">
                  {formatIDR(sumCurrent)}
                </div>
              </div>
              <div className="mt-space-md pt-space-sm flex items-center justify-between bg-surface-subtle -mx-space-md -mb-space-md px-space-md py-space-xs border-t border-surface-border">
                <span className="font-caption text-caption text-secondary">Jumlah Dokumen</span>
                <span className="font-label-numeric text-caption text-on-surface font-semibold">
                  {countCurrent} faktur
                </span>
              </div>
            </div>

            {/* 2. 1 - 30 Hari */}
            <div className="relative bg-surface-canvas rounded-xl shadow-sm p-space-md overflow-hidden flex flex-col justify-between border border-surface-border">
              <div className="absolute top-0 left-0 right-0 h-1 bg-status-due-text"></div>
              <div>
                <div className="flex items-center justify-between mb-space-xs">
                  <span className="font-label-badge text-label-badge text-secondary uppercase tracking-wider">1 - 30 Hari</span>
                  <span className="px-space-sm py-0.5 rounded-full bg-status-due-bg text-status-due-text font-label-badge text-label-badge font-bold">
                    Perhatian
                  </span>
                </div>
                <span className="font-caption text-caption text-secondary">Terlambat s.d 1 Bulan</span>
                <div className="mt-space-sm font-display-lg-mobile lg:font-display-lg text-display-lg-mobile lg:text-display-lg font-bold text-on-surface tracking-tight truncate">
                  {formatIDR(sum1to30)}
                </div>
              </div>
              <div className="mt-space-md pt-space-sm flex items-center justify-between bg-surface-subtle -mx-space-md -mb-space-md px-space-md py-space-xs border-t border-surface-border">
                <span className="font-caption text-caption text-secondary">Jumlah Dokumen</span>
                <span className="font-label-numeric text-caption text-on-surface font-semibold">
                  {count1to30} faktur
                </span>
              </div>
            </div>

            {/* 3. 31 - 60 Hari */}
            <div className="relative bg-surface-canvas rounded-xl shadow-sm p-space-md overflow-hidden flex flex-col justify-between border border-surface-border">
              <div className="absolute top-0 left-0 right-0 h-1 bg-amber-600"></div>
              <div>
                <div className="flex items-center justify-between mb-space-xs">
                  <span className="font-label-badge text-label-badge text-secondary uppercase tracking-wider">31 - 60 Hari</span>
                  <span className="px-space-sm py-0.5 rounded-full bg-amber-100 text-amber-800 font-label-badge text-label-badge font-bold">
                    Teguran I
                  </span>
                </div>
                <span className="font-caption text-caption text-secondary">Terlambat s.d 2 Bulan</span>
                <div className="mt-space-sm font-display-lg-mobile lg:font-display-lg text-display-lg-mobile lg:text-display-lg font-bold text-on-surface tracking-tight truncate">
                  {formatIDR(sum31to60)}
                </div>
              </div>
              <div className="mt-space-md pt-space-sm flex items-center justify-between bg-surface-subtle -mx-space-md -mb-space-md px-space-md py-space-xs border-t border-surface-border">
                <span className="font-caption text-caption text-secondary">Jumlah Dokumen</span>
                <span className="font-label-numeric text-caption text-on-surface font-semibold">
                  {count31to60} faktur
                </span>
              </div>
            </div>

            {/* 4. 61 - 90 Hari */}
            <div className="relative bg-surface-canvas rounded-xl shadow-sm p-space-md overflow-hidden flex flex-col justify-between border border-surface-border">
              <div className="absolute top-0 left-0 right-0 h-1 bg-status-overdue-text"></div>
              <div>
                <div className="flex items-center justify-between mb-space-xs">
                  <span className="font-label-badge text-label-badge text-secondary uppercase tracking-wider">61 - 90 Hari</span>
                  <span className="px-space-sm py-0.5 rounded-full bg-status-overdue-bg text-status-overdue-text font-label-badge text-label-badge font-bold">
                    Teguran II
                  </span>
                </div>
                <span className="font-caption text-caption text-secondary">Terlambat s.d 3 Bulan</span>
                <div className="mt-space-sm font-display-lg-mobile lg:font-display-lg text-display-lg-mobile lg:text-display-lg font-bold text-on-surface tracking-tight truncate">
                  {formatIDR(sum61to90)}
                </div>
              </div>
              <div className="mt-space-md pt-space-sm flex items-center justify-between bg-surface-subtle -mx-space-md -mb-space-md px-space-md py-space-xs border-t border-surface-border">
                <span className="font-caption text-caption text-secondary">Jumlah Dokumen</span>
                <span className="font-label-numeric text-caption text-on-surface font-semibold">
                  {count61to90} faktur
                </span>
              </div>
            </div>

            {/* 5. > 90 Hari */}
            <div className="relative bg-surface-canvas rounded-xl shadow-sm p-space-md overflow-hidden flex flex-col justify-between border border-surface-border">
              <div className="absolute top-0 left-0 right-0 h-1 bg-brand-crimson"></div>
              <div>
                <div className="flex items-center justify-between mb-space-xs">
                  <span className="font-label-badge text-label-badge text-brand-crimson uppercase tracking-wider">
                    &gt; 90 Hari
                  </span>
                  <span className="px-space-sm py-0.5 rounded-full bg-brand-crimson text-on-primary font-label-badge text-label-badge font-bold">
                    Macet
                  </span>
                </div>
                <span className="font-caption text-caption text-brand-crimson font-medium">Perhatian Khusus Audit</span>
                <div className="mt-space-sm font-display-lg-mobile lg:font-display-lg text-display-lg-mobile lg:text-display-lg font-bold text-brand-crimson tracking-tight truncate">
                  {formatIDR(sumOver90)}
                </div>
              </div>
              <div className="mt-space-md pt-space-sm flex items-center justify-between bg-brand-crimson-subtle -mx-space-md -mb-space-md px-space-md py-space-xs border-t border-brand-crimson/20">
                <span className="font-caption text-caption text-brand-crimson">Tindakan Khusus</span>
                <span className="font-label-numeric text-caption text-brand-crimson font-bold">
                  {countOver90} faktur
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Visual Analytics & Protocol */}
        <section className="w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
            {/* Chart Column */}
            <div className="lg:col-span-7 bg-surface-canvas rounded-xl shadow-sm p-space-lg flex flex-col border border-surface-border">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm mb-space-lg">
                <div>
                  <h2 className="font-title-md text-title-md text-on-surface">Distribusi Nominal Portofolio Aging</h2>
                  <p className="font-caption text-caption text-secondary">Visualisasi proporsi piutang tertagih vs piutang kritis</p>
                </div>
                <div className="flex items-center gap-space-xs bg-surface-subtle p-1 rounded-lg border border-surface-border">
                  <span className="px-space-sm py-1 rounded bg-surface-canvas shadow-xs font-label-badge text-caption text-on-surface">
                    Nominal (IDR)
                  </span>
                  <span className="px-space-sm py-1 text-secondary font-label-badge text-caption">
                    Persentase (%)
                  </span>
                </div>
              </div>

              {/* Bar Canvas */}
              <div className="relative w-full h-64 bg-surface rounded-lg p-space-md flex flex-col justify-between overflow-hidden border border-surface-border/50">
                <div className="flex justify-between font-caption text-[10px] text-secondary">
                  <span>Rp 5.000 Jt</span>
                  <span>Rp 3.500 Jt</span>
                  <span>Rp 2.000 Jt</span>
                  <span>Rp 1.000 Jt</span>
                  <span>Rp 0 Jt</span>
                </div>

                <div className="relative h-44 w-full flex items-end justify-around gap-space-md z-10 pt-4">
                  {/* Current */}
                  <div className="group relative flex flex-col items-center flex-1 h-full justify-end">
                    <div
                      className="w-full max-w-[48px] bg-status-current-text/30 group-hover:bg-status-current-text/50 transition-all rounded-t relative flex items-center justify-center"
                      style={{ height: `${Math.max(8, pCur)}%` }}
                    >
                      <span className="text-[10px] font-label-numeric font-bold text-status-current-text absolute -top-5">
                        {pCur}%
                      </span>
                    </div>
                    <span className="mt-2 font-label-badge text-[10px] text-secondary text-center truncate w-full">Current</span>
                  </div>

                  {/* 1-30 */}
                  <div className="group relative flex flex-col items-center flex-1 h-full justify-end">
                    <div
                      className="w-full max-w-[48px] bg-status-due-text/30 group-hover:bg-status-due-text/50 transition-all rounded-t relative flex items-center justify-center"
                      style={{ height: `${Math.max(8, p1)}%` }}
                    >
                      <span className="text-[10px] font-label-numeric font-bold text-status-due-text absolute -top-5">
                        {p1}%
                      </span>
                    </div>
                    <span className="mt-2 font-label-badge text-[10px] text-secondary text-center truncate w-full">1-30 Hari</span>
                  </div>

                  {/* 31-60 */}
                  <div className="group relative flex flex-col items-center flex-1 h-full justify-end">
                    <div
                      className="w-full max-w-[48px] bg-amber-500/30 group-hover:bg-amber-500/50 transition-all rounded-t relative flex items-center justify-center"
                      style={{ height: `${Math.max(8, p31)}%` }}
                    >
                      <span className="text-[10px] font-label-numeric font-bold text-amber-700 absolute -top-5">
                        {p31}%
                      </span>
                    </div>
                    <span className="mt-2 font-label-badge text-[10px] text-secondary text-center truncate w-full">31-60 Hari</span>
                  </div>

                  {/* 61-90 */}
                  <div className="group relative flex flex-col items-center flex-1 h-full justify-end">
                    <div
                      className="w-full max-w-[48px] bg-status-overdue-text/30 group-hover:bg-status-overdue-text/50 transition-all rounded-t relative flex items-center justify-center"
                      style={{ height: `${Math.max(8, p61)}%` }}
                    >
                      <span className="text-[10px] font-label-numeric font-bold text-status-overdue-text absolute -top-5">
                        {p61}%
                      </span>
                    </div>
                    <span className="mt-2 font-label-badge text-[10px] text-secondary text-center truncate w-full">61-90 Hari</span>
                  </div>

                  {/* > 90 */}
                  <div className="group relative flex flex-col items-center flex-1 h-full justify-end">
                    <div
                      className="w-full max-w-[48px] bg-brand-crimson/30 group-hover:bg-brand-crimson/50 transition-all rounded-t relative flex items-center justify-center"
                      style={{ height: `${Math.max(8, pOver)}%` }}
                    >
                      <span className="text-[10px] font-label-numeric font-bold text-brand-crimson absolute -top-5">
                        {pOver}%
                      </span>
                    </div>
                    <span className="mt-2 font-label-badge text-[10px] text-brand-crimson font-bold text-center truncate w-full">&gt;90 Hari</span>
                  </div>
                </div>
              </div>

              <div className="mt-space-md flex flex-wrap items-center justify-between text-caption font-caption text-secondary pt-space-xs border-t border-surface-border">
                <div className="flex items-center gap-space-xs">
                  <span className="w-2 h-2 rounded-full bg-status-current-text inline-block"></span>
                  <span>Target Kolektibilitas Lancar: &gt;85%</span>
                </div>
                <span className="text-right">Sumber: Data Buku Pembantu Piutang (Sub-Ledger AR)</span>
              </div>
            </div>

            {/* Policy & Operations Card */}
            <div className="lg:col-span-5 bg-surface-canvas rounded-xl shadow-sm p-space-lg flex flex-col justify-between border border-surface-border">
              <div>
                <div className="flex items-center gap-space-sm mb-space-md">
                  <div className="w-8 h-8 rounded-lg bg-brand-crimson-subtle text-brand-crimson flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">policy</span>
                  </div>
                  <div>
                    <h2 className="font-title-md text-title-md text-on-surface">Protokol Penagihan PT Biringkassi Raya</h2>
                    <span className="font-caption text-caption text-secondary">Ketentuan Perlakuan Piutang Semen Tonasa</span>
                  </div>
                </div>

                <div className="space-y-space-sm">
                  <div className="p-space-sm rounded-lg bg-surface flex items-start gap-space-sm border border-surface-border/50">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-status-current-bg text-status-current-text font-bold text-[11px] shrink-0">
                      1
                    </span>
                    <div className="text-body-tabular text-on-surface font-caption">
                      <span className="font-bold">Bucket Current (H-0 s.d H-3):</span> Konfirmasi penerimaan berita acara logistik / SSPD kepada bagian perbendaharaan rekanan.
                    </div>
                  </div>

                  <div className="p-space-sm rounded-lg bg-surface flex items-start gap-space-sm border border-surface-border/50">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-status-due-bg text-status-due-text font-bold text-[11px] shrink-0">
                      2
                    </span>
                    <div className="text-body-tabular text-on-surface font-caption">
                      <span className="font-bold">Bucket 1-30 Hari:</span> Penagihan berkala via Desk Collection (Telepon &amp; Surel Resmi) dengan surat pengingat santun.
                    </div>
                  </div>

                  <div className="p-space-sm rounded-lg bg-surface flex items-start gap-space-sm border border-surface-border/50">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-status-overdue-bg text-status-overdue-text font-bold text-[11px] shrink-0">
                      3
                    </span>
                    <div className="text-body-tabular text-on-surface font-caption">
                      <span className="font-bold">Bucket 31-90 Hari:</span> Penerbitan Surat Peringatan (SP 1 / SP 2) dan pembekuan plafon kuota muatan klinker semen.
                    </div>
                  </div>

                  <div className="p-space-sm rounded-lg bg-brand-crimson-subtle flex items-start gap-space-sm border border-brand-crimson/20">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-crimson text-on-primary font-bold text-[11px] shrink-0">
                      4
                    </span>
                    <div className="text-body-tabular text-brand-crimson font-caption">
                      <span className="font-bold">Bucket &gt; 90 Hari (Macet):</span> Eskalasi penyerahan klaim jaminan bank garansi / penanganan legal ke holding Semen Tonasa.
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-space-md pt-space-sm flex items-center justify-between text-caption font-caption text-secondary border-t border-surface-border">
                <span>Cadangan Kerugian Penurunan Nilai (CKPN)</span>
                <span className="font-body-tabular-bold text-on-surface font-semibold">
                  Tingkat Risiko: {grandTotal > 0 ? ((sumOver90 / grandTotal) * 100).toFixed(2) : '0.00'}%
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Aging Matrix Table by Customer */}
        <section className="w-full">
          <div className="bg-surface-canvas rounded-xl shadow-sm overflow-hidden border border-surface-border">
            <div className="px-space-lg py-space-md bg-surface-canvas flex flex-col sm:flex-row sm:items-center justify-between gap-space-md border-b border-surface-border">
              <div>
                <h2 className="font-title-md text-title-md text-on-surface">Matriks Piutang Berdasarkan Pelanggan</h2>
                <p className="font-caption text-caption text-secondary">
                  Rekapitulasi total tagihan terdistribusi pada seluruh interval penagihan
                </p>
              </div>
              <div className="flex items-center gap-space-sm">
                <div className="relative w-64">
                  <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-secondary text-[16px]">
                    search
                  </span>
                  <input
                    value={searchCustomer}
                    onChange={(e) => setSearchCustomer(e.target.value)}
                    className="w-full h-8 pl-8 pr-3 text-caption font-body-tabular bg-surface-subtle hover:bg-surface focus:bg-surface-canvas rounded-lg text-on-surface placeholder-secondary focus:outline-none border border-surface-border transition-all"
                    placeholder="Cari kode atau nama rekanan..."
                    type="text"
                  />
                </div>
                <button
                  onClick={() => onShowToast('Refresh Matriks', 'Data matriks umur piutang diperbarui.')}
                  className="h-8 w-8 rounded-lg bg-surface-subtle hover:bg-surface-muted text-secondary flex items-center justify-center transition-all border border-surface-border cursor-pointer"
                  title="Segarkan Data"
                >
                  <span className="material-symbols-outlined text-[16px]">refresh</span>
                </button>
              </div>
            </div>

            <div className="w-full overflow-x-auto">
              <table className="w-full text-left font-body-tabular text-body-tabular min-w-[960px] border-collapse">
                <thead className="bg-surface-subtle font-label-badge text-label-badge text-secondary uppercase tracking-wider border-b border-surface-border">
                  <tr>
                    <th className="py-3 px-4">Kode &amp; Nama Rekanan</th>
                    <th className="py-3 px-4 text-center">Faktur Aktif</th>
                    <th className="py-3 px-4 text-right">Current (Rp)</th>
                    <th className="py-3 px-4 text-right">1-30 Hari (Rp)</th>
                    <th className="py-3 px-4 text-right">31-60 Hari (Rp)</th>
                    <th className="py-3 px-4 text-right">61-90 Hari (Rp)</th>
                    <th className="py-3 px-4 text-right text-brand-crimson">&gt;90 Hari (Rp)</th>
                    <th className="py-3 px-4 text-right">Total Saldo (Rp)</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {customerRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-16 px-4 text-center">
                        <div className="flex flex-col items-center justify-center max-w-md mx-auto">
                          <div className="w-16 h-16 rounded-2xl bg-surface-subtle flex items-center justify-center text-secondary mb-space-md shadow-inner border border-surface-border">
                            <span className="material-symbols-outlined text-[36px]">receipt_long</span>
                          </div>
                          <h3 className="font-headline-corporate text-title-md text-on-surface mb-space-xs">
                            Belum Ada Tagihan Piutang Terdata
                          </h3>
                          <p className="font-body-tabular text-body-tabular text-secondary mb-space-lg text-center">
                            Data aging piutang masih bernilai nol. Anda dapat melakukan impor data invoice ERP Semen Tonasa atau mencoba simulasi data perhitungan untuk menguji kalkulasi otomatis.
                          </p>
                          <div className="flex items-center gap-space-md">
                            <button
                              onClick={onLoadSample}
                              className="inline-flex items-center gap-space-xs px-space-md py-2 rounded-lg bg-brand-crimson hover:bg-brand-crimson-hover text-on-primary font-body-tabular-bold text-body-tabular transition-all cursor-pointer shadow-sm"
                            >
                              <span className="material-symbols-outlined text-[18px]">play_circle</span>
                              <span>Muat Contoh Data Rekanan</span>
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    customerRows.map((item, idx) => (
                      <tr key={idx} className="hover:bg-surface-subtle transition-colors h-12">
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="font-body-tabular-bold font-semibold text-on-surface">{item.name}</span>
                            <span className="font-caption text-caption text-secondary font-mono">{item.code}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center font-label-numeric">{item.invoices} Faktur</td>
                        <td className={`py-3 px-4 text-right font-mono ${item.current > 0 ? 'text-status-current-text font-semibold' : 'text-secondary/50'}`}>
                          {item.current > 0 ? formatIDR(item.current) : '-'}
                        </td>
                        <td className={`py-3 px-4 text-right font-mono ${item.d1_30 > 0 ? 'text-status-due-text font-semibold' : 'text-secondary/50'}`}>
                          {item.d1_30 > 0 ? formatIDR(item.d1_30) : '-'}
                        </td>
                        <td className={`py-3 px-4 text-right font-mono ${item.d31_60 > 0 ? 'text-amber-700 font-semibold' : 'text-secondary/50'}`}>
                          {item.d31_60 > 0 ? formatIDR(item.d31_60) : '-'}
                        </td>
                        <td className={`py-3 px-4 text-right font-mono ${item.d61_90 > 0 ? 'text-status-overdue-text font-semibold' : 'text-secondary/50'}`}>
                          {item.d61_90 > 0 ? formatIDR(item.d61_90) : '-'}
                        </td>
                        <td className={`py-3 px-4 text-right font-mono ${item.over90 > 0 ? 'text-brand-crimson font-bold' : 'text-secondary/50'}`}>
                          {item.over90 > 0 ? formatIDR(item.over90) : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-on-surface">
                          {formatIDR(item.total)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => onShowToast('Detail Mitra', `Membuka buku pembantu piutang ${item.name}`)}
                            className="px-space-sm py-1 rounded hover:bg-surface-subtle text-brand-crimson hover:text-brand-crimson-hover font-caption font-semibold transition-all cursor-pointer"
                          >
                            Detail
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="bg-surface-subtle font-body-tabular-bold text-body-tabular text-on-surface border-t-2 border-surface-border">
                  <tr>
                    <td className="py-3 px-4 font-bold">TOTAL PORTOFOLIO AGING</td>
                    <td className="py-3 px-4 text-center">{filteredInvoices.length} Dok</td>
                    <td className="py-3 px-4 text-right font-mono">{formatIDR(sumCurrent)}</td>
                    <td className="py-3 px-4 text-right font-mono">{formatIDR(sum1to30)}</td>
                    <td className="py-3 px-4 text-right font-mono">{formatIDR(sum31to60)}</td>
                    <td className="py-3 px-4 text-right font-mono">{formatIDR(sum61to90)}</td>
                    <td className="py-3 px-4 text-right font-mono text-brand-crimson font-bold">{formatIDR(sumOver90)}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-brand-crimson">{formatIDR(grandTotal)}</td>
                    <td className="py-3 px-4 text-center font-caption text-secondary">-</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="px-space-lg py-space-sm bg-surface-canvas flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm border-t border-surface-border">
              <span className="font-caption text-caption text-secondary">
                Menampilkan {customerRows.length} dari {customerRows.length} rekanan aktif
              </span>
              <div className="flex items-center gap-space-xs">
                <button className="px-2.5 py-1 rounded bg-surface text-secondary text-caption font-label-numeric border border-surface-border cursor-not-allowed" disabled>
                  Sebelumnya
                </button>
                <span className="px-2.5 py-1 rounded bg-brand-crimson text-on-primary text-caption font-label-numeric">1</span>
                <button className="px-2.5 py-1 rounded bg-surface text-secondary text-caption font-label-numeric border border-surface-border cursor-not-allowed" disabled>
                  Berikutnya
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Modal Interaktif Simulasi Aging & Parameter Formula */}
      {isSimModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-space-md bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-surface-canvas rounded-2xl shadow-xl overflow-hidden z-10 flex flex-col max-h-[921px] border border-surface-border animate-in fade-in zoom-in-95 duration-150">
            <div className="h-1.5 w-full bg-brand-crimson"></div>
            <div className="px-space-lg py-space-md flex items-center justify-between bg-surface-subtle border-b border-surface-border">
              <div className="flex items-center gap-space-sm">
                <div className="w-9 h-9 rounded-xl bg-brand-crimson-subtle text-brand-crimson flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">tune</span>
                </div>
                <div>
                  <h3 className="font-title-md text-title-md text-on-surface">Simulasi Perhitungan Bucket Aging</h3>
                  <span className="font-caption text-caption text-secondary">
                    Uji Coba Kalkulasi Tanggal Invoice &amp; Penugasan Bucket
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsSimModalOpen(false)}
                className="text-secondary hover:text-on-surface w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-subtle cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-space-lg overflow-y-auto space-y-space-md flex-1">
              <p className="font-body-tabular text-body-tabular text-secondary">
                Masukkan parameter tanggal invoice dan jatuh tempo untuk melihat penetapan bucket aging menurut standar operasional PT Biringkassi Raya.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                <div className="flex flex-col gap-space-xs">
                  <label className="font-label-badge text-label-badge text-secondary uppercase">Nomor Referensi Invoice</label>
                  <input
                    value={simInvNumber}
                    onChange={(e) => setSimInvNumber(e.target.value)}
                    className="h-10 px-3 rounded-lg bg-surface-subtle border border-surface-border font-body-tabular text-body-tabular text-on-surface focus:outline-none"
                    type="text"
                  />
                </div>
                <div className="flex flex-col gap-space-xs">
                  <label className="font-label-badge text-label-badge text-secondary uppercase">Nama Rekanan / Pelanggan</label>
                  <input
                    value={simCustomer}
                    onChange={(e) => setSimCustomer(e.target.value)}
                    className="h-10 px-3 rounded-lg bg-surface-subtle border border-surface-border font-body-tabular text-body-tabular text-on-surface focus:outline-none"
                    type="text"
                  />
                </div>
                <div className="flex flex-col gap-space-xs">
                  <label className="font-label-badge text-label-badge text-secondary uppercase">Nilai Tagihan Bruto (IDR)</label>
                  <input
                    value={simAmount}
                    onChange={(e) => setSimAmount(e.target.value)}
                    className="h-10 px-3 rounded-lg bg-surface-subtle border border-surface-border font-label-numeric text-body-tabular text-on-surface focus:outline-none"
                    type="number"
                  />
                </div>
                <div className="flex flex-col gap-space-xs">
                  <label className="font-label-badge text-label-badge text-secondary uppercase">Tanggal Jatuh Tempo (Due Date)</label>
                  <input
                    value={simDueDate}
                    onChange={(e) => setSimDueDate(e.target.value)}
                    className="h-10 px-3 rounded-lg bg-surface-subtle border border-surface-border font-body-tabular text-body-tabular text-on-surface focus:outline-none"
                    type="date"
                  />
                </div>
              </div>

              {/* Realtime Result Card */}
              <div className="rounded-xl bg-surface-subtle p-space-md border border-surface-border">
                <span className="font-label-badge text-label-badge text-secondary uppercase tracking-wider block mb-space-xs">
                  Hasil Kalkulasi Formula Aging:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md">
                  <div>
                    <span className="font-caption text-caption text-secondary block">Keterlambatan Hari:</span>
                    <span className="font-display-lg-mobile text-display-lg-mobile font-bold text-brand-crimson">
                      {simDays > 0 ? `${simDays} Hari` : `${Math.abs(simDays)} Hari Lagi`}
                    </span>
                  </div>
                  <div>
                    <span className="font-caption text-caption text-secondary block">Klasifikasi Bucket:</span>
                    <span className={`inline-flex mt-1 px-space-sm py-0.5 rounded-full font-label-badge text-label-badge ${simBadgeClass}`}>
                      {simClassification}
                    </span>
                  </div>
                  <div>
                    <span className="font-caption text-caption text-secondary block">Tindakan SOP:</span>
                    <span className="font-body-tabular-bold text-caption text-on-surface block mt-1">
                      {simSOP}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-space-sm rounded-lg bg-surface-container/50 text-caption font-caption text-secondary flex items-start gap-space-xs border border-surface-border/50">
                <span className="material-symbols-outlined text-[16px] text-brand-crimson mt-0.5">info</span>
                <span>
                  Rumus: <code>Keterlambatan = Tanggal Cutoff ({cutoffDate}) - Tanggal Jatuh Tempo Faktur</code>. Jika bernilai negatif (≤ 0), faktur diklasifikasikan sebagai <strong>Current</strong>.
                </span>
              </div>
            </div>

            <div className="px-space-lg py-space-md bg-surface-subtle flex items-center justify-end gap-space-sm border-t border-surface-border">
              <button
                onClick={() => setIsSimModalOpen(false)}
                className="px-space-md py-2 rounded-lg bg-surface-canvas hover:bg-surface text-on-surface font-body-tabular text-body-tabular transition-all cursor-pointer border border-surface-border"
              >
                Tutup
              </button>
              <button
                onClick={handleApplySimToTable}
                className="px-space-md py-2 rounded-lg bg-brand-crimson hover:bg-brand-crimson-hover text-on-primary font-body-tabular-bold text-body-tabular transition-all cursor-pointer shadow-sm"
              >
                Suntikkan Sampel ke Tabel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
