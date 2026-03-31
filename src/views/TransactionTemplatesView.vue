<script setup lang="ts">
import { ref, computed } from 'vue'
import { v4 as uuid } from 'uuid'
import { db } from '../db'
import { liveQuery } from 'dexie'
import { useObservable } from '../composables/useObservable'
import { useCurrentUser } from '../composables/useCurrentUser'
import type { Category, TransactionTemplate } from '../db/types'
import CategoryIcon from '../components/CategoryIcon.vue'

const { userId } = useCurrentUser()

// Tab state
type TabType = 'expense' | 'income'
const activeTab = ref<TabType>('expense')

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

const templates = useObservable<TransactionTemplate[]>(
  computed(() =>
    liveQuery(async () => {
      const all = await db.transaction_templates.toArray()
      return all.sort((a, b) => a.sort_order - b.sort_order)
    })
  ),
  []
)

const filteredCategories = computed(() =>
  categories.value.filter((c) => c.type === activeTab.value && !c.is_archived)
)

const filteredTemplates = computed(() =>
  templates.value.filter((t) => t.category_type === activeTab.value)
)

const categoryMap = computed(() => {
  const map = new Map<string, Category>()
  for (const c of categories.value) map.set(c.id, c)
  return map
})

const formatAmount = (amount: number) => amount.toLocaleString('vi-VN') + 'đ'

// Add/Edit sheet
const showSheet = ref(false)
const editingTemplate = ref<TransactionTemplate | null>(null)
const sheetAmount = ref('')
const sheetNote = ref('')
const sheetCategoryId = ref<string | null>(null)
const sheetCategorySearch = ref('')

const searchedCategories = computed(() => {
  const keyword = sheetCategorySearch.value.trim().toLowerCase()
  return filteredCategories.value.filter((c) =>
    !keyword || c.name.toLowerCase().includes(keyword)
  )
})

const openAddSheet = () => {
  editingTemplate.value = null
  sheetAmount.value = ''
  sheetNote.value = ''
  sheetCategoryId.value = null
  sheetCategorySearch.value = ''
  showSheet.value = true
}

const openEditSheet = (t: TransactionTemplate) => {
  editingTemplate.value = t
  sheetAmount.value = String(t.amount)
  sheetNote.value = t.note
  sheetCategoryId.value = t.category_id
  sheetCategorySearch.value = ''
  showSheet.value = true
}

const closeSheet = () => {
  showSheet.value = false
  editingTemplate.value = null
}

const onAmountInput = (e: Event) => {
  const input = e.target as HTMLInputElement
  sheetAmount.value = input.value.replace(/\D/g, '')
}

const canSave = computed(() =>
  Number(sheetAmount.value) > 0 && sheetCategoryId.value !== null
)

const saveTemplate = async () => {
  if (!canSave.value) return

  const category = categories.value.find((c) => c.id === sheetCategoryId.value)
  if (!category) return

  if (editingTemplate.value) {
    await db.transaction_templates.update(editingTemplate.value.id, {
      category_id: sheetCategoryId.value!,
      category_type: category.type,
      amount: Number(sheetAmount.value),
      note: sheetNote.value.trim(),
    })
  } else {
    const maxOrder = templates.value
      .filter((t) => t.category_type === activeTab.value)
      .reduce((max, t) => Math.max(max, t.sort_order), 0)

    await db.transaction_templates.put({
      id: uuid(),
      user_id: userId.value,
      category_id: sheetCategoryId.value!,
      category_type: category.type,
      amount: Number(sheetAmount.value),
      note: sheetNote.value.trim(),
      sort_order: maxOrder + 1,
      created_at: Date.now(),
    })
  }

  closeSheet()
}

// Delete
const showDeleteConfirm = ref(false)
const deleteTarget = ref<TransactionTemplate | null>(null)

const openDelete = (t: TransactionTemplate) => {
  deleteTarget.value = t
  showDeleteConfirm.value = true
}

const confirmDelete = async () => {
  if (!deleteTarget.value) return
  await db.transaction_templates.delete(deleteTarget.value.id)
  showDeleteConfirm.value = false
  deleteTarget.value = null
}
</script>

