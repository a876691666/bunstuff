<script setup lang="ts">
import { h } from 'vue'
import { NTag, NSpace, useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { CrudTable, CrudSearch, CrudConfirm, type SearchField } from '@/components'
import { useTable } from '@/composables'
import { jobLogApi } from '@/api'
import type { JobLog } from '@/types'
import { Op } from '@/utils/ssql'

defineOptions({ name: 'JobLogManagement' })

const message = useMessage()

// 搜索字段
const searchFields: SearchField[] = [
  { key: 'jobName', label: '任务名称', type: 'input' },
  { key: 'handler', label: '处理器', type: 'input' },
  {
    key: 'status',
    label: '状态',
    type: 'select',
    options: [
      { label: '成功', value: 1 },
      { label: '失败', value: 0 },
    ],
  },
]

// useTable
const table = useTable<JobLog, { jobName?: string; handler?: string; status?: number }>({
  api: (params) => jobLogApi.list(params),
  opMap: { jobName: Op.Like, handler: Op.Like },
})

// 表格列
const columns: DataTableColumns<JobLog> = [
  { title: 'ID', key: 'id', width: 60 },
  { title: '任务名称', key: 'jobName', width: 150 },
  { title: '处理器', key: 'handler', width: 180, ellipsis: { tooltip: true } },
  { title: '日志信息', key: 'message', width: 150, ellipsis: { tooltip: true } },
  {
    title: '状态',
    key: 'status',
    width: 80,
    render: (row) =>
      h(NTag, { type: row.status === 1 ? 'success' : 'error', size: 'small' }, () =>
        row.status === 1 ? '成功' : '失败',
      ),
  },
  { title: '错误信息', key: 'errorMsg', width: 200, ellipsis: { tooltip: true } },
  {
    title: '开始时间',
    key: 'startTime',
    width: 180,
    render: (row) => (row.startTime ? new Date(row.startTime).toLocaleString() : '-'),
  },
  {
    title: '耗时(ms)',
    key: 'costTime',
    width: 100,
    render: (row) =>
      h(NTag, { type: row.costTime > 5000 ? 'warning' : 'default', size: 'small' }, () =>
        String(row.costTime),
      ),
  },
  {
    title: '操作',
    key: 'actions',
    width: 80,
    fixed: 'right',
    render: (row) =>
      h(CrudConfirm, {
        title: '确定要删除该日志吗？',
        onConfirm: () => handleDelete(row.id),
      }),
  },
]

async function handleDelete(id: number) {
  try {
    await jobLogApi.delete(id)
    message.success('删除成功')
    table.reload()
  } catch (err: unknown) {
    message.error((err as Error).message || '删除失败')
  }
}

async function handleClear() {
  try {
    await jobLogApi.clear()
    message.success('清空成功')
    table.reload()
  } catch (err: unknown) {
    message.error((err as Error).message || '清空失败')
  }
}
</script>

<template>
  <div class="page-job-logs">
    <CrudTable
      title="任务执行日志"
      :columns="columns"
      :data="table.data.value"
      :loading="table.loading.value"
      :page="table.page.value"
      :page-size="table.pageSize.value"
      :total="table.total.value"
      @update:page="table.setPage"
      @update:page-size="table.setPageSize"
    >
      <template #toolbar>
        <CrudSearch
          v-model="table.query.value"
          :fields="searchFields"
          :loading="table.loading.value"
          :collapsed-count="3"
          @search="table.search"
          @reset="table.reset"
        />
      </template>

      <template #header-extra>
        <NSpace>
          <CrudConfirm
            title="确定要清空所有日志吗？"
            text="清空日志"
            type="warning"
            @confirm="handleClear"
          />
        </NSpace>
      </template>
    </CrudTable>
  </div>
</template>

<style scoped>
.page-job-logs {
  height: 100%;
}
</style>
