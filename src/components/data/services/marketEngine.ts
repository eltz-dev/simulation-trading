import { Asset, Candle, OrderBookEntry, PublicTrade, AdminMarketLog } from '../types/trading';
import { INITIAL_ASSETS } from '../data/initialAssets';
import { rtdb } from './firebase';
import { ref, set, onValue, push } from 'firebase/database';

class MarketEngine {
  private assets: Map<string, Asset> = new Map();
  private assetCandles: Map<string, Candle[]> = new Map();
  private assetTrades: Map<string, PublicTrade[]> = new Map();
  private adminLogs: AdminMarketLog[] = [];
  private listeners: Set<(assets: Asset[]) => void> = new Set();
  private candleListeners: Set<(assetId: string, candles: Candle[]) => void> = new Set();
  private logListeners: Set<(logs: AdminMarketLog[]) => void> = new Set();
  private isRunning: boolean = false;
  private intervalId: any = null;
  private isFirebaseConnected: boolean = false;

  constructor() {
    this.initAssets();
    this.initFirebaseListeners();
  }

  private initAssets() {
    INITIAL_ASSETS.forEach(asset => {
      this.assets.set(asset.id, { ...asset });
      this.assetCandles.set(asset.id, this.generateInitialCandles(asset.basePrice, asset.volatility, asset.decimals));
      this.assetTrades.set(asset.id, this.generateInitialTrades(asset.basePrice, asset.decimals));
    });
  }

  private generateInitialCandles(basePrice: number, volatility: number, decimals: number): Candle[] {
    const candles: Candle[] = [];
    const count = 75;
    const now = Date.now();
    const interval = 60 * 1000; // 1 min candles
    let current = basePrice * 0.98;

    for (let i = count; i >= 0; i--) {
      const time = now - i * interval;
      const change = (Math.random() - 0.49) * volatility * 8 * current;
      const open = Number(current.toFixed(decimals));
      const close = Number((current + change).toFixed(decimals));
      const high = Number((Math.max(open, close) + Math.random() * volatility * 4 * current).toFixed(decimals));
      const low = Number((Math.min(open, close) - Math.random() * volatility * 4 * current).toFixed(decimals));
      const volume = Math.floor(Math.random() * 50000 + 10000);

      candles.push({ time, open, high, low, close, volume });
      current = close;
    }
    return candles;
  }

  private generateInitialTrades(price: number, decimals: number): PublicTrade[] {
    const trades: PublicTrade[] = [];
    const count = 15;
    const now = Date.now();
    for (let i = count; i >= 0; i--) {
      const type: 'BUY' | 'SELL' = Math.random() > 0.5 ? 'BUY' : 'SELL';
      const offset = (Math.random() - 0.5) * 0.002 * price;
      const tradePrice = Number((price + offset).toFixed(decimals));
      trades.push({
        id: `trade-${now - i * 1500}-${Math.random()}`,
        price: tradePrice,
        amount: Number((Math.random() * 2 + 0.1).toFixed(3)),
        type,
        time: now - i * 1500
      });
    }
    return trades;
  }

  private initFirebaseListeners() {
    try {
      // Listen to real-time market prices from Firebase RTDB
      const pricesRef = ref(rtdb, 'market_prices');
      onValue(pricesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          this.isFirebaseConnected = true;
          Object.keys(data).forEach(assetId => {
            const asset = this.assets.get(assetId);
            if (asset && typeof data[assetId]?.currentPrice === 'number') {
              const remotePrice = data[assetId].currentPrice;
              if (Math.abs(remotePrice - asset.currentPrice) > 0.000001) {
                asset.previousPrice = asset.currentPrice;
                asset.currentPrice = remotePrice;
                asset.change24h = data[assetId].change24h ?? asset.change24h;
                this.updateCandleWithTick(assetId, remotePrice);
              }
            }
          });
          this.notifyAssetListeners();
        }
      }, (err) => {
        console.warn('Firebase RTDB prices listener notice (operating in local resilient mode):', err.message);
      });

