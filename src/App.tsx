import React, { useState } from 'react';
import { ScreenType, Invoice, PromiseRecord, CustomerMaster, AuditLog, UserSession } from './types';
import {
  sampleInvoices,
  samplePromises,
  sampleCustomers,
  sampleAuditLogs,
  defaultUserSession,
} from './data/initialData';

import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LoginScreen } from './components/LoginScreen';
import { DashboardScreen } from './components/DashboardScreen';
import { InvoicesScreen } from './components/InvoicesScreen';
import { AgingScreen } from './components/AgingScreen';
import { PromisesScreen } from './components/PromisesScreen';
import { ImportScreen } from './components/ImportScreen';
import { ReportsScreen } from './components/ReportsScreen';
import { AuditLogScreen } from './components/AuditLogScreen';
import { MasterDataScreen } from './components/MasterDataScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('dashboard-ringkasan');
  const [userSession, setUserSession] = useState<UserSession>(defaultUserSession);

  // Core synchronized data states
  const [invoices, setInvoices] = useState<Invoice[]>(sampleInvoices);
  const [promises, setPromises] = useState<PromiseRecord[]>(samplePromises);
  const [customers, setCustomers] = useState<CustomerMaster[]>(sampleCustomers);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(sampleAuditLogs);

  // Global search input
  const [searchQuery, setSearchQuery] = useState('');

  // Toast Notification
  const [toast, setToast] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: 'success' | 'info' | 'warn';
  }>({
    show: false,
    title: '',
    message: '',
    type: 'success',
  });

  const showToast = (title: string, message: string, type: 'success' | 'info' | 'warn' = 'success') => {
    setToast({ show: true, title, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3800);
  };

  // Log action automatically
  const addAuditLog = (newLog: Partial<AuditLog>) => {
    const now = new Date();
    const formattedDate = `${now.getDate()} Okt 2026 ${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const record: AuditLog = {
      id: newLog.id || `AUD-EVT-${Date.now().toString().slice(-6)}`,
      timestamp: formattedDate,
      user: userSession.email,
      role: userSession.role,
      module: newLog.module || 'Operasional Piutang',
      action: newLog.action || 'Perubahan Data',
      object: newLog.object || 'Buku Besar Piutang',
      ip: '10.24.12.80',
      agent: 'Chrome 129.0 / PT Biringkassi Web Portal',
      level: newLog.level || 'INFO',
      status: newLog.status || 'Berhasil',
      payload: newLog.payload,
    };

    setAuditLogs((prev) => [record, ...prev]);
  };

  // Add Invoice
  const handleAddInvoice = (newInv: Partial<Invoice>) => {
    const fullInv: Invoice = {
      id: `INV-${Date.now()}`,
      no: newInv.no || `INV-BKR/2026/${Math.floor(1000 + Math.random() * 9000)}`,
      spk: newInv.spk,
      customer: newInv.customer || 'Pelanggan Baru',
      customerCode: newInv.customerCode || 'CUST-NEW',
      issueDate: newInv.issueDate || new Date().toISOString().split('T')[0],
      dueDate: newInv.dueDate || new Date().toISOString().split('T')[0],
      amount: newInv.amount || 0,
      paid: newInv.paid || 0,
      balance: newInv.balance !== undefined ? newInv.balance : (newInv.amount || 0),
      status: newInv.status || 'current',
      category: newInv.category || 'zak',
      region: newInv.region || 'sulsel',
      followUpNote: newInv.followUpNote || '',
    };

    setInvoices((prev) => [fullInv, ...prev]);
    addAuditLog({
      module: 'Operasional Piutang',
      action: 'Pencatatan Faktur Baru',
      object: `${fullInv.no} (${fullInv.customer})`,
      level: 'INFO',
      payload: { amount: fullInv.amount, balance: fullInv.balance },
    });
  };

  // Update Invoice
  const handleUpdateInvoice = (id: string, updates: Partial<Invoice>) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, ...updates } : inv))
    );
    addAuditLog({
      module: 'Operasional Piutang',
      action: 'Pembaruan Status Faktur',
      object: `ID Faktur: ${id}`,
      level: 'INFO',
      payload: updates,
    });
  };

  // Add Promise
  const handleAddPromise = (newPromise: Partial<PromiseRecord>) => {
    const record: PromiseRecord = {
      id: newPromise.id || `P-2026-${String(promises.length + 1).padStart(4, '0')}`,
      invoice: newPromise.invoice || 'INV-REF',
      partner: newPromise.partner || 'Mitra',
      date: newPromise.date || new Date().toISOString().split('T')[0],
      amount: newPromise.amount || 0,
      officer: newPromise.officer || userSession.name,
      channel: newPromise.channel || 'Telepon Desk Collection',
      status: newPromise.status || 'Menunggu Pembayaran',
      notes: newPromise.notes || '',
    };

    setPromises((prev) => [record, ...prev]);
    addAuditLog({
      module: 'Operasional Piutang',
      action: 'Pencatatan Janji Bayar',
      object: `${record.id} (${record.invoice})`,
      level: 'INFO',
      payload: { amount: record.amount, target_date: record.date },
    });
  };

  // Update Promise
  const handleUpdatePromise = (id: string, updates: Partial<PromiseRecord>) => {
    setPromises((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
    addAuditLog({
      module: 'Operasional Piutang',
      action: 'Pembaruan Komitmen Janji Bayar',
      object: `ID Janji: ${id}`,
      level: 'INFO',
      payload: updates,
    });
  };

  // Delete Promise
  const handleDeletePromise = (id: string) => {
    setPromises((prev) => prev.filter((p) => p.id !== id));
    addAuditLog({
      module: 'Operasional Piutang',
      action: 'Penghapusan Komitmen Janji Bayar',
      object: `ID Janji: ${id}`,
      level: 'PERINGATAN',
    });
  };

  // Add Customer
  const handleAddCustomer = (newCustomer: CustomerMaster) => {
    setCustomers((prev) => [newCustomer, ...prev]);
    addAuditLog({
      module: 'Master Data / Debitur',
      action: 'Registrasi Mitra Debitur Baru',
      object: `${newCustomer.code} - ${newCustomer.name}`,
      level: 'INFO',
      payload: { limit: newCustomer.creditLimit, top: newCustomer.top },
    });
  };

  // Import confirmed
  const handleImportConfirmed = (newInvoices: Invoice[]) => {
    setInvoices((prev) => [...newInvoices, ...prev]);
    addAuditLog({
      module: 'Impor & Ekspor Berkas',
      action: 'Komitmen Impor Berkas Rekonsiliasi SAP',
      object: `${newInvoices.length} Faktur Baru`,
      level: 'INFO',
      payload: { count: newInvoices.length },
    });
    showToast('Impor Selesai', `${newInvoices.length} faktur berhasil disinkronkan ke buku besar piutang.`);
  };

  // Load sample data button
  const handleLoadSample = () => {
    setInvoices(sampleInvoices);
    setPromises(samplePromises);
    setCustomers(sampleCustomers);
    setAuditLogs(sampleAuditLogs);
    showToast('Data Simulasi Dimuat', 'Seluruh data operasional PT Biringkassi Raya / Semen Tonasa berhasil dimuat.');
  };

  // Quick SAP Sync simulation
  const handleQuickSync = () => {
    showToast(
      'Sinkronisasi SAP S/4HANA',
      'Koneksi real-time terverifikasi. Buku besar piutang mutakhir sesuai data ERP Semen Tonasa.'
    );
  };

  // Login handler
  const handleLoginSuccess = (email: string) => {
    setUserSession((prev) => ({
      ...prev,
      email,
      isLoggedIn: true,
    }));
    setCurrentScreen('dashboard-ringkasan');
    showToast('Autentikasi Berhasil', `Selamat datang kembali, ${email}.`);
  };

  const handleLogout = () => {
    setUserSession((prev) => ({ ...prev, isLoggedIn: false }));
    showToast('Sesi Ditutup', 'Anda telah keluar dari portal monitoring piutang.', 'info');
  };

  // If user is logged out, render the Login Screen
  if (!userSession.isLoggedIn) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-surface font-body-tabular text-on-surface antialiased flex flex-col">
      {/* Sidebar Navigation */}
      <Sidebar
        currentScreen={currentScreen}
        onNavigate={(screen) => {
          setCurrentScreen(screen);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onLogout={handleLogout}
        invoiceCount={invoices.length}
      />

      {/* Main Content Area offset by 64 (w-64 sidebar) */}
      <div className="pl-64 flex-1 flex flex-col min-h-screen">
        {/* Top Fixed Header */}
        <Header
          userSession={userSession}
          onLogout={handleLogout}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onQuickSync={handleQuickSync}
          hasData={invoices.length > 0}
        />

        {/* Dynamic Screen View Router */}
        <main className="w-full pt-16 flex-1 bg-surface">
          {currentScreen === 'dashboard-ringkasan' && (
            <DashboardScreen
              invoices={invoices}
              promises={promises}
              onAddInvoice={handleAddInvoice}
              onNavigate={setCurrentScreen}
              onLoadSample={handleLoadSample}
              onShowToast={showToast}
            />
          )}

          {currentScreen === 'daftar-piutang-invoice' && (
            <InvoicesScreen
              invoices={invoices}
              onAddInvoice={handleAddInvoice}
              onUpdateInvoice={handleUpdateInvoice}
              onAddPromise={handleAddPromise}
              onLoadSample={handleLoadSample}
              onShowToast={showToast}
            />
          )}

          {currentScreen === 'analisis-umur-piutang' && (
            <AgingScreen
              invoices={invoices}
              onAddInvoice={handleAddInvoice}
              onLoadSample={handleLoadSample}
              onShowToast={showToast}
            />
          )}

          {currentScreen === 'janji-bayar-tindak-lanjut' && (
            <PromisesScreen
              promises={promises}
              invoices={invoices}
              onAddPromise={handleAddPromise}
              onUpdatePromise={handleUpdatePromise}
              onDeletePromise={handleDeletePromise}
              onLoadSample={handleLoadSample}
              onShowToast={showToast}
            />
          )}

          {currentScreen === 'impor-data-rekonsiliasi' && (
            <ImportScreen
              onImportConfirmed={handleImportConfirmed}
              onShowToast={showToast}
              onNavigate={setCurrentScreen}
            />
          )}

          {currentScreen === 'laporan-operasional' && (
            <ReportsScreen
              invoices={invoices}
              onLoadSample={handleLoadSample}
              onShowToast={showToast}
            />
          )}

          {currentScreen === 'log-aktivitas-audit' && (
            <AuditLogScreen
              logs={auditLogs}
              onAddLog={addAuditLog}
              onLoadSample={handleLoadSample}
              onShowToast={showToast}
            />
          )}

          {currentScreen === 'master-data-pengguna' && (
            <MasterDataScreen
              customers={customers}
              onAddCustomer={handleAddCustomer}
              onLoadSample={handleLoadSample}
              onShowToast={showToast}
            />
          )}
        </main>
      </div>

      {/* Global Notification Toast */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="bg-inverse-surface text-inverse-on-surface px-space-lg py-space-sm rounded-lg shadow-2xl border border-white/10 flex items-center gap-space-sm max-w-md">
            <span
              className={`material-symbols-outlined text-[20px] ${
                toast.type === 'warn'
                  ? 'text-status-due-bg'
                  : toast.type === 'info'
                  ? 'text-status-promise-bg'
                  : 'text-status-current-bg'
              }`}
            >
              {toast.type === 'warn' ? 'warning' : toast.type === 'info' ? 'info' : 'task_alt'}
            </span>
            <div className="flex flex-col">
              <span className="font-body-tabular-bold text-caption font-bold">{toast.title}</span>
              <span className="font-caption text-caption opacity-90">{toast.message}</span>
            </div>
            <button
              onClick={() => setToast((prev) => ({ ...prev, show: false }))}
              className="ml-auto text-white/60 hover:text-white p-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
