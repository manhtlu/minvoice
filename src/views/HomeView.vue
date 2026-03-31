<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { db } from '../db'
import { liveQuery } from 'dexie'
import { useObservable } from '../composables/useObservable'
import { useCurrentUser } from '../composables/useCurrentUser'
import type { Transaction, Category, Budget } from '../db/types'
import CategoryIcon from '../components/CategoryIcon.vue'

const { userId } = useCurrentUser()

// Month navigation
const now = new Date()
const currentYear = ref(now.getFullYear())
const currentMonth = ref(now.getMonth()) // 0-based

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

// Date range for current month
const monthStart = computed(() => new Date(currentYear.value, currentMonth.value, 1).getTime())
const monthEnd = computed(() => new Date(currentYear.value, currentMonth.value + 1, 0, 23, 59, 59, 999).getTime())

// Data queries
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
  for (const c of categories.value) {
    map.set(c.id, c)
  }
  return map
})

// Summary
const totalIncome = computed(() =>
  transactions.value
    .filter((t) => t.category_type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
)

const totalExpense = computed(() =>
  transactions.value
    .filter((t) => t.category_type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
)

// Expense by category (top 3)
const expenseByCategory = computed(() => {
  const map = new Map<string, number>()
  for (const t of transactions.value) {
    if (t.category_type !== 'expense') continue
    map.set(t.category_id, (map.get(t.category_id) ?? 0) + t.amount)
  }

  const sorted = [...map.entries()]
    .map(([catId, amount]) => ({
      category: categoryMap.value.get(catId),
      amount,
      percent: totalExpense.value > 0 ? Math.round((amount / totalExpense.value) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount)

  return sorted.slice(0, 3)
})

// Donut chart segments
const donutSegments = computed(() => {
  const colors = expenseByCategory.value.map((e) => e.category?.color ?? '#ccc')
  const percents = expenseByCategory.value.map((e) => e.percent)

  // Remaining percent for "other"
  const used = percents.reduce((s, p) => s + p, 0)
  if (used < 100) {
    percents.push(100 - used)
    colors.push('#E5E7EB')
  }

  let offset = 0
  return percents.map((p, i) => {
    const segment = { percent: p, offset, color: colors[i] }
    offset += p
    return segment
  })
})

// Budgets (fixed, not per-month)
const budgets = useObservable<Budget[]>(
  computed(() =>
    liveQuery(async () => {
      const all = await db.budgets.toArray()
      return all.filter((b) => b.user_id === userId.value)
    })
  ),
  []
)

// Expense totals per category for budget comparison
const expenseByCategoryMap = computed(() => {
  const map = new Map<string, number>()
  for (const t of transactions.value) {
    if (t.category_type !== 'expense') continue
    map.set(t.category_id, (map.get(t.category_id) ?? 0) + t.amount)
  }
  return map
})

const budgetItems = computed(() => {
  return budgets.value
    .map((b) => {
      const spent = b.category_id ? (expenseByCategoryMap.value.get(b.category_id) ?? 0) : totalExpense.value
      const category = b.category_id ? categoryMap.value.get(b.category_id) : null
      const name = category?.name ?? 'Tổng chi tiêu'
      const percent = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0
      return { ...b, spent, name, category, percent, exceeded: spent > b.amount }
    })
    .slice(0, 5)
})

// Recent transactions (last 5)
const recentTransactions = computed(() => transactions.value.slice(0, 5))

// Formatting
const formatCurrency = (amount: number) => {
  return amount.toLocaleString('vi-VN') + 'đ'
}

const formatAmount = (t: Transaction) => {
  const prefix = t.category_type === 'income' ? '+' : '-'
  return `${prefix}${t.amount.toLocaleString('vi-VN')}đ`
}

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  const time = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })

  if (date.toDateString() === today.toDateString()) return `Hôm nay, ${time}`
  if (date.toDateString() === yesterday.toDateString()) return `Hôm qua, ${time}`
  return `${date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}, ${time}`
}
</script>

<template>
  <div class="space-y-5">
    <!-- Month selector -->
    <div class="flex items-center justify-between">
      <button
        @click="prevMonth"
        class="w-8 h-8 rounded-full bg-surface-lowest shadow-sm flex items-center justify-center text-text-muted hover:text-text transition-colors"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>

      <span class="text-body-lg font-semibold text-text capitalize">{{ monthLabel }}</span>

      <button
        @click="nextMonth"
        :disabled="isCurrentMonth"
        class="w-8 h-8 rounded-full bg-surface-lowest shadow-sm flex items-center justify-center transition-colors"
        :class="isCurrentMonth ? 'text-text-muted/30 cursor-not-allowed' : 'text-text-muted hover:text-text'"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </button>
    </div>

    <!-- Summary cards -->
    <div class="grid grid-cols-2 gap-3">
      <!-- Income card -->
      <div class="bg-primary rounded-DEFAULT p-4 relative overflow-hidden">
        <div class="relative z-10">
          <p class="text-label-md text-text-inverse/70 font-medium mb-1">Tổng Thu</p>
          <p class="text-title-md font-bold text-text-inverse">{{ formatCurrency(totalIncome) }}</p>
          <p class="text-[0.625rem] text-text-inverse/50 mt-1">VNĐ - Tháng này</p>
        </div>
        <svg class="absolute right-2 top-2 w-8 h-8 text-text-inverse/15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
        </svg>
      </div>
      <!-- Expense card -->
      <div class="bg-expense rounded-DEFAULT p-4 relative overflow-hidden">
        <div class="relative z-10">
          <p class="text-label-md text-text-inverse/70 font-medium mb-1">Tổng Chi</p>
          <p class="text-title-md font-bold text-text-inverse">{{ formatCurrency(totalExpense) }}</p>
          <p class="text-[0.625rem] text-text-inverse/50 mt-1">VNĐ - Tháng này</p>
        </div>
        <svg class="absolute right-2 top-2 w-8 h-8 text-text-inverse/15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181" />
        </svg>
      </div>
    </div>

    <!-- Expense by category -->
    <section class="bg-surface-lowest rounded-DEFAULT p-4 shadow-sm">
      <p class="text-body-lg font-semibold text-text mb-4">Chi tiêu theo hạng mục</p>
      <div class="flex items-center gap-5">
        <!-- Legend -->
        <div class="flex-1 space-y-2.5">
          <div
            v-for="item in expenseByCategory"
            :key="item.category?.id"
            class="flex items-center gap-2"
          >
            <span
              class="w-2.5 h-2.5 rounded-full shrink-0"
              :style="{ backgroundColor: item.category?.color }"
            />
            <span class="text-label-md text-text-muted truncate">
              {{ item.category?.name }} ({{ item.percent }}%)
            </span>
          </div>
          <div v-if="expenseByCategory.length === 0" class="text-label-md text-text-muted">
            Chưa có dữ liệu
          </div>
        </div>

        <!-- Donut chart -->
        <div class="w-20 h-20 shrink-0">
          <svg viewBox="0 0 36 36" class="w-full h-full -rotate-90">
            <circle cx="18" cy="18" r="14" fill="none" stroke="#E5E7EB" stroke-width="5" />
            <circle
              v-for="(seg, i) in donutSegments"
              :key="i"
              cx="18" cy="18" r="14"
              fill="none"
              :stroke="seg.color"
              stroke-width="5"
              :stroke-dasharray="`${seg.percent * 0.88} ${88 - seg.percent * 0.88}`"
              :stroke-dashoffset="`${-seg.offset * 0.88}`"
              stroke-linecap="round"
            />
          </svg>
        </div>
      </div>
    </section>

    <!-- Budgets -->
    <section>
      <div class="flex items-center justify-between mb-3">
        <p class="text-body-lg font-semibold text-text">Ngân sách</p>
        <RouterLink to="/budgets" class="text-label-md text-income font-medium">Xem tất cả</RouterLink>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div
          v-for="b in budgetItems"
          :key="b.id"
          class="bg-surface-lowest rounded-DEFAULT p-3 shadow-sm"
        >
          <div class="flex items-center gap-2 mb-1">
            <CategoryIcon
              :name="b.category?.icon ?? 'fluent-emoji-flat:white-question-mark'"
              :size="20"
            />
            <p class="text-label-md font-medium text-text truncate">{{ b.name }}</p>
          </div>
          <p
            class="text-label-md font-semibold mb-2"
            :class="b.exceeded ? 'text-expense' : 'text-income'"
          >
            {{ formatCurrency(b.spent) }} / {{ formatCurrency(b.amount) }}
          </p>
          <div class="h-1.5 rounded-full bg-surface-high overflow-hidden">
            <div
              class="h-full rounded-full transition-all"
              :class="b.exceeded ? 'bg-expense' : 'bg-income'"
              :style="{ width: Math.min(b.percent, 100) + '%' }"
            />
          </div>
        </div>

        <div v-if="budgetItems.length === 0" class="col-span-2 text-center py-4 bg-surface-lowest rounded-DEFAULT shadow-sm">
          <p class="text-text-muted text-label-md">Chưa thiết lập ngân sách</p>
        </div>
      </div>
    </section>

    <!-- Recent transactions -->
    <section>
      <div class="flex items-center justify-between mb-3">
        <p class="text-body-lg font-semibold text-text">Giao dịch gần đây</p>
        <RouterLink to="/transactions" class="text-label-md text-income font-medium">Xem tất cả</RouterLink>
      </div>

      <div class="space-y-3">
        <div
          v-for="t in recentTransactions"
          :key="t.id"
          class="bg-surface-lowest rounded-DEFAULT p-4 shadow-sm flex items-center gap-3"
        >
          <!-- Category icon -->
          <div
            class="w-10 h-10 rounded-input flex items-center justify-center shrink-0"
          >
            <CategoryIcon
              :name="categoryMap.get(t.category_id)?.icon ?? 'fluent-emoji-flat:white-question-mark'"
              :size="28"
            />
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <p class="text-body-lg font-semibold text-text truncate">{{ t.note || categoryMap.get(t.category_id)?.name }}</p>
            <p class="text-label-md text-text-muted">Hạng mục: {{ categoryMap.get(t.category_id)?.name }}</p>
          </div>

          <!-- Amount & date -->
          <div class="text-right shrink-0">
            <p
              class="text-body-lg font-bold"
              :class="t.category_type === 'income' ? 'text-income' : 'text-expense'"
            >
              {{ formatAmount(t) }}
            </p>
            <p class="text-label-md text-text-muted">{{ formatDate(t.transaction_date) }}</p>
          </div>
        </div>

        <div v-if="recentTransactions.length === 0" class="bg-surface-lowest rounded-DEFAULT p-6 shadow-sm text-center">
          <p class="text-text-muted">Chưa có giao dịch nào</p>
        </div>
      </div>
    </section>
  </div>
</template>
