<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { NostrService } from './services/NostrService';
import TradeFlow from './components/TradeFlow.vue';
import type { Order } from './types/Order';

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
</style>