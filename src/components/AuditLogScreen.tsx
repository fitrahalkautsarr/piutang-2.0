import React, { useState } from 'react';
import { AuditLog } from '../types';

interface AuditLogScreenProps {
  logs: AuditLog[];
  onAddLog: (newLog: Partial<AuditLog>) => void;
  onLoadSample: () => void;
  onShowToast: (title: string, message: string, type?: 'success' | 'info' | 'warn') => void;
}

export const AuditLogScreen: React.FC<AuditLogScreenProps> = ({
  logs,
  onAddLog,
  onLoadSample,
  onShowToast,
}) => {
  const [currentTab, setCurrentTab] = useState<'all' | 'receivable' | 'files' | 'auth' | 'system'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [filterUser, setFilterUser] = useState('all');

  // Modals
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [activePayload, setActivePayload] = useState<any | null>(null);

  // Manual Form
  const [modalModul, setModalModul] = useState('Operasional Piutang');
  const [modalLevel, setModalLevel] = useState<'INFO' | 'PERINGATAN' | 'KRITIS'>('INFO');
  const [modalAction, setModalAction] = useState('');
  const [modalRef, setModalRef] = useState('');
  const [modalNotes, setModalNotes] = useState('');

  // Counts
  const countAll = logs.length;
  const countReceivable = logs.filter((i) => i.module === 'Operasional Piutang').length;
  const countFiles = logs.filter((i) => i.module === 'Impor & Ekspor Berkas').length;
  const countAuth = logs.filter((i) => i.module === 'Keamanan & Sesi Login').length + 1; // includes active session
  const countSystem = logs.filter((i) => i.module === 'Integritas Sistem').length;

  // Filtered Logs
  const filteredLogs = logs.filter((item) => {
    // Tab filter
    if (currentTab === 'receivable' && item.module !== 'Operasional Piutang') return false;
    if (currentTab === 'files' && item.module !== 'Impor & Ekspor Berkas') return false;
    if (currentTab === 'auth' && item.module !== 'Keamanan & Sesi Login') return false;
    if (currentTab === 'system' && item.module !== 'Integritas Sistem') return false;

    // Type filter
    if (filterType === 'auth' && !item.module.includes('Keamanan')) return false;
    if ((filterType === 'import' || filterType === 'export') && !item.module.includes('Berkas')) return false;
    if (filterType === 'promise' && !item.action.includes('Janji Bayar')) return false;

    // Level filter
    if (filterLevel === 'info' && item.level !== 'INFO') return false;
    if (filterLevel === 'warn' && item.level !== 'PERINGATAN') return false;
    if (filterLevel === 'crit' && item.level !== 'KRITIS') return false;

    // Search query
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const match =
        item.action.toLowerCase().includes(q) ||
        item.user.toLowerCase().includes(q) ||
        item.object.toLowerCase().includes(q) ||
        item.ip.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  const getLevelBadge = (level: AuditLog['level']) => {
    if (level === 'KRITIS') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-label-badge bg-status-severe-bg text-status-severe-text font-bold">
          KRITIS
        </span>
      );
    }
    if (level === 'PERINGATAN') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-label-badge bg-status-due-bg text-status-due-text font-bold">
          PERINGATAN
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-label-badge bg-status-current-bg text-status-current-text font-bold">
        INFO
      </span>
    );
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    const formattedDate = `${now.getDate()} Okt 2026 ${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    onAddLog({
      id: `AUD-MANUAL-${Date.now().toString().slice(-6)}`,
      timestamp: formattedDate,
      user: 'karyawan@biringkassiraya.co.id',
      role: 'Staf Piutang',
      module: modalModul,
      action: modalAction,
      object: modalRef || 'Manual Audit Entry',
      ip: '10.24.12.80',
      agent: 'Chrome / Manual Input Form',
      level: modalLevel,
      status: 'Tercatat Resmi',
      payload: {
        catatan: modalNotes,
        recorded_by: 'karyawan@biringkassiraya.co.id',
        verified: true,
      },
    });

    setIsManualModalOpen(false);
    setModalAction('');
    setModalRef('');
    setModalNotes('');
    onShowToast('Audit Tersimpan', 'Catatan audit manual berhasil diverifikasi dan disimpan ke blockchain ledger.');
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `AUDIT_LOG_BIRINGKASSI_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    onShowToast('Ekspor Log', 'Berkas log audit forensik JSON berhasil diunduh.');
  };

  return (
    <div className="flex flex-col w-full">
      <div className="p-margin flex flex-col space-y-space-lg max-w-7xl mx-auto w-full">
        {/* Section 1: Header Halaman & Action Bar */}
        <div className="bg-surface-canvas rounded-xl shadow-sm p-space-lg flex flex-col lg:flex-row lg:items-center justify-between gap-space-lg relative overflow-hidden border border-surface-border">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand-crimson"></div>
          <div className="flex flex-col space-y-space-xs pl-space-xs min-w-0">
            <div className="flex flex-wrap items-center gap-space-sm">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-brand-crimson-subtle text-brand-crimson font-label-badge text-label-badge uppercase tracking-wider">
                <span className="material-symbols-outlined text-[14px]">verified</span>
                MODUL P-09 • AUDIT TRAIL, SECURITY &amp; COMPLIANCE
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-status-current-bg text-status-current-text font-caption text-caption font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-status-current-text animate-pulse"></span>
                Sistem Audit Terenkripsi SHA-256
              </span>
            </div>

            <h1 className="font-headline-corporate text-display-lg text-on-surface tracking-tight leading-tight mt-1">
              Log Aktivitas &amp; Jejak Audit Sistem
            </h1>
            <p className="font-body-tabular text-body-tabular text-secondary max-w-4xl">
              Rekam jejak seluruh mutasi data piutang, proses impor berkas, ekspor laporan finansial, perubahan janji bayar, dan autentikasi login karyawan PT Biringkassi Raya.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-space-sm shrink-0">
            <button
              onClick={handleExportJson}
              className="inline-flex items-center gap-2 px-space-md py-2 rounded-lg bg-surface-subtle hover:bg-surface-muted text-on-surface text-body-tabular-bold font-body-tabular-bold transition-all shadow-sm cursor-pointer border border-surface-border"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px] text-secondary">download</span>
              <span>Unduh Log (.csv / .json)</span>
            </button>
            <button
              onClick={() => {
                setFilterLevel('crit');
                onShowToast('Filter Keamanan', 'Menampilkan event audit prioritas kritis dan peringatan integritas.');
              }}
              className="inline-flex items-center gap-2 px-space-md py-2 rounded-lg bg-secondary-container hover:bg-surface-dim text-on-surface font-body-tabular-bold text-body-tabular-bold transition-all shadow-sm cursor-pointer border border-surface-border/50"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px] text-brand-crimson">shield_lock</span>
              <span>Filter Keamanan &amp; Anomali</span>
            </button>
            <button
              onClick={() => setIsManualModalOpen(true)}
              className="inline-flex items-center gap-2 px-space-md py-2 rounded-lg bg-brand-crimson hover:bg-brand-crimson-hover text-on-primary font-body-tabular-bold text-body-tabular-bold shadow transition-all cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>+ Buat Catatan Audit Manual</span>
            </button>
          </div>
        </div>

        {/* Section 2: Ringkasan Kartu Metrik Audit */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
          <div className="bg-surface-canvas rounded-xl p-space-md shadow-sm relative flex flex-col justify-between overflow-hidden border border-surface-border">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="font-label-badge text-caption uppercase tracking-wider text-secondary">
                  Total Event Hari Ini
                </span>
                <span className="font-display-lg text-display-lg text-on-surface mt-1 font-bold">
                  {logs.length} Event
                </span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-surface-subtle flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-[20px]">history_toggle_off</span>
              </div>
            </div>
            <div className="mt-space-md flex items-center gap-1.5 text-caption font-caption text-secondary border-t border-surface-border/60 pt-2">
              <span className="w-2 h-2 rounded-full bg-status-current-text inline-block"></span>
              <span>Sinkronisasi real-time aktif</span>
            </div>
          </div>

          <div className="bg-surface-canvas rounded-xl p-space-md shadow-sm relative flex flex-col justify-between overflow-hidden border border-surface-border">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="font-label-badge text-caption uppercase tracking-wider text-secondary">
                  Log Impor &amp; Ekspor
                </span>
                <span className="font-display-lg text-display-lg text-on-surface mt-1 font-bold">
                  {countFiles} Aktivitas
                </span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-surface-subtle flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-[20px]">sync_alt</span>
              </div>
            </div>
            <div className="mt-space-md flex items-center gap-1.5 text-caption font-caption text-secondary border-t border-surface-border/60 pt-2">
              <span className="material-symbols-outlined text-[14px]">folder_off</span>
              <span>{countFiles > 0 ? `${countFiles} Berkas Terarsip` : 'Belum ada transaksi berkas'}</span>
            </div>
          </div>

          <div className="bg-surface-canvas rounded-xl p-space-md shadow-sm relative flex flex-col justify-between overflow-hidden border border-surface-border">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="font-label-badge text-caption uppercase tracking-wider text-secondary">
                  Perubahan Data Piutang
                </span>
                <span className="font-display-lg text-display-lg text-on-surface mt-1 font-bold">
                  {countReceivable} Modifikasi
                </span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-surface-subtle flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-[20px]">edit_calendar</span>
              </div>
            </div>
            <div className="mt-space-md flex items-center gap-1.5 text-caption font-caption text-secondary border-t border-surface-border/60 pt-2">
              <span className="material-symbols-outlined text-[14px] text-status-current-text">verified</span>
              <span>Pencatatan mutasi aman</span>
            </div>
          </div>

          <div className="bg-surface-canvas rounded-xl p-space-md shadow-sm relative flex flex-col justify-between overflow-hidden border border-surface-border">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-crimson"></div>
            <div className="flex items-start justify-between pl-1">
              <div className="flex flex-col">
                <span className="font-label-badge text-caption uppercase tracking-wider text-secondary">
                  Akses &amp; Sesi Firebase
                </span>
                <span className="font-display-lg text-display-lg text-brand-crimson mt-1 font-bold">
                  1 Sesi Aktif
                </span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-brand-crimson-subtle flex items-center justify-center text-brand-crimson">
                <span className="material-symbols-outlined text-[20px]">key</span>
              </div>
            </div>
            <div className="mt-space-md pl-1 flex flex-col text-caption font-caption text-secondary truncate border-t border-surface-border/60 pt-2">
              <span className="font-body-tabular-bold text-on-surface truncate">karyawan@biringkassiraya.co.id</span>
              <span className="text-[11px] text-secondary truncate font-mono">IP Terdeteksi: 10.24.12.80 (VLAN Finance)</span>
            </div>
          </div>
        </div>

        {/* Section 3: Filter & Forensics */}
        <div className="bg-surface-canvas rounded-xl p-space-md shadow-sm flex flex-col space-y-space-md border border-surface-border">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-space-sm pb-space-xs border-b border-surface-border">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-brand-crimson text-[20px]">filter_alt</span>
              <span className="font-body-tabular-bold text-title-md text-on-surface">Parameter Pencarian &amp; Filter Forensik</span>
            </div>
            <span className="text-caption font-caption text-secondary">Rentang Waktu: Waktu Indonesia Tengah (WITA, UTC+8)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-space-sm items-end">
            <div className="lg:col-span-4 flex flex-col space-y-1">
              <label className="font-label-numeric text-caption text-secondary" htmlFor="search-log">Pencarian Komprehensif</label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-secondary text-[18px]">search</span>
                <input
                  id="search-log"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 rounded-lg bg-surface-subtle font-body-tabular text-body-tabular text-on-surface placeholder:text-secondary focus:bg-surface-canvas focus:outline-none border border-surface-border transition-all shadow-inner"
                  placeholder="Cari nama staf, nomor invoice, IP address, atau aksi..."
                  type="text"
                />
              </div>
            </div>

            <div className="lg:col-span-2 flex flex-col space-y-1">
              <label className="font-label-numeric text-caption text-secondary">Tipe Aktivitas</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-surface-subtle font-body-tabular text-body-tabular text-on-surface border border-surface-border focus:bg-surface-canvas focus:outline-none transition-all cursor-pointer"
              >
                <option value="all">Semua Aktivitas</option>
                <option value="auth">Autentikasi / Login</option>
                <option value="import">Impor Data SAP</option>
                <option value="promise">Janji Bayar</option>
                <option value="aging">Modifikasi Status Piutang</option>
              </select>
            </div>

            <div className="lg:col-span-2 flex flex-col space-y-1">
              <label className="font-label-numeric text-caption text-secondary">Level Urgensi</label>
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-surface-subtle font-body-tabular text-body-tabular text-on-surface border border-surface-border focus:bg-surface-canvas focus:outline-none transition-all cursor-pointer"
              >
                <option value="all">Semua Level</option>
                <option value="info">INFO (Normal)</option>
                <option value="warn">PERINGATAN (Warning)</option>
                <option value="crit">KRITIS (Security/Error)</option>
              </select>
            </div>

            <div className="lg:col-span-2 flex flex-col space-y-1">
              <label className="font-label-numeric text-caption text-secondary">Tanggal Cut-off</label>
              <input
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-surface-subtle font-body-tabular text-body-tabular text-on-surface border border-surface-border focus:bg-surface-canvas focus:outline-none transition-all"
                type="date"
              />
            </div>

            <div className="lg:col-span-2 flex flex-col space-y-1">
              <label className="font-label-numeric text-caption text-secondary">Petugas / PIC</label>
              <select
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-surface-subtle font-body-tabular text-body-tabular text-on-surface border border-surface-border focus:bg-surface-canvas focus:outline-none transition-all cursor-pointer"
              >
                <option value="all">Semua Staf Piutang</option>
                <option value="karyawan">Karyawan Keuangan (PIC 1)</option>
                <option value="admin">Admin Sistem (ERP Bridge)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-space-sm pt-space-xs">
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterType('all');
                setFilterLevel('all');
                setFilterDate('');
                setFilterUser('all');
                onShowToast('Filter Direset', 'Semua parameter pencarian audit log dikembalikan.', 'info');
              }}
              className="px-space-md py-1.5 rounded-lg bg-surface-subtle hover:bg-surface-muted text-secondary font-body-tabular-bold text-caption transition-all cursor-pointer border border-surface-border"
              type="button"
            >
              Reset Filter
            </button>
            <button
              onClick={() => onShowToast('Filter Diterapkan', `Menampilkan ${filteredLogs.length} hasil audit.`)}
              className="px-space-md py-1.5 rounded-lg bg-brand-crimson hover:bg-brand-crimson-hover text-on-primary font-body-tabular-bold text-caption shadow transition-all flex items-center gap-1.5 cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">tune</span>
              Terapkan Filter
            </button>
          </div>
        </div>

        {/* Section 4 & 5: Tabs & Table */}
        <div className="bg-surface-canvas rounded-xl shadow-sm flex flex-col overflow-hidden border border-surface-border">
          {/* Tabs */}
          <div className="flex items-center overflow-x-auto bg-surface-subtle px-space-md pt-space-xs gap-1 border-b border-surface-border">
            <button
              onClick={() => setCurrentTab('all')}
              className={`px-space-md py-2.5 rounded-t-lg font-body-tabular-bold text-body-tabular flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                currentTab === 'all'
                  ? 'bg-surface-canvas text-brand-crimson shadow-sm border-t border-x border-surface-border'
                  : 'text-secondary hover:text-on-surface'
              }`}
              type="button"
            >
              <span>Semua Aktivitas</span>
              <span className="px-1.5 py-0.5 rounded-full bg-brand-crimson-subtle text-brand-crimson font-label-badge text-[11px]">
                {countAll}
              </span>
            </button>

            <button
              onClick={() => setCurrentTab('receivable')}
              className={`px-space-md py-2.5 rounded-t-lg font-body-tabular text-body-tabular flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                currentTab === 'receivable'
                  ? 'bg-surface-canvas text-brand-crimson shadow-sm border-t border-x border-surface-border font-bold'
                  : 'text-secondary hover:text-on-surface'
              }`}
              type="button"
            >
              <span>Operasional Piutang</span>
              <span className="px-1.5 py-0.5 rounded-full bg-surface-muted text-secondary font-label-badge text-[11px]">
                {countReceivable}
              </span>
            </button>

            <button
              onClick={() => setCurrentTab('files')}
              className={`px-space-md py-2.5 rounded-t-lg font-body-tabular text-body-tabular flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                currentTab === 'files'
                  ? 'bg-surface-canvas text-brand-crimson shadow-sm border-t border-x border-surface-border font-bold'
                  : 'text-secondary hover:text-on-surface'
              }`}
              type="button"
            >
              <span>Impor &amp; Ekspor Berkas</span>
              <span className="px-1.5 py-0.5 rounded-full bg-surface-muted text-secondary font-label-badge text-[11px]">
                {countFiles}
              </span>
            </button>

            <button
              onClick={() => setCurrentTab('auth')}
              className={`px-space-md py-2.5 rounded-t-lg font-body-tabular text-body-tabular flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                currentTab === 'auth'
                  ? 'bg-surface-canvas text-brand-crimson shadow-sm border-t border-x border-surface-border font-bold'
                  : 'text-secondary hover:text-on-surface'
              }`}
              type="button"
            >
              <span>Keamanan &amp; Sesi Login</span>
              <span className="px-1.5 py-0.5 rounded-full bg-status-current-bg text-status-current-text font-label-badge text-[11px]">
                {countAuth}
              </span>
            </button>

            <button
              onClick={() => setCurrentTab('system')}
              className={`px-space-md py-2.5 rounded-t-lg font-body-tabular text-body-tabular flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                currentTab === 'system'
                  ? 'bg-surface-canvas text-brand-crimson shadow-sm border-t border-x border-surface-border font-bold'
                  : 'text-secondary hover:text-on-surface'
              }`}
              type="button"
            >
              <span>Integritas Sistem</span>
              <span className="px-1.5 py-0.5 rounded-full bg-surface-muted text-secondary font-label-badge text-[11px]">
                {countSystem}
              </span>
            </button>
          </div>

          {/* Table */}
          <div className="w-full overflow-x-auto min-h-[360px]">
            <table className="w-full text-left font-body-tabular text-body-tabular whitespace-nowrap border-collapse">
              <thead className="bg-surface-subtle text-secondary font-label-numeric text-[12px] uppercase tracking-wider border-b border-surface-border">
                <tr>
                  <th className="py-3 px-space-md">Waktu &amp; Timestamp (WITA)</th>
                  <th className="py-3 px-space-md">User / PIC</th>
                  <th className="py-3 px-space-md">Modul Sistem</th>
                  <th className="py-3 px-space-md">Tindakan / Aksi</th>
                  <th className="py-3 px-space-md">Objek &amp; Referensi</th>
                  <th className="py-3 px-space-md">Alamat IP &amp; Perangkat</th>
                  <th className="py-3 px-space-md">Status / Hasil</th>
                  <th className="py-3 px-space-md text-right">Detail &amp; Payload</th>
                </tr>
              </thead>
              <tbody className="bg-surface-canvas divide-y divide-surface-border">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 px-space-lg text-center bg-surface-canvas">
                      <div className="flex flex-col items-center justify-center max-w-xl mx-auto">
                        <div className="relative w-20 h-20 rounded-2xl bg-surface-subtle flex items-center justify-center mb-space-md text-brand-crimson shadow-sm border border-surface-border">
                          <span className="material-symbols-outlined text-[40px]">manage_search</span>
                          <div className="absolute -right-1 -top-1 w-6 h-6 rounded-full bg-status-current-bg text-status-current-text flex items-center justify-center">
                            <span className="material-symbols-outlined text-[14px]">check</span>
                          </div>
                        </div>
                        <h3 className="font-headline-corporate text-headline-corporate text-on-surface tracking-tight">
                          Belum Ada Catatan Riwayat Audit Terbaru
                        </h3>
                        <p className="font-body-tabular text-body-tabular text-secondary max-w-xl mt-space-xs leading-relaxed">
                          Seluruh aktivitas penting staf piutang, mutasi berkas, dan sesi login akan otomatis dicatat secara kronologis untuk keperluan audit kepatuhan internal PT Biringkassi Raya &amp; Semen Tonasa.
                        </p>
                        <div className="mt-space-lg flex flex-wrap items-center justify-center gap-space-sm">
                          <button
                            onClick={onLoadSample}
                            className="inline-flex items-center gap-2 px-space-md py-2 rounded-lg bg-brand-crimson text-on-primary hover:bg-brand-crimson-hover font-body-tabular-bold text-body-tabular shadow transition-all cursor-pointer"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[18px]">play_circle</span>
                            <span>Muat Contoh Log Simulasi</span>
                          </button>
                          <button
                            onClick={() => onShowToast('Segarkan Riwayat', 'Log riwayat telah disinkronkan dengan database audit.')}
                            className="inline-flex items-center gap-2 px-space-md py-2 rounded-lg bg-surface-subtle text-on-surface hover:bg-surface-muted font-body-tabular text-body-tabular transition-all cursor-pointer border border-surface-border"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[18px] text-secondary">refresh</span>
                            <span>Segarkan Riwayat</span>
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-surface-subtle transition-colors h-12 text-sm">
                      <td className="py-3 px-space-md">
                        <div className="flex flex-col">
                          <span className="font-body-tabular-bold text-on-surface">{item.timestamp}</span>
                          <span className="text-caption text-secondary font-mono text-[11px]">{item.id}</span>
                        </div>
                      </td>
                      <td className="py-3 px-space-md">
                        <div className="flex flex-col max-w-[200px]">
                          <span className="font-body-tabular-bold text-on-surface truncate">{item.user}</span>
                          <span className="text-caption text-secondary">{item.role}</span>
                        </div>
                      </td>
                      <td className="py-3 px-space-md">
                        <span className="font-caption text-caption text-on-surface bg-surface-subtle px-2 py-1 rounded border border-surface-border">
                          {item.module}
                        </span>
                      </td>
                      <td className="py-3 px-space-md">
                        <div className="flex items-center gap-1.5">
                          {getLevelBadge(item.level)}
                          <span className="font-body-tabular-bold text-on-surface">{item.action}</span>
                        </div>
                      </td>
                      <td className="py-3 px-space-md">
                        <span className="font-body-tabular text-on-surface font-mono text-[12px] truncate max-w-[220px] inline-block" title={item.object}>
                          {item.object}
                        </span>
                      </td>
                      <td className="py-3 px-space-md">
                        <div className="flex flex-col">
                          <span className="font-mono text-[12px] text-on-surface">{item.ip}</span>
                          <span className="text-caption text-secondary text-[11px]">{item.agent}</span>
                        </div>
                      </td>
                      <td className="py-3 px-space-md">
                        <span className="inline-flex items-center gap-1 text-status-current-text font-body-tabular-bold text-[12px]">
                          <span className="material-symbols-outlined text-[16px]">check_circle</span>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-space-md text-right">
                        <button
                          onClick={() => setActivePayload(item)}
                          className="px-2.5 py-1 rounded bg-surface-subtle hover:bg-surface-muted text-brand-crimson font-body-tabular-bold text-caption transition-all cursor-pointer border border-surface-border/60"
                          type="button"
                        >
                          Lihat Payload
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Section 6: Footer Audit & Pagination */}
          <div className="bg-surface-subtle px-space-md py-3 flex flex-col sm:flex-row items-center justify-between gap-space-sm border-t border-surface-border">
            <div className="flex items-center gap-2 text-caption font-caption text-secondary">
              <span className="material-symbols-outlined text-[16px] text-brand-crimson">lock</span>
              <span>Standar ISO 27001 Log Retention: 365 Hari • Integritas Hash: Terverifikasi</span>
            </div>
            <div className="flex items-center gap-space-md">
              <span className="font-label-numeric text-caption text-secondary">
                Halaman 1 dari 1 ({filteredLogs.length} total riwayat)
              </span>
              <div className="inline-flex items-center gap-1">
                <button
                  className="w-8 h-8 rounded-lg bg-surface-canvas flex items-center justify-center text-secondary opacity-40 cursor-not-allowed border border-surface-border"
                  disabled
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                <button
                  className="w-8 h-8 rounded-lg bg-surface-canvas flex items-center justify-center text-secondary opacity-40 cursor-not-allowed border border-surface-border"
                  disabled
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Manual Audit Record */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-space-md backdrop-blur-sm">
          <div className="bg-surface-canvas rounded-xl max-w-xl w-full p-space-lg shadow-xl relative overflow-hidden flex flex-col space-y-space-md border border-surface-border animate-in fade-in zoom-in-95 duration-150">
            <div className="absolute left-0 top-0 right-0 h-1 bg-brand-crimson"></div>
            <div className="flex items-center justify-between pt-1 border-b border-surface-border pb-space-sm">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-brand-crimson text-[24px]">history_edu</span>
                <h2 className="font-headline-corporate text-headline-corporate text-on-surface">
                  Buat Catatan Audit Kepatuhan Manual
                </h2>
              </div>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-surface-subtle hover:bg-surface-muted text-secondary flex items-center justify-center cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <p className="font-body-tabular text-caption text-secondary">
              Entri ini akan dicatat dalam database audit resmi PT Biringkassi Raya dengan tag kredensial penandatangan aktif.
            </p>

            <form onSubmit={handleManualSubmit} className="flex flex-col space-y-space-md">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
                <div className="flex flex-col space-y-1">
                  <label className="font-label-numeric text-caption text-secondary">Kategori Modul</label>
                  <select
                    value={modalModul}
                    onChange={(e) => setModalModul(e.target.value)}
                    className="h-10 px-3 rounded-lg bg-surface-subtle font-body-tabular text-body-tabular text-on-surface border border-surface-border focus:outline-none cursor-pointer"
                    required
                  >
                    <option value="Operasional Piutang">Operasional Piutang</option>
                    <option value="Janji Bayar &amp; Rekonsiliasi">Janji Bayar &amp; Rekonsiliasi</option>
                    <option value="Master Data / Debitur">Master Data / Debitur</option>
                    <option value="Keamanan Sistem">Keamanan Sistem</option>
                  </select>
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="font-label-numeric text-caption text-secondary">Tingkat Urgensi</label>
                  <select
                    value={modalLevel}
                    onChange={(e) => setModalLevel(e.target.value as any)}
                    className="h-10 px-3 rounded-lg bg-surface-subtle font-body-tabular text-body-tabular text-on-surface border border-surface-border focus:outline-none cursor-pointer"
                    required
                  >
                    <option value="INFO">INFO (Operasional Normal)</option>
                    <option value="PERINGATAN">PERINGATAN (Discrepancy / Penundaan)</option>
                    <option value="KRITIS">KRITIS (Sengketa / Audit Eksternal)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col space-y-1">
                <label className="font-label-numeric text-caption text-secondary">Judul Tindakan / Kejadian</label>
                <input
                  value={modalAction}
                  onChange={(e) => setModalAction(e.target.value)}
                  className="h-10 px-3 rounded-lg bg-surface-subtle font-body-tabular text-body-tabular text-on-surface border border-surface-border focus:outline-none"
                  placeholder="Contoh: Verifikasi fisik jaminan bank garansi proyek Semen Tonasa IV"
                  required
                  type="text"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="font-label-numeric text-caption text-secondary">Nomor Dokumen / Invoice Referensi</label>
                <input
                  value={modalRef}
                  onChange={(e) => setModalRef(e.target.value)}
                  className="h-10 px-3 rounded-lg bg-surface-subtle font-body-tabular text-body-tabular text-on-surface border border-surface-border focus:outline-none"
                  placeholder="Contoh: INV-BR-2026-8809 / SPK-ST-4029"
                  type="text"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="font-label-numeric text-caption text-secondary">Catatan Naratif &amp; Justifikasi Audit</label>
                <textarea
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  className="p-3 rounded-lg bg-surface-subtle font-body-tabular text-body-tabular text-on-surface border border-surface-border focus:outline-none resize-none"
                  placeholder="Deskripsikan alasan atau catatan verifikasi yang dilakukan..."
                  required
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-end gap-space-sm pt-space-xs border-t border-surface-border">
                <button
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-space-md py-2 rounded-lg bg-surface-subtle text-secondary font-body-tabular-bold text-body-tabular hover:bg-surface-muted transition-all cursor-pointer border border-surface-border"
                  type="button"
                >
                  Batal
                </button>
                <button
                  className="px-space-md py-2 rounded-lg bg-brand-crimson hover:bg-brand-crimson-hover text-on-primary font-body-tabular-bold text-body-tabular shadow transition-all flex items-center gap-2 cursor-pointer"
                  type="submit"
                >
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                  <span>Simpan Jejak Audit</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Payload Modal */}
      {activePayload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-space-md backdrop-blur-sm">
          <div className="bg-surface-canvas rounded-xl max-w-lg w-full p-space-lg shadow-xl relative overflow-hidden flex flex-col space-y-space-md border border-surface-border animate-in fade-in zoom-in-95 duration-150">
            <div className="absolute left-0 top-0 right-0 h-1 bg-brand-crimson"></div>
            <div className="flex items-center justify-between border-b border-surface-border pb-space-sm">
              <div>
                <h3 className="font-headline-corporate text-headline-corporate text-on-surface">Data Payload Forensik</h3>
                <span className="font-mono text-caption text-secondary">{activePayload.id}</span>
              </div>
              <button
                onClick={() => setActivePayload(null)}
                className="w-8 h-8 rounded-lg bg-surface-subtle hover:bg-surface-muted text-secondary flex items-center justify-center cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="bg-surface-subtle p-space-md rounded-lg overflow-x-auto text-[12px] font-mono text-on-surface border border-surface-border">
              <pre>{JSON.stringify(activePayload, null, 2)}</pre>
            </div>
            <div className="flex justify-end border-t border-surface-border pt-space-sm">
              <button
                onClick={() => setActivePayload(null)}
                className="px-space-md py-1.5 rounded-lg bg-surface-subtle font-body-tabular-bold text-body-tabular text-on-surface hover:bg-surface-muted transition-all cursor-pointer border border-surface-border"
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
