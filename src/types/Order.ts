export interface Order {
  id: string;
  side: 'buy' | 'sell';
  fiat: string;
  amount: string;
  price: string;
  status: string;
  pubkey: string;
  created_at: number;
  relay: string;
  layer: string;
  source: string;
}