<script setup lang="ts">
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import { Icon } from '@iconify/vue'

const route = useRoute()

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    home: 'Sổ Thu Chi',
    transactions: 'Giao dịch',
    categories: 'Danh mục',
    stats: 'Thống kê',
    budgets: 'Ngân sách',
    templates: 'Mẫu giao dịch',
    settings: 'Cài đặt',
  }
  return titles[route.name as string] ?? 'minvoice'
})
</script>

<template>
  <header class="sticky top-0 z-10 bg-[#ecfdf5] px-5 py-4 flex items-center justify-between">
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 flex items-center justify-center">
        <Icon icon="fluent-emoji-flat:boy-light" width="32" height="32" />
      </div>
      <h1 class="text-title-md font-bold text-[#006c49]">{{ pageTitle }}</h1>
    </div>
  </header>
</template>
