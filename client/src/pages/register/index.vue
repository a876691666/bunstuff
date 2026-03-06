<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { definePage } from 'vue-router/experimental'
import { MoonOutline as MoonIcon, SunnyOutline as SunIcon } from '@vicons/ionicons5'
import { apiRegister } from '@/api/auth'
import { isDark, toggleTheme } from '@/store/app'

definePage({ meta: { layout: 'full' } })

const router = useRouter()

const features = [
  '完整的用户认证与权限管理',
  '内置文件存储与 CDN 分发',
  '实时通知与消息推送',
  '可视化任务调度与监控',
]

const form = ref({ username: '', password: '', confirmPassword: '', nickname: '', email: '' })
const loading = ref(false)
const errorMsg = ref('')

async function handleRegister() {
  errorMsg.value = ''
  if (!form.value.username || !form.value.password) {
    errorMsg.value = '请输入用户名和密码'
    return
  }
  if (form.value.password !== form.value.confirmPassword) {
    errorMsg.value = '两次输入的密码不一致'
    return
  }
  loading.value = true
  try {
    await apiRegister({
      username: form.value.username,
      password: form.value.password,
      nickname: form.value.nickname || undefined,
      email: form.value.email || undefined,
    })
    router.push('/login')
  } catch (err: unknown) {
    errorMsg.value = err instanceof Error ? err.message : '注册失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="h-full flex">
    <!-- Left brand panel -->
    <div class="flex-1 flex flex-col p-12" style="border-right: 1px solid var(--n-divider-color)">
      <div class="flex items-center gap-2.5">
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="8" fill="#3ECF8E" />
          <path d="M16 6L26 22H6L16 6Z" fill="white" opacity="0.9" />
        </svg>
        <n-text class="text-base font-semibold">Platform</n-text>
      </div>

      <div class="flex-1 flex flex-col justify-center gap-5">
        <div>
          <n-text
            tag="h2"
            class="text-4xl font-bold"
            style="line-height: 1.2; letter-spacing: -1px"
          >
            构建更快，<br />发布更好。
          </n-text>
        </div>
        <n-text depth="3" class="text-sm" style="max-width: 380px; line-height: 1.8">
          基于现代化技术栈，提供完整的后端基础设施，让您专注于业务逻辑。
        </n-text>
        <div class="flex flex-col gap-3.5">
          <div v-for="item in features" :key="item" class="flex items-center gap-3">
            <div class="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <n-text depth="3" class="text-sm">{{ item }}</n-text>
          </div>
        </div>
      </div>

      <div class="flex gap-6">
        <n-button text size="small" depth="3">文档</n-button>
        <n-button text size="small" depth="3">API 参考</n-button>
      </div>
    </div>

    <!-- Right form panel -->
    <div class="w-120 shrink-0 flex items-center justify-center p-10 relative">
      <div class="absolute top-6 right-6">
        <n-button quaternary circle @click="toggleTheme">
          <template #icon>
            <n-icon>
              <MoonIcon v-if="!isDark" />
              <SunIcon v-else />
            </n-icon>
          </template>
        </n-button>
      </div>

      <div class="w-full max-w-85 flex flex-col gap-6">
        <div class="flex flex-col gap-1">
          <n-text tag="h1" class="text-2xl font-semibold" style="letter-spacing: -0.4px">
            创建账号
          </n-text>
          <n-text depth="3" class="text-sm">注册一个新账号开始使用</n-text>
        </div>

        <n-alert
          v-if="errorMsg"
          type="error"
          :bordered="false"
          :show-icon="false"
          class="rounded-md"
        >
          {{ errorMsg }}
        </n-alert>

        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-1.5">
            <n-text class="text-sm font-medium">用户名 <n-text type="error">*</n-text></n-text>
            <n-input
              v-model:value="form.username"
              placeholder="请输入用户名（2-50字符）"
              autocomplete="username"
              @keydown.enter="handleRegister"
            />
          </div>
          <div class="flex flex-col gap-1.5">
            <n-text class="text-sm font-medium">昵称</n-text>
            <n-input
              v-model:value="form.nickname"
              placeholder="请输入昵称（可选）"
              @keydown.enter="handleRegister"
            />
          </div>
          <div class="flex flex-col gap-1.5">
            <n-text class="text-sm font-medium">邮箱</n-text>
            <n-input
              v-model:value="form.email"
              placeholder="请输入邮箱（可选）"
              autocomplete="email"
              @keydown.enter="handleRegister"
            />
          </div>
          <div class="flex flex-col gap-1.5">
            <n-text class="text-sm font-medium">密码 <n-text type="error">*</n-text></n-text>
            <n-input
              v-model:value="form.password"
              type="password"
              show-password-on="click"
              placeholder="请输入密码（至少6位）"
              autocomplete="new-password"
              @keydown.enter="handleRegister"
            />
          </div>
          <div class="flex flex-col gap-1.5">
            <n-text class="text-sm font-medium">确认密码 <n-text type="error">*</n-text></n-text>
            <n-input
              v-model:value="form.confirmPassword"
              type="password"
              show-password-on="click"
              placeholder="请再次输入密码"
              autocomplete="new-password"
              @keydown.enter="handleRegister"
            />
          </div>
          <n-button type="primary" block :loading="loading" @click="handleRegister">
            注册
          </n-button>
        </div>

        <n-text depth="3" class="text-xs text-center" style="line-height: 1.6">
          继续即表示您同意我们的
          <n-button text size="tiny" @click="router.push('/terms')">服务条款</n-button>
          和
          <n-button text size="tiny" @click="router.push('/privacy')">隐私政策</n-button>。
        </n-text>

        <n-divider />

        <n-text depth="3" class="text-sm text-center">
          已有账号？
          <n-button text type="primary" @click="router.push('/login')">立即登录</n-button>
        </n-text>
      </div>
    </div>
  </div>
</template>
