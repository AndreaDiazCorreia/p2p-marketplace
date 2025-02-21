<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { Order } from '../types/Order';

const props = defineProps<{
  orders: Order[];
}>();

const itemsPerPage = 5;
const currentBuyPage = ref(1);
const currentSellPage = ref(1);

const buyOrders = computed(() => 
  props.orders
    .filter(order => order.side === 'buy' && (order.status === 'pending'))
    .sort((a, b) => b.created_at - a.created_at)
);

const sellOrders = computed(() => 
  props.orders
    .filter(order => order.side === 'sell' && (order.status === 'pending'))
    .sort((a, b) => b.created_at - a.created_at)
);

const paginatedBuyOrders = computed(() => {
  const start = (currentBuyPage.value - 1) * itemsPerPage;
  return buyOrders.value.slice(start, start + itemsPerPage);
});

const paginatedSellOrders = computed(() => {
  const start = (currentSellPage.value - 1) * itemsPerPage;
  return sellOrders.value.slice(start, start + itemsPerPage);
});

const totalBuyPages = computed(() => 
  Math.ceil(buyOrders.value.length / itemsPerPage)
);

const totalSellPages = computed(() => 
  Math.ceil(sellOrders.value.length / itemsPerPage)
);

function formatAmount(amount: string): string {
  return parseFloat(amount).toFixed(2);
}

function formatPrice(price: string): string {
  return parseFloat(price).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
    Math.floor((date.getTime() - Date.now()) / (1000 * 60)), 
    'minutes'
  );
}

function getRelayLogo(relay: string): string {
  switch (relay) {
    case 'wss://relay.mostro.net':
      return 'https://avatars.githubusercontent.com/u/117840772?s=48&v=4'; 
    case 'wss://relay.damus.io':
      return 'https://damus.io/logo_icon_2.png'; 
    case 'wss://nostr-pub.wellorder.net':
      return 'path/to/logo3.png'; 
    default:
      return 'path/to/default-logo.png';
  }
}

// Agregar un watcher para debug
watch(() => props.orders, (newOrders) => {
  //console.log('Orders updated in dashboard:', newOrders);
}, { deep: true });
</script>

