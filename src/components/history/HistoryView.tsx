import React, { useState, useMemo } from 'react';
import { useTrading } from '../../context/TradingContext';
import { Deal } from '../../types/mt5';

export const HistoryView: React.FC = () => {
  const { historyDeals, activeAccount, quotes, setIsDrawerOpen } = useTrading();

  // Default to 'positions' (المراكز - on the left tab, matching Screenshot_20261115134235_5c7961b3.jpg)
  const [activeSubTab, setActiveSubTab] = useState<'deals' | 'orders' | 'positions'>('positions');
  const [calendarDropdownOpen, setCalendarDropdownOpen] = useState<boolean>(false);
  const [customCalendarOpen, setCustomCalendarOpen] = useState<boolean>(false);
  const [filterPeriod, setFilterPeriod] = useState<'today' | 'week' | 'month' | '3months' | 'custom' | 'all'>('all');

  // Single-day custom calendar selection (YYYY.MM.DD)
  const [customSelectedDate, setCustomSelectedDate] = useState<string>('2026.11.10');
  const [calendarYear, setCalendarYear] = useState<number>(2026);
  const [calendarMonth, setCalendarMonth] = useState<number>(10); // 0-indexed: 10 = November

  const [symbolFilterOpen, setSymbolFilterOpen] = useState<boolean>(false);
  const [selectedSymbolFilter, setSelectedSymbolFilter] = useState<string>('all');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [expandedDealId, setExpandedDealId] = useState<string | null>(null);

  const arabicMonthNames = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  const arabicWeekDays = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

  const accountDeals = useMemo(
    () => historyDeals.filter((d) => d.accountId === activeAccount.id),
    [historyDeals, activeAccount.id]
  );

  // Set of dates (YYYY.MM.DD) that have recorded trades or deposits in the active account
  const dealDatesSet = useMemo(() => {
    const set = new Set<string>();
    accountDeals.forEach((d) => {
      if (d.closeTime) {
        set.add(d.closeTime.split(' ')[0]);
      }
    });
    return set;
  }, [accountDeals]);

  const uniqueSymbols = useMemo(() => {
    const set = new Set<string>();
    accountDeals.forEach((d) => {
      if (d.symbol && d.symbol !== 'Balance') set.add(d.symbol);
    });
    return Array.from(set);
  }, [accountDeals]);

  const dateRanges = useMemo(() => {
    const now = new Date();
    const fmt = (d: Date) =>
      `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
    const todayStr = fmt(now);
    const weekAgo = fmt(new Date(now.getTime() - 7 * 86400000));
    const monthAgo = fmt(new Date(now.getTime() - 30 * 86400000));
    const threeMonthsAgo = fmt(new Date(now.getTime() - 90 * 86400000));
    return {
      today: todayStr,
      week: `${todayStr} - ${weekAgo}`,
      month: `${todayStr} - ${monthAgo}`,
      threeMonths: `${todayStr} - ${threeMonthsAgo}`,
      custom: customSelectedDate.replace(/\./g, '/')
    };
  }, [customSelectedDate]);

  const parseDealDate = (str: string): Date => {
    const [datePart] = (str || '').split(' ');
    const [y, m, d] = datePart.split('.').map(Number);
    return new Date(y || 2026, (m || 1) - 1, d || 1);
  };

  // Strict filtering: each day shows ONLY its own deals when selected
  const filteredDeals = useMemo(() => {
    let list = accountDeals;
    if (selectedSymbolFilter !== 'all') {
      list = list.filter((d) => d.symbol === selectedSymbolFilter);
    }

    const now = new Date();
    const todayKey = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;

    if (filterPeriod === 'custom' && customSelectedDate) {
      list = list.filter((d) => d.closeTime && d.closeTime.split(' ')[0] === customSelectedDate);
    } else if (filterPeriod === 'today') {
      list = list.filter((d) => d.closeTime && d.closeTime.split(' ')[0] === todayKey);
    } else if (filterPeriod === 'week') {
      const minDate = new Date(now.getTime() - 7 * 86400000);
      list = list.filter((d) => parseDealDate(d.closeTime) >= minDate);
    } else if (filterPeriod === 'month') {
      const minDate = new Date(now.getTime() - 30 * 86400000);
      list = list.filter((d) => parseDealDate(d.closeTime) >= minDate);
    } else if (filterPeriod === '3months') {
      const minDate = new Date(now.getTime() - 90 * 86400000);
      list = list.filter((d) => parseDealDate(d.closeTime) >= minDate);
    }

    return [...list].sort((a, b) =>
      sortAsc ? a.closeTime.localeCompare(b.closeTime) : b.closeTime.localeCompare(a.closeTime)
    );
  }, [accountDeals, selectedSymbolFilter, filterPeriod, customSelectedDate, sortAsc]);

  const tradingDeals = useMemo(
    () => filteredDeals.filter((d) => d.type !== 'deposit'),
    [filteredDeals]
  );

  const totalProfit = useMemo(
    () => tradingDeals.reduce((s, d) => s + d.profit, 0),
    [tradingDeals]
  );

  const totalDeposit = useMemo(
    () => filteredDeals.filter((d) => d.type === 'deposit').reduce((s, d) => s + d.profit, 0),
    [filteredDeals]
  );

  const totalSwap = useMemo(
    () => tradingDeals.reduce((s, d) => s + d.swap, 0),
    [tradingDeals]
  );

  const totalCommission = useMemo(
    () => tradingDeals.reduce((s, d) => s + d.commission, 0),
    [tradingDeals]
  );

  const netBalance = totalDeposit + totalProfit + totalSwap + totalCommission;

  const filledOrdersCount = tradingDeals.filter((d) => d.status !== 'CANCELED').length;
  const canceledOrdersCount = tradingDeals.filter((d) => d.status === 'CANCELED').length;

  const getDigits = (symbol: string) => quotes.find((q) => q.symbol === symbol)?.digits ?? 3;

  // Calendar Math
  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear((y) => y - 1);
    } else {
      setCalendarMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear((y) => y + 1);
    } else {
      setCalendarMonth((m) => m + 1);
    }
  };

  const handlePickDay = (day: number) => {
    const mStr = String(calendarMonth + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    const key = `${calendarYear}.${mStr}.${dStr}`;
    setCustomSelectedDate(key);
    setFilterPeriod('custom');
    setCustomCalendarOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#000000] text-white overflow-hidden select-none relative">
      {/* 1. Header (Exact match to Screenshot_20261115134235_5c7961b3.jpg) */}
      <header className="h-14 px-3 flex items-center justify-between bg-[#000000] shrink-0 z-30">
        {/* Right side: Hamburger + "السجل" + Subtitle */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsDrawerOpen(true)}
            aria-label="القائمة"
            className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-full cursor-pointer"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-6 h-6">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div>
            <h1 className="text-[17px] font-bold leading-tight text-white">السجل</h1>
            <span className="text-[12px] text-[#8e9aa8] block leading-tight">
              {filterPeriod === 'custom'
                ? customSelectedDate
                : selectedSymbolFilter === 'all'
                ? 'كل الرموز'
                : selectedSymbolFilter}
            </span>
          </div>
        </div>

        {/* Left side (in RTL): Circular-Arrows Dollar ($), Sort (⇅), Calendar (📅) */}
        <div className="flex items-center gap-0.5 relative">
          {/* Dollar with circular arrows */}
          <button
            onClick={() => {
              setSymbolFilterOpen((v) => !v);
              setCalendarDropdownOpen(false);
            }}
            aria-label="تصفية الرمز"
            className={`w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 cursor-pointer ${
              selectedSymbolFilter !== 'all' ? 'text-[#2196f3]' : 'text-white'
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
              <path d="M21 12a9 9 0 0 0-15.5-6.3L3 8" strokeLinecap="round" />
              <polyline points="3 4 3 8 7 8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3 12a9 9 0 0 0 15.5 6.3L21 16" strokeLinecap="round" />
              <polyline points="21 20 21 16 17 16" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 7.5v9M14.2 9.5c0-1-1-1.6-2.2-1.6s-2.2.6-2.2 1.6 1 1.5 2.2 1.8 2.2.8 2.2 1.8-1 1.7-2.2 1.7-2.2-.7-2.2-1.7" strokeLinecap="round" />
            </svg>
          </button>

          {/* Sort Arrows */}
          <button
            onClick={() => setSortAsc((v) => !v)}
            aria-label="ترتيب السجل"
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-white cursor-pointer"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" className="w-5 h-5">
              <path d="M7 20V4M7 4L3.5 7.5M7 4L10.5 7.5" />
              <path d="M17 4V20M17 20L13.5 16.5M17 20L20.5 16.5" />
            </svg>
          </button>

          {/* Calendar Icon */}
          <button
            onClick={() => {
              setCalendarDropdownOpen((v) => !v);
              setSymbolFilterOpen(false);
            }}
            aria-label="تحديد الفترة الزمنية"
            className={`w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 cursor-pointer ${
              filterPeriod === 'custom' || calendarDropdownOpen ? 'text-[#2196f3]' : 'text-white'
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="w-5 h-5">
              <rect x="3" y="4" width="18" height="17" rx="2" />
              <line x1="3" y1="9.5" x2="21" y2="9.5" />
              <line x1="16" y1="2.5" x2="16" y2="6" />
              <line x1="8" y1="2.5" x2="8" y2="6" />
              <circle cx="8" cy="14" r="1" fill="currentColor" />
              <circle cx="12" cy="14" r="1" fill="currentColor" />
              <circle cx="16" cy="14" r="1" fill="currentColor" />
            </svg>
          </button>

          {/* Symbol Dropdown */}
          {symbolFilterOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setSymbolFilterOpen(false)} />
              <div className="absolute left-16 top-12 w-44 bg-[#181b22] border border-[#2a2f3a] rounded-xl shadow-2xl py-1.5 z-50 text-xs">
                <button
                  onClick={() => {
                    setSelectedSymbolFilter('all');
                    setSymbolFilterOpen(false);
                  }}
                  className={`w-full px-3.5 py-2 text-right flex items-center justify-between hover:bg-white/5 cursor-pointer ${
                    selectedSymbolFilter === 'all' ? 'text-[#2196f3] font-bold' : 'text-white'
                  }`}
                >
                  <span>كل الرموز</span>
                  {selectedSymbolFilter === 'all' && <span>✓</span>}
                </button>
                {uniqueSymbols.map((sym) => (
                  <button
                    key={sym}
                    onClick={() => {
                      setSelectedSymbolFilter(sym);
                      setSymbolFilterOpen(false);
                    }}
                    className={`w-full px-3.5 py-2 text-right flex items-center justify-between hover:bg-white/5 font-num cursor-pointer ${
                      selectedSymbolFilter === sym ? 'text-[#2196f3] font-bold' : 'text-[#cfd8dc]'
                    }`}
                  >
                    <span>{sym}</span>
                    {selectedSymbolFilter === sym && <span>✓</span>}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Calendar Period Dropdown Menu */}
          {calendarDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setCalendarDropdownOpen(false)} />
              <div className="absolute left-0 top-12 w-64 bg-[#17191f] border border-[#2a2f3a] rounded-xl shadow-2xl py-2 z-50 animate-scaleIn">
                {[
                  { id: 'today', label: 'اليوم', sub: dateRanges.today },
                  { id: 'week', label: 'الأسبوع السابق', sub: dateRanges.week },
                  { id: 'month', label: 'الشهر السابق', sub: dateRanges.month },
                  { id: '3months', label: 'الثلاثة أشهر السابقة', sub: dateRanges.threeMonths },
                  { id: 'custom', label: 'فترة مخصصة', sub: dateRanges.custom },
                  { id: 'all', label: 'كل السجل', sub: 'عرض جميع الأيام' }
                ].map((item) => {
                  const active = filterPeriod === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCalendarDropdownOpen(false);
                        if (item.id === 'custom') {
                          setCustomCalendarOpen(true);
                        } else {
                          setFilterPeriod(item.id as typeof filterPeriod);
                        }
                      }}
                      className="w-full px-3.5 py-2.5 flex items-center justify-between hover:bg-white/5 cursor-pointer text-right"
                    >
                      <div className="flex items-center gap-3">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5 text-[#8e9aa8] shrink-0">
                          <rect x="3" y="4" width="18" height="17" rx="2" />
                          <line x1="3" y1="9.5" x2="21" y2="9.5" />
                        </svg>
                        <div>
                          <div className="text-[13px] font-bold text-white leading-tight">{item.label}</div>
                          <div className="text-[11px] font-num text-[#8e9aa8] mt-0.5">{item.sub}</div>
                        </div>
                      </div>
                      {active && <span className="text-[#2196f3] font-bold text-sm">✓</span>}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </header>

      {/* 2. Sub-Tabs in Exact Order of Screenshot_20261115134235_5c7961b3.jpg:
             Right: الصفقات | Center: الطلبات | Left: المراكز */}
      <div dir="rtl" className="grid grid-cols-3 border-b border-[#181b21] bg-[#000000] shrink-0 text-[13.5px] font-medium">
        {[
          { id: 'deals', label: 'الصفقات' },
          { id: 'orders', label: 'الطلبات' },
          { id: 'positions', label: 'المراكز' }
        ].map((tab) => {
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as typeof activeSubTab)}
              className={`py-2.5 text-center relative cursor-pointer transition-colors ${
                isActive ? 'text-white font-bold' : 'text-[#8e9aa8] hover:text-[#cfd8dc]'
              }`}
            >
              {tab.label}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#2196f3]" />
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Summary Block (Exact RTL orientation matching Screenshot_20261115134235_5c7961b3.jpg:
             Label on RIGHT, dotted leader in CENTER, Value on LEFT) */}
      {activeSubTab === 'orders' ? (
        <div dir="rtl" className="px-4 py-2.5 bg-[#000000] border-b border-[#181b21] space-y-1.5 shrink-0 text-[13.5px]">
          <div className="flex items-baseline justify-between">
            <span className="text-white shrink-0">المنفذ:</span>
            <div className="flex-1 mx-2.5 border-b border-dotted border-[#464c58] self-center" />
            <span className="font-num font-bold text-white shrink-0">{filledOrdersCount}</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-white shrink-0">الملغي:</span>
            <div className="flex-1 mx-2.5 border-b border-dotted border-[#464c58] self-center" />
            <span className="font-num font-bold text-white shrink-0">{canceledOrdersCount}</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-white shrink-0">الإجمالي:</span>
            <div className="flex-1 mx-2.5 border-b border-dotted border-[#464c58] self-center" />
            <span className="font-num font-bold text-white shrink-0">{tradingDeals.length}</span>
          </div>
        </div>
      ) : (
        <div dir="rtl" className="px-4 py-2.5 bg-[#000000] border-b border-[#181b21] space-y-1.5 shrink-0 text-[13.5px]">
          <div className="flex items-baseline justify-between">
            <span className="text-white shrink-0">الربح:</span>
            <div className="flex-1 mx-2.5 border-b border-dotted border-[#464c58] self-center" />
            <span
              dir="ltr"
              className={`font-num font-bold shrink-0 ${
                totalProfit >= 0 ? 'text-[#2196f3]' : 'text-[#ef5350]'
              }`}
            >
              {totalProfit.toFixed(2)}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-white shrink-0">الايداع:</span>
            <div className="flex-1 mx-2.5 border-b border-dotted border-[#464c58] self-center" />
            <span dir="ltr" className="font-num font-bold text-white shrink-0">
              {totalDeposit.toFixed(2)}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-white shrink-0">الفائدة:</span>
            <div className="flex-1 mx-2.5 border-b border-dotted border-[#464c58] self-center" />
            <span dir="ltr" className="font-num font-bold text-white shrink-0">
              {totalSwap.toFixed(2)}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-white shrink-0">العمولة:</span>
            <div className="flex-1 mx-2.5 border-b border-dotted border-[#464c58] self-center" />
            <span dir="ltr" className="font-num font-bold text-white shrink-0">
              {totalCommission.toFixed(2)}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-white shrink-0">رصيد الحساب:</span>
            <div className="flex-1 mx-2.5 border-b border-dotted border-[#464c58] self-center" />
            <span dir="ltr" className="font-num font-bold text-white shrink-0">
              {netBalance.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* 4. History List (Exact layout of Screenshot_20261115134235_5c7961b3.jpg:
             LEFT: Symbol, buy/sell lots & openPrice → closePrice
             RIGHT: Timestamp & Profit) */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#181b21]">
        {tradingDeals.length === 0 ? (
          <div className="py-16 px-4 text-center text-[#8e9aa8]">
            <p className="text-sm font-semibold text-[#cfd8dc]">لا توجد صفقات في هذا التاريخ</p>
            {filterPeriod === 'custom' && (
              <button
                onClick={() => setFilterPeriod('all')}
                className="mt-3 px-4 py-2 bg-[#1e232d] text-[#3897f0] rounded-xl text-xs font-bold cursor-pointer"
              >
                عرض كل السجل
              </button>
            )}
          </div>
        ) : activeSubTab === 'orders' ? (
          tradingDeals.map((deal: Deal) => {
            const isBuy = deal.type === 'buy';
            return (
              <div key={deal.id} dir="ltr" className="px-4 py-2.5 flex items-center justify-between hover:bg-[#0b0d11]">
                <div className="text-left">
                  <div className="flex items-baseline gap-1.5 leading-tight">
                    <span className="text-[15px] font-num font-bold text-white">{deal.symbol},</span>
                    <span className={`text-[14px] font-num font-medium ${isBuy ? 'text-[#2196f3]' : 'text-[#ef5350]'}`}>
                      {deal.type}
                    </span>
                  </div>
                  <div className="text-[13px] font-num text-[#9ea8b3] mt-0.5">
                    {deal.lots.toFixed(2)} / {deal.lots.toFixed(2)} at market
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11.5px] font-num text-[#9ea8b3]">{deal.openTime}</div>
                  <div className="text-[12.5px] font-num font-semibold text-[#cfd8dc] mt-0.5">
                    {deal.status || 'FILLED'}
                  </div>
                </div>
              </div>
            );
          })
        ) : activeSubTab === 'deals' ? (
          tradingDeals.map((deal: Deal) => {
            const isBuy = deal.type === 'buy';
            const digits = getDigits(deal.symbol);
            const execPrice = deal.direction === 'in' ? deal.openPrice : deal.closePrice;
            return (
              <div key={deal.id} dir="ltr" className="px-4 py-2.5 flex items-center justify-between hover:bg-[#0b0d11]">
                <div className="text-left">
                  <div className="flex items-baseline gap-1 leading-tight">
                    <span className="text-[15px] font-num font-bold text-white">{deal.symbol},</span>
                    <span className={`text-[14px] font-num font-medium ${isBuy ? 'text-[#2196f3]' : 'text-[#ef5350]'}`}>
                      {deal.type}, {deal.direction || 'out'}
                    </span>
                  </div>
                  <div className="text-[13px] font-num text-[#9ea8b3] mt-0.5">
                    {deal.lots.toFixed(2)} at {execPrice.toFixed(digits)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11.5px] font-num text-[#9ea8b3]">{deal.closeTime}</div>
                  <div
                    className={`text-[14.5px] font-num font-bold mt-0.5 ${
                      deal.profit >= 0 ? 'text-[#2196f3]' : 'text-[#ef5350]'
                    }`}
                  >
                    {deal.profit.toFixed(2)}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          tradingDeals.map((deal: Deal) => {
            const isBuy = deal.type === 'buy';
            const digits = getDigits(deal.symbol);
            const isExpanded = expandedDealId === deal.id;
            return (
              <div
                key={deal.id}
                onClick={() => setExpandedDealId(isExpanded ? null : deal.id)}
                className="px-4 py-2.5 hover:bg-[#0b0d11] cursor-pointer"
              >
                <div dir="ltr" className="flex items-center justify-between">
                  {/* LEFT SIDE: Symbol + buy/sell + open → close */}
                  <div className="text-left">
                    <div className="flex items-baseline gap-1.5 leading-tight">
                      <span className="text-[15px] font-num font-bold text-white">{deal.symbol},</span>
                      <span className={`text-[14px] font-num font-medium ${isBuy ? 'text-[#2196f3]' : 'text-[#ef5350]'}`}>
                        {deal.type} {deal.lots.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-[13.5px] font-num text-[#9ea8b3] mt-0.5">
                      {deal.openPrice.toFixed(digits)} → {deal.closePrice.toFixed(digits)}
                    </div>
                  </div>

                  {/* RIGHT SIDE: Timestamp + Profit */}
                  <div className="text-right">
                    <div className="text-[11.5px] font-num text-[#9ea8b3]">{deal.closeTime}</div>
                    <div
                      className={`text-[14.5px] font-num font-bold mt-0.5 ${
                        deal.profit >= 0 ? 'text-[#2196f3]' : 'text-[#ef5350]'
                      }`}
                    >
                      {deal.profit.toFixed(2)}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-2 pt-2 border-t border-[#181b21] grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-[#8e9aa8] animate-fadeIn">
                    <div className="flex justify-between">
                      <span>S/L:</span>
                      <span className="font-num text-[#cfd8dc]">{deal.sl ? deal.sl.toFixed(digits) : '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>الفائدة:</span>
                      <span className="font-num text-[#cfd8dc]">{deal.swap.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>T/P:</span>
                      <span className="font-num text-[#cfd8dc]">{deal.tp ? deal.tp.toFixed(digits) : '—'}</span>
                    </div>
                    <div className="flex justify-end font-num">#{deal.ticket}</div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 5. Monthly Calendar Modal for Single-Day Exact Filtering ("تخصيص التاريخ") */}
      {customCalendarOpen && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fadeIn"
          onClick={() => setCustomCalendarOpen(false)}
        >
          <div
            className="bg-[#181b22] border border-[#2a2f3a] rounded-2xl w-full max-w-sm p-4 text-right shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#242832]">
              <button
                onClick={() => setCustomCalendarOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 text-[#8e9aa8] hover:text-white cursor-pointer"
              >
                ✕
              </button>
              <h3 className="font-bold text-white text-sm">اختر تاريخ السجل</h3>
              <div className="w-8" />
            </div>

            {/* Month Navigation */}
            <div dir="ltr" className="flex items-center justify-between py-3 px-1">
              <button
                onClick={handlePrevMonth}
                className="w-8 h-8 rounded-lg bg-[#222630] hover:bg-[#2c313e] text-white font-bold cursor-pointer"
              >
                ‹
              </button>
              <div className="text-sm font-bold text-white">
                {arabicMonthNames[calendarMonth]}{' '}
                <span className="font-num text-[#2196f3]">{calendarYear}</span>
              </div>
              <button
                onClick={handleNextMonth}
                className="w-8 h-8 rounded-lg bg-[#222630] hover:bg-[#2c313e] text-white font-bold cursor-pointer"
              >
                ›
              </button>
            </div>

            {/* Weekday Header */}
            <div className="grid grid-cols-7 gap-1 text-center py-1 text-[11px] font-bold text-[#8e9aa8] border-b border-[#242832]">
              {arabicWeekDays.map((w) => (
                <div key={w}>{w}</div>
              ))}
            </div>

            {/* Calendar Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center py-2 text-xs">
              {Array.from({ length: firstDayOfMonth(calendarYear, calendarMonth) }).map((_, i) => (
                <div key={`empty-${i}`} className="h-9" />
              ))}
              {Array.from({ length: daysInMonth(calendarYear, calendarMonth) }).map((_, idx) => {
                const day = idx + 1;
                const key = `${calendarYear}.${String(calendarMonth + 1).padStart(2, '0')}.${String(day).padStart(2, '0')}`;
                const isSelected = filterPeriod === 'custom' && customSelectedDate === key;
                const hasDeals = dealDatesSet.has(key);

                return (
                  <button
                    key={day}
                    onClick={() => handlePickDay(day)}
                    className={`h-9 rounded-xl flex flex-col items-center justify-center font-num font-bold transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#2196f3] text-white'
                        : hasDeals
                        ? 'bg-[#1f2532] text-white border border-[#2196f3]/40 hover:bg-[#2a3242]'
                        : 'text-[#8e9aa8] hover:bg-[#222630] hover:text-white'
                    }`}
                  >
                    <span className="leading-none">{day}</span>
                    {hasDeals && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                          isSelected ? 'bg-white' : 'bg-[#2196f3]'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2 pt-2 border-t border-[#242832]">
              <button
                onClick={() => {
                  setFilterPeriod('all');
                  setCustomCalendarOpen(false);
                }}
                className="flex-1 py-2.5 bg-[#222630] hover:bg-[#2c313e] text-[#cfd8dc] font-bold rounded-xl text-xs cursor-pointer"
              >
                كل السجل
              </button>
              <button
                onClick={() => setCustomCalendarOpen(false)}
                className="px-4 py-2.5 bg-[#222630] text-[#8e9aa8] font-bold rounded-xl text-xs cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
