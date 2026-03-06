<script setup lang="ts">
import { definePage } from 'vue-router/experimental'

definePage({ meta: { layout: 'basic', requiresAuth: true } })
</script>

<template>
  <n-space vertical :size="24">
    <n-card title="欢迎">
      <n-text>Vite + Vue 3 + Naive UI + TypeScript</n-text>
    </n-card>

    <n-card title="快速开始">
      <n-space vertical>
        <n-text depth="3">编辑 src/pages/ 下的页面组件</n-text>
        <n-text depth="3">路由基于文件系统自动生成</n-text>
        <n-text depth="3">使用 src/composables/ 管理共享状态</n-text>
        <n-text depth="3">使用 src/utils/http.ts 进行 API 请求</n-text>
      </n-space>
    </n-card>
  </n-space>
</template>
