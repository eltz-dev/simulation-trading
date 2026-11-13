export type AssetCategory = 'emas' | 'saham' | 'crypto' | 'forex';

export type Currency = 'IDR' | 'USD';

export type AITier = 'FREE' | 'ULTRA';

export interface Asset {
  id: string;
  name: string;
  symbol: string;
  category: AssetCategory;
  categoryLabel: string;
  basePrice: number;
  currentPrice: number;
  previousPrice: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  decimals: number;
  currency: Currency;
  spread: number;
  volatility: number; // percentage variance per tick (e.g. 0.001)
  description: string;
  trendBias: 'BULLISH' | 'BEARISH' | 'SIDEWAYS';
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
}

export interface PublicTrade {
  id: string;
  price: number;
  amount: number;
  type: 'BUY' | 'SELL';
  time: number;
}

export interface Position {
  id: string;
  userId: string;
  assetId: string;
  assetSymbol: string;
  assetName: string;
  type: 'BUY' | 'SELL'; // BUY = Long, SELL = Short
  entryPrice: number;
  currentPrice: number;
  amount: number; // units or lots
  leverage: number;
  margin: number; // initial margin collateral
  unrealizedPnl: number;
  roe: number; // Return on Equity %
  liquidationPrice: number;
  takeProfit?: number | null;
  stopLoss?: number | null;
  openedAt: number;
}

export interface TradeHistory {
  id: string;
  userId: string;
  assetId: string;
  assetSymbol: string;
  assetName: string;
  type: 'BUY' | 'SELL';
  entryPrice: number;
  exitPrice: number;
  amount: number;
  leverage: number;
  margin: number;
  realizedPnl: number;
  realizedPnlPercentage: number;
  reason: 'CLOSED_MANUAL' | 'TAKE_PROFIT' | 'STOP_LOSS' | 'LIQUIDATED';
  openedAt: number;
  closedAt: number;
}

export interface AdminMarketLog {
  id: string;
  timestamp: number;
  adminEmail: string;
  assetId: string;
  assetSymbol: string;
  action: 'PUMP' | 'DUMP' | 'CUSTOM_PRICE' | 'TREND_CHANGE' | 'VOLATILITY_CHANGE' | 'RESET';
  oldPrice: number;
  newPrice: number;
  percentageChange: number;
  note: string;
}

export interface UserAccount {
  uid: string;
  email: string;
  displayName: string;
  balance: number; // default IDR or converted
  currency: Currency;
  isAdmin: boolean;
  createdAt: number;
}
