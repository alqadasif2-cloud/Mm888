import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useTrading } from '../../context/TradingContext';
import { Timeframe, Position } from '../../types/mt5';

export const InteractiveChart: React.FC = () => {
  const {
    quotes,
    selectedSymbol,
    setSelectedSymbol,
    timeframe,
    setTimeframe,
    candles,
    positions,
    openTrade,
    closePosition,
    setModifyingPosition,
    setModifyingFocus,
    setIsDrawerOpen
  } = useTrading();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Toolbar & Overlay States
  const [showOneClick, setShowOneClick] = useState<boolean>(true);
  const [lotSize, setLotSize] = useState<number>(0.01);
  const [crosshairActive, setCrosshairActive] = useState<boolean>(false);
  const [crosshairPos, setCrosshairPos] = useState<{ x: number; y: number } | null>(null);
  const [showIndicatorsModal, setShowIndicatorsModal] = useState<boolean>(false);
  const [showMA, setShowMA] = useState<boolean>(false);
  const [showMacdPane, setShowMacdPane] = useState<boolean>(false);
  const [showTimeframeModal, setShowTimeframeModal] = useState<boolean>(false);
  const [showQuickSymbols, setShowQuickSymbols] = useState<boolean>(false);
  const [showRadialMenu, setShowRadialMenu] = useState<boolean>(false);
  const [radialPos, setRadialPos] = useState<{ x: number; y: number }>({ x: 180, y: 240 });
  const [tradeToast, setTradeToast] = useState<string | null>(null);

  // Interactive Zoom & Pan States (X-axis zoom, X-axis scroll, Y-axis right-edge scale & vertical offset)
  const [visibleCount, setVisibleCount] = useState<number>(64);
  const [scrollOffset, setScrollOffset] = useState<number>(0); // candles shifted from right edge
  const [yScale, setYScale] = useState<number>(1.0); // > 1 stretches candles vertically, < 1 compresses
  const [yShiftRatio, setYShiftRatio] = useState<number>(0); // vertical pan ratio
  const [cursorStyle, setCursorStyle] = useState<string>('crosshair');

  // Selected Position on chart for SL/TP Quick Action Bar (PDF Page 2 Item 4)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Live candle countdown timer
  const [candleSecondsRemaining, setCandleSecondsRemaining] = useState<number>(54);

  // Interaction refs (mouse & multi-touch pinch/drag)
  const dragRef = useRef<{
    mode: 'none' | 'pan' | 'y-scale' | 'crosshair';
    startX: number;
    startY: number;
    startScrollOffset: number;
    startYScale: number;
    startYShift: number;
    moved: boolean;
  }>({
    mode: 'none',
    startX: 0,
    startY: 0,
    startScrollOffset: 0,
    startYScale: 1,
    startYShift: 0,
    moved: false
  });

  const pinchRef = useRef<{
    active: boolean;
    initialDist: number;
    initialCount: number;
  }>({
    active: false,
    initialDist: 0,
    initialCount: 64
  });

  // Track last chart coordinate bounds for hit-testing position lines
  const layoutRef = useRef<{
    chartWidth: number;
    topMargin: number;
    mainChartHeight: number;
    paddedMin: number;
    fullRange: number;
  }>({
    chartWidth: 300,
    topMargin: 12,
    mainChartHeight: 400,
    paddedMin: 0,
    fullRange: 1
  });

  const currentQuote = useMemo(
    () => quotes.find((q) => q.symbol === selectedSymbol) || quotes[0],
    [quotes, selectedSymbol]
  );

  const symbolPositions = useMemo(
    () => positions.filter((p) => p.symbol === selectedSymbol),
    [positions, selectedSymbol]
  );

  const selectedOrder: Position | null = useMemo(() => {
    if (!selectedOrderId) return null;
    return symbolPositions.find((p) => p.id === selectedOrderId) || null;
  }, [selectedOrderId, symbolPositions]);

  // Reset chart offset when symbol changes
  useEffect(() => {
    setScrollOffset(0);
    setYScale(1.0);
    setYShiftRatio(0);
    setSelectedOrderId(null);
  }, [selectedSymbol]);

  // Real-time countdown based on timeframe
  useEffect(() => {
    const tfSecondsMap: Record<Timeframe, number> = {
      M1: 60,
      M5: 300,
      M15: 900,
      M30: 1800,
      H1: 3600,
      H4: 14400,
      D1: 86400,
      W1: 604800,
      MN: 2592000
    };
    const updateTimer = () => {
      const tfSec = tfSecondsMap[timeframe] || 900;
      const nowSec = Math.floor(Date.now() / 1000);
      const rem = tfSec - (nowSec % tfSec);
      setCandleSecondsRemaining(rem);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [timeframe]);

  const formatCountdown = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Format MT5 split price (e.g. 63950.98 -> main: "63950.", big: "98")
  const formatMT5SplitPrice = (price: number, digits: number) => {
    const str = price.toFixed(digits);
    const dotIdx = str.indexOf('.');
    if (dotIdx === -1) {
      return { main: str, big: '', sup: '' };
    }
    const intPart = str.slice(0, dotIdx + 1);
    const decPart = str.slice(dotIdx + 1);
    if (decPart.length >= 3) {
      return {
        main: intPart + decPart.slice(0, decPart.length - 3),
        big: decPart.slice(decPart.length - 3, decPart.length - 1),
        sup: decPart.slice(decPart.length - 1)
      };
    }
    return { main: intPart, big: decPart, sup: '' };
  };

  // Main Canvas Render
  useEffect(() => {
    const canvas = canvasRef.current;
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

    // Deep pitch-black / charcoal MT5 canvas matching screenshot
    ctx.fillStyle = '#090b0e';
    ctx.fillRect(0, 0, width, height);

    if (candles.length === 0) return;

    const rightMargin = 72;
    const bottomMargin = 24;
    const topMargin = 8;
    const subPaneHeight = showMacdPane ? 86 : 0;
    const chartWidth = width - rightMargin;
    const mainChartHeight = Math.max(120, height - subPaneHeight - bottomMargin - topMargin);

    // Determine visible candle slice (leaving slight right padding for active candle like MT5)
    const maxStart = Math.max(0, candles.length - visibleCount);
    const clampedOffset = Math.min(Math.max(0, Math.round(scrollOffset)), maxStart);
    const endIdx = candles.length - clampedOffset;
    const startIdx = Math.max(0, endIdx - visibleCount);
    const visibleCandles = candles.slice(startIdx, endIdx);

    if (visibleCandles.length === 0) return;

    // Compute min/max price across visible candles + active orders if near range
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    visibleCandles.forEach((c) => {
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
    });

    // Include open position lines when auto-scaled (yScale === 1 and yShiftRatio === 0)
    if (Math.abs(yScale - 1) < 0.05 && Math.abs(yShiftRatio) < 0.02) {
      symbolPositions.forEach((p) => {
        if (Math.abs(p.openPrice - currentQuote.bid) < (maxPrice - minPrice) * 1.5) {
          minPrice = Math.min(minPrice, p.openPrice);
          maxPrice = Math.max(maxPrice, p.openPrice);
        }
        if (p.sl && Math.abs(p.sl - currentQuote.bid) < (maxPrice - minPrice) * 1.5) {
          minPrice = Math.min(minPrice, p.sl);
          maxPrice = Math.max(maxPrice, p.sl);
        }
        if (p.tp && Math.abs(p.tp - currentQuote.bid) < (maxPrice - minPrice) * 1.5) {
          minPrice = Math.min(minPrice, p.tp);
          maxPrice = Math.max(maxPrice, p.tp);
        }
      });
    }

    const baseRange = maxPrice - minPrice || currentQuote.bid * 0.01 || 1;
    const midPrice = (maxPrice + minPrice) / 2 + yShiftRatio * baseRange;
    const scaledHalfRange = (baseRange * 0.62) / yScale;
    const paddedMin = midPrice - scaledHalfRange;
    const paddedMax = midPrice + scaledHalfRange;
    const fullRange = paddedMax - paddedMin || 1;

    layoutRef.current = {
      chartWidth,
      topMargin,
      mainChartHeight,
      paddedMin,
      fullRange
    };

    const getY = (price: number) => {
      return topMargin + (1 - (price - paddedMin) / fullRange) * mainChartHeight;
    };

    // Right axis vertical divider & bottom axis horizontal divider (exact thin line from screenshot)
    ctx.strokeStyle = '#20242c';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(chartWidth, 0);
    ctx.lineTo(chartWidth, height - bottomMargin);
    ctx.moveTo(0, height - bottomMargin);
    ctx.lineTo(chartWidth, height - bottomMargin);
    ctx.stroke();

    // Right price axis labels (clean Roboto tabular numbers like screenshot)
    const labelCount = Math.max(6, Math.min(15, Math.floor(mainChartHeight / 40)));
    ctx.fillStyle = '#cfd8dc';
    ctx.font = '11px "Roboto", sans-serif';
    ctx.textAlign = 'left';

    for (let i = 0; i <= labelCount; i++) {
      const priceVal = paddedMin + (fullRange / labelCount) * i;
      const y = getY(priceVal);
      if (y < topMargin + 8 || y > topMargin + mainChartHeight - 8) continue;
      ctx.fillText(priceVal.toFixed(currentQuote.digits), chartWidth + 6, y + 4);
    }

    // Horizontal space per candle (reserve ~38% empty space on right on latest scroll, matching Screenshot!)
    const rightEmptySlots = clampedOffset === 0 ? Math.max(4, Math.floor(visibleCount * 0.36)) : 0;
    const totalSlots = visibleCandles.length + rightEmptySlots;
    const slotWidth = chartWidth / totalSlots;
    const bodyWidth = Math.max(Math.min(slotWidth * 0.68, 18), 2);

    // Optional Moving Averages (when toggled via 'f' Indicators button)
    if (showMA && visibleCandles.length > 10) {
      const drawMA = (period: number, color: string) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        let started = false;
        for (let i = 0; i < visibleCandles.length; i++) {
          if (i >= period - 1) {
            let sum = 0;
            for (let k = i - period + 1; k <= i; k++) sum += visibleCandles[k].close;
            const avg = sum / period;
            const x = i * slotWidth + slotWidth / 2;
            const y = getY(avg);
            if (!started) {
              ctx.moveTo(x, y);
              started = true;
            } else {
              ctx.lineTo(x, y);
            }
          }
        }
        ctx.stroke();
      };
      drawMA(10, '#ff5252');
      drawMA(25, '#448aff');
      drawMA(50, '#ffd740');
    }

    // Clip candlesticks cleanly inside main chart region
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, topMargin, chartWidth, mainChartHeight);
    ctx.clip();

    // Draw Candlesticks (Teal-Green #26a69a bullish, Red #ef5350 bearish — exact match to attached screenshot)
    visibleCandles.forEach((c, i) => {
      const isBullish = c.close >= c.open;
      const x = i * slotWidth + slotWidth / 2;
      const yOpen = getY(c.open);
      const yClose = getY(c.close);
      const yHigh = getY(c.high);
      const yLow = getY(c.low);

      const color = isBullish ? '#26a69a' : '#ef5350';
      const topY = Math.min(yOpen, yClose);
      const bodyH = Math.max(Math.abs(yClose - yOpen), 1.5);

      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(1, Math.min(1.6, bodyWidth * 0.25));
      ctx.beginPath();
      ctx.moveTo(x, yHigh);
      ctx.lineTo(x, yLow);
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.fillRect(x - bodyWidth / 2, topY, bodyWidth, bodyH);
    });

    // Draw Active Position Entry / SL / TP Lines on Chart (PDF Page 2 Item 4)
    symbolPositions.forEach((pos) => {
      const isSelected = selectedOrder?.id === pos.id;
      const entryY = getY(pos.openPrice);
      const pointStep = Math.pow(10, -currentQuote.digits);

      // 1. Entry Line (Blue/Green dashed)
      ctx.strokeStyle = pos.type === 'buy' ? '#26a69a' : '#ef5350';
      ctx.lineWidth = isSelected ? 1.5 : 1;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(0, entryY);
      ctx.lineTo(chartWidth, entryY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Left tag: e.g. "BUY 0.01"
      ctx.fillStyle = '#090b0e';
      const entryLabel = `${pos.type.toUpperCase()} ${pos.lots.toFixed(2)}`;
      ctx.font = 'bold 10px "Roboto", sans-serif';
      const eMetrics = ctx.measureText(entryLabel);
      ctx.fillRect(4, entryY - 14, eMetrics.width + 8, 13);
      ctx.fillStyle = pos.type === 'buy' ? '#26a69a' : '#ef5350';
      ctx.textAlign = 'left';
      ctx.fillText(entryLabel, 8, entryY - 4);

      // 2. TP Line (Green #00c853 dashed + USD & points label)
      if (pos.tp) {
        const tpY = getY(pos.tp);
        ctx.strokeStyle = '#00c853';
        ctx.lineWidth = isSelected ? 1.7 : 1.1;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(0, tpY);
        ctx.lineTo(chartWidth, tpY);
        ctx.stroke();
        ctx.setLineDash([]);

        const pointsDiff = Math.round(Math.abs(pos.tp - pos.openPrice) / pointStep);
        const estUsd = Math.abs(pos.tp - pos.openPrice) * pos.lots * (pos.symbol.startsWith('XAU') ? 100 : pos.symbol.startsWith('XAG') ? 50 : 1);
        const tpText = `TP  ${estUsd.toFixed(2)} USD, ${pointsDiff} points`;
        ctx.fillStyle = '#090b0e';
        const m = ctx.measureText(tpText);
        ctx.fillRect(4, tpY - 14, m.width + 8, 13);
        ctx.fillStyle = '#00e676';
        ctx.fillText(tpText, 8, tpY - 4);
      }

      // 3. SL Line (Orange/Red #ff7043 dashed + USD & points label)
      if (pos.sl) {
        const slY = getY(pos.sl);
        ctx.strokeStyle = '#ff7043';
        ctx.lineWidth = isSelected ? 1.7 : 1.1;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(0, slY);
        ctx.lineTo(chartWidth, slY);
        ctx.stroke();
        ctx.setLineDash([]);

        const pointsDiff = Math.round(Math.abs(pos.openPrice - pos.sl) / pointStep);
        const estUsd = Math.abs(pos.openPrice - pos.sl) * pos.lots * (pos.symbol.startsWith('XAU') ? 100 : pos.symbol.startsWith('XAG') ? 50 : 1);
        const slText = `SL  ${estUsd.toFixed(2)} USD, ${pointsDiff} points`;
        ctx.fillStyle = '#090b0e';
        const m = ctx.measureText(slText);
        ctx.fillRect(4, slY - 14, m.width + 8, 13);
        ctx.fillStyle = '#ff8a65';
        ctx.fillText(slText, 8, slY - 4);
      }
    });

    // Current Price Horizontal Line (subtle light gray line across chart like screenshot)
    const yBid = getY(currentQuote.bid);
    ctx.strokeStyle = '#788492';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, yBid);
    ctx.lineTo(chartWidth, yBid);
    ctx.stroke();

    ctx.restore(); // End chart clip

    // Draw Right Axis Badges for TP / SL / Entry of active positions
    symbolPositions.forEach((pos) => {
      if (pos.tp) {
        const tpY = getY(pos.tp);
        if (tpY >= topMargin && tpY <= topMargin + mainChartHeight) {
          ctx.fillStyle = '#00c853';
          ctx.fillRect(chartWidth + 2, tpY - 9, rightMargin - 4, 18);
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 10px "Roboto", sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(pos.tp.toFixed(currentQuote.digits), chartWidth + 6, tpY + 3.5);
        }
      }
      if (pos.sl) {
        const slY = getY(pos.sl);
        if (slY >= topMargin && slY <= topMargin + mainChartHeight) {
          ctx.fillStyle = '#ff7043';
          ctx.fillRect(chartWidth + 2, slY - 9, rightMargin - 4, 18);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px "Roboto", sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(pos.sl.toFixed(currentQuote.digits), chartWidth + 6, slY + 3.5);
        }
      }
    });

    // Iconic Teal Current Price + Countdown Timer Badge on Right Axis (Exact match to screenshot!)
    const badgeH = 30;
    const badgeY = Math.max(topMargin, Math.min(yBid - badgeH / 2, topMargin + mainChartHeight - badgeH));
    ctx.fillStyle = '#26a69a';
    ctx.fillRect(chartWidth + 2, badgeY, rightMargin - 4, badgeH);
    ctx.fillStyle = '#ffffff';
    ctx.font = '500 11px "Roboto", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(currentQuote.bid.toFixed(currentQuote.digits), chartWidth + 6, badgeY + 12.5);
    ctx.font = '400 10.5px "Roboto", sans-serif';
    ctx.fillText(formatCountdown(candleSecondsRemaining), chartWidth + 6, badgeY + 25.5);

    // Optional MACD Sub-Pane (only when toggled via 'f' Indicators button)
    if (showMacdPane) {
      const subTop = topMargin + mainChartHeight + 2;
      ctx.strokeStyle = '#20242c';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, subTop);
      ctx.lineTo(width, subTop);
      ctx.stroke();

      ctx.fillStyle = '#8e9aa8';
      ctx.font = '10px "Roboto", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('MACD(12,26,9)', 6, subTop + 12);

      const zeroY = subTop + subPaneHeight * 0.55;
      visibleCandles.forEach((c, i) => {
        const x = i * slotWidth + slotWidth / 2;
        const diff = (c.close - c.open) / (currentQuote.bid * 0.002);
        const h = Math.max(-24, Math.min(24, diff * 12));
        ctx.fillStyle = h >= 0 ? '#26a69a' : '#ef5350';
        ctx.fillRect(x - 1, h >= 0 ? zeroY - h : zeroY, Math.max(1.5, bodyWidth * 0.45), Math.abs(h));
      });
    }

    // Bottom Date & Time Stamps (e.g. "14 Nov 18:15", "15 Nov 00:15", "15 Nov 06:15")
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    ctx.fillStyle = '#cfd8dc';
    ctx.font = '11px "Roboto", sans-serif';
    ctx.textAlign = 'center';

    const markerIndices = [
      Math.floor(visibleCandles.length * 0.12),
      Math.floor(visibleCandles.length * 0.48),
      Math.floor(visibleCandles.length * 0.85)
    ];

    markerIndices.forEach((idx) => {
      const c = visibleCandles[idx];
      if (!c) return;
      const d = new Date(c.time);
      const label = `${d.getDate()} ${months[d.getMonth()]} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      const x = Math.max(42, Math.min(chartWidth - 42, idx * slotWidth + slotWidth / 2));
      ctx.fillText(label, x, height - 7);
    });

    // Small gray triangle pointer on bottom axis (like screenshot)
    const triX = Math.min(chartWidth - 18, visibleCandles.length * slotWidth + slotWidth / 2);
    ctx.fillStyle = '#6c757d';
    ctx.beginPath();
    ctx.moveTo(triX, height - bottomMargin - 5);
    ctx.lineTo(triX - 4, height - bottomMargin);
    ctx.lineTo(triX + 4, height - bottomMargin);
    ctx.closePath();
    ctx.fill();

    // Crosshair Cursor & Price/Time Badge
    if (crosshairActive && crosshairPos) {
      const cx = Math.min(Math.max(0, crosshairPos.x), chartWidth);
      const cy = Math.min(Math.max(topMargin, crosshairPos.y), topMargin + mainChartHeight);

      ctx.strokeStyle = '#9aa4b0';
      ctx.lineWidth = 0.9;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(cx, topMargin);
      ctx.lineTo(cx, height - bottomMargin);
      ctx.moveTo(0, cy);
      ctx.lineTo(chartWidth, cy);
      ctx.stroke();
      ctx.setLineDash([]);

      const cursorPrice = paddedMin + (1 - (cy - topMargin) / mainChartHeight) * fullRange;
      ctx.fillStyle = '#37474f';
      ctx.fillRect(chartWidth + 2, cy - 10, rightMargin - 4, 20);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10.5px "Roboto", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(cursorPrice.toFixed(currentQuote.digits), chartWidth + 6, cy + 4);
    }
  }, [
    candles,
    visibleCount,
    scrollOffset,
    yScale,
    yShiftRatio,
    crosshairActive,
    crosshairPos,
    showMA,
    showMacdPane,
    currentQuote,
    candleSecondsRemaining,
    symbolPositions,
    selectedOrder
  ]);

  // Helper: Check if user tapped near any open order line (Entry / SL / TP)
  const hitTestOrderAtY = (y: number): Position | null => {
    const { topMargin, mainChartHeight, paddedMin, fullRange } = layoutRef.current;
    const priceToY = (p: number) => topMargin + (1 - (p - paddedMin) / fullRange) * mainChartHeight;
    for (const pos of symbolPositions) {
      if (Math.abs(priceToY(pos.openPrice) - y) < 18) return pos;
      if (pos.tp && Math.abs(priceToY(pos.tp) - y) < 18) return pos;
      if (pos.sl && Math.abs(priceToY(pos.sl) - y) < 18) return pos;
    }
    return null;
  };

  // Mouse & Pointer Interactions (Pan, Right-Axis Y-Scale Expand/Compress, Crosshair)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Ignore if 2-finger pinch is active on touch
    if (pinchRef.current.active) return;

    canvas.setPointerCapture(e.pointerId);
    const isRightAxis = x >= layoutRef.current.chartWidth;

    if (crosshairActive && !isRightAxis) {
      setCrosshairPos({ x, y });
      dragRef.current = {
        mode: 'crosshair',
        startX: x,
        startY: y,
        startScrollOffset: scrollOffset,
        startYScale: yScale,
        startYShift: yShiftRatio,
        moved: false
      };
      return;
    }

    dragRef.current = {
      mode: isRightAxis ? 'y-scale' : 'pan',
      startX: x,
      startY: y,
      startScrollOffset: scrollOffset,
      startYScale: yScale,
      startYShift: yShiftRatio,
      moved: false
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Update hover cursor affordance
    if (dragRef.current.mode === 'none') {
      if (x >= layoutRef.current.chartWidth) {
        setCursorStyle('ns-resize');
      } else if (crosshairActive) {
        setCursorStyle('crosshair');
      } else {
        setCursorStyle('grab');
      }
      return;
    }

    if (pinchRef.current.active) return;

    const dx = x - dragRef.current.startX;
    const dy = y - dragRef.current.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      dragRef.current.moved = true;
    }

    if (dragRef.current.mode === 'crosshair') {
      setCrosshairPos({ x, y });
      return;
    }

    if (dragRef.current.mode === 'y-scale') {
      // Dragging UP expands candles vertically; dragging DOWN compresses them!
      const factor = Math.exp(-dy * 0.008);
      const nextScale = Math.min(4.5, Math.max(0.22, dragRef.current.startYScale * factor));
      setYScale(nextScale);
      return;
    }

    if (dragRef.current.mode === 'pan') {
      setCursorStyle('grabbing');
      const candlesPerPx = visibleCount / Math.max(150, layoutRef.current.chartWidth);
      const nextOffset = dragRef.current.startScrollOffset + dx * candlesPerPx;
      const maxOffset = Math.max(0, candles.length - visibleCount);
      setScrollOffset(Math.min(maxOffset, Math.max(0, nextOffset)));

      // Subtle vertical panning when user drags vertically on chart
      const shiftDelta = dy / Math.max(150, layoutRef.current.mainChartHeight);
      setYShiftRatio(Math.max(-1.5, Math.min(1.5, dragRef.current.startYShift + shiftDelta / yScale)));
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas && canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }

    const wasMoved = dragRef.current.moved;
    const mode = dragRef.current.mode;
    dragRef.current.mode = 'none';
    setCursorStyle(crosshairActive ? 'crosshair' : 'grab');

    if (wasMoved || pinchRef.current.active || mode === 'y-scale' || mode === 'crosshair') {
      return;
    }

    // Single tap on chart canvas
    const rect = canvas?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (showQuickSymbols) {
      setShowQuickSymbols(false);
      return;
    }

    // Check if user tapped an active order line (Entry / SL / TP)
    const hitOrder = hitTestOrderAtY(y);
    if (hitOrder) {
      setSelectedOrderId(selectedOrder?.id === hitOrder.id ? null : hitOrder.id);
      setShowRadialMenu(false);
      return;
    }

    // Otherwise toggle radial timeframe wheel or dismiss order bar
    if (selectedOrderId) {
      setSelectedOrderId(null);
      return;
    }

    setRadialPos({
      x: Math.min(Math.max(x, 85), rect.width - 85),
      y: Math.min(Math.max(y, 85), rect.height - 85)
    });
    setShowRadialMenu((prev) => !prev);
  };

  // Mouse Wheel Zoom In / Zoom Out (التقريب والتبعيد)
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    const factor = e.deltaY > 0 ? 1.12 : 0.89;
    setVisibleCount((prev) => Math.round(Math.min(180, Math.max(12, prev * factor))));
  };

  // Touch 2-Finger Pinch Zoom In / Zoom Out
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current = {
        active: true,
        initialDist: Math.hypot(dx, dy),
        initialCount: visibleCount
      };
      dragRef.current.mode = 'none';
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 2 && pinchRef.current.active) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      if (pinchRef.current.initialDist > 10) {
        const scale = pinchRef.current.initialDist / dist;
        const nextCount = Math.round(Math.min(180, Math.max(12, pinchRef.current.initialCount * scale)));
        setVisibleCount(nextCount);
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length < 2) {
      pinchRef.current.active = false;
    }
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    if (x >= layoutRef.current.chartWidth) {
      // Double-click right price axis resets vertical scale & vertical offset
      setYScale(1.0);
      setYShiftRatio(0);
    }
  };

  const handleQuickTrade = (type: 'buy' | 'sell') => {
    const ok = openTrade(selectedSymbol, type, lotSize);
    if (ok) {
      const label = type === 'buy' ? 'شراء' : 'بيع';
      const price = type === 'buy' ? currentQuote.ask : currentQuote.bid;
      setTradeToast(`تم تنفيذ ${label} ${lotSize} لوت ${selectedSymbol} عند ${price.toFixed(currentQuote.digits)}`);
      setTimeout(() => setTradeToast(null), 3000);
    }
  };

  const sellFmt = formatMT5SplitPrice(currentQuote.bid, currentQuote.digits);
  const buyFmt = formatMT5SplitPrice(currentQuote.ask, currentQuote.digits);
  const tickColorClass =
    currentQuote.tickDirection === 'down'
      ? 'bg-[#d32f2f] hover:bg-[#c62828]'
      : 'bg-[#1976d2] hover:bg-[#1565c0]';

  const timeframes: Timeframe[] = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1', 'MN'];

  // Active candle OHLC for crosshair readout
  const lastCandle = candles[candles.length - 1];

  return (
    <div className="flex-1 flex flex-col bg-[#000000] text-white overflow-hidden relative select-none">
      {/* 1. TOP TOOLBAR (Exact match to Screenshot_20261115-104407_MetaTrader_5_934c1cc6.jpg) */}
      <header
        dir="ltr"
        className="h-12 bg-[#000000] px-3.5 flex items-center justify-between z-30 shrink-0"
      >
        <div className="flex items-center gap-5 sm:gap-6">
          {/* Icon 1: One-Click Trading Split Box (Red Left / Blue Right / Silver Pill Toggle) */}
          <button
            onClick={() => setShowOneClick((v) => !v)}
            aria-label="التداول السريع بنقرة واحدة"
            title="التداول السريع"
            className="min-w-[40px] min-h-[40px] flex items-center justify-center hover:opacity-85 transition-opacity cursor-pointer"
          >
            <svg viewBox="0 0 32 22" className="w-[26px] h-[18px]">
              <rect x="1" y="1" width="15" height="20" rx="3" fill="#e04b3a" />
              <rect x="16" y="1" width="15" height="20" rx="3" fill="#2d77dc" />
              <rect x="14" y="1" width="4" height="20" fill="#181c24" opacity="0.25" />
              <circle cx="16" cy="11" r="4.5" fill="#d0d7de" stroke="#111419" strokeWidth="1.5" />
            </svg>
          </button>

          {/* Icon 2: Two-Tone Timeframe Pie/Clock Circle */}
          <button
            onClick={() => setShowTimeframeModal(true)}
            aria-label="الفريم الزمني"
            title="تغيير الفريم الزمني"
            className="min-w-[40px] min-h-[40px] flex items-center justify-center hover:opacity-85 transition-opacity cursor-pointer"
          >
            <svg viewBox="0 0 24 24" className="w-[22px] h-[22px]">
              <path
                d="M 12 3.2 A 8.8 8.8 0 0 0 12 20.8"
                fill="none"
                stroke="#e04b3a"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
              <path
                d="M 12 20.8 A 8.8 8.8 0 0 0 12 3.2"
                fill="none"
                stroke="#2d77dc"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
              <line x1="12" y1="12" x2="12" y2="7.5" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="12" y1="12" x2="16" y2="12" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>

          {/* Icon 3: Timeframe Text (e.g. M15) */}
          <button
            onClick={() => setShowTimeframeModal(true)}
            aria-label="اختر الإطار الزمني"
            className="min-w-[40px] min-h-[40px] flex items-center justify-center font-num font-bold text-[15px] text-white tracking-wide hover:text-[#64b5f6] transition-colors cursor-pointer"
          >
            {timeframe}
          </button>

          {/* Icon 4: Indicators (Classic MT5 italicized 'f' with intersecting curve) */}
          <button
            onClick={() => setShowIndicatorsModal(true)}
            aria-label="المؤشرات الفنية"
            title="المؤشرات"
            className={`min-w-[40px] min-h-[40px] flex items-center justify-center transition-colors cursor-pointer ${
              showMA || showMacdPane ? 'text-[#3897f0]' : 'text-white hover:text-[#64b5f6]'
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]">
              <path d="M16 4c-1.8 0-2.8 1.1-3.3 3.2L10.3 17.5C9.8 19.6 8.8 20.5 7 20.5" />
              <path d="M8.5 11.5h6.5" />
              <path d="M4 17l5.5-5.5 3.5 3.5L19.5 8" />
            </svg>
          </button>

          {/* Icon 5: Crosshair (+ with open center gap) */}
          <button
            onClick={() => {
              setCrosshairActive((prev) => !prev);
              if (!crosshairActive) {
                setCrosshairPos({ x: 170, y: 200 });
              }
            }}
            aria-label="المؤشر المتقاطع"
            title="المؤشر المتقاطع (Crosshair)"
            className={`min-w-[40px] min-h-[40px] flex items-center justify-center transition-colors cursor-pointer ${
              crosshairActive ? 'text-[#3897f0]' : 'text-white hover:text-[#64b5f6]'
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" className="w-[22px] h-[22px]">
              <line x1="12" y1="3" x2="12" y2="9" />
              <line x1="12" y1="15" x2="12" y2="21" />
              <line x1="3" y1="12" x2="9" y2="12" />
              <line x1="15" y1="12" x2="21" y2="12" />
            </svg>
          </button>
        </div>

        {/* Right Side: Hamburger Drawer Button */}
        <button
          onClick={() => setIsDrawerOpen(true)}
          aria-label="القائمة الرئيسية"
          className="min-w-[40px] min-h-[40px] flex items-center justify-center text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" className="w-6 h-6">
            <line x1="4" y1="6.5" x2="20" y2="6.5" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="17.5" x2="20" y2="17.5" />
          </svg>
        </button>
      </header>

      {/* 2. ONE-CLICK QUICK TRADING BAR (SELL | ⌄ 0.01 ˄ | BUY — matching Screenshot) */}
      {showOneClick && (
        <div dir="ltr" className="bg-[#090b0e] flex items-stretch h-12 z-20 shrink-0 border-b border-[#181b21]">
          {/* SELL Button (Left) */}
          <button
            onClick={() => handleQuickTrade('sell')}
            className={`flex-1 ${tickColorClass} text-white px-2.5 flex flex-col justify-center transition-colors cursor-pointer`}
          >
            <span className="text-[10px] font-medium tracking-wider text-white/90 text-left leading-none">
              SELL
            </span>
            <div className="flex items-baseline justify-center gap-0.5 mt-0.5 font-num leading-none">
              <span className="text-[15px] font-medium">{sellFmt.main}</span>
              <span className="text-[21px] font-bold tracking-tight">{sellFmt.big}</span>
              {sellFmt.sup && <sup className="text-[11px] font-bold -top-1.5">{sellFmt.sup}</sup>}
            </div>
          </button>

          {/* Lot Stepper (Center) */}
          <div className="w-[42%] max-w-[175px] bg-[#0a0c10] px-2 flex items-center justify-between border-x border-[#161920]">
            <button
              onClick={() => setLotSize((p) => Math.max(0.01, parseFloat((p - 0.01).toFixed(2))))}
              aria-label="إنقاص اللوت"
              className="w-9 h-10 flex items-center justify-center text-[#cfd8dc] hover:text-white cursor-pointer"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-4 h-4">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={lotSize}
              onChange={(e) => setLotSize(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
              className="w-14 text-center bg-transparent text-white font-num font-semibold text-[15px] outline-none"
            />
            <button
              onClick={() => setLotSize((p) => parseFloat((p + 0.01).toFixed(2)))}
              aria-label="زيادة اللوت"
              className="w-9 h-10 flex items-center justify-center text-[#cfd8dc] hover:text-white cursor-pointer"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-4 h-4">
                <polyline points="18 15 12 9 6 15" />
              </svg>
            </button>
          </div>

          {/* BUY Button (Right) */}
          <button
            onClick={() => handleQuickTrade('buy')}
            className={`flex-1 ${tickColorClass} text-white px-2.5 flex flex-col justify-center transition-colors cursor-pointer`}
          >
            <span className="text-[10px] font-medium tracking-wider text-white/90 text-left leading-none">
              BUY
            </span>
            <div className="flex items-baseline justify-center gap-0.5 mt-0.5 font-num leading-none">
              <span className="text-[15px] font-medium">{buyFmt.main}</span>
              <span className="text-[21px] font-bold tracking-tight">{buyFmt.big}</span>
              {buyFmt.sup && <sup className="text-[11px] font-bold -top-1.5">{buyFmt.sup}</sup>}
            </div>
          </button>
        </div>
      )}

      {/* 3. MAIN CHART CANVAS AREA */}
      <div dir="ltr" className="flex-1 relative overflow-hidden bg-[#090b0e]">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onDoubleClick={handleDoubleClick}
          style={{ cursor: cursorStyle, touchAction: 'none' }}
          className="w-full h-full block"
        />

        {/* Top-Left Symbol & Timeframe Overlay (Click to open Quick Symbol Switcher as in PDF Page 3) */}
        <div className="absolute top-1.5 left-2.5 z-20 pointer-events-auto">
          <button
            onClick={() => setShowQuickSymbols((prev) => !prev)}
            className="text-left group cursor-pointer"
          >
            <div className="flex items-center gap-1.5 leading-tight">
              <span className="text-[13px] font-num font-bold text-[#6184f5] group-hover:text-[#84a1ff]">
                {currentQuote.symbol}
              </span>
              <span className="text-[10px] text-[#6184f5]">▾</span>
              <span className="text-[13px] font-num font-medium text-[#cfd8dc]">
                {timeframe}
              </span>
            </div>
            <div className="text-[12px] font-num text-[#d5dce2] leading-tight mt-0.5">
              {currentQuote.name}
            </div>
          </button>
        </div>

        {/* Crosshair OHLC Readout */}
        {crosshairActive && lastCandle && (
          <div className="absolute top-1.5 right-20 bg-[#12151b]/90 border border-[#252a34] rounded px-2 py-1 text-[10px] font-num text-[#b0bec5] flex items-center gap-2 pointer-events-none z-20">
            <span>O: <strong className="text-white">{lastCandle.open.toFixed(currentQuote.digits)}</strong></span>
            <span>H: <strong className="text-[#26a69a]">{lastCandle.high.toFixed(currentQuote.digits)}</strong></span>
            <span>L: <strong className="text-[#ef5350]">{lastCandle.low.toFixed(currentQuote.digits)}</strong></span>
            <span>C: <strong className="text-white">{lastCandle.close.toFixed(currentQuote.digits)}</strong></span>
          </div>
        )}

        {/* Active Orders Quick-Select Chip (If current symbol has open positions and bar isn't open) */}
        {symbolPositions.length > 0 && !selectedOrder && (
          <button
            onClick={() => setSelectedOrderId(symbolPositions[0].id)}
            className="absolute bottom-8 left-2.5 z-20 bg-[#161920]/90 hover:bg-[#1f242e] border border-[#2c3340] px-2.5 py-1 rounded-md text-[11px] font-num text-[#cfd8dc] flex items-center gap-2 cursor-pointer transition-colors"
          >
            <span className={symbolPositions[0].type === 'buy' ? 'text-[#26a69a]' : 'text-[#ef5350]'}>
              {symbolPositions[0].type.toUpperCase()} {symbolPositions[0].lots.toFixed(2)}
            </span>
            <span className="text-[#8e9aa8]">· تعديل SL/TP</span>
          </button>
        )}

        {/* Quick Symbol Switcher Vertical Drawer on Left (Exact match to PDF Page 3 Item 6) */}
        {showQuickSymbols && (
          <div className="absolute top-12 left-0 bottom-6 w-40 bg-[#090b0e]/95 border-r border-[#1f242d] overflow-y-auto scrollbar-thin z-30 animate-fadeIn">
            {quotes.map((q) => (
              <button
                key={q.symbol}
                onClick={() => {
                  setSelectedSymbol(q.symbol);
                  setShowQuickSymbols(false);
                }}
                className={`w-full px-3 py-2 text-left text-[13px] font-num font-medium transition-colors cursor-pointer block ${
                  q.symbol === selectedSymbol
                    ? 'bg-[#1a2232] text-[#64b5f6] font-bold'
                    : 'text-[#4e77e6] hover:bg-white/5 hover:text-[#7da0ff]'
                }`}
              >
                {q.symbol}
              </button>
            ))}
          </div>
        )}

        {/* Floating Bottom Quick-Action Bar for SL / TP / Close (Exact match to PDF Page 2 Item 4) */}
        {selectedOrder && (
          <div
            dir="rtl"
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 bg-[#181b21]/95 border border-[#2b303a] rounded-full px-2.5 py-1.5 flex items-center gap-2 shadow-2xl animate-scaleIn"
          >
            {/* Dismiss bar */}
            <button
              onClick={() => setSelectedOrderId(null)}
              aria-label="إلغاء"
              className="w-8 h-8 rounded-full bg-[#242933] hover:bg-[#303744] text-[#cfd8dc] flex items-center justify-center text-xs cursor-pointer"
            >
              ✕
            </button>

            {/* Close Position */}
            <button
              onClick={() => {
                closePosition(selectedOrder.id);
                setSelectedOrderId(null);
              }}
              className="px-3.5 h-8 rounded-full bg-[#e67e22] hover:bg-[#d35400] text-white font-bold text-xs flex items-center justify-center cursor-pointer transition-colors"
            >
              إغلاق
            </button>

            {/* SL Circle Button */}
            <button
              onClick={() => {
                setModifyingFocus('sl');
                setModifyingPosition(selectedOrder);
              }}
              className="w-8 h-8 rounded-full bg-[#26a69a] hover:bg-[#2bbbad] text-white font-num font-bold text-[11px] flex items-center justify-center cursor-pointer transition-colors"
            >
              SL
            </button>

            {/* TP Circle Button */}
            <button
              onClick={() => {
                setModifyingFocus('tp');
                setModifyingPosition(selectedOrder);
              }}
              className="w-8 h-8 rounded-full bg-[#00c853] hover:bg-[#00e676] text-black font-num font-bold text-[11px] flex items-center justify-center cursor-pointer transition-colors"
            >
              TP
            </button>

            {/* Modify Order Arrow */}
            <button
              onClick={() => {
                setModifyingFocus(null);
                setModifyingPosition(selectedOrder);
              }}
              aria-label="شاشة التعديل"
              className="w-8 h-8 rounded-full bg-[#242933] hover:bg-[#303744] text-white flex items-center justify-center text-sm cursor-pointer"
            >
              →
            </button>
          </div>
        )}

        {/* Bottom-Right Three Dots Reset Button (Resets chart zoom/right-axis vertical scale) */}
        <button
          onClick={() => {
            setVisibleCount(64);
            setScrollOffset(0);
            setYScale(1.0);
            setYShiftRatio(0);
          }}
          title="إعادة ضبط مقياس الرسم البياني"
          aria-label="إعادة ضبط المقياس"
          className="absolute bottom-0.5 right-3 z-20 px-2 py-1 text-[#cfd8dc] hover:text-white tracking-[3px] text-xs font-bold cursor-pointer"
        >
          •••
        </button>

        {/* MT5 Radial Timeframe Menu (Tapping empty chart area) */}
        {showRadialMenu && (
          <div
            className="absolute z-40"
            style={{ left: `${radialPos.x - 75}px`, top: `${radialPos.y - 75}px` }}
          >
            <div className="fixed inset-0 z-30" onClick={() => setShowRadialMenu(false)} />
            <div className="relative w-[150px] h-[150px] rounded-full bg-[#12151c]/95 border-2 border-[#3897f0] shadow-2xl flex items-center justify-center z-40 animate-scaleIn">
              <button
                onClick={() => setShowRadialMenu(false)}
                className="w-10 h-10 rounded-full bg-[#3897f0] text-white font-num font-bold text-xs cursor-pointer"
              >
                {timeframe}
              </button>
              {timeframes.map((tf, idx) => {
                const angle = (idx / timeframes.length) * 2 * Math.PI - Math.PI / 2;
                const radius = 54;
                const bx = 75 + radius * Math.cos(angle) - 14;
                const by = 75 + radius * Math.sin(angle) - 14;
                return (
                  <button
                    key={tf}
                    onClick={() => {
                      setTimeframe(tf);
                      setShowRadialMenu(false);
                    }}
                    style={{ left: `${bx}px`, top: `${by}px` }}
                    className={`absolute w-7 h-7 rounded-full text-[10px] font-num font-bold flex items-center justify-center cursor-pointer transition-colors ${
                      timeframe === tf
                        ? 'bg-[#3897f0] text-white'
                        : 'bg-[#212631] text-[#d0d8e2] hover:bg-[#3897f0]/40'
                    }`}
                  >
                    {tf}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Trade Toast */}
        {tradeToast && (
          <div
            dir="rtl"
            className="absolute top-3 left-1/2 -translate-x-1/2 bg-[#26a69a] text-white font-bold text-xs px-4 py-2 rounded-lg shadow-xl z-50 whitespace-nowrap animate-fadeIn"
          >
            ✓ {tradeToast}
          </div>
        )}
      </div>

      {/* Timeframe Modal */}
      {showTimeframeModal && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fadeIn"
          onClick={() => setShowTimeframeModal(false)}
        >
          <div
            className="bg-[#181b21] border border-[#2a2f3a] rounded-2xl w-full max-w-xs p-4 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#242832] mb-3">
              <button
                onClick={() => setShowTimeframeModal(false)}
                className="w-8 h-8 rounded-full bg-white/5 text-[#8e9aa8] hover:text-white cursor-pointer"
              >
                ✕
              </button>
              <h3 className="font-bold text-white text-sm">الإطار الزمني (Timeframe)</h3>
              <div className="w-8" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {timeframes.map((tf) => (
                <button
                  key={tf}
                  onClick={() => {
                    setTimeframe(tf);
                    setShowTimeframeModal(false);
                  }}
                  className={`py-2.5 rounded-xl font-num font-bold text-sm cursor-pointer transition-colors ${
                    timeframe === tf
                      ? 'bg-[#3897f0] text-white'
                      : 'bg-[#101217] text-[#a0aab5] hover:text-white border border-[#232833]'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Indicators Modal */}
      {showIndicatorsModal && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fadeIn"
          onClick={() => setShowIndicatorsModal(false)}
        >
          <div
            className="bg-[#181b21] border border-[#2a2f3a] rounded-2xl w-full max-w-xs p-4 text-right shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-[#242832]">
              <button
                onClick={() => setShowIndicatorsModal(false)}
                className="w-8 h-8 rounded-full bg-white/5 text-[#8e9aa8] hover:text-white cursor-pointer"
              >
                ✕
              </button>
              <h3 className="font-bold text-white text-sm">المؤشرات الفنية</h3>
              <div className="w-8" />
            </div>

            <button
              onClick={() => setShowMA((v) => !v)}
              className="w-full p-3 rounded-xl bg-[#111318] border border-[#242934] flex items-center justify-between cursor-pointer"
            >
              <span className={`text-xs font-bold ${showMA ? 'text-[#26a69a]' : 'text-[#8e9aa8]'}`}>
                {showMA ? 'مفعّل' : 'متوقف'}
              </span>
              <span className="text-sm font-semibold text-white">المتوسطات المتحركة (MA 10/25/50)</span>
            </button>

            <button
              onClick={() => setShowMacdPane((v) => !v)}
              className="w-full p-3 rounded-xl bg-[#111318] border border-[#242934] flex items-center justify-between cursor-pointer"
            >
              <span className={`text-xs font-bold ${showMacdPane ? 'text-[#26a69a]' : 'text-[#8e9aa8]'}`}>
                {showMacdPane ? 'مفعّل' : 'متوقف'}
              </span>
              <span className="text-sm font-semibold text-white">مؤشر الزخم (MACD 12,26,9)</span>
            </button>

            <button
              onClick={() => setShowIndicatorsModal(false)}
              className="w-full py-2.5 bg-[#3897f0] text-white font-bold rounded-xl text-xs cursor-pointer"
            >
              تم
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
