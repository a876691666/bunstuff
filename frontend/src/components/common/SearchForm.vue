<script setup lang="ts">
import {
  NButton,
  NSpace,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NInputNumber,
} from 'naive-ui'
import type { SelectOption } from 'naive-ui'
import { shallowRef, type PropType } from 'vue'

export interface SearchFieldConfig {
  key: string
  label: string
  type?: 'input' | 'select' | 'number'
  placeholder?: string
  options?: SelectOption[]
  span?: number
}

const props = defineProps({
  fields: {
    type: Array as PropType<SearchFieldConfig[]>,
    required: true,
  },
  modelValue: {
    type: Object as PropType<Record<string, any>>,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, any>]
  search: []
  reset: []
}>()

const collapsed = shallowRef(true)

function handleUpdate(key: string, value: any) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}

function handleSearch() {
  emit('search')
}

function handleReset() {
  const emptyValues: Record<string, any> = {}
  props.fields.forEach((field) => {
    emptyValues[field.key] = undefined
  })
  emit('update:modelValue', emptyValues)
  emit('reset')
}

function toggleCollapse() {
  collapsed.value = !collapsed.value
}

const visibleFields = () => {
  if (collapsed.value && props.fields.length > 3) {
    return props.fields.slice(0, 3)
  }
  return props.fields
}
</script>

<template>
  <NForm inline label-placement="left" :show-feedback="false">
    <NFormItem
      v-for="field in visibleFields()"
      :key="field.key"
      :label="field.label"
    >
      <NInput
        v-if="!field.type || field.type === 'input'"
        :value="modelValue[field.key]"
        :placeholder="field.placeholder || `请输入${field.label}`"
        clearable
        style="width: 180px"
        @update:value="(v) => handleUpdate(field.key, v)"
      />

      <NSelect
        v-else-if="field.type === 'select'"
        :value="modelValue[field.key]"
        :options="field.options"
        :placeholder="field.placeholder || `请选择${field.label}`"
        clearable
        style="width: 180px"
        @update:value="(v) => handleUpdate(field.key, v)"
      />

      <NInputNumber
        v-else-if="field.type === 'number'"
        :value="modelValue[field.key]"
        :placeholder="field.placeholder || `请输入${field.label}`"
        clearable
        style="width: 180px"
        @update:value="(v) => handleUpdate(field.key, v)"
      />
    </NFormItem>

    <NFormItem>
      <NSpace>
        <NButton type="primary" :loading="loading" @click="handleSearch">
          查询
        </NButton>
        <NButton @click="handleReset">重置</NButton>
        <NButton
          v-if="fields.length > 3"
          text
          @click="toggleCollapse"
        >
          {{ collapsed ? '展开' : '收起' }}
        </NButton>
      </NSpace>
    </NFormItem>
  </NForm>
</template>
