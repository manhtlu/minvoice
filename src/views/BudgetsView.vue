<script setup lang="ts">
import { ref, computed } from 'vue'
import { v4 as uuid } from 'uuid'
import { db } from '../db'
import { liveQuery } from 'dexie'
import { useObservable } from '../composables/useObservable'
import { useCurrentUser } from '../composables/useCurrentUser'
import type { Category, Budget, Transaction } from '../db/types'
import CategoryIcon from '../components/CategoryIcon.vue'

const { userId } = useCurrentUser()

// Current month spending range
const now = new Date()
const monthStart = computed(() => new Date(now.getFullYear(), now.getMonth(), 1).getTime())
const monthEnd = computed(() => new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).getTime())

// Data
const categories = useObservable<Category[]>(
  computed(() =>
    liveQuery(async () => {
      const all = await db.categories.toArray()
      return all.sort((a, b) => a.sort_order - b.sort_order)
    })
  ),
  []
)

const budgets = useObservable<Budget[]>(
  computed(() =>
    liveQuery(async () => {
      const all = await db.budgets.toArray()
      return all.filter((b) => b.user_id === userId.value)
    })
  ),
  []
)

const transactions = useObservable<Transaction[]>(
  computed(() =>
    liveQuery(() =>
      db.transactions
        .where('transaction_date')
        .between(monthStart.value, monthEnd.value, true, true)
        .toArray()
    )
  ),
  []
)

const categoryMap = computed(() => {
  const map = new Map<string, Category>()
  for (const c of categories.value) map.set(c.id, c)
  return map
})

const expenseByCategoryMap = computed(() => {
  const map = new Map<string, number>()
  for (const t of transactions.value) {
    if (t.category_type !== 'expense') continue
    map.set(t.category_id, (map.get(t.category_id) ?? 0) + t.amount)
  }
  return map
})

const budgetItems = computed(() =>
  budgets.value.map((b) => {
    const spent = b.category_id ? (expenseByCategoryMap.value.get(b.category_id) ?? 0) : 0
    const category = b.category_id ? categoryMap.value.get(b.category_id) : null
    const percent = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0
    return { ...b, spent, category, percent, exceeded: spent > b.amount }
  })
)

// Available categories for new budget (expense, not archived, not yet budgeted)
const budgetedCategoryIds = computed(() => new Set(budgets.value.map((b) => b.category_id)))

const availableCategories = computed(() =>
  categories.value.filter(
    (c) => c.type === 'expense' && !c.is_archived && !budgetedCategoryIds.value.has(c.id)
  )
)

const formatCurrency = (n: number) => n.toLocaleString('vi-VN') + 'đ'

// Add sheet
const showAddSheet = ref(false)
const addCategoryId = ref<string | null>(null)
const addAmount = ref('')
const addCategorySearch = ref('')

const searchedAddCategories = computed(() => {
  const keyword = addCategorySearch.value.trim().toLowerCase()
  return availableCategories.value.filter(
    (c) => !keyword || c.name.toLowerCase().includes(keyword)
  )
})

const openAddSheet = () => {
  addCategoryId.value = null
  addAmount.value = ''
  addCategorySearch.value = ''
  showAddSheet.value = true
}

const onAddAmountInput = (e: Event) => {
  addAmount.value = (e.target as HTMLInputElement).value.replace(/\D/g, '')
}

const canAdd = computed(() => Number(addAmount.value) > 0 && addCategoryId.value !== null)

const saveBudget = async () => {
  if (!canAdd.value || !userId.value) return
  try {
    await db.budgets.put({
      id: uuid(),
      user_id: userId.value,
      category_id: addCategoryId.value!,
      amount: Number(addAmount.value),
      month: '',
      created_at: Date.now(),
    })
  } catch (e) {
    console.error('Failed to save budget:', e)
  }
  showAddSheet.value = false
}

// Edit sheet
const showEditSheet = ref(false)
const editTarget = ref<Budget | null>(null)
const editAmount = ref('')

const openEditSheet = (b: Budget) => {
  editTarget.value = b
  editAmount.value = String(b.amount)
  showEditSheet.value = true
}

const onEditAmountInput = (e: Event) => {
  editAmount.value = (e.target as HTMLInputElement).value.replace(/\D/g, '')
}

