import React, { useState } from 'react';
import { useTrading } from '../../context/TradingContext';
import { ExnessLogo, MetaQuotesLogo } from '../common/Logos';

export const AccountsView: React.FC = () => {
  const {
    accounts,
    activeAccount,
    setActiveAccount,
    setActiveTab,
    setIsDrawerOpen,
    setAddAccountModalOpen,
    setAccountInfoModalOpen,
    setOtpModalOpen,
    deleteAccount
  } = useTrading();

  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  const handleSelectAccount = (accId: string) => {
    const found = accounts.find((a) => a.id === accId);
    if (found) {
      setActiveAccount(found);
      setActiveTab('trade');
    }
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
          <h1 className="text-[17px] font-bold text-white">الحسابات</h1>
        </div>

        <div className="flex items-center gap-0.5 relative">
          <button
            onClick={() => setAddAccountModalOpen(true)}
            aria-label="إضافة حساب جديد"
            className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-full cursor-pointer"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" className="w-5 h-5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>

          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="خيارات الحساب"
            className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-full cursor-pointer"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <circle cx="12" cy="5" r="1.8" />
              <circle cx="12" cy="12" r="1.8" />
              <circle cx="12" cy="19" r="1.8" />
            </svg>
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
              <div className="absolute left-0 top-12 w-48 bg-[#181b22] border border-[#2a2f3a] rounded-xl shadow-2xl py-1.5 z-40 text-xs font-semibold">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setAccountInfoModalOpen(true);
                  }}
                  className="w-full px-4 py-2.5 text-right text-white hover:bg-white/5 cursor-pointer"
                >
                  خصائص الحساب
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setOtpModalOpen(true);
                  }}
                  className="w-full px-4 py-2.5 text-right text-white hover:bg-white/5 cursor-pointer"
                >
                  مولد كلمات المرور (OTP)
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Accounts List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {accounts.map((acc) => {
          const isActive = acc.id === activeAccount.id;
          return (
            <div
              key={acc.id}
              onClick={() => handleSelectAccount(acc.id)}
              className={`p-3.5 rounded-xl border transition-colors cursor-pointer ${
                isActive
                  ? 'bg-[#12161e] border-[#2196f3]'
                  : 'bg-[#0b0d11] border-[#1c2028] hover:border-[#2c3340]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {acc.logoType === 'exness' ? (
                    <ExnessLogo className="w-11 h-11" />
                  ) : (
                    <MetaQuotesLogo className="w-11 h-11" />
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[15px] font-bold text-white truncate">{acc.name}</h3>
                      <span
                        className={`text-[10px] font-num font-bold uppercase ${
                          acc.type === 'real' ? 'text-[#26a69a]' : 'text-[#3897f0]'
                        }`}
                      >
                        {acc.type === 'real' ? 'Real' : 'Demo'}
                      </span>
                    </div>
                    <p className="text-[12px] text-[#8e9aa8] truncate">{acc.broker}</p>
                    <p className="text-[12px] font-num text-[#64b5f6] mt-0.5" dir="ltr">
                      {acc.accountNumber} - {acc.server}
                    </p>
                  </div>
                </div>

                <div className="text-left shrink-0" dir="ltr">
                  <div className="text-[16px] font-num font-bold text-white">
                    {acc.balance.toFixed(2)} {acc.currency}
                  </div>
                  <div className="text-[11px] font-num text-[#8e9aa8] mt-0.5">
                    {acc.leverage}
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-[#1a1e26] flex items-center justify-between text-[11px]">
                <span className={isActive ? 'text-[#2196f3] font-bold' : 'text-[#8e9aa8]'}>
                  {isActive ? '✓ الحساب النشط حالياً' : 'اضغط للتبديل إلى هذا الحساب'}
                </span>
                {accounts.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteAccount(acc.id);
                    }}
                    className="text-[#ef5350] hover:underline px-2 py-0.5 cursor-pointer"
                  >
                    حذف
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
