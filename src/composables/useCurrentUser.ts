import { computed } from 'vue'
import { liveQuery } from 'dexie'
import { useObservable } from './useObservable'
import { db } from '../db'
import type { User } from '../db/types'

export function useCurrentUser() {
  const user = useObservable<User | undefined>(
    computed(() => liveQuery(() => db.users.toCollection().first())),
    undefined
  )

  const userId = computed(() => user.value?.id ?? '')

  return { user, userId }
}
