<script setup lang="ts">
import { NDataTable, NPagination, NCard, NSpin, NEmpty } from 'naive-ui'
import type { DataTableColumns, PaginationProps } from 'naive-ui'
import { shallowRef, watch, triggerRef } from 'vue'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RowData = any

// Vue 3.5 v-model
const page = defineModel<number>('page', { default: 1 })
const pageSize = defineModel<number>('pageSize', { default: 10 })

// Vue 3.5 defineProps with defaults
const props = withDefaults(
  defineProps<{
    columns: DataTableColumns<RowData>
    data?: RowData[]
    loading?: boolean
    total?: number
    rowKey?: (row: RowData) => string | number
    bordered?: boolean
    striped?: boolean
    title?: string
    maxHeight?: number | string
    showPagination?: boolean
  }>(),
  {
    data: () => [],
    loading: false,
    total: 0,
    rowKey: (row: RowData) => row?.id ?? 0,
    bordered: true,
    striped: true,
    title: '',
    maxHeight: undefined,
    showPagination: true,
  },
)

// 内部状态 - shallowRef
const checkedRowKeys = shallowRef<(string | number)[]>([])
const cardTitle = shallowRef<string | undefined>(undefined)
const paginationConfig = shallowRef<PaginationProps | false>(false)
const hasPagination = shallowRef(false)

// 更新标题
const updateTitle = () => {
  cardTitle.value = props.title || undefined
  triggerRef(cardTitle)
}

// 更新分页配置
const updatePagination = () => {
  if (!props.showPagination) {
    paginationConfig.value = false
    hasPagination.value = false
  } else {
    paginationConfig.value = {
      page: page.value,
      pageSize: pageSize.value,
      pageCount: Math.ceil(props.total / pageSize.value) || 1,
      showSizePicker: true,
      pageSizes: [10, 20, 50, 100],
      itemCount: props.total,
    }
    hasPagination.value = true
  }
  triggerRef(paginationConfig)
  triggerRef(hasPagination)
}

// 浅 watch
watch(() => props.title, updateTitle, { immediate: true })
watch(() => props.showPagination, updatePagination, { immediate: true })
watch(() => props.total, updatePagination, { immediate: true })
watch(() => page.value, updatePagination, { immediate: true })
watch(() => pageSize.value, updatePagination, { immediate: true })

// 事件处理
const onPage = (p: number) => (page.value = p)
const onPageSize = (ps: number) => (pageSize.value = ps)
const onCheckedKeys = (keys: (string | number)[]) => {
  checkedRowKeys.value = keys
  triggerRef(checkedRowKeys)
}

defineExpose({ checkedRowKeys })
</script>

<template>
  <NCard :title="cardTitle" :bordered="props.bordered">
    <template #header-extra>
      <slot name="header-extra" />
    </template>

    <div v-if="$slots.toolbar" class="table-toolbar">
      <slot name="toolbar" />
    </div>

    <NSpin :show="props.loading">
      <NDataTable
        :columns="props.columns"
        :data="props.data"
        :row-key="props.rowKey"
        :bordered="props.bordered"
        :striped="props.striped"
        :max-height="props.maxHeight"
        :pagination="false"
        :checked-row-keys="checkedRowKeys"
        @update:checked-row-keys="onCheckedKeys"
      >
        <template #empty>
          <NEmpty description="暂无数据" />
        </template>
      </NDataTable>
    </NSpin>

    <div v-if="hasPagination" class="table-pagination">
      <NPagination
        v-bind="paginationConfig as PaginationProps"
        @update:page="onPage"
        @update:page-size="onPageSize"
      />
    </div>
  </NCard>
</template>

<style scoped>
.table-toolbar {
  margin-bottom: 16px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.table-pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
