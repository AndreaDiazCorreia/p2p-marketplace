<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { Order } from '../types/Order';

const props = defineProps<{
  orders: Order[];
}>();

const selectedCountry = ref('');
const operationType = ref(''); // 'buy' or 'sell'
const amount = ref('');
const marketPrice = ref(''); // Variable para almacenar el precio de mercado

// List of countries with their currencies
const countries = [
  { code: 'US', name: 'United States', currency: 'USD' },
  { code: 'BR', name: 'Brazil', currency: 'BRL' },
  { code: 'AR', name: 'Argentina', currency: 'ARS' },
  { code: 'MX', name: 'Mexico', currency: 'MXN' },
  // Add more countries as needed
];

const selectedCurrency = computed(() => {
  const country = countries.find(c => c.code === selectedCountry.value);
  return country?.currency || '';
});

const matchingOrders = computed(() => {
  if (!selectedCountry.value || !operationType.value || !amount.value) {
    return [];
  }

  // Filter orders based on:
  // 1. Matching currency (from selected country)
  // 2. Opposite operation type (if user wants to buy, show sell orders and vice versa)
  // 3. Amount within reasonable range (±10% of requested amount)
  const filteredOrders = props.orders.filter(order => {
    const isMatchingCurrency = order.fiat === selectedCurrency.value;
    const isOppositeType = (operationType.value === 'buy' && order.side === 'sell') ||
                          (operationType.value === 'sell' && order.side === 'buy');
    const orderAmount = parseFloat(order.amount);
    const requestedAmount = parseFloat(amount.value);
    const isWithinRange = Math.abs(orderAmount - requestedAmount) / requestedAmount <= 0.1;

    return isMatchingCurrency && isOppositeType && isWithinRange;
  });

  // Sort by best price (lowest for buy, highest for sell)
  return filteredOrders
    .sort((a, b) => {
      const priceA = parseFloat(a.price);
      const priceB = parseFloat(b.price);
      return operationType.value === 'buy' ? priceA - priceB : priceB - priceA;
    })
    .slice(0, 5); // Return only top 5 matches
});

// Función para obtener el precio de una plataforma (ejemplo)
async function fetchMarketPrice() {
  try {
    const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
    const data = await response.json();
    marketPrice.value = data.price;
  } catch (error) {
    console.error('Error fetching market price:', error);
  }
}

// Llama a la función al montar el componente
onMounted(() => {
  fetchMarketPrice();
});

