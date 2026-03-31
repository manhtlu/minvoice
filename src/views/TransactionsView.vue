<script setup lang="ts">
import { ref, computed } from 'vue'
import { db } from '../db'
import { liveQuery } from 'dexie'
import { useObservable } from '../composables/useObservable'
import type { Transaction, Category } from '../db/types'
import CategoryIcon from '../components/CategoryIcon.vue'

// Month navigation
const now = new Date()
const currentYear = ref(now.getFullYear())
const currentMonth = ref(now.getMonth())

const isCurrentMonth = computed(() => {
  const n = new Date()
  return currentYear.value === n.getFullYear() && currentMonth.value === n.getMonth()
})

const monthLabel = computed(() => {
  const date = new Date(currentYear.value, currentMonth.value)
  return date.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })
})

const prevMonth = () => {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

const nextMonth = () => {
  if (isCurrentMonth.value) return
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
}

// Date range
const monthStart = computed(() => new Date(currentYear.value, currentMonth.value, 1).getTime())
const monthEnd = computed(() => new Date(currentYear.value, currentMonth.value + 1, 0, 23, 59, 59, 999).getTime())

// Data
const transactions = useObservable<Transaction[]>(
  computed(() => {
    const start = monthStart.value
    const end = monthEnd.value
    return liveQuery(() =>
      db.transactions
        .where('transaction_date')
        .between(start, end, true, true)
        .reverse()
        .toArray()
    )
  }),
  []
)

const categories = useObservable<Category[]>(
  computed(() => liveQuery(() => db.categories.toArray())),
  []
)

const categoryMap = computed(() => {
  const map = new Map<string, Category>()
  for (const c of categories.value) map.set(c.id, c)
  return map
})

// Group by date
interface DayGroup {
  dateLabel: string
  dayTotal: number
  transactions: Transaction[]
}

const groupedTransactions = computed(() => {
  const groups = new Map<string, Transaction[]>()
  for (const t of transactions.value) {
    const key = new Date(t.transaction_date).toDateString()
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(t)
  }

  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  const result: DayGroup[] = []
  for (const [key, txs] of groups) {
    const date = new Date(key)
    let dateLabel: string
    if (date.toDateString() === today.toDateString()) {
      dateLabel = 'Hôm nay'
    } else if (date.toDateString() === yesterday.toDateString()) {
      dateLabel = 'Hôm qua'
    } else {
      dateLabel = date.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' })
    }

    const dayTotal = txs.reduce((s, t) => {
      return s + (t.category_type === 'expense' ? -t.amount : t.amount)
    }, 0)

    result.push({ dateLabel, dayTotal, transactions: txs })
  }
  return result
})

// Formatting
const formatCurrency = (n: number) => n.toLocaleString('vi-VN') + 'đ'

const formatAmount = (t: Transaction) => {
  const prefix = t.category_type === 'income' ? '+' : '-'
  return `${prefix}${t.amount.toLocaleString('vi-VN')}đ`
}
</script>

<template>
  <div>
    <!-- Month nav -->
    <div class="flex items-center justify-between mb-5">
      <button @click="prevMonth" class="w-8 h-8 rounded-full bg-surface-lowest shadow-sm flex items-center justify-center">
        <svg class="w-4 h-4 text-text" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>
      <p class="text-body-lg font-semibold text-text capitalize">{{ monthLabel }}</p>
      <button
        @click="nextMonth"
        :disabled="isCurrentMonth"
        class="w-8 h-8 rounded-full bg-surface-lowest shadow-sm flex items-center justify-center disabled:opacity-30"
      >
        <svg class="w-4 h-4 text-text" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </button>
    </div>

    <!-- Transaction list grouped by date -->
    <div class="space-y-4">
      <div v-for="group in groupedTransactions" :key="group.dateLabel">
        <!-- Day header -->
        <div class="flex items-center justify-between mb-2 px-1">
          <p class="text-label-md font-semibold text-text capitalize">{{ group.dateLabel }}</p>
          <p
            class="text-label-md font-semibold"
            :class="group.dayTotal >= 0 ? 'text-income' : 'text-expense'"
          >
            {{ group.dayTotal >= 0 ? '+' : '' }}{{ formatCurrency(group.dayTotal) }}
          </p>
        </div>

        <!-- Transactions -->
        <div class="space-y-2">
          <div
            v-for="t in group.transactions"
            :key="t.id"
            class="bg-surface-lowest rounded-DEFAULT p-3 shadow-sm flex items-center gap-3"
          >
            <div class="w-10 h-10 rounded-input flex items-center justify-center shrink-0">
              <CategoryIcon
                :name="categoryMap.get(t.category_id)?.icon ?? 'fluent-emoji-flat:white-question-mark'"
                :size="28"
              />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-body-lg font-medium text-text truncate">
                {{ t.note || categoryMap.get(t.category_id)?.name || '—' }}
              </p>
              <p class="text-label-md text-text-muted">{{ categoryMap.get(t.category_id)?.name }}</p>
            </div>
            <p
              class="text-body-lg font-bold shrink-0"
              :class="t.category_type === 'income' ? 'text-income' : 'text-expense'"
            >
              {{ formatAmount(t) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="groupedTransactions.length === 0" class="text-center py-12 text-text-muted text-body-lg">
        Chưa có giao dịch tháng này
      </div>
    </div>
  </div>
</template>