<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h2>Order Book</h2>
      <div class="stats">
        <div class="stat-item">
          <span class="stat-label">Buy Orders:</span>
          <span class="stat-value buy">{{ buyOrders.length }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Sell Orders:</span>
          <span class="stat-value sell">{{ sellOrders.length }}</span>
        </div>
      </div>
    </div>

    <div class="orders-container">
      <div class="orders-column">
        <div class="column-header buy">
          <h3>Buy Orders</h3>
          <span class="header-subtitle">Sorted by highest price first</span>
        </div>
        <div class="orders-list">
          <div class="list-header">
            <span>Amount</span>
            <span>Price</span>
            <span>Time</span>
          </div>
          <div v-for="order in paginatedBuyOrders" 
               :key="order.id" 
               class="order-card buy"
               :title="`Created by ${order.pubkey}`">
            <div class="order-amount">{{ formatAmount(order.amount) }} SATS</div>
            <div class="order-price">{{ formatPrice(order.price) }} {{ order.fiat }}</div>
            <div class="order-time">{{ formatDate(order.created_at) }}</div>
            <div class="order-source">{{ order.source || 'Unknown' }}</div>
            <div class="order-layer">{{ order.layer || 'Unknown' }}</div>
          </div>
          <div v-if="buyOrders.length === 0" class="no-orders">
            <span class="material-icons">search_off</span>
            <p>No buy orders available</p>
          </div>
          <div v-if="buyOrders.length > 0" class="pagination">
            <button 
              @click="currentBuyPage--" 
              :disabled="currentBuyPage === 1"
              class="page-button"
            >
              Previous
            </button>
            <span class="page-info">
              Page {{ currentBuyPage }} of {{ totalBuyPages }}
            </span>
            <button 
              @click="currentBuyPage++" 
              :disabled="currentBuyPage === totalBuyPages"
              class="page-button"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <div class="orders-column">
        <div class="column-header sell">
          <h3>Sell Orders</h3>
          <span class="header-subtitle">Sorted by lowest price first</span>
        </div>
        <div class="orders-list">
          <div class="list-header">
            <span>Amount</span>
            <span>Price</span>
            <span>Time</span>
          </div>
          <div v-for="order in paginatedSellOrders" 
               :key="order.id" 
               class="order-card sell"
               :title="`Created by ${order.pubkey}`">
            <div class="order-amount">{{ formatAmount(order.amount) }} SATS</div>
            <div class="order-price">{{ formatPrice(order.price) }} {{ order.fiat }}</div>
            <div class="order-time">{{ formatDate(order.created_at) }}</div>
            <div class="order-source">{{ order.source || 'Unknown' }}</div>
            <div class="order-layer">{{ order.layer || 'Unknown' }}</div>
          </div>
          <div v-if="sellOrders.length === 0" class="no-orders">
            <span class="material-icons">search_off</span>
            <p>No sell orders available</p>
          </div>
          <div v-if="sellOrders.length > 0" class="pagination">
            <button 
              @click="currentSellPage--" 
              :disabled="currentSellPage === 1"
              class="page-button"
            >
              Previous
            </button>
            <span class="page-info">
              Page {{ currentSellPage }} of {{ totalSellPages }}
            </span>
            <button 
              @click="currentSellPage++" 
              :disabled="currentSellPage === totalSellPages"
              class="page-button"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  background-color: #f8fafc;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.dashboard-header h2 {
  font-size: 1.875rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.stats {
  display: flex;
  gap: 1.5rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stat-label {
  color: #64748b;
  font-size: 0.875rem;
}

.stat-value {
  font-weight: 600;
  font-size: 1rem;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
}

.stat-value.buy {
  background-color: #dcfce7;
  color: #059669;
}

.stat-value.sell {
  background-color: #fee2e2;
  color: #dc2626;
}

.orders-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
}

.orders-column {
  background-color: white;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.1);
}

.column-header {
  padding: 1.25rem;
  border-bottom: 1px solid #e2e8f0;
}

.column-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.column-header.buy h3 { color: #059669; }
.column-header.sell h3 { color: #dc2626; }

.header-subtitle {
  font-size: 0.875rem;
  color: #64748b;
  display: block;
  margin-top: 0.25rem;
}

.list-header {
  display: grid;
  grid-template-columns: 2fr 2fr 1fr;
  padding: 0.75rem 1.25rem;
  background-color: #f8fafc;
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748b;
}

.order-card {
  display: grid;
  grid-template-columns: 2fr 2fr 1fr;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #f1f5f9;
  transition: background-color 0.2s;
}

.order-card:hover {
  background-color: #f8fafc;
}

.order-amount {
  font-family: monospace;
  font-size: 0.875rem;
}

.order-price {
  font-weight: 600;
}

.order-card.buy .order-price { color: #059669; }
.order-card.sell .order-price { color: #dc2626; }

.order-time {
  font-size: 0.875rem;
  color: #64748b;
}

.no-orders {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  color: #94a3b8;
}

.no-orders .material-icons {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.no-orders p {
  margin: 0;
  font-size: 0.875rem;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1rem;
  border-top: 1px solid #e2e8f0;
}

.page-button {
  padding: 0.5rem 1rem;
  border: 1px solid #e2e8f0;
  background-color: white;
  color: #64748b;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.page-button:hover:not(:disabled) {
  background-color: #f8fafc;
  color: #3b82f6;
}

.page-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: #64748b;
  font-size: 0.875rem;
}

.relay-logo {
  width: 20px;
  height: auto;
}

@media (max-width: 768px) {
  .orders-container {
    grid-template-columns: 1fr;
  }
  
  .dashboard-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
}
</style>