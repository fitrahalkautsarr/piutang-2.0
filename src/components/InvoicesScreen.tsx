import React, { useState } from 'react';
import { Invoice, PromiseRecord } from '../types';
import { formatIDR, calculateAgingDays } from '../data/initialData';

interface InvoicesScreenProps {
  invoices: Invoice[];
  onAddInvoice: (inv: Partial<Invoice>) => void;
  onUpdateInvoice: (id: string, updates: Partial<Invoice>) => void;
  onAddPromise: (promise: Partial<PromiseRecord>) => void;
  onLoadSample: () => void;
  onShowToast: (title: string, message: string, type?: 'success' | 'info' | 'warn') => void;
}

export const InvoicesScreen: React.FC<InvoicesScreenProps> = ({
  invoices,
  onAddInvoice,
  onUpdateInvoice,
  onAddPromise,
  onLoadSample,
  onShowToast,
}) => {
  const [currentFilterTab, setCurrentFilterTab] = useState<'all' | 'unpaid' | 'overdue' | 'promise' | 'paid'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusSelect, setStatusSelect] = useState('');
  const [dateRangeSelect, setDateRangeSelect] = useState('all');

  // Modal 1: New Invoice
  const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false);
  const [inpNo, setInpNo] = useState('');
  const [inpSpk, setInpSpk] = useState('');
  const [inpCustomer, setInpCustomer] = useState('');
  const [inpIssueDate, setInpIssueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [inpDueDate, setInpDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [inpAmount, setInpAmount] = useState('');
  const [inpPaid, setInpPaid] = useState('0');
  const [inpNotes, setInpNotes] = useState('');

  // Modal 2: Follow-up & Promise to Pay
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);
  const [targetInvoice, setTargetInvoice] = useState<Invoice | null>(null);
  const [fuChannel, setFuChannel] = useState('Telepon Langsung');
  const [fuContactDate, setFuContactDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [fuPicName, setFuPicName] = useState('');
  const [fuPromiseAmount, setFuPromiseAmount] = useState('');
  const [fuPromiseDate, setFuPromiseDate] = useState('');
  const [fuSummary, setFuSummary] = useState('');
  const [fuNextStep, setFuNextStep] = useState('');

  // Calculations
  const totalOutstandingSum = invoices.reduce((acc, curr) => acc + (curr.balance > 0 ? curr.balance : 0), 0);
  const currentDueSum = invoices
    .filter((i) => i.balance > 0 && calculateAgingDays(i.dueDate) <= 0)
    .reduce((acc, curr) => acc + curr.balance, 0);
  const overdueSum = invoices
    .filter((i) => i.balance > 0 && calculateAgingDays(i.dueDate) > 0)
    .reduce((acc, curr) => acc + curr.balance, 0);
  const totalPromiseCount = invoices.filter((i) => i.status === 'promise').length;

  const totalAll = invoices.length;
  const totalUnpaid = invoices.filter((i) => i.balance > 0).length;
  const totalOverdue = invoices.filter((i) => i.balance > 0 && calculateAgingDays(i.dueDate) > 0).length;
  const totalPaid = invoices.filter((i) => i.balance <= 0).length;

  // Filtered List
  const filteredInvoices = invoices.filter((inv) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      inv.no.toLowerCase().includes(q) ||
      inv.customer.toLowerCase().includes(q) ||
      (inv.spk && inv.spk.toLowerCase().includes(q));

    let matchesTab = true;
    if (currentFilterTab === 'unpaid') matchesTab = inv.balance > 0;
    else if (currentFilterTab === 'overdue') matchesTab = inv.balance > 0 && calculateAgingDays(inv.dueDate) > 0;
    else if (currentFilterTab === 'promise') matchesTab = inv.status === 'promise';
    else if (currentFilterTab === 'paid') matchesTab = inv.balance <= 0;

    let matchesStatus = true;
    if (statusSelect) {
      if (statusSelect === 'settled') matchesStatus = inv.balance <= 0;
      else if (statusSelect === 'current') matchesStatus = inv.balance > 0 && calculateAgingDays(inv.dueDate) <= 0;
      else if (statusSelect === 'overdue') matchesStatus = inv.balance > 0 && calculateAgingDays(inv.dueDate) > 0;
      else if (statusSelect === 'promise') matchesStatus = inv.status === 'promise';
    }

    return matchesSearch && matchesTab && matchesStatus;
  });

  const handleOpenFollowUp = (inv: Invoice) => {
    setTargetInvoice(inv);
    setFuPromiseAmount(String(inv.balance));
    setFuContactDate(new Date().toISOString().split('T')[0]);
    setFuPicName('');
    setFuSummary('');
    setFuNextStep('');
    setFuPromiseDate('');
    setIsFollowUpOpen(true);
  };

  const handleSaveFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetInvoice) return;

    const followUpNoteText = `${fuChannel}: PIC ${fuPicName} - Janji ${fuPromiseDate || 'segera'} (${fuSummary.substring(0, 45)}...)`;

    onUpdateInvoice(targetInvoice.id, {
      followUpNote: followUpNoteText,
      status: fuPromiseDate ? 'promise' : targetInvoice.status,
      lastFollowUpDate: fuContactDate,
    });

    if (fuPromiseDate) {
      onAddPromise({
        invoice: targetInvoice.no,
        partner: targetInvoice.customer,
        date: fuPromiseDate,
        amount: parseFloat(fuPromiseAmount) || targetInvoice.balance,
        officer: 'Admin Keuangan',
        channel: fuChannel,
        status: 'Menunggu Pembayaran',
        notes: fuSummary,
      });
    }

    setIsFollowUpOpen(false);
    onShowToast('Tindak Lanjut Dicatat', `Catatan penagihan untuk invoice ${targetInvoice.no} tersimpan ke riwayat audit.`);
  };

  const handleQuickPayment = (inv: Invoice) => {
    if (inv.balance <= 0) {
      onShowToast('Info', 'Faktur ini sudah lunas sepenuhnya.', 'info');
      return;
    }

    const confirmed = window.confirm(
      `Tandai faktur ${inv.no} (${formatIDR(inv.balance)}) sebagai telah LUNAS via pembayaran rekening giro / kas bank?`
    );
    if (confirmed) {
      onUpdateInvoice(inv.id, {
        paid: inv.amount,
        balance: 0,
        status: 'settled',
        followUpNote: 'Lunas rekonsiliasi kas bank Semen Tonasa',
      });
      onShowToast('Pelunasan Berhasil', `Faktur ${inv.no} telah ditandai lunas.`);
    }
  };

  const handleSaveNewInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(inpAmount) || 0;
    const numPaid = parseFloat(inpPaid) || 0;
    const balance = Math.max(0, numAmount - numPaid);

    onAddInvoice({
      no: inpNo || `INV-BKR-2026-${String(invoices.length + 1).padStart(4, '0')}`,
      spk: inpSpk || undefined,
      customer: inpCustomer || 'Pelanggan Semen Tonasa',
      issueDate: inpIssueDate,
      dueDate: inpDueDate,
      amount: numAmount,
      paid: numPaid,
      balance,
      status: balance <= 0 ? 'settled' : calculateAgingDays(inpDueDate) > 0 ? 'overdue' : 'current',
      followUpNote: inpNotes,
    });

    setIsNewInvoiceOpen(false);
    setInpNo('');
    setInpSpk('');
    setInpCustomer('');
    setInpAmount('');
    setInpPaid('0');
    setInpNotes('');

    onShowToast('Faktur Disimpan', `Faktur ${inpNo || 'baru'} berhasil ditambahkan.`);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusSelect('');
    setDateRangeSelect('all');
    setCurrentFilterTab('all');
    onShowToast('Filter Direset', 'Semua parameter pencarian dikembalikan ke default.', 'info');
  };

  return (
    <div className="flex flex-col w-full">
      <div className="px-space-lg py-space-lg space-y-space-lg max-w-7xl mx-auto w-full">
        {/* Header Context & Actions */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-space-md">
          <div>
            <div className="flex items-center gap-space-sm mb-1">
              <span className="px-space-xs py-0.5 rounded bg-brand-crimson/10 text-brand-crimson font-label-badge text-label-badge uppercase tracking-wider">
                Modul P-02
              </span>
              <span className="text-secondary font-caption text-caption">• Audit Terverifikasi Q4 2026</span>
            </div>
            <h1 className="font-headline-corporate text-display-lg text-on-surface tracking-tight">
              Daftar Piutang &amp; Faktur Terbuka
            </h1>
            <p className="font-body-tabular text-body-tabular text-secondary mt-1">
              Kelola, pantau, dan catat riwayat tindak lanjut penagihan piutang pelanggan PT Biringkassi Raya
            </p>
          </div>

          {/* Action Group */}
          <div className="flex items-center flex-wrap gap-space-sm">
            <button
              onClick={() => onShowToast('Ekspor Data', `Mengekspor ${invoices.length} baris faktur ke format Excel/CSV.`)}
              className="inline-flex items-center gap-space-xs px-3 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-caption font-body-tabular-bold shadow-sm transition-all cursor-pointer border border-surface-border/50"
            >
              <span className="material-symbols-outlined text-[18px] text-secondary">download</span>
              <span>Ekspor Data</span>
            </button>
            <button
              onClick={onLoadSample}
              className="inline-flex items-center gap-space-xs px-3 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-caption font-body-tabular-bold shadow-sm transition-all cursor-pointer border border-surface-border/50"
            >
              <span className="material-symbols-outlined text-[18px] text-secondary">upload_file</span>
              <span>Impor Excel</span>
            </button>
            <button
              onClick={() => setIsNewInvoiceOpen(true)}
              className="inline-flex items-center gap-space-xs px-4 py-2 rounded-lg bg-brand-crimson hover:bg-brand-crimson-hover text-on-primary text-caption font-body-tabular-bold shadow-sm transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>+ Input Invoice Manual</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Cards Deck */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
          <div className="bg-surface-canvas p-space-md rounded-xl shadow-sm relative overflow-hidden flex flex-col justify-between border border-surface-border">
            <div className="flex items-center justify-between">
              <span className="font-label-badge text-caption uppercase text-secondary tracking-wider">
                Total Portofolio Piutang
              </span>
              <div className="w-7 h-7 rounded bg-surface-container flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
              </div>
            </div>
            <div className="mt-3">
              <span className="font-headline-corporate text-title-md text-on-surface font-bold">
                {formatIDR(totalOutstandingSum)}
              </span>
              <p className="font-caption text-caption text-secondary mt-0.5">{totalUnpaid} Total tagihan terbuka</p>
            </div>
          </div>

          <div className="bg-surface-canvas p-space-md rounded-xl shadow-sm relative overflow-hidden flex flex-col justify-between border border-surface-border">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-status-due-text"></div>
            <div className="flex items-center justify-between pl-1">
              <span className="font-label-badge text-caption uppercase text-secondary tracking-wider">
                Belum Jatuh Tempo
              </span>
              <div className="w-7 h-7 rounded bg-status-due-bg flex items-center justify-center text-status-due-text">
                <span className="material-symbols-outlined text-[18px]">schedule</span>
              </div>
            </div>
            <div className="mt-3 pl-1">
              <span className="font-headline-corporate text-title-md text-on-surface font-bold">
                {formatIDR(currentDueSum)}
              </span>
              <p className="font-caption text-caption text-status-due-text mt-0.5">
                {invoices.filter((i) => i.balance > 0 && calculateAgingDays(i.dueDate) <= 0).length} Dokumen berstatus lancar
              </p>
            </div>
          </div>

          <div className="bg-surface-canvas p-space-md rounded-xl shadow-sm relative overflow-hidden flex flex-col justify-between border border-surface-border">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-crimson"></div>
            <div className="flex items-center justify-between pl-1">
              <span className="font-label-badge text-caption uppercase text-secondary tracking-wider">
                Lewat Jatuh Tempo (Overdue)
              </span>
              <div className="w-7 h-7 rounded bg-brand-crimson/10 flex items-center justify-center text-brand-crimson">
                <span className="material-symbols-outlined text-[18px]">error</span>
              </div>
            </div>
            <div className="mt-3 pl-1">
              <span className="font-headline-corporate text-title-md text-brand-crimson font-bold">
                {formatIDR(overdueSum)}
              </span>
              <p className="font-caption text-caption text-brand-crimson mt-0.5">Perlu eskalasi tindakan</p>
            </div>
          </div>

          <div className="bg-surface-canvas p-space-md rounded-xl shadow-sm relative overflow-hidden flex flex-col justify-between border border-surface-border">
            <div className="flex items-center justify-between">
              <span className="font-label-badge text-caption uppercase text-secondary tracking-wider">
                Janji Bayar Aktif
              </span>
              <div className="w-7 h-7 rounded bg-status-promise-bg flex items-center justify-center text-status-promise-text">
                <span className="material-symbols-outlined text-[18px]">handshake</span>
              </div>
            </div>
            <div className="mt-3">
              <span className="font-headline-corporate text-title-md text-on-surface font-bold">
                {totalPromiseCount} Kasus
              </span>
              <p className="font-caption text-caption text-status-promise-text mt-0.5">Komitmen dalam pemantauan</p>
            </div>
          </div>
        </div>

        {/* Main Container: Filter Bar & Table Panel */}
        <div className="bg-surface-canvas rounded-xl shadow-sm overflow-hidden flex flex-col border border-surface-border">
          {/* Quick Status Filter Pills (Tonasa Style) */}
          <div className="px-space-md pt-space-md pb-space-sm bg-surface-subtle flex flex-wrap items-center gap-2 border-b border-surface-border">
            <button
              onClick={() => setCurrentFilterTab('all')}
              className={`px-3 py-1.5 rounded text-caption font-body-tabular-bold transition-colors cursor-pointer ${
                currentFilterTab === 'all'
                  ? 'bg-brand-crimson text-on-primary shadow-xs'
                  : 'bg-surface-canvas text-secondary hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              Semua ({totalAll})
            </button>
            <button
              onClick={() => setCurrentFilterTab('unpaid')}
              className={`px-3 py-1.5 rounded text-caption font-body-tabular-bold transition-colors cursor-pointer ${
                currentFilterTab === 'unpaid'
                  ? 'bg-brand-crimson text-on-primary shadow-xs'
                  : 'bg-surface-canvas text-secondary hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              Belum Lunas ({totalUnpaid})
            </button>
            <button
              onClick={() => setCurrentFilterTab('overdue')}
              className={`px-3 py-1.5 rounded text-caption font-body-tabular-bold transition-colors cursor-pointer ${
                currentFilterTab === 'overdue'
                  ? 'bg-brand-crimson text-on-primary shadow-xs'
                  : 'bg-surface-canvas text-secondary hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              Overdue ({totalOverdue})
            </button>
            <button
              onClick={() => setCurrentFilterTab('promise')}
              className={`px-3 py-1.5 rounded text-caption font-body-tabular-bold transition-colors cursor-pointer ${
                currentFilterTab === 'promise'
                  ? 'bg-brand-crimson text-on-primary shadow-xs'
                  : 'bg-surface-canvas text-secondary hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              Janji Bayar ({totalPromiseCount})
            </button>
            <button
              onClick={() => setCurrentFilterTab('paid')}
              className={`px-3 py-1.5 rounded text-caption font-body-tabular-bold transition-colors cursor-pointer ${
                currentFilterTab === 'paid'
                  ? 'bg-brand-crimson text-on-primary shadow-xs'
                  : 'bg-surface-canvas text-secondary hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              Lunas ({totalPaid})
            </button>
          </div>

          {/* Control Bar: Search & Advanced Filters */}
          <div className="p-space-md bg-surface-canvas flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-space-sm border-b border-surface-border">
            {/* Search Input with Tonasa Material Icon */}
            <div className="relative flex-1 max-w-xl">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[20px]">
                search
              </span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 text-caption font-body-tabular bg-surface-subtle focus:bg-surface-canvas text-on-surface placeholder-secondary/70 rounded-lg outline-none border border-surface-border focus:border-brand-crimson transition-all"
                placeholder="Cari nomor invoice, kode, atau nama pelanggan..."
                type="text"
              />
            </div>

            {/* Filter Dropdowns Row */}
            <div className="flex items-center flex-wrap gap-space-sm">
              <div className="flex items-center bg-surface-subtle rounded-lg px-2.5 py-1.5 border border-surface-border">
                <span className="material-symbols-outlined text-secondary text-[18px] mr-1.5">tune</span>
                <select
                  value={statusSelect}
                  onChange={(e) => setStatusSelect(e.target.value)}
                  className="bg-transparent text-caption font-body-tabular-bold text-on-surface outline-none cursor-pointer pr-1"
                >
                  <option value="">Semua Status</option>
                  <option value="current">Belum Jatuh Tempo</option>
                  <option value="overdue">Lewat Jatuh Tempo</option>
                  <option value="promise">Janji Bayar</option>
                  <option value="settled">Lunas</option>
                </select>
              </div>

              <div className="flex items-center bg-surface-subtle rounded-lg px-2.5 py-1.5 border border-surface-border">
                <span className="material-symbols-outlined text-secondary text-[18px] mr-1.5">calendar_month</span>
                <select
                  value={dateRangeSelect}
                  onChange={(e) => setDateRangeSelect(e.target.value)}
                  className="bg-transparent text-caption font-body-tabular-bold text-on-surface outline-none cursor-pointer pr-1"
                >
                  <option value="all">Semua Periode</option>
                  <option value="this_month">Bulan Berjalan</option>
                  <option value="q4">Kuartal IV 2026</option>
                </select>
              </div>

              <button
                onClick={handleResetFilters}
                className="p-2 rounded-lg bg-surface-subtle hover:bg-surface-container text-secondary hover:text-on-surface transition-all flex items-center justify-center border border-surface-border cursor-pointer"
                title="Reset Pencarian"
              >
                <span className="material-symbols-outlined text-[18px]">restart_alt</span>
              </button>
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-subtle h-10 border-b border-surface-border">
                  <th className="px-space-md py-2 text-caption font-label-badge uppercase tracking-wider text-secondary whitespace-nowrap">
                    No. Invoice
                  </th>
                  <th className="px-space-md py-2 text-caption font-label-badge uppercase tracking-wider text-secondary whitespace-nowrap min-w-[200px]">
                    Pelanggan
                  </th>
                  <th className="px-space-md py-2 text-caption font-label-badge uppercase tracking-wider text-secondary whitespace-nowrap">
                    Tgl Invoice
                  </th>
                  <th className="px-space-md py-2 text-caption font-label-badge uppercase tracking-wider text-secondary whitespace-nowrap">
                    Jatuh Tempo
                  </th>
                  <th className="px-space-md py-2 text-caption font-label-badge uppercase tracking-wider text-secondary whitespace-nowrap text-right">
                    Nilai Tagihan (IDR)
                  </th>
                  <th className="px-space-md py-2 text-caption font-label-badge uppercase tracking-wider text-secondary whitespace-nowrap text-right">
                    Terbayar
                  </th>
                  <th className="px-space-md py-2 text-caption font-label-badge uppercase tracking-wider text-secondary whitespace-nowrap text-right">
                    Saldo Piutang
                  </th>
                  <th className="px-space-md py-2 text-caption font-label-badge uppercase tracking-wider text-secondary whitespace-nowrap text-center">
                    Status
                  </th>
                  <th className="px-space-md py-2 text-caption font-label-badge uppercase tracking-wider text-secondary whitespace-nowrap text-center">
                    Aging Hari
                  </th>
                  <th className="px-space-md py-2 text-caption font-label-badge uppercase tracking-wider text-secondary whitespace-nowrap text-center">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {filteredInvoices.length === 0 ? (
                  <tr className="bg-surface-canvas">
                    <td colSpan={10} className="px-space-md py-16 text-center">
                      <div className="max-w-md mx-auto flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-surface-subtle flex items-center justify-center text-secondary mb-4 border border-surface-border">
                          <span className="material-symbols-outlined text-[36px]">folder_off</span>
                        </div>
                        <h3 className="font-headline-corporate text-title-md text-on-surface font-semibold mb-1">
                          Belum Ada Catatan Piutang Terbuka
                        </h3>
                        <p className="font-body-tabular text-caption text-secondary leading-relaxed mb-6">
                          Belum ada catatan piutang yang dimasukkan. Klik tombol{' '}
                          <span className="font-body-tabular-bold text-brand-crimson">'Input Invoice Manual'</span> di atas
                          untuk memulai pencatatan tagihan pertama atau gunakan fitur impor.
                        </p>
                        <div className="flex items-center gap-space-sm">
                          <button
                            onClick={() => setIsNewInvoiceOpen(true)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-brand-crimson text-on-primary font-body-tabular-bold text-caption hover:bg-brand-crimson-hover shadow-sm transition-all cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">add</span>
                            <span>Input Tagihan Sekarang</span>
                          </button>
                          <button
                            onClick={onLoadSample}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded bg-surface-container text-on-surface font-body-tabular-bold text-caption hover:bg-surface-container-high transition-all cursor-pointer border border-surface-border/50"
                          >
                            <span className="material-symbols-outlined text-[16px]">database</span>
                            <span>Muat Contoh Riwayat Tonasa</span>
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => {
                    const aging = calculateAgingDays(inv.dueDate);
                    let statusBadge = (
                      <span className="px-2.5 py-0.5 rounded-full text-label-badge font-label-badge bg-status-due-bg text-status-due-text whitespace-nowrap">
                        Lancar
                      </span>
                    );
                    let agingBadge = <span className="text-caption text-secondary font-body-tabular">-</span>;

                    if (inv.balance <= 0) {
                      statusBadge = (
                        <span className="px-2.5 py-0.5 rounded-full text-label-badge font-label-badge bg-status-current-bg text-status-current-text whitespace-nowrap">
                          Lunas
                        </span>
                      );
                    } else if (inv.status === 'promise') {
                      statusBadge = (
                        <span className="px-2.5 py-0.5 rounded-full text-label-badge font-label-badge bg-status-promise-bg text-status-promise-text whitespace-nowrap font-bold">
                          Janji Bayar
                        </span>
                      );
                    } else if (aging > 0) {
                      statusBadge = (
                        <span className="px-2.5 py-0.5 rounded-full text-label-badge font-label-badge bg-status-overdue-bg text-status-overdue-text whitespace-nowrap font-bold">
                          Overdue
                        </span>
                      );
                    }

                    if (inv.balance > 0) {
                      if (aging <= 0) {
                        agingBadge = (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-status-current-bg text-status-current-text">
                            {Math.abs(aging)} Hari Lagi
                          </span>
                        );
                      } else if (aging <= 30) {
                        agingBadge = (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-status-due-bg text-status-due-text">
                            +{aging} Hari
                          </span>
                        );
                      } else if (aging <= 60) {
                        agingBadge = (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-status-overdue-bg text-status-overdue-text">
                            +{aging} Hari
                          </span>
                        );
                      } else {
                        agingBadge = (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-brand-crimson text-on-primary">
                            +{aging} Hari (Macet)
                          </span>
                        );
                      }
                    }

                    return (
                      <tr key={inv.id} className="hover:bg-surface-subtle transition-colors group">
                        <td className="px-space-md py-3 font-body-tabular-bold text-caption text-brand-crimson whitespace-nowrap">
                          <div className="flex flex-col">
                            <span>{inv.no}</span>
                            {inv.spk && <span className="text-[11px] text-secondary font-body-tabular">{inv.spk}</span>}
                          </div>
                        </td>
                        <td className="px-space-md py-3 text-caption font-body-tabular-bold text-on-surface">
                          <div>{inv.customer}</div>
                          {inv.followUpNote && (
                            <div className="text-[11px] text-secondary font-body-tabular truncate max-w-xs mt-0.5">
                              <span className="text-status-promise-text font-bold">FU:</span> {inv.followUpNote}
                            </div>
                          )}
                        </td>
                        <td className="px-space-md py-3 text-caption font-body-tabular text-secondary whitespace-nowrap font-mono">
                          {inv.issueDate}
                        </td>
                        <td className="px-space-md py-3 text-caption font-body-tabular text-on-surface whitespace-nowrap font-medium font-mono">
                          {inv.dueDate}
                        </td>
                        <td className="px-space-md py-3 text-caption font-body-tabular-bold text-right text-on-surface whitespace-nowrap font-mono">
                          {formatIDR(inv.amount)}
                        </td>
                        <td className="px-space-md py-3 text-caption font-body-tabular text-right text-secondary whitespace-nowrap font-mono">
                          {formatIDR(inv.paid)}
                        </td>
                        <td
                          className={`px-space-md py-3 text-caption font-body-tabular-bold text-right whitespace-nowrap font-mono ${
                            inv.balance > 0 ? 'text-brand-crimson' : 'text-status-current-text'
                          }`}
                        >
                          {formatIDR(inv.balance)}
                        </td>
                        <td className="px-space-md py-3 text-center whitespace-nowrap">{statusBadge}</td>
                        <td className="px-space-md py-3 text-center whitespace-nowrap">{agingBadge}</td>
                        <td className="px-space-md py-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenFollowUp(inv)}
                              title="Catat Tindak Lanjut &amp; Janji Bayar"
                              className="p-1.5 rounded hover:bg-surface-container text-secondary hover:text-brand-crimson transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[18px]">phone_in_talk</span>
                            </button>
                            <button
                              onClick={() => handleQuickPayment(inv)}
                              title="Catat Pelunasan Langsung"
                              className="p-1.5 rounded hover:bg-surface-container text-secondary hover:text-status-current-text transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[18px]">payments</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer Status Summary Bar */}
          <div className="p-space-md bg-surface-subtle flex flex-col sm:flex-row items-center justify-between gap-space-sm border-t border-surface-border">
            <div className="flex items-center gap-2 text-caption font-body-tabular text-secondary">
              <span>
                Menampilkan <strong className="text-on-surface font-body-tabular-bold">{filteredInvoices.length}</strong> dari{' '}
                <strong className="text-on-surface font-body-tabular-bold">{invoices.length}</strong> faktur aktif
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                className="px-2.5 py-1 text-caption rounded bg-surface-canvas text-secondary hover:text-on-surface disabled:opacity-40 cursor-not-allowed border border-surface-border"
                disabled
              >
                Sebelumnya
              </button>
              <span className="px-2.5 py-1 text-caption font-body-tabular-bold bg-brand-crimson text-on-primary rounded">
                1
              </span>
              <button
                className="px-2.5 py-1 text-caption rounded bg-surface-canvas text-secondary hover:text-on-surface disabled:opacity-40 cursor-not-allowed border border-surface-border"
                disabled
              >
                Berikutnya
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal 1: Form Input Tagihan Manual Baru */}
      {isNewInvoiceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-surface-canvas rounded-xl shadow-xl max-w-2xl w-full overflow-hidden flex flex-col border border-surface-border animate-in fade-in zoom-in-95 duration-150">
            <div className="h-1.5 w-full bg-brand-crimson"></div>
            <div className="px-space-lg py-space-md flex items-center justify-between bg-surface-subtle border-b border-surface-border">
              <div className="flex items-center gap-space-sm">
                <div className="w-8 h-8 rounded bg-brand-crimson-subtle flex items-center justify-center text-brand-crimson">
                  <span className="material-symbols-outlined text-[20px]">post_add</span>
                </div>
                <div>
                  <h3 className="font-headline-corporate text-title-md font-bold text-on-surface">
                    Input Faktur &amp; Piutang Baru
                  </h3>
                  <p className="font-caption text-caption text-secondary">
                    Pencatatan langsung tagihan operasional Semen Tonasa / Pelanggan Distribusi
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsNewInvoiceOpen(false)}
                className="text-secondary hover:text-on-surface p-1 rounded-md cursor-pointer"
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveNewInvoice} className="p-space-lg overflow-y-auto space-y-space-md">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                <div>
                  <label className="block font-label-badge text-caption uppercase text-secondary mb-1">
                    Nomor Invoice / Faktur <span className="text-brand-crimson">*</span>
                  </label>
                  <input
                    value={inpNo}
                    onChange={(e) => setInpNo(e.target.value)}
                    className="w-full h-10 px-3 text-caption font-body-tabular bg-surface-subtle focus:bg-surface-canvas rounded-lg outline-none border border-surface-border focus:border-brand-crimson text-on-surface"
                    placeholder="Contoh: INV-BKR-2026-0941"
                    required
                    type="text"
                  />
                </div>
                <div>
                  <label className="block font-label-badge text-caption uppercase text-secondary mb-1">
                    Kode SPK / Delivery Order
                  </label>
                  <input
                    value={inpSpk}
                    onChange={(e) => setInpSpk(e.target.value)}
                    className="w-full h-10 px-3 text-caption font-body-tabular bg-surface-subtle focus:bg-surface-canvas rounded-lg outline-none border border-surface-border focus:border-brand-crimson text-on-surface"
                    placeholder="Contoh: DO-TONASA-8821"
                    type="text"
                  />
                </div>
              </div>

              <div>
                <label className="block font-label-badge text-caption uppercase text-secondary mb-1">
                  Nama Mitra / Pelanggan <span className="text-brand-crimson">*</span>
                </label>
                <input
                  value={inpCustomer}
                  onChange={(e) => setInpCustomer(e.target.value)}
                  className="w-full h-10 px-3 text-caption font-body-tabular bg-surface-subtle focus:bg-surface-canvas rounded-lg outline-none border border-surface-border focus:border-brand-crimson text-on-surface"
                  placeholder="PT Mega Konstruksi Nusantara"
                  required
                  type="text"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                <div>
                  <label className="block font-label-badge text-caption uppercase text-secondary mb-1">
                    Tanggal Terbit Faktur <span className="text-brand-crimson">*</span>
                  </label>
                  <input
                    value={inpIssueDate}
                    onChange={(e) => setInpIssueDate(e.target.value)}
                    className="w-full h-10 px-3 text-caption font-body-tabular bg-surface-subtle focus:bg-surface-canvas rounded-lg outline-none border border-surface-border focus:border-brand-crimson text-on-surface"
                    required
                    type="date"
                  />
                </div>
                <div>
                  <label className="block font-label-badge text-caption uppercase text-secondary mb-1">
                    Tanggal Jatuh Tempo <span className="text-brand-crimson">*</span>
                  </label>
                  <input
                    value={inpDueDate}
                    onChange={(e) => setInpDueDate(e.target.value)}
                    className="w-full h-10 px-3 text-caption font-body-tabular bg-surface-subtle focus:bg-surface-canvas rounded-lg outline-none border border-surface-border focus:border-brand-crimson text-on-surface"
                    required
                    type="date"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                <div>
                  <label className="block font-label-badge text-caption uppercase text-secondary mb-1">
                    Total Nilai Tagihan (IDR) <span className="text-brand-crimson">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-caption font-body-tabular-bold text-secondary">
                      Rp
                    </span>
                    <input
                      value={inpAmount}
                      onChange={(e) => setInpAmount(e.target.value)}
                      className="w-full h-10 pl-10 pr-3 text-caption font-body-tabular bg-surface-subtle focus:bg-surface-canvas rounded-lg outline-none border border-surface-border focus:border-brand-crimson text-on-surface"
                      min="1000"
                      placeholder="150000000"
                      required
                      type="number"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-label-badge text-caption uppercase text-secondary mb-1">
                    Jumlah Terbayar Awal (DP/Cicilan)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-caption font-body-tabular-bold text-secondary">
                      Rp
                    </span>
                    <input
                      value={inpPaid}
                      onChange={(e) => setInpPaid(e.target.value)}
                      className="w-full h-10 pl-10 pr-3 text-caption font-body-tabular bg-surface-subtle focus:bg-surface-canvas rounded-lg outline-none border border-surface-border focus:border-brand-crimson text-on-surface"
                      min="0"
                      type="number"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-label-badge text-caption uppercase text-secondary mb-1">
                  Catatan Dokumen / Unit Kerja
                </label>
                <textarea
                  value={inpNotes}
                  onChange={(e) => setInpNotes(e.target.value)}
                  className="w-full p-3 text-caption font-body-tabular bg-surface-subtle focus:bg-surface-canvas rounded-lg outline-none border border-surface-border focus:border-brand-crimson text-on-surface"
                  placeholder="Distribusi semen curah sak tipe PCC proyek pelabuhan..."
                  rows={2}
                />
              </div>

              <div className="pt-space-md flex items-center justify-end gap-space-sm border-t border-surface-border">
                <button
                  onClick={() => setIsNewInvoiceOpen(false)}
                  className="px-4 py-2 rounded-lg bg-surface-subtle hover:bg-surface-container text-on-surface font-body-tabular-bold text-caption transition-colors cursor-pointer border border-surface-border"
                  type="button"
                >
                  Batal
                </button>
                <button
                  className="px-5 py-2 rounded-lg bg-brand-crimson hover:bg-brand-crimson-hover text-on-primary font-body-tabular-bold text-caption shadow-sm transition-colors cursor-pointer"
                  type="submit"
                >
                  Simpan Faktur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Catat Tindak Lanjut & Janji Bayar */}
      {isFollowUpOpen && targetInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-surface-canvas rounded-xl shadow-xl max-w-xl w-full overflow-hidden flex flex-col border border-surface-border animate-in fade-in zoom-in-95 duration-150">
            <div className="h-1.5 w-full bg-brand-crimson"></div>
            <div className="px-space-lg py-space-md flex items-center justify-between bg-surface-subtle border-b border-surface-border">
              <div className="flex items-center gap-space-sm">
                <div className="w-8 h-8 rounded bg-status-promise-bg flex items-center justify-center text-status-promise-text">
                  <span className="material-symbols-outlined text-[20px]">support_agent</span>
                </div>
                <div>
                  <h3 className="font-headline-corporate text-title-md font-bold text-on-surface">
                    Pencatatan Tindak Lanjut &amp; Janji Bayar
                  </h3>
                  <p className="font-caption text-caption text-secondary">
                    Target: {targetInvoice.no} - {targetInvoice.customer} (Sisa: {formatIDR(targetInvoice.balance)})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFollowUpOpen(false)}
                className="text-secondary hover:text-on-surface p-1 rounded-md cursor-pointer"
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveFollowUp} className="p-space-lg overflow-y-auto space-y-space-md">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                <div>
                  <label className="block font-label-badge text-caption uppercase text-secondary mb-1">
                    Kanal Komunikasi <span className="text-brand-crimson">*</span>
                  </label>
                  <select
                    value={fuChannel}
                    onChange={(e) => setFuChannel(e.target.value)}
                    className="w-full h-10 px-3 text-caption font-body-tabular-bold bg-surface-subtle focus:bg-surface-canvas rounded-lg outline-none border border-surface-border focus:border-brand-crimson text-on-surface cursor-pointer"
                    required
                  >
                    <option value="Telepon Langsung">Telepon Langsung (PIC Keuangan)</option>
                    <option value="Kunjungan Lapangan">Kunjungan Lapangan / Kolektor</option>
                    <option value="WhatsApp Resmi">WhatsApp Resmi Finansial</option>
                    <option value="Surat Teguran Somasi">Surat Peringatan (SP1/SP2)</option>
                    <option value="Email Formal">Email Formal Tonasa</option>
                  </select>
                </div>
                <div>
                  <label className="block font-label-badge text-caption uppercase text-secondary mb-1">
                    Tanggal Interaksi <span className="text-brand-crimson">*</span>
                  </label>
                  <input
                    value={fuContactDate}
                    onChange={(e) => setFuContactDate(e.target.value)}
                    className="w-full h-10 px-3 text-caption font-body-tabular bg-surface-subtle focus:bg-surface-canvas rounded-lg outline-none border border-surface-border focus:border-brand-crimson text-on-surface"
                    required
                    type="date"
                  />
                </div>
              </div>

              <div>
                <label className="block font-label-badge text-caption uppercase text-secondary mb-1">
                  Nama &amp; Jabatan Kontak Pelanggan <span className="text-brand-crimson">*</span>
                </label>
                <input
                  value={fuPicName}
                  onChange={(e) => setFuPicName(e.target.value)}
                  className="w-full h-10 px-3 text-caption font-body-tabular bg-surface-subtle focus:bg-surface-canvas rounded-lg outline-none border border-surface-border focus:border-brand-crimson text-on-surface"
                  placeholder="Bpk. Rahmat (Manajer Keuangan)"
                  required
                  type="text"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                <div>
                  <label className="block font-label-badge text-caption uppercase text-secondary mb-1">
                    Nominal Komitmen Bayar (IDR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-caption font-body-tabular-bold text-secondary">
                      Rp
                    </span>
                    <input
                      value={fuPromiseAmount}
                      onChange={(e) => setFuPromiseAmount(e.target.value)}
                      className="w-full h-10 pl-10 pr-3 text-caption font-body-tabular bg-surface-subtle focus:bg-surface-canvas rounded-lg outline-none border border-surface-border focus:border-brand-crimson text-on-surface"
                      placeholder="Nominal yang dijanjikan"
                      type="number"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-label-badge text-caption uppercase text-secondary mb-1">
                    Tanggal Janji Realisasi
                  </label>
                  <input
                    value={fuPromiseDate}
                    onChange={(e) => setFuPromiseDate(e.target.value)}
                    className="w-full h-10 px-3 text-caption font-body-tabular bg-surface-subtle focus:bg-surface-canvas rounded-lg outline-none border border-surface-border focus:border-brand-crimson text-on-surface"
                    type="date"
                  />
                </div>
              </div>

              <div>
                <label className="block font-label-badge text-caption uppercase text-secondary mb-1">
                  Ringkasan Hasil Pembicaraan <span className="text-brand-crimson">*</span>
                </label>
                <textarea
                  value={fuSummary}
                  onChange={(e) => setFuSummary(e.target.value)}
                  className="w-full p-3 text-caption font-body-tabular bg-surface-subtle focus:bg-surface-canvas rounded-lg outline-none border border-surface-border focus:border-brand-crimson text-on-surface"
                  placeholder="Pelanggan menjelaskan kendala pencairan termin Pemda; berkomitmen transfer pelunasan 50% di tanggal janji..."
                  required
                  rows={3}
                />
              </div>

              <div>
                <label className="block font-label-badge text-caption uppercase text-secondary mb-1">
                  Tindakan Berikutnya (Next Action)
                </label>
                <input
                  value={fuNextStep}
                  onChange={(e) => setFuNextStep(e.target.value)}
                  className="w-full h-10 px-3 text-caption font-body-tabular bg-surface-subtle focus:bg-surface-canvas rounded-lg outline-none border border-surface-border focus:border-brand-crimson text-on-surface"
                  placeholder="Konfirmasi bukti potong giro / follow up reminder H-1"
                  type="text"
                />
              </div>

              <div className="pt-space-md flex items-center justify-end gap-space-sm border-t border-surface-border">
                <button
                  onClick={() => setIsFollowUpOpen(false)}
                  className="px-4 py-2 rounded-lg bg-surface-subtle hover:bg-surface-container text-on-surface font-body-tabular-bold text-caption transition-colors cursor-pointer border border-surface-border"
                  type="button"
                >
                  Batal
                </button>
                <button
                  className="px-5 py-2 rounded-lg bg-brand-crimson hover:bg-brand-crimson-hover text-on-primary font-body-tabular-bold text-caption shadow-sm transition-colors cursor-pointer"
                  type="submit"
                >
                  Simpan Catatan Penagihan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
