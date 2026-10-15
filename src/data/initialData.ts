import { Invoice, PromiseRecord, CustomerMaster, AuditLog, UserSession } from '../types';

export function formatIDR(amount: number): string {
  return 'Rp ' + Number(amount || 0).toLocaleString('id-ID');
}

export function calculateAgingDays(dueDateStr: string, cutoffDateStr?: string): number {
  if (!dueDateStr) return 0;
  const due = new Date(dueDateStr);
  const ref = cutoffDateStr ? new Date(cutoffDateStr) : new Date();
  due.setHours(0, 0, 0, 0);
  ref.setHours(0, 0, 0, 0);
  const diffTime = ref.getTime() - due.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

export const defaultUserSession: UserSession = {
  name: 'Admin Keuangan',
  email: 'karyawan@biringkassiraya.co.id',
  role: 'Staf Piutang & Rekonsiliasi',
  department: 'Divisi Piutang & Keuangan',
  vlan: '10.24.12.80 (VLAN Finance Tonasa)',
  isLoggedIn: true,
};

export const sampleInvoices: Invoice[] = [
  {
    id: 'INV-1',
    no: 'INV-BKR/2026/0891',
    spk: 'SPK-TONASA-049',
    customer: 'PT Semen Tonasa (Pabrik 4 / Holding)',
    customerCode: 'CUST-001',
    issueDate: '2026-08-10',
    dueDate: '2026-09-10',
    amount: 1450000000,
    paid: 600000000,
    balance: 850000000,
    status: 'overdue',
    category: 'internal',
    region: 'sulsel',
    followUpNote: 'Janji bayar via bilyet giro tgl 20 Okt 2026',
    lastFollowUpDate: '2026-10-14'
  },
  {
    id: 'INV-2',
    no: 'INV-BKR/2026/0912',
    spk: 'DO-DIST-771',
    customer: 'CV Cahaya Tonasa Pangkep',
    customerCode: 'CUST-0142',
    issueDate: '2026-09-01',
    dueDate: '2026-10-02',
    amount: 2120000000,
    paid: 1800000000,
    balance: 320000000,
    status: 'overdue',
    category: 'zak',
    region: 'sulsel',
    followUpNote: 'Pembayaran terjadwal via auto-debet Bank Mandiri',
    lastFollowUpDate: '2026-10-12'
  },
  {
    id: 'INV-3',
    no: 'INV-BKR/2026/0884',
    spk: 'KTR-BUMN-2026/91',
    customer: 'PT Nusa Konstruksi Nusantara (Proyek Kereta Api Sulsel)',
    customerCode: 'CUST-0084',
    issueDate: '2026-06-15',
    dueDate: '2026-07-15',
    amount: 5890000000,
    paid: 2200000000,
    balance: 3690000000,
    status: 'severe',
    category: 'proyek',
    region: 'sulsel',
    followUpNote: 'Surat Teguran II (SPP-2) telah dilayangkan ke PPK Satker Sulsel',
    lastFollowUpDate: '2026-10-08'
  },
  {
    id: 'INV-4',
    no: 'INV-BKR/2026/0955',
    spk: 'DO-CURAH-019',
    customer: 'UD Biringkassi Megah Sejahtera',
    customerCode: 'CUST-0210',
    issueDate: '2026-08-01',
    dueDate: '2026-08-31',
    amount: 780000000,
    paid: 350000000,
    balance: 430000000,
    status: 'overdue',
    category: 'curah',
    region: 'sulsel',
    followUpNote: 'Disepakati restrukturisasi 3 tahap cicilan',
    lastFollowUpDate: '2026-10-10'
  },
  {
    id: 'INV-5',
    no: 'INV-BKR/2026/0989',
    spk: 'PO-SEMEN-112',
    customer: 'PT Bosowa Trans Mandiri',
    customerCode: 'CUST-0305',
    issueDate: '2026-10-01',
    dueDate: '2026-10-16',
    amount: 210000000,
    paid: 0,
    balance: 210000000,
    status: 'due',
    category: 'curah',
    region: 'sulteng',
    followUpNote: 'Reminder H-2 jadwal jatuh tempo penagihan via email',
    lastFollowUpDate: '2026-10-14'
  },
  {
    id: 'INV-6',
    no: 'INV-BKR/2026/1002',
    spk: 'SPK-BKR-021',
    customer: 'PT Maruki Internasional Wood Pangkep',
    customerCode: 'CUST-0306',
    issueDate: '2026-09-10',
    dueDate: '2026-10-10',
    amount: 410000000,
    paid: 410000000,
    balance: 0,
    status: 'settled',
    category: 'zak',
    region: 'sulsel',
    followUpNote: 'Faktur telah direkonsiliasi lunas 100%',
    lastFollowUpDate: '2026-10-11'
  }
];

export const samplePromises: PromiseRecord[] = [
  {
    id: 'P-2026-0001',
    invoice: 'INV-BKR/2026/0891',
    partner: 'PT Semen Tonasa (Pabrik 4 / Holding)',
    date: '2026-10-14',
    amount: 148500000,
    officer: 'Admin Keuangan',
    channel: 'Telepon Desk Collection',
    status: 'Jatuh Tempo Hari Ini',
    notes: 'Konfirmasi Bagian Keuangan Tonasa: Giro dijanjikan kliring sore ini pk 15.00 WITA.'
  },
  {
    id: 'P-2026-0002',
    invoice: 'INV-BKR/2026/0912',
    partner: 'CV Cahaya Tonasa Pangkep',
    date: '2026-10-10',
    amount: 82350000,
    officer: 'Koordinator Lapangan',
    channel: 'WhatsApp Resmi Biringkassi',
    status: 'Ingkar Janji / Terlewat',
    notes: 'Dihubungi 3 kali via WA tidak ada respon. SP-1 diterbitkan.'
  },
  {
    id: 'P-2026-0003',
    invoice: 'INV-BKR/2026/0955',
    partner: 'UD Biringkassi Megah Sejahtera',
    date: '2026-10-20',
    amount: 143000000,
    officer: 'Supervisor AR',
    channel: 'Kunjungan Lapangan / Auditor',
    status: 'Menunggu Pembayaran',
    notes: 'Hasil kunjungan toko: disepakati termin transfer bertahap dua kali.'
  },
  {
    id: 'P-2026-0004',
    invoice: 'INV-BKR/2026/0989',
    partner: 'PT Bosowa Trans Mandiri',
    date: '2026-10-08',
    amount: 210000000,
    officer: 'Admin Keuangan',
    channel: 'Surat Teguran / Somasi',
    status: 'Terealisasi Lunas',
    notes: 'Pelunasan berhasil dikonfirmasi via Bank Mandiri Tonasa Hub.'
  }
];

export const sampleCustomers: CustomerMaster[] = [
  {
    code: 'BP-TN-400192',
    name: 'PT Semen Tonasa (Pabrik 4 / Holding)',
    category: 'Rekanan Semen Curah',
    npwp: '01.001.621.4-801.000',
    phone: '0410-21211 (Ext. Keuangan)',
    creditLimit: 15000000000,
    top: 'TOP 30 Hari Kalender',
    address: 'Desa Biringere, Kec. Bungoro, Kab. Pangkep, Sulawesi Selatan',
    region: 'Sulawesi Selatan (Pangkep / Makassar)',
    status: 'Aktif',
    pic: 'Bpk. Hamzah (Finance Holding)'
  },
  {
    code: 'BP-TN-400208',
    name: 'CV Cahaya Tonasa Pangkep',
    category: 'Distributor Semen Zak',
    npwp: '02.432.891.2-805.000',
    phone: '0811-420-998 (Hj. Maimunah)',
    creditLimit: 3000000000,
    top: 'TOP 14 Hari Kalender',
    address: 'Jl. Poros Tonasa - Pangkep No. 18, Sulawesi Selatan',
    region: 'Sulawesi Selatan (Pangkep / Makassar)',
    status: 'Aktif',
    pic: 'Hj. Maimunah (Owner)'
  },
  {
    code: 'BP-TN-400311',
    name: 'PT Nusa Konstruksi Nusantara',
    category: 'Kontraktor Proyek',
    npwp: '01.889.301.7-051.000',
    phone: '0812-9011-882 (Ir. Bambang)',
    creditLimit: 7500000000,
    top: 'TOP 45 Hari Kalender',
    address: 'Gedung Grha NKN Lt. 4, Jl. A.P. Pettarani Makassar',
    region: 'Sulawesi Selatan (Pangkep / Makassar)',
    status: 'Penundaan Plafon',
    pic: 'Ir. Bambang (Project Director)'
  },
  {
    code: 'BP-TN-400405',
    name: 'UD Biringkassi Megah Sejahtera',
    category: 'Distributor Semen Zak',
    npwp: '03.771.290.4-802.000',
    phone: '0852-4412-3000 (Pak Anwar)',
    creditLimit: 1200000000,
    top: 'TOP 30 Hari Kalender',
    address: 'Komp. Pasar Sentral Pangkajene Blok B No. 4',
    region: 'Sulawesi Selatan (Pangkep / Makassar)',
    status: 'Aktif',
    pic: 'Pak Anwar (Pengelola Toko)'
  },
  {
    code: 'BP-TN-400512',
    name: 'PT Bosowa Trans Mandiri',
    category: 'Rekanan Semen Curah',
    npwp: '01.321.455.9-804.000',
    phone: '0411-871200',
    creditLimit: 4000000000,
    top: 'TOP 30 Hari Kalender',
    address: 'Jl. Urip Sumoharjo No. 84, Makassar',
    region: 'Sulawesi Selatan (Pangkep / Makassar)',
    status: 'Aktif',
    pic: 'Ibu Ratna (Logistik & Kasir)'
  }
];

export const sampleAuditLogs: AuditLog[] = [
  {
    id: 'AUD-20261014-001',
    timestamp: '14 Okt 2026 09:30:14',
    user: 'karyawan@biringkassiraya.co.id',
    role: 'Staf Piutang',
    module: 'Operasional Piutang',
    action: 'Penyesuaian Janji Bayar',
    object: 'INV-2026-BR-0891 (PT Semen Tonasa)',
    ip: '10.24.12.80',
    agent: 'Chrome / Windows 11',
    level: 'INFO',
    status: 'Berhasil',
    payload: {
      invoice: 'INV-2026-BR-0891',
      nominal: 'Rp 1.450.000.000',
      previous_promise: '10 Okt 2026',
      new_promise: '20 Okt 2026',
      pic_pelanggan: 'Bpk. Hamzah (Logistik Tonasa)',
      hash: 'a4f8b9112e43f019c'
    }
  },
  {
    id: 'AUD-20261014-002',
    timestamp: '14 Okt 2026 09:15:02',
    user: 'admin.erp@biringkassiraya.co.id',
    role: 'Admin Sistem',
    module: 'Impor & Ekspor Berkas',
    action: 'Impor Berkas Rekonsiliasi SAP',
    object: 'SAP_AR_TONASA_202610.xlsx',
    ip: '10.24.12.15',
    agent: 'Automated ERP Agent',
    level: 'INFO',
    status: 'Berhasil',
    payload: {
      file_name: 'SAP_AR_TONASA_202610.xlsx',
      rows_processed: 342,
      matched: 340,
      flagged_discrepancies: 2,
      hash: '7bc32f9901aa8e09'
    }
  },
  {
    id: 'AUD-20261014-003',
    timestamp: '14 Okt 2026 08:45:21',
    user: 'karyawan@biringkassiraya.co.id',
    role: 'Staf Piutang',
    module: 'Keamanan & Sesi Login',
    action: 'Autentikasi Firebase Sukses',
    object: 'Sesi Portal Piutang',
    ip: '10.24.12.80',
    agent: 'Chrome 129.0 / Win64',
    level: 'INFO',
    status: 'Berhasil',
    payload: {
      auth_provider: 'Firebase JWT',
      token_expiry: '8 Jam',
      vlan: 'VLAN-FIN-BR',
      mfa_verified: true
    }
  },
  {
    id: 'AUD-20261014-004',
    timestamp: '14 Okt 2026 08:02:11',
    user: 'security.daemon@tonasa.id',
    role: 'Automated Guard',
    module: 'Integritas Sistem',
    action: 'Verifikasi Hash SHA-256 Tabel Piutang',
    object: 'Master Ledger Tonasa P-01',
    ip: '192.168.100.4',
    agent: 'Tonasa Integrity Daemon',
    level: 'INFO',
    status: 'Valid',
    payload: {
      ledger_snapshot: 'LS-2026-10-Q4',
      hash_verified: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      discrepancy_count: 0
    }
  }
];
