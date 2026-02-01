<script setup lang="ts">
import { NModal, NCard, NButton, NSpace, NSpin } from 'naive-ui'

defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    default: '',
  },
  width: {
    type: [Number, String],
    default: 600,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  showFooter: {
    type: Boolean,
    default: true,
  },
  confirmText: {
    type: String,
    default: '确定',
  },
  cancelText: {
    type: String,
    default: '取消',
  },
  confirmDisabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits<{
  'update:show': [value: boolean]
  confirm: []
  cancel: []
}>()

function handleClose() {
  emit('update:show', false)
  emit('cancel')
}

function handleConfirm() {
  emit('confirm')
}
</script>

<template>
  <NModal
    :show="show"
    :mask-closable="false"
    :close-on-esc="false"
    @update:show="(v) => emit('update:show', v)"
  >
    <NCard
      :style="{ width: typeof width === 'number' ? `${width}px` : width }"
      :title="title"
      :bordered="false"
      role="dialog"
      closable
      @close="handleClose"
    >
      <NSpin :show="loading">
        <slot />
      </NSpin>

      <template #footer v-if="showFooter">
        <NSpace justify="end">
          <slot name="footer">
            <NButton @click="handleClose">{{ cancelText }}</NButton>
            <NButton
              type="primary"
              :loading="loading"
              :disabled="confirmDisabled"
              @click="handleConfirm"
            >
              {{ confirmText }}
            </NButton>
          </slot>
        </NSpace>
      </template>
    </NCard>
  </NModal>
</template>
