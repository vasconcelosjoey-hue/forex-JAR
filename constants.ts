
import { AppState } from "./types";

export const INITIAL_STATE: AppState = {
  dollarRate: 5.00,
  transactions: [],
  startDate: new Date().toISOString().split('T')[0],
  startDepositUsd: 0,
  currentDate: new Date().toISOString().split('T')[0],
  currentBalanceUsd: 0,
  dailyHistory: [],
  // JM Init
  startDate_jm: new Date().toISOString().split('T')[0],
  startDepositUsd_jm: 0,
  currentDate_jm: new Date().toISOString().split('T')[0],
  currentBalanceUsd_jm: 0,
  dailyHistory_jm: [],
  // J200 Init
  startDate_j200: new Date().toISOString().split('T')[0],
  startDepositUsd_j200: 0,
  currentDate_j200: new Date().toISOString().split('T')[0],
  currentBalanceUsd_j200: 0,
  dailyHistory_j200: [],

  lastUpdated: 0,
  drafts: {
    roadmap: { JOEY: '', ALEX: '', RUBINHO: '' },
    withdrawals: {
      calcAmount: '',
      calcIrpf: '15',
      calcPeople: '3',
      regJoey: '',
      regAlex: '',
      regRubinho: '',
      regTax: ''
    },
    progress: {
      additionalDeposit: ''
    },
    progress_jm: {
      additionalDeposit: ''
    },
    progress_j200: {
      additionalDeposit: ''
    }
  }
};

export const CHECKPOINTS = [
  { label: 'START', value: 0 },
  { label: '5K', value: 5000 },
  { label: '10K', value: 10000 },
  { label: '25K', value: 25000 },
  { label: '40K', value: 40000 },
  { label: '50K', value: 50000 },
  { label: '55K', value: 55000 },
];

export const COLORS = {
  bg: '#0a0a0a',
  card: '#161616',
  primary: '#FF6F00',
  success: '#00e676',
  danger: '#ff4444',
  gold: '#ffd700',
  purple: '#d500f9',
};
