
export enum Tab {
  APORTES_JAR = 'APORTES_JAR',
  PROGRESSO = 'PROGRESSO',
  PROGRESSO_10K = 'PROGRESSO_10K',
  PROGRESSO_200USD = 'PROGRESSO_200USD',
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
  valuationBaseBrl: number; // Novo
  // Progress Tab 2 (10K)
  startDate_jm: string;
  startDepositUsd_jm: number;
  currentDate_jm: string;
  currentBalanceUsd_jm: number;
  dailyHistory_jm: DailyRecord[];
  valuationBaseBrl_jm: number; // Novo
  // Progress Tab 3 (200 USD)
  startDate_j200: string;
  startDepositUsd_j200: number;
  currentDate_j200: string;
  currentBalanceUsd_j200: number;
  dailyHistory_j200: DailyRecord[];
  valuationBaseBrl_j200: number; // Novo
  
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
