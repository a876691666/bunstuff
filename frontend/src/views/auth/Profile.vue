<script setup lang="ts">
import { shallowRef, onMounted } from 'vue'
import {
  NCard,
  NDescriptions,
  NDescriptionsItem,
  NTag,
  NSpin,
} from 'naive-ui'
import { useAuthStore } from '@/stores'

const authStore = useAuthStore()
const loading = shallowRef(false)

onMounted(async () => {
  loading.value = true
  try {
    await authStore.fetchUserInfo()
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <NCard title="个人信息">
    <NSpin :show="loading">
      <NDescriptions label-placement="left" :column="1" v-if="authStore.user">
        <NDescriptionsItem label="用户ID">
          {{ authStore.user.id }}
        </NDescriptionsItem>
        <NDescriptionsItem label="用户名">
          {{ authStore.user.username }}
        </NDescriptionsItem>
        <NDescriptionsItem label="昵称">
          {{ authStore.user.nickname || '-' }}
        </NDescriptionsItem>
        <NDescriptionsItem label="邮箱">
          {{ authStore.user.email || '-' }}
        </NDescriptionsItem>
        <NDescriptionsItem label="手机号">
          {{ authStore.user.phone || '-' }}
        </NDescriptionsItem>
        <NDescriptionsItem label="角色ID">
          {{ authStore.user.roleId }}
        </NDescriptionsItem>
        <NDescriptionsItem label="状态">
          <NTag :type="authStore.user.status === 1 ? 'success' : 'error'">
            {{ authStore.user.status === 1 ? '正常' : '禁用' }}
          </NTag>
        </NDescriptionsItem>
      </NDescriptions>
    </NSpin>
  </NCard>
</template>
