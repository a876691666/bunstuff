<script setup lang="ts">
import { NPopconfirm, NButton } from 'naive-ui'

type ButtonType = 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error'

// Vue 3.5 defineProps with defaults
const props = withDefaults(
  defineProps<{
    title?: string
    loading?: boolean
    disabled?: boolean
    text?: string
    type?: ButtonType
  }>(),
  {
    title: '确定要删除吗？',
    loading: false,
    disabled: false,
    text: '删除',
    type: 'error',
  },
)

const emit = defineEmits<{
  confirm: []
}>()

const confirm = () => emit('confirm')
</script>

<template>
  <NPopconfirm @positive-click="confirm">
    <template #trigger>
      <NButton
        :type="props.type"
        :loading="props.loading"
        :disabled="props.disabled"
        size="small"
        quaternary
      >
        {{ props.text }}
      </NButton>
    </template>
    {{ props.title }}
  </NPopconfirm>
</template>
