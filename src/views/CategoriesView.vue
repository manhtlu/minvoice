<script setup lang="ts">
import { ref, computed } from 'vue'
import { v4 as uuid } from 'uuid'
import { db } from '../db'
import { liveQuery } from 'dexie'
import { useObservable } from '../composables/useObservable'
import { useCurrentUser } from '../composables/useCurrentUser'
import type { Category } from '../db/types'
import CategoryIcon from '../components/CategoryIcon.vue'
import { CATEGORY_ICONS, CATEGORY_COLORS } from '../constants/category-icons'

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

const filteredCategories = computed(() =>
  categories.value.filter((c) => c.type === activeTab.value && !c.is_archived)
)

// Bottom sheet state
const showSheet = ref(false)
const newName = ref('')
const newIcon = ref(CATEGORY_ICONS[0])
const newColor = ref(CATEGORY_COLORS[0])

const openSheet = () => {
  newName.value = ''
  newIcon.value = CATEGORY_ICONS[0]
  newColor.value = CATEGORY_COLORS[0]
  showSheet.value = true
}

const closeSheet = () => {
  showSheet.value = false
}

const addCategory = async () => {
  const name = newName.value.trim()
  if (!name) return

  const maxOrder = categories.value
    .filter((c) => c.type === activeTab.value)
    .reduce((max, c) => Math.max(max, c.sort_order), 0)

  await db.categories.put({
    id: uuid(),
    user_id: userId.value,
    name,
    type: activeTab.value,
    icon: newIcon.value,
    color: newColor.value,
    sort_order: maxOrder + 1,
    is_archived: false,
    created_at: Date.now(),
  })

  closeSheet()
}

// Long press to edit
const longPressTimer = ref<ReturnType<typeof setTimeout> | null>(null)
const editTarget = ref<Category | null>(null)
const showEditSheet = ref(false)
const editName = ref('')
const editIcon = ref(CATEGORY_ICONS[0])
const editColor = ref(CATEGORY_COLORS[0])

const onPointerDown = (cat: Category) => {
  longPressTimer.value = setTimeout(() => {
    editTarget.value = cat
    editName.value = cat.name
    editIcon.value = cat.icon as typeof CATEGORY_ICONS[number]
    editColor.value = cat.color as typeof CATEGORY_COLORS[number]
    showEditSheet.value = true
  }, 600)
}

const onPointerUp = () => {
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value)
    longPressTimer.value = null
  }
}

const closeEditSheet = () => {
  showEditSheet.value = false
  editTarget.value = null
}

const saveEdit = async () => {
  if (!editTarget.value) return
  const name = editName.value.trim()
  if (!name) return
  await db.categories.update(editTarget.value.id, {
    name,
    icon: editIcon.value,
    color: editColor.value,
  })
  closeEditSheet()
}

// Delete confirmation
const showDeleteConfirm = ref(false)

const openDeleteConfirm = () => {
  showEditSheet.value = false
  showDeleteConfirm.value = true
}

const confirmDelete = async () => {
  if (!editTarget.value) return
  await db.categories.update(editTarget.value.id, { is_archived: true })
  showDeleteConfirm.value = false
  editTarget.value = null
}

const cancelDelete = () => {
  showDeleteConfirm.value = false
  editTarget.value = null
}
</script>

