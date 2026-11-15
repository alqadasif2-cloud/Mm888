import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Account, SymbolQuote, Candle, Position, Deal, MessageItem, TabType, Timeframe } from '../types/mt5';

interface TradingContextType {
  activeAccount: Account;
  accounts: Account[];
  setActiveAccount: (account: Account) => void;
  quotes: SymbolQuote[];
  selectedSymbol: string;
  setSelectedSymbol: (symbol: string) => void;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  timeframe: Timeframe;
  setTimeframe: (tf: Timeframe) => void;
  candles: Candle[];
  positions: Position[];
  historyDeals: Deal[];
  openTrade: (symbol: string, type: 'buy' | 'sell', lots: number, sl?: number, tp?: number) => boolean;
  closePosition: (positionId: string) => void;
  closeAllPositions: () => void;
  modifyPosition: (positionId: string, sl?: number, tp?: number) => void;
  messages: MessageItem[];
  markMessageAsRead: (id: string) => void;
  unreadCount: number;
  totalProfit: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  openOrderModal: (symbol?: string) => void;
  orderModalSymbol: string | null;
  closeOrderModal: () => void;
  modifyingPosition: Position | null;
  setModifyingPosition: (pos: Position | null) => void;
  modifyingFocus: 'sl' | 'tp' | null;
  setModifyingFocus: (focus: 'sl' | 'tp' | null) => void;
  accountInfoModalOpen: boolean;
  setAccountInfoModalOpen: (open: boolean) => void;
  otpModalOpen: boolean;
  setOtpModalOpen: (open: boolean) => void;
  addAccountModalOpen: boolean;
  setAddAccountModalOpen: (open: boolean) => void;
  addNewAccount: (account: Partial<Account>) => void;
  deleteAccount: (accountId: string) => void;
  isLiveConnected: boolean;
}

const INITIAL_ACCOUNTS: Account[] = [
  {
    id: 'exness-real-33',
    name: 'Standard',
    broker: 'Exness Technologies Ltd',
    server: 'Exness-MT5Real33',
    accountNumber: '252622825',
    balance: 261.20,
    currency: 'USD',
    type: 'real',
    leverage: '1:2000',
    logoType: 'exness',
    lastKnownLabel: 'Access point'
  },
  {
    id: 'exness-trial-16',
    name: 'Standard',
    broker: 'Exness Technologies Ltd',
    server: 'Exness-MT5Trial16',
    accountNumber: '472970564',
    balance: 1029.35,
    currency: 'USD',
    type: 'demo',
    leverage: '1:200',
    logoType: 'exness',
    lastKnownLabel: 'آخر ما عرف · USD'
  },
  {
    id: 'metaquotes-demo',
    name: 'Eslam Alqadasi',
    broker: 'MetaQuotes Ltd.',
    server: 'MetaQuotes-Demo',
    accountNumber: '5057410470',
    balance: 96818.02,
    currency: 'USD',
    type: 'demo',
    leverage: '1:100',
    logoType: 'metaquotes',
    lastKnownLabel: 'آخر ما عرف · USD'
  }
];

