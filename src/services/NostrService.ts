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
    console.log('Connected to relays');
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
    // Generate a random 32-byte private key
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  async publishOrder(orderData: Omit<Order, 'id' | 'pubkey' | 'created_at'>) {
    const event = new NDKEvent(this.ndk);
    event.kind = 38383 as NDKKind;
    event.tags = [
      ['k', orderData.side],
      ['f', orderData.fiat],
      ['amt', orderData.amount],
      ['premium', orderData.price],
      ['s', orderData.status]
    ];
    event.content = '';

    await event.publish();
    console.log('Order published:', orderData);
  }

  subscribeOrders() {
    this.ordersRef.value = [];
    
    const sub = this.ndk.subscribe({
      kinds: [38383 as NDKKind]
    });

    sub.on('event', (event: NDKEvent) => {
      console.log('Event tags:', event.tags);
      const order: Order = {
        id: event.id,
        side: event.getMatchingTags('k')[0]?.[1] as 'buy' | 'sell',
        fiat: event.getMatchingTags('f')[0]?.[1],
        amount: event.getMatchingTags('amt')[0]?.[1],
        price: event.getMatchingTags('premium')[0]?.[1],
        status: event.getMatchingTags('s')[0]?.[1] || 'pending',
        pubkey: event.pubkey,
        created_at: event.created_at ?? 0,
        relay: event.relay?.url || '',
        layer: event.getMatchingTags('layer')[0]?.[1] || '',
        source: ''
      };

      // Extraer información adicional de los tags
      const additionalTags = event.tags;
      additionalTags.forEach(tag => {
        if (tag[0] === 'fa') {
          order.amount = tag[1]; // Asignar el valor de 'fa' a amount
        }
        if (tag[0] === 'p') {
          order.price = tag[1]; // Asignar el valor de 'p' a price
        }
        if (tag[0] === 'layer') {
          order.layer = tag[1]; // Asignar el valor de 'layer'
        }
        if (tag[0] === 'y') {
          order.source = tag[1]; // Asignar el valor de 'y' a source
        }
      });

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
      console.log(`Match found!
        ${newOrder.side.toUpperCase()} order (${newOrder.price} ${newOrder.fiat})
        matches with
        ${matchedOrder.side.toUpperCase()} order (${matchedOrder.price} ${matchedOrder.fiat})`);
    });
  }
  getUserPubkey(): string | undefined {
    return this.signer?.getPublicKey();
  }

  logout() {
    this.signer = undefined;
    console.log('User logged out');
  }
}