const canEdit = computed(() => Number(editAmount.value) > 0)

const saveEdit = async () => {
  if (!editTarget.value || !canEdit.value) return
  await db.budgets.update(editTarget.value.id, { amount: Number(editAmount.value) })
  showEditSheet.value = false
  editTarget.value = null
}

// Delete
const showDeleteConfirm = ref(false)

const openDelete = () => {
  showEditSheet.value = false
  showDeleteConfirm.value = true
}

const confirmDelete = async () => {
  if (!editTarget.value) return
  await db.budgets.delete(editTarget.value.id)
  showDeleteConfirm.value = false
  editTarget.value = null
}
</script>

<template>
  <div>
    <!-- Budget list -->
    <div class="space-y-3 mb-5">
      <div
        v-for="b in budgetItems"
        :key="b.id"
        @click="openEditSheet(b)"
        class="bg-surface-lowest rounded-DEFAULT p-4 shadow-sm cursor-pointer transition-shadow hover:shadow active:shadow-sm"
      >
        <div class="flex items-center gap-3 mb-2">
          <CategoryIcon
            :name="b.category?.icon ?? 'fluent-emoji-flat:white-question-mark'"
            :size="28"
          />
          <p class="text-body-lg font-semibold text-text flex-1 truncate">{{ b.category?.name ?? '—' }}</p>
          <p class="text-label-md font-bold" :class="b.exceeded ? 'text-expense' : 'text-text-muted'">
            {{ b.percent }}%
          </p>
        </div>
        <div class="flex items-center justify-between mb-2">
          <p class="text-label-md" :class="b.exceeded ? 'text-expense font-semibold' : 'text-text-muted'">
            {{ formatCurrency(b.spent) }}
          </p>
          <p class="text-label-md text-text-muted">{{ formatCurrency(b.amount) }}</p>
        </div>
        <div class="h-2 rounded-full bg-surface-high overflow-hidden">
          <div
            class="h-full rounded-full transition-all"
            :class="b.exceeded ? 'bg-expense' : 'bg-income'"
            :style="{ width: Math.min(b.percent, 100) + '%' }"
          />
        </div>
      </div>

      <div v-if="budgetItems.length === 0" class="text-center py-8 text-text-muted text-body-lg">
        Chưa thiết lập ngân sách tháng này
      </div>
    </div>

    <!-- Add button -->
    <button
      v-if="availableCategories.length > 0"
      @click="openAddSheet"
      class="w-full py-3 rounded-DEFAULT text-body-lg font-semibold text-text-inverse bg-primary transition-colors hover:bg-primary-light"
    >
      Thêm ngân sách
    </button>
  </div>

  <!-- Add budget bottom sheet -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="showAddSheet" class="fixed inset-0 z-50" @click.self="showAddSheet = false">
        <div class="absolute inset-0 bg-text/40 backdrop-blur-sm" @click="showAddSheet = false" />
        <div class="absolute bottom-0 left-0 right-0 bg-surface-lowest rounded-t-md px-5 pt-7 pb-8 max-w-lg mx-auto">
          <div class="w-10 h-1 rounded-full bg-surface-high mx-auto mb-5" />
          <h3 class="text-title-md font-bold text-text mb-4">Thêm ngân sách</h3>

          <p class="text-label-md text-text-muted font-medium mb-2">Hạn mức</p>
          <input
            :value="addAmount"
            @input="onAddAmountInput"
            type="text"
            inputmode="numeric"
            placeholder="0"
            class="w-full bg-surface-low rounded-input px-4 py-3 text-body-lg text-text font-bold outline-none focus:bg-surface-lowest focus:ring-1 focus:ring-ghost-border transition-colors mb-4"
          />

          <p class="text-label-md text-text-muted font-medium mb-2">Danh mục</p>
          <input
            v-model="addCategorySearch"
            type="text"
            placeholder="Tìm danh mục..."
            class="w-full bg-surface-low rounded-input px-4 py-2 text-body-lg text-text outline-none focus:bg-surface-lowest focus:ring-1 focus:ring-ghost-border transition-colors mb-3"
          />
          <div class="max-h-36 overflow-y-auto rounded-DEFAULT mb-5">
            <div class="grid grid-cols-4 gap-2">
              <button
                v-for="cat in searchedAddCategories"
                :key="cat.id"
                @click="addCategoryId = cat.id"
                class="bg-surface-low rounded-DEFAULT p-2 flex flex-col items-center gap-1 transition-all"
                :class="addCategoryId === cat.id ? 'ring-2 ring-income scale-95' : ''"
              >
                <CategoryIcon :name="cat.icon" :size="24" />
                <span class="text-[0.625rem] font-medium text-text text-center truncate w-full">{{ cat.name }}</span>
              </button>
            </div>
            <div v-if="searchedAddCategories.length === 0" class="py-4 text-center text-text-muted text-label-md">
              Tất cả danh mục đã có ngân sách
            </div>
          </div>

          <div class="flex gap-3">
            <button
              @click="showAddSheet = false"
              class="flex-1 py-3 rounded-DEFAULT text-body-lg font-semibold text-text-muted bg-surface-low transition-colors hover:bg-surface-high"
            >
              Huỷ
            </button>
            <button
              @click="saveBudget"
              :disabled="!canAdd"
              class="flex-1 py-3 rounded-DEFAULT text-body-lg font-semibold text-text-inverse bg-primary transition-colors hover:bg-primary-light disabled:opacity-40"
            >
              Thêm
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Edit budget bottom sheet -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="showEditSheet" class="fixed inset-0 z-50" @click.self="showEditSheet = false">
        <div class="absolute inset-0 bg-text/40 backdrop-blur-sm" @click="showEditSheet = false" />
        <div class="absolute bottom-0 left-0 right-0 bg-surface-lowest rounded-t-md px-5 pt-7 pb-8 max-w-lg mx-auto">
          <div class="w-10 h-1 rounded-full bg-surface-high mx-auto mb-5" />
          <h3 class="text-title-md font-bold text-text mb-1">Sửa ngân sách</h3>
          <p class="text-label-md text-text-muted mb-4">{{ categoryMap.get(editTarget?.category_id ?? '')?.name }}</p>

          <p class="text-label-md text-text-muted font-medium mb-2">Hạn mức</p>
          <input
            :value="editAmount"
            @input="onEditAmountInput"
            type="text"
            inputmode="numeric"
            placeholder="0"
            class="w-full bg-surface-low rounded-input px-4 py-3 text-body-lg text-text font-bold outline-none focus:bg-surface-lowest focus:ring-1 focus:ring-ghost-border transition-colors mb-5"
          />

          <div class="flex gap-3">
            <button
              @click="openDelete"
              class="py-3 px-4 rounded-DEFAULT text-body-lg font-semibold text-expense bg-expense/10 transition-colors hover:bg-expense/20"
            >
              Xoá
            </button>
            <button
              @click="showEditSheet = false"
              class="flex-1 py-3 rounded-DEFAULT text-body-lg font-semibold text-text-muted bg-surface-low transition-colors hover:bg-surface-high"
            >
              Huỷ
            </button>
            <button
              @click="saveEdit"
              :disabled="!canEdit"
              class="flex-1 py-3 rounded-DEFAULT text-body-lg font-semibold text-text-inverse bg-primary transition-colors hover:bg-primary-light disabled:opacity-40"
            >
              Lưu
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Delete confirm -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="showDeleteConfirm" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-text/40 backdrop-blur-sm" @click="showDeleteConfirm = false" />
        <div class="relative bg-surface-lowest rounded-DEFAULT p-5 shadow-lg mx-5 max-w-sm w-full">
          <h3 class="text-title-md font-bold text-text mb-2">Xoá ngân sách?</h3>
          <p class="text-body-lg text-text-muted mb-5">
            Ngân sách cho <strong class="text-text">{{ categoryMap.get(editTarget?.category_id ?? '')?.name }}</strong> sẽ bị xoá.
          </p>
          <div class="flex gap-3">
            <button
              @click="showDeleteConfirm = false; editTarget = null"
              class="flex-1 py-2.5 rounded-DEFAULT text-body-lg font-semibold text-text-muted bg-surface-low hover:bg-surface-high transition-colors"
            >
              Huỷ
            </button>
            <button
              @click="confirmDelete"
              class="flex-1 py-2.5 rounded-DEFAULT text-body-lg font-semibold text-text-inverse bg-expense hover:bg-expense/90 transition-colors"
            >
              Xoá
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
