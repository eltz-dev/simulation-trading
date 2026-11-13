import React, { useState } from 'react';
import { Position, TradeHistory, Currency } from '../types/trading';
import { formatPrice, formatCurrencyValue, formatPercentage, formatTime, formatDateTime, exportTradesToCSV } from '../utils/format';
import { 
  Briefcase, 
  History, 
  Award, 
  Download, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  XCircle, 
  BookOpen, 
  ShieldCheck 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundManager } from '../utils/sound';

interface PositionsManagerProps {
  positions: Position[];
  history: TradeHistory[];
  userCurrency: Currency;
  onClosePosition: (positionId: string) => void;
  onCloseAllPositions: () => void;
}

export const PositionsManager: React.FC<PositionsManagerProps> = ({
  positions,
  history,
  userCurrency,
  onClosePosition,
  onCloseAllPositions
}) => {
  const [activeTab, setActiveTab] = useState<'positions' | 'history' | 'training'>('positions');

  // Win rate and stats calculation
  const totalTrades = history.length;
  const winningTrades = history.filter(h => h.realizedPnl > 0).length;
  const losingTrades = history.filter(h => h.realizedPnl < 0).length;
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  const totalRealizedPnl = history.reduce((sum, h) => sum + h.realizedPnl, 0);

  const handleClose = (pos: Position) => {
    if (pos.unrealizedPnl > 0) {
      soundManager.playWin();
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 }
      });
    } else {
      soundManager.playLoss();
    }
    onClosePosition(pos.id);
  };

  return (
    <div className="flex flex-col h-full bg-[#0b0e14] border border-[#1a2233] rounded-lg overflow-hidden text-xs">
      {/* Header Tabs */}
      <div className="flex flex-wrap items-center justify-between px-3 py-2 border-b border-[#1a2233] bg-[#0e121a] gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('positions')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-medium transition-colors ${
              activeTab === 'positions'
                ? 'bg-emerald-500/10 text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Posisi Terbuka</span>
            {positions.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-emerald-500/20 text-emerald-300 rounded font-mono font-bold">
                {positions.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-medium transition-colors ${
              activeTab === 'history'
                ? 'bg-emerald-500/10 text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Riwayat Simulasi Transaksi</span>
            {history.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-slate-800 text-slate-300 rounded font-mono">
                {history.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('training')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-medium transition-colors ${
              activeTab === 'training'
                ? 'bg-emerald-500/10 text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Modul Latihan & Manajemen Risiko</span>
          </button>
        </div>

        {/* Action button in header */}
        {activeTab === 'positions' && positions.length > 0 && (
          <button
            onClick={onCloseAllPositions}
            className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded text-[11px] font-medium transition-colors"
          >
            Tutup Semua Posisi ({positions.length})
          </button>
        )}

        {activeTab === 'history' && history.length > 0 && (
          <button
            onClick={() => exportTradesToCSV(history)}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1a2333] hover:bg-[#232f44] text-slate-200 rounded text-[11px] font-medium transition-colors border border-slate-700/50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh Laporan (CSV)</span>
          </button>
        )}
      </div>

      {/* Content Body */}
      <div className="flex-1 p-3 overflow-x-auto overflow-y-auto min-h-[160px]">
        {activeTab === 'positions' && (
          positions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-10 text-center text-slate-500">
              <Briefcase className="w-8 h-8 stroke-[1.5] mb-2 text-slate-600" />
              <p className="font-medium text-slate-400">Belum ada posisi trading yang terbuka</p>
              <p className="text-[11px] max-w-sm mt-1">
                Pilih aset di tab atau sidebar, atur ukuran lot dan leverage, lalu klik &quot;Beli / Long&quot; atau &quot;Jual / Short&quot; untuk memulai simulasi.
              </p>
            </div>
          ) : (
            <div className="min-w-[700px]">
              <table className="w-full text-left font-mono">
                <thead>
                  <tr className="text-[11px] text-slate-500 border-b border-[#161d2b] pb-2">
                    <th className="pb-2 font-normal">Aset</th>
                    <th className="pb-2 font-normal">Tipe</th>
                    <th className="pb-2 font-normal text-right">Ukuran (Lot)</th>
                    <th className="pb-2 font-normal text-right">Harga Masuk</th>
                    <th className="pb-2 font-normal text-right">Harga Pasar</th>
                    <th className="pb-2 font-normal text-right">Margin</th>
                    <th className="pb-2 font-normal text-right">Harga Likuidasi</th>
                    <th className="pb-2 font-normal text-right">PnL (Rp/$) & ROE</th>
                    <th className="pb-2 font-normal text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#151c28]">
                  {positions.map(pos => {
                    const isProfit = pos.unrealizedPnl >= 0;
                    return (
                      <tr key={pos.id} className="hover:bg-[#131a26] transition-colors">
                        <td className="py-2.5 font-bold text-slate-200">
                          <div className="flex items-center gap-1.5">
                            <span>{pos.assetSymbol}</span>
                            {pos.assetName.includes('AI ULTRA') && (
                              <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1 py-0.2 rounded font-sans font-bold">
                                ULTRA ⚡
                              </span>
                            )}
                          </div>
                          <span className="block text-[10px] font-normal text-slate-500 font-sans">
                            {pos.assetName}
                          </span>
                        </td>
                        <td className="py-2.5">
                          <span className={`inline-flex items-center gap-1 font-bold px-1.5 py-0.5 rounded text-[10px] ${
                            pos.type === 'BUY'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {pos.type === 'BUY' ? 'LONG' : 'SHORT'} {pos.leverage}x
                          </span>
                        </td>
                        <td className="py-2.5 text-right text-slate-200">{pos.amount}</td>
                        <td className="py-2.5 text-right text-slate-300">{formatPrice(pos.entryPrice)}</td>
                        <td className="py-2.5 text-right font-semibold text-slate-100">{formatPrice(pos.currentPrice)}</td>
                        <td className="py-2.5 text-right text-slate-400">
                          {formatCurrencyValue(pos.margin, userCurrency, userCurrency)}
                        </td>
                        <td className="py-2.5 text-right text-amber-400 font-medium">
                          {formatPrice(pos.liquidationPrice)}
                        </td>
                        <td className="py-2.5 text-right">
                          <div className={`font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {formatCurrencyValue(pos.unrealizedPnl, userCurrency, userCurrency)}
                          </div>
                          <div className={`text-[10px] ${isProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {formatPercentage(pos.roe)} (ROE)
                          </div>
                        </td>
                        <td className="py-2.5 text-center">
                          <button
                            onClick={() => handleClose(pos)}
                            className="px-2.5 py-1 bg-[#1a2333] hover:bg-rose-500 hover:text-white text-slate-300 rounded text-[11px] font-sans font-medium transition-all border border-slate-700/50"
                          >
                            Tutup Posisi
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}

        {activeTab === 'history' && (
          history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-10 text-center text-slate-500">
              <History className="w-8 h-8 stroke-[1.5] mb-2 text-slate-600" />
              <p className="font-medium text-slate-400">Belum ada riwayat transaksi yang selesai</p>
              <p className="text-[11px] max-w-sm mt-1">
                Semua hasil transaksi profit maupun loss akan tersimpan di sini secara transparan untuk evaluasi strategi trading Anda.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Performance Metrics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 bg-[#121824] border border-[#1d273a] rounded">
                  <span className="text-slate-400 text-[11px]">Total Transaksi</span>
                  <div className="text-base font-bold font-mono text-slate-200 mt-0.5">{totalTrades}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {winningTrades} Menang · {losingTrades} Kalah
                  </div>
                </div>

                <div className="p-2.5 bg-[#121824] border border-[#1d273a] rounded">
                  <span className="text-slate-400 text-[11px]">Tingkat Kemenangan (Win Rate)</span>
                  <div className={`text-base font-bold font-mono mt-0.5 ${winRate >= 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {winRate.toFixed(1)}%
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Rasio evaluasi strategi</div>
                </div>

                <div className="p-2.5 bg-[#121824] border border-[#1d273a] rounded">
                  <span className="text-slate-400 text-[11px]">Total Profit / Loss Bersih</span>
                  <div className={`text-base font-bold font-mono mt-0.5 ${totalRealizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatCurrencyValue(totalRealizedPnl, userCurrency, userCurrency)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Akumulasi seluruh transaksi</div>
                </div>

                <div className="p-2.5 bg-[#121824] border border-[#1d273a] rounded">
                  <span className="text-slate-400 text-[11px]">Status Evaluasi Latihan</span>
                  <div className="text-sm font-semibold text-sky-400 mt-1">
                    {winRate >= 60 ? '⭐ Mahir / Siap Live' : winRate >= 45 ? '📈 Berkembang Baik' : '🎯 Butuh Disiplin SL'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Berdasarkan rasio kemenangan</div>
                </div>
              </div>

              {/* Transactions Ledger Table */}
              <div className="min-w-[700px]">
                <table className="w-full text-left font-mono">
                  <thead>
                    <tr className="text-[11px] text-slate-500 border-b border-[#161d2b] pb-2">
                      <th className="pb-2 font-normal">Waktu Tutup</th>
                      <th className="pb-2 font-normal">Aset</th>
                      <th className="pb-2 font-normal">Posisi</th>
                      <th className="pb-2 font-normal text-right">Harga Masuk</th>
                      <th className="pb-2 font-normal text-right">Harga Keluar</th>
                      <th className="pb-2 font-normal text-right">Margin Digunakan</th>
                      <th className="pb-2 font-normal text-right">Hasil Realized PnL</th>
                      <th className="pb-2 font-normal text-center">Status Selesai</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#151c28]">
                    {history.map(item => {
                      const isProfit = item.realizedPnl >= 0;
                      return (
                        <tr key={item.id} className="hover:bg-[#131a26] transition-colors">
                          <td className="py-2 text-[11px] text-slate-400">{formatDateTime(item.closedAt)}</td>
                          <td className="py-2 font-bold text-slate-200">{item.assetSymbol}</td>
                          <td className="py-2">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              item.type === 'BUY'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-rose-500/10 text-rose-400'
                            }`}>
                              {item.type} {item.leverage}x
                            </span>
                          </td>
                          <td className="py-2 text-right text-slate-400">{formatPrice(item.entryPrice)}</td>
                          <td className="py-2 text-right text-slate-200">{formatPrice(item.exitPrice)}</td>
                          <td className="py-2 text-right text-slate-400">
                            {formatCurrencyValue(item.margin, userCurrency, userCurrency)}
                          </td>
                          <td className="py-2 text-right">
                            <span className={`font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {formatCurrencyValue(item.realizedPnl, userCurrency, userCurrency)}
                            </span>
                            <span className={`block text-[10px] ${isProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {formatPercentage(item.realizedPnlPercentage)}
                            </span>
                          </td>
                          <td className="py-2 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-sans ${
                              item.reason === 'TAKE_PROFIT'
                                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                                : item.reason === 'STOP_LOSS'
                                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                                : item.reason === 'LIQUIDATED'
                                ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20 font-bold'
                                : 'bg-slate-800 text-slate-300'
                            }`}>
                              {item.reason === 'TAKE_PROFIT' ? 'Take Profit' : item.reason === 'STOP_LOSS' ? 'Stop Loss' : item.reason === 'LIQUIDATED' ? 'Terlikuidasi' : 'Manual'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}

        {activeTab === 'training' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-slate-300">
            <div className="p-3 bg-[#121824] border border-[#1d273a] rounded space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-semibold">
                <AlertTriangle className="w-4 h-4" />
                <span>Bahaya Margin Call & Likuidasi</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Dalam trading dengan leverage (daya ungkit 10x - 100x), kerugian dihitung dari total nilai kontrak, bukan cuma modal Anda. Jika harga pasar menyentuh Harga Likuidasi, posisi Anda otomatis ditutup paksa dan modal margin hangus. Selalu pasang Stop Loss!
              </p>
            </div>

            <div className="p-3 bg-[#121824] border border-[#1d273a] rounded space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>Aturan Risiko 1% - 2% (Rule of Thumb)</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Trader profesional tidak pernah mempertaruhkan lebih dari 1% hingga 2% total saldo mereka dalam satu kali transaksi. Dengan simulasi Rp 100,000,000 ini, batasi risiko kerugian maksimal per order di kisaran Rp 1,000,000 - Rp 2,000,000.
              </p>
            </div>

            <div className="p-3 bg-[#121824] border border-[#1d273a] rounded space-y-2">
              <div className="flex items-center gap-2 text-sky-400 font-semibold">
                <TrendingUp className="w-4 h-4" />
                <span>Mengendalikan FOMO & Emosi Pasar</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Hindari mengejar lilin hijau (Candle Bullish) yang sudah melonjak tinggi tanpa konfirmasi level support. Gunakan akun simulasi latihan ini untuk menguji konsistensi strategi sebelum terjun dengan modal riil.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
