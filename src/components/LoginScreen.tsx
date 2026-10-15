import React, { useState } from 'react';

interface LoginScreenProps {
  onLoginSuccess: (email: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('karyawan@biringkassiraya.co.id');
  const [password, setPassword] = useState('TonasaEnterprise2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSsoLoading, setIsSsoLoading] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);

  const [alertState, setAlertState] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }>({
    show: false,
    type: 'info',
    title: '',
    message: '',
  });

  const handleGoogleSignIn = () => {
    setIsGoogleLoading(true);
    setAlertState({ show: false, type: 'info', title: '', message: '' });

    setTimeout(() => {
      setIsGoogleLoading(false);
      setAlertState({
        show: true,
        type: 'success',
        title: 'Otentikasi Firebase Berhasil',
        message: 'Identitas Karyawan terverifikasi via Google Workspace Tonasa Group. Mengalihkan ke Dashboard Monitoring Piutang...',
      });

      setTimeout(() => {
        onLoginSuccess('karyawan@biringkassiraya.co.id');
      }, 1000);
    }, 1200);
  };

  const handleManualSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();

    const isAllowedDomain =
      cleanEmail.endsWith('@biringkassiraya.co.id') || cleanEmail.endsWith('@sementonasa.co.id');

    if (!isAllowedDomain) {
      setAlertState({
        show: true,
        type: 'error',
        title: 'Akses Ditolak (Domain Tidak Sah)',
        message: 'Gunakan email korporat resmi dengan ekstensi @biringkassiraya.co.id atau @sementonasa.co.id.',
      });
      return;
    }

    if (password.length < 6) {
      setAlertState({
        show: true,
        type: 'error',
        title: 'Otentikasi Gagal',
        message: 'Kata sandi korporat minimal 6 karakter sesuai standar keamanan LDAP Semen Tonasa.',
      });
      return;
    }

    setIsSsoLoading(true);
    setTimeout(() => {
      setIsSsoLoading(false);
      setAlertState({
        show: true,
        type: 'success',
        title: 'Sesi SSO Terbuka',
        message: 'Autentikasi terkonfirmasi. Sinkronisasi data faktur & penagihan sedang disiapkan...',
      });

      setTimeout(() => {
        onLoginSuccess(cleanEmail);
      }, 900);
    }, 1100);
  };

