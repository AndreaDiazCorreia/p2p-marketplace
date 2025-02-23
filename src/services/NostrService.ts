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
    //console.log('Connected to relays');
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
      ['fa', orderData.minAmount || '0', orderData.maxAmount || '0'],
      ['pm', ...orderData.pm],
      ['premium', orderData.premium || '0'],
      ['community_id', orderData.community_id || ''],
      ['source', orderData.sources[0] || ''],
      ['network', orderData.network || 'mainnet'],
      ['layer', orderData.layer || 'lightning'],
      ['expiration', orderData.expiration || ''],
      ['y', 'lnp2pbot'],
      ['z', 'order']
    ];
    event.content = '';

    await event.publish();
    //console.log('Order published:', orderData);
  }

  subscribeOrders() {
    this.ordersRef.value = [];
    
    const sub = this.ndk.subscribe({
      kinds: [38383 as NDKKind]
    });

    sub.on('event', (event: NDKEvent) => {
      console.log('Event tags:', event.tags);
      
      // Get payment methods array from the 'pm' tag
      const pmTag = event.getMatchingTags('pm')[0];
      const paymentMethods = pmTag ? pmTag.slice(1) : []; // Remove the first element ('pm') and keep the rest

      // Get sources from the 'y' tag (all values except the first one)
      const yTag = event.getMatchingTags('y')[0];
      const sources = yTag ? yTag.slice(1) : []; // Remove the first element ('y') and keep the rest

      // Get premium percentage from the 'premium' tag
      const premium = event.getMatchingTags('premium')[0]?.[1] || '0';

      // Get amount from 'fa' tag (single value) or 'amt' tag as fallback
      const faTag = event.getMatchingTags('fa')[0];
      const amtTag = event.getMatchingTags('amt')[0];
      const amount = faTag?.[1] || amtTag?.[1] || '0';

      // Get rating data
      const ratingTag = event.getMatchingTags('rating')[0];
      let rating = {
        total_reviews: 0,
        total_rating: 0,
        last_rating: 0,
        max_rate: 5,
        min_rate: 1
      };
      
      if (ratingTag && ratingTag[1]) {
        try {
          rating = JSON.parse(ratingTag[1]);
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
        amount: amount,
        price: premium,
        status: event.getMatchingTags('s')[0]?.[1] as 'pending',
        pm: paymentMethods,
        premium,
        rating,
        source: event.getMatchingTags('source')[0]?.[1] || '',
        network: event.getMatchingTags('network')[0]?.[1] || 'mainnet',
        layer: event.getMatchingTags('layer')[0]?.[1] || 'lightning',
        name: event.getMatchingTags('name')[0]?.[1] || '',
        geohash: event.getMatchingTags('g')[0]?.[1] || '',
        bond: event.getMatchingTags('bond')[0]?.[1] || '0',
        expiration: event.getMatchingTags('expiration')[0]?.[1] || '',
        sources,
        minAmount: amount, // Use the same amount for min and max
        maxAmount: amount, // Use the same amount for min and max
        marketPrice: '0', // This should be fetched from an external source
        details: '',
        trades: rating.total_reviews || 0,
        completion: (rating.total_rating / rating.max_rate) * 100 || 0,
        community_id: event.getMatchingTags('community_id')[0]?.[1] || ''
      };

      if (!this.ordersRef.value.some(o => o.id === order.id)) {
        this.ordersRef.value = [...this.ordersRef.value, order];
        this.matchOrders(order);
      }
    });
  }

  private matchOrders(newOrder: Order) {
    const matchingOrders = this.ordersRef.value.filter(order => {
      if (order.id === newOrder.id) return false;
      if (order.status !== 'pending') return false;
      if (order.fiat !== newOrder.fiat) return false;

      const newPrice = parseFloat(newOrder.price);
      const existingPrice = parseFloat(order.price);

      if (newOrder.side === 'buy') {
        return order.side === 'sell' && existingPrice <= newPrice;
      } else {
        return order.side === 'buy' && existingPrice >= newPrice;
      }
    });

    matchingOrders.forEach(matchedOrder => {
      console.log('=== Match Found ===');
      console.log(`New Order Details:
        - ID: ${newOrder.id}
        - Type: ${newOrder.side.toUpperCase()}
        - Status: ${newOrder.status}
        - Currency: ${newOrder.fiat}
        - Amount: ${newOrder.amount} ${newOrder.fiat}
        - Price: ${newOrder.price} ${newOrder.fiat}
        - Premium: ${newOrder.premium}%
        - Market Price: ${newOrder.marketPrice}
        - Payment Methods: ${newOrder.pm.join(', ')}
        - Min-Max: ${newOrder.minAmount} - ${newOrder.maxAmount} ${newOrder.fiat}
        - Network: ${newOrder.network}
        - Layer: ${newOrder.layer}
        - Sources: ${newOrder.sources.join(', ')}
        - Community ID: ${newOrder.community_id}
        - Expiration: ${newOrder.expiration}
        - Trades: ${newOrder.trades}
        - Completion: ${newOrder.completion}%
        - Created At: ${new Date(newOrder.created_at * 1000).toLocaleString()}
        - Pubkey: ${newOrder.pubkey}
      `);
      console.log(`Matched Order Details:
        - ID: ${matchedOrder.id}
        - Type: ${matchedOrder.side.toUpperCase()}
        - Status: ${matchedOrder.status}
        - Currency: ${matchedOrder.fiat}
        - Amount: ${matchedOrder.amount} ${matchedOrder.fiat}
        - Price: ${matchedOrder.price} ${matchedOrder.fiat}
        - Premium: ${matchedOrder.premium}%
        - Market Price: ${matchedOrder.marketPrice}
        - Payment Methods: ${matchedOrder.pm.join(', ')}
        - Min-Max: ${matchedOrder.minAmount} - ${matchedOrder.maxAmount} ${matchedOrder.fiat}
        - Network: ${matchedOrder.network}
        - Layer: ${matchedOrder.layer}
        - Sources: ${matchedOrder.sources.join(', ')}
        - Community ID: ${matchedOrder.community_id}
        - Expiration: ${matchedOrder.expiration}
        - Trades: ${matchedOrder.trades}
        - Completion: ${matchedOrder.completion}%
        - Created At: ${new Date(matchedOrder.created_at * 1000).toLocaleString()}
        - Pubkey: ${matchedOrder.pubkey}
      `);
      console.log('=================\n');
    });
  }
}