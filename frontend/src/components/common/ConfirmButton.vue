<script setup lang="ts">
import { NPopconfirm, NButton } from 'naive-ui'

defineProps({
  title: {
    type: String,
    default: '确定要删除吗？',
  },
  loading: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  buttonText: {
    type: String,
    default: '删除',
  },
  buttonType: {
    type: String as () => 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error',
    default: 'error',
  },
})

const emit = defineEmits<{
  confirm: []
}>()

function handleConfirm() {
  emit('confirm')
}
</script>

<template>
  <NPopconfirm @positive-click="handleConfirm">
    <template #trigger>
      <NButton
        :type="buttonType"
        :loading="loading"
        :disabled="disabled"
        size="small"
        quaternary
      >
        {{ buttonText }}
      </NButton>
    </template>
    {{ title }}
  </NPopconfirm>
</template>
