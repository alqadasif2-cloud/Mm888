import React, { useState, useEffect } from 'react';
import { useTrading } from '../../context/TradingContext';

export const OtpModal: React.FC = () => {
  const { otpModalOpen, setOtpModalOpen, activeAccount } = useTrading();
  const [code, setCode] = useState<string>('482 195');
  const [countdown, setCountdown] = useState<number>(24);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!otpModalOpen) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          const p1 = Math.floor(100 + Math.random() * 900);
          const p2 = Math.floor(100 + Math.random() * 900);
          setCode(`${p1} ${p2}`);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [otpModalOpen]);

  if (!otpModalOpen) return null;

  const handleCopy = () => {
    navigator.clipboard?.writeText(code.replace(' ', ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 select-none animate-fadeIn"
      onClick={() => setOtpModalOpen(false)}
    >
      <div
        className="bg-[#161920] border border-[#2a2f3a] rounded-2xl w-full max-w-sm overflow-hidden text-right shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 bg-[#101318] border-b border-[#222732] flex items-center justify-between">
          <button
            onClick={() => setOtpModalOpen(false)}
            className="w-8 h-8 rounded-full bg-white/5 text-[#8e9aa8] hover:text-white cursor-pointer"
          >
            ✕
          </button>
          <h3 className="text-base font-bold text-white">مولد كلمات المرور (OTP)</h3>
          <div className="w-8" />
        </div>

        <div className="p-5 text-center space-y-4">
          <p className="text-xs text-[#8e9aa8] leading-relaxed">
            استخدم رمز التحقق لمرة واحدة لتسجيل الدخول الآمن إلى خوادم Exness و MetaQuotes.
          </p>

          <div className="bg-[#0e1116] border border-[#252a34] p-4 rounded-2xl flex flex-col items-center">
            <span className="text-xs font-num text-[#8e9aa8] mb-1">
              {activeAccount.accountNumber} ({activeAccount.name})
            </span>
            <div dir="ltr" className="text-3xl font-num font-bold tracking-widest text-[#64b5f6] my-1">
              {code}
            </div>
            <div className="w-48 bg-[#1f242e] h-1.5 rounded-full overflow-hidden mt-3">
              <div
                className="bg-[#2196f3] h-full transition-all duration-1000"
                style={{ width: `${(countdown / 30) * 100}%` }}
              />
            </div>
            <span className="text-[11px] font-num text-[#8e9aa8] mt-1.5">
              يتجدد خلال {countdown} ثانية
            </span>
          </div>

          <button
            onClick={handleCopy}
            className="w-full py-2.5 bg-[#1976d2] hover:bg-[#1565c0] text-white font-bold rounded-xl text-xs cursor-pointer transition-colors"
          >
            {copied ? '✓ تم نسخ الرمز' : 'نسخ رمز التحقق'}
          </button>
        </div>
      </div>
    </div>
  );
};
