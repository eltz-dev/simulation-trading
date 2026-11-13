import React, { useState } from 'react';
import { Asset, Currency } from '../types/trading';
import { formatPrice, formatCurrencyValue } from '../utils/format';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  ShieldAlert, 
  SlidersHorizontal,
  Zap,
  Info 
} from 'lucide-react';
import { soundManager } from '../utils/sound';

interface OrderFormProps {
  asset: Asset;
  userBalance: number;
  userCurrency: Currency;
  onPlaceOrder: (order: {
    type: 'BUY' | 'SELL';
    amount: number;
    leverage: number;
    limitPrice?: number;
    takeProfit?: number;
    stopLoss?: number;
  }) => void;
  selectedBookPrice?: number | null;
}

export const OrderForm: React.FC<OrderFormProps> = ({
  asset,
  userBalance,
  userCurrency,
  onPlaceOrder,
  selectedBookPrice
}) => {
  const [orderSide, setOrderSide] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [amountStr, setAmountStr] = useState<string>('0.1');
  const [leverage, setLeverage] = useState<number>(10);
  const [limitPriceStr, setLimitPriceStr] = useState<string>('');
  const [useTP, setUseTP] = useState<boolean>(false);
  const [tpPriceStr, setTpPriceStr] = useState<string>('');
  const [useSL, setUseSL] = useState<boolean>(false);
  const [slPriceStr, setSlPriceStr] = useState<string>('');

  React.useEffect(() => {
    if (selectedBookPrice) {
      setLimitPriceStr(selectedBookPrice.toString());
      setOrderType('LIMIT');
    }
  }, [selectedBookPrice]);

  const amount = parseFloat(amountStr) || 0;
  const executionPrice = orderType === 'LIMIT' && parseFloat(limitPriceStr) > 0
    ? parseFloat(limitPriceStr)
    : asset.currentPrice;

  const contractValue = amount * executionPrice;
  const marginRequired = leverage > 0 ? contractValue / leverage : contractValue;

  const marginInUserCurrency = asset.currency === userCurrency
    ? marginRequired
    : (asset.currency === 'USD' && userCurrency === 'IDR'
        ? marginRequired * 15865
        : marginRequired / 15865);

  const hasSufficientBalance = userBalance >= marginInUserCurrency;

  const liquidationPrice = orderSide === 'BUY'
    ? Math.max(0, executionPrice * (1 - (0.9 / leverage)))
    : executionPrice * (1 + (0.9 / leverage));

  const handlePercentBalance = (percent: number) => {
    const budgetInAssetCurrency = (userBalance * (percent / 100)) * (userCurrency === asset.currency ? 1 : (userCurrency === 'IDR' ? 1 / 15865 : 15865));
    const maxContract = budgetInAssetCurrency * leverage;
    const calcAmount = maxContract / executionPrice;
    setAmountStr(calcAmount.toFixed(asset.decimals === 0 ? 0 : 3));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || !hasSufficientBalance) return;

    if (orderSide === 'BUY') soundManager.playBuy();
    else soundManager.playSell();

    onPlaceOrder({
      type: orderSide,
      amount,
      leverage,
      limitPrice: orderType === 'LIMIT' ? parseFloat(limitPriceStr) : undefined,
      takeProfit: useTP && parseFloat(tpPriceStr) > 0 ? parseFloat(tpPriceStr) : undefined,
      stopLoss: useSL && parseFloat(slPriceStr) > 0 ? parseFloat(slPriceStr) : undefined
    });
  };

  const leveragePresets = [1, 2, 5, 10, 20, 50, 100];

  return (
    <div className="flex flex-col h-full bg-[#080b11] border border-[#151c28] rounded-xl overflow-hidden text-xs">
      {/* Side Tabs (BUY / SELL) */}
      <div className="grid grid-cols-2 p-1.5 bg-[#0c1017] border-b border-[#151c28] gap-1.5">
        <button
          type="button"
          onClick={() => setOrderSide('BUY')}
          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-bold text-xs uppercase transition-all ${
            orderSide === 'BUY'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#121824]'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>Beli (Long)</span>
        </button>
        <button
          type="button"
          onClick={() => setOrderSide('SELL')}
          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-bold text-xs uppercase transition-all ${
            orderSide === 'SELL'
              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#121824]'
          }`}
        >
          <ArrowDownRight className="w-4 h-4" />
          <span>Jual (Short)</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 p-3 space-y-3 overflow-y-auto">
        {/* Order Type */}
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-[11px]">Tipe Eksekusi:</span>
          <div className="flex bg-[#101522] p-0.5 rounded-lg border border-[#1a2336]">
            <button
              type="button"
              onClick={() => setOrderType('MARKET')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                orderType === 'MARKET' ? 'bg-[#1a2338] text-slate-100 font-semibold' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Pasar (Instant)
            </button>
            <button
              type="button"
              onClick={() => setOrderType('LIMIT')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                orderType === 'LIMIT' ? 'bg-[#1a2338] text-slate-100 font-semibold' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Limit
            </button>
          </div>
        </div>

        {orderType === 'LIMIT' && (
          <div className="space-y-1">
            <label className="text-[11px] text-slate-400">Harga Sasaran ({asset.currency})</label>
            <input
              type="number"
              step="any"
              value={limitPriceStr}
              onChange={e => setLimitPriceStr(e.target.value)}
              placeholder={`Contoh: ${asset.currentPrice}`}
              className="w-full bg-[#101522] border border-[#1a2336] focus:border-emerald-500 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono text-xs outline-none"
              required
            />
          </div>
        )}

        {/* Leverage Multiplier */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3 text-slate-500" />
              <span>Daya Ungkit (Leverage):</span>
            </span>
            <span className="font-mono font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
              {leverage}x
            </span>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {leveragePresets.map(preset => (
              <button
                key={preset}
                type="button"
                onClick={() => setLeverage(preset)}
                className={`py-1 text-[10px] font-mono rounded transition-colors ${
                  leverage === preset
                    ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50 font-bold'
                    : 'bg-[#101522] text-slate-400 hover:bg-[#182030]'
                }`}
              >
                {preset}x
              </button>
            ))}
          </div>
        </div>

        {/* Amount Input */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Ukuran Lot:</span>
            <span className="text-slate-500 font-mono">Unit: {asset.symbol.split('/')[0]}</span>
          </div>
          <div className="relative">
            <input
              type="number"
              step="any"
              min="0.001"
              value={amountStr}
              onChange={e => setAmountStr(e.target.value)}
              className="w-full bg-[#101522] border border-[#1a2336] focus:border-emerald-500 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono text-xs outline-none pr-12"
              placeholder="0.00"
              required
            />
            <span className="absolute right-2.5 top-2 text-slate-500 font-mono text-[11px]">
              LOT
            </span>
          </div>
        </div>

        {/* Allocation Preset Chips */}
        <div className="grid grid-cols-4 gap-1">
          {[25, 50, 75, 100].map(pct => (
            <button
              key={pct}
              type="button"
              onClick={() => handlePercentBalance(pct)}
              className="py-1 bg-[#101522] hover:bg-[#172032] text-slate-400 hover:text-slate-200 font-mono text-[10px] rounded transition-colors border border-[#1a2336]"
            >
              {pct}%
            </button>
          ))}
        </div>

        {/* TP / SL Checkboxes */}
        <div className="pt-2 border-t border-[#141a26] space-y-2">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-400 hover:text-slate-200">
              <input
                type="checkbox"
                checked={useTP}
                onChange={e => {
                  setUseTP(e.target.checked);
                  if (e.target.checked && !tpPriceStr) {
                    const defaultTP = orderSide === 'BUY' ? asset.currentPrice * 1.05 : asset.currentPrice * 0.95;
                    setTpPriceStr(defaultTP.toFixed(asset.decimals));
                  }
                }}
                className="rounded bg-[#101522] border-slate-700 text-emerald-500 focus:ring-0"
              />
              <span>Take Profit (TP)</span>
            </label>
            {useTP && (
              <input
                type="number"
                step="any"
                value={tpPriceStr}
                onChange={e => setTpPriceStr(e.target.value)}
                placeholder="Target TP"
                className="w-28 bg-[#101522] border border-[#1a2336] rounded px-2 py-0.5 font-mono text-emerald-400 text-right text-xs"
              />
            )}
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-400 hover:text-slate-200">
              <input
                type="checkbox"
                checked={useSL}
                onChange={e => {
                  setUseSL(e.target.checked);
                  if (e.target.checked && !slPriceStr) {
                    const defaultSL = orderSide === 'BUY' ? asset.currentPrice * 0.95 : asset.currentPrice * 1.05;
                    setSlPriceStr(defaultSL.toFixed(asset.decimals));
                  }
                }}
                className="rounded bg-[#101522] border-slate-700 text-rose-500 focus:ring-0"
              />
              <span>Stop Loss (SL)</span>
            </label>
            {useSL && (
              <input
                type="number"
                step="any"
                value={slPriceStr}
                onChange={e => setSlPriceStr(e.target.value)}
                placeholder="Batas SL"
                className="w-28 bg-[#101522] border border-[#1a2336] rounded px-2 py-0.5 font-mono text-rose-400 text-right text-xs"
              />
            )}
          </div>
        </div>

        {/* Financial Contract Calculations */}
        <div className="bg-[#0c1017] p-2.5 rounded-lg border border-[#141a26] space-y-1.5 font-mono text-[11px]">
          <div className="flex justify-between text-slate-400">
            <span>Nilai Kontrak:</span>
            <span className="text-slate-200">{formatPrice(contractValue, asset.decimals, asset.currency)}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Margin Jaminan:</span>
            <span className={hasSufficientBalance ? 'text-slate-200 font-semibold' : 'text-rose-400 font-bold'}>
              {formatCurrencyValue(marginInUserCurrency, userCurrency, userCurrency)}
            </span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Estimasi Likuidasi:</span>
            <span className="text-amber-400 font-semibold">
              {formatPrice(liquidationPrice, asset.decimals, asset.currency)}
            </span>
          </div>
          <div className="flex justify-between text-slate-400 pt-1 border-t border-[#161c28]">
            <span>Saldo Tersedia:</span>
            <span className="text-emerald-400">{formatCurrencyValue(userBalance, userCurrency, userCurrency)}</span>
          </div>
        </div>

        {!hasSufficientBalance && (
          <div className="flex items-center gap-1.5 p-2 bg-rose-500/10 border border-rose-500/30 rounded text-rose-400 text-[11px]">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>Saldo tidak mencukupi untuk membuka pesanan ini. Kurangi lot atau naikkan leverage.</span>
          </div>
        )}

        <button
          type="submit"
          disabled={!hasSufficientBalance || amount <= 0}
          className={`w-full py-2.5 px-4 rounded-lg font-bold text-xs uppercase tracking-wide transition-all shadow-md ${
            orderSide === 'BUY'
              ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 disabled:bg-emerald-900/40 disabled:text-slate-600'
              : 'bg-rose-500 hover:bg-rose-400 text-white disabled:bg-rose-900/40 disabled:text-slate-600'
          }`}
        >
          {orderSide === 'BUY' ? 'Buka Posisi Long' : 'Buka Posisi Short'} {asset.symbol}
        </button>
      </form>
    </div>
  );
};
