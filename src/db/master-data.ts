import type { Category } from './types'

export interface MasterUser {
  name: string
  email: string
}

export const DEFAULT_USERS: MasterUser[] = [
  { name: 'Nguyễn Mạnh', email: '' },
  { name: 'John Doe', email: '' },
]

export const DEFAULT_CATEGORIES: Omit<Category, 'user_id'>[] = [
  // === Expense ===
  { id: 'cat-exp-01', name: 'Ăn uống',        type: 'expense', icon: 'fluent-emoji-flat:fork-and-knife',         color: '#ef4444', sort_order: 1,  is_archived: false, created_at: 0 },
  { id: 'cat-exp-02', name: 'Coffee',          type: 'expense', icon: 'fluent-emoji-flat:hot-beverage',           color: '#92400e', sort_order: 2,  is_archived: false, created_at: 0 },
  { id: 'cat-exp-03', name: 'Nhậu',            type: 'expense', icon: 'fluent-emoji-flat:beer-mug',               color: '#f97316', sort_order: 3,  is_archived: false, created_at: 0 },
  { id: 'cat-exp-04', name: 'Thuê nhà',        type: 'expense', icon: 'fluent-emoji-flat:house',                  color: '#3b82f6', sort_order: 4,  is_archived: false, created_at: 0 },
  { id: 'cat-exp-05', name: 'Xe cộ',           type: 'expense', icon: 'fluent-emoji-flat:motorcycle',             color: '#64748b', sort_order: 5,  is_archived: false, created_at: 0 },
  { id: 'cat-exp-06', name: 'Shopping',         type: 'expense', icon: 'fluent-emoji-flat:shopping-bags',          color: '#d946ef', sort_order: 6,  is_archived: false, created_at: 0 },
  { id: 'cat-exp-07', name: 'Đồ nhà cửa',     type: 'expense', icon: 'fluent-emoji-flat:toolbox',                color: '#f59e0b', sort_order: 7,  is_archived: false, created_at: 0 },
  { id: 'cat-exp-08', name: 'Đồ công nghệ',   type: 'expense', icon: 'fluent-emoji-flat:laptop',                 color: '#6366f1', sort_order: 8,  is_archived: false, created_at: 0 },
  { id: 'cat-exp-09', name: 'Người yêu',       type: 'expense', icon: 'fluent-emoji-flat:red-heart',              color: '#ec4899', sort_order: 9,  is_archived: false, created_at: 0 },
  { id: 'cat-exp-10', name: 'Du lịch',         type: 'expense', icon: 'fluent-emoji-flat:airplane',               color: '#06b6d4', sort_order: 10, is_archived: false, created_at: 0 },
  { id: 'cat-exp-11', name: 'Ứng Cầu Lông',   type: 'expense', icon: 'fluent-emoji-flat:badminton',              color: '#22c55e', sort_order: 11, is_archived: false, created_at: 0 },
  { id: 'cat-exp-12', name: 'Gym',              type: 'expense', icon: 'fluent-emoji-flat:person-lifting-weights', color: '#10b981', sort_order: 12, is_archived: false, created_at: 0 },
  { id: 'cat-exp-13', name: 'Thể thao',        type: 'expense', icon: 'fluent-emoji-flat:person-running',         color: '#14b8a6', sort_order: 13, is_archived: false, created_at: 0 },
  { id: 'cat-exp-14', name: 'Netflix',          type: 'expense', icon: 'fluent-emoji-flat:clapper-board',          color: '#ef4444', sort_order: 14, is_archived: false, created_at: 0 },
  { id: 'cat-exp-15', name: 'Tool công việc',  type: 'expense', icon: 'fluent-emoji-flat:briefcase',              color: '#8b5cf6', sort_order: 15, is_archived: false, created_at: 0 },
  { id: 'cat-exp-16', name: 'Khoá học',        type: 'expense', icon: 'fluent-emoji-flat:graduation-cap',         color: '#a855f7', sort_order: 16, is_archived: false, created_at: 0 },
  { id: 'cat-exp-17', name: 'Rút tiền',        type: 'expense', icon: 'fluent-emoji-flat:atm-sign',               color: '#84cc16', sort_order: 17, is_archived: false, created_at: 0 },
  { id: 'cat-exp-18', name: 'Khác',            type: 'expense', icon: 'fluent-emoji-flat:white-question-mark',    color: '#64748b', sort_order: 18, is_archived: false, created_at: 0 },

  // === Income ===
  { id: 'cat-inc-01', name: 'Lương',           type: 'income',  icon: 'fluent-emoji-flat:money-bag',              color: '#22c55e', sort_order: 1,  is_archived: false, created_at: 0 },
  { id: 'cat-inc-02', name: 'Thu Cầu Lông',   type: 'income',  icon: 'fluent-emoji-flat:badminton',              color: '#3b82f6', sort_order: 2,  is_archived: false, created_at: 0 },
  { id: 'cat-inc-03', name: 'Khác',            type: 'income',  icon: 'fluent-emoji-flat:white-question-mark',    color: '#64748b', sort_order: 3,  is_archived: false, created_at: 0 },
]