      // Listen to Admin Market logs from Firebase RTDB
      const logsRef = ref(rtdb, 'market_logs');
      onValue(logsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const list: AdminMarketLog[] = Object.keys(data).map(k => ({
            id: k,
            ...data[k]
          }));
          list.sort((a, b) => b.timestamp - a.timestamp);
          this.adminLogs = list;
          this.notifyLogListeners();
        }
      }, (err) => {
        console.warn('Firebase RTDB logs notice:', err.message);
      });
    } catch (e) {
      console.warn('Firebase init notice:', e);
    }
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;

    // Simulation tick loop every 1200ms
    this.intervalId = setInterval(() => {
      this.tick();
    }, 1200);
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }

  private tick() {
    this.assets.forEach(asset => {
      // Stochastic price evolution
      const baseVol = asset.volatility;
      let drift = 0;
      if (asset.trendBias === 'BULLISH') drift = 0.00015;
      if (asset.trendBias === 'BEARISH') drift = -0.00015;

      const randomShock = (Math.random() - 0.495) * baseVol * 2;
      const deltaPercent = drift + randomShock;
      const delta = asset.currentPrice * deltaPercent;

      const newPriceRaw = asset.currentPrice + delta;
      const newPrice = Number(newPriceRaw.toFixed(asset.decimals));

      if (newPrice !== asset.currentPrice) {
        asset.previousPrice = asset.currentPrice;
        asset.currentPrice = newPrice;

        // update 24h stats
        if (newPrice > asset.high24h) asset.high24h = newPrice;
        if (newPrice < asset.low24h) asset.low24h = newPrice;
        asset.change24h = Number((((newPrice - asset.basePrice) / asset.basePrice) * 100).toFixed(2));
        asset.volume24h += Math.floor(Math.random() * 5000 + 500);

        this.updateCandleWithTick(asset.id, newPrice);
        this.addRandomTrade(asset.id, newPrice, asset.decimals);
      }
    });

    this.notifyAssetListeners();
  }

  private updateCandleWithTick(assetId: string, price: number) {
    const candles = this.assetCandles.get(assetId);
    if (!candles || candles.length === 0) return;

    const lastCandle = candles[candles.length - 1];
    const now = Date.now();
    const candleDuration = 60 * 1000; // 1 minute per candle

    if (now - lastCandle.time > candleDuration) {
      // start new candle
      const newCandle: Candle = {
        time: now,
        open: lastCandle.close,
        high: Math.max(lastCandle.close, price),
        low: Math.min(lastCandle.close, price),
        close: price,
        volume: Math.floor(Math.random() * 1000 + 100)
      };
      candles.push(newCandle);
      if (candles.length > 150) candles.shift();
    } else {
      // update current candle
      lastCandle.close = price;
      if (price > lastCandle.high) lastCandle.high = price;
      if (price < lastCandle.low) lastCandle.low = price;
      lastCandle.volume += Math.floor(Math.random() * 50 + 10);
    }

    this.notifyCandleListeners(assetId);
  }

  private addRandomTrade(assetId: string, price: number, decimals: number) {
    const trades = this.assetTrades.get(assetId);
    if (!trades) return;

    if (Math.random() > 0.4) {
      const type: 'BUY' | 'SELL' = Math.random() > 0.5 ? 'BUY' : 'SELL';
      const amount = Number((Math.random() * 1.5 + 0.05).toFixed(3));
      trades.unshift({
        id: `trade-${Date.now()}-${Math.random()}`,
        price,
        amount,
        type,
        time: Date.now()
      });
      if (trades.length > 30) trades.pop();
    }
  }

  // --- ADMIN MARKET MANIPULATION METHODS ---

  public async adminApplyMarketAction(
    adminEmail: string,
    assetId: string,
    action: AdminMarketLog['action'],
    paramValue: number, // percentage for pump/dump or custom price
    note: string
  ) {
    const asset = this.assets.get(assetId);
    if (!asset) return;

    const oldPrice = asset.currentPrice;
    let newPrice = oldPrice;

    if (action === 'PUMP') {
      newPrice = Number((oldPrice * (1 + paramValue / 100)).toFixed(asset.decimals));
      asset.trendBias = 'BULLISH';
    } else if (action === 'DUMP') {
      newPrice = Number((oldPrice * (1 - paramValue / 100)).toFixed(asset.decimals));
      asset.trendBias = 'BEARISH';
    } else if (action === 'CUSTOM_PRICE') {
      newPrice = Number(paramValue.toFixed(asset.decimals));
    } else if (action === 'RESET') {
      newPrice = asset.basePrice;
      asset.trendBias = 'SIDEWAYS';
    } else if (action === 'VOLATILITY_CHANGE') {
      asset.volatility = paramValue;
    } else if (action === 'TREND_CHANGE') {
      asset.trendBias = paramValue === 1 ? 'BULLISH' : paramValue === -1 ? 'BEARISH' : 'SIDEWAYS';
    }

    if (newPrice !== oldPrice) {
      asset.previousPrice = oldPrice;
      asset.currentPrice = newPrice;
      if (newPrice > asset.high24h) asset.high24h = newPrice;
      if (newPrice < asset.low24h) asset.low24h = newPrice;
      asset.change24h = Number((((newPrice - asset.basePrice) / asset.basePrice) * 100).toFixed(2));
      this.updateCandleWithTick(assetId, newPrice);
    }

    const percentageChange = Number((((newPrice - oldPrice) / oldPrice) * 100).toFixed(2));

    const logEntry: AdminMarketLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      adminEmail: adminEmail || 'admin@tradingtraining.com',
      assetId,
      assetSymbol: asset.symbol,
      action,
      oldPrice,
      newPrice,
      percentageChange,
      note: note || `Admin intervensi pasar ${asset.symbol}: ${action}`
    };

    // Store log locally
    this.adminLogs.unshift(logEntry);
    if (this.adminLogs.length > 100) this.adminLogs.pop();
    this.notifyLogListeners();
    this.notifyAssetListeners();

    // Broadcast to Firebase RTDB for real-time multi-client sync
    try {
      const priceRef = ref(rtdb, `market_prices/${assetId}`);
      await set(priceRef, {
        currentPrice: newPrice,
        change24h: asset.change24h,
        high24h: asset.high24h,
        low24h: asset.low24h,
        timestamp: Date.now()
      });

      const logPushRef = push(ref(rtdb, 'market_logs'));
      await set(logPushRef, logEntry);
    } catch (err) {
      console.warn('Firebase RTDB sync fallback (saved in local sync):', err);
    }
  }

  // --- GETTERS & GENERATORS ---

  public getAssets(): Asset[] {
    return Array.from(this.assets.values());
  }

  public getAsset(id: string): Asset | undefined {
    return this.assets.get(id);
  }

  public getCandles(assetId: string): Candle[] {
    return this.assetCandles.get(assetId) || [];
  }

  public getRecentTrades(assetId: string): PublicTrade[] {
    return this.assetTrades.get(assetId) || [];
  }

  public getAdminLogs(): AdminMarketLog[] {
    return this.adminLogs;
  }

  public getOrderBook(assetId: string): { bids: OrderBookEntry[]; asks: OrderBookEntry[]; spread: number } {
    const asset = this.assets.get(assetId);
    if (!asset) return { bids: [], asks: [], spread: 0 };

    const currentPrice = asset.currentPrice;
    const decimals = asset.decimals;
    const spread = asset.spread;

    const asks: OrderBookEntry[] = [];
    const bids: OrderBookEntry[] = [];
    const levels = 7;

    let cumulativeAskTotal = 0;
    for (let i = 1; i <= levels; i++) {
      const step = (asset.spread * 0.8) + (i * asset.spread * 0.4);
      const price = Number((currentPrice + step).toFixed(decimals));
      const amount = Number((Math.random() * 2.5 + 0.2).toFixed(3));
      cumulativeAskTotal += amount;
      asks.unshift({ price, amount, total: Number(cumulativeAskTotal.toFixed(3)) });
    }

    let cumulativeBidTotal = 0;
    for (let i = 1; i <= levels; i++) {
      const step = (asset.spread * 0.8) + (i * asset.spread * 0.4);
      const price = Number((currentPrice - step).toFixed(decimals));
      const amount = Number((Math.random() * 2.5 + 0.2).toFixed(3));
      cumulativeBidTotal += amount;
      bids.push({ price, amount, total: Number(cumulativeBidTotal.toFixed(3)) });
    }

    return { bids, asks, spread };
  }

  // --- SUBSCRIPTIONS ---

  public subscribeAssets(listener: (assets: Asset[]) => void) {
    this.listeners.add(listener);
    listener(this.getAssets());
    return () => this.listeners.delete(listener);
  }

  public subscribeCandles(listener: (assetId: string, candles: Candle[]) => void) {
    this.candleListeners.add(listener);
    return () => this.candleListeners.delete(listener);
  }

  public subscribeLogs(listener: (logs: AdminMarketLog[]) => void) {
    this.logListeners.add(listener);
    listener(this.adminLogs);
    return () => this.logListeners.delete(listener);
  }

  private notifyAssetListeners() {
    const list = this.getAssets();
    this.listeners.forEach(fn => fn(list));
  }

  private notifyCandleListeners(assetId: string) {
    const candles = this.getCandles(assetId);
    this.candleListeners.forEach(fn => fn(assetId, candles));
  }

  private notifyLogListeners() {
    this.logListeners.forEach(fn => fn(this.adminLogs));
  }
}

export const marketEngine = new MarketEngine();
marketEngine.start();
