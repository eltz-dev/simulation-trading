import React, { useState } from 'react';
import { Asset, AdminMarketLog } from '../types/trading';
import { marketEngine } from '../services/marketEngine';
import { formatPrice, formatPercentage, formatDateTime } from '../utils/format';
import { 
  ShieldCheck, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  RotateCcw, 
  Sliders, 
  FileText, 
  X, 
  Lock, 
  CheckCircle2, 
  AlertOctagon 
} from 'lucide-react';

interface AdminMarketControlProps {
  assets: Asset[];
  currentAsset: Asset;
  logs: AdminMarketLog[];
  adminEmail: string;
  isAdmin: boolean;
  onClose: () => void;
  onGrantAdmin: () => void;
}

export const AdminMarketControl: React.FC<AdminMarketControlProps> = ({
  assets,
  currentAsset,
  logs,
  adminEmail,
  isAdmin,
  onClose,
  onGrantAdmin
}) => {
  const [selectedAssetId, setSelectedAssetId] = useState<string>(currentAsset.id);
  const [customPriceStr, setCustomPriceStr] = useState<string>('');
  const [interventionNote, setInterventionNote] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'control' | 'logs'>('control');
  const [adminPin, setAdminPin] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successFeedback, setSuccessFeedback] = useState<string>('');

  const targetAsset = assets.find(a => a.id === selectedAssetId) || currentAsset;

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPin === 'admin123' || adminPin === 'tradingadmin') {
      onGrantAdmin();
      setPinError('');
    } else {
      setPinError('PIN Admin salah. Gunakan PIN: admin123');
    }
  };

  const handleQuickAction = async (action: AdminMarketLog['action'], paramValue: number) => {
    setIsSubmitting(true);
    setSuccessFeedback('');
    try {
      const note = interventionNote || `Admin aksi ${action} (${paramValue > 0 ? '+' : ''}${paramValue}%) pada ${targetAsset.symbol}`;
      await marketEngine.adminApplyMarketAction(
        adminEmail,
        targetAsset.id,
        action,
        paramValue,
        note
      );
      setSuccessFeedback(`Berhasil menerapkan ${action} pada pasar ${targetAsset.symbol}!`);
      setTimeout(() => setSuccessFeedback(''), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomPriceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(customPriceStr);
    if (isNaN(val) || val <= 0) return;

    setIsSubmitting(true);
    try {
      await marketEngine.adminApplyMarketAction(
        adminEmail,
        targetAsset.id,
        'CUSTOM_PRICE',
        val,
        interventionNote || `Admin mengubah harga langsung ke ${val}`
      );
      setCustomPriceStr('');
      setSuccessFeedback(`Harga ${targetAsset.symbol} berhasil diatur ke ${formatPrice(val, targetAsset.decimals)}!`);
      setTimeout(() => setSuccessFeedback(''), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-[#0e131d] border border-[#222c3f] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1f293d] bg-[#121824]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>Panel Kontrol Intervensi Pasar (Admin)</span>
                <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/30">
                  REAL-TIME SYNC
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Wewenang khusus menaikkan/menurunkan harga pasar yang disinkronkan langsung ke seluruh user.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-[#1a2333] rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* If user is not yet recognized as Admin */}
        {!isAdmin ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-amber-400">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-200">Aktivasi Hak Akses Admin</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Masukkan PIN Admin master untuk membuka hak intervensi pasar dan memicu lonjakan harga (pump/dump) secara real-time.
              </p>
            </div>

            <form onSubmit={handleAdminAuth} className="max-w-xs mx-auto space-y-3">
              <input
                type="password"
                placeholder="PIN Admin (default: admin123)"
                value={adminPin}
                onChange={e => setAdminPin(e.target.value)}
                className="w-full bg-[#141b27] border border-[#222d40] focus:border-amber-500 rounded px-3 py-2 text-slate-100 text-center font-mono text-sm outline-none"
                autoFocus
              />
              {pinError && <p className="text-rose-400 text-xs font-mono">{pinError}</p>}
              <button
                type="submit"
                className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-xs transition-colors shadow"
              >
                Buka Kunci Akses Admin
              </button>
              <div className="pt-2 text-[11px] text-slate-500">
                Petunjuk Cepat: Masukkan PIN <code className="text-amber-400 bg-amber-400/10 px-1 py-0.5 rounded">admin123</code> untuk menguji kontrol pasar.
              </div>
            </form>
          </div>
        ) : (
          /* Admin Authorized View */
          <>
            {/* Sub-navigation tabs */}
            <div className="flex border-b border-[#1f293d] bg-[#111722] px-4">
              <button
                onClick={() => setActiveTab('control')}
                className={`flex items-center gap-2 py-2.5 px-4 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === 'control'
                    ? 'border-amber-400 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Kendali Harga & Tren Pasar</span>
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`flex items-center gap-2 py-2.5 px-4 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === 'logs'
                    ? 'border-amber-400 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Log Transparansi Perubahan ({logs.length})</span>
              </button>
            </div>

            {/* Content area */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs">
              {successFeedback && (
                <div className="flex items-center gap-2 p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded text-emerald-400 font-mono text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successFeedback}</span>
                </div>
              )}

              {activeTab === 'control' ? (
                <>
                  {/* Select Asset */}
                  <div className="space-y-1.5">
                    <label className="text-slate-400 text-[11px] font-medium">Pilih Instrumen Aset yang Ingin Diintervensi:</label>
                    <select
                      value={selectedAssetId}
                      onChange={e => setSelectedAssetId(e.target.value)}
                      className="w-full bg-[#141b27] border border-[#222d40] text-slate-200 text-xs rounded px-3 py-2 outline-none"
                    >
                      {assets.map(a => (
                        <option key={a.id} value={a.id}>
                          [{a.categoryLabel}] {a.symbol} - {a.name} ({formatPrice(a.currentPrice, a.decimals, a.currency)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Current Selected Asset Summary */}
                  <div className="p-3 bg-[#131a26] border border-[#1f2a3d] rounded-lg flex items-center justify-between font-mono">
                    <div>
                      <div className="text-sm font-bold text-slate-100">{targetAsset.symbol}</div>
                      <div className="text-[11px] text-slate-400 font-sans">{targetAsset.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-bold text-slate-100">
                        {formatPrice(targetAsset.currentPrice, targetAsset.decimals, targetAsset.currency)}
                      </div>
                      <div className={`text-[11px] ${targetAsset.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {formatPercentage(targetAsset.change24h)}
                      </div>
                    </div>
                  </div>

                  {/* Reason / Note input */}
                  <div className="space-y-1">
                    <label className="text-slate-400 text-[11px]">Catatan / Alasan Intervensi (Dicatat transparan ke Log):</label>
                    <input
                      type="text"
                      placeholder="Contoh: Rilis data inflasi US, Spekulasi paus crypto, dll."
                      value={interventionNote}
                      onChange={e => setInterventionNote(e.target.value)}
                      className="w-full bg-[#141b27] border border-[#222d40] rounded px-3 py-1.5 text-slate-200 text-xs outline-none"
                    />
                  </div>

                  {/* Quick Pump & Dump Grid */}
                  <div className="space-y-2">
                    <span className="text-slate-400 text-[11px] font-medium">Intervensi Lonjakan Cepat:</span>
                    <div className="grid grid-cols-2 gap-3">
                      {/* Pump Side */}
                      <div className="space-y-1.5 p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-lg">
                        <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                          <TrendingUp className="w-4 h-4" />
                          <span>Naikkan Pasar (Pump)</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5 pt-1">
                          {[1, 5, 10].map(pct => (
                            <button
                              key={`pump-${pct}`}
                              disabled={isSubmitting}
                              onClick={() => handleQuickAction('PUMP', pct)}
                              className="py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-mono font-bold rounded text-xs transition-colors border border-emerald-500/30"
                            >
                              +{pct}%
                            </button>
                          ))}
                        </div>
                        <button
                          disabled={isSubmitting}
                          onClick={() => handleQuickAction('PUMP', 25)}
                          className="w-full py-1.5 bg-emerald-500 text-slate-950 font-bold rounded text-xs transition-colors shadow"
                        >
                          🚀 Super Pump (+25%)
                        </button>
                      </div>

                      {/* Dump Side */}
                      <div className="space-y-1.5 p-3 bg-rose-950/20 border border-rose-500/20 rounded-lg">
                        <div className="text-rose-400 font-bold flex items-center gap-1.5">
                          <TrendingDown className="w-4 h-4" />
                          <span>Turunkan Pasar (Dump)</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5 pt-1">
                          {[1, 5, 10].map(pct => (
                            <button
                              key={`dump-${pct}`}
                              disabled={isSubmitting}
                              onClick={() => handleQuickAction('DUMP', pct)}
                              className="py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-mono font-bold rounded text-xs transition-colors border border-rose-500/30"
                            >
                              -{pct}%
                            </button>
                          ))}
                        </div>
                        <button
                          disabled={isSubmitting}
                          onClick={() => handleQuickAction('DUMP', 25)}
                          className="w-full py-1.5 bg-rose-500 text-white font-bold rounded text-xs transition-colors shadow"
                        >
                          💥 Flash Crash (-25%)
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Custom Price Setter & Reset */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    <form onSubmit={handleCustomPriceSubmit} className="p-3 bg-[#131a26] border border-[#1f2a3d] rounded-lg space-y-2">
                      <label className="text-slate-300 text-[11px] font-medium block">
                        Setel Harga Pasar Spesifik:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          step="any"
                          placeholder={`Harga baru (${targetAsset.currency})`}
                          value={customPriceStr}
                          onChange={e => setCustomPriceStr(e.target.value)}
                          className="flex-1 bg-[#141b27] border border-[#222d40] rounded px-2.5 py-1.5 text-slate-100 font-mono text-xs outline-none"
                          required
                        />
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-xs transition-colors"
                        >
                          Terapkan
                        </button>
                      </div>
                    </form>

                    <div className="p-3 bg-[#131a26] border border-[#1f2a3d] rounded-lg space-y-2 flex flex-col justify-between">
                      <div>
                        <span className="text-slate-300 text-[11px] font-medium block">Reset Baseline:</span>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Kembalikan harga {targetAsset.symbol} ke nilai dasar pasar semula ({formatPrice(targetAsset.basePrice, targetAsset.decimals)}).
                        </p>
                      </div>
                      <button
                        onClick={() => handleQuickAction('RESET', 0)}
                        className="flex items-center justify-center gap-1.5 py-1.5 bg-[#1a2333] hover:bg-[#253249] text-slate-300 font-medium rounded text-xs transition-colors border border-slate-700/50"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset ke Harga Asli</span>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                /* Transparent Activity Logs View */
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Setiap perubahan yang dilakukan admin tercatat transparan di bawah ini:</span>
                    <span className="font-mono text-amber-400">{logs.length} Total Kejadian</span>
                  </div>

                  {logs.length === 0 ? (
                    <div className="py-8 text-center text-slate-500">
                      Belum ada intervensi pasar yang dilakukan admin. Gunakan tombol di tab sebelah untuk menguji coba.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                      {logs.map(log => (
                        <div
                          key={log.id}
                          className="p-3 bg-[#131a26] border border-[#1f2a3d] rounded-lg space-y-1.5 font-mono text-[11px]"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-200 font-sans flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${
                                log.action === 'PUMP' ? 'bg-emerald-400' : log.action === 'DUMP' ? 'bg-rose-400' : 'bg-amber-400'
                              }`} />
                              {log.assetSymbol} · {log.action}
                            </span>
                            <span className="text-slate-500">{formatDateTime(log.timestamp)}</span>
                          </div>

                          <div className="flex items-center justify-between text-slate-300">
                            <span>
                              Harga: <span className="line-through text-slate-500">{formatPrice(log.oldPrice)}</span> ➔{' '}
                              <strong className={log.newPrice >= log.oldPrice ? 'text-emerald-400' : 'text-rose-400'}>
                                {formatPrice(log.newPrice)}
                              </strong>
                            </span>
                            <span className={`font-bold ${log.percentageChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {formatPercentage(log.percentageChange)}
                            </span>
                          </div>

                          <div className="text-[10px] text-slate-400 font-sans pt-1 border-t border-[#1a2233] flex justify-between">
                            <span>Admin: <strong className="text-slate-300">{log.adminEmail}</strong></span>
                            <span className="italic text-slate-500">{log.note}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
