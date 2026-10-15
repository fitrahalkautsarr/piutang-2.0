export type ScreenType =
  | 'login'
  | 'dashboard-ringkasan'
  | 'daftar-piutang-invoice'
  | 'analisis-umur-piutang'
  | 'janji-bayar-tindak-lanjut'
  | 'impor-data-rekonsiliasi'
  | 'laporan-operasional'
  | 'log-aktivitas-audit'
  | 'master-data-pengguna';

export interface Invoice {
  id: string;
  no: string;
  spk?: string;
  customer: string;
  customerCode?: string;
  issueDate: string; // YYYY-MM-DD
  dueDate: string;   // YYYY-MM-DD
  amount: number;
  paid: number;
  balance: number;
  status: 'current' | 'due' | 'overdue' | 'severe' | 'promise' | 'settled';
  category?: 'zak' | 'curah' | 'proyek' | 'internal';
  region?: 'sulsel' | 'sulbar' | 'sulteng' | 'maluku' | 'papua' | 'kaltim';
  followUpNote?: string;
  lastFollowUpDate?: string;
}

export interface PromiseRecord {
  id: string;
  invoice: string;
  partner: string;
  date: string; // Target promise date
  amount: number;
  officer: string;
  channel: string;
  status: 'Menunggu Pembayaran' | 'Jatuh Tempo Hari Ini' | 'Terpenuhi Sebagian' | 'Terealisasi Lunas' | 'Ingkar Janji / Terlewat';
  notes: string;
}

export interface CustomerMaster {
  code: string;
  name: string;
  category: 'Distributor Semen Zak' | 'Rekanan Semen Curah' | 'Kontraktor Proyek' | 'BUMN Karya';
  npwp: string;
  phone: string;
  creditLimit: number;
  top: string; // Terms of payment (e.g., TOP 30 Hari)
  address: string;
  region: string;
  status: 'Aktif' | 'Penundaan Plafon' | 'Ditangguhkan';
  pic: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  module: string;
  action: string;
  object: string;
  ip: string;
  agent: string;
  level: 'INFO' | 'PERINGATAN' | 'KRITIS';
  status: string;
  payload?: Record<string, any>;
}

export interface UserSession {
  name: string;
  email: string;
  role: string;
  department: string;
  vlan: string;
  isLoggedIn: boolean;
}
