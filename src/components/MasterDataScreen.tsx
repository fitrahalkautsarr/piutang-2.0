import React, { useState } from 'react';
import { CustomerMaster } from '../types';
import { formatIDR } from '../data/initialData';

interface MasterDataScreenProps {
  customers: CustomerMaster[];
  onAddCustomer: (customer: CustomerMaster) => void;
  onLoadSample: () => void;
  onShowToast: (title: string, message: string, type?: 'success' | 'info' | 'warn') => void;
}

export const MasterDataScreen: React.FC<MasterDataScreenProps> = ({
  customers,
  onAddCustomer,
  onLoadSample,
  onShowToast,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'partners' | 'users' | 'rules' | 'shipping'>('partners');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Form State
  const [entityType, setEntityType] = useState<'mitra' | 'karyawan'>('mitra');
  const [inpCode, setInpCode] = useState('');
  const [inpName, setInpName] = useState('');
  const [inpCategory, setInpCategory] = useState<CustomerMaster['category']>('Distributor Semen Zak');
  const [inpNpwp, setInpNpwp] = useState('');
  const [inpPhone, setInpPhone] = useState('');
  const [inpCreditLimit, setInpCreditLimit] = useState('');
  const [inpTop, setInpTop] = useState('TOP 30 Hari Kalender');
  const [inpAddress, setInpAddress] = useState('');
  const [inpRegion, setInpRegion] = useState('Sulawesi Selatan (Pangkep / Makassar)');

  // Calculations
  const activeCustomers = customers.filter((c) => c.status === 'Aktif');
  const totalLimit = customers.reduce((sum, c) => sum + (c.creditLimit || 0), 0);

  const filteredCustomers = customers.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (q && !c.name.toLowerCase().includes(q) && !c.code.toLowerCase().includes(q) && !c.npwp.toLowerCase().includes(q)) {
      return false;
    }
    if (filterCategory && !c.category.toLowerCase().includes(filterCategory.toLowerCase())) {
      return false;
    }
    if (filterRegion && !c.region.toLowerCase().includes(filterRegion.toLowerCase())) {
      return false;
    }
    if (filterStatus && c.status.toLowerCase() !== filterStatus.toLowerCase()) {
      return false;
    }
    return true;
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newCust: CustomerMaster = {
      code: inpCode || `BP-TN-${Math.floor(400000 + Math.random() * 90000)}`,
      name: inpName,
      category: inpCategory,
      npwp: inpNpwp || '00.000.000.0-000.000',
      phone: inpPhone || '0812-xxxx-xxxx',
      creditLimit: parseFloat(inpCreditLimit) || 1000000000,
      top: inpTop,
      address: inpAddress || 'Sulawesi Selatan',
      region: inpRegion,
      status: 'Aktif',
      pic: 'Staf Penagihan (Admin)',
    };

    onAddCustomer(newCust);
    setIsDrawerOpen(false);
    setInpName('');
    setInpCode('');
    setInpNpwp('');
    setInpPhone('');
    setInpCreditLimit('');
    setInpAddress('');

    onShowToast('Data Master Disimpan', `Mitra ${newCust.name} berhasil ditambahkan ke direktori.`);
  };

  const handleSyncSAP = () => {
    onShowToast('Sinkronisasi SAP Master', 'Menghubungkan ke SAP ERP Semen Tonasa... 0 data baru pada batch saat ini.');
  };

  return (
    <div className="flex flex-col w-full">
      {/* Sub-Header / Workspace Hero Section */}
      <section className="bg-surface-canvas px-margin py-space-lg shadow-sm border-b border-surface-border">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-space-lg max-w-7xl mx-auto w-full">
          <div className="flex flex-col gap-space-xs max-w-4xl">
            <div className="flex flex-wrap items-center gap-space-sm">
              <span className="inline-flex items-center gap-space-xs px-space-sm py-0.5 bg-brand-crimson-subtle text-brand-crimson font-label-badge text-label-badge rounded uppercase tracking-wider">
                <span className="material-symbols-outlined text-[14px]">tune</span>
                MODUL P-10 • PENGELOLAAN DATA REFERENSI &amp; AKSES
              </span>
              <span className="inline-flex items-center gap-space-xs px-space-sm py-0.5 bg-status-current-bg text-status-current-text font-label-badge text-label-badge rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-status-current-text animate-pulse"></span>
                Terhubung ke Master Directory SAP
              </span>
              <span className="font-caption text-caption text-secondary">Sync ID: SAP-BR-MM-8891</span>
            </div>
            <h1 className="font-headline-corporate text-headline-corporate text-on-surface tracking-tight mt-space-xs">
              Master Data Pelanggan &amp; Pengguna Sistem
            </h1>
            <p className="font-body-tabular text-body-tabular text-secondary leading-relaxed">
              Kelola direktori mitra bisnis/distributor semen, verifikasi profil debitur, limit plafon kredit, dan konfigurasi hak akses karyawan bagian Piutang PT Biringkassi Raya.
            </p>
          </div>

          {/* Action Button Group */}
          <div className="flex flex-wrap items-center gap-space-sm self-start xl:self-center">
            <button
              onClick={handleSyncSAP}
              className="inline-flex items-center gap-space-xs px-space-md py-space-sm bg-surface-subtle hover:bg-surface-muted text-on-surface font-body-tabular-bold text-body-tabular rounded-lg transition-all shadow-sm active:scale-95 cursor-pointer border border-surface-border"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px] text-secondary">sync</span>
              <span>Sinkronkan dengan SAP Master</span>
            </button>
            <button
              onClick={() => onShowToast('Ekspor Data', 'Mengunduh template master data pelanggan (Tonasa_Master_BR.xlsx)...')}
              className="inline-flex items-center gap-space-xs px-space-md py-space-sm bg-surface-subtle hover:bg-surface-muted text-on-surface font-body-tabular-bold text-body-tabular rounded-lg transition-all shadow-sm active:scale-95 cursor-pointer border border-surface-border"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px] text-secondary">table_view</span>
              <span>Ekspor Master Data (.xlsx)</span>
            </button>
            <button
              onClick={() => setIsDrawerOpen(!isDrawerOpen)}
              className="inline-flex items-center gap-space-xs px-space-lg py-space-sm bg-brand-crimson hover:bg-brand-crimson-hover text-on-primary font-body-tabular-bold text-body-tabular rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span>+ Tambah Mitra / Karyawan Baru</span>
            </button>
          </div>
        </div>

        {/* Sub-Tab Navigation Bar */}
        <div className="mt-space-lg flex items-center gap-space-md overflow-x-auto max-w-7xl mx-auto w-full pt-2">
          <button
            onClick={() => setActiveSubTab('partners')}
            className={`flex items-center gap-space-xs px-space-md py-space-sm font-body-tabular-bold text-body-tabular rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'partners'
                ? 'bg-brand-crimson text-on-primary shadow-sm'
                : 'text-secondary hover:text-on-surface hover:bg-surface-subtle'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">storefront</span>
            <span>Direktori Pelanggan &amp; Mitra Semen</span>
            <span className={`ml-space-xs px-1.5 py-0.5 rounded-full font-label-badge text-label-badge ${
              activeSubTab === 'partners' ? 'bg-white/20 text-on-primary' : 'bg-surface-muted text-secondary'
            }`}>
              {customers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('users')}
            className={`flex items-center gap-space-xs px-space-md py-space-sm font-body-tabular-bold text-body-tabular rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'users'
                ? 'bg-brand-crimson text-on-primary shadow-sm'
                : 'text-secondary hover:text-on-surface hover:bg-surface-subtle'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">badge</span>
            <span>Akun Pengguna Karyawan Piutang</span>
            <span className={`ml-space-xs px-1.5 py-0.5 rounded-full font-label-badge text-label-badge ${
              activeSubTab === 'users' ? 'bg-white/20 text-on-primary' : 'bg-surface-muted text-secondary'
            }`}>
              1
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('rules')}
            className={`flex items-center gap-space-xs px-space-md py-space-sm font-body-tabular-bold text-body-tabular rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'rules'
                ? 'bg-brand-crimson text-on-primary shadow-sm'
                : 'text-secondary hover:text-on-surface hover:bg-surface-subtle'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">rule</span>
            <span>Aturan Termin &amp; Plafon Kredit</span>
          </button>

          <button
            onClick={() => setActiveSubTab('shipping')}
            className={`flex items-center gap-space-xs px-space-md py-space-sm font-body-tabular-bold text-body-tabular rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'shipping'
                ? 'bg-brand-crimson text-on-primary shadow-sm'
                : 'text-secondary hover:text-on-surface hover:bg-surface-subtle'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">local_shipping</span>
            <span>Parameter Wilayah &amp; Ekspedisi</span>
          </button>
        </div>
      </section>

      {/* Main Container */}
      <div className="px-margin py-space-lg flex flex-col gap-space-lg max-w-7xl mx-auto w-full">
        {/* 4 KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
          <div className="bg-surface-canvas p-space-lg rounded-xl shadow-sm flex flex-col justify-between border border-surface-border">
            <div className="flex items-center justify-between">
              <span className="font-label-badge text-label-badge uppercase tracking-wider text-secondary">
                TOTAL MITRA TERDAFTAR
              </span>
              <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[18px]">business</span>
              </div>
            </div>
            <div className="my-space-sm">
              <div className="font-headline-corporate text-display-lg text-on-surface tracking-tight font-bold">
                {customers.length} <span className="font-body-tabular text-title-md text-secondary font-normal">Mitra</span>
              </div>
            </div>
            <div className="flex items-center gap-space-xs text-secondary font-caption text-caption border-t border-surface-border pt-2">
              <span className="material-symbols-outlined text-[14px]">inventory_2</span>
              <span>Distributor &amp; Ritel Semen</span>
            </div>
          </div>

          <div className="bg-surface-canvas p-space-lg rounded-xl shadow-sm flex flex-col justify-between border border-surface-border">
            <div className="flex items-center justify-between">
              <span className="font-label-badge text-label-badge uppercase tracking-wider text-secondary">
                MITRA STATUS AKTIF
              </span>
              <div className="w-8 h-8 rounded-lg bg-status-current-bg flex items-center justify-center text-status-current-text">
                <span className="material-symbols-outlined text-[18px]">verified</span>
              </div>
            </div>
            <div className="my-space-sm">
              <div className="font-headline-corporate text-display-lg text-on-surface tracking-tight font-bold">
                {activeCustomers.length} <span className="font-body-tabular text-title-md text-secondary font-normal">Mitra</span>
              </div>
            </div>
            <div className="flex items-center gap-space-xs text-secondary font-caption text-caption border-t border-surface-border pt-2">
              <span className="material-symbols-outlined text-[14px]">payments</span>
              <span>Plafon kredit operasional</span>
            </div>
          </div>

          <div className="bg-surface-canvas p-space-lg rounded-xl shadow-sm flex flex-col justify-between border border-surface-border">
            <div className="flex items-center justify-between">
              <span className="font-label-badge text-label-badge uppercase tracking-wider text-secondary">
                KARYAWAN PIUTANG (USERS)
              </span>
              <div className="w-8 h-8 rounded-lg bg-status-promise-bg flex items-center justify-center text-status-promise-text">
                <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
              </div>
            </div>
            <div className="my-space-sm">
              <div className="font-headline-corporate text-display-lg text-on-surface tracking-tight font-bold">
                1 <span className="font-body-tabular text-title-md text-secondary font-normal">Pengguna</span>
              </div>
            </div>
            <div className="flex items-center gap-space-xs text-secondary font-caption text-caption border-t border-surface-border pt-2">
              <span className="material-symbols-outlined text-[14px]">shield_person</span>
              <span>1 Akun Terdaftar (Firebase Auth)</span>
            </div>
          </div>

          <div className="bg-surface-canvas p-space-lg rounded-xl shadow-sm flex flex-col justify-between relative overflow-hidden border border-surface-border">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand-crimson"></div>
            <div className="flex items-center justify-between pl-space-xs">
              <span className="font-label-badge text-label-badge uppercase tracking-wider text-brand-crimson">
                LIMIT PLAFON TOTAL
              </span>
              <div className="w-8 h-8 rounded-lg bg-brand-crimson-subtle flex items-center justify-center text-brand-crimson">
                <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
              </div>
            </div>
            <div className="my-space-sm pl-space-xs">
              <div className="font-headline-corporate text-display-lg text-on-surface tracking-tight tabular-nums font-bold truncate">
                {formatIDR(totalLimit)}
              </div>
            </div>
            <div className="flex items-center gap-space-xs text-secondary font-caption text-caption pl-space-xs border-t border-surface-border pt-2">
              <span className="material-symbols-outlined text-[14px]">security</span>
              <span>Akumulasi limit penjaminan Tonasa</span>
            </div>
          </div>
        </div>

        {/* Quick Creation Drawer / Panel */}
        {isDrawerOpen && (
          <section className="bg-surface-canvas rounded-xl shadow-md overflow-hidden transition-all duration-300 border border-surface-border animate-in fade-in duration-150">
            <div className="h-1 bg-brand-crimson"></div>
            <div className="p-space-lg flex items-center justify-between bg-surface-subtle border-b border-surface-border">
              <div className="flex items-center gap-space-sm">
                <div className="w-8 h-8 rounded-lg bg-brand-crimson-subtle flex items-center justify-center text-brand-crimson">
                  <span className="material-symbols-outlined text-[20px]">dataset</span>
                </div>
                <div>
                  <h2 className="font-headline-corporate text-title-md text-on-surface">
                    Formulir Cepat Tambah Mitra / Pengguna Baru
                  </h2>
                  <p className="font-caption text-caption text-secondary">
                    Lengkapi profil pelanggan baru Semen Tonasa atau otoritas akun tim internal Piutang.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="text-secondary hover:text-on-surface p-1 rounded-md hover:bg-surface-muted transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-space-lg flex flex-col gap-space-lg">
              <div>
                <label className="font-caption text-caption font-bold text-on-surface uppercase tracking-wider block mb-space-xs">
                  Tipe Entitas Master
                </label>
                <div className="inline-flex p-1 bg-surface-subtle rounded-lg gap-space-xs border border-surface-border">
                  <button
                    type="button"
                    onClick={() => setEntityType('mitra')}
                    className={`flex items-center gap-space-xs px-space-md py-space-xs rounded-md cursor-pointer font-body-tabular text-body-tabular font-medium transition-all ${
                      entityType === 'mitra' ? 'bg-brand-crimson text-on-primary' : 'text-secondary hover:text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">domain</span>
                    <span>Mitra Debitur / Distributor</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntityType('karyawan')}
                    className={`flex items-center gap-space-xs px-space-md py-space-xs rounded-md cursor-pointer font-body-tabular text-body-tabular font-medium transition-all ${
                      entityType === 'karyawan' ? 'bg-brand-crimson text-on-primary' : 'text-secondary hover:text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">badge</span>
                    <span>Karyawan Piutang Internal</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md">
                <div className="flex flex-col gap-space-xs">
                  <label className="font-caption text-caption font-bold text-secondary uppercase">
                    Kode Mitra (SAP BP / ID)
                  </label>
                  <input
                    value={inpCode}
                    onChange={(e) => setInpCode(e.target.value)}
                    className="w-full h-10 px-3 bg-surface-canvas rounded-lg text-body-tabular font-body-tabular text-on-surface border border-surface-border focus:outline-none focus:border-brand-crimson transition-all"
                    placeholder="Contoh: BP-TN-400192"
                    type="text"
                  />
                </div>

                <div className="flex flex-col gap-space-xs lg:col-span-2">
                  <label className="font-caption text-caption font-bold text-secondary uppercase">
                    Nama Perusahaan / Toko Bangunan *
                  </label>
                  <input
                    value={inpName}
                    onChange={(e) => setInpName(e.target.value)}
                    className="w-full h-10 px-3 bg-surface-canvas rounded-lg text-body-tabular font-body-tabular text-on-surface border border-surface-border focus:outline-none focus:border-brand-crimson transition-all"
                    placeholder="Contoh: PT Harapan Jaya Abadi Semen"
                    required
                    type="text"
                  />
                </div>

                <div className="flex flex-col gap-space-xs">
                  <label className="font-caption text-caption font-bold text-secondary uppercase">
                    Kategori Segmen Semen
                  </label>
                  <select
                    value={inpCategory}
                    onChange={(e) => setInpCategory(e.target.value as any)}
                    className="w-full h-10 px-3 bg-surface-canvas rounded-lg text-body-tabular font-body-tabular text-on-surface border border-surface-border focus:outline-none focus:border-brand-crimson transition-all cursor-pointer"
                  >
                    <option value="Distributor Semen Zak">Distributor Semen Zak (Retail)</option>
                    <option value="Rekanan Semen Curah">Rekanan Semen Curah (Batching Plant)</option>
                    <option value="Kontraktor Proyek">Kontraktor Proyek Infrastruktur</option>
                    <option value="BUMN Karya">BUMN Karya / Strategis</option>
                  </select>
                </div>

                <div className="flex flex-col gap-space-xs">
                  <label className="font-caption text-caption font-bold text-secondary uppercase">
                    Nomor Pokok Wajib Pajak (NPWP)
                  </label>
                  <input
                    value={inpNpwp}
                    onChange={(e) => setInpNpwp(e.target.value)}
                    className="w-full h-10 px-3 bg-surface-canvas rounded-lg text-body-tabular font-body-tabular text-on-surface border border-surface-border focus:outline-none focus:border-brand-crimson transition-all"
                    placeholder="00.000.000.0-000.000"
                    type="text"
                  />
                </div>

                <div className="flex flex-col gap-space-xs">
                  <label className="font-caption text-caption font-bold text-secondary uppercase">
                    Kontak PIC / No. WhatsApp Aktif
                  </label>
                  <input
                    value={inpPhone}
                    onChange={(e) => setInpPhone(e.target.value)}
                    className="w-full h-10 px-3 bg-surface-canvas rounded-lg text-body-tabular font-body-tabular text-on-surface border border-surface-border focus:outline-none focus:border-brand-crimson transition-all"
                    placeholder="0812-xxxx-xxxx (Bpk. Anwar)"
                    type="text"
                  />
                </div>

                <div className="flex flex-col gap-space-xs">
                  <label className="font-caption text-caption font-bold text-secondary uppercase">
                    Alokasi Plafon Kredit (IDR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-caption text-secondary">Rp</span>
                    <input
                      value={inpCreditLimit}
                      onChange={(e) => setInpCreditLimit(e.target.value)}
                      className="w-full h-10 pl-8 pr-3 text-right bg-surface-canvas rounded-lg text-body-tabular font-body-tabular text-on-surface border border-surface-border tabular-nums focus:outline-none focus:border-brand-crimson transition-all"
                      placeholder="1000000000"
                      type="number"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-space-xs">
                  <label className="font-caption text-caption font-bold text-secondary uppercase">
                    Termin Pembayaran (TOP)
                  </label>
                  <select
                    value={inpTop}
                    onChange={(e) => setInpTop(e.target.value)}
                    className="w-full h-10 px-3 bg-surface-canvas rounded-lg text-body-tabular font-body-tabular text-on-surface border border-surface-border focus:outline-none focus:border-brand-crimson transition-all cursor-pointer"
                  >
                    <option value="Cash Before Delivery (CBD)">Cash Before Delivery (CBD)</option>
                    <option value="TOP 14 Hari Kalender">TOP 14 Hari Kalender</option>
                    <option value="TOP 30 Hari Kalender">TOP 30 Hari Kalender</option>
                    <option value="TOP 45 Hari Kalender">TOP 45 Hari Kalender</option>
                    <option value="TOP 60 Hari Kalender">TOP 60 Hari Kalender</option>
                  </select>
                </div>

                <div className="flex flex-col gap-space-xs lg:col-span-3">
                  <label className="font-caption text-caption font-bold text-secondary uppercase">
                    Alamat Gudang / Depo / Domisili
                  </label>
                  <input
                    value={inpAddress}
                    onChange={(e) => setInpAddress(e.target.value)}
                    className="w-full h-10 px-3 bg-surface-canvas rounded-lg text-body-tabular font-body-tabular text-on-surface border border-surface-border focus:outline-none focus:border-brand-crimson transition-all"
                    placeholder="Jl. Poros Tonasa - Pangkep No. 18, Sulawesi Selatan"
                    type="text"
                  />
                </div>

                <div className="flex flex-col gap-space-xs">
                  <label className="font-caption text-caption font-bold text-secondary uppercase">
                    Wilayah Distribusi
                  </label>
                  <select
                    value={inpRegion}
                    onChange={(e) => setInpRegion(e.target.value)}
                    className="w-full h-10 px-3 bg-surface-canvas rounded-lg text-body-tabular font-body-tabular text-on-surface border border-surface-border focus:outline-none focus:border-brand-crimson transition-all cursor-pointer"
                  >
                    <option value="Sulawesi Selatan (Pangkep / Makassar)">Sulawesi Selatan (Pangkep / Makassar)</option>
                    <option value="Sulawesi Barat (Mamuju / Majene)">Sulawesi Barat (Mamuju / Majene)</option>
                    <option value="Sulawesi Tengah (Palu / Morowali)">Sulawesi Tengah (Palu / Morowali)</option>
                    <option value="Maluku &amp; Maluku Utara">Maluku &amp; Maluku Utara</option>
                    <option value="Papua &amp; Papua Barat">Papua &amp; Papua Barat</option>
                    <option value="Kalimantan Timur (Balikpapan / IKN)">Kalimantan Timur (Balikpapan / IKN)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-space-sm pt-space-sm border-t border-surface-border">
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="px-space-md py-space-sm bg-surface-subtle hover:bg-surface-muted text-secondary font-body-tabular-bold text-body-tabular rounded-lg transition-all cursor-pointer border border-surface-border"
                  type="button"
                >
                  Batal
                </button>
                <button
                  className="inline-flex items-center gap-space-xs px-space-lg py-space-sm bg-brand-crimson hover:bg-brand-crimson-hover text-on-primary font-body-tabular-bold text-body-tabular rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer"
                  type="submit"
                >
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  <span>Simpan Data Master</span>
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Toolbar: Search, Filters */}
        <div className="bg-surface-canvas p-space-md rounded-xl shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-space-md border border-surface-border">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[20px]">
              search
            </span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-surface-subtle focus:bg-surface-canvas rounded-lg font-body-tabular text-body-tabular text-on-surface placeholder:text-secondary/60 focus:outline-none border border-surface-border focus:border-brand-crimson transition-all"
              placeholder="Cari kode mitra, nama debitur, NPWP, atau PIC..."
              type="text"
            />
          </div>

          <div className="flex flex-wrap items-center gap-space-sm">
            <div className="relative min-w-[170px]">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full h-10 px-3 bg-surface-subtle font-body-tabular text-body-tabular text-on-surface rounded-lg border border-surface-border focus:outline-none cursor-pointer pr-8"
              >
                <option value="">Semua Kategori</option>
                <option value="zak">Distributor Semen Zak</option>
                <option value="curah">Rekanan Curah</option>
                <option value="proyek">Kontraktor Proyek</option>
                <option value="bumn">BUMN Karya</option>
              </select>
            </div>

            <div className="relative min-w-[170px]">
              <select
                value={filterRegion}
                onChange={(e) => setFilterRegion(e.target.value)}
                className="w-full h-10 px-3 bg-surface-subtle font-body-tabular text-body-tabular text-on-surface rounded-lg border border-surface-border focus:outline-none cursor-pointer pr-8"
              >
                <option value="">Semua Wilayah</option>
                <option value="selatan">Sulawesi Selatan</option>
                <option value="barat">Sulawesi Barat</option>
                <option value="tengah">Sulawesi Tengah</option>
                <option value="maluku">Maluku &amp; Sekitarnya</option>
                <option value="papua">Papua</option>
              </select>
            </div>

            <div className="relative min-w-[140px]">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full h-10 px-3 bg-surface-subtle font-body-tabular text-body-tabular text-on-surface rounded-lg border border-surface-border focus:outline-none cursor-pointer pr-8"
              >
                <option value="">Semua Status</option>
                <option value="aktif">Aktif</option>
                <option value="penundaan">Penundaan Plafon</option>
                <option value="ditangguhkan">Ditangguhkan</option>
              </select>
            </div>

            <button
              onClick={() => {
                setSearchQuery('');
                setFilterCategory('');
                setFilterRegion('');
                setFilterStatus('');
              }}
              className="h-10 px-space-md bg-surface-subtle hover:bg-surface-muted text-secondary hover:text-on-surface font-body-tabular-bold text-body-tabular rounded-lg transition-all cursor-pointer border border-surface-border"
            >
              Reset
            </button>
            <button
              onClick={() => onShowToast('Filter Diterapkan', `Menampilkan ${filteredCustomers.length} mitra bisnis.`)}
              className="h-10 px-space-md bg-brand-crimson hover:bg-brand-crimson-hover text-on-primary font-body-tabular-bold text-body-tabular rounded-lg shadow-sm transition-all cursor-pointer"
            >
              Terapkan Filter
            </button>
          </div>
        </div>

        {/* Data Table Container */}
        <div className="bg-surface-canvas rounded-xl shadow-sm overflow-hidden flex flex-col border border-surface-border">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body-tabular text-body-tabular border-collapse">
              <thead>
                <tr className="bg-surface-subtle text-secondary uppercase font-label-badge text-label-badge tracking-wider h-11 border-b border-surface-border">
                  <th className="px-space-md py-space-sm font-semibold">KODE MITRA</th>
                  <th className="px-space-md py-space-sm font-semibold">NAMA REKANAN / DEBITUR</th>
                  <th className="px-space-md py-space-sm font-semibold">KATEGORI BISNIS</th>
                  <th className="px-space-md py-space-sm font-semibold">WILAYAH</th>
                  <th className="px-space-md py-space-sm font-semibold text-right">PLAFON KREDIT</th>
                  <th className="px-space-md py-space-sm font-semibold">TERMIN (TOP)</th>
                  <th className="px-space-md py-space-sm font-semibold">PETUGAS PIC</th>
                  <th className="px-space-md py-space-sm font-semibold text-center">STATUS</th>
                  <th className="px-space-md py-space-sm font-semibold text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td className="px-space-lg py-20 text-center bg-surface-canvas" colSpan={9}>
                      <div className="max-w-xl mx-auto flex flex-col items-center">
                        <div className="relative w-20 h-20 rounded-full bg-brand-crimson-subtle flex items-center justify-center text-brand-crimson mb-space-lg border border-brand-crimson/20">
                          <span className="material-symbols-outlined text-[44px]">database</span>
                          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-surface-canvas shadow-sm flex items-center justify-center text-secondary border border-surface-border">
                            <span className="material-symbols-outlined text-[16px]">folder_off</span>
                          </div>
                        </div>
                        <h3 className="font-headline-corporate text-headline-corporate text-on-surface tracking-tight mb-space-xs">
                          Belum Ada Master Data Terdaftar
                        </h3>
                        <p className="font-body-tabular text-body-tabular text-secondary leading-relaxed mb-space-lg">
                          Data master pelanggan, profil distributor Tonasa, dan daftar akun karyawan piutang belum diisi dalam sistem. Anda dapat menambahkan data secara manual atau melakukan sinkronisasi langsung dari database SAP Semen Tonasa.
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-space-md">
                          <button
                            onClick={() => setIsDrawerOpen(true)}
                            className="inline-flex items-center gap-space-xs px-space-lg py-space-sm bg-brand-crimson hover:bg-brand-crimson-hover text-on-primary font-body-tabular-bold text-body-tabular rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px]">add_circle</span>
                            <span>+ Tambah Mitra Baru</span>
                          </button>
                          <button
                            onClick={onLoadSample}
                            className="inline-flex items-center gap-space-xs px-space-lg py-space-sm bg-surface-subtle hover:bg-surface-muted text-on-surface font-body-tabular-bold text-body-tabular rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer border border-surface-border"
                          >
                            <span className="material-symbols-outlined text-[18px]">upload_file</span>
                            <span>Muat Sampel Data Tonasa</span>
                          </button>
                        </div>
                        <div className="mt-space-lg inline-flex items-center gap-space-xs px-space-md py-space-xs rounded bg-surface-subtle text-caption font-caption text-secondary border border-surface-border">
                          <span className="material-symbols-outlined text-[15px] text-brand-crimson">info</span>
                          <span>Format skema master telah disesuaikan dengan SAP ERP RFC S/4HANA (BAPI_CUSTOMER_GETLIST).</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((c) => (
                    <tr key={c.code} className="hover:bg-surface-subtle transition-colors h-12 text-sm">
                      <td className="px-space-md py-space-sm font-mono font-bold text-brand-crimson">{c.code}</td>
                      <td className="px-space-md py-space-sm font-semibold text-on-surface">
                        <div>{c.name}</div>
                        <div className="text-[11px] text-secondary font-mono">{c.npwp}</div>
                      </td>
                      <td className="px-space-md py-space-sm text-secondary">{c.category}</td>
                      <td className="px-space-md py-space-sm text-secondary truncate max-w-[180px]">{c.region}</td>
                      <td className="px-space-md py-space-sm text-right font-mono font-semibold text-on-surface">
                        {formatIDR(c.creditLimit)}
                      </td>
                      <td className="px-space-md py-space-sm text-secondary text-caption">{c.top}</td>
                      <td className="px-space-md py-space-sm text-secondary text-caption">{c.pic}</td>
                      <td className="px-space-md py-space-sm text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-label-badge font-label-badge font-bold ${
                            c.status === 'Aktif'
                              ? 'bg-status-current-bg text-status-current-text'
                              : 'bg-status-due-bg text-status-due-text'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="px-space-md py-space-sm text-right">
                        <button
                          onClick={() => onShowToast('Profil Mitra', `Membuka detail profil debitur ${c.name}`)}
                          className="px-2 py-1 rounded hover:bg-surface-container text-brand-crimson text-caption font-body-tabular-bold cursor-pointer"
                        >
                          Kelola
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-space-lg py-space-md bg-surface-subtle flex flex-col sm:flex-row items-center justify-between gap-space-md border-t border-surface-border">
            <div className="flex items-center gap-space-sm">
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
              <span className="font-caption text-caption text-secondary">
                Menampilkan <strong className="text-on-surface">{filteredCustomers.length}</strong> dari{' '}
                <strong className="text-on-surface">{customers.length}</strong> mitra bisnis terdaftar
              </span>
            </div>
            <div className="flex items-center gap-space-sm">
              <span className="font-caption text-caption text-secondary">Halaman 1 dari 1</span>
              <div className="flex items-center gap-space-xs">
                <button className="w-8 h-8 flex items-center justify-center rounded bg-surface-canvas text-secondary/40 cursor-not-allowed border border-surface-border" disabled>
                  <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                </button>
                <button className="w-8 h-8 flex items-center justify-center rounded bg-brand-crimson text-on-primary font-body-tabular-bold text-caption shadow-sm">
                  1
                </button>
                <button className="w-8 h-8 flex items-center justify-center rounded bg-surface-canvas text-secondary/40 cursor-not-allowed border border-surface-border" disabled>
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Security & Governance Banner */}
        <div className="p-space-lg bg-surface-canvas rounded-xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md border border-surface-border">
          <div className="flex items-center gap-space-md">
            <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-[24px]">gavel</span>
            </div>
            <div className="flex flex-col">
              <span className="font-body-tabular-bold text-body-tabular text-on-surface">
                Tata Kelola Hak Akses &amp; Perlindungan Data Pribadi (UU PDP No. 27/2022)
              </span>
              <span className="font-caption text-caption text-secondary">
                Seluruh data identitas debitur, nomor kontak penjamin, NPWP, dan batasan plafon kredit disimpan dengan enkripsi AES-256 serta diaudit dalam audit trail internal PT Biringkassi Raya.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-space-xs text-secondary shrink-0">
            <span className="material-symbols-outlined text-[18px] text-status-current-text">verified</span>
            <span className="font-caption text-caption">SOP-KEU-BR-04 Rev.3</span>
          </div>
        </div>
      </div>
    </div>
  );
};
