<script setup lang="ts">
import { NDataTable, NPagination, NCard, NSpin, NEmpty } from 'naive-ui'
import type { DataTableColumns, PaginationProps } from 'naive-ui'
import { shallowRef, type PropType } from 'vue'

const props = defineProps({
  columns: {
    type: Array as PropType<DataTableColumns<any>>,
    required: true,
  },
  data: {
    type: Array as PropType<any[]>,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  pagination: {
    type: Object as PropType<PaginationProps | false>,
    default: () => ({
      page: 1,
      pageSize: 10,
      showSizePicker: true,
      pageSizes: [10, 20, 50, 100],
    }),
  },
  rowKey: {
    type: Function as PropType<(row: any) => string | number>,
    default: (row: any) => row.id,
  },
  bordered: {
    type: Boolean,
    default: true,
  },
  striped: {
    type: Boolean,
    default: true,
  },
  title: {
    type: String,
    default: '',
  },
  maxHeight: {
    type: [Number, String],
    default: undefined,
  },
})

const emit = defineEmits<{
  'update:page': [page: number]
  'update:pageSize': [pageSize: number]
}>()

const checkedRowKeys = shallowRef<(string | number)[]>([])

function handlePageChange(page: number) {
  emit('update:page', page)
}

function handlePageSizeChange(pageSize: number) {
  emit('update:pageSize', pageSize)
}

function handleCheckedRowKeysChange(keys: (string | number)[]) {
  checkedRowKeys.value = keys
}

defineExpose({
  checkedRowKeys,
})
</script>

<template>
  <NCard :title="title || undefined" :bordered="bordered">
    <template #header-extra>
      <slot name="header-extra" />
    </template>

    <div class="table-toolbar" v-if="$slots.toolbar">
      <slot name="toolbar" />
    </div>

    <NSpin :show="loading">
      <NDataTable
        :columns="columns"
        :data="data"
        :row-key="rowKey"
        :bordered="bordered"
        :striped="striped"
        :max-height="maxHeight"
        :pagination="false"
        :checked-row-keys="checkedRowKeys"
        @update:checked-row-keys="handleCheckedRowKeysChange"
      >
        <template #empty>
          <NEmpty description="暂无数据" />
        </template>
      </NDataTable>
    </NSpin>

    <div class="table-pagination" v-if="pagination !== false">
      <NPagination
        v-bind="pagination"
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
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
