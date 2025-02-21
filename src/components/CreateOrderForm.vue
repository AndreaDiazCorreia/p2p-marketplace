<script setup lang="ts">
import { ref } from 'vue';
import type { Order } from '../types/Order';

const emit = defineEmits<{
  (e: 'submit', order: Omit<Order, 'id' | 'pubkey' | 'created_at'>): void;
}>();

const side = ref<'buy' | 'sell'>('buy');
const fiat = ref('USD');
const amount = ref('0.001');
const price = ref('');
const status = ref('pending');

const currencies = ['USD', 'EUR', 'BRL', 'ARS', 'MXN'];

function handleSubmit() {
  emit('submit', {
    side: side.value,
    fiat: fiat.value,
    amount: amount.value,
    price: price.value,
    status: status.value
  });

  // Reset form
  price.value = '';
}
</script>

<template>
  <div class="create-order-form">
    <h2 class="form-title">Create New Order</h2>
    <form @submit.prevent="handleSubmit" class="form-content">
      <div class="form-group">
        <label>Type:</label>
        <div class="button-group">
          <button
            type="button"
            :class="['side-button', { active: side === 'buy' }]"
            @click="side = 'buy'"
          >
            Buy
          </button>
          <button
            type="button"
            :class="['side-button', { active: side === 'sell' }]"
            @click="side = 'sell'"
          >
            Sell
          </button>
        </div>
      </div>

      <div class="form-group">
        <label for="amount">Amount (BTC):</label>
        <input
          id="amount"
          v-model="amount"
          type="number"
          step="0.00001"
          min="0.00001"
          required
          class="form-input"
        />
      </div>

      <div class="form-group">
        <label for="price">Price per BTC:</label>
        <input
          id="price"
          v-model="price"
          type="number"
          step="0.01"
          min="0"
          required
          class="form-input"
        />
      </div>

      <div class="form-group">
        <label for="fiat">Currency:</label>
        <select id="fiat" v-model="fiat" class="form-select">
          <option v-for="currency in currencies" :key="currency" :value="currency">
            {{ currency }}
          </option>
        </select>
      </div>

      <button type="submit" class="submit-button" :class="side">
        Create {{ side === 'buy' ? 'Buy' : 'Sell' }} Order
      </button>
    </form>
  </div>
</template>

<style scoped>
.create-order-form {
  background-color: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.form-title {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  color: #1f2937;
}

.form-content {
  display: grid;
  gap: 1rem;
}

.form-group {
  display: grid;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: #374151;
}

.button-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.side-button {
  padding: 0.5rem;
  border: 2px solid #e5e7eb;
  background-color: white;
  color: #374151;
  font-weight: 500;
  transition: all 0.2s;
}

.side-button.active {
  border-color: currentColor;
}

.side-button.active:first-child {
  color: #059669;
  background-color: #d1fae5;
}

.side-button.active:last-child {
  color: #dc2626;
  background-color: #fee2e2;
}

.form-input,
.form-select {
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  width: 100%;
  font-size: 1rem;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px #bfdbfe;
}

.submit-button {
  margin-top: 1rem;
  padding: 0.75rem;
  border: none;
  border-radius: 0.375rem;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.submit-button.buy {
  background-color: #059669;
}

.submit-button.buy:hover {
  background-color: #047857;
}

.submit-button.sell {
  background-color: #dc2626;
}

.submit-button.sell:hover {
  background-color: #b91c1c;
}
</style>