import { Currency } from '../types/trading';

export const USD_TO_IDR_RATE = 15865;

export function formatPrice(price: number, decimals: number = 2, currency?: Currency): string {
  if (isNaN(price) || price === undefined || price === null) return '0';
  
  const formattedNum = price.toLocaleString('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  if (currency === 'IDR') {
    return `Rp ${formattedNum}`;
  } else if (currency === 'USD') {
    return `$${formattedNum}`;
  }
  return formattedNum;
}

export function formatCurrencyValue(amount: number, targetCurrency: Currency, baseCurrency: Currency = 'IDR'): string {
  let value = amount;
  if (baseCurrency === 'IDR' && targetCurrency === 'USD') {
    value = amount / USD_TO_IDR_RATE;
  } else if (baseCurrency === 'USD' && targetCurrency === 'IDR') {
    value = amount * USD_TO_IDR_RATE;
  }

  if (targetCurrency === 'IDR') {
    return `Rp ${Math.round(value).toLocaleString('id-ID')}`;
  } else {
    return `$${value.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

export function formatPercentage(val: number): string {
  const prefix = val > 0 ? '+' : '';
  return `${prefix}${val.toFixed(2)}%`;
}

export function formatVolume(volume: number, currency?: Currency): string {
  if (volume >= 1_000_000_000) {
    return `${(volume / 1_000_000_000).toFixed(2)}B`;
  }
  if (volume >= 1_000_000) {
    return `${(volume / 1_000_000).toFixed(2)}M`;
  }
  if (volume >= 1_000) {
    return `${(volume / 1_000).toFixed(1)}K`;
  }
  return volume.toLocaleString('id-ID');
}

export function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function formatDateTime(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

export function exportTradesToCSV(trades: any[], filename = 'riwayat_trading_simulasi.csv') {
  if (!trades.length) return;

  const headers = ['Waktu Buka', 'Waktu Tutup', 'Aset', 'Posisi', 'Harga Beli', 'Harga Jual', 'Jumlah', 'Leverage', 'Margin', 'Profit/Loss (PnL)', 'Status'];
  const rows = trades.map(t => [
    formatDateTime(t.openedAt),
    formatDateTime(t.closedAt),
    t.assetSymbol,
    t.type,
    t.entryPrice,
    t.exitPrice,
    t.amount,
    `${t.leverage}x`,
    t.margin,
    t.realizedPnl,
    t.reason
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
