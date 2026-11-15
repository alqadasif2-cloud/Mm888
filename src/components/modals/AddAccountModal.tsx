import React, { useState } from 'react';
import { useTrading } from '../../context/TradingContext';
import { ExnessLogo, MetaQuotesLogo } from '../common/Logos';

export const AddAccountModal: React.FC = () => {
  const { addAccountModalOpen, setAddAccountModalOpen, addNewAccount } = useTrading();

  const [selectedBroker, setSelectedBroker] = useState<'exness' | 'metaquotes'>('exness');
  const [accountName, setAccountName] = useState<string>('حساب تداول جديد');
  const [accountType, setAccountType] = useState<'real' | 'demo'>('demo');
  const [server, setServer] = useState<string>('Exness-MT5Real35');
  const [deposit, setDeposit] = useState<string>('3000');
  const [currency, setCurrency] = useState<string>('USD');
  const [leverage, setLeverage] = useState<string>('1:2000');

  if (!addAccountModalOpen) return null;

  const handleBrokerChange = (broker: 'exness' | 'metaquotes') => {
    setSelectedBroker(broker);
    setServer(broker === 'exness' ? 'Exness-MT5Real35' : 'MetaQuotes-Demo');
    setLeverage(broker === 'exness' ? '1:2000' : '1:100');
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    addNewAccount({
      name: accountName.trim() || 'Standard',
      broker: selectedBroker === 'exness' ? 'Exness Technologies Ltd' : 'MetaQuotes Ltd.',
      server,
      type: accountType,
      balance: parseFloat(deposit) || 1000,
      currency,
      leverage,
      logoType: selectedBroker
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 select-none animate-fadeIn"
      onClick={() => setAddAccountModalOpen(false)}
    >
      <div
        className="bg-[#161920] border border-[#2a2f3a] rounded-2xl w-full max-w-md overflow-hidden text-right shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 bg-[#101318] border-b border-[#222732] flex items-center justify-between">
          <button
            onClick={() => setAddAccountModalOpen(false)}
            className="w-8 h-8 rounded-full bg-white/5 text-[#8e9aa8] hover:text-white cursor-pointer"
          >
            ✕
          </button>
          <h3 className="text-base font-bold text-white">إضافة حساب تداول جديد</h3>
          <div className="w-8" />
        </div>

        <form onSubmit={handleCreate} className="p-4 space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handleBrokerChange('exness')}
              className={`p-3 rounded-xl border flex flex-col items-center gap-2 cursor-pointer ${
                selectedBroker === 'exness'
                  ? 'bg-[#1b2029] border-[#ffd200]'
                  : 'bg-[#101318] border-[#252934]'
              }`}
            >
              <ExnessLogo className="w-9 h-9" />
              <span className="font-bold text-white">Exness</span>
            </button>

            <button
              type="button"
              onClick={() => handleBrokerChange('metaquotes')}
              className={`p-3 rounded-xl border flex flex-col items-center gap-2 cursor-pointer ${
                selectedBroker === 'metaquotes'
                  ? 'bg-[#1b2029] border-[#3897f0]'
                  : 'bg-[#101318] border-[#252934]'
              }`}
            >
              <MetaQuotesLogo className="w-9 h-9" />
              <span className="font-bold text-white">MetaQuotes</span>
            </button>
          </div>

          <div>
            <label className="text-[#8e9aa8] block mb-1">اسم الحساب:</label>
            <input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className="w-full bg-[#0e1116] border border-[#282d38] rounded-xl px-3 py-2.5 text-white outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[#8e9aa8] block mb-1">نوع الحساب:</label>
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value as 'real' | 'demo')}
                className="w-full bg-[#0e1116] border border-[#282d38] rounded-xl px-3 py-2.5 text-white outline-none"
              >
                <option value="demo">تجريبي (Demo)</option>
                <option value="real">حقيقي (Real)</option>
              </select>
            </div>
            <div>
              <label className="text-[#8e9aa8] block mb-1">الرافعة المالية:</label>
              <select
                value={leverage}
                onChange={(e) => setLeverage(e.target.value)}
                className="w-full bg-[#0e1116] border border-[#282d38] rounded-xl px-3 py-2.5 text-white font-num outline-none"
              >
                <option value="1:100">1:100</option>
                <option value="1:500">1:500</option>
                <option value="1:2000">1:2000</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[#8e9aa8] block mb-1">الرصيد الافتتاحي:</label>
              <input
                type="number"
                value={deposit}
                onChange={(e) => setDeposit(e.target.value)}
                className="w-full bg-[#0e1116] border border-[#282d38] rounded-xl px-3 py-2.5 text-white font-num outline-none"
              />
            </div>
            <div>
              <label className="text-[#8e9aa8] block mb-1">العملة:</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-[#0e1116] border border-[#282d38] rounded-xl px-3 py-2.5 text-white font-num outline-none"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#1976d2] hover:bg-[#1565c0] text-white font-bold rounded-xl text-sm cursor-pointer transition-colors"
          >
            فتح الحساب
          </button>
        </form>
      </div>
    </div>
  );
};