<template>
  <div>
    <div class="mb-5">
      <h2 class="text-headline-md font-bold text-text">Mẫu giao dịch</h2>
      <p class="text-label-md text-text-muted mt-1">Tạo mẫu để thêm giao dịch nhanh hơn</p>
    </div>

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

    <!-- Template list -->
    <div class="space-y-2 mb-5">
      <div
        v-for="t in filteredTemplates"
        :key="t.id"
        class="bg-surface-lowest rounded-DEFAULT p-3 shadow-sm flex items-center gap-3"
      >
        <CategoryIcon :name="categoryMap.get(t.category_id)?.icon ?? 'fluent-emoji-flat:white-question-mark'" :size="32" />
        <div class="flex-1 min-w-0">
          <p class="text-body-lg font-semibold text-text truncate">{{ t.note || categoryMap.get(t.category_id)?.name || '—' }}</p>
          <p class="text-label-md text-text-muted">{{ categoryMap.get(t.category_id)?.name }}</p>
        </div>
        <p class="text-body-lg font-bold shrink-0" :class="t.category_type === 'expense' ? 'text-expense' : 'text-income'">
          {{ formatAmount(t.amount) }}
        </p>
        <div class="flex gap-1 shrink-0">
          <button @click="openEditSheet(t)" class="w-8 h-8 rounded-full bg-surface-low flex items-center justify-center hover:bg-surface-high transition-colors">
            <svg class="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
            </svg>
          </button>
          <button @click="openDelete(t)" class="w-8 h-8 rounded-full bg-surface-low flex items-center justify-center hover:bg-expense/10 transition-colors">
            <svg class="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </div>
      </div>

      <div v-if="filteredTemplates.length === 0" class="text-center py-8 text-text-muted text-body-lg">
        Chưa có mẫu nào
      </div>
    </div>

    <!-- Add button -->
    <button
      @click="openAddSheet"
      class="w-full py-3 rounded-DEFAULT text-body-lg font-semibold text-text-inverse bg-primary transition-colors hover:bg-primary-light"
    >
      Thêm mẫu
    </button>
  </div>

  <!-- Add/Edit bottom sheet -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="showSheet" class="fixed inset-0 z-50" @click.self="closeSheet">
        <div class="absolute inset-0 bg-text/40 backdrop-blur-sm" @click="closeSheet" />
        <div class="absolute bottom-0 left-0 right-0 bg-surface-lowest rounded-t-md px-5 pt-7 pb-8 max-w-lg mx-auto">
          <div class="w-10 h-1 rounded-full bg-surface-high mx-auto mb-5" />

          <h3 class="text-title-md font-bold text-text mb-4">
            {{ editingTemplate ? 'Sửa mẫu' : 'Thêm mẫu' }}
          </h3>

          <!-- Amount -->
          <p class="text-label-md text-text-muted font-medium mb-2">Số tiền</p>
          <input
            :value="sheetAmount"
            @input="onAmountInput"
            type="text"
            inputmode="numeric"
            placeholder="0"
            class="w-full bg-surface-low rounded-input px-4 py-3 text-body-lg text-text font-bold outline-none focus:bg-surface-lowest focus:ring-1 focus:ring-ghost-border transition-colors mb-4"
          />

          <!-- Note -->
          <p class="text-label-md text-text-muted font-medium mb-2">Tên mẫu</p>
          <input
            v-model="sheetNote"
            type="text"
            placeholder="VD: Ăn sáng, Đổ xăng..."
            class="w-full bg-surface-low rounded-input px-4 py-3 text-body-lg text-text outline-none focus:bg-surface-lowest focus:ring-1 focus:ring-ghost-border transition-colors mb-4"
          />

          <!-- Category picker -->
          <p class="text-label-md text-text-muted font-medium mb-2">Danh mục</p>
          <input
            v-model="sheetCategorySearch"
            type="text"
            placeholder="Tìm danh mục..."
            class="w-full bg-surface-low rounded-input px-4 py-2 text-body-lg text-text outline-none focus:bg-surface-lowest focus:ring-1 focus:ring-ghost-border transition-colors mb-3"
          />
          <div class="max-h-36 overflow-y-auto rounded-DEFAULT mb-5">
            <div class="grid grid-cols-4 gap-2">
              <button
                v-for="cat in searchedCategories"
                :key="cat.id"
                @click="sheetCategoryId = cat.id"
                class="bg-surface-low rounded-DEFAULT p-2 flex flex-col items-center gap-1 transition-all"
                :class="sheetCategoryId === cat.id ? 'ring-2 ring-income scale-95' : ''"
              >
                <CategoryIcon :name="cat.icon" :size="24" />
                <span class="text-[0.625rem] font-medium text-text text-center truncate w-full">{{ cat.name }}</span>
              </button>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-3">
            <button
              @click="closeSheet"
              class="flex-1 py-3 rounded-DEFAULT text-body-lg font-semibold text-text-muted bg-surface-low transition-colors hover:bg-surface-high"
            >
              Huỷ
            </button>
            <button
              @click="saveTemplate"
              :disabled="!canSave"
              class="flex-1 py-3 rounded-DEFAULT text-body-lg font-semibold text-text-inverse bg-primary transition-colors hover:bg-primary-light disabled:opacity-40"
            >
              {{ editingTemplate ? 'Lưu' : 'Thêm' }}
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
          <h3 class="text-title-md font-bold text-text mb-2">Xoá mẫu?</h3>
          <p class="text-body-lg text-text-muted mb-5">
            Mẫu <strong class="text-text">{{ deleteTarget?.note || categoryMap.get(deleteTarget?.category_id ?? '')?.name }}</strong> sẽ bị xoá.
          </p>
          <div class="flex gap-3">
            <button
              @click="showDeleteConfirm = false; deleteTarget = null"
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
