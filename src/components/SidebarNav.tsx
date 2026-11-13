import React, { useState } from 'react';
import { Asset, AssetCategory, Currency, AITier } from '../types/trading';
import { formatPrice, formatPercentage } from '../utils/format';
import { 
  Sparkles, 
  CircleDollarSign, 
  Coins, 
  CandlestickChart, 
  Search, 
  TrendingUp, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  X, 
  Bot,
  Activity,
  Layers
} from 'lucide-react';

interface SidebarNavProps {
  assets: Asset[];
  selectedCategory: AssetCategory;
  selectedAsset: Asset;
  onSelectCategory: (cat: AssetCategory) => void;
  onSelectAsset: (asset: Asset) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isSoundEnabled: boolean;
  onToggleSound: () => void;
  userCurrency: Currency;
  onToggleCurrency: () => void;
  onResetBalance: () => void;
  isAiActive: boolean;
  onToggleAi: () => void;
  aiTier: AITier;
  onOpenUpgradeModal: () => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  assets,
  selectedCategory,
  selectedAsset,
  onSelectCategory,
  onSelectAsset,
  isOpenMobile,
  onCloseMobile,
  isSoundEnabled,
  onToggleSound,
  userCurrency,
  onToggleCurrency,
  onResetBalance,
  isAiActive,
  onToggleAi,
  aiTier,
  onOpenUpgradeModal
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const categories: { id: AssetCategory; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'emas', label: 'Trading Emas', icon: Sparkles },
    { id: 'saham', label: 'Trading Saham', icon: CandlestickChart },
    { id: 'crypto', label: 'Trading Crypto', icon: Coins },
    { id: 'forex', label: 'Trading Forex', icon: CircleDollarSign },
  ];

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          asset.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    if (searchQuery.trim()) {
      return matchesSearch;
    }
    return asset.category === selectedCategory;
  });

  return (
    <>
      {isOpenMobile && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-72 bg-[#080b11] border-r border-[#151c28] flex flex-col transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between p-3.5 border-b border-[#151c28] bg-[#0c1017]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xs font-bold text-slate-100 tracking-tight leading-tight">
                Trading Simulation
              </h1>
              <span className="text-[10px] text-emerald-400 font-mono tracking-wide">
                Professional Terminal
              </span>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1 text-slate-400 hover:text-slate-100 lg:hidden rounded hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Trader AI Mini Banner */}
        <div className={`p-2.5 mx-2.5 mt-2.5 rounded-xl border flex flex-col gap-2 ${
          aiTier === 'ULTRA'
            ? 'bg-gradient-to-br from-amber-950/40 via-[#0e1422] to-[#0c1018] border-amber-500/40 shadow-sm'
            : 'bg-[#0e1420] border-[#1b263b]'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <Bot className={`w-4 h-4 shrink-0 ${aiTier === 'ULTRA' ? 'text-amber-400' : (isAiActive ? 'text-emerald-400 animate-pulse' : 'text-slate-500')}`} />
              <div className="truncate">
                <div className="text-[11px] font-bold text-slate-200 flex items-center gap-1">
                  <span>{aiTier === 'ULTRA' ? 'Trader AI Ultra' : 'Trader AI'}</span>
                  {aiTier === 'ULTRA' && (
                    <span className="text-[9px] bg-amber-400/20 text-amber-300 font-mono px-1 rounded">99.5%</span>
                  )}
                </div>
                <div className="text-[9px] text-slate-400 font-mono">
                  {aiTier === 'ULTRA' 
                    ? (isAiActive ? '⚡ Ambil Alih Aktif' : '⚪ Standby')
                    : (isAiActive ? '🟢 Paket Free Aktif' : '⚪ Standby')}
                </div>
              </div>
            </div>
            <button
              onClick={onToggleAi}
              className={`px-2 py-1 rounded text-[10px] font-bold font-mono transition-colors ${
                isAiActive
                  ? (aiTier === 'ULTRA' ? 'bg-amber-400 text-slate-950 hover:bg-amber-300' : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400')
                  : 'bg-[#182133] text-slate-300 hover:bg-[#202c42]'
              }`}
            >
              {isAiActive ? 'MATIKAN' : 'AKTIFKAN'}
            </button>
          </div>

          {aiTier === 'FREE' && (
            <button
              onClick={onOpenUpgradeModal}
              className="w-full py-1 px-2 bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 text-amber-300 border border-amber-500/30 rounded text-[10px] font-semibold text-center transition-colors"
            >
              ⭐ Upgrade Ultra (53 Jt) · 99.5% Win Rate
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="p-2.5 border-b border-[#141a26]">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Cari simbol aset..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#101520] border border-[#192233] focus:border-emerald-500 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 outline-none placeholder:text-slate-500 font-mono"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-500 hover:text-slate-300 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* 4 Category Tabs */}
        {!searchQuery && (
          <div className="p-2 border-b border-[#141a26]">
            <span className="px-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Kategori Pasar
            </span>
            <div className="grid grid-cols-2 gap-1">
              {categories.map(cat => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => onSelectCategory(cat.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                      isSelected
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-[#101622]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{cat.label.replace('Trading ', '')}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Asset List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="flex items-center justify-between px-2 py-1 text-[10px] font-mono text-slate-500">
            <span>Instrumen</span>
            <span>Harga Garis / 24h</span>
          </div>

          {filteredAssets.map(asset => {
            const isSelected = selectedAsset.id === asset.id;
            const isUp = asset.change24h >= 0;

            return (
              <button
                key={asset.id}
                onClick={() => {
                  onSelectAsset(asset);
                  if (isOpenMobile) onCloseMobile();
                }}
                className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-all group ${
                  isSelected
                    ? 'bg-[#131b29] border border-emerald-500/40 text-slate-100 shadow-sm'
                    : 'text-slate-300 hover:bg-[#0e131d] hover:text-white border border-transparent'
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold font-mono text-xs text-slate-200">
                      {asset.symbol}
                    </span>
                    {searchQuery && (
                      <span className="text-[9px] px-1 bg-slate-800 text-slate-400 rounded">
                        {asset.category}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 line-clamp-1 font-sans">
                    {asset.name}
                  </span>
                </div>

                <div className="text-right font-mono">
                  <div className="text-xs font-semibold text-slate-200">
                    {formatPrice(asset.currentPrice, asset.decimals, asset.currency)}
                  </div>
                  <div className={`text-[10px] font-medium ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatPercentage(asset.change24h)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer Controls */}
        <div className="p-3 border-t border-[#151c28] bg-[#0c1017] space-y-2 text-xs">
          <div className="flex items-center justify-between text-xs">
            <button
              onClick={onToggleSound}
              className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 text-xs py-1"
            >
              {isSoundEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Suara On</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                  <span>Mute</span>
                </>
              )}
            </button>

            <button
              onClick={onToggleCurrency}
              className="px-2 py-0.5 bg-[#141b27] hover:bg-[#1c2637] text-slate-300 font-mono text-[11px] rounded border border-slate-700/50"
            >
              Kurs: <strong>{userCurrency}</strong>
            </button>
          </div>

          <button
            onClick={onResetBalance}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-[#101522] hover:bg-[#182030] text-slate-300 hover:text-white rounded-lg border border-[#1d273a] text-[11px] transition-colors"
          >
            <RotateCcw className="w-3 h-3 text-slate-400" />
            <span>Reset Saldo Demo (100 Jt)</span>
          </button>
        </div>
      </aside>
    </>
  );
};
