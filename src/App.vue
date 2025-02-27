<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { NostrService } from './services/NostrService';
import TradeFlow from './components/TradeFlow.vue';

const error = ref<string | null>(null);
const nostrService = new NostrService();

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
</script>

<template>
  <div>
    <header class="app-header">
      <h1>P2P Bitcoin Marketplace</h1>
    </header>
    
    <div class="container">      
      <div v-if="error" class="error">
        {{ error }}
      </div>

      <TradeFlow 
        :orders="nostrService.getOrders()"
      />
    </div>
  </div>
</template>

<style>
:root {
  --primary-color: #3b82f6;
  --success-color: #059669;
  --danger-color: #dc2626;
  --warning-color: #d97706;
  --text-color: #1f2937;
  --text-light: #6b7280;
  --bg-color: #f3f4f6;
  --card-bg: #ffffff;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  background-color: var(--bg-color);
  color: var(--text-color);
  margin: 0;
  padding: 0;
  line-height: 1.5;
}

* {
  box-sizing: border-box;
}
</style>

<style scoped>
.app-header {
  background-color: var(--primary-color);
  color: white;
  padding: 1rem 0;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.app-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

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
</style>