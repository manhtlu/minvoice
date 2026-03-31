<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppHeader from './components/AppHeader.vue'
import BottomNav from './components/BottomNav.vue'
</script>

<template>
  <div class="min-h-screen bg-[#eef6ee] max-w-lg mx-auto relative">
    <AppHeader />

    <main class="px-5 py-4 pb-24">
      <RouterView />
    </main>

    <BottomNav />
  </div>
</template>
