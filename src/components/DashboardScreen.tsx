import React, { useState } from 'react';
import { Invoice, PromiseRecord } from '../types';
import { formatIDR, calculateAgingDays } from '../data/initialData';

interface DashboardScreenProps {
  invoices: Invoice[];
  promises: PromiseRecord[];
  onAddInvoice: (inv: Partial<Invoice>) => void;
  onNavigate: (screen: any) => void;
  onLoadSample: () => void;
  onShowToast: (title: string, message: string, type?: 'success' | 'info' | 'warn') => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  invoices,
  promises,
  onAddInvoice,
  onNavigate,
  onLoadSample,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'nearDue' | 'overdue' | 'missedPromise'>('nearDue');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [invNo, setInvNo] = useState('');
  const [customer, setCustomer] = useState('');
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [amount, setAmount] = useState('');
  const [downPayment, setDownPayment] = useState('0');
  const [notes, setNotes] = useState('');

  // Calculations
  const totalBalance = invoices.reduce((acc, curr) => acc + (curr.balance > 0 ? curr.balance : 0), 0);
  const unpaidInvoices = invoices.filter((i) => i.balance > 0);
  const nearDueInvoices = invoices.filter((i) => {
    if (i.balance <= 0) return false;
    const days = calculateAgingDays(i.dueDate);
    return days <= 0 && days >= -7; // Due in next 7 days
  });
  const overdueInvoices = invoices.filter((i) => {
    if (i.balance <= 0) return false;
    return calculateAgingDays(i.dueDate) > 0;
  });
  const overdueSevereCount = invoices.filter((i) => {
    if (i.balance <= 0) return false;
    return calculateAgingDays(i.dueDate) > 30;
  }).length;

  const totalNearDueAmount = nearDueInvoices.reduce((acc, curr) => acc + curr.balance, 0);
  const overduePercentage = totalBalance > 0 ? Math.round((overdueInvoices.reduce((a, c) => a + c.balance, 0) / totalBalance) * 100) : 0;

  const missedPromises = promises.filter((p) => p.status === 'Ingkar Janji / Terlewat');

  const handleOpenModal = () => {
    const today = new Date().toISOString().split('T')[0];
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setIssueDate(today);
    setDueDate(d.toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount) || 0;
    const numPaid = parseFloat(downPayment) || 0;
    const balance = Math.max(0, numAmount - numPaid);

    onAddInvoice({
      no: invNo || `INV-BKR-2026-${String(invoices.length + 1).padStart(4, '0')}`,
      customer: customer || 'Pelanggan Baru Semen Tonasa',
      issueDate,
      dueDate,
      amount: numAmount,
      paid: numPaid,
      balance,
      status: balance <= 0 ? 'settled' : calculateAgingDays(dueDate) > 0 ? 'overdue' : 'current',
      followUpNote: notes,
    });

    setIsModalOpen(false);
    setInvNo('');
    setCustomer('');
    setAmount('');
    setDownPayment('0');
    setNotes('');

    onShowToast('Faktur Berhasil Ditambahkan', `Invoice ${invNo || 'baru'} berhasil dicatat ke sistem.`);
  };