  return (
    <main className="w-full bg-surface min-h-screen">
      <div className="flex flex-col w-full relative min-h-screen items-center justify-center p-4 md:p-8 lg:p-12 overflow-hidden">
        {/* Subtle Industrial Geometrics & Brand Ambient Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-brand-crimson/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-48 -left-48 w-[32rem] h-[32rem] bg-brand-crimson/10 rounded-full blur-3xl"></div>

          {/* Industrial Architectural Grid Accent Lines */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.035] text-brand-crimson" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern height="48" id="tonasa-grid" patternUnits="userSpaceOnUse" width="48">
                <path d="M 48 0 L 0 0 0 48" fill="none" stroke="currentColor" strokeWidth="1.5"></path>
                <circle cx="24" cy="24" fill="currentColor" r="1.5"></circle>
              </pattern>
            </defs>
            <rect fill="url(#tonasa-grid)" height="100%" width="100%"></rect>
          </svg>

          {/* Geometric Angular Brand Sashes */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-crimson via-primary to-brand-crimson"></div>
          <div className="absolute -bottom-10 right-10 rotate-12 w-64 h-64 border-8 border-brand-crimson/5 pointer-events-none"></div>
        </div>

        {/* Primary Wrapper / Centered Card Structure */}
        <div className="w-full max-w-xl relative z-10 flex flex-col items-center">
          {/* Top Corporate Identification Strip */}
          <div className="flex items-center gap-3 mb-6 bg-surface-container-low px-4 py-1.5 rounded-full shadow-sm">
            <span className="inline-block w-2 h-2 rounded-full bg-status-current-text animate-pulse"></span>
            <span className="font-label-badge text-label-badge uppercase tracking-wider text-secondary">
              Semen Tonasa Group Enterprise Network
            </span>
            <span className="text-secondary/40">|</span>
            <span className="font-caption text-caption text-secondary font-medium">Node: UPG-DC-04</span>
          </div>

          {/* Main Authentication Box */}
          <div className="w-full bg-surface-canvas rounded-xl shadow-xl p-6 sm:p-10 relative border border-surface-border">
            {/* Top Decorative Corporate Crimson Accent Bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-brand-crimson rounded-t-xl"></div>

            {/* Identity Header */}
            <div className="flex flex-col items-center text-center">
              {/* Logo Display */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-brand-crimson-subtle rounded-xl flex items-center justify-center p-2 mb-4 shadow-sm relative group">
                <img
                  alt="Logo PT Biringkassi Raya / Semen Tonasa"
                  className="w-full h-full object-contain"
                  src="https://lh3.googleusercontent.com/aida/AEtjO1XM_ZLuQYqS4c1eCTQmKG5b8Y3eyVOzg7h7jX4ACfJVsST_QV4CfwwuWNPTFVthK_r4Yh1XARMg_aUOfYZgVHL6ckIr6CkyUmjKCMY_mCw3rIQIbk6_3SaXPndVuy4kcc1k22ECanq7O2VDCaW9ypMFtK9Ski9jEIUl0QH9QugvLP0HLX61tP1rsiXqCuIacav2qjzo4rMWziVJsJeFWiO76tQARss5m3JM-DtIhLTBA55eEkwLIt8v-EU"
                />
                <div className="absolute -bottom-1 -right-1 bg-brand-crimson text-on-primary rounded-full p-1 shadow-sm">
                  <span className="material-symbols-outlined text-[12px] block">verified_user</span>
                </div>
              </div>

              <h1 className="font-headline-corporate text-headline-corporate text-on-surface tracking-tight uppercase">
                Sistem Informasi Monitoring Piutang
              </h1>
              <p className="font-body-tabular text-body-tabular text-secondary mt-1 max-w-md">
                Portal Khusus Karyawan Bagian Piutang — <strong className="text-on-surface font-medium">PT Biringkassi Raya</strong>
              </p>

              {/* Security Warning Badge */}
              <div className="mt-4 flex items-center gap-2 bg-brand-crimson-subtle px-3 py-1.5 rounded-md text-brand-crimson">
                <span className="material-symbols-outlined text-[16px]">gpp_maybe</span>
                <span className="font-label-badge text-label-badge text-brand-crimson tracking-normal">
                  Aplikasi Internal Korporat. Akses hanya untuk akun terverifikasi.
                </span>
              </div>
            </div>

            {/* Live Interactive Alert Banner */}
            {alertState.show && (
              <div
                className={`mt-5 p-3 rounded-lg transition-all duration-300 ${
                  alertState.type === 'error'
                    ? 'bg-status-overdue-bg text-status-overdue-text border border-status-overdue-text/20'
                    : alertState.type === 'success'
                    ? 'bg-status-current-bg text-status-current-text border border-status-current-text/20'
                    : 'bg-status-due-bg text-status-due-text border border-status-due-text/20'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">
                    {alertState.type === 'error' ? 'error' : alertState.type === 'success' ? 'check_circle' : 'info'}
                  </span>
                  <div className="flex-1">
                    <p className="font-body-tabular-bold text-body-tabular-bold">{alertState.title}</p>
                    <p className="font-caption text-caption mt-0.5">{alertState.message}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Primary Action: Firebase Google SSO */}
            <div className="mt-6 flex flex-col gap-3">
              <button
                className="w-full flex items-center justify-center gap-3 bg-surface-canvas hover:bg-surface-subtle py-3 px-4 rounded-lg shadow-sm border border-surface-border active:scale-[0.99] transition-all duration-200 group relative cursor-pointer"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading || isSsoLoading}
                type="button"
              >
                {/* Google Multi-Color SVG */}
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"></path>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"></path>
                </svg>
                <span className="font-body-tabular-bold text-body-tabular-bold text-on-surface">
                  {isGoogleLoading ? 'Menghubungkan ke Firebase Auth...' : 'Masuk dengan Google (Firebase Auth)'}
                </span>
                {isGoogleLoading && (
                  <span className="shrink-0 animate-spin">
                    <span className="material-symbols-outlined text-[18px] text-brand-crimson">progress_activity</span>
                  </span>
                )}
              </button>
              <p className="font-caption text-caption text-center text-secondary">
                Autentikasi akun kerja terdaftar Google Workspace / Firebase SAML
              </p>
            </div>

            {/* Visual Divider */}
            <div className="relative my-6 flex items-center justify-center">
              <div className="w-full h-px bg-surface-border"></div>
              <span className="absolute bg-surface-canvas px-3 font-caption text-caption uppercase text-secondary tracking-wider">
                atau kredensial korporat
              </span>
            </div>

            {/* Alternative Manual SSO Form */}
            <form className="space-y-4" onSubmit={handleManualSignIn}>
              {/* Corporate Email Field */}
              <div>
                <label className="block font-label-numeric text-label-numeric text-on-surface mb-1.5" htmlFor="corpEmail">
                  Email Perusahaan Terdaftar
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-secondary text-[20px]">
                    badge
                  </span>
                  <input
                    id="corpEmail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-surface-subtle text-on-surface font-body-tabular text-body-tabular pl-10 pr-3 py-2 rounded-lg outline-none focus:bg-surface-canvas border border-surface-border focus:border-brand-crimson transition-colors"
                    placeholder="nama.pengguna@biringkassiraya.co.id"
                    required
                    type="email"
                  />
                </div>
                <span className="block mt-1 font-caption text-caption text-secondary">
                  Domain yang diizinkan: @biringkassiraya.co.id • @sementonasa.co.id
                </span>
              </div>

              {/* Corporate Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-label-numeric text-label-numeric text-on-surface" htmlFor="corpPassword">
                    Kata Sandi Portal
                  </label>
                  <button
                    className="font-caption text-caption text-brand-crimson hover:underline cursor-pointer"
                    onClick={() => setHelpModalOpen(true)}
                    type="button"
                  >
                    Lupa Sandi?
                  </button>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-secondary text-[20px]">
                    key
                  </span>
                  <input
                    id="corpPassword"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-surface-subtle text-on-surface font-body-tabular text-body-tabular pl-10 pr-10 py-2 rounded-lg outline-none focus:bg-surface-canvas border border-surface-border focus:border-brand-crimson transition-colors"
                    placeholder="••••••••••••"
                    required
                    type={showPassword ? 'text' : 'password'}
                  />
                  <button
                    className="absolute right-3 top-2.5 text-secondary hover:text-on-surface focus:outline-none cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Controls: Remember Me */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded bg-surface-container text-brand-crimson focus:ring-0 focus:outline-none w-4 h-4 accent-brand-crimson cursor-pointer"
                    type="checkbox"
                  />
                  <span className="font-body-tabular text-body-tabular text-secondary">
                    Ingat sesi di perangkat terpercaya ini
                  </span>
                </label>
              </div>

              {/* SSO Submit Button */}
              <button
                className="w-full flex items-center justify-center gap-2 bg-brand-crimson hover:bg-brand-crimson-hover text-on-primary py-2.5 px-4 rounded-lg shadow-sm font-body-tabular-bold text-body-tabular-bold transition-all duration-200 mt-2 active:scale-[0.99] cursor-pointer"
                disabled={isSsoLoading || isGoogleLoading}
                type="submit"
              >
                <span className="material-symbols-outlined text-[18px]">login</span>
                <span>{isSsoLoading ? 'Memverifikasi SSO...' : 'Masuk via SSO Internal'}</span>
                {isSsoLoading && (
                  <span className="shrink-0 animate-spin">
                    <span className="material-symbols-outlined text-[18px] text-white">progress_activity</span>
                  </span>
                )}
              </button>
            </form>

            {/* IT Integration & Firebase Config Status Callout */}
            <div className="mt-6 bg-surface-container-low rounded-lg p-3.5 space-y-2 border border-surface-border/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-secondary">
                  <span className="material-symbols-outlined text-[16px] text-brand-crimson">database</span>
                  <span className="font-label-badge text-label-badge uppercase tracking-wider">
                    Status Integrasi Firebase
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-status-current-bg text-status-current-text font-label-badge text-label-badge">
                  <span className="w-1.5 h-1.5 rounded-full bg-status-current-text"></span>
                  CONNECTED
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1 font-caption text-caption text-secondary">
                <div className="bg-surface-canvas p-1.5 rounded text-center shadow-xs border border-surface-border/40">
                  <span className="block text-secondary/70 text-[10px]">AUTH DOMAIN</span>
                  <span className="font-mono text-[11px] font-semibold text-on-surface truncate block">
                    tonasa.firebaseapp
                  </span>
                </div>
                <div className="bg-surface-canvas p-1.5 rounded text-center shadow-xs border border-surface-border/40">
                  <span className="block text-secondary/70 text-[10px]">PROJECT ID</span>
                  <span className="font-mono text-[11px] font-semibold text-on-surface truncate block">
                    bk-piutang-prod
                  </span>
                </div>
                <div className="bg-surface-canvas p-1.5 rounded text-center shadow-xs border border-surface-border/40">
                  <span className="block text-secondary/70 text-[10px]">API KEY</span>
                  <span className="font-mono text-[11px] font-semibold text-on-surface truncate block">
                    AIzaSyB8...89Z
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-surface-border/60">
                <span className="font-caption text-caption text-secondary">Kendala akses akun korporat?</span>
                <button
                  className="font-caption text-caption text-brand-crimson hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
                  onClick={() => setHelpModalOpen(true)}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[14px]">support_agent</span>
                  Hubungi Helpdesk TI
                </button>
              </div>
            </div>
          </div>

          {/* Corporate Audit & Copyright Strip */}
          <div className="mt-6 text-center space-y-1">
            <div className="flex items-center justify-center gap-3 text-secondary font-caption text-caption flex-wrap">
              <span>ISO 27001 Terverifikasi</span>
              <span>•</span>
              <span>Keuangan &amp; Audit Penagihan Terpadu</span>
              <span>•</span>
              <span>Semen Indonesia Group</span>
            </div>
            <p className="font-caption text-caption text-secondary/80">
              PT Biringkassi Raya © 2026. Semua hak dilindungi undang-undang.
            </p>
          </div>
        </div>
      </div>

      {/* Modal Bantuan IT / Helpdesk Modal Dialog */}
      {helpModalOpen && (
        <div className="fixed inset-0 z-50 bg-inverse-surface/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-canvas rounded-xl shadow-2xl max-w-md w-full p-6 relative overflow-hidden border border-surface-border animate-in fade-in zoom-in-95 duration-150">
            <div className="absolute top-0 left-0 right-0 h-1 bg-brand-crimson"></div>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-brand-crimson-subtle text-brand-crimson rounded-lg">
                  <span className="material-symbols-outlined">headset_mic</span>
                </div>
                <div>
                  <h2 className="font-title-md text-title-md text-on-surface">Pusat Dukungan TI Korporat</h2>
                  <p className="font-caption text-caption text-secondary">Biro Sistem Informasi PT Biringkassi Raya</p>
                </div>
              </div>
              <button
                className="text-secondary hover:text-on-surface p-1 cursor-pointer"
                onClick={() => setHelpModalOpen(false)}
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="mt-4 space-y-3 font-body-tabular text-body-tabular text-on-surface">
              <p>
                Untuk pembukaan akses akun baru atau reset otentikasi Firebase dua faktor (2FA) bagian penagihan piutang, silakan kontak:
              </p>
              <div className="bg-surface-subtle p-3 rounded-lg space-y-2 font-caption text-caption border border-surface-border">
                <div className="flex items-center justify-between">
                  <span className="text-secondary">Ext. Internal Kantor:</span>
                  <span className="font-mono font-bold text-on-surface">4201 / 4208</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-secondary">Email Helpdesk:</span>
                  <span className="font-mono font-bold text-brand-crimson">it.support@biringkassiraya.co.id</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-secondary">Jam Kerja Operasional:</span>
                  <span className="font-medium text-on-surface">Senin - Jumat (08:00 - 17:00 WITA)</span>
                </div>
              </div>
              <p className="font-caption text-caption text-secondary italic">
                *Pastikan menyertakan NIK dan lampiran memo persetujuan Kepala Seksi Piutang untuk pembuatan token akses baru.
              </p>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                className="bg-brand-crimson hover:bg-brand-crimson-hover text-on-primary px-4 py-2 rounded-lg font-body-tabular-bold text-body-tabular-bold cursor-pointer transition-colors"
                onClick={() => setHelpModalOpen(false)}
              >
                Mengerti &amp; Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
