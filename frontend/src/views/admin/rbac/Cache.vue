<script setup lang="ts">
import { shallowRef, onMounted } from 'vue'
import { NButton, NSpace, useMessage, NCard, NGrid, NGi, NStatistic, NDescriptions, NDescriptionsItem, NSpin, NAlert, NEmpty } from 'naive-ui'
import { rbacAdminApi } from '@/api'

const message = useMessage()

// 缓存状态
const cacheStatus = shallowRef<{
  roleCount: number
  permissionCount: number
  menuCount: number
  scopeCount: number
  lastUpdated: string
} | null>(null)
const loading = shallowRef(false)
const refreshing = shallowRef(false)

// 加载缓存状态
async function loadCacheStatus() {
  loading.value = true
  try {
    cacheStatus.value = await rbacAdminApi.getCacheStatus()
  } catch (err: any) {
    message.error(err.message || '加载缓存状态失败')
  } finally {
    loading.value = false
  }
}

// 刷新所有缓存
async function handleReloadCache() {
  refreshing.value = true
  try {
    await rbacAdminApi.reloadCache()
    message.success('缓存已刷新')
    loadCacheStatus()
  } catch (err: any) {
    message.error(err.message || '刷新缓存失败')
  } finally {
    refreshing.value = false
  }
}

onMounted(() => {
  loadCacheStatus()
})
</script>

<template>
  <div class="page-cache">
    <NAlert type="info" :bordered="false" style="margin-bottom: 16px">
      RBAC缓存用于提升权限验证性能。当权限配置变更后，可能需要手动刷新缓存使配置立即生效。
    </NAlert>

    <NSpin :show="loading">
      <!-- 缓存统计 -->
      <NGrid :cols="4" :x-gap="16" style="margin-bottom: 16px">
        <NGi>
          <NCard>
            <NStatistic label="缓存角色数" :value="cacheStatus?.roleCount ?? 0" />
          </NCard>
        </NGi>
        <NGi>
          <NCard>
            <NStatistic label="缓存权限数" :value="cacheStatus?.permissionCount ?? 0" />
          </NCard>
        </NGi>
        <NGi>
          <NCard>
            <NStatistic label="缓存菜单数" :value="cacheStatus?.menuCount ?? 0" />
          </NCard>
        </NGi>
        <NGi>
          <NCard>
            <NStatistic label="数据权限缓存数" :value="cacheStatus?.scopeCount ?? 0" />
          </NCard>
        </NGi>
      </NGrid>

      <!-- 缓存详情 -->
      <NCard title="缓存状态详情">
        <template #header-extra>
          <NSpace>
            <NButton @click="loadCacheStatus">刷新状态</NButton>
            <NButton type="primary" :loading="refreshing" @click="handleReloadCache">
              刷新全部缓存
            </NButton>
          </NSpace>
        </template>

        <div v-if="cacheStatus">
          <NDescriptions label-placement="left" :column="2">
            <NDescriptionsItem label="最后更新时间">
              {{ cacheStatus.lastUpdated ? new Date(cacheStatus.lastUpdated).toLocaleString() : '未知' }}
            </NDescriptionsItem>
            <NDescriptionsItem label="角色缓存">
              {{ cacheStatus.roleCount }} 条
            </NDescriptionsItem>
            <NDescriptionsItem label="权限缓存">
              {{ cacheStatus.permissionCount }} 条
            </NDescriptionsItem>
            <NDescriptionsItem label="菜单缓存">
              {{ cacheStatus.menuCount }} 条
            </NDescriptionsItem>
            <NDescriptionsItem label="数据权限缓存">
              {{ cacheStatus.scopeCount }} 条
            </NDescriptionsItem>
          </NDescriptions>
        </div>
        <NEmpty v-else description="暂无缓存数据" />
      </NCard>
    </NSpin>
  </div>
</template>

<style scoped>
.page-cache {
  height: 100%;
}
</style>