const INITIAL_QUOTES: SymbolQuote[] = [
  {
    symbol: 'BTCUSDm',
    name: 'Bitcoin vs US Dollar',
    digits: 2,
    bid: 63950.98,
    ask: 63957.38,
    spread: 640,
    high: 68375.71,
    low: 61802.34,
    time: '10:44:07',
    change: -1.24,
    tickDirection: 'up',
    category: 'crypto',
    contractSize: 1,
    source: 'Binance Live'
  },
  {
    symbol: 'XAUUSDm',
    name: 'Gold vs US Dollar',
    digits: 3,
    bid: 3882.823,
    ask: 3883.063,
    spread: 240,
    high: 3915.400,
    low: 3862.100,
    time: '10:44:07',
    change: 0.57,
    tickDirection: 'up',
    category: 'metals',
    contractSize: 100,
    source: 'COMEX Live'
  },
  {
    symbol: 'XAGUSDm',
    name: 'Silver vs US Dollar',
    digits: 3,
    bid: 48.705,
    ask: 48.730,
    spread: 25,
    high: 53.134,
    low: 48.210,
    time: '10:44:07',
    change: -1.42,
    tickDirection: 'down',
    category: 'metals',
    contractSize: 5000,
    source: 'COMEX Live'
  },
  {
    symbol: 'ETHUSDm',
    name: 'Ethereum vs US Dollar',
    digits: 2,
    bid: 2485.40,
    ask: 2486.90,
    spread: 150,
    high: 2540.00,
    low: 2410.00,
    time: '10:44:05',
    change: 0.84,
    tickDirection: 'up',
    category: 'crypto',
    contractSize: 1,
    source: 'Binance Live'
  },
  {
    symbol: 'BCHUSDm',
    name: 'Bitcoin Cash vs US Dollar',
    digits: 2,
    bid: 368.25,
    ask: 369.10,
    spread: 85,
    high: 375.80,
    low: 358.40,
    time: '10:44:02',
    change: 0.45,
    tickDirection: 'up',
    category: 'crypto',
    contractSize: 1
  },
  {
    symbol: 'BTCJPYm',
    name: 'Bitcoin vs Japanese Yen',
    digits: 0,
    bid: 9842510,
    ask: 9845120,
    spread: 2610,
    high: 9980000,
    low: 9690000,
    time: '10:44:01',
    change: -0.95,
    tickDirection: 'down',
    category: 'crypto',
    contractSize: 1
  },
  {
    symbol: 'LTCUSDm',
    name: 'Litecoin vs US Dollar',
    digits: 2,
    bid: 72.45,
    ask: 72.62,
    spread: 17,
    high: 74.10,
    low: 71.20,
    time: '10:44:00',
    change: 0.31,
    tickDirection: 'up',
    category: 'crypto',
    contractSize: 1
  },
  {
    symbol: 'XRPUSDm',
    name: 'Ripple vs US Dollar',
    digits: 4,
    bid: 0.5482,
    ask: 0.5489,
    spread: 7,
    high: 0.5620,
    low: 0.5390,
    time: '10:44:04',
    change: 1.12,
    tickDirection: 'up',
    category: 'crypto',
    contractSize: 100
  },
  {
    symbol: 'ADAUSDm',
    name: 'Cardano vs US Dollar',
    digits: 4,
    bid: 0.3645,
    ask: 0.3652,
    spread: 7,
    high: 0.3710,
    low: 0.3580,
    time: '10:44:00',
    change: -0.28,
    tickDirection: 'down',
    category: 'crypto',
    contractSize: 100
  },
  {
    symbol: 'BNBUSDm',
    name: 'Binance Coin vs US Dollar',
    digits: 2,
    bid: 584.20,
    ask: 584.90,
    spread: 70,
    high: 592.00,
    low: 576.50,
    time: '10:44:03',
    change: 0.65,
    tickDirection: 'up',
    category: 'crypto',
    contractSize: 1
  },
  {
    symbol: 'DOTUSDm',
    name: 'Polkadot vs US Dollar',
    digits: 3,
    bid: 4.382,
    ask: 4.395,
    spread: 13,
    high: 4.490,
    low: 4.290,
    time: '10:44:02',
    change: -0.44,
    tickDirection: 'down',
    category: 'crypto',
    contractSize: 10
  },
  {
    symbol: 'USOILm',
    name: 'WTI Crude Oil vs US Dollar',
    digits: 2,
    bid: 86.68,
    ask: 86.71,
    spread: 3,
    high: 87.80,
    low: 85.90,
    time: '10:44:05',
    change: 0.73,
    tickDirection: 'up',
    category: 'commodities',
    contractSize: 1000,
    source: 'NYMEX Live'
  },
  {
    symbol: 'EURUSDm',
    name: 'Euro vs US Dollar',
    digits: 5,
    bid: 1.08425,
    ask: 1.08437,
    spread: 12,
    high: 1.08740,
    low: 1.08210,
    time: '10:44:07',
    change: -0.05,
    tickDirection: 'down',
    category: 'forex',
    contractSize: 100000
  },
  {
    symbol: 'GBPUSDm',
    name: 'Great Britain Pound vs US Dollar',
    digits: 5,
    bid: 1.26780,
    ask: 1.26795,
    spread: 15,
    high: 1.27150,
    low: 1.26420,
    time: '10:44:06',
    change: 0.18,
    tickDirection: 'up',
    category: 'forex',
    contractSize: 100000
  },
  {
    symbol: 'USDJPYm',
    name: 'US Dollar vs Japanese Yen',
    digits: 3,
    bid: 154.620,
    ask: 154.634,
    spread: 14,
    high: 155.200,
    low: 154.100,
    time: '10:44:05',
    change: 0.32,
    tickDirection: 'up',
    category: 'forex',
    contractSize: 100000
  },
  {
    symbol: 'US30m',
    name: 'Dow Jones Industrial Average',
    digits: 1,
    bid: 39420.5,
    ask: 39423.5,
    spread: 30,
    high: 39650.0,
    low: 39210.0,
    time: '10:44:01',
    change: -0.25,
    tickDirection: 'down',
    category: 'indices',
    contractSize: 1
  }
];

