import { v4 as uuid } from 'uuid'
import { db } from './index'
import { DEFAULT_CATEGORIES } from './master-data'
import type { MasterUser } from './master-data'

export async function seedInitialData(user: MasterUser) {
  const userId = uuid()

  await db.transaction('rw', [db.users, db.categories, db.transactions, db.budgets], async () => {
    await db.users.clear()
    await db.categories.clear()
    await db.transactions.clear()
    await db.budgets.clear()

    await db.users.put({
      id: userId,
      name: user.name,
      email: user.email,
      created_at: Date.now(),
    })

    if (DEFAULT_CATEGORIES.length) {
      const categories = DEFAULT_CATEGORIES.map((c) => ({ ...c, user_id: userId }))
      await db.categories.bulkPut(categories)
    }
  })
}
