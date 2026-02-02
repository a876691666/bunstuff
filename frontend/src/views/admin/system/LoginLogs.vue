<script setup lang="ts">
import { h } from 'vue'
import { NTag, NSpace, useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { CrudTable, CrudSearch, CrudConfirm, type SearchField } from '@/components'
import { useTable } from '@/composables'
import { loginLogApi } from '@/api'
import type { LoginLog } from '@/types'
import { Op } from '@/utils/ssql'

defineOptions({ name: 'SystemLoginLogs' })

const message = useMessage()

// 搜索字段配置
const searchFields: SearchField[] = [
  { key: 'username', label: '用户名', type: 'input' },
  { key: 'ip', label: 'IP地址', type: 'input' },
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
    key: 'action',
    label: '操作类型',
    type: 'select',
    options: [
      { label: '登录', value: 'login' },
      { label: '登出', value: 'logout' },
      { label: '踢下线', value: 'kick' },
    ],
  },
  {
    key: 'loginTime',
    label: '登录时间',
    type: 'daterange',
    startKey: 'startTime',
    endKey: 'endTime',
  },
]

// 使用 useTable
const table = useTable<
  LoginLog,
  {
    username?: string
    ip?: string
    status?: number
    action?: string
    startTime?: string
    endTime?: string
  }
>({
  api: (params) => loginLogApi.list(params),
  opMap: { username: Op.Like, ip: Op.Like },
})

// 表格列定义
const columns: DataTableColumns<LoginLog> = [
  { title: 'ID', key: 'id', width: 80 },
  { title: '用户名', key: 'username', width: 120 },
  { title: 'IP地址', key: 'ip', width: 140 },
  { title: '登录地点', key: 'location', width: 150, ellipsis: { tooltip: true } },
  { title: '浏览器', key: 'browser', width: 150, ellipsis: { tooltip: true } },
  { title: '操作系统', key: 'os', width: 150, ellipsis: { tooltip: true } },
  {
    title: '状态',
    key: 'status',
    width: 80,
    render: (row) =>
      h(NTag, { type: row.status === 1 ? 'success' : 'error', size: 'small' }, () =>
        row.status === 1 ? '成功' : '失败',
      ),
  },
  {
    title: '操作',
    key: 'action',
    width: 80,
    render: (row) => {
      const map: Record<string, { text: string; type: 'default' | 'info' | 'warning' }> = {
        login: { text: '登录', type: 'info' },
        logout: { text: '登出', type: 'default' },
        kick: { text: '踢下线', type: 'warning' },
      }
      const item = map[row.action] || { text: row.action, type: 'default' }
      return h(NTag, { type: item.type, size: 'small' }, () => item.text)
    },
  },
  { title: '提示消息', key: 'msg', ellipsis: { tooltip: true } },
  {
    title: '登录时间',
    key: 'loginTime',
    width: 180,
    render: (row) => new Date(row.loginTime).toLocaleString(),
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
    await loginLogApi.delete(id)
    message.success('删除成功')
    table.reload()
  } catch (err: unknown) {
    message.error((err as Error).message || '删除失败')
  }
}

async function handleClear() {
  try {
    await loginLogApi.clear()
    message.success('清空成功')
    table.reload()
  } catch (err: unknown) {
    message.error((err as Error).message || '清空失败')
  }
}
</script>

<template>
  <div class="page-login-logs">
    <CrudTable
      title="登录日志"
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
.page-login-logs {
  height: 100%;
}
</style>
