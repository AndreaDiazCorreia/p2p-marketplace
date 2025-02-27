<script setup lang="ts">
import { computed } from 'vue';
import type { Order } from '../types/Order';

const props = defineProps<{
  orders: Order[];
  isLoggedIn: boolean;
  userPubkey?: string;
}>();

const myOrders = computed(() => {
  if (!props.userPubkey) return [];
  
  return props.orders
    .filter(order => order.pubkey === props.userPubkey)
    .sort((a, b) => b.created_at - a.created_at);
});

function formatAmount(amount: string): string {
  return parseFloat(amount).toFixed(8);
}

function formatPrice(price: string): string {
  return parseFloat(price).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString();
}
</script>

<template>
  <div class="my-orders">
    <template v-if="isLoggedIn">
      <div class="my-orders-header">
        <h2>My Orders</h2>
      </div>

      <div v-if="myOrders.length" class="orders-grid">
        <div v-for="order in myOrders" 
             :key="order.id" 
             class="order-card"
        >
          <div class="order-header">
            <span class="order-type">{{ order.side.toUpperCase() }}</span>
          </div>
          <div class="order-details">
            <div class="detail-row">
              <span class="label">Amount:</span>
              <span class="value">{{ formatAmount(order.amount) }} BTC</span>
            </div>
            <div class="detail-row">
              <span class="label">Price:</span>
              <span class="value">{{ formatPrice(order.price) }} {{ order.fiat }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Created:</span>
              <span class="value">{{ formatDate(order.created_at) }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="no-orders">
        <span class="material-icons">history</span>
        <p>No active orders found</p>
      </div>
    </template>

    <div v-else class="login-required">
      <span class="material-icons">lock</span>
      <h3>Login Required</h3>
      <p>Please login with your private key to view your orders</p>
      <button @click="$emit('login')" class="login-button">
        Login Now
      </button>
    </div>
  </div>
</template>

<style scoped>
.my-orders {
  background-color: #f8fafc;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}

.my-orders-header {
  margin-bottom: 2rem;
}

.orders-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}

.order-card {
  background: white;
  border-radius: 0.5rem;
  padding: 1rem;
  border: 1px solid #e2e8f0;
}

.order-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.order-type {
  font-weight: 600;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.detail-row .label {
  color: #64748b;
}

.detail-row .value {
  font-weight: 500;
}

.login-required {
  text-align: center;
  padding: 3rem;
}

.login-required .material-icons {
  font-size: 3rem;
  color: #64748b;
  margin-bottom: 1rem;
}

.login-button {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
}

.no-orders {
  text-align: center;
  padding: 2rem;
  color: #64748b;
}

.no-orders .material-icons {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}
</style> 