const INITIAL_POSITIONS: Position[] = [
  {
    id: 'pos-btc-1',
    ticket: 2773274125,
    symbol: 'BTCUSDm',
    type: 'buy',
    lots: 0.01,
    openPrice: 63580.00,
    currentPrice: 63950.98,
    sl: 61800.00,
    tp: 66800.00,
    swap: 0.00,
    commission: 0.00,
    profit: 3.71,
    openTime: '2026.11.15 06:15:22',
    accountId: 'exness-real-33'
  },
  {
    id: 'pos-xag-1',
    ticket: 2520554556,
    symbol: 'XAGUSDm',
    type: 'buy',
    lots: 0.01,
    openPrice: 53.134,
    currentPrice: 48.705,
    sl: 47.200,
    tp: 55.800,
    swap: 0.00,
    commission: 0.00,
    profit: -221.45,
    openTime: '2026.10.26 13:57:53',
    accountId: 'exness-real-33'
  },
  {
    id: 'pos-xau-1',
    ticket: 2520554890,
    symbol: 'XAUUSDm',
    type: 'buy',
    lots: 0.01,
    openPrice: 3902.103,
    currentPrice: 3882.823,
    swap: 0.00,
    commission: 0.00,
    profit: -19.28,
    openTime: '2026.11.02 09:20:14',
    accountId: 'exness-real-33'
  },
  {
    id: 'pos-xau-2',
    ticket: 2520555102,
    symbol: 'XAUUSDm',
    type: 'sell',
    lots: 0.01,
    openPrice: 4127.120,
    currentPrice: 3883.063,
    swap: 0.00,
    commission: 0.00,
    profit: 244.06,
    openTime: '2026.10.28 16:40:05',
    accountId: 'exness-real-33'
  }
];

function formatDateYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
}

function createInitialHistory(): Deal[] {
  const now = new Date();
  const today = formatDateYMD(now);
  const threeDaysAgo = formatDateYMD(new Date(now.getTime() - 3 * 86400000));
  const twoWeeksAgo = formatDateYMD(new Date(now.getTime() - 14 * 86400000));
  const twoMonthsAgo = formatDateYMD(new Date(now.getTime() - 55 * 86400000));

  return [
    {
      id: 'deal-today-1',
      ticket: 251904412,
      orderTicket: 251904410,
      symbol: 'XAUUSDm',
      type: 'sell',
      direction: 'out',
      lots: 0.01,
      openPrice: 4120.932,
      closePrice: 4135.476,
      swap: 0,
      commission: 0,
      profit: -14.55,
      openTime: `${today} 04:20:34`,
      closeTime: `${today} 09:42:07`,
      status: 'FILLED',
      accountId: 'exness-real-33',
      comment: 'Market execution'
    },
    {
      id: 'deal-week-1',
      ticket: 251880210,
      orderTicket: 251880208,
      symbol: 'XAUUSDm',
      type: 'buy',
      direction: 'in',
      lots: 0.01,
      openPrice: 4127.120,
      closePrice: 4135.476,
      swap: 0,
      commission: 0,
      profit: 8.35,
      openTime: `${threeDaysAgo} 11:15:20`,
      closeTime: `${threeDaysAgo} 14:22:18`,
      status: 'FILLED',
      accountId: 'exness-real-33',
      comment: 'Take Profit hit'
    },
    {
      id: 'deal-month-1',
      ticket: 251750112,
      orderTicket: 251750109,
      symbol: 'BTCUSDm',
      type: 'buy',
      direction: 'out',
      lots: 0.01,
      openPrice: 62140.50,
      closePrice: 64015.50,
      swap: 0,
      commission: 0,
      profit: 18.75,
      openTime: `${twoWeeksAgo} 08:10:00`,
      closeTime: `${twoWeeksAgo} 18:05:44`,
      status: 'FILLED',
      accountId: 'exness-real-33',
      comment: 'Closed manually'
    },
    {
      id: 'deal-3m-1',
      ticket: 251620001,
      orderTicket: 251620000,
      symbol: 'XAGUSDm',
      type: 'sell',
      direction: 'out',
      lots: 0.01,
      openPrice: 51.792,
      closePrice: 48.730,
      swap: 0,
      commission: 0,
      profit: 153.10,
      openTime: `${twoMonthsAgo} 10:00:12`,
      closeTime: `${twoMonthsAgo} 19:30:11`,
      status: 'FILLED',
      accountId: 'exness-real-33',
      comment: 'Take Profit'
    },
    {
      id: 'deposit-real-33',
      ticket: 10000001,
      symbol: 'Balance',
      type: 'deposit',
      lots: 0,
      openPrice: 0,
      closePrice: 0,
      swap: 0,
      commission: 0,
      profit: 261.20,
      openTime: `${twoMonthsAgo} 08:00:00`,
      closeTime: `${twoMonthsAgo} 08:00:00`,
      status: 'FILLED',
      accountId: 'exness-real-33',
      comment: 'إيداع الحساب'
    },
    {
      id: 'deposit-trial-16',
      ticket: 48920100,
      symbol: 'Balance',
      type: 'deposit',
      lots: 0,
      openPrice: 0,
      closePrice: 0,
      swap: 0,
      commission: 0,
      profit: 1029.35,
      openTime: `${twoWeeksAgo} 12:45:01`,
      closeTime: `${twoWeeksAgo} 12:45:01`,
      status: 'FILLED',
      accountId: 'exness-trial-16',
      comment: 'Demo Balance'
    },
    {
      id: 'deposit-demo-1',
      ticket: 50574100,
      symbol: 'Balance',
      type: 'deposit',
      lots: 0,
      openPrice: 0,
      closePrice: 0,
      swap: 0,
      commission: 0,
      profit: 100000.00,
      openTime: `${twoWeeksAgo} 08:30:00`,
      closeTime: `${twoWeeksAgo} 08:30:00`,
      status: 'FILLED',
      accountId: 'metaquotes-demo',
      comment: 'رصيد الحساب'
    }
  ];
}

