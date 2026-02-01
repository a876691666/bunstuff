<script setup lang="ts">
import { NInput, NInputNumber, NSelect, NSwitch, NDatePicker, NTreeSelect } from 'naive-ui'
import type { SelectOption, TreeSelectOption } from 'naive-ui'
import type { PropType } from 'vue'

export type FormItemType =
  | 'input'
  | 'number'
  | 'select'
  | 'switch'
  | 'date'
  | 'datetime'
  | 'textarea'
  | 'tree-select'

const props = defineProps({
  type: {
    type: String as PropType<FormItemType>,
    default: 'input',
  },
  modelValue: {
    type: [String, Number, Boolean, Array, Object] as PropType<any>,
    default: undefined,
  },
  placeholder: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  options: {
    type: Array as PropType<SelectOption[] | TreeSelectOption[]>,
    default: () => [],
  },
  multiple: {
    type: Boolean,
    default: false,
  },
  clearable: {
    type: Boolean,
    default: true,
  },
  min: {
    type: Number,
    default: undefined,
  },
  max: {
    type: Number,
    default: undefined,
  },
  rows: {
    type: Number,
    default: 3,
  },
})

const emit = defineEmits<{
  'update:modelValue': [value: any]
}>()

function handleUpdate(value: any) {
  emit('update:modelValue', value)
}
</script>

<template>
  <NInput
    v-if="type === 'input'"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :clearable="clearable"
    @update:value="handleUpdate"
  />

  <NInput
    v-else-if="type === 'textarea'"
    type="textarea"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :clearable="clearable"
    :rows="rows"
    @update:value="handleUpdate"
  />

  <NInputNumber
    v-else-if="type === 'number'"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :clearable="clearable"
    :min="min"
    :max="max"
    style="width: 100%"
    @update:value="handleUpdate"
  />

  <NSelect
    v-else-if="type === 'select'"
    :value="modelValue"
    :options="options as SelectOption[]"
    :placeholder="placeholder"
    :disabled="disabled"
    :clearable="clearable"
    :multiple="multiple"
    @update:value="handleUpdate"
  />

  <NTreeSelect
    v-else-if="type === 'tree-select'"
    :value="modelValue"
    :options="options as TreeSelectOption[]"
    :placeholder="placeholder"
    :disabled="disabled"
    :clearable="clearable"
    :multiple="multiple"
    @update:value="handleUpdate"
  />

  <NSwitch
    v-else-if="type === 'switch'"
    :value="modelValue"
    :disabled="disabled"
    @update:value="handleUpdate"
  />

  <NDatePicker
    v-else-if="type === 'date'"
    :value="modelValue"
    type="date"
    :placeholder="placeholder"
    :disabled="disabled"
    :clearable="clearable"
    style="width: 100%"
    @update:value="handleUpdate"
  />

  <NDatePicker
    v-else-if="type === 'datetime'"
    :value="modelValue"
    type="datetime"
    :placeholder="placeholder"
    :disabled="disabled"
    :clearable="clearable"
    style="width: 100%"
    @update:value="handleUpdate"
  />
</template>
