import React, { useState, useMemo } from 'react';
import { useTrading } from '../../context/TradingContext';
import { Deal } from '../../types/mt5';

export const HistoryView: React.FC = () => {
  const { historyDeals, activeAccount, quotes, setIsDrawerOpen } = useTrading();

  const [activeSubTab, setActiveSubTab] = useState<'positions' | 'orders' | 'deals'>('positions');
  const [calendarDropdownOpen, setCalendarDropdownOpen] = useState<boolean>(false);
  const [customCalendarOpen, setCustomCalendarOpen] = useState<boolean>(false);
  const [filterPeriod, setFilterPeriod] = useState<'today' | 'week' | 'month' | '3months' | 'custom' | 'all'>('3months');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date(Date.now() - 30 * 86400000);
    return d.toISOString().slice(0, 10);
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => new Date().toISOString().slice(0, 10));

  const [symbolFilterOpen, setSymbolFilterOpen] = useState<boolean>(false);
  const [selectedSymbolFilter, setSelectedSymbolFilter] = useState<string>('all');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [expandedDealId, setExpandedDealId] = useState<string | null>(null);

  const accountDeals = useMemo(
    () => historyDeals.filter((d) => d.accountId === activeAccount.id),
    [historyDeals, activeAccount.id]
  );

  const uniqueSymbols = useMemo(() => {
    const set = new Set<string>();
    accountDeals.forEach((d) => {
      if (d.symbol && d.symbol !== 'Balance') set.add(d.symbol);
    });
    return Array.from(set);
  }, [accountDeals]);

  // Date helper strings for the Calendar Dropdown subtitles (matching PDF Page 1 bottom-left)
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
      custom: `${customStartDate.replace(/-/g, '/')} - ${customEndDate.replace(/-/g, '/')}`
    };
  }, [customStartDate, customEndDate]);

  const parseDealDate = (str: string): Date => {
    const [datePart] = (str || '').split(' ');
    const [y, m, d] = datePart.split('.').map(Number);
    return new Date(y || 2026, (m || 1) - 1, d || 1);
  };

  const filteredDeals = useMemo(() => {
    let list = accountDeals;
    if (selectedSymbolFilter !== 'all') {
      list = list.filter((d) => d.symbol === selectedSymbolFilter);
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (filterPeriod === 'today') {
      list = list.filter((d) => parseDealDate(d.closeTime) >= startOfToday);
    } else if (filterPeriod === 'week') {
      const minDate = new Date(now.getTime() - 7 * 86400000);
      list = list.filter((d) => parseDealDate(d.closeTime) >= minDate);
    } else if (filterPeriod === 'month') {
      const minDate = new Date(now.getTime() - 30 * 86400000);
      list = list.filter((d) => parseDealDate(d.closeTime) >= minDate);
    } else if (filterPeriod === '3months') {
      const minDate = new Date(now.getTime() - 90 * 86400000);
      list = list.filter((d) => parseDealDate(d.closeTime) >= minDate);
    } else if (filterPeriod === 'custom') {
      const s = new Date(customStartDate);
      const e = new Date(customEndDate);
      e.setHours(23, 59, 59, 999);
      list = list.filter((d) => {
        const dt = parseDealDate(d.closeTime);
        return dt >= s && dt <= e;
      });
    }

    return [...list].sort((a, b) =>
      sortAsc ? a.closeTime.localeCompare(b.closeTime) : b.closeTime.localeCompare(a.closeTime)
    );
  }, [accountDeals, selectedSymbolFilter, filterPeriod, customStartDate, customEndDate, sortAsc]);

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

  return (
    <div className="flex-1 flex flex-col bg-[#000000] text-white overflow-hidden select-none relative">
      {/* 1. Header (Matching PDF Page 1 bottom & Page 2 top) */}
      <header className="h-14 px-3 flex items-center justify-between bg-[#000000] shrink-0 z-30">
        {/* Right side: Hamburger + "السجل" + Symbol Subtitle */}
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
              {selectedSymbolFilter === 'all' ? 'كل الرموز' : selectedSymbolFilter}
            </span>
          </div>
        </div>

        {/* Left side icons: $ Symbol Filter, ⇅ Sort, 📅 Calendar */}
        <div className="flex items-center gap-0.5 relative">
          {/* Symbol Filter ($) */}
          <button
            onClick={() => {
              setSymbolFilterOpen((v) => !v);
              setCalendarDropdownOpen(false);
            }}
            aria-label="تصفية حسب الرمز"
            title="تصفية الرمز"
            className={`w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 font-num font-bold text-lg cursor-pointer ${
              selectedSymbolFilter !== 'all' ? 'text-[#2196f3]' : 'text-white'
            }`}
          >
            $
          </button>

          {/* Sort Arrows */}
          <button
            onClick={() => setSortAsc((v) => !v)}
            aria-label="فرز السجل"
            title="عكس الترتيب"
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-white cursor-pointer"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" className="w-5 h-5">
              <path d="M7 20V4M7 4L3.5 7.5M7 4L10.5 7.5" />
              <path d="M17 4V20M17 20L13.5 16.5M17 20L20.5 16.5" />
            </svg>
          </button>

          {/* Calendar Period Icon */}
          <button
            onClick={() => {
              setCalendarDropdownOpen((v) => !v);
              setSymbolFilterOpen(false);
            }}
            aria-label="تحديد الفترة الزمنية"
            title="تحديد الفترة الزمنية"
            className={`w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 cursor-pointer ${
              calendarDropdownOpen ? 'text-[#2196f3]' : 'text-white'
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <rect x="3" y="4" width="18" height="17" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </button>

          {/* Symbol Dropdown */}
          {symbolFilterOpen && (
            <div
              className="absolute left-16 top-12 w-44 bg-[#181b22] border border-[#2a2f3a] rounded-xl shadow-2xl py-1.5 z-50 text-xs"
              onClick={() => setSymbolFilterOpen(false)}
            >
              <button
                onClick={() => setSelectedSymbolFilter('all')}
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
                  onClick={() => setSelectedSymbolFilter(sym)}
                  className={`w-full px-3.5 py-2 text-right flex items-center justify-between hover:bg-white/5 font-num cursor-pointer ${
                    selectedSymbolFilter === sym ? 'text-[#2196f3] font-bold' : 'text-[#cfd8dc]'
                  }`}
                >
                  <span>{sym}</span>
                  {selectedSymbolFilter === sym && <span>✓</span>}
                </button>
              ))}
            </div>
          )}

          {/* Calendar Period Dropdown Menu (Exact match to PDF Page 1 bottom-left) */}
          {calendarDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setCalendarDropdownOpen(false)} />
              <div className="absolute left-0 top-12 w-64 bg-[#17191f] border border-[#2a2f3a] rounded-xl shadow-2xl py-2 z-50 animate-scaleIn">
                {[
                  { id: 'today', label: 'اليوم', sub: dateRanges.today },
                  { id: 'week', label: 'الأسبوع السابق', sub: dateRanges.week },
                  { id: 'month', label: 'الشهر السابق', sub: dateRanges.month },
                  { id: '3months', label: 'الثلاثة أشهر السابقة', sub: dateRanges.threeMonths },
                  { id: 'custom', label: 'فترة مخصصة', sub: dateRanges.custom }
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

      {/* 2. Three MT5 Sub-Tabs: الصفقات | الطلبات | المراكز */}
      <div className="grid grid-cols-3 border-b border-[#181b21] bg-[#000000] shrink-0 text-[13px] font-bold">
        {[
          { id: 'positions', label: 'المراكز' },
          { id: 'orders', label: 'الطلبات' },
          { id: 'deals', label: 'الصفقات' }
        ].map((tab) => {
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as typeof activeSubTab)}
              className={`py-2.5 text-center relative cursor-pointer transition-colors ${
                isActive ? 'text-white' : 'text-[#8e9aa8] hover:text-[#cfd8dc]'
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

      {/* 3. Summary Block (Matches PDF Page 1 & Page 2) */}
      {activeSubTab === 'orders' ? (
        <div className="px-4 py-2.5 bg-[#000000] border-b border-[#181b21] space-y-1.5 shrink-0 text-[13px]">
          <div className="flex items-baseline justify-between">
            <span className="text-white">المنفذ:</span>
            <div className="flex-1 mx-2 border-b border-dotted border-[#363c48] self-center" />
            <span className="font-num font-bold text-white">{filledOrdersCount}</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-white">الملغي:</span>
            <div className="flex-1 mx-2 border-b border-dotted border-[#363c48] self-center" />
            <span className="font-num font-bold text-white">{canceledOrdersCount}</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-white">الإجمالي:</span>
            <div className="flex-1 mx-2 border-b border-dotted border-[#363c48] self-center" />
            <span className="font-num font-bold text-white">{tradingDeals.length}</span>
          </div>
        </div>
      ) : (
        <div className="px-4 py-2.5 bg-[#000000] border-b border-[#181b21] space-y-1.5 shrink-0 text-[13px]">
          <div className="flex items-baseline justify-between">
            <span className="text-white">الربح:</span>
            <div className="flex-1 mx-2 border-b border-dotted border-[#363c48] self-center" />
            <span
              dir="ltr"
              className={`font-num font-bold ${
                totalProfit >= 0 ? 'text-[#2196f3]' : 'text-[#ef5350]'
              }`}
            >
              {totalProfit.toFixed(2)}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-white">الإيداع:</span>
            <div className="flex-1 mx-2 border-b border-dotted border-[#363c48] self-center" />
            <span className="font-num font-bold text-white">{totalDeposit.toFixed(2)}</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-white">الفائدة:</span>
            <div className="flex-1 mx-2 border-b border-dotted border-[#363c48] self-center" />
            <span className="font-num font-bold text-white">{totalSwap.toFixed(2)}</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-white">العمولة:</span>
            <div className="flex-1 mx-2 border-b border-dotted border-[#363c48] self-center" />
            <span className="font-num font-bold text-white">{totalCommission.toFixed(2)}</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-white">رصيد الحساب:</span>
            <div className="flex-1 mx-2 border-b border-dotted border-[#363c48] self-center" />
            <span dir="ltr" className="font-num font-bold text-white">
              {netBalance.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* 4. History Rows List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#14161b]">
        {tradingDeals.length === 0 ? (
          <div className="py-16 text-center text-[#8e9aa8] text-sm">
            لا توجد عمليات مسجلة في هذه الفترة الزمنية
          </div>
        ) : activeSubTab === 'orders' ? (
          /* ORDERS TAB (PDF Page 2 Top-Right) */
          tradingDeals.map((deal: Deal) => {
            const isBuy = deal.type === 'buy';
            return (
              <div key={deal.id} dir="ltr" className="px-4 py-2.5 flex items-center justify-between hover:bg-[#0b0d11]">
                <div className="text-left">
                  <div className="flex items-baseline gap-1.5 leading-tight">
                    <span className="text-[14px] font-num font-bold text-white">{deal.symbol},</span>
                    <span className={`text-[13px] font-num font-semibold ${isBuy ? 'text-[#2196f3]' : 'text-[#ef5350]'}`}>
                      {deal.type}
                    </span>
                  </div>
                  <div className="text-[12px] font-num text-[#8e9aa8] mt-0.5">
                    {deal.lots.toFixed(2)} / {deal.lots.toFixed(2)} at market
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-num text-[#8e9aa8]">{deal.openTime}</div>
                  <div className="text-[12px] font-num font-semibold text-[#cfd8dc] mt-0.5">
                    {deal.status || 'FILLED'}
                  </div>
                </div>
              </div>
            );
          })
        ) : activeSubTab === 'deals' ? (
          /* DEALS TAB (in / out — PDF Page 2 Top-Left) */
          tradingDeals.map((deal: Deal) => {
            const isBuy = deal.type === 'buy';
            const digits = getDigits(deal.symbol);
            const execPrice = deal.direction === 'in' ? deal.openPrice : deal.closePrice;
            return (
              <div key={deal.id} dir="ltr" className="px-4 py-2.5 flex items-center justify-between hover:bg-[#0b0d11]">
                <div className="text-left">
                  <div className="flex items-baseline gap-1 leading-tight">
                    <span className="text-[14px] font-num font-bold text-white">{deal.symbol},</span>
                    <span className={`text-[13px] font-num font-semibold ${isBuy ? 'text-[#2196f3]' : 'text-[#ef5350]'}`}>
                      {deal.type}, {deal.direction || 'out'}
                    </span>
                  </div>
                  <div className="text-[12px] font-num text-[#8e9aa8] mt-0.5">
                    {deal.lots.toFixed(2)} at {execPrice.toFixed(digits)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-num text-[#8e9aa8]">{deal.closeTime}</div>
                  <div
                    className={`text-[14px] font-num font-bold mt-0.5 ${
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
          /* POSITIONS TAB (PDF Page 1 Bottom) */
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
                  <div className="text-left">
                    <div className="flex items-baseline gap-1.5 leading-tight">
                      <span className="text-[14px] font-num font-bold text-white">{deal.symbol},</span>
                      <span className={`text-[13px] font-num font-semibold ${isBuy ? 'text-[#2196f3]' : 'text-[#ef5350]'}`}>
                        {deal.type} {deal.lots.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-[12px] font-num text-[#8e9aa8] mt-0.5">
                      {deal.openPrice.toFixed(digits)} → {deal.closePrice.toFixed(digits)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] font-num text-[#8e9aa8]">{deal.closeTime}</div>
                    <div
                      className={`text-[14px] font-num font-bold mt-0.5 ${
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

      {/* Custom Date Range Modal */}
      {customCalendarOpen && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fadeIn"
          onClick={() => setCustomCalendarOpen(false)}
        >
          <div
            className="bg-[#181b22] border border-[#2a2f3a] rounded-2xl w-full max-w-xs p-4 text-right shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#242832]">
              <button
                onClick={() => setCustomCalendarOpen(false)}
                className="w-7 h-7 rounded-full bg-white/5 text-[#8e9aa8] hover:text-white cursor-pointer"
              >
                ✕
              </button>
              <h3 className="font-bold text-white text-sm">تحديد فترة مخصصة</h3>
              <div className="w-7" />
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="text-[#8e9aa8] block mb-1">من تاريخ:</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full bg-[#101217] border border-[#2a2f3a] rounded-xl px-3 py-2 text-white font-num outline-none"
                />
              </div>
              <div>
                <label className="text-[#8e9aa8] block mb-1">إلى تاريخ:</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full bg-[#101217] border border-[#2a2f3a] rounded-xl px-3 py-2 text-white font-num outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  setFilterPeriod('custom');
                  setCustomCalendarOpen(false);
                }}
                className="flex-1 py-2.5 bg-[#2196f3] hover:bg-[#1976d2] text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                تطبيق
              </button>
              <button
                onClick={() => {
                  setFilterPeriod('all');
                  setCustomCalendarOpen(false);
                }}
                className="px-3 py-2.5 bg-[#242832] text-[#cfd8dc] font-bold rounded-xl text-xs cursor-pointer"
              >
                الكل
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
