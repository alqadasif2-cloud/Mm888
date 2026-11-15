import React from 'react';
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
    setOtpModalOpen,
    setAddAccountModalOpen
  } = useTrading();

  if (!isDrawerOpen) return null;

  const navigateTo = (tab: TabType) => {
    setActiveTab(tab);
    setIsDrawerOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex select-none animate-fadeIn">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70"
        onClick={() => setIsDrawerOpen(false)}
      />

      {/* Drawer Panel (Right side in RTL) */}
      <aside className="relative z-10 w-[290px] max-w-[82vw] h-full bg-[#12151b] border-l border-[#222732] flex flex-col shadow-2xl">
        {/* Account Header */}
        <div
          onClick={() => navigateTo('accounts')}
          className="p-4 bg-[#0d1015] border-b border-[#1f242e] cursor-pointer hover:bg-[#141820] transition-colors"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="text-right min-w-0">
              <h2 className="text-[16px] font-bold text-white truncate">{activeAccount.name}</h2>
              <p className="text-[12px] font-num text-[#8e9aa8] mt-0.5 truncate" dir="ltr">
                {activeAccount.accountNumber} - {activeAccount.server}
              </p>
            </div>
            {activeAccount.logoType === 'exness' ? (
              <ExnessLogo className="w-11 h-11" />
            ) : (
              <MetaQuotesLogo className="w-11 h-11" />
            )}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigateTo('accounts');
              }}
              className="text-[#3897f0] text-[13px] font-bold hover:underline cursor-pointer"
            >
              إدارة الحسابات
            </button>
            <span className="text-[12px] font-num font-bold text-white" dir="ltr">
              {activeAccount.balance.toFixed(2)} {activeAccount.currency}
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-2">
          {[
            { id: 'trade' as TabType, label: 'التداول' },
            { id: 'quotes' as TabType, label: 'طلبات الأسعار' },
            { id: 'chart' as TabType, label: 'الرسم البياني' },
            { id: 'history' as TabType, label: 'السجل' },
            { id: 'messages' as TabType, label: 'الرسائل', badge: unreadCount }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => navigateTo(item.id)}
              className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-white/5 text-right cursor-pointer transition-colors"
            >
              <span className="text-[14px] font-semibold text-white">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="bg-[#ea4335] text-white text-[11px] font-num font-bold rounded-full px-2 py-0.5">
                  {item.badge}
                </span>
              )}
            </button>
          ))}

          <div className="my-2 border-t border-[#1e232d]" />

          <button
            onClick={() => {
              setIsDrawerOpen(false);
              setAddAccountModalOpen(true);
            }}
            className="w-full px-5 py-3 text-right text-[14px] font-semibold text-[#cfd8dc] hover:bg-white/5 cursor-pointer"
          >
            فتح حساب جديد
          </button>
          <button
            onClick={() => {
              setIsDrawerOpen(false);
              setAccountInfoModalOpen(true);
            }}
            className="w-full px-5 py-3 text-right text-[14px] font-semibold text-[#cfd8dc] hover:bg-white/5 cursor-pointer"
          >
            خصائص الحساب
          </button>
          <button
            onClick={() => {
              setIsDrawerOpen(false);
              setOtpModalOpen(true);
            }}
            className="w-full px-5 py-3 text-right text-[14px] font-semibold text-[#cfd8dc] hover:bg-white/5 cursor-pointer"
          >
            مولد OTP
          </button>
        </nav>
      </aside>
    </div>
  );
};
