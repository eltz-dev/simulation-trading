import { Asset, Currency, UserAccount, AITier } from '../types/trading';
import { formatPrice, formatPercentage, formatCurrencyValue, formatVolume } from '../utils/format';
import { 
  Menu, 
  ShieldCheck, 
  Wallet, 
  LogOut, 
  TrendingUp, 
  TrendingDown, 
  Bot,
  Sparkles,
  Zap,
  Crown
} from 'lucide-react';
import { auth } from '../services/firebase';
import { signOut } from 'firebase/auth';

interface TopBarProps {
  asset: Asset;
  user: UserAccount | null;
  userBalance: number;
  userCurrency: Currency;
  onOpenSidebarMobile: () => void;
  onOpenAdminModal: () => void;
  onOpenAuthModal: () => void;
  isAdmin: boolean;
  isAiActive: boolean;
  onToggleAi: () => void;
  aiTier: AITier;
}

export const TopBar: React.FC<TopBarProps> = ({
  asset,
  user,
  userBalance,
  userCurrency,
  onOpenSidebarMobile,
  onOpenAdminModal,
  onOpenAuthModal,
  isAdmin,
  isAiActive,
  onToggleAi,
  aiTier
}) => {
  const isUp = asset.change24h >= 0;

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Logout error:', e);
    }
  };

  return (
    <header className="flex items-center justify-between px-3.5 py-2.5 bg-[#080b11] border-b border-[#151c28] gap-3 select-none">
      {/* Left Zone: Mobile Menu Toggle + Asset Ticker Lockup */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenSidebarMobile}
          className="lg:hidden p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-[#131a26] transition-colors"
          aria-label="Buka Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm md:text-base font-mono text-slate-100 tracking-tight">
                {asset.symbol}
              </span>
              <span className="hidden sm:inline-block text-[11px] px-1.5 py-0.2 bg-[#121926] text-slate-400 rounded border border-[#1b2538]">
                {asset.categoryLabel}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 truncate max-w-[130px] sm:max-w-[200px] font-sans">
              {asset.name}
            </span>
          </div>

          <div className="h-6 w-[1px] bg-[#1a2333] hidden sm:block mx-1" />

          {/* Current Live Line Price & 24h Change */}
          <div className="flex items-baseline gap-2 font-mono">
            <span className={`text-sm md:text-lg font-bold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatPrice(asset.currentPrice, asset.decimals, asset.currency)}
            </span>
            <span className={`text-[11px] md:text-xs font-semibold flex items-center ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isUp ? <TrendingUp className="w-3 h-3 mr-0.5 inline" /> : <TrendingDown className="w-3 h-3 mr-0.5 inline" />}
              {formatPercentage(asset.change24h)}
            </span>
          </div>
        </div>

        {/* 24h Stats Summary (Desktop) */}
        <div className="hidden xl:flex items-center gap-4 pl-4 font-mono text-[11px] text-slate-400 border-l border-[#151c28]">
          <div>
            <span className="text-slate-500 block text-[10px]">24h Tertinggi</span>
            <span className="text-slate-300">{formatPrice(asset.high24h, asset.decimals)}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">24h Terendah</span>
            <span className="text-slate-300">{formatPrice(asset.low24h, asset.decimals)}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">24h Volume</span>
            <span className="text-slate-300">{formatVolume(asset.volume24h, asset.currency)}</span>
          </div>
        </div>
      </div>

      {/* Right Zone: Trader AI Toggle + Demo Wallet + Admin Control + User Profile */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Trader AI Co-Pilot Button */}
        <button
          onClick={onToggleAi}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold font-mono transition-all border ${
            aiTier === 'ULTRA'
              ? (isAiActive 
                  ? 'bg-gradient-to-r from-amber-500/30 to-amber-600/30 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                  : 'bg-[#181308] border-amber-500/40 text-amber-400/80')
              : (isAiActive
                  ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                  : 'bg-[#101522] border-slate-700/60 text-slate-400 hover:text-slate-200')
          }`}
          title="Nyalakan/Matikan Bantuan Trader AI"
        >
          {aiTier === 'ULTRA' ? (
            <Crown className={`w-3.5 h-3.5 text-amber-400 ${isAiActive ? 'fill-current animate-pulse' : ''}`} />
          ) : (
            <Bot className={`w-3.5 h-3.5 ${isAiActive ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
          )}
          <span className="hidden sm:inline">
            {aiTier === 'ULTRA' ? 'AI ULTRA:' : 'Trader AI:'}
          </span>
          <span className={isAiActive ? (aiTier === 'ULTRA' ? 'text-amber-300 font-extrabold' : 'text-emerald-400 font-extrabold') : 'text-slate-500'}>
            {isAiActive ? 'ON' : 'OFF'}
          </span>
        </button>

        {/* User Demo Balance Card */}
        <div className="flex items-center gap-2 px-2.5 py-1 bg-[#0f1420] border border-[#1a2336] rounded-lg">
          <Wallet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <div className="text-right">
            <span className="block text-[9px] text-slate-400 uppercase font-medium">Saldo Demo</span>
            <span className="text-xs md:text-sm font-bold font-mono text-emerald-300">
              {formatCurrencyValue(userBalance, userCurrency, userCurrency)}
            </span>
          </div>
        </div>

        {/* Admin Market Intervention Button */}
        <button
          onClick={onOpenAdminModal}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            isAdmin
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 shadow'
              : 'bg-[#121824] hover:bg-[#1a2336] text-amber-400 border border-amber-500/20'
          }`}
          title="Buka Panel Intervensi Pasar Admin"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden md:inline">Admin Pasar</span>
        </button>

        {/* User Profile or Register/Login Button */}
        {user ? (
          <div className="flex items-center gap-1.5 pl-1 border-l border-[#151c28]">
            <div className="hidden lg:flex flex-col text-right">
              <span className="text-xs font-medium text-slate-200 truncate max-w-[110px]">
                {user.displayName || user.email.split('@')[0]}
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">Trader Aktif</span>
            </div>
            <button
              onClick={handleLogout}
              title="Keluar (Logout)"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-[#141b27] rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuthModal}
            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition-colors shadow"
          >
            Daftar / Masuk
          </button>
        )}
      </div>
    </header>
  );
};
