export interface Rating {
  total_reviews: number;
  total_rating: number;
  last_rating: number;
  max_rate: number;
  min_rate: number;
}

export interface Order {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  side: 'buy' | 'sell';
  fiat: string;
  amount: string;
  price: string;
  status: 'pending';
  pm: string[];
  premium: string;
  source: string;
  network: string;
  layer: string;
  name: string;
  expiration: string;
  sources: string[];
  minAmount: string;
  maxAmount: string;
  trades: number;
  completion: number;
  community_id: string;
}

export type NewOrder = Omit<Order, 'id' | 'pubkey' | 'created_at' | 'kind'>;