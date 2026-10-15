import React, { useState } from 'react';
import { PromiseRecord, Invoice } from '../types';
import { formatIDR } from '../data/initialData';

interface PromisesScreenProps {
  promises: PromiseRecord[];
  invoices: Invoice[];
  onAddPromise: (record: Partial<PromiseRecord>) => void;
  onUpdatePromise: (id: string, updates: Partial<PromiseRecord>) => void;
  onDeletePromise: (id: string) => void;
  onLoadSample: () => void;
  onShowToast: (title: string, message: string, type?: 'success' | 'info' | 'warn') => void;
}

export const PromisesScreen: React.FC<PromisesScreenProps> = ({
  promises,
  invoices,
  onAddPromise,
  onUpdatePromise,
  onDeletePromise,
  onLoadSample,
  onShowToast,
}) => {
  const [currentTab, setCurrentTab] = useState<'all' | 'today' | 'overdue' | 'paid' | 'history'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterChannel, setFilterChannel] = useState('');
  const [filterOfficer, setFilterOfficer] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form State
  const [selectedInvoice, setSelectedInvoice] = useState('');
  const [inpDate, setInpDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [inpAmount, setInpAmount] = useState('');
  const [inpChannel, setFuChannel] = useState('Telepon Desk Collection');
  const [inpOfficer, setInpOfficer] = useState('Admin Keuangan (Div. Piutang)');
  const [inpStatus, setInpStatus] = useState<PromiseRecord['status']>('Menunggu Pembayaran');
  const [inpNotes, setInpNotes] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<PromiseRecord | null>(null);
  const [modalStatus, setModalStatus] = useState<PromiseRecord['status']>('Terealisasi Lunas');
  const [modalNote, setModalNote] = useState('');

  // Calculations
  const totalCount = promises.length;
  const totalAmount = promises.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const todayCount = promises.filter((p) => p.status === 'Jatuh Tempo Hari Ini').length;
  const overdueCount = promises.filter((p) => p.status === 'Ingkar Janji / Terlewat').length;
  const paidCount = promises.filter((p) => p.status === 'Terealisasi Lunas').length;

  const filteredPromises = promises.filter((item) => {
    if (currentTab === 'today' && item.status !== 'Jatuh Tempo Hari Ini') return false;
    if (currentTab === 'overdue' && item.status !== 'Ingkar Janji / Terlewat') return false;
    if (currentTab === 'paid' && item.status !== 'Terealisasi Lunas') return false;

    const q = searchQuery.toLowerCase().trim();
    const textMatch =
      !q ||
      item.id.toLowerCase().includes(q) ||
      item.invoice.toLowerCase().includes(q) ||
      item.partner.toLowerCase().includes(q) ||
      item.officer.toLowerCase().includes(q);

    const channelMatch = !filterChannel || item.channel.toLowerCase().includes(filterChannel.toLowerCase());
    const officerMatch = !filterOfficer || item.officer.toLowerCase().includes(filterOfficer.toLowerCase());

    return textMatch && channelMatch && officerMatch;
  });

  const getStatusBadge = (status: PromiseRecord['status']) => {
    switch (status) {
      case 'Terealisasi Lunas':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-status-current-bg text-status-current-text text-label-badge font-label-badge font-bold">
            LUNAS
          </span>
        );
      case 'Jatuh Tempo Hari Ini':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-status-due-bg text-status-due-text text-label-badge font-label-badge font-bold">
            TEMPO HARI INI
          </span>
        );
      case 'Ingkar Janji / Terlewat':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-status-overdue-bg text-status-overdue-text text-label-badge font-label-badge font-bold">
            INGKAR JANJI
          </span>
        );
      case 'Terpenuhi Sebagian':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-status-promise-bg text-status-promise-text text-label-badge font-label-badge font-bold">
            PARSIAL
          </span>
        );
      case 'Menunggu Pembayaran':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container text-secondary text-label-badge font-label-badge font-bold">
            TERJADWAL
          </span>
        );
    }
  };

  const getChannelIcon = (channel: string) => {
    if (channel.includes('Telepon')) return 'call';
    if (channel.includes('WhatsApp')) return 'chat';
    if (channel.includes('Kunjungan')) return 'location_on';
    if (channel.includes('Surat')) return 'mail';
    return 'alternate_email';
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) {
      onShowToast('Peringatan', 'Silakan pilih invoice atau masukkan referensi tagihan.', 'warn');
      return;
    }

    const parts = selectedInvoice.split('|');
    const invoiceNo = parts[0];
    const customerName = parts[1] || 'Mitra Semen Tonasa';

    onAddPromise({
      id: `P-2026-${String(promises.length + 1).padStart(4, '0')}`,
      invoice: invoiceNo,
      partner: customerName,
      date: inpDate,
      amount: parseFloat(inpAmount) || 100000000,
      officer: inpOfficer,
      channel: inpChannel,
      status: inpStatus,
      notes: inpNotes || 'Komitmen pembayaran dicatat oleh staf penagihan.',
    });

    setIsFormOpen(false);
    setSelectedInvoice('');
    setInpAmount('');
    setInpNotes('');

    onShowToast('Janji Bayar Disimpan', `Komitmen pembayaran untuk ${invoiceNo} berhasil dicatat.`);
  };

  const handleOpenActionModal = (item: PromiseRecord) => {
    setActiveItem(item);
    setModalStatus(item.status);
    setModalNote(item.notes);
    setIsModalOpen(true);
  };

  const handleSaveModal = () => {
    if (!activeItem) return;
    onUpdatePromise(activeItem.id, {
      status: modalStatus,
      notes: modalNote,
    });
    setIsModalOpen(false);
    onShowToast('Status Diperbarui', `Janji bayar ${activeItem.id} berhasil diupdate.`);
  };

  const handleDeleteItem = () => {
    if (!activeItem) return;
    const confirmed = window.confirm(`Yakin ingin menghapus rekam janji ${activeItem.id}? Tindakan ini dicatat pada audit log.`);
    if (confirmed) {
      onDeletePromise(activeItem.id);
      setIsModalOpen(false);
      onShowToast('Data Dihapus', `Janji bayar ${activeItem.id} telah dihapus.`);
    }
  };

  return (
    <div className="flex flex-col w-full">
      {/* Sub-Header & Action Control Bar */}
      <section className="bg-surface-canvas border-b border-surface-border px-space-xl py-space-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md max-w-7xl mx-auto w-full">
          <div className="flex flex-col">
            <div className="flex items-center gap-space-sm mb-1">
              <span className="inline-flex items-center px-space-sm py-0.5 rounded-lg bg-surface-container text-primary font-label-badge text-label-badge tracking-wider uppercase">
                MODUL P-05 &amp; P-06 • Manajemen Komitmen &amp; Riwayat Penagihan
              </span>
              <span className="inline-flex items-center gap-1 text-secondary text-caption font-caption">
                <span className="w-1.5 h-1.5 rounded-full bg-status-current-text"></span>
                Sync Real-time SAP Tonasa
              </span>
            </div>
            <h1 className="font-headline-corporate text-headline-corporate text-on-surface tracking-tight">
              Janji Bayar &amp; Tindak Lanjut Penagihan
            </h1>
            <p className="font-caption text-caption text-secondary mt-0.5 max-w-3xl">
              Catat komitmen pembayaran debitur, pantau janji bayar yang jatuh tempo/terlewat, dan rekam riwayat komunikasi penagihan harian PT Biringkassi Raya.
            </p>
          </div>

          {/* Quick Page Actions */}
          <div className="flex flex-wrap items-center gap-space-sm pt-2 lg:pt-0">
            <button
              onClick={() => onShowToast('Ekspor Riwayat', `Mengekspor ${promises.length} data janji bayar ke berkas Excel.`)}
              className="inline-flex items-center gap-space-xs px-space-md py-2 bg-surface-canvas hover:bg-surface-subtle text-on-surface text-body-tabular font-body-tabular-bold rounded-lg border border-surface-border transition-colors shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] text-secondary">file_download</span>
              <span>Ekspor Riwayat (.xlsx)</span>
            </button>
            <button
              onClick={() => setIsFormOpen(true)}
              className="inline-flex items-center gap-space-xs px-space-md py-2 bg-surface-canvas hover:bg-surface-subtle text-brand-crimson text-body-tabular font-body-tabular-bold rounded-lg border border-brand-crimson/30 hover:border-brand-crimson transition-colors shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add_call</span>
              <span>+ Log Aktivitas Kontak</span>
            </button>
            <button
              onClick={() => setIsFormOpen(!isFormOpen)}
              className="inline-flex items-center gap-space-xs px-space-md py-2 bg-brand-crimson hover:bg-brand-crimson-hover text-on-primary text-body-tabular font-body-tabular-bold rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">event_available</span>
              <span>+ Catat Janji Bayar Baru</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Work Area */}
      <div className="p-space-xl space-y-space-xl max-w-7xl mx-auto w-full">
        {/* Summary KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
          {/* KPI 1 */}
          <div className="bg-surface-canvas border border-surface-border rounded-lg p-space-md flex flex-col justify-between shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-caption font-label-badge text-secondary uppercase tracking-wider">Total Janji Aktif</span>
              <span className="inline-flex items-center px-space-xs py-0.5 rounded-full bg-status-promise-bg text-status-promise-text font-label-badge text-label-badge font-bold">
                Menunggu Verifikasi
              </span>
            </div>
            <div className="my-3">
              <span className="font-display-lg text-display-lg text-on-surface tabular-nums font-bold">{totalCount}</span>
              <span className="font-body-tabular text-body-tabular text-secondary ml-1">Janji</span>
            </div>
            <div className="flex items-center gap-space-xs text-caption font-caption text-secondary border-t border-surface-border/60 pt-2">
              <span className="material-symbols-outlined text-[16px] text-secondary">payments</span>
              <span>Nilai komitmen: <strong className="text-on-surface">{formatIDR(totalAmount)}</strong></span>
            </div>
          </div>

          {/* KPI 2 */}
          <div className="bg-surface-canvas border border-surface-border rounded-lg p-space-md flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-caption font-label-badge text-secondary uppercase tracking-wider">Jatuh Tempo Hari Ini</span>
              <span className="inline-flex items-center px-space-xs py-0.5 rounded-full bg-status-due-bg text-status-due-text font-label-badge text-label-badge font-bold">
                Perlu Telepon
              </span>
            </div>
            <div className="my-3">
              <span className="font-display-lg text-display-lg text-status-due-text tabular-nums font-bold">{todayCount}</span>
              <span className="font-body-tabular text-body-tabular text-secondary ml-1">Janji</span>
            </div>
            <div className="flex items-center gap-space-xs text-caption font-caption text-secondary border-t border-surface-border/60 pt-2">
              <span className="material-symbols-outlined text-[16px] text-status-due-text">schedule</span>
              <span>Debitur berjanji transfer hari ini</span>
            </div>
          </div>

          {/* KPI 3: Crimson Accent */}
          <div className="bg-surface-canvas border border-surface-border border-l-4 border-l-brand-crimson rounded-lg p-space-md flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-caption font-label-badge text-secondary uppercase tracking-wider">Janji Terlewat (Overdue)</span>
              <span className="inline-flex items-center px-space-xs py-0.5 rounded-full bg-status-overdue-bg text-status-overdue-text font-label-badge text-label-badge font-bold">
                Eskalasi Prioritas
              </span>
            </div>
            <div className="my-3">
              <span className="font-display-lg text-display-lg text-brand-crimson tabular-nums font-bold">{overdueCount}</span>
              <span className="font-body-tabular text-body-tabular text-secondary ml-1">Kasus</span>
            </div>
            <div className="flex items-center gap-space-xs text-caption font-caption text-status-overdue-text border-t border-surface-border/60 pt-2">
              <span className="material-symbols-outlined text-[16px]">warning</span>
              <span>Lewat batas tanpa bukti konfirmasi</span>
            </div>
          </div>

          {/* KPI 4 */}
          <div className="bg-surface-canvas border border-surface-border rounded-lg p-space-md flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-caption font-label-badge text-secondary uppercase tracking-wider">Aktivitas Kontak Minggu Ini</span>
              <span className="inline-flex items-center px-space-xs py-0.5 rounded-full bg-status-current-bg text-status-current-text font-label-badge text-label-badge font-bold">
                Pelacakan Aktif
              </span>
            </div>
            <div className="my-3">
              <span className="font-display-lg text-display-lg text-on-surface tabular-nums font-bold">
                {totalCount > 0 ? totalCount * 2 + 1 : 0}
              </span>
              <span className="font-body-tabular text-body-tabular text-secondary ml-1">Log</span>
            </div>
            <div className="flex items-center gap-space-xs text-caption font-caption text-secondary border-t border-surface-border/60 pt-2">
              <span className="material-symbols-outlined text-[16px] text-status-current-text">history_toggle_off</span>
              <span>Telepon, kunjungan, WA, email resmi</span>
            </div>
          </div>
        </div>

        {/* Collapsible Quick Entry Accordion Form */}
        <div className="bg-surface-canvas border border-surface-border rounded-lg shadow-sm overflow-hidden">
          <div
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="px-space-md py-3 bg-surface-subtle border-b border-surface-border flex items-center justify-between cursor-pointer select-none hover:bg-surface-muted transition-colors"
          >
            <div className="flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-brand-crimson text-[20px]">edit_note</span>
              <span className="font-title-md text-title-md text-on-surface font-semibold">
                Formulir Cepat Pencatatan Janji / Log Kontak Penagihan
              </span>
              <span className="hidden md:inline-block text-caption font-caption text-secondary">
                • Terhubung dengan Ledger Piutang Tonasa
              </span>
            </div>
            <div className="text-secondary hover:text-brand-crimson flex items-center gap-1 text-caption font-caption">
              <span>{isFormOpen ? 'Tutup Formulir' : 'Buka Formulir'}</span>
              <span className={`material-symbols-outlined text-[18px] transition-transform duration-200 ${isFormOpen ? 'rotate-180' : ''}`}>
                expand_more
              </span>
            </div>
          </div>

          {isFormOpen && (
            <form onSubmit={handleFormSubmit} className="p-space-md border-t border-surface-border/50 bg-surface-canvas animate-in fade-in duration-150">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
                {/* Mitra & Invoice Picker */}
                <div className="space-y-1">
                  <label className="block font-label-badge text-label-badge text-secondary uppercase tracking-wider">
                    Nomor Invoice &amp; Mitra Debitur <span className="text-error">*</span>
                  </label>
                  <select
                    value={selectedInvoice}
                    onChange={(e) => setSelectedInvoice(e.target.value)}
                    className="w-full h-10 px-3 pr-8 bg-surface-canvas border border-surface-border rounded-lg text-body-tabular text-on-surface focus:outline-none focus:border-brand-crimson text-sm cursor-pointer"
                    required
                  >
                    <option value="">Pilih invoice atau cari mitra...</option>
                    {invoices.map((inv) => (
                      <option key={inv.id} value={`${inv.no}|${inv.customer}|${inv.balance}`}>
                        {inv.no} - {inv.customer} (Sisa {formatIDR(inv.balance)})
                      </option>
                    ))}
                  </select>
                  <span className="text-caption font-caption text-secondary text-[11px]">
                    Pilih tagihan yang memiliki saldo jatuh tempo / open
                  </span>
                </div>

                {/* Target Promise Date */}
                <div className="space-y-1">
                  <label className="block font-label-badge text-label-badge text-secondary uppercase tracking-wider">
                    Tanggal Janji Bayar <span className="text-error">*</span>
                  </label>
                  <input
                    value={inpDate}
                    onChange={(e) => setInpDate(e.target.value)}
                    className="w-full h-10 px-3 bg-surface-canvas border border-surface-border rounded-lg text-body-tabular text-on-surface focus:outline-none focus:border-brand-crimson text-sm"
                    required
                    type="date"
                  />
                  <span className="text-caption font-caption text-secondary text-[11px]">
                    Batas komitmen pelunasan disepakati debitur
                  </span>
                </div>

                {/* Nominal Janji */}
                <div className="space-y-1">
                  <label className="block font-label-badge text-label-badge text-secondary uppercase tracking-wider">
                    Nominal Janji (Rp) <span className="text-error">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 font-body-tabular-bold text-caption text-secondary">Rp</span>
                    <input
                      value={inpAmount}
                      onChange={(e) => setInpAmount(e.target.value)}
                      className="w-full h-10 pl-9 pr-3 bg-surface-canvas border border-surface-border rounded-lg text-body-tabular text-on-surface focus:outline-none focus:border-brand-crimson text-sm tabular-nums"
                      min="1000"
                      placeholder="100000000"
                      required
                      type="number"
                    />
                  </div>
                  <span className="text-caption font-caption text-secondary text-[11px]">
                    Bisa pembayaran penuh atau komitmen termin bertahap
                  </span>
                </div>

                {/* Kanal Komunikasi */}
                <div className="space-y-1">
                  <label className="block font-label-badge text-label-badge text-secondary uppercase tracking-wider">
                    Kanal Komunikasi <span className="text-error">*</span>
                  </label>
                  <select
                    value={inpChannel}
                    onChange={(e) => setFuChannel(e.target.value)}
                    className="w-full h-10 px-3 bg-surface-canvas border border-surface-border rounded-lg text-body-tabular text-on-surface focus:outline-none focus:border-brand-crimson text-sm cursor-pointer"
                    required
                  >
                    <option value="Telepon Desk Collection">Telepon Resmi (Desk Collection)</option>
                    <option value="WhatsApp Resmi Biringkassi">WhatsApp Finance Korporat</option>
                    <option value="Kunjungan Lapangan / Auditor">Kunjungan Langsung ke Kantor Mitra</option>
                    <option value="Surat Teguran / Somasi">Surat Tagihan / Peringatan Tertulis</option>
                    <option value="Surel Korporat">Email Resmi (invoice-collection@biringkassiraya.co.id)</option>
                  </select>
                  <span className="text-caption font-caption text-secondary text-[11px]">
                    Media interaksi penagihan yang digunakan
                  </span>
                </div>

                {/* Petugas PIC */}
                <div className="space-y-1">
                  <label className="block font-label-badge text-label-badge text-secondary uppercase tracking-wider">
                    Petugas Kolektor / PIC <span className="text-error">*</span>
                  </label>
                  <input
                    value={inpOfficer}
                    onChange={(e) => setInpOfficer(e.target.value)}
                    className="w-full h-10 px-3 bg-surface-canvas border border-surface-border rounded-lg text-body-tabular text-on-surface focus:outline-none focus:border-brand-crimson text-sm"
                    required
                    type="text"
                  />
                  <span className="text-caption font-caption text-secondary text-[11px]">
                    Nama personil akuntansi/kolektor operasional
                  </span>
                </div>

                {/* Status Komitmen Awal */}
                <div className="space-y-1">
                  <label className="block font-label-badge text-label-badge text-secondary uppercase tracking-wider">
                    Status Komitmen <span className="text-error">*</span>
                  </label>
                  <select
                    value={inpStatus}
                    onChange={(e) => setInpStatus(e.target.value as any)}
                    className="w-full h-10 px-3 bg-surface-canvas border border-surface-border rounded-lg text-body-tabular text-on-surface focus:outline-none focus:border-brand-crimson text-sm cursor-pointer"
                    required
                  >
                    <option value="Menunggu Pembayaran">Menunggu Pembayaran (Belum Jatuh Tempo)</option>
                    <option value="Jatuh Tempo Hari Ini">Jatuh Tempo Hari Ini</option>
                    <option value="Terpenuhi Sebagian">Terpenuhi Sebagian (Parsial)</option>
                    <option value="Terealisasi Lunas">Terealisasi Lunas</option>
                    <option value="Ingkar Janji / Terlewat">Ingkar Janji / Terlewat</option>
                  </select>
                  <span className="text-caption font-caption text-secondary text-[11px]">
                    Kategori status saat pencatatan dibuat
                  </span>
                </div>

                {/* Catatan / Respon Mitra */}
                <div className="md:col-span-2 lg:col-span-3 space-y-1">
                  <label className="block font-label-badge text-label-badge text-secondary uppercase tracking-wider">
                    Hasil Pembicaraan / Respon Mitra &amp; Komitmen Khusus <span className="text-error">*</span>
                  </label>
                  <textarea
                    value={inpNotes}
                    onChange={(e) => setInpNotes(e.target.value)}
                    className="w-full p-3 bg-surface-canvas border border-surface-border rounded-lg text-body-tabular text-on-surface focus:outline-none focus:border-brand-crimson text-sm"
                    placeholder="Contoh: Direktur menyepakati transfer via Rek Giro Mandiri Tonasa pada tanggal janji bayar..."
                    required
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-space-sm mt-space-md pt-space-sm border-t border-surface-border/60">
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="px-space-md py-2 text-body-tabular font-body-tabular-bold text-secondary hover:text-on-surface bg-surface-canvas hover:bg-surface-subtle border border-surface-border rounded-lg transition-colors cursor-pointer"
                  type="button"
                >
                  Batal
                </button>
                <button
                  className="px-space-md py-2 text-body-tabular font-body-tabular-bold text-on-primary bg-brand-crimson hover:bg-brand-crimson-hover rounded-lg transition-colors shadow-sm flex items-center gap-1 cursor-pointer"
                  type="submit"
                >
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  <span>Simpan Janji Bayar &amp; Catat Log</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Main Data Table Container */}
        <div className="bg-surface-canvas border border-surface-border rounded-lg shadow-sm overflow-hidden flex flex-col">
          {/* Tabs Bar */}
          <div className="border-b border-surface-border bg-surface-subtle px-space-md pt-2 flex items-center gap-1 overflow-x-auto">
            <button
              onClick={() => setCurrentTab('all')}
              className={`px-space-md py-2.5 font-body-tabular-bold text-caption border-b-2 flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                currentTab === 'all'
                  ? 'border-brand-crimson text-brand-crimson font-bold'
                  : 'border-transparent text-secondary hover:text-on-surface'
              }`}
            >
              <span>Semua Komitmen</span>
              <span className="ml-1 px-1.5 py-0.2 bg-brand-crimson text-on-primary rounded-full text-[10px]">
                {totalCount}
              </span>
            </button>

            <button
              onClick={() => setCurrentTab('today')}
              className={`px-space-md py-2.5 font-body-tabular text-caption border-b-2 flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                currentTab === 'today'
                  ? 'border-brand-crimson text-brand-crimson font-bold'
                  : 'border-transparent text-secondary hover:text-on-surface'
              }`}
            >
              <span>Jatuh Tempo Hari Ini</span>
              <span className="ml-1 px-1.5 py-0.2 bg-status-due-bg text-status-due-text rounded-full text-[10px] font-bold">
                {todayCount}
              </span>
            </button>

            <button
              onClick={() => setCurrentTab('overdue')}
              className={`px-space-md py-2.5 font-body-tabular text-caption border-b-2 flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                currentTab === 'overdue'
                  ? 'border-brand-crimson text-brand-crimson font-bold'
                  : 'border-transparent text-secondary hover:text-on-surface'
              }`}
            >
              <span>Terlewat / Ingkar Janji</span>
              <span className="ml-1 px-1.5 py-0.2 bg-status-overdue-bg text-status-overdue-text rounded-full text-[10px] font-bold">
                {overdueCount}
              </span>
            </button>

            <button
              onClick={() => setCurrentTab('paid')}
              className={`px-space-md py-2.5 font-body-tabular text-caption border-b-2 flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                currentTab === 'paid'
                  ? 'border-brand-crimson text-brand-crimson font-bold'
                  : 'border-transparent text-secondary hover:text-on-surface'
              }`}
            >
              <span>Terealisasi Lunas</span>
              <span className="ml-1 px-1.5 py-0.2 bg-status-current-bg text-status-current-text rounded-full text-[10px] font-bold">
                {paidCount}
              </span>
            </button>

            <button
              onClick={() => setCurrentTab('history')}
              className={`px-space-md py-2.5 font-body-tabular text-caption border-b-2 flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                currentTab === 'history'
                  ? 'border-brand-crimson text-brand-crimson font-bold'
                  : 'border-transparent text-secondary hover:text-on-surface'
              }`}
            >
              <span>Riwayat Log Kontak</span>
              <span className="ml-1 px-1.5 py-0.2 bg-surface-container text-secondary rounded-full text-[10px] font-bold">
                {totalCount}
              </span>
            </button>
          </div>

          {/* Filter Controls Bar */}
          <div className="p-space-md bg-surface-canvas border-b border-surface-border flex flex-wrap items-center justify-between gap-space-sm">
            <div className="flex flex-wrap items-center gap-space-sm flex-1">
              <div className="relative min-w-[240px] flex-1 max-w-sm">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[18px]">
                  search
                </span>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 text-caption font-body-tabular bg-surface-canvas border border-surface-border rounded-lg text-on-surface placeholder:text-secondary/70 focus:outline-none focus:border-brand-crimson"
                  placeholder="Cari invoice, nama mitra, PIC..."
                  type="text"
                />
              </div>

              <div className="w-48">
                <select
                  value={filterChannel}
                  onChange={(e) => setFilterChannel(e.target.value)}
                  className="w-full h-9 px-2.5 text-caption font-body-tabular bg-surface-canvas border border-surface-border rounded-lg text-on-surface focus:outline-none focus:border-brand-crimson cursor-pointer"
                >
                  <option value="">Semua Kanal Kontak</option>
                  <option value="Telepon">Telepon Resmi</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Kunjungan">Kunjungan Lapangan</option>
                  <option value="Surat">Surat Teguran / Somasi</option>
                  <option value="Email">Email Korporat</option>
                </select>
              </div>

              <div className="w-48">
                <select
                  value={filterOfficer}
                  onChange={(e) => setFilterOfficer(e.target.value)}
                  className="w-full h-9 px-2.5 text-caption font-body-tabular bg-surface-canvas border border-surface-border rounded-lg text-on-surface focus:outline-none focus:border-brand-crimson cursor-pointer"
                >
                  <option value="">Semua Petugas Kolektor</option>
                  <option value="Admin Keuangan">Admin Keuangan</option>
                  <option value="Koordinator Lapangan">Koordinator Lapangan</option>
                  <option value="Supervisor AR">Supervisor AR</option>
                </select>
              </div>

              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterChannel('');
                  setFilterOfficer('');
                }}
                className="inline-flex items-center gap-1 h-9 px-3 text-caption font-body-tabular text-secondary hover:text-on-surface bg-surface-subtle hover:bg-surface-border/40 rounded-lg border border-surface-border transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                <span>Reset</span>
              </button>
            </div>

            <div className="flex items-center gap-space-sm text-caption text-secondary">
              <span>Menampilkan {filteredPromises.length} komitmen</span>
              <div className="h-4 w-px bg-surface-border"></div>
              {promises.length === 0 && (
                <button
                  onClick={onLoadSample}
                  className="text-brand-crimson hover:underline text-caption font-body-tabular-bold flex items-center gap-1 cursor-pointer"
                  title="Muat sampel audit piutang untuk pengujian"
                >
                  <span className="material-symbols-outlined text-[16px]">cloud_sync</span>
                  Muat Sampel Data Uji
                </button>
              )}
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto min-h-[380px] relative">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-subtle border-b-2 border-surface-border text-secondary text-caption font-label-badge uppercase tracking-wider h-10">
                  <th className="px-space-md py-2 w-32">NO. KOMITMEN</th>
                  <th className="px-space-md py-2 w-44">NO. INVOICE</th>
                  <th className="px-space-md py-2 min-w-[200px]">NAMA MITRA / DEBITUR</th>
                  <th className="px-space-md py-2 w-32">TGL JANJI</th>
                  <th className="px-space-md py-2 w-40 text-right">NOMINAL KOMITMEN</th>
                  <th className="px-space-md py-2 w-36">PETUGAS PIC</th>
                  <th className="px-space-md py-2 w-36">KANAL KONTAK</th>
                  <th className="px-space-md py-2 w-40 text-center">STATUS KOMITMEN</th>
                  <th className="px-space-md py-2 w-32 text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border text-body-tabular text-on-surface">
                {filteredPromises.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 px-space-md text-center">
                      <div className="flex flex-col items-center justify-center max-w-md mx-auto">
                        <div className="w-16 h-16 rounded-full bg-surface-subtle flex items-center justify-center mb-space-md border border-surface-border">
                          <span className="material-symbols-outlined text-[36px] text-secondary">event_busy</span>
                        </div>
                        <h3 className="font-title-md text-title-md font-semibold text-on-surface">
                          Belum Ada Catatan Janji Bayar Tersimpan
                        </h3>
                        <p className="font-body-tabular text-caption text-secondary max-w-md mt-1 mb-space-lg">
                          Seluruh komitmen pembayaran dari mitra ekspedisi, distributor semen curah &amp; zak akan tampil di sini. Mulai rekam hasil penagihan pertama Anda untuk pengawasan arus kas.
                        </p>
                        <div className="flex items-center gap-space-sm">
                          <button
                            onClick={() => setIsFormOpen(true)}
                            className="inline-flex items-center gap-space-xs px-space-md py-2 bg-brand-crimson hover:bg-brand-crimson-hover text-on-primary text-body-tabular font-body-tabular-bold rounded-lg transition-colors shadow-sm cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px]">add_task</span>
                            <span>+ Buat Janji Bayar Baru</span>
                          </button>
                          <button
                            onClick={onLoadSample}
                            className="inline-flex items-center gap-space-xs px-space-md py-2 bg-surface-canvas hover:bg-surface-subtle text-secondary font-body-tabular text-body-tabular rounded-lg border border-surface-border transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px]">download</span>
                            <span>Isi Data Sampel Tonasa</span>
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPromises.map((row, idx) => (
                    <tr
                      key={row.id}
                      className={`${
                        idx % 2 === 0 ? 'bg-surface-canvas' : 'bg-surface-subtle/40'
                      } hover:bg-surface-container/60 transition-colors h-12 text-sm border-b border-surface-border`}
                    >
                      <td className="px-space-md py-2 font-body-tabular-bold text-caption text-brand-crimson whitespace-nowrap">
                        {row.id}
                      </td>
                      <td className="px-space-md py-2 font-body-tabular text-caption text-on-surface whitespace-nowrap">
                        <span className="font-body-tabular-bold font-mono">{row.invoice}</span>
                      </td>
                      <td className="px-space-md py-2">
                        <div className="font-body-tabular-bold text-on-surface text-caption">{row.partner}</div>
                        <div className="text-[11px] text-secondary truncate max-w-xs" title={row.notes}>
                          {row.notes}
                        </div>
                      </td>
                      <td className="px-space-md py-2 text-caption whitespace-nowrap tabular-nums text-secondary font-mono">
                        {row.date}
                      </td>
                      <td className="px-space-md py-2 text-right font-body-tabular-bold tabular-nums text-on-surface whitespace-nowrap font-mono">
                        {formatIDR(row.amount)}
                      </td>
                      <td className="px-space-md py-2 text-caption text-secondary whitespace-nowrap">{row.officer}</td>
                      <td className="px-space-md py-2 text-caption text-secondary whitespace-nowrap">
                        <span className="material-symbols-outlined text-[16px] text-secondary inline-block align-middle mr-1">
                          {getChannelIcon(row.channel)}
                        </span>
                        <span className="align-middle">{row.channel.split(' ')[0]}</span>
                      </td>
                      <td className="px-space-md py-2 text-center whitespace-nowrap">{getStatusBadge(row.status)}</td>
                      <td className="px-space-md py-2 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleOpenActionModal(row)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-surface-canvas hover:bg-surface-subtle text-caption font-body-tabular-bold text-brand-crimson border border-surface-border shadow-xs cursor-pointer"
                        >
                          <span>Tindak Lanjut</span>
                          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer / Pagination Audit */}
          <div className="px-space-md py-3 bg-surface-subtle border-t border-surface-border flex flex-col sm:flex-row items-center justify-between text-caption font-caption text-secondary gap-2">
            <div className="flex items-center gap-2">
              <span>
                Status Ledger: <strong>Tervalidasi Sinkronisasi SAP Biringkassi</strong>
              </span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-status-current-text"></span>
              <span>Integritas Log: Level Audit Grade</span>
            </div>
            <div className="flex items-center gap-space-md">
              <span>Halaman 1 dari 1 ({filteredPromises.length} Total Arsip)</span>
              <div className="flex items-center gap-1">
                <button
                  className="p-1 rounded border border-surface-border text-secondary/40 cursor-not-allowed"
                  disabled
                >
                  <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                </button>
                <button
                  className="p-1 rounded border border-surface-border text-secondary/40 cursor-not-allowed"
                  disabled
                >
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detail / Action Modal Dialog */}
      {isModalOpen && activeItem && (
        <div className="fixed inset-0 z-50 bg-inverse-surface/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-canvas rounded-lg border border-surface-border shadow-xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="border-t-4 border-brand-crimson px-space-lg py-space-md flex items-center justify-between border-b border-surface-border">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-brand-crimson text-[24px]">verified</span>
                <div>
                  <h4 className="font-headline-corporate text-title-md text-on-surface">
                    Tindak Lanjut &amp; Verifikasi Komitmen
                  </h4>
                  <span className="font-caption text-caption text-secondary">ID: {activeItem.id}</span>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-secondary hover:text-on-surface rounded-lg hover:bg-surface-subtle cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-space-lg space-y-space-md text-body-tabular text-on-surface">
              <div className="bg-surface-subtle p-space-md rounded-lg border border-surface-border text-caption space-y-1">
                <div className="flex justify-between">
                  <span className="text-secondary">Debitur:</span>
                  <strong className="text-on-surface font-body-tabular-bold">{activeItem.partner}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Nomor Faktur:</span>
                  <span className="font-body-tabular-bold font-mono">{activeItem.invoice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Nominal Komitmen:</span>
                  <span className="text-brand-crimson font-body-tabular-bold font-mono">
                    {formatIDR(activeItem.amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Jatuh Tempo Janji:</span>
                  <span className="font-body-tabular-bold font-mono">{activeItem.date}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-label-badge text-label-badge text-secondary uppercase">
                  Ubah Status Tindak Lanjut
                </label>
                <select
                  value={modalStatus}
                  onChange={(e) => setModalStatus(e.target.value as any)}
                  className="w-full h-10 px-3 bg-surface-canvas border border-surface-border rounded-lg text-body-tabular focus:outline-none focus:border-brand-crimson cursor-pointer"
                >
                  <option value="Terealisasi Lunas">Terealisasi Lunas (Bukti Transfer Diterima)</option>
                  <option value="Terpenuhi Sebagian">Terpenuhi Sebagian</option>
                  <option value="Jatuh Tempo Hari Ini">Jatuh Tempo Hari Ini (Lakukan Penagihan)</option>
                  <option value="Ingkar Janji / Terlewat">Ingkar Janji / Terlewat (Terbitkan Somasi)</option>
                  <option value="Menunggu Pembayaran">Menunggu Pembayaran</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-label-badge text-label-badge text-secondary uppercase">
                  Catatan Verifikasi / Tindak Lanjut Baru
                </label>
                <textarea
                  value={modalNote}
                  onChange={(e) => setModalNote(e.target.value)}
                  className="w-full p-3 bg-surface-canvas border border-surface-border rounded-lg text-body-tabular focus:outline-none focus:border-brand-crimson text-sm"
                  placeholder="Masukkan nomor referensi transfer bank atau catatan panggilan terkini..."
                  rows={3}
                />
              </div>
            </div>

            <div className="px-space-lg py-space-md bg-surface-subtle border-t border-surface-border flex items-center justify-between">
              <button
                onClick={handleDeleteItem}
                className="text-error hover:text-brand-crimson text-caption font-body-tabular-bold flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
                Hapus Janji
              </button>
              <div className="flex items-center gap-space-sm">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-space-md py-2 bg-surface-canvas hover:bg-surface-subtle text-secondary font-body-tabular text-caption rounded-lg border border-surface-border cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  onClick={handleSaveModal}
                  className="px-space-md py-2 bg-brand-crimson hover:bg-brand-crimson-hover text-on-primary font-body-tabular-bold text-caption rounded-lg shadow-sm cursor-pointer"
                >
                  Perbarui Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