const INITIAL_MESSAGES: MessageItem[] = [
  {
    id: 'msg-1',
    title: 'إشعار أمان Exness: تسجيل دخول ناجح',
    content: 'تم تسجيل الدخول بنجاح إلى حساب MT5 الخاص بك على الخادم Exness-MT5Real33 من جهاز موثوق.',
    sender: 'Exness Security',
    time: 'منذ 12 دقيقة',
    read: false,
    type: 'security'
  },
  {
    id: 'msg-2',
    title: 'تحليل حركة BTCUSDm و XAUUSDm اليوم',
    content: 'تداول البيتكوين BTCUSDm قرب مستويات 63,950$ مع تقلبات متوسطة على فريم M15، ومستويات مقاومة عند 65,400$ ودعم عند 62,140$.',
    sender: 'MQL5 Market Pulse',
    time: 'منذ ساعة',
    read: false,
    type: 'news'
  },
  {
    id: 'msg-3',
    title: 'تأكيد تنفيذ أمر #2773274125',
    content: 'تم تنفيذ أمر شراء 0.01 لوت BTCUSDm بسعر 63580.00 وتعيين مستويات SL/TP بنجاح.',
    sender: 'MetaTrader 5 Server',
    time: 'منذ 3 ساعات',
    read: false,
    type: 'system'
  },
  {
    id: 'msg-4',
    title: 'تحديث أسعار الفائدة الليلية (Swap-Free)',
    content: 'حسابك مفعّل على الوضع الإسلامي الخالي من فوائد التبييت (Swap-Free) لجميع أزواج العملات والذهب والعملات الرقمية.',
    sender: 'Exness Support',
    time: 'أمس 21:15',
    read: false,
    type: 'system'
  },
  {
    id: 'msg-5',
    title: 'تنبيه هام حول أوقات افتتاح الأسواق',
    content: 'تبدأ السيولة المرتفعة للذهب والعملات الرئيسية مع افتتاح الجلسة الأوروبية والأمريكية بتوقيت السيرفر.',
    sender: 'MetaQuotes News',
    time: 'أمس 16:40',
    read: false,
    type: 'news'
  },
  {
    id: 'msg-6',
    title: 'تفعيل المصادقة الثنائية OTP',
    content: 'يمكنك توليد رمز أمان مؤقت من قائمة مولد OTP في الشريط الجانبي لتأمين اتصالك.',
    sender: 'MetaQuotes Security',
    time: 'قبل يومين',
    read: false,
    type: 'security'
  }
];

function getTfSeconds(tf: Timeframe): number {
  const map: Record<Timeframe, number> = {
    M1: 60,
    M5: 300,
    M15: 900,
    M30: 1800,
    H1: 3600,
    H4: 14400,
    D1: 86400,
    W1: 604800,
    MN: 2592000
  };
  return map[tf] || 900;
}

