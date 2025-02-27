<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Order } from '../types/Order';

const props = defineProps<{
  orders: Order[];
}>();

const selectedCountry = ref('');
const operationType = ref(''); // 'buy' or 'sell'
const amount = ref('');

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

  // Filtrar órdenes
  const filteredOrders = props.orders.filter(order => {
    // Verificar status pending
    const isPending = order.status === 'pending';
    
    // Verificar moneda y tipo de operación
    const isMatchingCurrency = order.fiat === selectedCurrency.value;
    const isOppositeType = (operationType.value === 'buy' && order.side === 'sell') ||
                          (operationType.value === 'sell' && order.side === 'buy');

    // Verificar rango de montos
    const requestedAmount = parseFloat(amount.value);
    const min = parseFloat(order.minAmount);
    const max = parseFloat(order.maxAmount);
    const isWithinRange = requestedAmount >= min && requestedAmount <= max;

    return isPending && isMatchingCurrency && isOppositeType && isWithinRange;
  });

  // Ordenar por mejor precio
  return filteredOrders
    .sort((a, b) => {
      const priceA = parseFloat(a.price);
      const priceB = parseFloat(b.price);
      // Para compras, ordenar de menor a mayor precio
      // Para ventas, ordenar de mayor a menor precio
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
</script>

<template>
  <div class="trade-flow">
    <div class="trade-form">
      <h2>{{ operationType === 'buy' ? 'BUY BITCOIN' : operationType === 'sell' ? 'SELL BITCOIN' : 'Find Orders' }}</h2>
      
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

    <!-- Matching Orders -->
    <div v-if="matchingOrders.length > 0" class="matching-orders">
      <h3>Available Orders ({{ matchingOrders.length }})</h3>
      <div class="orders-list">
        <div v-for="order in matchingOrders" 
             :key="order.id" 
             class="order-card"
        >
          <div class="order-header">
            <div class="trader-info">
              <div class="trader-name">{{ order.name || 'Anonymous' }}</div>
              <div class="trader-stats">
                <span class="reviews">{{ order.trades }} trades</span>
                <span class="completion">{{ order.completion.toFixed(0) }}% completion</span>
              </div>
              <div class="trader-source">
                <span v-for="source in order.sources" :key="source" class="source-tag">
                  {{ source }}
                </span>
              </div>
            </div>
            <div class="price-info">
              <div class="price-amount">{{ formatPrice(order.price) }} {{ order.fiat }}</div>
              <div class="premium">{{ calculatePremium(order.premium) }}</div>
            </div>
          </div>

          <div class="order-details">
            <div class="detail-group">
              <span class="detail-label">Limits:</span>
              <span class="detail-value">
                {{ formatAmount(order.minAmount) }} - {{ formatAmount(order.maxAmount) }} {{ order.fiat }}
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

            <div class="detail-group">
              <span class="detail-label">Network:</span>
              <span class="detail-value">{{ order.network }} ({{ order.layer }})</span>
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

.trader-name {
  font-weight: 600;
  font-size: 1.2rem;
  color: #1f2937;
}

.trader-stats {
  display: flex;
  gap: 1rem;
  align-items: center;
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
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.premium {
  font-size: 0.875rem;
  color: #059669;
}

.premium:not([class*="+"]) {
  color: #dc2626;
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