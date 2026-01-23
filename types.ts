
export enum Tab {
  APORTES_JAR = 'APORTES_JAR',
  PROGRESSO = 'PROGRESSO',
  PROGRESSO_JM = 'PROGRESSO_JM',
  PROGRESSO_J200 = 'PROGRESSO_J200',
  SAQUES = 'SAQUES',
  DASHBOARD = 'DASHBOARD'
}

export type PartnerName = 'JOEY' | 'ALEX' | 'RUBINHO' | 'MICAEL' | 'TAX';

export interface Transaction {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL';
  partner: PartnerName;
  amountBrl: number;
  amountCents: number; 
  rateSnapshot: number;
  date: string;
  timestamp: number;
}

export interface DailyRecord {
  date: string;       
  balanceUsd: number; 
  rate: number;       
  centsBrl: number;   
  investedUsd?: number; 
}

export interface Drafts {
  roadmap: {
    JOEY: string;
    ALEX: string;
    RUBINHO: string;
    JOEY_DATE: string;
    ALEX_DATE: string;
    RUBINHO_DATE: string;
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
  progress_jm: {
    additionalDeposit: string;
  };
  progress_j200: {
    additionalDeposit: string;
  };
}

export interface AppState {
  dollarRate: number;
  transactions: Transaction[];
  // Progress Tab 1 (JAR)
  startDate: string;
  startDepositUsd: number;
  currentDate: string;
  currentBalanceUsd: number;
  dailyHistory: DailyRecord[];
  // Progress Tab 2 (JM)
  startDate_jm: string;
  startDepositUsd_jm: number;
  currentDate_jm: string;
  currentBalanceUsd_jm: number;
  dailyHistory_jm: DailyRecord[];
  // Progress Tab 3 (J200)
  startDate_j200: string;
  startDepositUsd_j200: number;
  currentDate_j200: string;
  currentBalanceUsd_j200: number;
  dailyHistory_j200: DailyRecord[];
  
  lastUpdated: number; 
  drafts: Drafts;
}

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
