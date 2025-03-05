<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Order } from '../types/Order';

const props = defineProps<{
  orders: Order[];
}>();

const selectedCountry = ref('');
const operationType = ref(''); // 'buy' or 'sell'
const amount = ref('');
const isLoading = ref(false);

// List of countries with their currencies
const countries = [
  { code: 'US', name: 'United States', currency: 'USD' },
  { code: 'BR', name: 'Brazil', currency: 'BRL' },
  { code: 'AR', name: 'Argentina', currency: 'ARS' },
  { code: 'MX', name: 'Mexico', currency: 'MXN' },
];

const selectedCurrency = computed(() => {
  const country = countries.find(c => c.code === selectedCountry.value);
  return country?.currency || '';
});

const matchingOrders = computed(() => {
  if (!selectedCountry.value || !operationType.value || !amount.value) {
    return [];
  }

  // Filter orders
  const filteredOrders = props.orders.filter(order => {
    // Check pending status
    const isPending = order.status === 'pending';
    
    // Check currency and operation type
    const isMatchingCurrency = order.fiat === selectedCurrency.value;
    const isOppositeType = (operationType.value === 'buy' && order.side === 'sell') ||
                          (operationType.value === 'sell' && order.side === 'buy');

    // Check amount range
    const requestedAmount = parseFloat(amount.value);
    const min = parseFloat(order.minAmount);
    const max = parseFloat(order.maxAmount);
    const isWithinRange = requestedAmount >= min && requestedAmount <= max;

    return isPending && isMatchingCurrency && isOppositeType && isWithinRange;
  });

  // Sort by best price
  return filteredOrders
    .sort((a, b) => {
      const priceA = parseFloat(a.price);
      const priceB = parseFloat(b.price);
      // For buys, sort from lowest to highest price
      // For sells, sort from highest to lowest price
      return operationType.value === 'buy' ? priceA - priceB : priceB - priceA;
    });
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

function calculatePremium(premium: string): string {
  const num = parseFloat(premium);
  if (isNaN(num)) return '0%';
  return num > 0 ? `+${num}%` : `${num}%`;
}

function searchOrders() {
  isLoading.value = true;
  // Simulate search with a small delay to show loading state
  setTimeout(() => {
    isLoading.value = false;
  }, 800);
}

function selectOrder(order: Order) {
  // Logic for selecting an order would go here
  console.log('Selected order:', order);
}
</script>

<template>
  <div class="trade-flow">
    <div class="card trade-form">
      <h2 class="form-title">
        <span v-if="operationType === 'buy'" class="title-with-icon buy">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m5 12 7-7 7 7"></path>
            <path d="M12 19V5"></path>
          </svg>
          Buy Bitcoin
        </span>
        <span v-else-if="operationType === 'sell'" class="title-with-icon sell">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m19 12-7 7-7-7"></path>
            <path d="M12 5v14"></path>
          </svg>
          Sell Bitcoin
        </span>
        <span v-else>Find Orders</span>
      </h2>
      
      <!-- Step 1: Country Selection -->
      <div class="form-group">
        <label for="country" class="form-label">
          <span class="step-number">1</span>
          Select your country
        </label>
        <div class="select-wrapper">
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
          <div class="select-arrow">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- Step 2: Operation Type -->
      <div class="form-group">
        <label class="form-label">
          <span class="step-number">2</span>
          Select operation
        </label>
        <div class="operation-buttons">
          <button 
            :class="['operation-btn', { active: operationType === 'buy' }]"
            @click="operationType = 'buy'"
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m5 12 7-7 7 7"></path>
              <path d="M12 19V5"></path>
            </svg>
            Buy Bitcoin
          </button>
          <button 
            :class="['operation-btn', { active: operationType === 'sell' }]"
            @click="operationType = 'sell'"
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m19 12-7 7-7-7"></path>
              <path d="M12 5v14"></path>
            </svg>
            Sell Bitcoin
          </button>
        </div>
      </div>

      <!-- Step 3: Amount Input -->
      <div class="form-group">
        <label for="amount" class="form-label">
          <span class="step-number">3</span>
          Enter amount in {{ selectedCurrency || 'local currency' }}
        </label>
        <div class="amount-input">
          <input
            id="amount"
            v-model="amount"
            type="number"
            class="form-control"
            :placeholder="'Amount in ' + selectedCurrency"
            :disabled="!selectedCurrency"
          >
          <span class="currency-badge" v-if="selectedCurrency">{{ selectedCurrency }}</span>
        </div>
      </div>

      <button 
        class="search-btn" 
        :disabled="!selectedCountry || !operationType || !amount"
        @click="searchOrders"
      >
        <span v-if="!isLoading">Search Orders</span>
        <span v-else class="btn-loading">
          <svg class="spinner" viewBox="0 0 50 50">
            <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
          </svg>
          Searching...
        </span>
      </button>
    </div>

    <!-- Matching Orders -->
    <transition name="fade">
      <div v-if="matchingOrders.length > 0" class="card matching-orders">
        <div class="orders-header">
          <h3>Available Orders ({{ matchingOrders.length }})</h3>
          <div class="orders-filter">
            <span class="filter-label">Sort by:</span>
            <select class="filter-select">
              <option value="price">Best Price</option>
              <option value="rating">Rating</option>
              <option value="trades">Number of Trades</option>
            </select>
          </div>
        </div>
        
        <div class="orders-list">
          <transition-group name="list">
            <div v-for="order in matchingOrders" 
                :key="order.id" 
                class="order-card"
                @click="selectOrder(order)"
            >
              <div class="order-header">
                <div class="trader-info">
                  <div class="trader-avatar">
                    {{ order.name ? order.name.charAt(0).toUpperCase() : 'A' }}
                  </div>
                  <div class="trader-details">
                    <div class="trader-name">{{ order.name || 'Anonymous' }}</div>
                    <div class="trader-stats">
                      <span class="reviews">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M12 13V2"></path>
                          <path d="M19 13V5"></path>
                          <path d="M5 13V9"></path>
                          <path d="M2 17h20"></path>
                          <path d="M2 21h20"></path>
                        </svg>
                        {{ order.trades }} trades
                      </span>
                      <span class="completion">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                          <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                        {{ order.completion.toFixed(0) }}% completion
                      </span>
                    </div>
                  </div>
                </div>
                <div class="price-info">
                  <div class="premium" :class="{ positive: parseFloat(order.premium) > 0, negative: parseFloat(order.premium) < 0 }">
                    {{ calculatePremium(order.premium) }}
                  </div>
                </div>
              </div>

              <div class="order-details">
                <div class="detail-row">
                  <div class="detail-group">
                    <span class="detail-label">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                      </svg>
                      Limits:
                    </span>
                    <span class="detail-value">
                      {{ formatAmount(order.minAmount) }} - {{ formatAmount(order.maxAmount) }} {{ order.fiat }}
                    </span>
                  </div>

                  <div class="detail-group">
                    <span class="detail-label">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                        <line x1="1" y1="10" x2="23" y2="10"></line>
                      </svg>
                      Network:
                    </span>
                    <span class="detail-value">{{ order.network }} <span class="network-layer">({{ order.layer }})</span></span>
                  </div>
                </div>

                <div class="payment-methods">
                  <span class="detail-label">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                      <line x1="2" y1="10" x2="22" y2="10"></line>
                    </svg>
                    Payment:
                  </span>
                  <div class="payment-tags">
                    <span v-for="method in order.pm" 
                          :key="method"
                          class="payment-tag">
                      {{ method }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="order-footer">
                <div class="trader-source">
                  <span v-for="source in order.sources" :key="source" class="source-tag">
                    {{ source }}
                  </span>
                </div>
                <button class="select-btn">Select Order</button>
              </div>
            </div>
          </transition-group>
        </div>
      </div>
    </transition>
    
    <transition name="fade">
      <div v-if="selectedCountry && operationType && amount && matchingOrders.length === 0 && !isLoading" class="card no-matches">
        <div class="no-matches-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
        </div>
        <h3>No matching orders found</h3>
        <p>Please try a different amount or check back later.</p>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.trade-flow {
  max-width: 800px;
  margin: 0 auto;
}

.card {
  background-color: var(--card-bg);
  border-radius: 1rem;
  box-shadow: var(--shadow);
  padding: 2rem;
  margin-bottom: 2rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card:hover {
  box-shadow: var(--shadow-md);
}

.form-title {
  margin-top: 0;
  margin-bottom: 1.5rem;
  font-size: 1.75rem;
  color: var(--text-color);
  text-align: center;
}

.title-with-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.title-with-icon.buy {
  color: var(--success-color);
}

.title-with-icon.sell {
  color: var(--danger-color);
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: flex;
  align-items: center;
  margin-bottom: 0.75rem;
  font-weight: 600;
  color: var(--text-color);
  font-size: 1rem;
}

.step-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  background-color: var(--primary-color);
  color: white;
  border-radius: 50%;
  margin-right: 0.75rem;
  font-size: 0.875rem;
}

.select-wrapper {
  position: relative;
}

.select-arrow {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: var(--text-light);
}

.form-control {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  font-size: 1rem;
  background-color: var(--card-bg);
  color: var(--text-color);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-control:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.form-control:disabled {
  background-color: var(--bg-color);
  cursor: not-allowed;
}

.operation-buttons {
  display: flex;
  gap: 1rem;
}

.operation-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  border: 2px solid var(--border-color);
  border-radius: 0.5rem;
  background: var(--card-bg);
  color: var(--text-color);
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.operation-btn:hover {
  border-color: var(--primary-color);
  transform: translateY(-2px);
}

.operation-btn.active {
  border-color: var(--primary-color);
  background: var(--primary-color);
  color: white;
  transform: translateY(-2px);
}

.amount-input {
  position: relative;
}

.currency-badge {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background-color: var(--bg-color);
  color: var(--text-light);
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.search-btn {
  width: 100%;
  padding: 1rem;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 1.125rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
}

.search-btn:hover:not(:disabled) {
  background-color: var(--primary-dark);
  transform: translateY(-2px);
}

.search-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-loading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.spinner {
  animation: rotate 2s linear infinite;
  width: 1.25rem;
  height: 1.25rem;
}

.spinner .path {
  stroke: white;
  stroke-linecap: round;
  animation: dash 1.5s ease-in-out infinite;
}

@keyframes rotate {
  100% {
    transform: rotate(360deg);
  }
}

@keyframes dash {
  0% {
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -124;
  }
}

.orders-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.orders-header h3 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--text-color);
}

.orders-filter {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-label {
  color: var(--text-light);
  font-size: 0.875rem;
}

.filter-select {
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 0.25rem;
  font-size: 0.875rem;
  background-color: var(--card-bg);
  color: var(--text-color);
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.order-card {
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  padding: 1.5rem;
  transition: all 0.2s;
  cursor: pointer;
}

.order-card:hover {
  border-color: var(--primary-color);
  transform: translateY(-2px);
  box-shadow: var(--shadow);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.trader-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.trader-avatar {
  width: 3rem;
  height: 3rem;
  background-color: var(--primary-color);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 600;
}

.trader-details {
  display: flex;
  flex-direction: column;
}

.trader-name {
  font-weight: 600;
  font-size: 1.125rem;
  color: var(--text-color);
  margin-bottom: 0.25rem;
}

.trader-stats {
  display: flex;
  gap: 1rem;
  align-items: center;
  color: var(--text-light);
  font-size: 0.875rem;
}

.trader-stats span {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.price-info {
  text-align: right;
}

.price-amount {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 0.25rem;
}

.premium {
  font-size: 0.875rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  display: inline-block;
}

.premium.positive {
  background-color: rgba(16, 185, 129, 0.1);
  color: var(--success-color);
}

.premium.negative {
  background-color: rgba(239, 68, 68, 0.1);
  color: var(--danger-color);
}

.order-details {
  border-top: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
  padding: 1.5rem 0;
  margin-bottom: 1.5rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.detail-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: var(--text-light);
  font-size: 0.875rem;
}

.detail-value {
  color: var(--text-color);
  font-weight: 500;
}

.network-layer {
  color: var(--text-light);
  font-weight: normal;
}

.payment-methods {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.payment-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.payment-tag {
  background: var(--bg-color);
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  color: var(--text-color);
  font-weight: 500;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.trader-source {
  display: flex;
  gap: 0.5rem;
}

.source-tag {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: var(--bg-color);
  border-radius: 9999px;
  font-size: 0.75rem;
  color: var(--text-light);
}

.select-btn {
  background-color: var(--primary-color);
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.select-btn:hover {
  background-color: var(--primary-dark);
}

.no-matches {
  text-align: center;
  padding: 3rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.no-matches-icon {
  color: var(--text-lighter);
  margin-bottom: 1.5rem;
}

.no-matches h3 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  color: var(--text-color);
}

.no-matches p {
  color: var(--text-light);
  margin-bottom: 0;
}

/* Animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(30px);
}

.list-move {
  transition: transform 0.3s ease;
}

@media (max-width: 768px) {
  .card {
    padding: 1.5rem;
  }
  
  .detail-row {
    flex-direction: column;
    gap: 1rem;
  }
  
  .order-footer {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .select-btn {
    width: 100%;
  }
}
</style> 