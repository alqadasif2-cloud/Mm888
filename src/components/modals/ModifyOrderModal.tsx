import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTrading } from '../../context/TradingContext';

export const ModifyOrderModal: React.FC = () => {
  const {
    modifyingPosition,
    setModifyingPosition,
    modifyingFocus,
    quotes,
    candles,
    modifyPosition
  } = useTrading();

  const [slInput, setSlInput] = useState<string>('');
  const [tpInput, setTpInput] = useState<string>('');
  const miniCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!modifyingPosition) return;
    setSlInput(modifyingPosition.sl ? String(modifyingPosition.sl) : '');
    setTpInput(modifyingPosition.tp ? String(modifyingPosition.tp) : '');
  }, [modifyingPosition]);

  const quote = useMemo(() => {
    if (!modifyingPosition) return quotes[0];
    return quotes.find((q) => q.symbol === modifyingPosition.symbol) || quotes[0];
  }, [modifyingPosition, quotes]);

  const digits = quote?.digits ?? 2;
  const priceStep = useMemo(() => {
    if (!quote) return 0.01;
    if (quote.symbol.startsWith('BTC')) return 10;
    if (quote.symbol.startsWith('ETH')) return 1;
    if (quote.digits === 5) return 0.0005;
    if (quote.digits === 3) return 0.1;
    return 0.5;
  }, [quote]);

  // Render live mini-chart in the background (matching PDF Page 3 Top)
  useEffect(() => {
    if (!modifyingPosition) return;
    const canvas = miniCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    ctx.fillStyle = '#090b0e';
    ctx.fillRect(0, 0, width, height);

    const slice = candles.slice(-50);
    if (slice.length === 0) return;

    const slVal = parseFloat(slInput);
    const tpVal = parseFloat(tpInput);

    let minP = Infinity;
    let maxP = -Infinity;
    slice.forEach((c) => {
      if (c.low < minP) minP = c.low;
      if (c.high > maxP) maxP = c.high;
    });

    // Include Entry, SL, TP inside visible scale so user can verify placement visually!
    minP = Math.min(minP, modifyingPosition.openPrice);
    maxP = Math.max(maxP, modifyingPosition.openPrice);
    if (!isNaN(slVal) && slVal > 0) {
      minP = Math.min(minP, slVal);
      maxP = Math.max(maxP, slVal);
    }
    if (!isNaN(tpVal) && tpVal > 0) {
      minP = Math.min(minP, tpVal);
      maxP = Math.max(maxP, tpVal);
    }

    const range = maxP - minP || 1;
    const paddedMin = minP - range * 0.1;
    const paddedMax = maxP + range * 0.1;
    const fullRange = paddedMax - paddedMin;

    const rightMargin = 68;
    const chartWidth = width - rightMargin;
    const topPad = 14;
    const chartH = height - 28;
    const getY = (p: number) => topPad + (1 - (p - paddedMin) / fullRange) * chartH;

    // Horizontal subtle grid + price labels
    ctx.strokeStyle = '#181b22';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#9ea8b3';
    ctx.font = '10.5px "Roboto", sans-serif';
    ctx.textAlign = 'left';

    const steps = 11;
    for (let i = 0; i <= steps; i++) {
      const pVal = paddedMin + (fullRange / steps) * i;
      const y = getY(pVal);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(chartWidth, y);
      ctx.stroke();
      ctx.fillText(pVal.toFixed(digits), chartWidth + 6, y + 3.5);
    }

    // Candlesticks
    const slotW = chartWidth / (slice.length + 12);
    const bodyW = Math.max(2, slotW * 0.65);
    slice.forEach((c, i) => {
      const isUp = c.close >= c.open;
      const x = i * slotW + slotW / 2;
      const yO = getY(c.open);
      const yC = getY(c.close);
      const yH = getY(c.high);
      const yL = getY(c.low);
      const color = isUp ? '#26a69a' : '#ef5350';

      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, yH);
      ctx.lineTo(x, yL);
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.fillRect(x - bodyW / 2, Math.min(yO, yC), bodyW, Math.max(1.5, Math.abs(yC - yO)));
    });

    // Entry price line
    const yEntry = getY(modifyingPosition.openPrice);
    ctx.strokeStyle = '#42a5f5';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(0, yEntry);
    ctx.lineTo(chartWidth, yEntry);
    ctx.stroke();
    ctx.setLineDash([]);

    // Current price line + right badge
    const yBid = getY(quote.bid);
    ctx.strokeStyle = '#64b5f6';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, yBid);
    ctx.lineTo(chartWidth, yBid);
    ctx.stroke();
    ctx.fillStyle = '#1976d2';
    ctx.fillRect(chartWidth + 2, yBid - 9, rightMargin - 4, 18);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px "Roboto", sans-serif';
    ctx.fillText(quote.bid.toFixed(digits), chartWidth + 6, yBid + 3.5);

    // Live SL Line (Orange/Red)
    if (!isNaN(slVal) && slVal > 0) {
      const ySl = getY(slVal);
      ctx.strokeStyle = '#ff7043';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(0, ySl);
      ctx.lineTo(chartWidth, ySl);
      ctx.stroke();
      ctx.fillStyle = '#ff7043';
      ctx.fillRect(chartWidth + 2, ySl - 9, rightMargin - 4, 18);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(slVal.toFixed(digits), chartWidth + 6, ySl + 3.5);
    }

    // Live TP Line (Teal/Green)
    if (!isNaN(tpVal) && tpVal > 0) {
      const yTp = getY(tpVal);
      ctx.strokeStyle = '#26a69a';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(0, yTp);
      ctx.lineTo(chartWidth, yTp);
      ctx.stroke();
      ctx.fillStyle = '#26a69a';
      ctx.fillRect(chartWidth + 2, yTp - 9, rightMargin - 4, 18);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(tpVal.toFixed(digits), chartWidth + 6, yTp + 3.5);
    }
  }, [modifyingPosition, candles, quote, slInput, tpInput, digits]);

  if (!modifyingPosition) return null;

  const stepSL = (dir: 1 | -1) => {
    const base = parseFloat(slInput);
    const startVal = !isNaN(base) && base > 0 ? base : modifyingPosition.openPrice;
    const next = Math.max(0, parseFloat((startVal + dir * priceStep).toFixed(digits)));
    setSlInput(String(next));
  };

  const stepTP = (dir: 1 | -1) => {
    const base = parseFloat(tpInput);
    const startVal = !isNaN(base) && base > 0 ? base : modifyingPosition.openPrice;
    const next = Math.max(0, parseFloat((startVal + dir * priceStep).toFixed(digits)));
    setTpInput(String(next));
  };

  const handleConfirmModify = () => {
    const slVal = slInput.trim() ? parseFloat(slInput) : undefined;
    const tpVal = tpInput.trim() ? parseFloat(tpInput) : undefined;
    modifyPosition(modifyingPosition.id, slVal, tpVal);
    setModifyingPosition(null);
  };

  return (
    <div className="fixed inset-0 bg-[#000000] text-white z-50 flex flex-col select-none animate-fadeIn">
      {/* Header (Matching PDF Page 3 Top Screenshot) */}
      <header className="h-14 px-3.5 flex items-center justify-between border-b border-[#14161b] shrink-0">
        <button
          onClick={() => setModifyingPosition(null)}
          aria-label="رجوع"
          className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-full cursor-pointer"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-5 h-5">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>

        <div className="flex-1 text-right pr-2">
          <h2 className="text-[15px] font-bold text-white leading-tight">
            تعديل الأمر <span className="font-num">#{modifyingPosition.ticket}</span>
          </h2>
          <p className="text-[12px] text-[#8e9aa8] font-num mt-0.5" dir="ltr">
            {modifyingPosition.type} {modifyingPosition.lots.toFixed(2)} {modifyingPosition.symbol} at{' '}
            {modifyingPosition.openPrice.toFixed(digits)}
          </p>
        </div>
      </header>

      {/* Live Bid / Ask Prices in Blue */}
      <div dir="ltr" className="py-3 flex items-center justify-center gap-12 font-num shrink-0">
        <span className="text-[20px] font-bold text-[#3897f0]">
          {quote.bid.toFixed(digits)}
        </span>
        <span className="text-[20px] font-bold text-[#3897f0]">
          {quote.ask.toFixed(digits)}
        </span>
      </div>

      {/* SL and TP +/- Steppers */}
      <div dir="ltr" className="px-4 pb-3 grid grid-cols-2 gap-4 shrink-0">
        {/* SL Stepper (Orange/Red accent line) */}
        <div
          className={`flex items-center justify-between border-b-2 pb-1.5 ${
            modifyingFocus === 'sl' ? 'border-[#ff7043]' : 'border-[#d84315]'
          }`}
        >
          <button
            onClick={() => stepSL(-1)}
            aria-label="إنقاص وقف الخسارة"
            className="w-9 h-9 flex items-center justify-center text-[#3897f0] text-xl font-bold hover:bg-white/5 rounded cursor-pointer"
          >
            −
          </button>
          <input
            type="number"
            step="any"
            placeholder="SL"
            value={slInput}
            onChange={(e) => setSlInput(e.target.value)}
            className="w-full text-center bg-transparent text-white font-num font-bold text-[15px] outline-none"
          />
          <button
            onClick={() => stepSL(1)}
            aria-label="زيادة وقف الخسارة"
            className="w-9 h-9 flex items-center justify-center text-[#3897f0] text-xl font-bold hover:bg-white/5 rounded cursor-pointer"
          >
            +
          </button>
        </div>

        {/* TP Stepper (Teal/Green accent line) */}
        <div
          className={`flex items-center justify-between border-b-2 pb-1.5 ${
            modifyingFocus === 'tp' ? 'border-[#00e676]' : 'border-[#26a69a]'
          }`}
        >
          <button
            onClick={() => stepTP(-1)}
            aria-label="إنقاص أخذ الربح"
            className="w-9 h-9 flex items-center justify-center text-[#3897f0] text-xl font-bold hover:bg-white/5 rounded cursor-pointer"
          >
            −
          </button>
          <input
            type="number"
            step="any"
            placeholder="TP"
            value={tpInput}
            onChange={(e) => setTpInput(e.target.value)}
            className="w-full text-center bg-transparent text-white font-num font-bold text-[15px] outline-none"
          />
          <button
            onClick={() => stepTP(1)}
            aria-label="زيادة أخذ الربح"
            className="w-9 h-9 flex items-center justify-center text-[#3897f0] text-xl font-bold hover:bg-white/5 rounded cursor-pointer"
          >
            +
          </button>
        </div>
      </div>

      {/* Live Background Mini-Chart */}
      <div className="flex-1 relative overflow-hidden bg-[#090b0e] border-t border-[#14161b]">
        <canvas ref={miniCanvasRef} className="w-full h-full block" />
      </div>

      {/* Bottom Confirm Button */}
      <div className="p-3 bg-[#000000] border-t border-[#181a20] shrink-0">
        <button
          onClick={handleConfirmModify}
          className="w-full py-3 bg-[#15181e] hover:bg-[#1f242e] text-white font-bold text-[15px] rounded-xl border border-[#272c36] cursor-pointer transition-colors"
        >
          تعديل
        </button>
      </div>
    </div>
  );
};
