<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { NostrService } from './services/NostrService';
import TradeFlow from './components/TradeFlow.vue';

const error = ref<string | null>(null);
const nostrService = new NostrService();
const isLoading = ref(true);

onMounted(async () => {
  try {
    console.log('Connecting to relays...');
    await nostrService.connect();
    console.log('Connected successfully');
    isLoading.value = false;
  } catch (e) {
    console.error('Connection error:', e);
    error.value = e instanceof Error ? e.message : 'Failed to connect to relays';
    isLoading.value = false;
  }
});
</script>

<template>
  <div class="app">
    <header class="app-header">
      <div class="container header-container">
        <div class="logo">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="logo-icon">
            <path d="M12 3v18m9-9H3m9-9a9 9 0 1 1-9 9 9 9 0 0 1 9-9z" />
            <circle cx="12" cy="12" r="4" />
          </svg>
          <h1>P2P BTC Match</h1>
        </div>
      </div>
    </header>
    
    <main class="main-content">
      <div class="container">
        <div v-if="isLoading" class="loading-container">
          <div class="loading-spinner"></div>
          <p>Connecting to relays...</p>
        </div>
        
        <div v-else-if="error" class="error-container">
          <div class="error-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <div class="error-message">
            <h3>Connection Error</h3>
            <p>{{ error }}</p>
          </div>
          <button class="retry-button">Retry Connection</button>
        </div>

        <TradeFlow 
          v-else
          :orders="nostrService.getOrders()"
        />
      </div>
    </main>
    
    <footer class="app-footer">
      <div class="container">
        <p>&copy; {{ new Date().getFullYear() }} P2P BTC Match. All rights reserved.</p>
      </div>
    </footer>
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
.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  background-color: var(--primary-color);
  color: white;
  padding: 1rem 0;
  box-shadow: var(--shadow);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo-icon {
  width: 2rem;
  height: 2rem;
}

.logo h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.main-nav {
  display: flex;
  gap: 1.5rem;
}

.nav-link {
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 0;
  position: relative;
  transition: color 0.2s ease;
}

.nav-link:hover, .nav-link.active {
  color: white;
}

.nav-link.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: white;
  border-radius: 2px;
}

.main-content {
  flex: 1;
  padding: 2rem 0;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 0;
}

.loading-spinner {
  width: 3rem;
  height: 3rem;
  border: 3px solid rgba(59, 130, 246, 0.2);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-container {
  background-color: #fee2e2;
  border: 1px solid #ef4444;
  border-radius: 0.75rem;
  padding: 2rem;
  margin: 2rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.error-icon {
  color: var(--danger-color);
  margin-bottom: 1rem;
}

.error-icon svg {
  width: 3rem;
  height: 3rem;
  stroke-width: 1.5;
}

.error-message h3 {
  color: #991b1b;
  margin-bottom: 0.5rem;
}

.error-message p {
  color: #b91c1c;
  margin-bottom: 1.5rem;
}

.retry-button {
  background-color: var(--danger-color);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.retry-button:hover {
  background-color: #b91c1c;
}

.app-footer {
  background-color: var(--card-bg);
  border-top: 1px solid var(--border-color);
  padding: 1.5rem 0;
  color: var(--text-light);
  text-align: center;
  font-size: 0.875rem;
}
</style>