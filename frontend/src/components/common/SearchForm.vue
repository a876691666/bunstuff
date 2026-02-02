<script setup lang="ts">
import { NButton, NSpace, NForm, NFormItem, NInput, NSelect, NInputNumber } from 'naive-ui'
import type { SelectOption } from 'naive-ui'
import { shallowRef, watch, triggerRef } from 'vue'

export interface SearchFieldConfig {
  key: string
  label: string
  type?: 'input' | 'select' | 'number'
  placeholder?: string
  options?: SelectOption[]
  span?: number
}

// Vue 3.5 defineModel
const model = defineModel<Record<string, unknown>>({ required: true })

// Vue 3.5 defineProps with defaults
const props = withDefaults(
  defineProps<{
    fields: SearchFieldConfig[]
    loading?: boolean
    collapsedCount?: number
  }>(),
  {
    loading: false,
    collapsedCount: 3,
  },
)

const emit = defineEmits<{
  search: []
  reset: []
}>()

// 内部状态 - shallowRef
const collapsed = shallowRef(true)
const visibleFields = shallowRef<SearchFieldConfig[]>([])
const showCollapseBtn = shallowRef(false)

// 预计算的值缓存
const valuesCache = shallowRef<{
  strings: Record<string, string | null>
  numbers: Record<string, number | null>
  selects: Record<string, string | number | null>
  placeholders: Record<string, string>
}>({
  strings: {},
  numbers: {},
  selects: {},
  placeholders: {},
})

// 更新可见字段
const updateVisibleFields = () => {
  const shouldCollapse = collapsed.value && props.fields.length > props.collapsedCount
  visibleFields.value = shouldCollapse ? props.fields.slice(0, props.collapsedCount) : props.fields
  showCollapseBtn.value = props.fields.length > props.collapsedCount
  triggerRef(visibleFields)
  triggerRef(showCollapseBtn)
}

// 更新值缓存
const updateValuesCache = () => {
  const m = model.value
  const cache = valuesCache.value

  for (const f of props.fields) {
    const v = m[f.key]
    cache.strings[f.key] = typeof v === 'string' ? v : null
    cache.numbers[f.key] = typeof v === 'number' ? v : null
    cache.selects[f.key] = typeof v === 'string' || typeof v === 'number' ? v : null
    cache.placeholders[f.key] = f.placeholder || `请输入${f.label}`
  }
  triggerRef(valuesCache)
}

// 浅 watch
watch(() => collapsed.value, updateVisibleFields, { immediate: true })
watch(() => props.fields, updateVisibleFields, { immediate: true })
watch(() => model.value, updateValuesCache, { immediate: true })

// 更新处理器
const update = (key: string, value: unknown) => {
  model.value = { ...model.value, [key]: value }
}

const search = () => emit('search')

const reset = () => {
  const empty: Record<string, unknown> = {}
  for (const f of props.fields) {
    empty[f.key] = undefined
  }
  model.value = empty
  emit('reset')
}

const toggle = () => {
  collapsed.value = !collapsed.value
  triggerRef(collapsed)
}
</script>

<template>
  <NForm inline label-placement="left" :show-feedback="false">
    <NFormItem v-for="field in visibleFields" :key="field.key" :label="field.label">
      <NInput
        v-if="!field.type || field.type === 'input'"
        :value="valuesCache.strings[field.key]"
        :placeholder="valuesCache.placeholders[field.key]"
        clearable
        style="width: 180px"
        @update:value="update(field.key, $event)"
      />

      <NSelect
        v-else-if="field.type === 'select'"
        :value="valuesCache.selects[field.key]"
        :options="field.options"
        :placeholder="valuesCache.placeholders[field.key]"
        clearable
        style="width: 180px"
        @update:value="update(field.key, $event)"
      />

      <NInputNumber
        v-else-if="field.type === 'number'"
        :value="valuesCache.numbers[field.key]"
        :placeholder="valuesCache.placeholders[field.key]"
        clearable
        style="width: 180px"
        @update:value="update(field.key, $event)"
      />
    </NFormItem>

    <NFormItem>
      <NSpace>
        <NButton type="primary" :loading="props.loading" @click="search">查询</NButton>
        <NButton @click="reset">重置</NButton>
        <NButton v-if="showCollapseBtn" text @click="toggle">
          {{ collapsed ? '展开' : '收起' }}
        </NButton>
      </NSpace>
    </NFormItem>
  </NForm>
</template>
