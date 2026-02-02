<script setup lang="ts">
import { NInput, NInputNumber, NSelect, NSwitch, NDatePicker, NTreeSelect } from 'naive-ui'
import type { SelectOption, TreeSelectOption } from 'naive-ui'
import { shallowRef, watch } from 'vue'

export type FormItemType =
  | 'input'
  | 'number'
  | 'select'
  | 'switch'
  | 'date'
  | 'datetime'
  | 'textarea'
  | 'tree-select'

// Vue 3.5 defineModel
const model = defineModel<unknown>()

// Vue 3.5 defineProps with defaults
const props = withDefaults(
  defineProps<{
    type?: FormItemType
    placeholder?: string
    disabled?: boolean
    options?: SelectOption[] | TreeSelectOption[]
    multiple?: boolean
    clearable?: boolean
    min?: number
    max?: number
    rows?: number
  }>(),
  {
    type: 'input',
    placeholder: '',
    disabled: false,
    options: () => [],
    multiple: false,
    clearable: true,
    min: undefined,
    max: undefined,
    rows: 3,
  },
)

// 内部状态（shallowRef 避免 proxy 开销）
const stringVal = shallowRef<string | null>(null)
const numberVal = shallowRef<number | null>(null)
const selectVal = shallowRef<string | number | string[] | number[] | null>(null)
const boolVal = shallowRef(false)
const dateVal = shallowRef<number | null>(null)

// 浅 watch model 变化，更新内部状态
watch(
  () => model.value,
  (v) => {
    stringVal.value = typeof v === 'string' ? v : null
    numberVal.value = typeof v === 'number' ? v : null
    if (Array.isArray(v)) {
      selectVal.value = v as string[] | number[]
    } else if (typeof v === 'string' || typeof v === 'number') {
      selectVal.value = v
    } else {
      selectVal.value = null
    }
    boolVal.value = v === true
    dateVal.value = typeof v === 'number' ? v : null
  },
  { immediate: true },
)
</script>

<template>
  <NInput
    v-if="props.type === 'input'"
    v-model:value="stringVal"
    :placeholder="props.placeholder"
    :disabled="props.disabled"
    :clearable="props.clearable"
    @update:value="model = $event"
  />

  <NInput
    v-else-if="props.type === 'textarea'"
    v-model:value="stringVal"
    type="textarea"
    :placeholder="props.placeholder"
    :disabled="props.disabled"
    :clearable="props.clearable"
    :rows="props.rows"
    @update:value="model = $event"
  />

  <NInputNumber
    v-else-if="props.type === 'number'"
    v-model:value="numberVal"
    :placeholder="props.placeholder"
    :disabled="props.disabled"
    :clearable="props.clearable"
    :min="props.min"
    :max="props.max"
    style="width: 100%"
    @update:value="model = $event"
  />

  <NSelect
    v-else-if="props.type === 'select'"
    v-model:value="selectVal"
    :options="props.options as SelectOption[]"
    :placeholder="props.placeholder"
    :disabled="props.disabled"
    :clearable="props.clearable"
    :multiple="props.multiple"
    @update:value="model = $event"
  />

  <NTreeSelect
    v-else-if="props.type === 'tree-select'"
    v-model:value="selectVal"
    :options="props.options as TreeSelectOption[]"
    :placeholder="props.placeholder"
    :disabled="props.disabled"
    :clearable="props.clearable"
    :multiple="props.multiple"
    @update:value="model = $event"
  />

  <NSwitch
    v-else-if="props.type === 'switch'"
    v-model:value="boolVal"
    :disabled="props.disabled"
    @update:value="model = $event"
  />

  <NDatePicker
    v-else-if="props.type === 'date'"
    v-model:value="dateVal"
    type="date"
    :placeholder="props.placeholder"
    :disabled="props.disabled"
    :clearable="props.clearable"
    style="width: 100%"
    @update:value="model = $event"
  />

  <NDatePicker
    v-else-if="props.type === 'datetime'"
    v-model:value="dateVal"
    type="datetime"
    :placeholder="props.placeholder"
    :disabled="props.disabled"
    :clearable="props.clearable"
    style="width: 100%"
    @update:value="model = $event"
  />
</template>
