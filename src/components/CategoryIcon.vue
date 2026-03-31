<script setup lang="ts">
import { Icon } from '@iconify/vue'

defineProps<{
  name: string
  size?: number
}>()
</script>

<template>
  <Icon :icon="name || 'fluent-emoji-flat:question-mark'" :width="size ?? 24" :height="size ?? 24" />
</template>
