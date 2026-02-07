<script setup lang="ts">
import { h } from 'vue'
import { NTag, NSpace, useMessage, NTooltip } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { CrudTable, CrudSearch, CrudConfirm, type SearchField } from '@/components'
import { useTable } from '@/composables'
import { operLogApi } from '@/api'
import type { OperLog } from '@/types'
import { Op } from '@/utils/ssql'

defineOptions({ name: 'SystemOperLogs' })

const message = useMessage()

// 操作类型映射
const operTypeMap: Record<
  string,
  { text: string; type: 'default' | 'success' | 'info' | 'warning' | 'error' }
> = {
  create: { text: '新增', type: 'success' },
  update: { text: '修改', type: 'info' },
  delete: { text: '删除', type: 'error' },
  export: { text: '导出', type: 'warning' },
  import: { text: '导入', type: 'warning' },
  query: { text: '查询', type: 'default' },
  clear: { text: '清空', type: 'error' },
  other: { text: '其他', type: 'default' },
}

// 搜索字段配置
const searchFields: SearchField[] = [
  { key: 'title', label: '模块标题', type: 'input' },
  { key: 'username', label: '操作者', type: 'input' },
  {
    key: 'type',
    label: '操作类型',
    type: 'select',
    options: [
      { label: '新增', value: 'create' },
      { label: '修改', value: 'update' },
      { label: '删除', value: 'delete' },
      { label: '导出', value: 'export' },
      { label: '导入', value: 'import' },
      { label: '查询', value: 'query' },
      { label: '清空', value: 'clear' },
      { label: '其他', value: 'other' },
    ],
  },
  {
    key: 'status',
    label: '状态',
    type: 'select',
    options: [
      { label: '成功', value: 1 },
      { label: '失败', value: 0 },
    ],
  },
  {
    key: 'operTime',
    label: '操作时间',
    type: 'daterange',
    startKey: 'startTime',
    endKey: 'endTime',
  },
]

// 使用 useTable
const table = useTable<
  OperLog,
  {
    title?: string
    username?: string
    type?: string
    status?: number
    startTime?: string
    endTime?: string
  }
>({
  api: (params) => operLogApi.list(params),
  opMap: { title: Op.Like, username: Op.Like },
})

// 表格列定义
const columns: DataTableColumns<OperLog> = [
  { title: 'ID', key: 'id', width: 60 },
  { title: '模块标题', key: 'title', width: 120 },
  {
    title: '操作类型',
    key: 'type',
    width: 80,
    render: (row) => {
      const item = operTypeMap[row.type] ?? operTypeMap.other!
      return h(NTag, { type: item.type, size: 'small' }, () => item.text)
    },
  },
  { title: '请求方法', key: 'method', width: 80 },
  { title: 'URL', key: 'url', width: 200, ellipsis: { tooltip: true } },
  { title: '操作者', key: 'username', width: 100 },
  { title: 'IP地址', key: 'ip', width: 140 },
  {
    title: '状态',
    key: 'status',
    width: 70,
    render: (row) =>
      h(NTag, { type: row.status === 1 ? 'success' : 'error', size: 'small' }, () =>
        row.status === 1 ? '成功' : '失败',
      ),
  },
  {
    title: '耗时(ms)',
    key: 'costTime',
    width: 90,
    render: (row) =>
      h(NTag, { type: row.costTime > 1000 ? 'warning' : 'default', size: 'small' }, () =>
        String(row.costTime),
      ),
  },
  {
    title: '错误消息',
    key: 'errorMsg',
    width: 150,
    ellipsis: { tooltip: true },
    render: (row) =>
      row.errorMsg
        ? h(
            NTooltip,
            {},
            {
              trigger: () =>
                h('span', { style: 'color: red' }, (row.errorMsg ?? '').substring(0, 20) + '...'),
              default: () => row.errorMsg,
            },
          )
        : '-',
  },
  {
    title: '操作时间',
    key: 'operTime',
    width: 170,
    render: (row) => (row.operTime ? new Date(row.operTime).toLocaleString() : '-'),
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
    await operLogApi.delete(id)
    message.success('删除成功')
    table.reload()
  } catch (err: unknown) {
    message.error((err as Error).message || '删除失败')
  }
}

async function handleClear() {
  try {
    await operLogApi.clear()
    message.success('清空成功')
    table.reload()
  } catch (err: unknown) {
    message.error((err as Error).message || '清空失败')
  }
}
</script>

<template>
  <div class="page-oper-logs">
    <CrudTable
      title="操作日志"
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
          :collapsed-count="4"
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
.page-oper-logs {
  height: 100%;
}
</style>
