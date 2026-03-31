<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { v4 as uuid } from 'uuid'
import { db } from '../db'
import { liveQuery } from 'dexie'
import { useObservable } from '../composables/useObservable'
import { useCurrentUser } from '../composables/useCurrentUser'
import type { Category, TransactionTemplate } from '../db/types'
import CategoryIcon from '../components/CategoryIcon.vue'

const router = useRouter()
const { userId } = useCurrentUser()

// Tab state
type TabType = 'expense' | 'income'
const activeTab = ref<TabType>('expense')

// Form state
const amount = ref('')
const selectedCategoryId = ref<string | null>(null)
const note = ref('')
const isSubmitting = ref(false)

// Default date to today (YYYY-MM-DD)
const today = new Date()
const transactionDate = ref(
  `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
)

// Reset category when switching tabs
watch(activeTab, () => {
  selectedCategoryId.value = null
  categorySearch.value = ''
})

// Categories
const categories = useObservable<Category[]>(
  computed(() =>
    liveQuery(async () => {
      const all = await db.categories.toArray()
      return all.sort((a, b) => a.sort_order - b.sort_order)
    })
  ),
  []
)

const categorySearch = ref('')

const filteredCategories = computed(() => {
  const keyword = categorySearch.value.trim().toLowerCase()
  return categories.value.filter((c) => {
    if (c.type !== activeTab.value || c.is_archived) return false
    if (keyword && !c.name.toLowerCase().includes(keyword)) return false
    return true
  })
})

// Templates
const templates = useObservable<TransactionTemplate[]>(
  computed(() =>
    liveQuery(async () => {
      const all = await db.transaction_templates.toArray()
      return all.sort((a, b) => a.sort_order - b.sort_order)
    })
  ),
  []
)

const filteredTemplates = computed(() =>
  templates.value.filter((t) => t.category_type === activeTab.value)
)

const categoryMap = computed(() => {
  const map = new Map<string, Category>()
  for (const c of categories.value) map.set(c.id, c)
  return map
})

const applyTemplate = (t: TransactionTemplate) => {
  amount.value = String(t.amount)
  selectedCategoryId.value = t.category_id
  note.value = t.note
}

const formatShortAmount = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toLocaleString('vi-VN') + 'tr'
  if (n >= 1_000) return (n / 1_000).toLocaleString('vi-VN') + 'k'
  return String(n)
}

// Amount handling
const onAmountInput = (e: Event) => {
  const input = e.target as HTMLInputElement
  amount.value = input.value.replace(/\D/g, '')
}

const formattedAmount = computed(() => {
  const num = Number(amount.value)
  if (!num) return '0đ'
  return num.toLocaleString('vi-VN') + 'đ'
})

// Validation
const canSubmit = computed(() => {
  return Number(amount.value) > 0 && selectedCategoryId.value !== null && !isSubmitting.value
})

// Submit
const submit = async () => {
  if (!canSubmit.value) return
  isSubmitting.value = true

  const now = Date.now()
  const date = new Date(transactionDate.value)
  date.setHours(12, 0, 0, 0)

  const category = categories.value.find((c) => c.id === selectedCategoryId.value)

  await db.transactions.put({
    id: uuid(),
    user_id: userId.value,
    category_id: selectedCategoryId.value!,
    category_type: category!.type,
    amount: Number(amount.value),
    note: note.value.trim(),
    transaction_date: date.getTime(),
    tags: [],
    created_at: now,
    updated_at: now,
  })

  router.push('/')
}
</script>

<template>
  <div>
    <!-- Tabs -->
    <div class="flex bg-surface-high rounded-DEFAULT p-1 mb-5">
      <button
        @click="activeTab = 'expense'"
        class="flex-1 py-2 rounded-sm text-label-md font-semibold transition-all"
        :class="activeTab === 'expense' ? 'bg-surface-lowest text-text shadow-sm' : 'text-text-muted'"
      >
        Chi
      </button>
      <button
        @click="activeTab = 'income'"
        class="flex-1 py-2 rounded-sm text-label-md font-semibold transition-all"
        :class="activeTab === 'income' ? 'bg-surface-lowest text-text shadow-sm' : 'text-text-muted'"
      >
        Thu
      </button>
    </div>

    <!-- Quick templates -->
    <div v-if="filteredTemplates.length" class="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1">
      <button
        v-for="t in filteredTemplates"
        :key="t.id"
        @click="applyTemplate(t)"
        class="flex items-center gap-1.5 bg-surface-lowest rounded-full px-3 py-1.5 shadow-sm shrink-0 transition-all active:scale-95"
      >
        <CategoryIcon :name="categoryMap.get(t.category_id)?.icon ?? 'fluent-emoji-flat:white-question-mark'" :size="18" />
        <span class="text-label-md font-medium text-text whitespace-nowrap">{{ t.note || categoryMap.get(t.category_id)?.name }}</span>
        <span class="text-label-md font-bold whitespace-nowrap" :class="t.category_type === 'expense' ? 'text-expense' : 'text-income'">{{ formatShortAmount(t.amount) }}</span>
      </button>
    </div>

    <!-- Amount -->
    <div class="bg-surface-lowest rounded-DEFAULT p-5 shadow-sm text-center mb-5">
      <input
        :value="amount"
        @input="onAmountInput"
        type="text"
        inputmode="numeric"
        placeholder="0"
        class="w-full text-center text-4xl font-bold outline-none bg-transparent"
        :class="activeTab === 'expense' ? 'text-expense' : 'text-income'"
      />
      <p class="text-label-md text-text-muted mt-1">{{ formattedAmount }}</p>
    </div>

    <!-- Category picker -->
    <p class="text-body-lg font-semibold text-text mb-3">Danh mục</p>
    <input
      v-model="categorySearch"
      type="text"
      placeholder="Tìm danh mục..."
      class="w-full bg-surface-low rounded-input px-4 py-2 text-body-lg text-text outline-none focus:bg-surface-lowest focus:ring-1 focus:ring-ghost-border transition-colors mb-3"
    />
    <div class="max-h-48 overflow-y-auto rounded-DEFAULT mb-5">
      <div class="grid grid-cols-4 gap-2">
        <button
          v-for="cat in filteredCategories"
          :key="cat.id"
          @click="selectedCategoryId = cat.id"
          class="bg-surface-lowest rounded-DEFAULT p-2 shadow-sm flex flex-col items-center gap-1 transition-all"
          :class="selectedCategoryId === cat.id ? 'ring-2 ring-income scale-95' : ''"
        >
          <CategoryIcon :name="cat.icon" :size="28" />
          <span class="text-[0.625rem] font-medium text-text text-center truncate w-full">{{ cat.name }}</span>
        </button>
      </div>
    </div>

    <!-- Date -->
    <div class="mb-4">
      <p class="text-label-md text-text-muted font-medium mb-2">Ngày</p>
      <input
        v-model="transactionDate"
        type="date"
        class="w-full bg-surface-low rounded-input px-4 py-3 text-body-lg text-text outline-none focus:bg-surface-lowest focus:ring-1 focus:ring-ghost-border transition-colors"
      />
    </div>

    <!-- Note -->
    <div class="mb-5">
      <p class="text-label-md text-text-muted font-medium mb-2">Ghi chú</p>
      <textarea
        v-model="note"
        rows="2"
        placeholder="Thêm ghi chú (không bắt buộc)"
        class="w-full bg-surface-low rounded-input px-4 py-3 text-body-lg text-text outline-none focus:bg-surface-lowest focus:ring-1 focus:ring-ghost-border transition-colors resize-none"
      />
    </div>

    <!-- Submit -->
    <button
      @click="submit"
      :disabled="!canSubmit"
      class="w-full py-3.5 rounded-DEFAULT text-body-lg font-semibold text-text-inverse bg-primary transition-colors hover:bg-primary-light disabled:opacity-40"
    >
      {{ isSubmitting ? 'Đang lưu...' : 'Lưu giao dịch' }}
    </button>
  </div>
</template>
