export interface User {
  id: string
  name: string
  email: string
  created_at: number
}

export interface Category {
  id: string
  user_id: string | null
  name: string
  type: 'income' | 'expense'
  icon: string
  color: string
  sort_order: number
  is_archived: boolean
  created_at: number
}

export interface Transaction {
  id: string
  user_id: string
  category_id: string
  category_type: 'income' | 'expense'
  amount: number
  note: string
  transaction_date: number
  tags: string[]
  created_at: number
  updated_at: number
}

export interface TransactionTemplate {
  id: string
  user_id: string
  category_id: string
  category_type: 'income' | 'expense'
  amount: number
  note: string
  sort_order: number
  created_at: number
}

export interface Budget {
  id: string
  user_id: string
  category_id: string | null
  amount: number
  month: string
  created_at: number
}
