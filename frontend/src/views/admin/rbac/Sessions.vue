<script setup lang="ts">
import { shallowRef, onMounted, h } from 'vue'
import { NButton, useMessage, NStatistic, NCard, NGrid, NGi, NSpin } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { PageTable, ConfirmButton } from '@/components'
import { authAdminApi } from '@/api'
import type { Session, OnlineStats } from '@/types'

defineOptions({
  name: 'RbacSessions',
})

const message = useMessage()

// 统计数据
const stats = shallowRef<OnlineStats | null>(null)
const statsLoading = shallowRef(false)

// 会话列表
const loading = shallowRef(false)
const sessions = shallowRef<Session[]>([])
const total = shallowRef(0)
const page = shallowRef(1)
const pageSize = shallowRef(10)

// 表格列定义
const columns: DataTableColumns<Session> = [
  { title: '会话ID', key: 'id', width: 80 },
  { title: '令牌前缀', key: 'tokenPrefix', width: 120, ellipsis: { tooltip: true } },
  { title: '用户ID', key: 'userId', width: 100 },
  { title: '用户名', key: 'username', width: 150 },
  { title: '角色ID', key: 'roleId', width: 100 },
  {
    title: '创建时间',
    key: 'createdAt',
    width: 180,
    render: (row) => new Date(row.createdAt).toLocaleString(),
  },
  {
    title: '过期时间',
    key: 'expiresAt',
    width: 180,
    render: (row) => new Date(row.expiresAt).toLocaleString(),
  },
  {
    title: '最后活跃',
    key: 'lastActiveAt',
    width: 180,
    render: (row) => new Date(row.lastActiveAt).toLocaleString(),
  },
  { title: 'IP地址', key: 'ip', width: 140 },
  { title: '设备', key: 'userAgent', ellipsis: { tooltip: true } },
  {
    title: '操作',
    key: 'actions',
    width: 200,
    fixed: 'right',
    render: (row) =>
      h('div', { style: 'display: flex; gap: 8px' }, [
        h(ConfirmButton, {
          title: '确定要踢下线该会话吗？',
          buttonText: '踢会话下线',
          type: 'warning',
          onConfirm: () => handleKickSession(row.token),
        }),
        h(ConfirmButton, {
          title: '确定要踢下线该用户的所有会话吗？',
          buttonText: '踢用户下线',
          type: 'error',
          onConfirm: () => handleKickUser(row.userId),
        }),
      ]),
  },
]

// 加载统计数据
async function loadStats() {
  statsLoading.value = true
  try {
    stats.value = await authAdminApi.getOnlineStats()
  } catch (err: any) {
    message.error(err.message || '加载统计失败')
  } finally {
    statsLoading.value = false
  }
}

// 加载会话列表
async function loadSessions() {
  loading.value = true
  try {
    // 后端返回的是普通数组，不是分页结构
    const res = await authAdminApi.getSessions()
    sessions.value = res
    total.value = res.length
  } catch (err: any) {
    message.error(err.message || '加载会话列表失败')
  } finally {
    loading.value = false
  }
}

// 踢下线用户所有会话
async function handleKickUser(userId: number) {
  try {
    await authAdminApi.kickUser(userId)
    message.success('已踢下线该用户所有会话')
    loadSessions()
    loadStats()
  } catch (err: any) {
    message.error(err.message || '操作失败')
  }
}

// 踢下线指定会话
async function handleKickSession(token: string) {
  try {
    await authAdminApi.kickSession(token)
    message.success('已踢下线该会话')
    loadSessions()
    loadStats()
  } catch (err: any) {
    message.error(err.message || '操作失败')
  }
}

// 分页
function handlePageChange(p: number) {
  page.value = p
  loadSessions()
}

function handlePageSizeChange(ps: number) {
  pageSize.value = ps
  page.value = 1
  loadSessions()
}

// 刷新
function handleRefresh() {
  loadStats()
  loadSessions()
}

onMounted(() => {
  loadStats()
  loadSessions()
})
</script>

<template>
  <div class="page-sessions">
    <!-- 统计卡片 -->
    <NSpin :show="statsLoading">
      <NGrid :cols="6" :x-gap="16" style="margin-bottom: 16px">
        <NGi>
          <NCard>
            <NStatistic label="在线用户数" :value="stats?.onlineUsers ?? 0" />
          </NCard>
        </NGi>
        <NGi>
          <NCard>
            <NStatistic label="活跃用户数" :value="stats?.activeUsers ?? 0" />
          </NCard>
        </NGi>
        <NGi>
          <NCard>
            <NStatistic label="活跃会话数" :value="stats?.activeSessions ?? 0" />
          </NCard>
        </NGi>
        <NGi>
          <NCard>
            <NStatistic label="今日新登录" :value="stats?.todayNewSessions ?? 0" />
          </NCard>
        </NGi>
        <NGi>
          <NCard>
            <NStatistic label="即将过期" :value="stats?.expiringSessions ?? 0" />
          </NCard>
        </NGi>
        <NGi>
          <NCard>
            <NStatistic label="总会话数" :value="stats?.totalSessions ?? 0" />
          </NCard>
        </NGi>
      </NGrid>
    </NSpin>

    <!-- 会话列表 -->
    <PageTable
      title="在线会话"
      :columns="columns"
      :data="sessions"
      :loading="loading"
      :pagination="{
        page: page,
        pageSize: pageSize,
        pageCount: Math.ceil(total / pageSize),
        showSizePicker: true,
        pageSizes: [10, 20, 50, 100],
        itemCount: total,
      }"
      @update:page="handlePageChange"
      @update:page-size="handlePageSizeChange"
    >
      <template #header-extra>
        <NButton @click="handleRefresh">刷新</NButton>
      </template>
    </PageTable>
  </div>
</template>

<style scoped>
.page-sessions {
  height: 100%;
}
</style>
