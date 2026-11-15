import React from 'react';
import { useTrading } from '../../context/TradingContext';
import { ExnessLogo, MetaQuotesLogo } from '../common/Logos';

export const AccountInfoModal: React.FC = () => {
  const { accountInfoModalOpen, setAccountInfoModalOpen, activeAccount } = useTrading();

  if (!accountInfoModalOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 select-none animate-fadeIn"
      onClick={() => setAccountInfoModalOpen(false)}
    >
      <div
        className="bg-[#161920] border border-[#2a2f3a] rounded-2xl w-full max-w-sm overflow-hidden text-right shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 bg-[#101318] border-b border-[#222732] flex items-center justify-between">
          <button
            onClick={() => setAccountInfoModalOpen(false)}
            className="w-8 h-8 rounded-full bg-white/5 text-[#8e9aa8] hover:text-white cursor-pointer"
          >
            ✕
          </button>
          <h3 className="text-base font-bold text-white">خصائص الحساب</h3>
          <div className="w-8" />
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            {activeAccount.logoType === 'exness' ? (
              <ExnessLogo className="w-12 h-12" />
            ) : (
              <MetaQuotesLogo className="w-12 h-12" />
            )}
            <div>
              <h4 className="text-base font-bold text-white">{activeAccount.name}</h4>
              <p className="text-xs text-[#64b5f6] font-semibold">{activeAccount.broker}</p>
              <p className="text-xs font-num text-[#8e9aa8]">{activeAccount.accountNumber}</p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-[#222732]">
              <span className="text-[#8e9aa8]">نوع الحساب:</span>
              <span className="font-bold text-white">
                {activeAccount.type === 'real' ? 'حقيقي (Real)' : 'تجريبي (Demo)'}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-[#222732]">
              <span className="text-[#8e9aa8]">الخادم:</span>
              <span className="font-num font-bold text-[#64b5f6]">{activeAccount.server}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-[#222732]">
              <span className="text-[#8e9aa8]">الرافعة المالية:</span>
              <span className="font-num font-bold text-white">{activeAccount.leverage}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-[#222732]">
              <span className="text-[#8e9aa8]">العملة:</span>
              <span className="font-num font-bold text-white">{activeAccount.currency}</span>
            </div>
          </div>

          <button
            onClick={() => setAccountInfoModalOpen(false)}
            className="w-full py-2.5 bg-[#1976d2] hover:bg-[#1565c0] text-white font-bold rounded-xl text-xs cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
