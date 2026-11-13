import React, { useState } from 'react';
import { Asset, OrderBookEntry, PublicTrade } from '../types/trading';
import { formatPrice, formatTime } from '../utils/format';
import { Layers, History, Activity } from 'lucide-react';

interface OrderBookProps {
  asset: Asset;
  orderBook: { bids: OrderBookEntry[]; asks: OrderBookEntry[]; spread: number };
  recentTrades: PublicTrade[];
  onSelectPrice?: (price: number) => void;
}

export const OrderBook: React.FC<OrderBookProps> = ({
  asset,
  orderBook,
  recentTrades,
  onSelectPrice
}) => {
  const [activeTab, setActiveTab] = useState<'orderbook' | 'trades'>('orderbook');

  const maxAskTotal = orderBook.asks.length ? Math.max(...orderBook.asks.map(a => a.total)) : 1;
  const maxBidTotal = orderBook.bids.length ? Math.max(...orderBook.bids.map(b => b.total)) : 1;
  const overallMax = Math.max(maxAskTotal, maxBidTotal, 1);

  // Calculate Buyer vs Seller Depth Ratio
  const totalAskVol = orderBook.asks.reduce((sum, a) => sum + a.amount, 0);
  const totalBidVol = orderBook.bids.reduce((sum, b) => sum + b.amount, 0);
  const totalVolSum = totalAskVol + totalBidVol || 1;
  const bidPercent = Math.round((totalBidVol / totalVolSum) * 100);
  const askPercent = 100 - bidPercent;

  return (
    <div className="flex flex-col h-full bg-[#080b11] border border-[#151c28] rounded-xl overflow-hidden text-xs">
      {/* Header Tabs */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#151c28] bg-[#0c1017]">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('orderbook')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
              activeTab === 'orderbook'
                ? 'bg-[#151d2c] text-emerald-300 font-semibold border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Buku Order</span>
          </button>
          <button
            onClick={() => setActiveTab('trades')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
              activeTab === 'trades'
                ? 'bg-[#151d2c] text-emerald-300 font-semibold border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Tape Pasar</span>
          </button>
        </div>

        {/* Real-time Order Ratio */}
        <div className="hidden sm:flex items-center gap-1 font-mono text-[10px]">
          <span className="text-emerald-400 font-bold">{bidPercent}% B</span>
          <div className="w-10 h-1.5 bg-[#192233] rounded-full overflow-hidden flex">
            <div className="bg-emerald-500 h-full" style={{ width: `${bidPercent}%` }} />
            <div className="bg-rose-500 h-full" style={{ width: `${askPercent}%` }} />
          </div>
          <span className="text-rose-400 font-bold">{askPercent}% S</span>
        </div>
      </div>

      {activeTab === 'orderbook' ? (
        <div className="flex flex-col flex-1 p-2 overflow-hidden justify-between">
          {/* Table Header */}
          <div className="grid grid-cols-3 text-[10px] font-mono text-slate-500 px-1 pb-1 border-b border-[#141a26]">
            <span>Harga ({asset.currency})</span>
            <span className="text-right">Ukuran</span>
            <span className="text-right">Kedalaman</span>
          </div>

          {/* Asks (Sellers - Red) */}
          <div className="flex flex-col-reverse justify-end overflow-hidden space-y-reverse space-y-0.5 py-0.5">
            {orderBook.asks.map((ask, i) => {
              const depthPercent = Math.min(100, (ask.total / overallMax) * 100);
              return (
                <div
                  key={`ask-${i}`}
                  onClick={() => onSelectPrice?.(ask.price)}
                  className="relative grid grid-cols-3 px-1 py-0.5 font-mono cursor-pointer hover:bg-[#151e2e] transition-colors group text-[11px]"
                >
                  <div
                    className="absolute right-0 top-0 bottom-0 bg-rose-500/15 group-hover:bg-rose-500/25 transition-all pointer-events-none"
                    style={{ width: `${depthPercent}%` }}
                  />
                  <span className="relative z-10 text-rose-400 font-medium">
                    {formatPrice(ask.price, asset.decimals)}
                  </span>
                  <span className="relative z-10 text-right text-slate-300">
                    {ask.amount.toFixed(3)}
                  </span>
                  <span className="relative z-10 text-right text-slate-400">
                    {ask.total.toFixed(3)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Current Spread Bar */}
          <div className="my-1 py-1 px-2.5 bg-[#0e141f] rounded-lg flex items-center justify-between font-mono border border-[#1b2538]">
            <div className="flex items-center gap-1.5">
              <span className={`text-xs sm:text-sm font-bold ${asset.currentPrice >= asset.previousPrice ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatPrice(asset.currentPrice, asset.decimals, asset.currency)}
              </span>
              <span className="text-[10px] text-slate-400">
                {asset.currentPrice >= asset.previousPrice ? '▲' : '▼'}
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              Spread: <strong className="text-slate-300">{formatPrice(orderBook.spread, asset.decimals)}</strong>
            </div>
          </div>

          {/* Bids (Buyers - Green) */}
          <div className="flex flex-col justify-start overflow-hidden space-y-0.5 py-0.5">
            {orderBook.bids.map((bid, i) => {
              const depthPercent = Math.min(100, (bid.total / overallMax) * 100);
              return (
                <div
                  key={`bid-${i}`}
                  onClick={() => onSelectPrice?.(bid.price)}
                  className="relative grid grid-cols-3 px-1 py-0.5 font-mono cursor-pointer hover:bg-[#151e2e] transition-colors group text-[11px]"
                >
                  <div
                    className="absolute right-0 top-0 bottom-0 bg-emerald-500/15 group-hover:bg-emerald-500/25 transition-all pointer-events-none"
                    style={{ width: `${depthPercent}%` }}
                  />
                  <span className="relative z-10 text-emerald-400 font-medium">
                    {formatPrice(bid.price, asset.decimals)}
                  </span>
                  <span className="relative z-10 text-right text-slate-300">
                    {bid.amount.toFixed(3)}
                  </span>
                  <span className="relative z-10 text-right text-slate-400">
                    {bid.total.toFixed(3)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Recent Public Trades Feed */
        <div className="flex flex-col flex-1 p-2 overflow-y-auto max-h-[340px]">
          <div className="grid grid-cols-3 text-[10px] font-mono text-slate-500 px-1 pb-1 border-b border-[#141a26]">
            <span>Waktu</span>
            <span className="text-right">Harga ({asset.currency})</span>
            <span className="text-right">Lot</span>
          </div>
          <div className="space-y-0.5 mt-1 font-mono text-[11px]">
            {recentTrades.map(trade => (
              <div
                key={trade.id}
                className="grid grid-cols-3 px-1 py-0.5 hover:bg-[#121926] rounded transition-colors"
              >
                <span className="text-slate-500">{formatTime(trade.time)}</span>
                <span className={`text-right font-medium ${trade.type === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatPrice(trade.price, asset.decimals)}
                </span>
                <span className="text-right text-slate-300">{trade.amount.toFixed(3)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
