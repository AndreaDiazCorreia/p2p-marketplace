<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Order } from '../types/Order';

const props = defineProps<{
  orders: Order[];
  isLoggedIn: boolean;
  userPubkey?: string;
}>();

const statusFilter = ref<string>('all');

const myOrders = computed(() => {
  if (!props.userPubkey) return [];
  
  return props.orders.filter(order => order.pubkey === props.userPubkey)
    .sort((a, b) => b.created_at - a.created_at);
});

const filteredOrders = computed(() => {
  if (statusFilter.value === 'all') return myOrders.value;
  return myOrders.value.filter(order => order.status === statusFilter.value);
});

const orderStats = computed(() => ({
  total: myOrders.value.length,
  pending: myOrders.value.filter(o => o.status === 'pending').length,
  completed: myOrders.value.filter(o => o.status === 'completed').length,
  cancelled: myOrders.value.filter(o => o.status === 'cancelled').length
}));

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
        <div class="order-filters">
          <button 
            v-for="status in ['all', 'pending', 'completed', 'cancelled']" 
            :key="status"
            :class="['filter-button', { active: statusFilter === status }]"
            @click="statusFilter = status"
          >
            {{ status.charAt(0).toUpperCase() + status.slice(1) }}
            <span class="count">
              {{ status === 'all' ? orderStats.total : orderStats[status] }}
            </span>
          </button>
        </div>
      </div>

      <div v-if="filteredOrders.length" class="orders-grid">
        <div v-for="order in filteredOrders" 
             :key="order.id" 
             :class="['order-card', order.status, order.side]">
          <div class="order-header">
            <span class="order-type">{{ order.side.toUpperCase() }}</span>
            <span :class="['order-status', order.status]">
              {{ order.status }}
            </span>
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
        <p>No orders found for the selected filter</p>
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

.order-filters {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.filter-button {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-button.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.count {
  background: rgba(0, 0, 0, 0.1);
  padding: 0.25rem 0.5rem;
  border-radius: 1rem;
  font-size: 0.875rem;
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

/* ... resto de los estilos para las cards y estados ... */
</style> 