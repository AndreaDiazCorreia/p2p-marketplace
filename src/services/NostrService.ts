import NDK, { NDKEvent, NDKPrivateKeySigner, NDKKind } from '@nostr-dev-kit/ndk';
import { Order } from '../types/Order';
import { Ref, ref } from 'vue';

const RELAYS = [
  'wss://relay.mostro.net',
  'wss://relay.damus.io',
  'wss://nostr-pub.wellorder.net'
];

export class NostrService {
  private ndk: NDK;
  private ordersRef: Ref<Order[]>;
  private signer?: NDKPrivateKeySigner;

  constructor() {
    this.ndk = new NDK({
      explicitRelayUrls: RELAYS
    });
    this.ordersRef = ref([]);
  }

  async connect() {
    await this.ndk.connect();
    this.subscribeOrders();
  }

  async login(privateKey?: string) {
    const key = privateKey || this.generatePrivateKey();
    this.signer = new NDKPrivateKeySigner(key);
    this.ndk.signer = this.signer;
    return key;
  }

  isLoggedIn(): boolean {
    return !!this.signer;
  }

  getPrivateKey(): string {
    return this.signer?.privateKey || '';
  }

  getOrders(): Order[] {
    return this.ordersRef.value;
  }

  private generatePrivateKey(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  async publishOrder(orderData: Omit<Order, 'id' | 'pubkey' | 'created_at'>) {
    const event = new NDKEvent(this.ndk);
    event.kind = 38383 as NDKKind;
    event.tags = [
      ['d', crypto.randomUUID()],
      ['k', orderData.side],
      ['f', orderData.fiat],
      ['s', orderData.status],
      ['amt', orderData.amount],
      ['fa', orderData.minAmount, orderData.maxAmount],
      ['pm', ...orderData.pm],
      ['premium', orderData.premium],
      ['source', orderData.source],
      ['y', ...orderData.sources],
      ['network', orderData.network || 'mainnet'],
      ['layer', orderData.layer || 'lightning'],
      ['expiration', orderData.expiration || '']
    ];
    event.content = '';

    await event.publish();
  }

  subscribeOrders() {
    this.ordersRef.value = [];
    
    const sub = this.ndk.subscribe({
      kinds: [38383 as NDKKind]
    });

    sub.on('event', (event: NDKEvent) => {
      // Get payment methods
      const pmTag = event.getMatchingTags('pm')[0];
      const paymentMethods = pmTag ? pmTag.slice(1) : [];

      // Get sources
      const yTag = event.getMatchingTags('y')[0];
      const sources = yTag ? yTag.slice(1) : [];

      // Get premium and price
      const premium = event.getMatchingTags('premium')[0]?.[1] || '0';
      const price = event.getMatchingTags('price')[0]?.[1] || '0';

      // Get amounts
      const faTag = event.getMatchingTags('fa')[0];
      const amtTag = event.getMatchingTags('amt')[0];
      const amount = amtTag?.[1] || '0';
      const minAmount = faTag?.[1] || amount;
      const maxAmount = faTag?.[2] || amount;

      // Get rating data
      const ratingTag = event.getMatchingTags('rating')[0];
      let trades = 0;
      let completion = 0;

      if (ratingTag && ratingTag[1]) {
        try {
          const rating = JSON.parse(ratingTag[1]);
          trades = rating.total_reviews || 0;
          completion = rating.total_rating && rating.max_rate 
            ? (rating.total_rating / rating.max_rate) * 100 
            : 0;
        } catch (e) {
          console.error('Error parsing rating:', e);
        }
      }

      const order: Order = {
        id: event.id,
        pubkey: event.pubkey,
        created_at: event.created_at ?? 0,
        kind: event.kind as number,
        side: event.getMatchingTags('k')[0]?.[1] as 'buy' | 'sell',
        fiat: event.getMatchingTags('f')[0]?.[1] || '',
        amount,
        price,
        status: event.getMatchingTags('s')[0]?.[1] as 'pending',
        pm: paymentMethods,
        premium,
        source: event.getMatchingTags('source')[0]?.[1] || '',
        network: event.getMatchingTags('network')[0]?.[1] || 'mainnet',
        layer: event.getMatchingTags('layer')[0]?.[1] || 'lightning',
        name: event.getMatchingTags('name')[0]?.[1] || '',
        expiration: event.getMatchingTags('expiration')[0]?.[1] || '',
        sources,
        minAmount,
        maxAmount,
        trades,
        completion,
        community_id: event.getMatchingTags('community_id')[0]?.[1] || ''
      };

      if (!this.ordersRef.value.some(o => o.id === order.id)) {
        this.ordersRef.value = [...this.ordersRef.value, order];
      }
    });
  }
}