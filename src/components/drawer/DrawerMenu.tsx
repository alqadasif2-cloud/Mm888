import React, { useState } from 'react';
import { useTrading } from '../../context/TradingContext';
import { ExnessLogo, MetaQuotesLogo } from '../common/Logos';
import { TabType } from '../../types/mt5';

export const DrawerMenu: React.FC = () => {
  const {
    isDrawerOpen,
    setIsDrawerOpen,
    activeAccount,
    setActiveTab,
    unreadCount,
    setAccountInfoModalOpen,
    setOtpModalOpen
  } = useTrading();

  const [infoToast, setInfoToast] = useState<string | null>(null);

  if (!isDrawerOpen) return null;

  const navigateTo = (tab: TabType) => {
    setActiveTab(tab);
    setIsDrawerOpen(false);
  };

  const showFeatureNotice = (label: string) => {
    setInfoToast(label);
    setTimeout(() => setInfoToast(null), 2200);
  };

  return (
    <div className="fixed inset-0 z-50 flex select-none animate-fadeIn">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75"
        onClick={() => setIsDrawerOpen(false)}
      />

      {/* Drawer Panel (Exact match to Screenshot_20261115132823_43902b95.jpg) */}
      <aside className="relative z-10 w-[295px] max-w-[82vw] h-full bg-[#000000] border-l border-[#1f2228] flex flex-col shadow-2xl">
        {/* Top Account Header */}
        <div
          onClick={() => navigateTo('accounts')}
          className="px-4 pt-5 pb-4 border-b border-[#22252b] cursor-pointer hover:bg-[#0c0e12] transition-colors"
        >
          <div className="flex items-center justify-between gap-3">
            {/* Left in RTL: Name + Server */}
            <div className="flex-1 text-left min-w-0" dir="ltr">
              <h2 className="text-[17px] font-bold text-white truncate leading-tight">
                {activeAccount.name}
              </h2>
              <p className="text-[13px] font-num text-[#8e959e] mt-1 truncate leading-tight">
                {activeAccount.accountNumber} - {activeAccount.server}
              </p>
            </div>
            {/* Right in RTL: Broker Square Logo */}
            <div className="shrink-0">
              {activeAccount.logoType === 'exness' ? (
                <ExnessLogo className="w-11 h-11 rounded-none" />
              ) : (
                <MetaQuotesLogo className="w-11 h-11" />
              )}
            </div>
          </div>

          <div className="mt-3 text-left" dir="ltr">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigateTo('accounts');
              }}
              className="text-[#3588e8] text-[14px] font-medium hover:underline cursor-pointer"
            >
              إدارة الحسابات
            </button>
          </div>
        </div>

        {/* Menu Items List matching Screenshot_20261115132823_43902b95.jpg */}
        <nav className="flex-1 overflow-y-auto py-2">
          {/* 1. التداول */}
          <button
            onClick={() => navigateTo('trade')}
            className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-white/5 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-[#cfd8dc]">
                <polyline points="4 16 9 11 13 14 20 7" />
                <circle cx="4" cy="16" r="1.5" fill="currentColor" />
                <circle cx="9" cy="11" r="1.5" fill="currentColor" />
                <circle cx="13" cy="14" r="1.5" fill="currentColor" />
                <circle cx="20" cy="7" r="1.7" fill="currentColor" />
              </svg>
              <span className="text-[15px] font-medium text-white">التداول</span>
            </div>
          </button>

          {/* 2. الأخبار */}
          <button
            onClick={() => navigateTo('messages')}
            className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-white/5 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5 text-[#cfd8dc]">
                <path d="M4 5h12v14H4z" />
                <path d="M16 9h4v8a2 2 0 0 1-2 2h-2" />
                <line x1="7" y1="9" x2="13" y2="9" />
                <line x1="7" y1="13" x2="13" y2="13" />
              </svg>
              <span className="text-[15px] font-medium text-white">الأخبار</span>
            </div>
          </button>

          {/* 3. صندوق البريد (with Red Badge) */}
          <button
            onClick={() => navigateTo('messages')}
            className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-white/5 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5 text-[#cfd8dc]">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <polyline points="3 7 12 13 21 7" />
              </svg>
              <span className="text-[15px] font-medium text-white">صندوق البريد</span>
            </div>
            {unreadCount > 0 && (
              <span className="bg-[#ea4335] text-white text-[11px] font-num font-bold rounded-full w-6 h-6 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* 4. دفتر اليومية */}
          <button
            onClick={() => navigateTo('history')}
            className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-white/5 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5 text-[#cfd8dc]">
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <line x1="12" y1="4" x2="12" y2="20" />
                <line x1="6" y1="9" x2="9" y2="9" />
                <line x1="6" y1="13" x2="9" y2="13" />
                <line x1="15" y1="9" x2="18" y2="9" />
                <line x1="15" y1="13" x2="18" y2="13" />
              </svg>
              <span className="text-[15px] font-medium text-white">دفتر اليومية</span>
            </div>
          </button>

          {/* 5. الأعدادات */}
          <button
            onClick={() => {
              setIsDrawerOpen(false);
              setOtpModalOpen(true);
            }}
            className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-white/5 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5 text-[#cfd8dc]">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.6.86 1 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              <span className="text-[15px] font-medium text-white">الأعدادات</span>
            </div>
          </button>

          {/* 6. التقويم الاقتصادي + Ads pill */}
          <button
            onClick={() => showFeatureNotice('التقويم الاقتصادي المباشر')}
            className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-white/5 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5 text-[#cfd8dc]">
                <rect x="3" y="4" width="18" height="17" rx="2" />
                <line x1="3" y1="9.5" x2="21" y2="9.5" />
                <line x1="8" y1="2.5" x2="8" y2="6" />
                <line x1="16" y1="2.5" x2="16" y2="6" />
              </svg>
              <span className="text-[15px] font-medium text-white">التقويم الاقتصادي</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full border border-[#3588e8] text-[#3588e8] text-[11px] font-num font-semibold">
              Ads
            </span>
          </button>

          {/* 7. مجتمع المتداولين */}
          <button
            onClick={() => showFeatureNotice('مجتمع المتداولين MQL5')}
            className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-white/5 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5 text-[#cfd8dc]">
                <circle cx="9" cy="7" r="3" />
                <path d="M4 20v-2a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v2" />
                <circle cx="17" cy="8" r="2.5" />
                <path d="M16 14h2a3 3 0 0 1 3 3v3" />
              </svg>
              <span className="text-[15px] font-medium text-white">مجتمع المتداولين</span>
            </div>
          </button>

          {/* 8. MQL5 Algo Trading */}
          <button
            onClick={() => showFeatureNotice('MQL5 Algo Trading')}
            className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-white/5 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5 text-[#cfd8dc]">
                <path d="M22 2L11 13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
              <span className="text-[15px] font-num font-semibold text-white">MQL5 Algo Trading</span>
            </div>
          </button>

          {/* 9. دليل المستخدم */}
          <button
            onClick={() => showFeatureNotice('دليل استخدام MetaTrader 5')}
            className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-white/5 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5 text-[#cfd8dc]">
                <circle cx="12" cy="12" r="9.5" />
                <path d="M9.5 9.5a2.5 2.5 0 0 1 5 .5c0 1.8-2.5 2-2.5 3.5" />
                <circle cx="12" cy="17" r="0.8" fill="currentColor" />
              </svg>
              <span className="text-[15px] font-medium text-white">دليل المستخدم</span>
            </div>
          </button>

          {/* 10. عن */}
          <button
            onClick={() => {
              setIsDrawerOpen(false);
              setAccountInfoModalOpen(true);
            }}
            className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-white/5 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5 text-[#cfd8dc]">
                <circle cx="12" cy="12" r="9.5" />
                <line x1="12" y1="11" x2="12" y2="16.5" strokeLinecap="round" />
                <circle cx="12" cy="7.8" r="0.9" fill="currentColor" stroke="none" />
              </svg>
              <span className="text-[15px] font-medium text-white">عن</span>
            </div>
          </button>
        </nav>

        {infoToast && (
          <div className="mx-3 mb-3 px-3 py-2 bg-[#1a2232] border border-[#3588e8] text-[#cfd8dc] text-xs rounded-xl text-center">
            {infoToast}
          </div>
        )}
      </aside>
    </div>
  );
};