  return (
    <div className="flex flex-col w-full">
      {/* Top Corporate Sub-Header Bar (Tonasa.fig style) */}
      <div className="w-full bg-brand-crimson text-on-primary px-space-lg py-space-md shadow-md flex flex-wrap items-center justify-between gap-space-md">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-space-sm">
            <span className="material-symbols-outlined text-[22px] text-white/90">analytics</span>
            <h1 className="font-headline-corporate text-headline-corporate tracking-tight text-on-primary">
              Dashboard Monitoring Piutang — PT Biringkassi Raya
            </h1>
          </div>
          <div className="flex items-center gap-space-xs mt-space-xs text-white/80">
            <span className="material-symbols-outlined text-[14px]">schedule</span>
            <span className="font-caption text-caption">
              {invoices.length > 0
                ? 'Pembaruan Terakhir: Realtime SAP S/4HANA Sync (14 Okt 2026)'
                : 'Pembaruan Terakhir: Belum ada data (Menunggu Input/Impor Data)'}
            </span>
            <span className="inline-block w-1 h-1 rounded-full bg-white/40 mx-space-xs"></span>
            <span className="font-label-badge text-label-badge uppercase tracking-wider bg-white/10 px-space-xs py-0.5 rounded text-white">
              Modul Keuangan Operasional
            </span>
          </div>
        </div>

        <div className="flex items-center gap-space-sm">
          <button
            onClick={handleOpenModal}
            className="flex items-center gap-space-xs px-space-md py-space-sm bg-white text-brand-crimson hover:bg-surface-subtle font-body-tabular-bold text-body-tabular rounded-lg shadow-sm transition-all transform active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Input Tagihan Manual</span>
          </button>
          <button
            onClick={() => onNavigate('impor-data-rekonsiliasi')}
            className="flex items-center gap-space-xs px-space-md py-space-sm bg-brand-crimson-hover hover:bg-black/20 text-on-primary font-body-tabular-bold text-body-tabular rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">file_upload</span>
            <span>Impor Excel/CSV</span>
          </button>
        </div>
      </div>

      <div className="p-space-lg space-y-space-lg max-w-7xl mx-auto w-full">
        {/* Notice Banner */}
        <div className="w-full bg-surface-container-low p-space-md rounded-xl flex items-center justify-between gap-space-md shadow-sm border border-surface-border/50">
          <div className="flex items-center gap-space-md">
            <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-brand-crimson shrink-0">
              <span className="material-symbols-outlined text-[22px]">info</span>
            </div>
            <div className="flex flex-col">
              <span className="font-body-tabular-bold text-body-tabular text-on-surface font-semibold">
                Inisialisasi Buku Besar Piutang Tahun Berjalan
              </span>
              <span className="font-caption text-caption text-secondary">
                {invoices.length > 0
                  ? `Terdata ${invoices.length} faktur operasional aktif terintegrasi dengan limit penjaminan Tonasa.`
                  : 'Data piutang lokal belum terisi. Mulai catat piutang ritel, proyek, atau distributor Semen Tonasa Group untuk mengaktifkan kalkulasi umur piutang.'}
              </span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-space-xs">
            <span className="font-label-badge text-label-badge text-secondary bg-surface-container px-space-sm py-1 rounded">
              ERP KODE: TBR-FIN-00
            </span>
          </div>
        </div>

        {/* 5 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-space-md">
          {/* Metric 1 */}
          <div className="bg-surface-canvas rounded-xl p-space-md shadow-sm flex flex-col justify-between border border-surface-border">
            <div className="flex items-start justify-between">
              <span className="font-label-badge text-label-badge uppercase tracking-wider text-secondary">
                Total Saldo Terbuka
              </span>
              <span className="material-symbols-outlined text-secondary text-[20px]">account_balance_wallet</span>
            </div>
            <div className="mt-space-md">
              <div className="font-display-lg text-display-lg text-on-surface leading-tight font-bold truncate">
                {formatIDR(totalBalance)}
              </div>
              <div className="mt-space-xs flex items-center gap-space-xs">
                <span className="inline-flex items-center px-space-xs py-0.5 rounded text-label-badge font-label-badge bg-status-due-bg text-status-due-text">
                  {invoices.length > 0 ? `${unpaidInvoices.length} Rekening Aktif` : 'Menunggu Data Masuk'}
                </span>
              </div>
            </div>
            <div className="mt-space-sm pt-space-xs text-secondary font-caption text-caption flex items-center justify-between border-t border-surface-border/50">
              <span>Target Rekonsiliasi</span>
              <span className="font-body-tabular-bold text-on-surface">100%</span>
            </div>
          </div>

          {/* Metric 2 */}
          <div className="bg-surface-canvas rounded-xl p-space-md shadow-sm flex flex-col justify-between border border-surface-border">
            <div className="flex items-start justify-between">
              <span className="font-label-badge text-label-badge uppercase tracking-wider text-secondary">
                Invoice Belum Lunas
              </span>
              <span className="material-symbols-outlined text-secondary text-[20px]">receipt_long</span>
            </div>
            <div className="mt-space-md">
              <div className="font-display-lg text-display-lg text-on-surface leading-tight font-bold">
                {unpaidInvoices.length} <span className="font-title-md text-title-md font-normal text-secondary">Faktur</span>
              </div>
              <div className="mt-space-xs flex items-center gap-space-xs">
                <span className="inline-flex items-center px-space-xs py-0.5 rounded text-label-badge font-label-badge bg-surface-subtle text-secondary">
                  Aktif: {unpaidInvoices.length} Faktur
                </span>
              </div>
            </div>
            <div className="mt-space-sm pt-space-xs text-secondary font-caption text-caption flex items-center justify-between border-t border-surface-border/50">
              <span>Nilai Tertagih</span>
              <span className="font-body-tabular-bold text-on-surface">{formatIDR(totalBalance)}</span>
            </div>
          </div>

          {/* Metric 3 */}
          <div className="bg-surface-canvas rounded-xl p-space-md shadow-sm flex flex-col justify-between border border-surface-border">
            <div className="flex items-start justify-between">
              <span className="font-label-badge text-label-badge uppercase tracking-wider text-secondary">
                Jatuh Tempo (&lt; 7 Hari)
              </span>
              <span className="material-symbols-outlined text-status-due-text text-[20px]">notification_important</span>
            </div>
            <div className="mt-space-md">
              <div className="font-display-lg text-display-lg text-on-surface leading-tight font-bold">
                {nearDueInvoices.length} <span className="font-title-md text-title-md font-normal text-secondary">Faktur</span>
              </div>
              <div className="mt-space-xs flex items-center gap-space-xs">
                <span className="inline-flex items-center px-space-xs py-0.5 rounded text-label-badge font-label-badge bg-status-due-bg text-status-due-text">
                  Atensi Segera
                </span>
              </div>
            </div>
            <div className="mt-space-sm pt-space-xs text-secondary font-caption text-caption flex items-center justify-between border-t border-surface-border/50">
              <span>Potensi Terkumpul</span>
              <span className="font-body-tabular-bold text-on-surface">{formatIDR(totalNearDueAmount)}</span>
            </div>
          </div>

          {/* Metric 4: Crimson Accent */}
          <div className="bg-surface-canvas rounded-xl p-space-md shadow-sm flex flex-col justify-between relative overflow-hidden border border-surface-border">
            <div className="w-1.5 absolute left-0 top-0 bottom-0 bg-brand-crimson"></div>
            <div className="flex items-start justify-between pl-space-xs">
              <span className="font-label-badge text-label-badge uppercase tracking-wider text-secondary">
                Lewat Tempo (Overdue)
              </span>
              <span className="material-symbols-outlined text-brand-crimson text-[20px]">warning</span>
            </div>
            <div className="mt-space-md pl-space-xs">
              <div className="font-display-lg text-display-lg text-brand-crimson leading-tight font-bold">
                {overdueInvoices.length} <span className="font-title-md text-title-md font-normal text-secondary">Faktur</span>
              </div>
              <div className="mt-space-xs flex items-center gap-space-xs">
                <span className="inline-flex items-center px-space-xs py-0.5 rounded text-label-badge font-label-badge bg-status-overdue-bg text-status-overdue-text font-bold">
                  {overduePercentage}% Terhadap Saldo
                </span>
              </div>
            </div>
            <div className="mt-space-sm pt-space-xs text-secondary font-caption text-caption flex items-center justify-between pl-space-xs border-t border-surface-border/50">
              <span>Usia Piutang &gt; 30 Hari</span>
              <span className="font-body-tabular-bold text-brand-crimson">{overdueSevereCount} Faktur</span>
            </div>
          </div>

          {/* Metric 5 */}
          <div className="bg-surface-canvas rounded-xl p-space-md shadow-sm flex flex-col justify-between border border-surface-border">
            <div className="flex items-start justify-between">
              <span className="font-label-badge text-label-badge uppercase tracking-wider text-secondary">
                Janji Bayar Diperiksa
              </span>
              <span className="material-symbols-outlined text-secondary text-[20px]">event_available</span>
            </div>
            <div className="mt-space-md">
              <div className="font-display-lg text-display-lg text-on-surface leading-tight font-bold">
                {promises.length} <span className="font-title-md text-title-md font-normal text-secondary">Janji</span>
              </div>
              <div className="mt-space-xs flex items-center gap-space-xs">
                <span className="inline-flex items-center px-space-xs py-0.5 rounded text-label-badge font-label-badge bg-status-promise-bg text-status-promise-text font-bold">
                  {missedPromises.length > 0 ? `${missedPromises.length} Perlu Eskalasi` : 'Terkendali'}
                </span>
              </div>
            </div>
            <div className="mt-space-sm pt-space-xs text-secondary font-caption text-caption flex items-center justify-between border-t border-surface-border/50">
              <span>Tindak Lanjut Tertunda</span>
              <span className="font-body-tabular-bold text-on-surface">{missedPromises.length} Kasus</span>
            </div>
          </div>
        </div>

        {/* Hero Card Banner */}
        <div className="bg-surface-canvas rounded-xl p-space-lg shadow-sm relative overflow-hidden border border-surface-border">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-center">
            {/* Visual illustration / Photo Banner */}
            <div className="lg:col-span-5 relative">
              <div className="relative h-64 sm:h-72 w-full rounded-xl overflow-hidden shadow-inner bg-surface-container">
                <img
                  className="w-full h-full object-cover"
                  alt="Modern corporate financial accounting office desk"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBn-fQNr5j0pCzETnCZuZ0Ki0y_9MGTgPDdd5qgrJQV94stjHR4lHVHh7dL1axRogld2WHCYMz-eJlINXxDpBO1Hb0Z964tvM1H3TOuQfLtXZzAYjYIb_-vn4kCfhWbFuASvb4sERFBchvtmSZCenIHdAkV_i1oSHJviRxpSS-aoAbHlPKVITR8PHs7OKw3Qa97ojwPX89AR-DnRftnBk_1AaggEiUdzyZCZ0AQdSn6vPXsdXfuiDUBpg"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/30 to-transparent flex flex-col justify-end p-space-md text-on-primary">
                  <span className="font-label-badge text-label-badge uppercase tracking-wider text-white/80">
                    Sistem Akuntansi Terpadu
                  </span>
                  <p className="font-title-md text-title-md font-bold mt-space-xs text-white">
                    Monitoring Piutang Usaha &amp; Logistik Semen
                  </p>
                </div>
              </div>
            </div>

            {/* Descriptive Copy and Actions */}
            <div className="lg:col-span-7 flex flex-col justify-center space-y-space-md">
              <div className="inline-flex items-center gap-space-xs px-space-sm py-1 bg-brand-crimson-subtle text-brand-crimson rounded text-label-badge font-label-badge w-fit">
                <span className="material-symbols-outlined text-[16px]">database</span>
                <span>
                  {invoices.length > 0
                    ? `DATA TERSINKRONISASI (${invoices.length} FAKTUR)`
                    : 'BASIS DATA KOSONG (ZERO RECORDS)'}
                </span>
              </div>
              <div>
                <h2 className="font-headline-corporate text-display-lg text-on-surface font-bold tracking-tight">
                  {invoices.length > 0 ? 'Ringkasan Portofolio Piutang Aktif' : 'Belum Ada Data Piutang Tersimpan'}
                </h2>
                <p className="font-body-tabular text-body-tabular text-secondary mt-space-sm max-w-2xl leading-relaxed">
                  {invoices.length > 0
                    ? `Sistem memonitor portofolio piutang dengan total saldo terbuka ${formatIDR(totalBalance)} yang tersebar di wilayah distribusi semen curah, zak ritel, dan proyek BUMN di kawasan Indonesia Timur.`
                    : 'Basis data monitoring piutang saat ini masih kosong. Anda dapat menambahkan data invoice secara manual satu per satu atau melakukan impor berkas Excel/CSV template resmi PT Biringkassi Raya untuk menganalisis perputaran kas dan umur piutang semen.'}
                </p>
              </div>

              {/* Quick Action Buttons */}
              <div className="flex flex-wrap items-center gap-space-sm pt-space-xs">
                <button
                  onClick={handleOpenModal}
                  className="flex items-center gap-space-xs px-space-lg py-space-md bg-brand-crimson hover:bg-brand-crimson-hover text-on-primary font-body-tabular-bold text-body-tabular rounded-lg shadow-sm transition-all transform active:scale-95 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">add</span>
                  <span>+ Tambah Faktur Baru (Manual)</span>
                </button>
                <button
                  onClick={() => onNavigate('impor-data-rekonsiliasi')}
                  className="flex items-center gap-space-xs px-space-md py-space-md bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-body-tabular-bold text-body-tabular rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px] text-brand-crimson">upload_file</span>
                  <span>Unggah Berkas Excel/CSV</span>
                </button>
                {invoices.length === 0 ? (
                  <button
                    onClick={onLoadSample}
                    className="flex items-center gap-space-xs px-space-md py-space-md bg-surface-subtle hover:bg-surface-container text-brand-crimson font-body-tabular-bold text-body-tabular rounded-lg shadow-sm transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[20px]">rule_folder</span>
                    <span>Muat Contoh Riwayat Tonasa</span>
                  </button>
                ) : (
                  <button
                    onClick={() => onNavigate('analisis-umur-piutang')}
                    className="flex items-center gap-space-xs px-space-md py-space-md bg-surface-subtle hover:bg-surface-container text-secondary font-body-tabular text-body-tabular rounded-lg shadow-sm transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[20px]">analytics</span>
                    <span>Buka Matriks Aging Schedule</span>
                  </button>
                )}
              </div>

              {/* Micro-checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm pt-space-md border-t border-surface-border/50">
                <div className="flex items-center gap-space-xs text-secondary font-caption text-caption">
                  <span className="material-symbols-outlined text-status-current-text text-[18px]">verified</span>
                  <span>Validasi Otomatis NPWP</span>
                </div>
                <div className="flex items-center gap-space-xs text-secondary font-caption text-caption">
                  <span className="material-symbols-outlined text-status-current-text text-[18px]">verified</span>
                  <span>Kalkulasi Aging Realtime</span>
                </div>
                <div className="flex items-center gap-space-xs text-secondary font-caption text-caption">
                  <span className="material-symbols-outlined text-status-current-text text-[18px]">verified</span>
                  <span>Audit Trail Riwayat Penagihan</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section Shortcut Prioritas Tindak Lanjut */}
        <div className="bg-surface-canvas rounded-xl shadow-sm overflow-hidden border border-surface-border">
          {/* Header */}
          <div className="px-space-lg py-space-md bg-surface-subtle flex flex-wrap items-center justify-between gap-space-md border-b border-surface-border">
            <div>
              <h3 className="font-title-md text-title-md text-on-surface font-bold">Shortcut Prioritas Tindak Lanjut</h3>
              <p className="font-caption text-caption text-secondary mt-0.5">
                Daftar invoice kritis yang memerlukan atensi staf collection &amp; penagihan lapangan.
              </p>
            </div>
            <div className="flex items-center gap-space-xs">
              <span className="font-caption text-caption text-secondary">Tampilkan:</span>
              <select className="h-8 px-space-sm bg-surface-canvas text-secondary font-body-tabular text-caption rounded-lg shadow-sm border border-surface-border focus:outline-none cursor-pointer">
                <option>Semua Wilayah Operasional</option>
                <option>Wilayah Sulawesi Selatan</option>
                <option>Wilayah Sulawesi Barat &amp; Tengah</option>
                <option>Distributor Proyek BUMN</option>
              </select>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="flex items-center px-space-lg bg-surface-canvas border-b border-surface-border">
            <button
              onClick={() => setActiveTab('nearDue')}
              className={`py-space-md px-space-md font-body-tabular text-body-tabular -mb-px flex items-center gap-space-xs transition-colors cursor-pointer border-b-2 ${
                activeTab === 'nearDue'
                  ? 'border-brand-crimson text-brand-crimson font-bold'
                  : 'border-transparent text-secondary hover:text-on-surface'
              }`}
            >
              <span>Jatuh Tempo Mendekat</span>
              <span className="px-space-xs py-0.5 rounded-full text-label-badge font-label-badge bg-brand-crimson-subtle text-brand-crimson">
                {nearDueInvoices.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('overdue')}
              className={`py-space-md px-space-md font-body-tabular text-body-tabular -mb-px flex items-center gap-space-xs transition-colors cursor-pointer border-b-2 ${
                activeTab === 'overdue'
                  ? 'border-brand-crimson text-brand-crimson font-bold'
                  : 'border-transparent text-secondary hover:text-on-surface'
              }`}
            >
              <span>Lewat Jatuh Tempo</span>
              <span className="px-space-xs py-0.5 rounded-full text-label-badge font-label-badge bg-status-overdue-bg text-status-overdue-text">
                {overdueInvoices.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('missedPromise')}
              className={`py-space-md px-space-md font-body-tabular text-body-tabular -mb-px flex items-center gap-space-xs transition-colors cursor-pointer border-b-2 ${
                activeTab === 'missedPromise'
                  ? 'border-brand-crimson text-brand-crimson font-bold'
                  : 'border-transparent text-secondary hover:text-on-surface'
              }`}
            >
              <span>Janji Bayar Terlewat</span>
              <span className="px-space-xs py-0.5 rounded-full text-label-badge font-label-badge bg-surface-subtle text-secondary">
                {missedPromises.length}
              </span>
            </button>
          </div>

          {/* Table Area */}
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left font-body-tabular text-body-tabular border-collapse">
              <thead className="bg-surface-subtle text-secondary font-label-numeric text-caption uppercase tracking-wider border-b border-surface-border">
                <tr>
                  <th className="py-space-md px-space-md">Nomor Invoice</th>
                  <th className="py-space-md px-space-md">Pelanggan / Distributor</th>
                  <th className="py-space-md px-space-md">Tgl Faktur</th>
                  <th className="py-space-md px-space-md">Jatuh Tempo</th>
                  <th className="py-space-md px-space-md text-right">Nilai Tagihan</th>
                  <th className="py-space-md px-space-md text-right">Sisa Piutang</th>
                  <th className="py-space-md px-space-md text-center">Status Umur</th>
                  <th className="py-space-md px-space-md text-center">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {activeTab === 'nearDue' && nearDueInvoices.length > 0 ? (
                  nearDueInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-surface-subtle transition-colors h-12 text-sm">
                      <td className="py-space-xs px-space-md font-body-tabular-bold text-brand-crimson">{inv.no}</td>
                      <td className="py-space-xs px-space-md font-semibold text-on-surface">{inv.customer}</td>
                      <td className="py-space-xs px-space-md text-secondary">{inv.issueDate}</td>
                      <td className="py-space-xs px-space-md text-status-due-text font-medium">{inv.dueDate}</td>
                      <td className="py-space-xs px-space-md text-right font-mono">{formatIDR(inv.amount)}</td>
                      <td className="py-space-xs px-space-md text-right font-mono font-bold text-brand-crimson">{formatIDR(inv.balance)}</td>
                      <td className="py-space-xs px-space-md text-center">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-status-due-bg text-status-due-text">
                          Jatuh Tempo Mendekat
                        </span>
                      </td>
                      <td className="py-space-xs px-space-md text-center">
                        <button
                          onClick={() => onNavigate('daftar-piutang-invoice')}
                          className="px-2.5 py-1 text-caption font-body-tabular-bold rounded bg-surface-canvas hover:bg-surface-subtle border border-surface-border text-brand-crimson cursor-pointer"
                        >
                          Tindak Lanjut
                        </button>
                      </td>
                    </tr>
                  ))
                ) : activeTab === 'overdue' && overdueInvoices.length > 0 ? (
                  overdueInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-surface-subtle transition-colors h-12 text-sm">
                      <td className="py-space-xs px-space-md font-body-tabular-bold text-brand-crimson">{inv.no}</td>
                      <td className="py-space-xs px-space-md font-semibold text-on-surface">{inv.customer}</td>
                      <td className="py-space-xs px-space-md text-secondary">{inv.issueDate}</td>
                      <td className="py-space-xs px-space-md text-status-overdue-text font-bold">{inv.dueDate}</td>
                      <td className="py-space-xs px-space-md text-right font-mono">{formatIDR(inv.amount)}</td>
                      <td className="py-space-xs px-space-md text-right font-mono font-bold text-brand-crimson">{formatIDR(inv.balance)}</td>
                      <td className="py-space-xs px-space-md text-center">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-status-overdue-bg text-status-overdue-text">
                          +{calculateAgingDays(inv.dueDate)} Hari
                        </span>
                      </td>
                      <td className="py-space-xs px-space-md text-center">
                        <button
                          onClick={() => onNavigate('janji-bayar-tindak-lanjut')}
                          className="px-2.5 py-1 text-caption font-body-tabular-bold rounded bg-surface-canvas hover:bg-surface-subtle border border-surface-border text-brand-crimson cursor-pointer"
                        >
                          Catat Janji
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                        <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-secondary mb-space-md">
                          <span className="material-symbols-outlined text-[32px]">folder_off</span>
                        </div>
                        <span className="font-title-md text-title-md font-bold text-on-surface">
                          {activeTab === 'nearDue'
                            ? 'Tidak Ada Faktur Jatuh Tempo Mendekat'
                            : activeTab === 'overdue'
                            ? 'Nol Faktur Lewat Jatuh Tempo'
                            : 'Belum Ada Catatan Janji Bayar Terlewat'}
                        </span>
                        <p className="font-caption text-caption text-secondary mt-space-xs text-center">
                          {activeTab === 'nearDue'
                            ? 'Saat ini belum ada transaksi piutang dengan waktu jatuh tempo di bawah 7 hari. Data akan otomatis muncul setelah faktur dicatat.'
                            : activeTab === 'overdue'
                            ? 'Tidak ditemukan invoice yang telah melewati tanggal jatuh tempo (overdue). Portofolio penagihan bersih.'
                            : 'Tidak ada komitmen bayar yang mangkir atau memerlukan tindak lanjut khusus hari ini.'}
                        </p>
                        <div className="flex items-center gap-2 mt-space-md">
                          <button
                            onClick={handleOpenModal}
                            className="inline-flex items-center gap-space-xs px-space-md py-space-xs bg-brand-crimson hover:bg-brand-crimson-hover text-on-primary font-body-tabular-bold text-caption rounded-lg transition-colors cursor-pointer shadow-sm"
                          >
                            <span className="material-symbols-outlined text-[16px]">add</span>
                            <span>Input Tagihan Sekarang</span>
                          </button>
                          {invoices.length === 0 && (
                            <button
                              onClick={onLoadSample}
                              className="inline-flex items-center gap-space-xs px-space-md py-space-xs bg-surface-container hover:bg-surface-container-high text-on-surface font-body-tabular-bold text-caption rounded-lg transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[16px]">database</span>
                              <span>Muat Contoh Riwayat Tonasa</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Status */}
          <div className="px-space-lg py-space-md bg-surface-subtle flex flex-wrap items-center justify-between gap-space-md border-t border-surface-border">
            <div className="font-caption text-caption text-secondary">
              Menampilkan <span className="font-body-tabular-bold text-on-surface">{invoices.length}</span> dari{' '}
              <span className="font-body-tabular-bold text-on-surface">{invoices.length}</span> total data piutang
            </div>
            <div className="flex items-center gap-space-xs">
              <button
                className="px-space-md py-1 bg-surface-canvas text-secondary/40 font-body-tabular text-caption rounded shadow-sm border border-surface-border cursor-not-allowed"
                disabled
              >
                Sebelumnya
              </button>
              <span className="px-space-sm py-1 font-body-tabular-bold text-caption text-on-surface bg-surface-container rounded">
                1
              </span>
              <button
                className="px-space-md py-1 bg-surface-canvas text-secondary/40 font-body-tabular text-caption rounded shadow-sm border border-surface-border cursor-not-allowed"
                disabled
              >
                Selanjutnya
              </button>
            </div>
          </div>
        </div>

        {/* 3 Quick Reference Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md pb-space-lg">
          <div className="bg-surface-canvas p-space-md rounded-xl shadow-sm flex items-start gap-space-md border border-surface-border">
            <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-brand-crimson shrink-0">
              <span className="material-symbols-outlined text-[20px]">download</span>
            </div>
            <div>
              <span className="font-body-tabular-bold text-body-tabular text-on-surface">Format File Impor</span>
              <p className="font-caption text-caption text-secondary mt-1">
                Gunakan berkas .xlsx atau .csv dengan header standar: Nomor Faktur, Kode Debitur, Tgl Inv, TOP, Nilai Tagihan.
              </p>
            </div>
          </div>

          <div className="bg-surface-canvas p-space-md rounded-xl shadow-sm flex items-start gap-space-md border border-surface-border">
            <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-status-due-text shrink-0">
              <span className="material-symbols-outlined text-[20px]">timer</span>
            </div>
            <div>
              <span className="font-body-tabular-bold text-body-tabular text-on-surface">Ketentuan Umur Piutang</span>
              <p className="font-caption text-caption text-secondary mt-1">
                Standar Tonasa Group: Lancar (&lt; 30 hr), Kurang Lancar (31-60 hr), Diragukan (61-90 hr), dan Macet (&gt; 90 hr).
              </p>
            </div>
          </div>

          <div className="bg-surface-canvas p-space-md rounded-xl shadow-sm flex items-start gap-space-md border border-surface-border">
            <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-brand-crimson shrink-0">
              <span className="material-symbols-outlined text-[20px]">support_agent</span>
            </div>
            <div>
              <span className="font-body-tabular-bold text-body-tabular text-on-surface">Bantuan Operasional ERP</span>
              <p className="font-caption text-caption text-secondary mt-1">
                Butuh sinkronisasi otomatis SAP Semen Tonasa? Hubungi Dept. IT &amp; Sistem Informasi Biringkassi Raya ext. 3412.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Modal: Input Tagihan Manual */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-space-md overflow-y-auto">
          <div className="bg-surface-canvas w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden transform transition-all my-8 border border-surface-border animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Top Accent Band */}
            <div className="h-1.5 w-full bg-brand-crimson"></div>

            {/* Modal Header */}
            <div className="px-space-lg py-space-md bg-surface-subtle flex items-center justify-between border-b border-surface-border">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-brand-crimson text-[24px]">post_add</span>
                <div>
                  <h3 className="font-headline-corporate text-title-md font-bold text-on-surface">
                    Pencatatan Faktur / Piutang Baru
                  </h3>
                  <p className="font-caption text-caption text-secondary">
                    Entri manual dokumen invoice penagihan pelanggan PT Biringkassi Raya
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-secondary hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleFormSubmit} className="p-space-lg space-y-space-md">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                {/* Nomor Invoice */}
                <div className="flex flex-col space-y-1">
                  <label className="font-label-badge text-caption font-semibold text-on-surface">
                    Nomor Invoice / Faktur <span className="text-brand-crimson">*</span>
                  </label>
                  <input
                    value={invNo}
                    onChange={(e) => setInvNo(e.target.value)}
                    className="h-10 px-space-md bg-surface-subtle rounded-lg text-body-tabular text-on-surface border border-surface-border focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-crimson/30 transition-all"
                    placeholder="Contoh: INV/2026/BR-0912"
                    required
                    type="text"
                  />
                  <span className="font-caption text-[11px] text-secondary">
                    Nomor faktur komersial atau surat penagihan resmi
                  </span>
                </div>

                {/* Pelanggan / Mitra */}
                <div className="flex flex-col space-y-1">
                  <label className="font-label-badge text-caption font-semibold text-on-surface">
                    Kode &amp; Nama Pelanggan <span className="text-brand-crimson">*</span>
                  </label>
                  <input
                    value={customer}
                    onChange={(e) => setCustomer(e.target.value)}
                    className="h-10 px-space-md bg-surface-subtle rounded-lg text-body-tabular text-on-surface border border-surface-border focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-crimson/30 transition-all"
                    placeholder="Contoh: CUST-014 - PT Semen Batua Perkasa"
                    required
                    type="text"
                  />
                  <span className="font-caption text-[11px] text-secondary">
                    Sesuai nama badan usaha atau distributor terdaftar
                  </span>
                </div>

                {/* Tanggal Invoice */}
                <div className="flex flex-col space-y-1">
                  <label className="font-label-badge text-caption font-semibold text-on-surface">
                    Tanggal Terbit Faktur <span className="text-brand-crimson">*</span>
                  </label>
                  <input
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="h-10 px-space-md bg-surface-subtle rounded-lg text-body-tabular text-on-surface border border-surface-border focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-crimson/30 transition-all"
                    required
                    type="date"
                  />
                </div>

                {/* Tanggal Jatuh Tempo */}
                <div className="flex flex-col space-y-1">
                  <label className="font-label-badge text-caption font-semibold text-on-surface">
                    Tanggal Jatuh Tempo (Due Date) <span className="text-brand-crimson">*</span>
                  </label>
                  <input
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="h-10 px-space-md bg-surface-subtle rounded-lg text-body-tabular text-on-surface border border-surface-border focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-crimson/30 transition-all"
                    required
                    type="date"
                  />
                </div>

                {/* Nilai Tagihan (IDR) */}
                <div className="flex flex-col space-y-1">
                  <label className="font-label-badge text-caption font-semibold text-on-surface">
                    Nilai Total Invoice (Rp) <span className="text-brand-crimson">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-body-tabular-bold text-caption text-secondary">
                      Rp
                    </span>
                    <input
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="h-10 pl-10 pr-space-md w-full bg-surface-subtle rounded-lg text-body-tabular text-on-surface border border-surface-border focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-crimson/30 transition-all"
                      min="1000"
                      placeholder="150000000"
                      required
                      type="number"
                    />
                  </div>
                  <span className="font-caption text-[11px] text-secondary">
                    Nominal bruto tagihan sebelum potongan PPh/PPn
                  </span>
                </div>

                {/* Uang Muka */}
                <div className="flex flex-col space-y-1">
                  <label className="font-label-badge text-caption font-semibold text-on-surface">
                    Uang Muka / Pembayaran Tercatat (Rp)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-body-tabular-bold text-caption text-secondary">
                      Rp
                    </span>
                    <input
                      value={downPayment}
                      onChange={(e) => setDownPayment(e.target.value)}
                      className="h-10 pl-10 pr-space-md w-full bg-surface-subtle rounded-lg text-body-tabular text-on-surface border border-surface-border focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-crimson/30 transition-all"
                      min="0"
                      type="number"
                    />
                  </div>
                  <span className="font-caption text-[11px] text-secondary">
                    Isi 0 jika belum ada pembayaran uang muka
                  </span>
                </div>
              </div>

              {/* Catatan Awal */}
              <div className="flex flex-col space-y-1">
                <label className="font-label-badge text-caption font-semibold text-on-surface">
                  Catatan Penagihan / Nomor PO
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="p-space-md bg-surface-subtle rounded-lg text-body-tabular text-on-surface border border-surface-border focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-crimson/30 transition-all resize-none"
                  placeholder="Tambahkan informasi nomor SPK, pengiriman semen curah/sak, kontak bagian finance mitra..."
                  rows={3}
                />
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-space-md flex items-center justify-end gap-space-sm border-t border-surface-border">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-space-lg py-space-sm bg-surface-subtle hover:bg-surface-container text-secondary font-body-tabular-bold text-body-tabular rounded-lg transition-colors cursor-pointer"
                  type="button"
                >
                  Batal
                </button>
                <button
                  className="flex items-center gap-space-xs px-space-lg py-space-sm bg-brand-crimson hover:bg-brand-crimson-hover text-on-primary font-body-tabular-bold text-body-tabular rounded-lg shadow-sm transition-all cursor-pointer"
                  type="submit"
                >
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  <span>Simpan Faktur Piutang</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
