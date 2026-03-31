<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { db } from '../db'

const router = useRouter()
import { seedInitialData } from '../db/seed'
import { DEFAULT_USERS, type MasterUser } from '../db/master-data'
import dummyData from '../../dummy-data.json'

const userName = ref('')

onMounted(async () => {
  const first = await db.users.toCollection().first()
  if (first) userName.value = first.name
})
const isSaving = ref(false)
const isLoading = ref(false)
const loadingMessage = ref('')

// Seed flow
const showUserPicker = ref(false)
const selectedUser = ref<MasterUser | null>(null)
const showSeedConfirm = ref(false)

const openUserPicker = () => {
  selectedUser.value = null
  showUserPicker.value = true
}

const pickUser = (user: MasterUser) => {
  selectedUser.value = user
  showUserPicker.value = false
  showSeedConfirm.value = true
}

const doSeed = async () => {
  if (!selectedUser.value) return
  showSeedConfirm.value = false
  isLoading.value = true
  loadingMessage.value = 'Đang khởi tạo dữ liệu...'
  try {
    await seedInitialData(selectedUser.value)
    userName.value = selectedUser.value.name
    loadingMessage.value = 'Khởi tạo thành công!'
    await new Promise((r) => setTimeout(r, 800))
  } catch (e) {
    loadingMessage.value = 'Khởi tạo thất bại!'
    console.error(e)
    await new Promise((r) => setTimeout(r, 1500))
  } finally {
    isLoading.value = false
    loadingMessage.value = ''
    selectedUser.value = null
  }
}

const save = async () => {
  isSaving.value = true
  // TODO: save to IndexedDB
  await new Promise((r) => setTimeout(r, 500))
  isSaving.value = false
}

const syncData = async () => {
  isLoading.value = true
  loadingMessage.value = 'Đang đồng bộ dữ liệu...'
  try {
    // TODO: replace with S3 download
    const data = dummyData

    await db.transaction('rw', [db.users, db.categories, db.transactions, db.budgets], async () => {
      // Clear existing data
      await db.users.clear()
      await db.categories.clear()
      await db.transactions.clear()
      await db.budgets.clear()

      // Import user
      if (data.user) {
        await db.users.put(data.user)
        userName.value = data.user.name
      }

      // Import categories
      if (data.categories?.length) {
        await db.categories.bulkPut(data.categories)
      }

      // Import transactions
      if (data.transactions?.length) {
        await db.transactions.bulkPut(data.transactions)
      }

      // Import budgets
      if ('budgets' in data && Array.isArray((data as any).budgets)) {
        await db.budgets.bulkPut((data as any).budgets)
      }
    })

    loadingMessage.value = 'Đồng bộ thành công!'
    await new Promise((r) => setTimeout(r, 800))
  } catch (e) {
    loadingMessage.value = 'Đồng bộ thất bại!'
    console.error(e)
    await new Promise((r) => setTimeout(r, 1500))
  } finally {
    isLoading.value = false
    loadingMessage.value = ''
  }
}
</script>

