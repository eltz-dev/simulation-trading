import React, { useState, useEffect, useRef } from 'react';
import { Asset, AssetCategory, Position, Currency, AITier } from '../types/trading';
import { formatPrice, formatCurrencyValue, formatPercentage, formatTime } from '../utils/format';
import { 
  Bot, 
  Play, 
  Pause, 
  Sparkles, 
  TrendingUp, 
  Zap, 
  Activity, 
  CheckCircle2, 
  SlidersHorizontal,
  Flame,
  ArrowRight,
  ShieldCheck,
  Crown
} from 'lucide-react';
import { soundManager } from '../utils/sound';
import confetti from 'canvas-confetti';

export interface TraderAILog {
  id: string;
  time: number;
  type: 'ANALYSIS' | 'ORDER_BUY' | 'ORDER_SELL' | 'PROFIT' | 'LOSS' | 'TAKEOVER';
  text: string;
  assetSymbol: string;
  pnl?: number;
}

interface TraderAIPanelProps {
  currentAsset: Asset;
  allAssets: Asset[];
  userBalance: number;
  userCurrency: Currency;
  isAiActive: boolean;
  onToggleAi: () => void;
  onExecuteAiOrder: (order: {
    type: 'BUY' | 'SELL';
    amount: number;
    leverage: number;
    takeProfit?: number;
    stopLoss?: number;
    note: string;
    isUltra?: boolean;
  }) => void;
  activePositions: Position[];
  onCloseAiPosition: (positionId: string) => void;
  aiTier: AITier;
  onUpgradeToUltra: () => void;
  onSwitchAssetAndCategory: (cat: AssetCategory, assetId: string, reason: string) => void;
}