function formatPrice(price: string): string {
  const num = parseFloat(price);
  return isNaN(num) ? '0.00' : num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatAmount(amount: string): string {
  const num = parseFloat(amount);
  return isNaN(num) ? '0.00' : num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatBTCAmount(amount: string): string {
  const satsAmount = parseFloat(amount);
  if (isNaN(satsAmount)) return '0.00000000';
  
  // Convert sats to BTC (1 BTC = 100,000,000 sats)
  const btcAmount = satsAmount / 100000000;
  return btcAmount.toFixed(8);
}

function calculatePriceMarkup(price: string, basePrice: string): string {
  const priceNum = parseFloat(price);
  const basePriceNum = parseFloat(basePrice);
  
  if (isNaN(priceNum) || isNaN(basePriceNum) || basePriceNum === 0) {
    return '0.0%';
  }
  
  const markup = ((priceNum - basePriceNum) / basePriceNum) * 100;
  return markup > 0 ? `+${markup.toFixed(1)}%` : `${markup.toFixed(1)}%`;
}

function formatExpiration(timestamp: string): string {
  const date = new Date(parseInt(timestamp) * 1000);
  const now = new Date();
  const diffTime = Math.abs(date.getTime() - now.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 1) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Tomorrow';
  } else {
    return `${diffDays} days`;
  }
}
</script>

<template>
  <div class="trade-flow">
    <div class="trade-form">
      <h2>{{ operationType === 'buy' ? 'BUY BITCOIN' : operationType === 'sell' ? 'SELL BITCOIN' : 'Create Trade' }}</h2>
      
      <!-- Step 1: Country Selection -->
      <div class="form-group">
        <label for="country">Step 1: Select your country</label>
        <select 
          id="country"
          v-model="selectedCountry"
          class="form-control"
        >
          <option value="">Select a country</option>
          <option 
            v-for="country in countries" 
            :key="country.code" 
            :value="country.code"
          >
            {{ country.name }}
          </option>
        </select>
      </div>

      <!-- Step 2: Operation Type -->
      <div class="form-group">
        <label>Step 2: Select operation</label>
        <div class="operation-buttons">
          <button 
            :class="['operation-btn', { active: operationType === 'buy' }]"
            @click="operationType = 'buy'"
          >
            Buy Bitcoin
          </button>
          <button 
            :class="['operation-btn', { active: operationType === 'sell' }]"
            @click="operationType = 'sell'"
          >
            Sell Bitcoin
          </button>
        </div>
      </div>

      <!-- Step 3: Amount Input -->
      <div class="form-group">
        <label for="amount">Step 3: Enter amount in {{ selectedCurrency || 'local currency' }}</label>
        <div class="amount-input">
          <input
            id="amount"
            v-model="amount"
            type="number"
            class="form-control"
            :placeholder="'Amount in ' + selectedCurrency"
            :disabled="!selectedCurrency"
          >
          <span class="currency">{{ selectedCurrency }}</span>
        </div>
      </div>
    </div>

    <!-- Step 4: Matching Orders -->
    <div v-if="matchingOrders.length > 0" class="matching-orders">
      <h3>Best Available Orders</h3>
      <div class="orders-list">
        <div v-for="order in matchingOrders" 
             :key="order.id" 
             class="order-card"
        >
          <div class="order-header">
            <div class="trader-info">
              <div class="trader-stats">{{ order.trades }} trades • {{ order.completion }}% completion</div>
              <div class="trader-source">
                <span v-for="source in order.sources" :key="source" class="source-tag">
                  {{ source }}
                </span>
              </div>
            </div>
            <div class="price-info">
              <div class="price-amount">{{ formatPrice(order.price) }} {{ order.fiat }}</div>
              <div class="price-markup">Binance <span class="markup">{{ order.premium }}%</span></div>
            </div>
          </div>

          <div class="order-details">
            <div class="detail-group">
              <span class="detail-label">Limits:</span>
              <span class="detail-value">
                {{ formatPrice(order.minAmount) }} - {{ formatPrice(order.maxAmount) }} {{ order.fiat }}
                <span class="detail-btc">({{ formatBTCAmount(order.minAmount) }} - {{ formatBTCAmount(order.maxAmount) }} BTC)</span>
              </span>
            </div>

            <div class="detail-group">
              <span class="detail-label">Payment:</span>
              <div class="payment-methods">
                <span v-for="method in order.pm" 
                      :key="method"
                      class="payment-tag">
                  {{ method }}
                </span>
              </div>
            </div>

            <div v-if="order.details" class="detail-group">
              <span class="detail-label">Details:</span>
              <span class="detail-value">{{ order.details }}</span>
            </div>
          </div>

          <button class="select-btn">Select Order</button>
        </div>
      </div>
    </div>
    
    <div v-else-if="selectedCountry && operationType && amount" class="no-matches">
      No matching orders found. Please try a different amount or check back later.
    </div>
  </div>
</template>

<style scoped>
.trade-flow {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.trade-form {
  background-color: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 2rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.75rem;
  font-weight: 600;
  color: #374151;
  font-size: 1.1rem;
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 1rem;
}

.operation-buttons {
  display: flex;
  gap: 1rem;
}

.operation-btn {
  flex: 1;
  padding: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  background: white;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.operation-btn.active {
  border-color: #3b82f6;
  background: #3b82f6;
  color: white;
}

.amount-input {
  position: relative;
}

.amount-input .currency {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
}

.matching-orders {
  background-color: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}

.matching-orders h3 {
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
  color: #1f2937;
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.order-card {
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
  transition: all 0.2s;
}

.order-card:hover {
  border-color: #3b82f6;
  background-color: #f8fafc;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.trader-info {
  display: flex;
  flex-direction: column;
}

.trader-stats {
  color: #6b7280;
  font-size: 0.9rem;
  margin-top: 0.25rem;
}

.trader-source {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.source-tag {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: #f3f4f6;
  border-radius: 9999px;
  font-size: 0.75rem;
  color: #4b5563;
}

.price-info {
  text-align: right;
}

.price-amount {
  font-weight: 600;
  font-size: 1.2rem;
  color: #1f2937;
}

.price-markup {
  color: #6b7280;
  font-size: 0.9rem;
  margin-top: 0.25rem;
}

.markup {
  color: #059669;
}

.order-details {
  border-top: 1px solid #e5e7eb;
  padding-top: 1.5rem;
  margin-bottom: 1.5rem;
}

.detail-group {
  margin-bottom: 1rem;
}

.detail-label {
  font-weight: 500;
  color: #4b5563;
  margin-right: 0.5rem;
}

.detail-value {
  color: #1f2937;
}

.detail-btc {
  color: #6b7280;
  font-size: 0.9rem;
  margin-left: 0.5rem;
}

.payment-methods {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.payment-tag {
  background: #f3f4f6;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.9rem;
  color: #4b5563;
}

.select-btn {
  width: 100%;
  background-color: #3b82f6;
  color: white;
  padding: 0.75rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.select-btn:hover {
  background-color: #2563eb;
}

.no-matches {
  text-align: center;
  padding: 2rem;
  background-color: #f3f4f6;
  border-radius: 0.5rem;
  color: #6b7280;
}
</style> 