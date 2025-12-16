
export enum Tab {
  ROADMAP = 'ROADMAP',
  PROGRESSO = 'PROGRESSO',
  SAQUES = 'SAQUES',
  DASHBOARD = 'DASHBOARD'
}

export type PartnerName = 'JOEY' | 'ALEX' | 'RUBINHO' | 'TAX';

export interface Transaction {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL';
  partner: PartnerName;
  amountBrl: number;
  amountCents: number; // The calculated unit based on rate at time of entry (or calculated)
  rateSnapshot: number;
  date: string;
  timestamp: number;
}

export interface DailyRecord {
  date: string;       // YYYY-MM-DD
  balanceUsd: number; // Snapshot of balance
  rate: number;       // Snapshot of dollar rate
  centsBrl: number;   // Calculated score at that moment
  investedUsd?: number; // Snapshot of total deposited (Capital Principal) at that moment
}

export interface Drafts {
  roadmap: {
    JOEY: string;
    ALEX: string;
    RUBINHO: string;
  };
  withdrawals: {
    calcAmount: string;
    calcIrpf: string;
    calcPeople: string;
    regJoey: string;
    regAlex: string;
    regRubinho: string;
    regTax: string;
  };
  progress: {
    additionalDeposit: string;
  };
}

export interface AppState {
  dollarRate: number;
  transactions: Transaction[];
  // Progress Tab Specifics
  startDate: string;
  startDepositUsd: number;
  currentDate: string;
  currentBalanceUsd: number;
  dailyHistory: DailyRecord[]; // New field for snapshots
  lastUpdated: number; // Timestamp for sync conflict resolution
  drafts: Drafts;
}

// Alias solicitado para definir o estado global compartilhado
export type DashboardState = AppState;

export interface WithdrawalCalculation {
  taxAmount: number;
  netAmount: number;
  perPerson: number;
  centsToDebit: number;
}

export interface DatabaseConfig {
  url: string;
  key: string;
  connected: boolean;
  lastSync?: string;
}