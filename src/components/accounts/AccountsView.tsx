import React, { useState } from 'react';
import { useTrading } from '../../context/TradingContext';
import { ExnessLogo, MetaQuotesLogo } from '../common/Logos';

const QrIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-[#cfd8dc]">
    <path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm13-2h3v2h-3v-2zm-5 0h2v4h-2v-4zm5 4h3v4h-3v-4zm-2-2h2v2h-2v-2zm-3 4h2v2h-2v-2z" />
  </svg>
);

export const AccountsView: React.FC = () => {
  const {
    accounts,
    activeAccount,
    setActiveAccount,
    setActiveTab,
    setIsDrawerOpen,
    setAddAccountModalOpen,
    setAccountInfoModalOpen,
    setOtpModalOpen
  } = useTrading();

  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [qrToast, setQrToast] = useState<string | null>(null);

  const secondaryAccounts = accounts.filter((a) => a.id !== activeAccount.id);

  const handleSelectAccount = (accId: string) => {
    const found = accounts.find((a) => a.id === accId);
    if (found) {
      setActiveAccount(found);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#000000] text-white overflow-hidden select-none relative">
      {/* Header (Exact match to Screenshot_20261115132806_ae5c07c8.jpg) */}
      <header className="h-14 px-3 flex items-center justify-between bg-[#000000] shrink-0">
        {/* Right side: Hamburger + "الحسابات" */}
        <div className="flex items-center gap-3">
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
          <h1 className="text-[19px] font-medium text-white">الحسابات</h1>
        </div>

        {/* Left side: Certificate/Medal, Plus (+), Three vertical dots */}
        <div className="flex items-center gap-0.5 relative">
          {/* Certificate / OTP Medal icon */}
          <button
            onClick={() => setOtpModalOpen(true)}
            aria-label="الشهادات و OTP"
            className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-full cursor-pointer"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="w-6 h-6">
              <rect x="3" y="4" width="18" height="14" rx="2" />
              <circle cx="9.5" cy="11" r="3" />
              <path d="M8 14v5l1.5-1.2L11 19v-5" />
              <line x1="14.5" y1="9" x2="18.5" y2="9" />
              <line x1="14.5" y1="12.5" x2="18.5" y2="12.5" />
            </svg>
          </button>

          {/* Plus icon */}
          <button
            onClick={() => setAddAccountModalOpen(true)}
            aria-label="إضافة حساب جديد"
            className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-full cursor-pointer"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" className="w-6 h-6">
              <line x1="12" y1="4.5" x2="12" y2="19.5" />
              <line x1="4.5" y1="12" x2="19.5" y2="12" />
            </svg>
          </button>

          {/* Three dots */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="خيارات"
            className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-full cursor-pointer"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <circle cx="12" cy="5" r="1.7" />
              <circle cx="12" cy="12" r="1.7" />
              <circle cx="12" cy="19" r="1.7" />
            </svg>
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
              <div className="absolute left-0 top-12 w-48 bg-[#1e2025] border border-[#2d313b] rounded-xl shadow-2xl py-1.5 z-40 text-xs font-medium">
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
                    setActiveTab('trade');
                  }}
                  className="w-full px-4 py-2.5 text-right text-white hover:bg-white/5 cursor-pointer"
                >
                  الانتقال إلى التداول
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

      {/* Scrollable Accounts Body */}
      <div className="flex-1 overflow-y-auto px-3 pb-6 space-y-3.5">
        {/* 1. Active Account Centered Card (Exact match to Screenshot_20261115132806_ae5c07c8.jpg) */}
        <div
          onClick={() => setActiveTab('trade')}
          className="relative bg-[#1e2023] rounded-2xl px-4 pt-6 pb-4 flex flex-col items-center text-center overflow-hidden cursor-pointer active:opacity-95 transition-opacity"
        >
          {/* Demo Ribbon if active account is Demo */}
          {activeAccount.type === 'demo' && (
            <div className="absolute top-3 -left-8 -rotate-45 bg-[#10a337] text-white text-[10px] font-num font-bold px-8 py-0.5 shadow">
              Demo
            </div>
          )}

          {/* Centered Logo */}
          <div className="mb-3">
            {activeAccount.logoType === 'exness' ? (
              <ExnessLogo className="w-14 h-14 rounded-none" />
            ) : (
              <MetaQuotesLogo className="w-14 h-14" />
            )}
          </div>

          {/* Account Name */}
          <h2 className="text-[18px] font-bold text-white leading-snug">
            {activeAccount.name}
          </h2>

          {/* Broker Name in MT5 Blue */}
          <p className="text-[14px] text-[#3588e8] font-medium mt-0.5">
            {activeAccount.broker}
          </p>

          {/* Account Number & Server */}
          <p className="text-[13px] font-num text-[#8e959e] mt-2 leading-snug" dir="ltr">
            {activeAccount.accountNumber} — {activeAccount.server}
          </p>
          <p className="text-[13px] font-num text-[#8e959e] leading-snug" dir="ltr">
            {activeAccount.lastKnownLabel || 'Access Point #3, Hedge'}
          </p>

          {/* Large Balance */}
          <div className="mt-3.5 text-[23px] font-num font-normal text-white tracking-tight" dir="ltr">
            {activeAccount.balance.toFixed(2)} {activeAccount.currency}
          </div>

          {/* Bottom Row: QR on right, Bell on left (in RTL) */}
          <div className="w-full flex items-center justify-between mt-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setQrToast(`حساب ${activeAccount.accountNumber} · ${activeAccount.server}`);
                setTimeout(() => setQrToast(null), 2500);
              }}
              aria-label="رمز QR للحساب"
              className="p-1 hover:bg-white/10 rounded cursor-pointer"
            >
              <QrIcon />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab('messages');
              }}
              aria-label="إشعارات الحساب"
              className="p-1 text-[#787f88] hover:text-white rounded cursor-pointer"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>
          </div>
        </div>

        {/* Section Label: "الاتصال إلى" */}
        <div className="px-1 pt-0.5 text-[13px] text-[#8e959e] text-right">
          الاتصال إلى
        </div>

        {/* 2. Secondary Account Cards (Exact match to Screenshot_20261115132806_ae5c07c8.jpg) */}
        <div className="space-y-3">
          {secondaryAccounts.map((acc) => (
            <div
              key={acc.id}
              onClick={() => handleSelectAccount(acc.id)}
              className="relative bg-[#1e2023] hover:bg-[#23262a] rounded-2xl px-4 py-3.5 overflow-hidden cursor-pointer transition-colors"
            >
              {/* Diagonal Green Demo Ribbon at Top-Left Corner */}
              {acc.type === 'demo' && (
                <div className="absolute top-2.5 -left-8 -rotate-45 bg-[#10a337] text-white text-[11px] font-num font-bold px-8 py-0.5 shadow">
                  Demo
                </div>
              )}

              {/* Top Row: Logo on Right, Info on Left (RTL layout matching screenshot) */}
              <div className="flex items-start justify-between gap-3">
                {/* Right side in RTL: Logo */}
                <div className="shrink-0 mt-1">
                  {acc.logoType === 'exness' ? (
                    <ExnessLogo className="w-11 h-11 rounded-none" />
                  ) : (
                    <MetaQuotesLogo className="w-11 h-11" />
                  )}
                </div>

                {/* Left side in RTL: Name, Broker, Number-Server */}
                <div className="flex-1 text-left" dir="ltr">
                  <h3 className="text-[17px] font-bold text-white leading-tight">
                    {acc.name}
                  </h3>
                  <p className="text-[13.5px] text-[#3588e8] font-medium mt-0.5 leading-tight">
                    {acc.broker}
                  </p>
                  <p className="text-[13px] font-num text-[#8e959e] mt-1 leading-tight">
                    {acc.accountNumber} — {acc.server}
                  </p>
                </div>
              </div>

              {/* Balance & Last Known Label */}
              <div className="mt-2.5 flex flex-col items-center justify-center">
                <span className="text-[18px] font-num font-normal text-[#8e959e]" dir="ltr">
                  {acc.balance.toFixed(2)}
                </span>
                <span className="text-[12.5px] text-[#8e959e] mt-0.5">
                  آخر ما عرف، {acc.currency}
                </span>
              </div>

              {/* Bottom Icons: QR on Right, Info (i) on Left */}
              <div className="flex items-center justify-between mt-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setQrToast(`حساب ${acc.accountNumber} · ${acc.server}`);
                    setTimeout(() => setQrToast(null), 2500);
                  }}
                  aria-label="رمز QR"
                  className="p-1 hover:bg-white/10 rounded cursor-pointer"
                >
                  <QrIcon />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveAccount(acc);
                    setAccountInfoModalOpen(true);
                  }}
                  aria-label="معلومات الحساب"
                  className="p-1 text-[#cfd8dc] hover:text-white rounded cursor-pointer"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="w-6 h-6">
                    <circle cx="12" cy="12" r="9.5" />
                    <line x1="12" y1="11" x2="12" y2="16.5" strokeLinecap="round" />
                    <circle cx="12" cy="7.8" r="1" fill="currentColor" stroke="none" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {qrToast && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#23262d] border border-[#3588e8] text-white text-xs font-num px-4 py-2 rounded-xl shadow-xl z-40 whitespace-nowrap">
          QR: {qrToast}
        </div>
      )}
    </div>
  );
};
