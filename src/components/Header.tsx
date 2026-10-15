import React, { useState } from 'react';
import { UserSession } from '../types';

interface HeaderProps {
  userSession: UserSession;
  onLogout: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onQuickSync: () => void;
  hasData: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  userSession,
  onLogout,
  searchQuery,
  onSearchChange,
  onQuickSync,
  hasData,
}) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncClick = () => {
    setIsSyncing(true);
    onQuickSync();
    setTimeout(() => {
      setIsSyncing(false);
    }, 1200);
  };

  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-brand-crimson text-on-primary z-40 flex items-center justify-between px-space-lg shadow-sm">
      {/* Title & Brand Group */}
      <div className="flex items-center gap-space-lg min-w-0">
        <div className="flex items-center gap-space-sm">
          <span className="font-headline-corporate text-title-md font-bold tracking-tight uppercase whitespace-nowrap text-on-primary">
            SISTEM INFORMASI MONITORING PIUTANG
          </span>
          <span className="hidden xl:inline-block px-space-sm py-space-xs bg-brand-crimson-hover rounded text-label-badge font-label-badge tracking-wider border border-white/20 uppercase">
            Semen Tonasa Group
          </span>
        </div>

        {/* Global Search Bar */}
        <div className="relative hidden lg:block w-72">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-white/60 text-[18px]">
            search
          </span>
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-8 pl-8 pr-3 text-caption font-body-tabular bg-white/10 hover:bg-white/15 focus:bg-white focus:text-on-surface text-on-primary placeholder-white/60 rounded border border-white/20 focus:outline-none transition-all"
            placeholder="Cari invoice, pelanggan, SPK..."
            type="text"
          />
        </div>
      </div>

      {/* Right Controls & User Info */}
      <div className="flex items-center gap-space-md">
        {/* Connection status badge */}
        <button
          onClick={handleSyncClick}
          className="hidden md:flex items-center gap-space-xs px-space-sm py-1 bg-white/10 hover:bg-white/20 rounded border border-white/10 transition-colors cursor-pointer text-left"
          title="Klik untuk sinkronisasi paksa dengan SAP ERP Semen Tonasa"
        >
          <span className={`material-symbols-outlined text-[16px] text-white/70 ${isSyncing ? 'animate-spin' : ''}`}>
            sync
          </span>
          <span className="font-caption text-caption text-white/90 whitespace-nowrap">
            {hasData ? 'Terhubung ke SAP / ERP Tonasa' : 'Belum ada data diimpor / Data kosong'}
          </span>
        </button>

        {/* User email badge */}
        <div className="hidden sm:flex items-center gap-space-xs px-space-sm py-1 bg-white/10 rounded border border-white/10">
          <span className="material-symbols-outlined text-[16px] text-status-current-bg">
            verified_user
          </span>
          <span className="font-caption text-caption text-white/90 truncate max-w-[200px]">
            {userSession.email}
          </span>
        </div>

        {/* User avatar and dropdown trigger */}
        <div className="relative">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-space-sm pl-space-xs hover:opacity-90 transition-opacity cursor-pointer"
          >
            <img
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover border border-white/30"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDbfd5gr7pGZA7RfJCNHRpAtW1V2Q6ls3bZHUf3ewMrWnWIOMWqdX7mlTxKBnsKxuqhhTlZJZaqlSJ6y3DIclFQtcuS8OywTcfpwXwNKfkF7-EHxYolWemmtpQWI6eRQ883JmmQk_RH7Tiihc1g8VSkJ4q8amL1lusWSzHc2IlnUdMB03ieolgJRi3RL-VKWlyQil6xOEW-LU1RQCowQWp000xVPCUfV6WP3rXOwm3HQ9pHy7QdRCSmxg"
            />
            <div className="hidden 2xl:flex flex-col text-left leading-tight">
              <span className="font-body-tabular-bold text-caption font-bold text-on-primary leading-none">
                {userSession.name}
              </span>
              <span className="font-caption text-caption text-white/75 text-[11px]">
                {userSession.department}
              </span>
            </div>
            <span className="material-symbols-outlined text-white/70 text-[18px]">
              expand_more
            </span>
          </button>

          {/* Profile Dropdown */}
          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl bg-surface-canvas text-on-surface shadow-2xl border border-surface-border p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="p-2 border-b border-surface-border/60">
                <p className="font-body-tabular-bold text-sm text-on-surface">{userSession.name}</p>
                <p className="font-caption text-caption text-secondary truncate">{userSession.email}</p>
                <span className="inline-block mt-1 font-label-badge text-[10px] bg-brand-crimson-subtle text-brand-crimson px-2 py-0.5 rounded">
                  {userSession.role}
                </span>
              </div>
              <div className="py-1">
                <div className="px-2 py-1.5 text-caption text-secondary flex items-center justify-between">
                  <span>Terminal Node:</span>
                  <span className="font-mono font-semibold text-on-surface">UPG-DC-04</span>
                </div>
                <div className="px-2 py-1.5 text-caption text-secondary flex items-center justify-between">
                  <span>VLAN IP:</span>
                  <span className="font-mono text-[11px] text-on-surface">10.24.12.80</span>
                </div>
              </div>
              <div className="border-t border-surface-border/60 pt-1">
                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    onLogout();
                  }}
                  className="w-full text-left px-2 py-2 text-sm text-error hover:bg-surface-subtle rounded-lg flex items-center gap-2 font-medium cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">lock_reset</span>
                  <span>Kunci Sesi / Ke Layar Login</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
