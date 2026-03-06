<script setup lang="ts">
import { definePage } from 'vue-router/experimental'

definePage({ meta: { layout: 'basic', requiresAuth: true } })
</script>

<template>
  <n-card title="关于">
    <n-text>基于 Vue 3 + Naive UI + TypeScript 的客户端应用。</n-text>
  </n-card>
</template>
