<script setup lang="ts">
import { NResult, NButton } from 'naive-ui'
import { useRouter } from 'vue-router'

const router = useRouter()

function goHome() {
  router.push('/')
}

function goBack() {
  router.back()
}
</script>

<template>
  <div class="page-not-found">
    <NResult status="404" title="404" description="抱歉，您访问的页面不存在">
      <template #footer>
        <NButton type="primary" @click="goHome">返回首页</NButton>
        <NButton style="margin-left: 12px" @click="goBack">返回上一页</NButton>
      </template>
    </NResult>
  </div>
</template>

<style scoped>
.page-not-found {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}
</style>