<template>
  <div>
    <!-- Page intro -->
    <div class="mb-5">
      <h2 class="text-headline-md font-bold text-text">Danh mục</h2>
      <p class="text-label-md text-text-muted mt-1">Quản lý các nhóm chi tiêu và thu nhập của bạn</p>
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

    <!-- Category grid -->
    <div class="grid grid-cols-3 gap-3">
      <div
        v-for="cat in filteredCategories"
        :key="cat.id"
        class="bg-surface-lowest rounded-DEFAULT p-3 shadow-sm flex flex-col items-center gap-2 select-none cursor-pointer active:scale-95 transition-transform"
        @pointerdown="onPointerDown(cat)"
        @pointerup="onPointerUp"
        @pointerleave="onPointerUp"
        @contextmenu.prevent
      >
        <CategoryIcon :name="cat.icon" :size="36" />
        <span class="text-label-md font-medium text-text text-center truncate w-full">{{ cat.name }}</span>
      </div>

      <!-- Add button -->
      <button
        @click="openSheet"
        class="bg-surface-lowest rounded-DEFAULT p-3 shadow-sm flex flex-col items-center gap-2 border-2 border-dashed border-surface-high hover:border-income transition-colors"
      >
        <div class="w-9 h-9 rounded-input flex items-center justify-center bg-surface-low">
          <svg class="w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </div>
        <span class="text-label-md font-medium text-text-muted">Thêm</span>
      </button>
    </div>
  </div>

  <!-- Add category bottom sheet -->
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="showSheet" class="fixed inset-0 z-50" @click.self="closeSheet">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-text/40 backdrop-blur-sm" @click="closeSheet" />

        <!-- Sheet -->
        <div class="absolute bottom-0 left-0 right-0 bg-surface-lowest rounded-t-md px-5 pt-7 pb-8 max-w-lg mx-auto">
          <!-- Handle -->
          <div class="w-10 h-1 rounded-full bg-surface-high mx-auto mb-5" />

          <h3 class="text-title-md font-bold text-text mb-4">
            Thêm danh mục {{ activeTab === 'expense' ? 'chi' : 'thu' }}
          </h3>

          <!-- Name input -->
          <input
            v-model="newName"
            type="text"
            placeholder="Tên danh mục"
            class="w-full bg-surface-low rounded-input px-4 py-3 text-body-lg text-text outline-none focus:bg-surface-lowest focus:ring-1 focus:ring-ghost-border transition-colors mb-4"
            autofocus
          />

          <!-- Icon picker -->
          <p class="text-label-md text-text-muted font-medium mb-2">Biểu tượng</p>
          <div class="grid grid-cols-8 gap-2 mb-4 max-h-40 overflow-y-auto p-3">
            <button
              v-for="icon in CATEGORY_ICONS"
              :key="icon"
              @click="newIcon = icon"
              class="w-9 h-9 rounded-sm flex items-center justify-center transition-colors"
              :class="newIcon === icon ? 'bg-income/15 ring-2 ring-income' : 'bg-surface-low hover:bg-surface-high'"
            >
              <CategoryIcon :name="icon" :size="24" />
            </button>
          </div>

          <!-- Color picker -->
          <p class="text-label-md text-text-muted font-medium mb-2">Màu sắc</p>
          <div class="flex flex-wrap gap-2 mb-5">
            <button
              v-for="color in CATEGORY_COLORS"
              :key="color"
              @click="newColor = color"
              class="w-8 h-8 rounded-full transition-transform"
              :class="newColor === color ? 'scale-110 ring-2 ring-offset-2 ring-income' : ''"
              :style="{ backgroundColor: color }"
            />
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
              @click="addCategory"
              :disabled="!newName.trim()"
              class="flex-1 py-3 rounded-DEFAULT text-body-lg font-semibold text-text-inverse bg-primary transition-colors hover:bg-primary-light disabled:opacity-40"
            >
              Thêm
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Edit category bottom sheet -->
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="showEditSheet" class="fixed inset-0 z-50" @click.self="closeEditSheet">
        <div class="absolute inset-0 bg-text/40 backdrop-blur-sm" @click="closeEditSheet" />
        <div class="absolute bottom-0 left-0 right-0 bg-surface-lowest rounded-t-md px-5 pt-7 pb-8 max-w-lg mx-auto">
          <div class="w-10 h-1 rounded-full bg-surface-high mx-auto mb-5" />

          <h3 class="text-title-md font-bold text-text mb-4">Sửa danh mục</h3>

          <!-- Name input -->
          <input
            v-model="editName"
            type="text"
            placeholder="Tên danh mục"
            class="w-full bg-surface-low rounded-input px-4 py-3 text-body-lg text-text outline-none focus:bg-surface-lowest focus:ring-1 focus:ring-ghost-border transition-colors mb-4"
          />

          <!-- Icon picker -->
          <p class="text-label-md text-text-muted font-medium mb-2">Biểu tượng</p>
          <div class="grid grid-cols-8 gap-2 mb-4 max-h-40 overflow-y-auto p-3">
            <button
              v-for="icon in CATEGORY_ICONS"
              :key="icon"
              @click="editIcon = icon"
              class="w-9 h-9 rounded-sm flex items-center justify-center transition-colors"
              :class="editIcon === icon ? 'bg-income/15 ring-2 ring-income' : 'bg-surface-low hover:bg-surface-high'"
            >
              <CategoryIcon :name="icon" :size="24" />
            </button>
          </div>

          <!-- Color picker -->
          <p class="text-label-md text-text-muted font-medium mb-2">Màu sắc</p>
          <div class="flex flex-wrap gap-2 mb-5">
            <button
              v-for="color in CATEGORY_COLORS"
              :key="color"
              @click="editColor = color"
              class="w-8 h-8 rounded-full transition-transform"
              :class="editColor === color ? 'scale-110 ring-2 ring-offset-2 ring-income' : ''"
              :style="{ backgroundColor: color }"
            />
          </div>

          <!-- Actions -->
          <div class="flex gap-3">
            <button
              @click="openDeleteConfirm"
              class="py-3 px-4 rounded-DEFAULT text-body-lg font-semibold text-expense bg-expense/10 transition-colors hover:bg-expense/20"
            >
              Xoá
            </button>
            <button
              @click="closeEditSheet"
              class="flex-1 py-3 rounded-DEFAULT text-body-lg font-semibold text-text-muted bg-surface-low transition-colors hover:bg-surface-high"
            >
              Huỷ
            </button>
            <button
              @click="saveEdit"
              :disabled="!editName.trim()"
              class="flex-1 py-3 rounded-DEFAULT text-body-lg font-semibold text-text-inverse bg-primary transition-colors hover:bg-primary-light disabled:opacity-40"
            >
              Lưu
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Delete confirmation -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="showDeleteConfirm" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-text/40 backdrop-blur-sm" @click="cancelDelete" />
        <div class="relative bg-surface-lowest rounded-DEFAULT p-5 shadow-lg mx-5 max-w-sm w-full">
          <h3 class="text-title-md font-bold text-text mb-2">Xoá danh mục?</h3>
          <p class="text-body-lg text-text-muted mb-5">
            Danh mục <strong class="text-text">{{ editTarget?.name }}</strong> sẽ bị ẩn khỏi danh sách. Các giao dịch liên quan vẫn được giữ lại.
          </p>
          <div class="flex gap-3">
            <button
              @click="cancelDelete"
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

.sheet-enter-active,
.sheet-leave-active {
  transition: all 0.3s ease;
}
.sheet-enter-from .absolute.bottom-0,
.sheet-leave-to .absolute.bottom-0 {
  transform: translateY(100%);
}
.sheet-enter-from .absolute.inset-0,
.sheet-leave-to .absolute.inset-0 {
  opacity: 0;
}
</style>
