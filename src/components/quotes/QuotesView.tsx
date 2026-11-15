import React, { useState } from 'react';
import { useTrading } from '../../context/TradingContext';
import { SymbolQuote } from '../../types/mt5';

export const QuotesView: React.FC = () => {
  const {
    quotes,
    selectedSymbol,
    setSelectedSymbol,
    setActiveTab,
    openOrderModal,
    setIsDrawerOpen
  } = useTrading();

  const [isAdvanced, setIsAdvanced] = useState<boolean>(true);
  const [selectedQuoteForMenu, setSelectedQuoteForMenu] = useState<SymbolQuote | null>(null);
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'crypto' | 'metals' | 'commodities' | 'forex' | 'indices'>('all');

  const filteredQuotes = quotes.filter((q) => {
    const matchesSearch =
      q.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || q.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const formatMT5Price = (price: number, digits: number) => {
    const str = price.toFixed(digits);
    if (digits >= 4) {
      const len = str.length;
      return {
        prefix: str.slice(0, len - 3),
        bigDigits: str.slice(len - 3, len - 1),
        superDigit: str.slice(len - 1)
      };
    }
    if (digits === 3) {
      const len = str.length;
      return {
        prefix: str.slice(0, len - 3),
        bigDigits: str.slice(len - 3, len - 1),
        superDigit: str.slice(len - 1)
      };
    }
    const parts = str.split('.');
    return {
      prefix: parts[0] + (parts[1] ? '.' : ''),
      bigDigits: parts[1] || '',
      superDigit: ''
    };
  };

  return (
    <div className="flex-1 flex flex-col bg-[#000000] text-white overflow-hidden select-none">
      {/* Header */}
      <header className="h-14 px-3 flex items-center justify-between border-b border-[#14161b] bg-[#000000] shrink-0">
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
          <h1 className="text-[17px] font-bold text-white">طلبات الأسعار</h1>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setSearchOpen((v) => !v)}
            aria-label="بحث عن رمز"
            className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-full cursor-pointer"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <circle cx="11" cy="11" r="7" />
              <line x1="16.5" y1="16.5" x2="21" y2="21" />
            </svg>
          </button>
          <button
            onClick={() => setIsAdvanced((v) => !v)}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#161920] text-[#64b5f6] border border-[#262b36] cursor-pointer"
          >
            {isAdvanced ? 'متقدم' : 'بسيط'}
          </button>
        </div>
      </header>

      {searchOpen && (
        <div className="px-3 py-2 bg-[#0a0c10] border-b border-[#181b21]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن رمز مثل BTCUSDm أو XAUUSDm..."
            className="w-full bg-[#14171e] border border-[#262b36] rounded-xl px-3 py-2 text-xs text-white outline-none"
          />
        </div>
      )}

      {/* Category Filter */}
      <div className="flex items-center gap-1.5 px-3 py-2 overflow-x-auto bg-[#07080b] border-b border-[#14161b] scrollbar-none shrink-0">
        {[
          { id: 'all', label: 'الكل' },
          { id: 'crypto', label: 'العملات الرقمية' },
          { id: 'metals', label: 'المعادن' },
          { id: 'commodities', label: 'النفط والسلع' },
          { id: 'forex', label: 'الفوركس' },
          { id: 'indices', label: 'المؤشرات' }
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id as typeof activeCategory)}
            className={`px-3 py-1 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
              activeCategory === cat.id
                ? 'bg-[#2196f3] text-white'
                : 'bg-[#14171d] text-[#8e9aa8] hover:text-white'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Quotes List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#14161b]">
        {filteredQuotes.map((q) => {
          const bidFmt = formatMT5Price(q.bid, q.digits);
          const askFmt = formatMT5Price(q.ask, q.digits);
          const priceColor =
            q.tickDirection === 'down' ? 'text-[#ef5350]' : 'text-[#2196f3]';

          return (
            <div
              key={q.symbol}
              onClick={() => setSelectedQuoteForMenu(q)}
              className={`px-3.5 py-2.5 flex items-center justify-between hover:bg-[#0b0d11] cursor-pointer transition-colors ${
                selectedSymbol === q.symbol ? 'bg-[#0b0e14]' : ''
              }`}
            >
              {/* Right side in RTL: Symbol & Metadata */}
              <div className="text-right min-w-0 pr-1">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-num font-bold text-white">{q.symbol}</span>
                  <span
                    dir="ltr"
                    className={`text-[11px] font-num ${
                      q.change >= 0 ? 'text-[#26a69a]' : 'text-[#ef5350]'
                    }`}
                  >
                    {q.change >= 0 ? `+${q.change.toFixed(2)}%` : `${q.change.toFixed(2)}%`}
                  </span>
                </div>
                {isAdvanced && (
                  <div className="text-[11px] font-num text-[#8e9aa8] mt-0.5 flex items-center gap-2">
                    <span>{q.time}</span>
                    <span>·</span>
                    <span>Spread: {q.spread}</span>
                  </div>
                )}
              </div>

              {/* Left side in RTL: Bid & Ask MT5 Display */}
              <div dir="ltr" className="flex items-center gap-4 shrink-0 font-num">
                {/* Bid */}
                <div className="text-right">
                  <div className={`leading-none ${priceColor}`}>
                    <span className="text-[13px] font-medium">{bidFmt.prefix}</span>
                    <span className="text-[18px] font-bold">{bidFmt.bigDigits}</span>
                    {bidFmt.superDigit && (
                      <sup className="text-[10px] font-bold -top-1.5">{bidFmt.superDigit}</sup>
                    )}
                  </div>
                  {isAdvanced && (
                    <div className="text-[10px] text-[#8e9aa8] mt-1">L: {q.low.toFixed(q.digits)}</div>
                  )}
                </div>

                {/* Ask */}
                <div className="text-right">
                  <div className={`leading-none ${priceColor}`}>
                    <span className="text-[13px] font-medium">{askFmt.prefix}</span>
                    <span className="text-[18px] font-bold">{askFmt.bigDigits}</span>
                    {askFmt.superDigit && (
                      <sup className="text-[10px] font-bold -top-1.5">{askFmt.superDigit}</sup>
                    )}
                  </div>
                  {isAdvanced && (
                    <div className="text-[10px] text-[#8e9aa8] mt-1">H: {q.high.toFixed(q.digits)}</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tap Row Context Bottom Sheet */}
      {selectedQuoteForMenu && (
        <div
          className="fixed inset-0 bg-black/75 z-50 flex items-end justify-center animate-fadeIn"
          onClick={() => setSelectedQuoteForMenu(null)}
        >
          <div
            className="bg-[#161920] border-t border-[#282d38] rounded-t-2xl w-full max-w-md p-4 space-y-2 text-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pb-2 border-b border-[#242934] flex items-center justify-between">
              <button
                onClick={() => setSelectedQuoteForMenu(null)}
                className="text-[#8e9aa8] hover:text-white text-sm px-2 cursor-pointer"
              >
                ✕
              </button>
              <div>
                <h3 className="font-num font-bold text-white text-base">{selectedQuoteForMenu.symbol}</h3>
                <p className="text-[11px] text-[#8e9aa8]">{selectedQuoteForMenu.name}</p>
              </div>
            </div>

            <button
              onClick={() => {
                const sym = selectedQuoteForMenu.symbol;
                setSelectedQuoteForMenu(null);
                setSelectedSymbol(sym);
                openOrderModal(sym);
              }}
              className="w-full py-3 px-4 rounded-xl bg-[#1e232d] hover:bg-[#262c38] text-white font-bold text-sm text-right cursor-pointer"
            >
              أمر تداول جديد
            </button>

            <button
              onClick={() => {
                const sym = selectedQuoteForMenu.symbol;
                setSelectedQuoteForMenu(null);
                setSelectedSymbol(sym);
                setActiveTab('chart');
              }}
              className="w-full py-3 px-4 rounded-xl bg-[#1e232d] hover:bg-[#262c38] text-[#3897f0] font-bold text-sm text-right cursor-pointer"
            >
              فتح الرسم البياني
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
