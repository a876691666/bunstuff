<script setup lang="ts">
import { useRouter } from 'vue-router'
import { definePage } from 'vue-router/experimental'
import { authUser } from '@/store/auth'

definePage({ meta: { layout: 'landing' } })

const router = useRouter()

const features = [
  { title: '用户认证与授权', desc: '内置完整的 JWT 认证、RBAC 权限管理，开箱即用。' },
  { title: '文件存储与分发', desc: '支持本地存储与对象存储，自动生成访问链接。' },
  { title: '实时通知推送', desc: '服务端推送与消息通知，保持用户实时在线。' },
  { title: '任务调度监控', desc: '可视化 Cron 任务管理，支持日志追踪与重试。' },
]

const stats = [
  { value: '99.9%', label: '服务可用性' },
  { value: '< 50ms', label: '平均响应时间' },
  { value: '10k+', label: '日活用户' },
  { value: '100%', label: 'TypeScript' },
]
</script>

<template>
  <div>
    <!-- Hero Section -->
    <section class="px-8 py-24 text-center max-w-4xl mx-auto">
      <n-tag type="success" :bordered="false" size="small" class="mb-6">
        🚀 现已开放公测
      </n-tag>
      <h1
        class="text-5xl font-bold mb-6"
        style="letter-spacing: -2px; line-height: 1.15"
      >
        构建更快，<br />发布更好。
      </h1>
      <n-text depth="3" class="text-lg block mb-10" style="max-width: 520px; margin: 0 auto 40px; line-height: 1.8">
        基于现代化技术栈的全栈平台，提供开箱即用的后端基础设施，让您专注于核心业务逻辑。
      </n-text>
      <div class="flex items-center justify-center gap-4">
        <n-button
          type="primary"
          size="large"
          @click="authUser ? router.push('/space') : router.push('/register')"
        >
          {{ authUser ? '进入我的空间' : '免费开始使用' }}
        </n-button>
        <n-button size="large" @click="router.push('/login')">查看文档</n-button>
      </div>
    </section>

    <!-- Stats -->
    <section class="border-y px-8 py-10" style="border-color: var(--n-divider-color)">
      <div class="max-w-4xl mx-auto grid grid-cols-4 gap-8 text-center">
        <div v-for="stat in stats" :key="stat.label">
          <div class="text-3xl font-bold mb-1" style="letter-spacing: -1px">{{ stat.value }}</div>
          <n-text depth="3" class="text-sm">{{ stat.label }}</n-text>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="px-8 py-20 max-w-4xl mx-auto">
      <div class="text-center mb-14">
        <h2 class="text-3xl font-bold mb-3" style="letter-spacing: -1px">一切你需要的功能</h2>
        <n-text depth="3" class="text-base">无需从头搭建，专注业务创新。</n-text>
      </div>
      <div class="grid grid-cols-2 gap-6">
        <n-card v-for="f in features" :key="f.title" :title="f.title" hoverable>
          <n-text depth="3" class="text-sm" style="line-height: 1.7">{{ f.desc }}</n-text>
        </n-card>
      </div>
    </section>

    <!-- CTA -->
    <section
      class="mx-8 mb-20 rounded-xl px-12 py-16 text-center"
      style="background: var(--n-color)"
    >
      <h2 class="text-3xl font-bold mb-4" style="letter-spacing: -1px">准备好了吗？</h2>
      <n-text depth="3" class="text-base block mb-8">立即注册，免费体验全部功能。</n-text>
      <n-button
        type="primary"
        size="large"
        @click="authUser ? router.push('/space') : router.push('/register')"
      >
        {{ authUser ? '进入我的空间' : '立即免费注册' }}
      </n-button>
    </section>
  </div>
</template>