// Deterministic seeded pseudo-random generator so each symbol + timeframe produces consistent authentic candle structure
function generateCandlesForSymbol(symbol: string, timeframe: Timeframe, targetBid: number): Candle[] {
  const count = 240;
  const tfSec = getTfSeconds(timeframe);
  const nowSec = Math.floor(Date.now() / 1000);
  const currentBucket = Math.floor(nowSec / tfSec) * tfSec;

  let seed = 0;
  const seedStr = `${symbol}-${timeframe}`;
  for (let i = 0; i < seedStr.length; i++) {
    seed = (seed * 31 + seedStr.charCodeAt(i)) % 100000;
  }
  const nextRand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  // Scale volatility based on timeframe & symbol
  const tfFactor = Math.sqrt(tfSec / 900);
  const baseVol = targetBid * 0.0042 * Math.min(Math.max(tfFactor, 0.35), 4.5);

  // Build backwards from targetBid so the latest candle closes cleanly at targetBid
  const raw: Candle[] = new Array(count);
  let cursorClose = targetBid;

  for (let i = count - 1; i >= 0; i--) {
    const time = (currentBucket - (count - 1 - i) * tfSec) * 1000;
    // Create realistic wave structure (impulses + pullbacks) like real market chart
    const wave = Math.sin(i * 0.14) * 0.28 + Math.cos(i * 0.055) * 0.22;
    const delta = (nextRand() - 0.495 + wave * 0.35) * baseVol;
    const close = cursorClose;
    const open = Math.max(0.0001, close - delta);
    const wickUp = nextRand() * baseVol * 0.75;
    const wickDown = nextRand() * baseVol * 0.75;
    const high = Math.max(open, close) + wickUp;
    const low = Math.max(0.0001, Math.min(open, close) - wickDown);
    const volume = Math.floor(60 + nextRand() * 340);

    raw[i] = { time, open, high, low, close, volume };
    cursorClose = open;
  }

  return raw;
}

const TradingContext = createContext<TradingContextType | undefined>(undefined);

