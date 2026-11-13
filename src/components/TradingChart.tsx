import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Asset, Candle, Position } from '../types/trading';
import { formatPrice, formatTime, formatPercentage } from '../utils/format';
import { 
  TrendingUp, 
  Activity, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Sparkles,
  Sliders,
  Layers
} from 'lucide-react';

interface TradingChartProps {
  asset: Asset;
  candles: Candle[];
  positions?: Position[];
  timeframe: string;
  onTimeframeChange: (tf: string) => void;
  isAiActive?: boolean;
}

export const TradingChart: React.FC<TradingChartProps> = ({
  asset,
  candles,
  positions = [],
  timeframe,
  onTimeframeChange,
  isAiActive = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Line chart settings - Default strictly to "garis garis" (Line chart with technical lines)
  const [showEMA20, setShowEMA20] = useState(true);
  const [showEMA50, setShowEMA50] = useState(true);
  const [showBollinger, setShowBollinger] = useState(true);
  const [showAreaGradient, setShowAreaGradient] = useState(true);
  const [visibleCount, setVisibleCount] = useState(60);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  // Filter positions for this asset
  const activeAssetPositions = useMemo(() => {
    return positions.filter(p => p.assetId === asset.id);
  }, [positions, asset.id]);

  // Calculate EMA (Exponential Moving Average) & Bollinger Bands
  const { ema20, ema50, bollingerUpper, bollingerLower } = useMemo(() => {
    const calcEMA = (period: number) => {
      const k = 2 / (period + 1);
      const res: (number | null)[] = [];
      let prevEma: number | null = null;

      for (let i = 0; i < candles.length; i++) {
        if (i < period - 1) {
          res.push(null);
        } else if (i === period - 1) {
          let sum = 0;
          for (let j = 0; j < period; j++) sum += candles[i - j].close;
          prevEma = sum / period;
          res.push(prevEma);
        } else if (prevEma !== null) {
          const currentEma: number = candles[i].close * k + prevEma * (1 - k);
          prevEma = currentEma;
          res.push(currentEma);
        }
      }
      return res;
    };

    const calcBollinger = (period: number, multiplier = 2) => {
      const upper: (number | null)[] = [];
      const lower: (number | null)[] = [];

      for (let i = 0; i < candles.length; i++) {
        if (i < period - 1) {
          upper.push(null);
          lower.push(null);
        } else {
          let sum = 0;
          for (let j = 0; j < period; j++) sum += candles[i - j].close;
          const mean = sum / period;

          let varianceSum = 0;
          for (let j = 0; j < period; j++) varianceSum += Math.pow(candles[i - j].close - mean, 2);
          const stdDev = Math.sqrt(varianceSum / period);

          upper.push(mean + multiplier * stdDev);
          lower.push(mean - multiplier * stdDev);
        }
      }
      return { upper, lower };
    };

    const ema20Arr = calcEMA(20);
    const ema50Arr = calcEMA(50);
    const { upper: bbUpper, lower: bbLower } = calcBollinger(20, 2);

    return {
      ema20: ema20Arr,
      ema50: ema50Arr,
      bollingerUpper: bbUpper,
      bollingerLower: bbLower
    };
  }, [candles]);

  const handleZoom = (delta: number) => {
    setVisibleCount(prev => Math.min(Math.max(20, prev + delta), candles.length));
  };

  const handleReset = () => {
    setVisibleCount(60);
  };

  // Main Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = containerRef.current.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = rect.width;
    const height = rect.height;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const visibleCandles = candles.slice(-visibleCount);
    if (visibleCandles.length < 2) return;

    const topPadding = 25;
    const bottomPadding = 30;
    const rightPadding = 75;
    const chartHeight = height - topPadding - bottomPadding;

    // Calculate Price Range across visible line points & indicators
    let minPrice = Infinity;
    let maxPrice = -Infinity;

    visibleCandles.forEach(c => {
      if (c.close < minPrice) minPrice = c.close;
      if (c.close > maxPrice) maxPrice = c.close;
    });

    // Include EMA in range so lines never clip
    const startIdx = candles.length - visibleCount;
    if (showBollinger) {
      visibleCandles.forEach((_, i) => {
        const u = bollingerUpper[startIdx + i];
        const l = bollingerLower[startIdx + i];
        if (u !== null && u > maxPrice) maxPrice = u;
        if (l !== null && l < minPrice) minPrice = l;
      });
    }

    const pricePadding = (maxPrice - minPrice) * 0.08 || 1;
    minPrice -= pricePadding;
    maxPrice += pricePadding;
    const priceRange = maxPrice - minPrice;

    const getX = (index: number) => {
      const step = (width - rightPadding) / (visibleCandles.length - 1);
      return index * step;
    };

    const getY = (price: number) => {
      return topPadding + chartHeight * (1 - (price - minPrice) / priceRange);
    };

    // 1. Draw Clean Dark Slate Canvas Background
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#080a0f';
    ctx.fillRect(0, 0, width, height);

    // 2. Draw Subtle Horizontal Price Grid Lines
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#141a26';
    ctx.fillStyle = '#475569';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'left';

    const gridLinesCount = 5;
    for (let i = 0; i <= gridLinesCount; i++) {
      const p = minPrice + (priceRange * i) / gridLinesCount;
      const y = getY(p);

      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width - rightPadding, y);
      ctx.stroke();

      // Right axis price labels
      ctx.fillText(formatPrice(p, asset.decimals), width - rightPadding + 8, y + 3);
    }

    // 3. Draw Bollinger Bands Technical Lines (Upper and Lower channel)
    if (showBollinger) {
      // Bollinger Upper Line
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)'; // Sky blue soft
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      let upperStarted = false;
      visibleCandles.forEach((_, i) => {
        const val = bollingerUpper[startIdx + i];
        if (val !== null) {
          const x = getX(i);
          const y = getY(val);
          if (!upperStarted) {
            ctx.moveTo(x, y);
            upperStarted = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      });
      ctx.stroke();

      // Bollinger Lower Line
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.beginPath();
      let lowerStarted = false;
      visibleCandles.forEach((_, i) => {
        const val = bollingerLower[startIdx + i];
        if (val !== null) {
          const x = getX(i);
          const y = getY(val);
          if (!lowerStarted) {
            ctx.moveTo(x, y);
            lowerStarted = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 4. Draw Moving Average Trend Lines (EMA20 & EMA50)
    if (showEMA50) {
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.8)'; // Violet Line
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      let started = false;
      visibleCandles.forEach((_, i) => {
        const val = ema50[startIdx + i];
        if (val !== null) {
          const x = getX(i);
          const y = getY(val);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      });
      ctx.stroke();
    }

    if (showEMA20) {
      ctx.strokeStyle = '#f59e0b'; // Amber Gold Line
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      let started = false;
      visibleCandles.forEach((_, i) => {
        const val = ema20[startIdx + i];
        if (val !== null) {
          const x = getX(i);
          const y = getY(val);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      });
      ctx.stroke();
    }

    // 5. Draw Main Price Smooth Line ("Grafik Garis")
    const isBullish = asset.currentPrice >= visibleCandles[0].close;
    const lineColor = isBullish ? '#00e599' : '#ff4667'; // Emerald / Ruby

    // Smooth Bezier Curve Path calculation
    const points = visibleCandles.map((c, i) => ({
      x: getX(i),
      y: getY(c.close)
    }));

    if (showAreaGradient && points.length > 0) {
      // Area Fill below the line
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);

      for (let i = 0; i < points.length - 1; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
      }
      ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
      ctx.lineTo(points[points.length - 1].x, topPadding + chartHeight);
      ctx.lineTo(points[0].x, topPadding + chartHeight);
      ctx.closePath();

      const gradient = ctx.createLinearGradient(0, topPadding, 0, topPadding + chartHeight);
      if (isBullish) {
        gradient.addColorStop(0, 'rgba(0, 229, 153, 0.18)');
        gradient.addColorStop(0.5, 'rgba(0, 229, 153, 0.05)');
        gradient.addColorStop(1, 'rgba(0, 229, 153, 0.0)');
      } else {
        gradient.addColorStop(0, 'rgba(255, 70, 103, 0.18)');
        gradient.addColorStop(0.5, 'rgba(255, 70, 103, 0.05)');
        gradient.addColorStop(1, 'rgba(255, 70, 103, 0.0)');
      }
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    // Draw Main Glowing Line
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // 6. Draw Glowing Beacon at Last Point
    if (points.length > 0) {
      const lastPoint = points[points.length - 1];

      // Outer ripple
      ctx.beginPath();
      ctx.arc(lastPoint.x, lastPoint.y, 7, 0, Math.PI * 2);
      ctx.fillStyle = isBullish ? 'rgba(0, 229, 153, 0.25)' : 'rgba(255, 70, 103, 0.25)';
      ctx.fill();

      // Inner dot
      ctx.beginPath();
      ctx.arc(lastPoint.x, lastPoint.y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = lineColor;
      ctx.fill();
    }

    // 7. Active Position Lines (Entry, TP, SL)
    activeAssetPositions.forEach(pos => {
      const entryY = getY(pos.entryPrice);
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = pos.type === 'BUY' ? '#10b981' : '#f43f5e';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, entryY);
      ctx.lineTo(width - rightPadding, entryY);
      ctx.stroke();

      ctx.fillStyle = pos.type === 'BUY' ? '#10b981' : '#f43f5e';
      ctx.fillRect(width - rightPadding, entryY - 9, 72, 18);
      ctx.fillStyle = '#080a0f';
      ctx.font = 'bold 9px JetBrains Mono, monospace';
      ctx.fillText(`${pos.type} ${pos.leverage}x`, width - rightPadding + 5, entryY + 4);
      ctx.restore();

      if (pos.takeProfit) {
        const tpY = getY(pos.takeProfit);
        ctx.save();
        ctx.setLineDash([2, 4]);
        ctx.strokeStyle = '#10b981';
        ctx.beginPath();
        ctx.moveTo(0, tpY);
        ctx.lineTo(width - rightPadding, tpY);
        ctx.stroke();
        ctx.fillStyle = '#10b981';
        ctx.font = '9px JetBrains Mono, monospace';
        ctx.fillText(`TP`, width - rightPadding + 6, tpY + 3);
        ctx.restore();
      }

      if (pos.stopLoss) {
        const slY = getY(pos.stopLoss);
        ctx.save();
        ctx.setLineDash([2, 4]);
        ctx.strokeStyle = '#f43f5e';
        ctx.beginPath();
        ctx.moveTo(0, slY);
        ctx.lineTo(width - rightPadding, slY);
        ctx.stroke();
        ctx.fillStyle = '#f43f5e';
        ctx.font = '9px JetBrains Mono, monospace';
        ctx.fillText(`SL`, width - rightPadding + 6, slY + 3);
        ctx.restore();
      }
    });

    // 8. Current Price Horizontal Dotted Line & Right Tag
    const currentY = getY(asset.currentPrice);
    ctx.save();
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, currentY);
    ctx.lineTo(width - rightPadding, currentY);
    ctx.stroke();
    ctx.restore();

    // Right Badge
    ctx.fillStyle = lineColor;
    ctx.fillRect(width - rightPadding, currentY - 10, rightPadding, 20);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px JetBrains Mono, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(formatPrice(asset.currentPrice, asset.decimals), width - rightPadding + 5, currentY + 4);

    // 9. Interactive Crosshair & Tooltip
    if (mousePos && mousePos.x < width - rightPadding && mousePos.y > topPadding && mousePos.y < height - bottomPadding) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);

      // Vertical line
      ctx.beginPath();
      ctx.moveTo(mousePos.x, topPadding);
      ctx.lineTo(mousePos.x, height - bottomPadding);
      ctx.stroke();

      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(0, mousePos.y);
      ctx.lineTo(width - rightPadding, mousePos.y);
      ctx.stroke();

      // Time label on bottom axis
      const step = (width - rightPadding) / (visibleCandles.length - 1);
      const candleIndex = Math.min(Math.max(0, Math.round(mousePos.x / step)), visibleCandles.length - 1);
      const hoveredCandle = visibleCandles[candleIndex];

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(mousePos.x - 32, height - bottomPadding + 3, 64, 18);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '9px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(formatTime(hoveredCandle.time), mousePos.x, height - bottomPadding + 15);

      // Price label on right axis
      const hoverPrice = minPrice + (priceRange * (topPadding + chartHeight - mousePos.y)) / chartHeight;
      ctx.fillStyle = '#334155';
      ctx.fillRect(width - rightPadding, mousePos.y - 9, rightPadding, 18);
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText(formatPrice(hoverPrice, asset.decimals), width - rightPadding + 5, mousePos.y + 4);

      ctx.restore();
    }

    // 10. Bottom Time Axis Labels
    ctx.fillStyle = '#64748b';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    const timeStep = Math.max(1, Math.floor(visibleCandles.length / 5));
    for (let i = 0; i < visibleCandles.length; i += timeStep) {
      const c = visibleCandles[i];
      const x = getX(i);
      ctx.fillText(formatTime(c.time), x, height - 10);
    }
  }, [candles, visibleCount, showEMA20, showEMA50, showBollinger, showAreaGradient, asset, activeAssetPositions, mousePos]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    const step = (rect.width - 75) / (visibleCount - 1);
    const idx = Math.round(x / step);
    setHoverIndex(idx >= 0 && idx < visibleCount ? idx : null);
  };

  const handleMouseLeave = () => {
    setMousePos(null);
    setHoverIndex(null);
  };

  const currentHoverCandle = hoverIndex !== null && candles.slice(-visibleCount)[hoverIndex]
    ? candles.slice(-visibleCount)[hoverIndex]
    : candles[candles.length - 1];

  const timeframes = ['1s', '5s', '1m', '5m', '15m'];

  return (
    <div className="flex flex-col h-full bg-[#080a0f] border border-[#161c28] rounded-xl overflow-hidden select-none shadow-sm">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-3.5 py-2.5 border-b border-[#161c28] bg-[#0c1017] gap-2 text-xs">
        {/* Timeframe Selectors */}
        <div className="flex items-center gap-1 bg-[#121722] p-0.5 rounded-lg border border-[#1b2333]">
          {timeframes.map(tf => (
            <button
              key={tf}
              onClick={() => onTimeframeChange(tf)}
              className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors ${
                timeframe === tf
                  ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Technical Line Overlays */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setShowEMA20(!showEMA20)}
            className={`px-2 py-1 rounded text-xs font-mono transition-colors ${
              showEMA20 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Garis Tren Singkat (EMA 20)"
          >
            EMA20
          </button>

          <button
            onClick={() => setShowEMA50(!showEMA50)}
            className={`px-2 py-1 rounded text-xs font-mono transition-colors ${
              showEMA50 ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Garis Tren Utama (EMA 50)"
          >
            EMA50
          </button>

          <button
            onClick={() => setShowBollinger(!showBollinger)}
            className={`px-2 py-1 rounded text-xs font-mono transition-colors ${
              showBollinger ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Garis Saluran Volatilitas (Bollinger Bands)"
          >
            Bands
          </button>

          <button
            onClick={() => setShowAreaGradient(!showAreaGradient)}
            className={`px-2 py-1 rounded text-xs font-mono transition-colors ${
              showAreaGradient ? 'bg-emerald-500/10 text-emerald-300' : 'text-slate-600'
            }`}
            title="Gradien Area Bayangan"
          >
            Glow
          </button>

          <div className="h-3 w-[1px] bg-slate-800 mx-1 hidden sm:block" />

          {/* Zoom controls */}
          <button
            onClick={() => handleZoom(-10)}
            title="Zoom In"
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-[#161d2b] rounded transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleZoom(10)}
            title="Zoom Out"
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-[#161d2b] rounded transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleReset}
            title="Reset Zoom"
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-[#161d2b] rounded transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Floating Info & Trader AI Indicator */}
      <div className="flex flex-wrap items-center justify-between px-3.5 py-1.5 bg-[#090d14] border-b border-[#141a26] text-[11px] font-mono text-slate-400 gap-2">
        <div className="flex items-center gap-3">
          <span className="text-slate-200 font-bold">{asset.symbol}</span>
          <span>Harga: <strong className="text-slate-100">{formatPrice(currentHoverCandle?.close || asset.currentPrice, asset.decimals)}</strong></span>
          <span className={asset.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
            {formatPercentage(asset.change24h)}
          </span>
          <span className="hidden md:inline text-slate-500">
            Tinggi: <strong className="text-slate-300">{formatPrice(asset.high24h, asset.decimals)}</strong>
          </span>
          <span className="hidden md:inline text-slate-500">
            Rendah: <strong className="text-slate-300">{formatPrice(asset.low24h, asset.decimals)}</strong>
          </span>
        </div>

        {isAiActive && (
          <div className="flex items-center gap-1.5 text-emerald-400 font-sans font-medium text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
            <span>Trader AI Memantau Garis Harga...</span>
          </div>
        )}
      </div>

      {/* Main Canvas Viewport */}
      <div ref={containerRef} className="relative flex-1 w-full min-h-[340px] overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="w-full h-full cursor-crosshair block"
        />
      </div>
    </div>
  );
};