export const TraderAIPanel: React.FC<TraderAIPanelProps> = ({
  currentAsset,
  allAssets,
  userBalance,
  userCurrency,
  isAiActive,
  onToggleAi,
  onExecuteAiOrder,
  activePositions,
  onCloseAiPosition,
  aiTier,
  onUpgradeToUltra,
  onSwitchAssetAndCategory
}) => {
  const isUltra = aiTier === 'ULTRA';
  const [strategyMode, setStrategyMode] = useState<'scalping' | 'moderat' | 'konservatif'>('scalping');
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);
  const [logs, setLogs] = useState<TraderAILog[]>([
    {
      id: 'init-1',
      time: Date.now() - 20000,
      type: 'ANALYSIS',
      text: isUltra 
        ? '⚡ TRADER AI ULTRA AKTIF: Siap mengambil alih & memburu kategori pasar paling cuan.'
        : 'Trader AI (Paket Free) siap memindai garis pasar untuk mencari keuntungan.',
      assetSymbol: currentAsset.symbol
    }
  ]);
  const [aiProfitTotal, setAiProfitTotal] = useState<number>(0);
  const [aiWins, setAiWins] = useState<number>(isUltra ? 47 : 12);
  const [aiLosses, setAiLosses] = useState<number>(0);
  const [currentAiStatus, setCurrentAiStatus] = useState<string>('Standby');
  const [isThinking, setIsThinking] = useState<boolean>(false);

  // Dynamic Ultra win rate oscillating between 99.3% and 99.5%
  const [ultraWinRate, setUltraWinRate] = useState<number>(99.5);

  useEffect(() => {
    if (isUltra) {
      const interval = setInterval(() => {
        // Keeps oscillating strictly between 99.3% and 99.5%
        const rates = [99.5, 99.4, 99.5, 99.3, 99.5];
        const next = rates[Math.floor(Math.random() * rates.length)];
        setUltraWinRate(next);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isUltra]);

  const loopTimerRef = useRef<any>(null);

  // Main AI Autonomous Execution Loop
  useEffect(() => {
    if (!isAiActive) {
      if (loopTimerRef.current) clearInterval(loopTimerRef.current);
      setCurrentAiStatus('Nonaktif (Standby)');
      return;
    }

    setCurrentAiStatus(
      isUltra 
        ? '⚡ Mode Ambil Alih Ultra: Memindai 4 Kategori Pasar Paling Untung...'
        : 'Memindai pergerakan garis pasar terkini...'
    );

    const runAgentCycle = async () => {
      if (!isAiActive) return;
      setIsThinking(true);

      try {
        let targetAssetToTrade = currentAsset;

        // --- ULTRA FEATURE: AUTONOMOUS MARKET SCANNER & AUTO-SWITCH SCREEN ---
        if (isUltra && allAssets.length > 0) {
          // Find asset with the biggest dynamic opportunity or price swing
          const hotAssets = [...allAssets].sort((a, b) => {
            const scoreA = Math.abs(a.change24h) * a.volatility;
            const scoreB = Math.abs(b.change24h) * b.volatility;
            return scoreB - scoreA;
          });

          // Top opportunity asset
          const bestOpp = hotAssets[0];
          if (bestOpp && bestOpp.id !== currentAsset.id && Math.random() > 0.35) {
            targetAssetToTrade = bestOpp;
            const takeoverReason = `Peluang Cuan Terbesar terdeteksi pada kategori ${bestOpp.categoryLabel}!`;
            
            // Auto switch user screen to that winning category & asset!
            onSwitchAssetAndCategory(bestOpp.category, bestOpp.id, takeoverReason);

            setLogs(prev => [
              {
                id: `takeover-${Date.now()}`,
                time: Date.now(),
                type: 'TAKEOVER',
                text: `⚡ TRADER AI ULTRA MENGAMBIL ALIH: Menemukan peluang cuan tertinggi di ${bestOpp.categoryLabel} (${bestOpp.symbol})! Memindahkan layar trading...`,
                assetSymbol: bestOpp.symbol
              },
              ...prev.slice(0, 30)
            ]);
          }
        }

        // Call backend Trader AI endpoint with aiTier
        const response = await fetch('/api/trader-ai/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assetSymbol: targetAssetToTrade.symbol,
            assetName: targetAssetToTrade.name,
            currentPrice: targetAssetToTrade.currentPrice,
            change24h: targetAssetToTrade.change24h,
            candles: [],
            strategyMode,
            balance: userBalance,
            aiTier
          })
        });

        const data = await response.json();
        const decision = data?.decision;

        if (decision && decision.action !== 'HOLD') {
          const isBuy = decision.action === 'BUY';
          const tpMultiplier = isBuy ? 1 + decision.tpPercent / 100 : 1 - decision.tpPercent / 100;
          const slMultiplier = isBuy ? 1 - decision.slPercent / 100 : 1 + decision.slPercent / 100;

          const tpPrice = Number((targetAssetToTrade.currentPrice * tpMultiplier).toFixed(targetAssetToTrade.decimals));
          const slPrice = Number((targetAssetToTrade.currentPrice * slMultiplier).toFixed(targetAssetToTrade.decimals));

          // Log AI decision
          const logItem: TraderAILog = {
            id: `ai-log-${Date.now()}`,
            time: Date.now(),
            type: isBuy ? 'ORDER_BUY' : 'ORDER_SELL',
            text: decision.reason,
            assetSymbol: targetAssetToTrade.symbol
          };
          setLogs(prev => [logItem, ...prev.slice(0, 30)]);
          setCurrentAiStatus(
            isUltra
              ? `⚡ Ultra Berani Bertaruh: ${decision.action} ${decision.suggestedLot} Lot (${decision.leverage}x Leverage)`
              : `Mengeksekusi ${decision.action} (${decision.confidence}% keyakinan)`
          );

          onExecuteAiOrder({
            type: decision.action,
            amount: decision.suggestedLot || (isUltra ? 1.0 : 0.1),
            leverage: decision.leverage || (isUltra ? 50 : 10),
            takeProfit: tpPrice,
            stopLoss: slPrice,
            note: decision.reason,
            isUltra
          });
        }
      } catch (err) {
        console.warn('Trader AI cycle notice:', err);
      } finally {
        setIsThinking(false);
      }
    };

    const intervalTime = isUltra ? 7000 : 9000;
    const firstTimeout = setTimeout(runAgentCycle, 1200);
    loopTimerRef.current = setInterval(runAgentCycle, intervalTime);

    return () => {
      clearTimeout(firstTimeout);
      if (loopTimerRef.current) clearInterval(loopTimerRef.current);
    };
  }, [isAiActive, isUltra, currentAsset.id, strategyMode, userBalance, aiTier]);

  // Monitor open positions for AI Profit Taking
  useEffect(() => {
    if (!isAiActive || activePositions.length === 0) return;

    // For Ultra, AI locks profit aggressively and guarantees wins!
    const profitThresholdROE = isUltra ? 4.5 : 6.0;

    activePositions.forEach(pos => {
      if (pos.roe >= profitThresholdROE || (isUltra && pos.unrealizedPnl > 2000000)) {
        soundManager.playWin();
        if (isUltra) {
          confetti({ particleCount: 45, spread: 60, origin: { y: 0.6 } });
        }
        setAiProfitTotal(prev => prev + pos.unrealizedPnl);
        setAiWins(prev => prev + 1);

        setLogs(prev => [
          {
            id: `profit-${Date.now()}`,
            time: Date.now(),
            type: 'PROFIT',
            text: isUltra 
              ? `🔥 HASIL BESAR TERCAPAI! Trader AI Ultra mengamankan profit +${formatCurrencyValue(pos.unrealizedPnl, userCurrency, userCurrency)} (ROE ${formatPercentage(pos.roe)}) pada ${pos.assetSymbol}!`
              : `🎯 Trader AI Mengunci Profit +${formatCurrencyValue(pos.unrealizedPnl, userCurrency, userCurrency)} pada ${pos.assetSymbol}`,
            assetSymbol: pos.assetSymbol,
            pnl: pos.unrealizedPnl
          },
          ...prev.slice(0, 30)
        ]);

        onCloseAiPosition(pos.id);
      }
    });
  }, [activePositions, isAiActive, isUltra, userCurrency]);

  const displayWinRate = isUltra 
    ? ultraWinRate.toFixed(1)
    : (aiWins + aiLosses > 0 ? ((aiWins / (aiWins + aiLosses)) * 100).toFixed(1) : '84.0');

  return (
    <div className={`flex flex-col h-full rounded-xl overflow-hidden text-xs border transition-all ${
      isUltra 
        ? 'bg-[#090b12] border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.15)]' 
        : 'bg-[#090d14] border-[#161c28]'
    }`}>
      {/* Header with Tier Badge and Master Toggle */}
      <div className={`p-3 border-b flex items-center justify-between ${
        isUltra 
          ? 'bg-gradient-to-r from-amber-950/40 via-[#0e1320] to-[#0c1018] border-amber-500/30' 
          : 'bg-[#0d121c] border-[#161c28]'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
            isUltra
              ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.5)] font-bold'
              : isAiActive
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              : 'bg-slate-800 text-slate-500'
          }`}>
            {isUltra ? <Crown className="w-4 h-4 fill-current" /> : <Bot className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-100 text-xs">Trader AI</span>
              <span className={`text-[9px] font-mono font-extrabold px-1.5 py-0.2 rounded border ${
                isUltra
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {isUltra ? 'PAKET ULTRA 53 JT' : 'PAKET FREE'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              {isUltra 
                ? 'Mode Ambil Alih: Win Rate 99.5% & Taruhan Besar'
                : 'Membantu mencari keuntungan di pasar aktif'}
            </p>
          </div>
        </div>

        {/* Master On/Off Switch */}
        <button
          onClick={onToggleAi}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-all shadow ${
            isAiActive
              ? (isUltra ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-amber-400/30 font-extrabold' : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400')
              : 'bg-[#182030] text-slate-300 hover:bg-[#202b3f] border border-slate-700/60'
          }`}
        >
          {isAiActive ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Matikan AI</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Aktifkan AI</span>
            </>
          )}
        </button>
      </div>

      {/* Upgrade to Ultra Banner if on Free */}
      {!isUltra && (
        <div className="p-2.5 mx-2.5 mt-2 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
            <div>
              <div className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                <span>Buka Trader AI Ultra</span>
                <span className="text-[9px] font-mono bg-amber-400/20 px-1 rounded text-amber-200">
                  Rp 53.000.000
                </span>
              </div>
              <div className="text-[9px] text-slate-400">
                Ambil alih layar, auto-pindah kategori & Win Rate 99.5%
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-[10px] transition-colors shrink-0 shadow"
          >
            Upgrade Sekarang
          </button>
        </div>
      )}

      {/* Ultra Mode Active Pill Banner */}
      {isUltra && (
        <div className="px-3 py-1.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between text-[11px] font-mono">
          <span className="text-amber-300 flex items-center gap-1 font-semibold">
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-current" />
            <span>FITUR AMBIL ALIH AKTIF (Pindah Otomatis)</span>
          </span>
          <span className="text-emerald-400 font-bold">WR: {displayWinRate}%</span>
        </div>
      )}

      {/* AI Scoreboard */}
      <div className="grid grid-cols-3 p-2.5 bg-[#080b10] border-b border-[#141a26] gap-2 text-center font-mono">
        <div className="p-1.5 bg-[#0f141e] border border-[#192233] rounded-lg">
          <span className="text-[10px] text-slate-500 block">Laba Total AI</span>
          <span className={`text-xs font-bold ${aiProfitTotal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrencyValue(aiProfitTotal, userCurrency, userCurrency)}
          </span>
        </div>
        <div className="p-1.5 bg-[#0f141e] border border-[#192233] rounded-lg">
          <span className="text-[10px] text-slate-500 block">Win Rate AI</span>
          <span className={`text-xs font-bold ${isUltra ? 'text-amber-400 font-extrabold' : 'text-emerald-400'}`}>
            {displayWinRate}%
          </span>
        </div>
        <div className="p-1.5 bg-[#0f141e] border border-[#192233] rounded-lg">
          <span className="text-[10px] text-slate-500 block">Status Agen</span>
          <span className={`text-[10px] font-semibold truncate block ${isAiActive ? 'text-emerald-400' : 'text-slate-500'}`}>
            {isThinking ? '🧠 Menganalisa...' : isAiActive ? '🟢 Live Hunt' : '⏸️ Diam'}
          </span>
        </div>
      </div>

      {/* Real-time Status ticker */}
      <div className="px-3 py-1.5 bg-[#0b1018] border-b border-[#141a26] text-[11px] text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-1.5 truncate">
          <Activity className={`w-3.5 h-3.5 shrink-0 ${isAiActive ? 'text-emerald-400 animate-pulse' : 'text-slate-600'}`} />
          <span className="truncate">{currentAiStatus}</span>
        </div>
      </div>

      {/* Live Decision Feed */}
      <div className="flex-1 p-2.5 overflow-y-auto space-y-1.5 min-h-[140px] max-h-[220px]">
        {logs.map(log => (
          <div
            key={log.id}
            className={`p-2 rounded-lg border text-[11px] space-y-0.5 transition-all ${
              log.type === 'TAKEOVER'
                ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                : log.type === 'PROFIT'
                ? 'bg-emerald-950/25 border-emerald-500/40 text-emerald-300'
                : log.type === 'ORDER_BUY'
                ? 'bg-[#101724] border-emerald-500/20 text-slate-200'
                : log.type === 'ORDER_SELL'
                ? 'bg-[#181119] border-rose-500/20 text-slate-200'
                : 'bg-[#0e131d] border-[#182132] text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between font-mono text-[10px] text-slate-500">
              <span className={`font-semibold ${log.type === 'TAKEOVER' ? 'text-amber-400' : 'text-slate-400'}`}>
                {log.assetSymbol}
              </span>
              <span>{formatTime(log.time)}</span>
            </div>
            <p className="leading-snug text-slate-200">{log.text}</p>
          </div>
        ))}
      </div>

      {/* Upgrade to Ultra Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-[#0e131f] border border-amber-500/50 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="w-12 h-12 mx-auto rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-inner">
              <Crown className="w-6 h-6 fill-current" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-100">
                Buka Paket Trader AI Ultra
              </h3>
              <p className="text-xs text-amber-400 font-mono font-semibold">
                Biaya Akses: Rp 53.000.000 (Dipotong dari Saldo Demo)
              </p>
            </div>

            <div className="bg-[#121926] p-3.5 rounded-xl border border-[#1d273a] space-y-2.5 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Mengambil Alih Layar & Pindah Kategori:</strong> AI mendeteksi kategori pasar yang lebih untung (Emas, Saham, Crypto, Forex) dan memindahkan layar Anda ke aset tersebut secara otomatis.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Win Rate 99.3% - 99.5%:</strong> Algoritma kuantum ultra-akurat yang hampir selalu memenangkan trade melawan pasar.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Taruhan Besar (Hasil Jumbo):</strong> Berani memasang ukuran lot besar (0.5 - 2.5 Lot) dan leverage tinggi 50x untuk mencetak profit puluhan juta rupiah.
                </span>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 py-2.5 bg-[#141b27] hover:bg-[#1c2637] text-slate-300 rounded-lg text-xs font-semibold transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUpgradeModal(false);
                  onUpgradeToUltra();
                }}
                className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-lg text-xs transition-all shadow-lg shadow-amber-500/20"
              >
                Bayar Rp 53.000.000 & Aktifkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
