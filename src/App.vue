<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { NostrService } from './services/NostrService';
import OrdersDashboard from './components/OrdersDashboard.vue';
import CreateOrderForm from './components/CreateOrderForm.vue';
import type { Order } from './types/Order';
import Navbar from './components/Navbar.vue';
import MyOrders from './components/MyOrders.vue';

const error = ref<string | null>(null);
const showLoginModal = ref(false);
const privateKey = ref<string>('');
const nostrService = new NostrService();
const currentView = ref('orderbook');

// Computed property para las órdenes
const orders = computed(() => nostrService.getOrders());

onMounted(async () => {
  try {
    console.log('Connecting to relays...');
    await nostrService.connect();
    console.log('Connected successfully');
  } catch (e) {
    console.error('Connection error:', e);
    error.value = e instanceof Error ? e.message : 'Failed to connect to relays';
  }
});

async function handleCreateOrder(orderData: Omit<Order, 'id' | 'pubkey' | 'created_at'>) {
  if (!nostrService.isLoggedIn()) {
    showLoginModal.value = true;
    return;
  }
  
  try {
    await nostrService.publishOrder(orderData);
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'An error occurred while creating the order';
  }
}

async function handleLogin() {
  try {
    const key = await nostrService.login(privateKey.value || undefined);
    if (!privateKey.value) {
      privateKey.value = key;
    }
    showLoginModal.value = false;
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to login';
  }
}

function handleLoginClick() {
  showLoginModal.value = true;
}

function handleLogout() {
  nostrService.logout();
  privateKey.value = '';
  showLoginModal.value = false;
  currentView.value = 'orderbook';
}
</script>

<template>
  <div>
    <Navbar @navigate="currentView = $event" @logout="handleLogout" />
    <div class="container">
      <h1>P2P Bitcoin Marketplace</h1>
      
      <div v-if="error" class="error">
        {{ error }}
      </div>

      <component 
        :is="currentView === 'orderbook' ? OrdersDashboard : MyOrders"
        :orders="orders"
        :is-logged-in="nostrService.isLoggedIn()"
        :user-pubkey="nostrService.getUserPubkey()"
        @login="handleLoginClick"
      />

      <CreateOrderForm 
        v-if="currentView === 'orderbook'"
        @submit="handleCreateOrder" 
      />

      <!-- Login Modal -->
      <div v-if="showLoginModal" class="modal">
        <div class="modal-content">
          <h2>Login Required</h2>
          <p>Enter your private key or generate a new one to create orders</p>
          
          <input
            v-model="privateKey"
            type="password"
            placeholder="Enter private key (optional)"
            class="form-input"
          />

          <div class="modal-buttons">
            <button @click="handleLogin" class="primary-button">
              {{ privateKey ? 'Login with Key' : 'Generate New Key' }}
            </button>
            <button @click="showLoginModal = false" class="secondary-button">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.error {
  background-color: #fee2e2;
  border: 1px solid #ef4444;
  color: #991b1b;
  padding: 1rem;
  border-radius: 0.5rem;
  margin: 1rem 0;
}

.success {
  background-color: #dcfce7;
  border: 1px solid #22c55e;
  color: #166534;
  padding: 1rem;
  border-radius: 0.5rem;
  margin: 1rem 0;
}

.login-container {
  margin: 2rem 0;
  text-align: center;
}

.login-button {
  background-color: #3b82f6;
  color: white;
  font-weight: bold;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
}

.login-button:hover {
  background-color: #2563eb;
}

.help-text {
  color: #6b7280;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

.private-key {
  display: block;
  background-color: #f3f4f6;
  padding: 1rem;
  border-radius: 0.5rem;
  font-family: monospace;
  margin: 1rem 0;
  word-break: break-all;
  color: #1f2937;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 0.5rem;
  max-width: 400px;
  width: 90%;
}

.modal-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.primary-button {
  background-color: #3b82f6;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
}

.secondary-button {
  background-color: #e5e7eb;
  color: #374151;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  margin-top: 1rem;
}
</style>