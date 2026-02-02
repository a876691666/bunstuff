<script setup lang="ts">
import {
  NButton,
  NSpace,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NInputNumber,
  NDatePicker,
} from 'naive-ui'
import type { SelectOption } from 'naive-ui'
import { shallowRef, watch, triggerRef } from 'vue'

export type SearchFieldType = 'input' | 'select' | 'number' | 'date' | 'datetime' | 'daterange'

export interface SearchField {
  key: string
  label: string
  type?: SearchFieldType
  placeholder?: string
  options?: SelectOption[]
  span?: number
  startKey?: string
  endKey?: string
}

// Vue 3.5 defineModel
const model = defineModel<Record<string, unknown>>({ required: true })

// Vue 3.5 defineProps with defaults
const props = withDefaults(
  defineProps<{
    fields: SearchField[]
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
const visibleFields = shallowRef<SearchField[]>([])
const showCollapseBtn = shallowRef(false)

// 预计算的值缓存
const valuesCache = shallowRef<{
  strings: Record<string, string | null>
  numbers: Record<string, number | null>
  selects: Record<string, string | number | null>
  dates: Record<string, number | null>
  ranges: Record<string, [number, number] | null>
  placeholders: Record<string, string>
}>({
  strings: {},
  numbers: {},
  selects: {},
  dates: {},
  ranges: {},
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
    cache.dates[f.key] = !v ? null : typeof v === 'number' ? v : new Date(v as string).getTime()
    cache.placeholders[f.key] = f.placeholder || `请输入${f.label}`

    // 范围值
    if (f.startKey && f.endKey) {
      const start = m[f.startKey]
      const end = m[f.endKey]
      if (start && end) {
        cache.ranges[f.key] = [
          typeof start === 'number' ? start : new Date(start as string).getTime(),
          typeof end === 'number' ? end : new Date(end as string).getTime(),
        ]
      } else {
        cache.ranges[f.key] = null
      }
    }
  }
  triggerRef(valuesCache)
}

// watch collapsed 和 fields
watch(() => collapsed.value, updateVisibleFields, { immediate: true })
watch(() => props.fields, updateVisibleFields, { immediate: true })
watch(() => model.value, updateValuesCache, { immediate: true })

// 更新处理器
const update = (key: string, value: unknown) => {
  model.value = { ...model.value, [key]: value }
}

const updateDate = (key: string, timestamp: number | null) => {
  model.value = { ...model.value, [key]: timestamp ? new Date(timestamp).toISOString() : undefined }
}

const updateRange = (startKey: string, endKey: string, value: [number, number] | null) => {
  const updates = { ...model.value }
  if (value) {
    updates[startKey] = new Date(value[0]).toISOString()
    updates[endKey] = new Date(value[1]).toISOString()
  } else {
    updates[startKey] = undefined
    updates[endKey] = undefined
  }
  model.value = updates
}

const search = () => emit('search')

const reset = () => {
  const empty: Record<string, unknown> = {}
  for (const f of props.fields) {
    empty[f.key] = undefined
    if (f.startKey) empty[f.startKey] = undefined
    if (f.endKey) empty[f.endKey] = undefined
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

      <NDatePicker
        v-else-if="field.type === 'date'"
        type="date"
        :value="valuesCache.dates[field.key]"
        :placeholder="valuesCache.placeholders[field.key]"
        clearable
        style="width: 180px"
        @update:value="updateDate(field.key, $event)"
      />

      <NDatePicker
        v-else-if="field.type === 'datetime'"
        type="datetime"
        :value="valuesCache.dates[field.key]"
        :placeholder="valuesCache.placeholders[field.key]"
        clearable
        style="width: 200px"
        @update:value="updateDate(field.key, $event)"
      />

      <NDatePicker
        v-else-if="field.type === 'daterange'"
        type="daterange"
        :value="valuesCache.ranges[field.key]"
        clearable
        style="width: 280px"
        @update:value="
          updateRange(field.startKey || 'startTime', field.endKey || 'endTime', $event)
        "
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
