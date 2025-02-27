<script setup lang="ts">
const props = defineProps<{
  currentView: string;
}>();

const routes = [
  { name: 'Order Book', path: 'orderbook' },
  { name: 'My Orders', path: 'myorders' },
  { name: 'Help', path: 'help' }
];

const emit = defineEmits<{
  (e: 'navigate', view: string): void;
  (e: 'logout'): void;
}>();
</script>

<template>
  <nav class="navbar">
    <div class="nav-brand">P2P Bitcoin Marketplace</div>
    <div class="nav-links">
      <a 
        v-for="route in routes" 
        :key="route.name"
        @click.prevent="emit('navigate', route.path)"
        :class="['nav-link', { active: props.currentView === route.path }]"
      >
        {{ route.name }}
      </a>
      <button @click.prevent="emit('logout')" class="logout-button">Logout</button>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  background-color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.1);
  margin-bottom: 2rem;
}

.nav-brand {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
}

.nav-links {
  display: flex;
  gap: 2rem;
}

.nav-link {
  color: #64748b;
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 0;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.nav-link:hover, .nav-link.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

.nav-link.active {
  font-weight: bold;
  color: #3b82f6;
}

.logout-button {
  background-color: #dc2626;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  cursor: pointer;
  margin-left: 1rem;
}

.logout-button:hover {
  background-color: #b91c1c;
}
</style> 