<template>
  <!-- Loading overlay -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="isLoading" class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-text/40 backdrop-blur-sm">
        <div class="bg-surface-lowest rounded-DEFAULT p-6 shadow-lg flex flex-col items-center gap-4">
          <div class="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p class="text-body-lg font-medium text-text">{{ loadingMessage }}</p>
        </div>
      </div>
    </Transition>
  </Teleport>

  <div class="space-y-6">
    <!-- Profile section -->
    <section class="bg-surface-lowest rounded-DEFAULT p-4 shadow-sm flex items-center gap-4">
      <div class="w-12 h-12 flex items-center justify-center shrink-0">
        <Icon icon="fluent-emoji-flat:boy-light" width="40" height="40" />
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-label-md text-text-muted mb-1">Tên người dùng</p>
        <input
          v-model="userName"
          type="text"
          class="w-full bg-surface-low rounded-input px-3 py-2 text-body-lg text-text outline-none focus:bg-surface-lowest focus:ring-1 focus:ring-ghost-border transition-colors"
        />
      </div>
    </section>

    <!-- Transaction settings -->
    <section>
      <p class="text-label-md text-text-muted font-medium uppercase tracking-wider mb-3 px-1">Giao dịch</p>
      <div class="space-y-3">
        <button
          @click="router.push('/templates')"
          class="w-full bg-surface-lowest rounded-DEFAULT p-4 shadow-sm flex items-center gap-4 text-left transition-shadow hover:shadow active:shadow-sm"
        >
          <div class="w-10 h-10 rounded-input flex items-center justify-center shrink-0">
            <Icon icon="fluent-emoji-flat:bookmark-tabs" width="28" height="28" />
          </div>
          <div>
            <p class="text-body-lg font-semibold text-text">Mẫu giao dịch</p>
            <p class="text-label-md text-text-muted">Tạo mẫu để thêm giao dịch nhanh</p>
          </div>
        </button>

        <button
          @click="router.push('/budgets')"
          class="w-full bg-surface-lowest rounded-DEFAULT p-4 shadow-sm flex items-center gap-4 text-left transition-shadow hover:shadow active:shadow-sm"
        >
          <div class="w-10 h-10 rounded-input flex items-center justify-center shrink-0">
            <Icon icon="fluent-emoji-flat:money-bag" width="28" height="28" />
          </div>
          <div>
            <p class="text-body-lg font-semibold text-text">Ngân sách</p>
            <p class="text-label-md text-text-muted">Thiết lập hạn mức chi tiêu</p>
          </div>
        </button>
      </div>
    </section>

    <!-- App settings -->
    <section>
      <p class="text-label-md text-text-muted font-medium uppercase tracking-wider mb-3 px-1">Ứng dụng</p>
      <div class="space-y-3">
        <button class="w-full bg-surface-lowest rounded-DEFAULT p-4 shadow-sm flex items-center gap-4 text-left transition-shadow hover:shadow active:shadow-sm">
          <div class="w-10 h-10 rounded-input bg-income/10 flex items-center justify-center shrink-0">
            <svg class="w-5 h-5 text-income" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.338-2.32 3.75 3.75 0 013.57 5.346A4.5 4.5 0 0118.75 19.5H6.75z" />
            </svg>
          </div>
          <div>
            <p class="text-body-lg font-semibold text-text">Backup dữ liệu</p>
            <p class="text-label-md text-text-muted">Lưu dữ liệu lên cloud</p>
          </div>
        </button>

        <button
          @click="syncData"
          class="w-full bg-surface-lowest rounded-DEFAULT p-4 shadow-sm flex items-center gap-4 text-left transition-shadow hover:shadow active:shadow-sm"
        >
          <div class="w-10 h-10 rounded-input bg-primary/10 flex items-center justify-center shrink-0">
            <svg class="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M2.985 19.644l3.182-3.182" />
            </svg>
          </div>
          <div>
            <p class="text-body-lg font-semibold text-text">Đồng bộ dữ liệu</p>
            <p class="text-label-md text-text-muted">Tải dữ liệu từ cloud về</p>
          </div>
        </button>

        <button class="w-full bg-surface-lowest rounded-DEFAULT p-4 shadow-sm flex items-center gap-4 text-left transition-shadow hover:shadow active:shadow-sm">
          <div class="w-10 h-10 rounded-input bg-tag-amber/10 flex items-center justify-center shrink-0">
            <svg class="w-5 h-5 text-tag-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <div>
            <p class="text-body-lg font-semibold text-text">Xuất dữ liệu</p>
            <p class="text-label-md text-text-muted">Tải file JSON về máy</p>
          </div>
        </button>

        <button
          @click="openUserPicker"
          class="w-full bg-surface-lowest rounded-DEFAULT p-4 shadow-sm flex items-center gap-4 text-left transition-shadow hover:shadow active:shadow-sm"
        >
          <div class="w-10 h-10 rounded-input bg-expense/10 flex items-center justify-center shrink-0">
            <svg class="w-5 h-5 text-expense" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125v-3.75m16.5 3.75v3.75c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125v-3.75" />
            </svg>
          </div>
          <div>
            <p class="text-body-lg font-semibold text-text">Khởi tạo dữ liệu</p>
            <p class="text-label-md text-text-muted">Xoá toàn bộ và tạo lại dữ liệu mặc định</p>
          </div>
        </button>
      </div>
    </section>

  </div>

  <!-- Save button fixed above bottom nav -->
  <div class="fixed bottom-[6rem] left-0 right-0 z-10 px-5 max-w-lg mx-auto">
    <button
      @click="save"
      :disabled="isSaving"
      class="w-full py-3.5 rounded-DEFAULT text-body-lg font-semibold text-text-inverse bg-primary transition-colors hover:bg-primary-light active:bg-primary disabled:opacity-50 shadow"
    >
      {{ isSaving ? 'Đang lưu...' : 'Lưu thay đổi' }}
    </button>
  </div>

  <!-- User picker bottom sheet -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="showUserPicker" class="fixed inset-0 z-50" @click.self="showUserPicker = false">
        <div class="absolute inset-0 bg-text/40 backdrop-blur-sm" @click="showUserPicker = false" />
        <div class="absolute bottom-0 left-0 right-0 bg-surface-lowest rounded-t-md px-5 pt-7 pb-8 max-w-lg mx-auto">
          <div class="w-10 h-1 rounded-full bg-surface-high mx-auto mb-5" />
          <h3 class="text-title-md font-bold text-text mb-2">Chọn người dùng</h3>
          <p class="text-label-md text-text-muted mb-4">Dữ liệu sẽ được khởi tạo cho người dùng được chọn</p>

          <div v-if="DEFAULT_USERS.length === 0" class="py-8 text-center text-text-muted text-body-lg">
            Chưa có dữ liệu người dùng mặc định
          </div>
          <div v-else class="space-y-2 max-h-64 overflow-y-auto">
            <button
              v-for="(user, idx) in DEFAULT_USERS"
              :key="idx"
              @click="pickUser(user)"
              class="w-full bg-surface-low rounded-DEFAULT p-4 flex items-center gap-4 text-left transition-colors hover:bg-surface-high active:bg-surface-high"
            >
              <div class="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-lg text-primary font-bold shrink-0">
                {{ user.name.charAt(0) }}
              </div>
              <div class="min-w-0">
                <p class="text-body-lg font-semibold text-text truncate">{{ user.name }}</p>
                <p v-if="user.email" class="text-label-md text-text-muted truncate">{{ user.email }}</p>
              </div>
            </button>
          </div>

          <button
            @click="showUserPicker = false"
            class="w-full mt-4 py-2.5 rounded-DEFAULT text-body-lg font-semibold text-text-muted bg-surface-low hover:bg-surface-high transition-colors"
          >
            Huỷ
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Seed confirm dialog -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="showSeedConfirm" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-text/40 backdrop-blur-sm" @click="showSeedConfirm = false" />
        <div class="relative bg-surface-lowest rounded-DEFAULT p-5 shadow-lg mx-5 max-w-sm w-full">
          <h3 class="text-title-md font-bold text-text mb-2">Khởi tạo dữ liệu?</h3>
          <p class="text-body-lg text-text-muted mb-5">
            Toàn bộ dữ liệu hiện tại sẽ bị <strong class="text-expense">xoá</strong> và khởi tạo lại cho <strong class="text-text">{{ selectedUser?.name }}</strong>.
          </p>
          <div class="flex gap-3">
            <button
              @click="showSeedConfirm = false"
              class="flex-1 py-2.5 rounded-DEFAULT text-body-lg font-semibold text-text-muted bg-surface-low hover:bg-surface-high transition-colors"
            >
              Huỷ
            </button>
            <button
              @click="doSeed"
              class="flex-1 py-2.5 rounded-DEFAULT text-body-lg font-semibold text-text-inverse bg-expense hover:bg-expense/90 transition-colors"
            >
              Khởi tạo
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
