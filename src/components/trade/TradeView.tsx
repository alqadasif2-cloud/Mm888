import React, { useState } from 'react';
import { useTrading } from '../../context/TradingContext';
import { Position } from '../../types/mt5';

export const TradeView: React.FC = () => {
  const {
    activeAccount,
    positions,
    quotes,
    totalProfit,
    equity,
    margin,
    freeMargin,
    marginLevel,
    closePosition,
    closeAllPositions,
    openOrderModal,
    setModifyingPosition,
    setModifyingFocus,
    setActiveTab,
    setSelectedSymbol,
    setIsDrawerOpen
  } = useTrading();

  const [expandedPosId, setExpandedPosId] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [sortMenuOpen, setSortMenuOpen] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'time' | 'profit' | 'symbol'>('time');
  const [bulkMenuOpen, setBulkMenuOpen] = useState<boolean>(false);

  const accountPositions = positions.filter((p) => p.accountId === activeAccount.id);

  const sortedPositions = [...accountPositions].sort((a, b) => {
    if (sortBy === 'profit') return sortAsc ? a.profit - b.profit : b.profit - a.profit;
    if (sortBy === 'symbol') return sortAsc ? a.symbol.localeCompare(b.symbol) : b.symbol.localeCompare(a.symbol);
    return sortAsc ? a.ticket - b.ticket : b.ticket - a.ticket;
  });

  const getDigits = (symbol: string) => {
    return quotes.find((q) => q.symbol === symbol)?.digits ?? 2;
  };

  const handleOpenModify = (pos: Position) => {
    setModifyingFocus(null);
    setModifyingPosition(pos);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#000000] text-white overflow-hidden select-none">
      {/* 1. Header (Matching PDF Page 1 Top Screenshots) */}
      <header className="h-14 px-3 flex items-center justify-between border-b border-[#14161b] bg-[#000000] shrink-0 z-20">
        {/* Right side: Hamburger + Title "التداول" + Floating Profit USD */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsDrawerOpen(true)}
            aria-label="القائمة"
            className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-6 h-6">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div>
            <h1 className="text-[17px] font-bold leading-tight text-white">التداول</h1>
            <span
              dir="ltr"
              className={`text-[12px] font-num font-semibold block leading-tight ${
                totalProfit > 0 ? 'text-[#2196f3]' : totalProfit < 0 ? 'text-[#ef5350]' : 'text-[#cfd8dc]'
              }`}
            >
              {totalProfit.toFixed(2)} {activeAccount.currency}
            </span>
          </div>
        </div>

        {/* Left side icons: Sort Arrows, New Order (+Box) */}
        <div className="flex items-center gap-1 relative">
          <button
            onClick={() => setSortMenuOpen((v) => !v)}
            aria-label="فرز الصفقات"
            title="فرز الصفقات"
            className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" className="w-5 h-5">
              <path d="M7 20V4M7 4L3.5 7.5M7 4L10.5 7.5" />
              <path d="M17 4V20M17 20L13.5 16.5M17 20L20.5 16.5" />
            </svg>
          </button>

          {sortMenuOpen && (
            <div
              className="absolute left-10 top-12 w-44 bg-[#181b22] border border-[#2a2f3a] rounded-xl shadow-2xl py-1.5 z-40 text-xs"
              onClick={() => setSortMenuOpen(false)}
            >
              {[
                { id: 'time', label: 'الترتيب حسب الوقت' },
                { id: 'profit', label: 'الترتيب حسب الربح' },
                { id: 'symbol', label: 'الترتيب حسب الرمز' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    if (sortBy === opt.id) setSortAsc((v) => !v);
                    else {
                      setSortBy(opt.id as 'time' | 'profit' | 'symbol');
                      setSortAsc(false);
                    }
                  }}
                  className={`w-full px-3.5 py-2 text-right flex items-center justify-between hover:bg-white/5 cursor-pointer ${
                    sortBy === opt.id ? 'text-[#2196f3] font-bold' : 'text-[#cfd8dc]'
                  }`}
                >
                  <span>{opt.label}</span>
                  {sortBy === opt.id && <span>{sortAsc ? '↑' : '↓'}</span>}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => openOrderModal()}
            aria-label="أمر تداول جديد"
            title="أمر جديد"
            className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </button>
        </div>
      </header>

      {/* 2. Authentic Dotted Summary Rows (Matching PDF Page 1) */}
      <div className="px-4 py-2.5 bg-[#000000] space-y-1.5 shrink-0">
        <div className="flex items-baseline justify-between text-[13px]">
          <span className="text-white shrink-0">رصيد الحساب:</span>
          <div className="flex-1 mx-2 border-b border-dotted border-[#363c48] self-center" />
          <span className="font-num font-bold text-white shrink-0">
            {activeAccount.balance.toFixed(2)}
          </span>
        </div>

        <div className="flex items-baseline justify-between text-[13px]">
          <span className="text-white shrink-0">قيمة رأس المال:</span>
          <div className="flex-1 mx-2 border-b border-dotted border-[#363c48] self-center" />
          <span className="font-num font-bold text-white shrink-0">
            {equity.toFixed(2)}
          </span>
        </div>

        <div className="flex items-baseline justify-between text-[13px]">
          <span className="text-white shrink-0">الهامش المتاح:</span>
          <div className="flex-1 mx-2 border-b border-dotted border-[#363c48] self-center" />
          <span className="font-num font-bold text-white shrink-0">
            {freeMargin.toFixed(2)}
          </span>
        </div>

        {margin > 0 && (
          <>
            <div className="flex items-baseline justify-between text-[13px]">
              <span className="text-[#8e9aa8] shrink-0">الهامش:</span>
              <div className="flex-1 mx-2 border-b border-dotted border-[#363c48] self-center" />
              <span className="font-num font-semibold text-[#cfd8dc] shrink-0">
                {margin.toFixed(2)}
              </span>
            </div>
            <div className="flex items-baseline justify-between text-[13px]">
              <span className="text-[#8e9aa8] shrink-0">مستوى الهامش (%):</span>
              <div className="flex-1 mx-2 border-b border-dotted border-[#363c48] self-center" />
              <span className="font-num font-semibold text-[#cfd8dc] shrink-0">
                {marginLevel.toFixed(2)}
              </span>
            </div>
          </>
        )}
      </div>

      {/* 3. Section Bar: "المراكز" on Right, "..." Bulk Menu on Left */}
      <div className="px-4 py-1.5 bg-[#0b0d11] border-y border-[#181b21] flex items-center justify-between text-[12px] font-bold text-[#8e9aa8] relative shrink-0">
        <span>المراكز</span>
        <button
          onClick={() => setBulkMenuOpen((v) => !v)}
          aria-label="خيارات المراكز"
          className="px-2 py-0.5 text-white hover:bg-white/10 rounded cursor-pointer tracking-widest"
        >
          •••
        </button>

        {bulkMenuOpen && (
          <div
            className="absolute left-3 top-8 w-48 bg-[#181b22] border border-[#2a2f3a] rounded-xl shadow-2xl py-1.5 z-40 text-xs font-medium"
            onClick={() => setBulkMenuOpen(false)}
          >
            <button
              onClick={() => openOrderModal()}
              className="w-full px-3.5 py-2.5 text-right text-white hover:bg-white/5 cursor-pointer"
            >
              فتح صفقة جديدة
            </button>
            {accountPositions.length > 0 && (
              <button
                onClick={closeAllPositions}
                className="w-full px-3.5 py-2.5 text-right text-[#ef5350] hover:bg-white/5 cursor-pointer"
              >
                إغلاق جميع المراكز ({accountPositions.length})
              </button>
            )}
          </div>
        )}
      </div>

      {/* 4. Active Positions List (Tap to expand inline details per PDF Page 1 Item 1) */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#14161b]">
        {sortedPositions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center text-[#8e9aa8]">
            <p className="text-sm font-semibold text-[#cfd8dc]">لا توجد صفقات نشطة حالياً</p>
            <p className="text-xs mt-1 text-[#707c8b]">اضغط على زر (+) في الأعلى لفتح صفقة جديدة</p>
            <button
              onClick={() => openOrderModal()}
              className="mt-4 px-5 py-2.5 bg-[#1976d2] hover:bg-[#1565c0] text-white font-bold rounded-xl text-xs cursor-pointer transition-colors"
            >
              أمر تداول جديد
            </button>
          </div>
        ) : (
          sortedPositions.map((pos) => {
            const digits = getDigits(pos.symbol);
            const isExpanded = expandedPosId === pos.id;
            const isPositive = pos.profit >= 0;

            return (
              <div
                key={pos.id}
                onClick={() => setExpandedPosId(isExpanded ? null : pos.id)}
                className="px-4 py-2.5 bg-[#000000] hover:bg-[#0b0d11] transition-colors cursor-pointer"
              >
                {/* Collapsed Main Row (Exact MT5 Layout: Symbol/Type/Price on Left, Profit on Right) */}
                <div dir="ltr" className="flex items-center justify-between">
                  <div className="text-left">
                    <div className="flex items-baseline gap-1.5 leading-tight">
                      <span className="text-[14px] font-num font-bold text-white">
                        {pos.symbol},
                      </span>
                      <span
                        className={`text-[13px] font-num font-semibold ${
                          pos.type === 'buy' ? 'text-[#2196f3]' : 'text-[#ef5350]'
                        }`}
                      >
                        {pos.type} {pos.lots.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-[12px] font-num text-[#8e9aa8] mt-0.5 leading-tight">
                      <span>{pos.openPrice.toFixed(digits)}</span>
                      <span className="mx-1 text-[#64707d]">→</span>
                      <span className="text-[#b8c2cc]">{pos.currentPrice.toFixed(digits)}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-[15px] font-num font-bold ${
                        isPositive ? 'text-[#2196f3]' : 'text-[#ef5350]'
                      }`}
                    >
                      {pos.profit.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Expanded Inline Details (Exact match to PDF Page 1 "بعد النقر") */}
                {isExpanded && (
                  <div
                    className="mt-2.5 pt-2 border-t border-[#181b21] space-y-2 animate-fadeIn"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Timestamp line */}
                    <div className="text-[11px] font-num text-[#8e9aa8] text-right" dir="ltr">
                      {pos.openTime}
                    </div>

                    {/* 2-Column Details Grid: S/L, T/P, Swap, #ID */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11.5px] text-[#8e9aa8]">
                      <div className="flex items-center justify-between">
                        <span>وقف الخسارة:</span>
                        <span className="font-num text-[#cfd8dc]">
                          {pos.sl ? pos.sl.toFixed(digits) : '—'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>الفائدة:</span>
                        <span className="font-num text-[#cfd8dc]">{pos.swap.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>T/P:</span>
                        <span className="font-num text-[#cfd8dc]">
                          {pos.tp ? pos.tp.toFixed(digits) : '—'}
                        </span>
                      </div>
                      <div className="flex items-center justify-end font-num text-[#8e9aa8]">
                        #{pos.ticket}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-3 gap-2 pt-1.5">
                      <button
                        onClick={() => closePosition(pos.id)}
                        className="py-2 bg-[#d32f2f] hover:bg-[#c62828] text-white font-bold rounded-lg text-[11px] cursor-pointer transition-colors"
                      >
                        إغلاق المركز
                      </button>
                      <button
                        onClick={() => handleOpenModify(pos)}
                        className="py-2 bg-[#161a22] hover:bg-[#1f2530] text-[#3897f0] font-bold rounded-lg text-[11px] border border-[#28303e] cursor-pointer transition-colors"
                      >
                        تعديل S/L T/P
                      </button>
                      <button
                        onClick={() => {
                          setSelectedSymbol(pos.symbol);
                          setActiveTab('chart');
                        }}
                        className="py-2 bg-[#161a22] hover:bg-[#1f2530] text-white font-bold rounded-lg text-[11px] border border-[#28303e] cursor-pointer transition-colors"
                      >
                        الرسم البياني
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
