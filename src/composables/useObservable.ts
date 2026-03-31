import { ref, watch, onUnmounted, type Ref, type WatchSource } from 'vue'
import type { Observable } from 'dexie'

export function useObservable<T>(
  source: WatchSource<Observable<T>>,
  defaultValue: T
): Ref<T> {
  const data = ref(defaultValue) as Ref<T>
  let subscription: { unsubscribe(): void } | null = null

  const subscribe = (observable: Observable<T>) => {
    subscription?.unsubscribe()
    subscription = observable.subscribe({
      next: (value) => {
        data.value = value
      },
      error: (err) => {
        console.error('useObservable error:', err)
      },
    })
  }

  watch(source, (obs) => subscribe(obs), { immediate: true })

  onUnmounted(() => {
    subscription?.unsubscribe()
  })

  return data
}
