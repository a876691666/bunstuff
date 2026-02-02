<script setup lang="ts">
import { NModal, NCard, NButton, NSpace, NSpin } from 'naive-ui'
import { shallowRef, watch, triggerRef } from 'vue'

// Vue 3.5 v-model:show
const show = defineModel<boolean>('show', { required: true })

// Vue 3.5 defineProps with defaults
const props = withDefaults(
  defineProps<{
    title?: string
    width?: number | string
    loading?: boolean
    showFooter?: boolean
    confirmText?: string
    cancelText?: string
    confirmDisabled?: boolean
  }>(),
  {
    title: '',
    width: 600,
    loading: false,
    showFooter: true,
    confirmText: '确定',
    cancelText: '取消',
    confirmDisabled: false,
  },
)

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

// 内部状态 - shallowRef
const widthStyle = shallowRef<{ width: string }>({ width: '600px' })

// 更新宽度样式
const updateWidthStyle = () => {
  widthStyle.value = {
    width: typeof props.width === 'number' ? `${props.width}px` : props.width,
  }
  triggerRef(widthStyle)
}

// 浅 watch
watch(() => props.width, updateWidthStyle, { immediate: true })

// 事件处理
const close = () => {
  show.value = false
  emit('cancel')
}

const confirm = () => emit('confirm')
</script>

<template>
  <NModal v-model:show="show" :mask-closable="false" :close-on-esc="false">
    <NCard
      :style="widthStyle"
      :title="props.title"
      :bordered="false"
      role="dialog"
      closable
      @close="close"
    >
      <NSpin :show="props.loading">
        <slot />
      </NSpin>

      <template v-if="props.showFooter" #footer>
        <NSpace justify="end">
          <slot name="footer">
            <NButton @click="close">{{ props.cancelText }}</NButton>
            <NButton
              type="primary"
              :loading="props.loading"
              :disabled="props.confirmDisabled"
              @click="confirm"
            >
              {{ props.confirmText }}
            </NButton>
          </slot>
        </NSpace>
      </template>
    </NCard>
  </NModal>
</template>
