import React from 'react';
import { ScreenType } from '../types';

interface SidebarProps {
  currentScreen: ScreenType;
  onNavigate: (screen: ScreenType) => void;
  onLogout: () => void;
  invoiceCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentScreen,
  onNavigate,
  onLogout,
  invoiceCount,
}) => {
  const navItems: { id: ScreenType; label: string; icon: string; badge?: number }[] = [
    { id: 'dashboard-ringkasan', label: 'Dashboard Ringkasan', icon: 'home' },
    { id: 'daftar-piutang-invoice', label: 'Daftar Piutang & Invoice', icon: 'database', badge: invoiceCount },
    { id: 'analisis-umur-piutang', label: 'Analisis Umur Piutang', icon: 'bar_chart' },
    { id: 'janji-bayar-tindak-lanjut', label: 'Janji Bayar & Tindak Lanjut', icon: 'calendar_today' },
    { id: 'impor-data-rekonsiliasi', label: 'Impor Data & Rekonsiliasi', icon: 'upload' },
    { id: 'laporan-operasional', label: 'Laporan Operasional', icon: 'description' },
    { id: 'log-aktivitas-audit', label: 'Log Aktivitas & Audit', icon: 'vpn_key' },
    { id: 'master-data-pengguna', label: 'Master Data & Pengguna', icon: 'group' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-surface-canvas z-50 flex flex-col border-r border-surface-border">
      {/* Top Brand Identity */}
      <div className="h-16 px-space-lg flex items-center gap-space-md border-b border-surface-border bg-surface-canvas">
        <img
          alt="Logo PT Biringkassi Raya / Semen Tonasa"
          className="h-8 w-auto object-contain"
          src="https://lh3.googleusercontent.com/aida/AEtjO1XM_ZLuQYqS4c1eCTQmKG5b8Y3eyVOzg7h7jX4ACfJVsST_QV4CfwwuWNPTFVthK_r4Yh1XARMg_aUOfYZgVHL6ckIr6CkyUmjKCMY_mCw3rIQIbk6_3SaXPndVuy4kcc1k22ECanq7O2VDCaW9ypMFtK9Ski9jEIUl0QH9QugvLP0HLX61tP1rsiXqCuIacav2qjzo4rMWziVJsJeFWiO76tQARss5m3JM-DtIhLTBA55eEkwLIt8v-EU"
        />
        <div className="flex flex-col min-w-0 leading-none">
          <span className="font-headline-corporate text-caption uppercase tracking-wider text-brand-crimson font-bold truncate">
            MONITORING PIUTANG
          </span>
          <span className="font-caption text-caption text-secondary truncate mt-space-xs">
            PT Biringkassi Raya
          </span>
        </div>
      </div>

      {/* Sub-header navigation section label */}
      <div className="px-space-md py-space-sm bg-surface-subtle border-b border-surface-border">
        <div className="text-caption font-label-badge text-secondary uppercase tracking-wider px-space-xs">
          Navigasi Operasional
        </div>
      </div>

      {/* Nav Link List */}
      <nav className="flex-1 px-space-sm py-space-md space-y-space-xs overflow-y-auto">
        {navItems.map((item) => {
          const isActive = currentScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-space-md py-space-sm rounded-lg text-left transition-all ${
                isActive
                  ? 'bg-brand-crimson text-on-primary font-bold shadow-sm'
                  : 'font-body-tabular text-body-tabular text-on-surface-variant hover:bg-brand-crimson-subtle hover:text-brand-crimson'
              }`}
            >
              <div className="flex items-center gap-space-md min-w-0">
                <span className="material-symbols-outlined text-[20px] shrink-0">
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold font-label-badge ${
                    isActive ? 'bg-white/20 text-white' : 'bg-surface-subtle text-secondary'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info & Quick Lock / Session Switch */}
      <div className="p-space-md border-t border-surface-border bg-surface-subtle flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-space-sm text-caption text-secondary">
            <span className="w-2 h-2 rounded-full bg-status-due-text inline-block animate-pulse"></span>
            <span className="font-caption truncate">Semen Tonasa ERP Bridge</span>
          </div>
          <button
            onClick={onLogout}
            title="Kunci sesi / Ke Layar Login"
            className="text-secondary hover:text-brand-crimson text-caption flex items-center gap-1 hover:underline cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            <span>Keluar</span>
          </button>
        </div>
        <div className="font-caption text-caption text-on-surface-variant text-[11px] flex justify-between items-center">
          <span>v2.4.0 • Unit Keuangan</span>
          <span className="text-[10px] bg-status-current-bg text-status-current-text px-1.5 py-0.5 rounded font-bold">
            ONLINE
          </span>
        </div>
      </div>
    </aside>
  );
};