export const TradingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<Account[]>(() => {
    try {
      const saved = localStorage.getItem('mt5_v2_accounts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_ACCOUNTS;
  });

  const [activeAccount, setActiveAccountState] = useState<Account>(() => {
    try {
      const savedId = localStorage.getItem('mt5_v2_active_account_id');
      const savedAccs = localStorage.getItem('mt5_v2_accounts');
      if (savedId && savedAccs) {
        const parsed: Account[] = JSON.parse(savedAccs);
        const found = parsed.find((a) => a.id === savedId);
        if (found) return found;
      }
    } catch {}
    return INITIAL_ACCOUNTS[0];
  });

  const [quotes, setQuotes] = useState<SymbolQuote[]>(INITIAL_QUOTES);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTCUSDm');
  const [activeTab, setActiveTab] = useState<TabType>('chart');
  const [timeframe, setTimeframe] = useState<Timeframe>('M15');
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);

  const [positions, setPositions] = useState<Position[]>(() => {
    try {
      const saved = localStorage.getItem('mt5_v2_positions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return INITIAL_POSITIONS;
  });

  const [historyDeals, setHistoryDeals] = useState<Deal[]>(() => {
    try {
      const saved = localStorage.getItem('mt5_v2_history_deals');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return createInitialHistory();
  });

  const [messages, setMessages] = useState<MessageItem[]>(INITIAL_MESSAGES);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [orderModalSymbol, setOrderModalSymbol] = useState<string | null>(null);
  const [modifyingPosition, setModifyingPosition] = useState<Position | null>(null);
  const [modifyingFocus, setModifyingFocus] = useState<'sl' | 'tp' | null>(null);
  const [accountInfoModalOpen, setAccountInfoModalOpen] = useState<boolean>(false);
  const [otpModalOpen, setOtpModalOpen] = useState<boolean>(false);
  const [addAccountModalOpen, setAddAccountModalOpen] = useState<boolean>(false);

  // Candle state synced per symbol/timeframe
  const [candles, setCandles] = useState<Candle[]>(() => {
    const q = INITIAL_QUOTES.find((item) => item.symbol === 'BTCUSDm') || INITIAL_QUOTES[0];
    return generateCandlesForSymbol(q.symbol, 'M15', q.bid);
  });

  useEffect(() => {
    const q = quotes.find((item) => item.symbol === selectedSymbol) || quotes[0];
    setCandles(generateCandlesForSymbol(selectedSymbol, timeframe, q.bid));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSymbol, timeframe]);

  // Persist locally
  useEffect(() => {
    try {
      localStorage.setItem('mt5_v2_accounts', JSON.stringify(accounts));
      localStorage.setItem('mt5_v2_active_account_id', activeAccount.id);
      localStorage.setItem('mt5_v2_positions', JSON.stringify(positions));
      localStorage.setItem('mt5_v2_history_deals', JSON.stringify(historyDeals));
    } catch {}
  }, [accounts, activeAccount.id, positions, historyDeals]);

  // Live commodities poll from backend proxy
  useEffect(() => {
    let active = true;
    const fetchCommodities = async () => {
      try {
        const res = await fetch('/api/commodities');
        if (!res.ok || !active) return;
        const data = await res.json();
        if (data && typeof data === 'object') {
          setQuotes((prev) =>
            prev.map((q) => {
              const live = data[q.symbol];
              if (!live || typeof live.price !== 'number') return q;
              const spreadVal = q.spread * Math.pow(10, -q.digits);
              return {
                ...q,
                bid: parseFloat(live.price.toFixed(q.digits)),
                ask: parseFloat((live.price + spreadVal).toFixed(q.digits)),
                high: parseFloat((live.high || live.price).toFixed(q.digits)),
                low: parseFloat((live.low || live.price).toFixed(q.digits)),
                change: parseFloat((live.change || q.change).toFixed(2))
              };
            })
          );
          setIsLiveConnected(true);
        }
      } catch {
        // Silent fallback to simulated ticks
      }
    };
    fetchCommodities();
    const interval = setInterval(fetchCommodities, 20000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // Live realistic tick engine (1.1s interval) + updates active candle & position floating P/L
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

      setQuotes((prevQuotes) =>
        prevQuotes.map((q) => {
          const stepMagnitude =
            q.symbol === 'BTCUSDm'
              ? 18
              : q.symbol === 'BTCJPYm'
              ? 2400
              : q.symbol === 'XAUUSDm'
              ? 0.45
              : q.symbol === 'US30m'
              ? 4.5
              : q.digits >= 4
              ? 0.00018
              : 0.025;

          const delta = (Math.random() - 0.49) * stepMagnitude;
          const newBid = parseFloat(Math.max(0.0001, q.bid + delta).toFixed(q.digits));
          const spreadVal = q.spread * Math.pow(10, -q.digits);
          const newAsk = parseFloat((newBid + spreadVal).toFixed(q.digits));

          return {
            ...q,
            bid: newBid,
            ask: newAsk,
            high: Math.max(q.high, newBid),
            low: Math.min(q.low, newBid),
            time: timeStr,
            tickDirection: delta >= 0 ? 'up' : 'down'
          };
        })
      );
    }, 1100);

    return () => clearInterval(timer);
  }, []);

  // Update active candle and live position profits whenever quotes tick
  useEffect(() => {
    const activeQ = quotes.find((q) => q.symbol === selectedSymbol);
    if (activeQ) {
      setCandles((prev) => {
        if (prev.length === 0) return prev;
        const last = { ...prev[prev.length - 1] };
        last.close = activeQ.bid;
        last.high = Math.max(last.high, activeQ.bid);
        last.low = Math.min(last.low, activeQ.bid);
        last.volume += 1;
        return [...prev.slice(0, prev.length - 1), last];
      });
    }

    setPositions((prevPos) =>
      prevPos.map((pos) => {
        const q = quotes.find((item) => item.symbol === pos.symbol);
        if (!q) return pos;
        const closeRefPrice = pos.type === 'buy' ? q.bid : q.ask;
        const diff = pos.type === 'buy' ? closeRefPrice - pos.openPrice : pos.openPrice - closeRefPrice;
        // Calculate realistic profit based on contract size
        const profitMultiplier =
          pos.symbol.startsWith('XAU')
            ? 100
            : pos.symbol.startsWith('XAG')
            ? 50
            : pos.symbol.startsWith('BTC') || pos.symbol.startsWith('ETH')
            ? 1
            : pos.symbol.startsWith('USDJPY')
            ? 650
            : pos.symbol.startsWith('USOIL')
            ? 100
            : 1000;
        const profit = parseFloat((diff * pos.lots * profitMultiplier).toFixed(2));
        return {
          ...pos,
          currentPrice: closeRefPrice,
          profit
        };
      })
    );
  }, [quotes, selectedSymbol]);

  // Financial metrics for active account
  const activePositions = positions.filter((p) => p.accountId === activeAccount.id);
  const totalProfit = parseFloat(activePositions.reduce((s, p) => s + p.profit, 0).toFixed(2));
  const equity = parseFloat((activeAccount.balance + totalProfit).toFixed(2));

  const leverageNum = parseInt(activeAccount.leverage.split(':')[1] || '2000', 10) || 2000;
  const margin = parseFloat(
    activePositions
      .reduce((sum, p) => {
        const q = quotes.find((item) => item.symbol === p.symbol);
        const contract = q?.contractSize || 100;
        return sum + (p.openPrice * p.lots * contract) / leverageNum;
      }, 0)
      .toFixed(2)
  );
  const freeMargin = parseFloat((equity - margin).toFixed(2));
  const marginLevel = margin > 0 ? parseFloat(((equity / margin) * 100).toFixed(2)) : 0;

  const openTrade = useCallback(
    (symbol: string, type: 'buy' | 'sell', lots: number, sl?: number, tp?: number): boolean => {
      const q = quotes.find((item) => item.symbol === symbol);
      if (!q) return false;
      const now = new Date();
      const timeFormatted = `${formatDateYMD(now)} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      const openPrice = type === 'buy' ? q.ask : q.bid;
      const currentPrice = type === 'buy' ? q.bid : q.ask;
      const ticket = Math.floor(2520000000 + Math.random() * 500000000);

      const newPos: Position = {
        id: `pos-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        ticket,
        symbol,
        type,
        lots,
        openPrice,
        currentPrice,
        sl,
        tp,
        swap: 0,
        commission: 0,
        profit: -parseFloat(((q.ask - q.bid) * lots * (symbol.startsWith('XAU') ? 100 : 1)).toFixed(2)),
        openTime: timeFormatted,
        accountId: activeAccount.id
      };

      setPositions((prev) => [newPos, ...prev]);
      return true;
    },
    [quotes, activeAccount.id]
  );

  const closePosition = useCallback(
    (positionId: string) => {
      const target = positions.find((p) => p.id === positionId);
      if (!target) return;

      const now = new Date();
      const closeTimeFormatted = `${formatDateYMD(now)} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

      const closedDeal: Deal = {
        id: `deal-${Date.now()}`,
        ticket: target.ticket,
        orderTicket: target.ticket - 2,
        symbol: target.symbol,
        type: target.type,
        direction: 'out',
        lots: target.lots,
        openPrice: target.openPrice,
        closePrice: target.currentPrice,
        sl: target.sl,
        tp: target.tp,
        swap: target.swap,
        commission: target.commission,
        profit: target.profit,
        openTime: target.openTime,
        closeTime: closeTimeFormatted,
        status: 'FILLED',
        accountId: target.accountId,
        comment: 'Closed at market'
      };

      setPositions((prev) => prev.filter((p) => p.id !== positionId));
      setHistoryDeals((prev) => [closedDeal, ...prev]);

      const newBalance = parseFloat((activeAccount.balance + target.profit).toFixed(2));
      const updatedAcc = { ...activeAccount, balance: newBalance };
      setActiveAccountState(updatedAcc);
      setAccounts((prev) => prev.map((a) => (a.id === updatedAcc.id ? updatedAcc : a)));
    },
    [positions, activeAccount]
  );

  const closeAllPositions = useCallback(() => {
    const accountPos = positions.filter((p) => p.accountId === activeAccount.id);
    if (accountPos.length === 0) return;

    const now = new Date();
    const closeTimeFormatted = `${formatDateYMD(now)} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const newDeals: Deal[] = accountPos.map((target, idx) => ({
      id: `deal-${Date.now()}-${idx}`,
      ticket: target.ticket,
      orderTicket: target.ticket - 2,
      symbol: target.symbol,
      type: target.type,
      direction: 'out',
      lots: target.lots,
      openPrice: target.openPrice,
      closePrice: target.currentPrice,
      sl: target.sl,
      tp: target.tp,
      swap: target.swap,
      commission: target.commission,
      profit: target.profit,
      openTime: target.openTime,
      closeTime: closeTimeFormatted,
      status: 'FILLED',
      accountId: target.accountId,
      comment: 'Bulk closed'
    }));

    const totalClosedProfit = accountPos.reduce((s, p) => s + p.profit, 0);
    setPositions((prev) => prev.filter((p) => p.accountId !== activeAccount.id));
    setHistoryDeals((prev) => [...newDeals, ...prev]);

    const newBalance = parseFloat((activeAccount.balance + totalClosedProfit).toFixed(2));
    const updatedAcc = { ...activeAccount, balance: newBalance };
    setActiveAccountState(updatedAcc);
    setAccounts((prev) => prev.map((a) => (a.id === updatedAcc.id ? updatedAcc : a)));
  }, [positions, activeAccount]);

  const modifyPosition = useCallback((positionId: string, sl?: number, tp?: number) => {
    setPositions((prev) =>
      prev.map((p) =>
        p.id === positionId
          ? {
              ...p,
              sl: sl && sl > 0 ? sl : undefined,
              tp: tp && tp > 0 ? tp : undefined
            }
          : p
      )
    );
    setModifyingPosition((prev) =>
      prev && prev.id === positionId
        ? {
            ...prev,
            sl: sl && sl > 0 ? sl : undefined,
            tp: tp && tp > 0 ? tp : undefined
          }
        : prev
    );
  }, []);

  const markMessageAsRead = (id: string) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, read: true } : m)));
  };

  const unreadCount = messages.filter((m) => !m.read).length;

  const openOrderModal = (symbol?: string) => {
    setOrderModalSymbol(symbol || selectedSymbol);
  };

  const closeOrderModal = () => {
    setOrderModalSymbol(null);
  };

  const addNewAccount = (acc: Partial<Account>) => {
    const isExness = acc.broker?.toLowerCase().includes('exness') || acc.logoType === 'exness';
    const initialBalance = acc.balance !== undefined && !isNaN(acc.balance) ? Number(acc.balance) : 1000;
    const now = new Date();
    const timeFormatted = `${formatDateYMD(now)} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const newAcc: Account = {
      id: `acc-${Date.now()}`,
      name: acc.name || 'Standard',
      broker: acc.broker || (isExness ? 'Exness Technologies Ltd' : 'MetaQuotes Ltd.'),
      server: acc.server || (isExness ? 'Exness-MT5Real35' : 'MetaQuotes-Demo'),
      accountNumber: acc.accountNumber || String(Math.floor(200000000 + Math.random() * 99999999)),
      balance: initialBalance,
      currency: acc.currency || 'USD',
      type: acc.type || 'demo',
      leverage: acc.leverage || '1:2000',
      logoType: isExness ? 'exness' : 'metaquotes',
      lastKnownLabel: `آخر ما عرف · ${acc.currency || 'USD'}`
    };

    const depositDeal: Deal = {
      id: `deposit-${Date.now()}`,
      ticket: Math.floor(10000000 + Math.random() * 89999999),
      symbol: 'Balance',
      type: 'deposit',
      lots: 0,
      openPrice: 0,
      closePrice: 0,
      swap: 0,
      commission: 0,
      profit: initialBalance,
      openTime: timeFormatted,
      closeTime: timeFormatted,
      status: 'FILLED',
      accountId: newAcc.id,
      comment: 'رصيد الحساب'
    };

    setAccounts((prev) => [newAcc, ...prev]);
    setActiveAccountState(newAcc);
    setHistoryDeals((prev) => [depositDeal, ...prev]);
    setAddAccountModalOpen(false);
  };

  const deleteAccount = (accountId: string) => {
    setAccounts((prev) => {
      const remaining = prev.filter((a) => a.id !== accountId);
      if (remaining.length === 0) {
        setActiveAccountState(INITIAL_ACCOUNTS[0]);
        return INITIAL_ACCOUNTS;
      }
      if (activeAccount.id === accountId) {
        setActiveAccountState(remaining[0]);
      }
      return remaining;
    });
  };

  const setActiveAccount = (account: Account) => {
    setActiveAccountState(account);
  };

  return (
    <TradingContext.Provider
      value={{
        activeAccount,
        accounts,
        setActiveAccount,
        quotes,
        selectedSymbol,
        setSelectedSymbol,
        activeTab,
        setActiveTab,
        timeframe,
        setTimeframe,
        candles,
        positions,
        historyDeals,
        openTrade,
        closePosition,
        closeAllPositions,
        modifyPosition,
        messages,
        markMessageAsRead,
        unreadCount,
        totalProfit,
        equity,
        margin,
        freeMargin,
        marginLevel,
        isDrawerOpen,
        setIsDrawerOpen,
        openOrderModal,
        orderModalSymbol,
        closeOrderModal,
        modifyingPosition,
        setModifyingPosition,
        modifyingFocus,
        setModifyingFocus,
        accountInfoModalOpen,
        setAccountInfoModalOpen,
        otpModalOpen,
        setOtpModalOpen,
        addAccountModalOpen,
        setAddAccountModalOpen,
        addNewAccount,
        deleteAccount,
        isLiveConnected
      }}
    >
      {children}
    </TradingContext.Provider>
  );
};

export const useTrading = () => {
  const ctx = useContext(TradingContext);
  if (!ctx) throw new Error('useTrading must be used inside TradingProvider');
  return ctx;
};
