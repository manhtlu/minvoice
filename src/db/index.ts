import Dexie, { type EntityTable } from 'dexie'
import type { User, Category, Transaction, TransactionTemplate, Budget } from './types'

const db = new Dexie('minvoice') as Dexie & {
  users: EntityTable<User, 'id'>
  categories: EntityTable<Category, 'id'>
  transactions: EntityTable<Transaction, 'id'>
  transaction_templates: EntityTable<TransactionTemplate, 'id'>
  budgets: EntityTable<Budget, 'id'>
}

db.version(1).stores({
  users: 'id',
  categories: 'id, type, user_id',
  transactions:
    'id, transaction_date, category_id, category_type, [user_id+transaction_date], [user_id+category_type+transaction_date], [user_id+category_id+transaction_date]',
  budgets: 'id, [user_id+month], [user_id+category_id+month]',
})

db.version(2).stores({
  transaction_templates: 'id, user_id, category_type',
  budgets: 'id, user_id, [user_id+month], [user_id+category_id+month]',
})

export { db }
