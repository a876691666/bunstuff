<script setup lang="ts">
import { shallowRef, onMounted } from 'vue'
import { NGrid, NGi, NCard, NStatistic, NSpin, NEmpty, useMessage } from 'naive-ui'
import { authAdminApi, vipApi, rbacAdminApi } from '@/api'
import type { OnlineStats } from '@/types'

const message = useMessage()

const loading = shallowRef(false)
const stats = shallowRef<{
  onlineUsers: number
  totalUsers: number
  totalRoles: number
  totalVipUsers: number
} | null>(null)

async function loadStats() {
  loading.value = true
  try {
    // 并行加载多个统计数据
    const [onlineStats, cacheStatus] = await Promise.all([
      authAdminApi.getOnlineStats().catch(() => ({ onlineUsers: 0, totalSessions: 0 })),
      rbacAdminApi
        .getCacheStatus()
        .catch(() => ({ roleCount: 0, permissionCount: 0, menuCount: 0, scopeCount: 0 })),
    ])

    stats.value = {
      onlineUsers: onlineStats.onlineUsers ?? 0,
      totalUsers: 0, // 后端暂无此接口
      totalRoles: cacheStatus.roleCount ?? 0,
      totalVipUsers: 0, // 后端暂无用户VIP列表接口
    }
  } catch (err: any) {
    message.error(err.message || '加载统计数据失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadStats()
})
</script>

<template>
  <div class="page-dashboard">
    <h2 style="margin-bottom: 24px">控制台</h2>

    <NSpin :show="loading">
      <NGrid :cols="4" :x-gap="16" :y-gap="16">
        <NGi>
          <NCard>
            <NStatistic label="在线用户" :value="stats?.onlineUsers ?? 0">
              <template #suffix>人</template>
            </NStatistic>
          </NCard>
        </NGi>
        <NGi>
          <NCard>
            <NStatistic label="系统用户" :value="stats?.totalUsers ?? 0">
              <template #suffix>人</template>
            </NStatistic>
          </NCard>
        </NGi>
        <NGi>
          <NCard>
            <NStatistic label="角色数量" :value="stats?.totalRoles ?? 0">
              <template #suffix>个</template>
            </NStatistic>
          </NCard>
        </NGi>
        <NGi>
          <NCard>
            <NStatistic label="VIP用户" :value="stats?.totalVipUsers ?? 0">
              <template #suffix>人</template>
            </NStatistic>
          </NCard>
        </NGi>
      </NGrid>

      <NCard title="快捷入口" style="margin-top: 24px">
        <NEmpty v-if="!stats" description="暂无数据" />
        <p v-else>欢迎使用后台管理系统！您可以通过左侧菜单访问各个功能模块。</p>
      </NCard>
    </NSpin>
  </div>
</template>

<style scoped>
.page-dashboard {
  padding: 24px;
}
</style>
