
const FRIENDLY: Record<string, string> = {
  'BTC/USD': 'Bitcoin',
  'ETH/USD': 'Ethereum',
  'SOL/USD': 'Solana',
  'DOGE/USD': 'Dogecoin',
  'XRP/USD': 'XRP',
};

export const friendly = (marketName: string) =>
  FRIENDLY[marketName] ?? marketName.replace('/USD', '');

export const money = (n: number) =>
  n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    // Sub-cent markets like XPL need more places or everything reads $0.08.
    maximumFractionDigits: Math.abs(n) < 1 ? 4 : 2,
  });

export const signedMoney = (n: number) => `${n >= 0 ? '+' : '−'}${money(Math.abs(n))}`;

export const directionWord = (isLong: boolean) => (isLong ? 'Up' : 'Down');
export const directionSentence = (isLong: boolean) =>
  isLong ? 'profits if the price rises' : 'profits if the price falls';

export const coinAmount = (n: number) =>
  n.toLocaleString('en-US', { maximumSignificantDigits: 3 });
