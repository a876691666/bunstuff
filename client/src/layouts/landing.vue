<script setup lang="ts">
import { useRouter } from 'vue-router'
import { MoonOutline as MoonIcon, SunnyOutline as SunIcon } from '@vicons/ionicons5'
import { isDark, toggleTheme } from '@/store/app'
import { authUser } from '@/store/auth'

const router = useRouter()
</script>

<template>
  <n-layout class="h-full flex flex-col">
    <!-- Header -->
    <n-layout-header bordered class="shrink-0 h-14 flex items-center justify-between px-8">
      <div class="flex items-center gap-2.5 cursor-pointer" @click="router.push('/')">
        <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="8" fill="#3ECF8E" />
          <path d="M16 6L26 22H6L16 6Z" fill="white" opacity="0.9" />
        </svg>
        <n-text class="text-base font-semibold">Platform</n-text>
      </div>
      <div class="flex items-center gap-2">
        <n-button quaternary circle @click="toggleTheme">
          <template #icon>
            <n-icon>
              <MoonIcon v-if="!isDark" />
              <SunIcon v-else />
            </n-icon>
          </template>
        </n-button>
        <template v-if="authUser">
          <n-button type="primary" size="small" @click="router.push('/space')">
            进入空间
          </n-button>
        </template>
        <template v-else>
          <n-button size="small" @click="router.push('/login')">登录</n-button>
          <n-button type="primary" size="small" @click="router.push('/register')">
            免费注册
          </n-button>
        </template>
      </div>
    </n-layout-header>

    <!-- Content -->
    <n-layout-content class="flex-1 overflow-auto">
      <RouterView />
    </n-layout-content>

    <!-- Footer -->
    <n-layout-footer bordered class="shrink-0 py-6 px-8">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="#3ECF8E" />
            <path d="M16 6L26 22H6L16 6Z" fill="white" opacity="0.9" />
          </svg>
          <n-text depth="3" class="text-sm">Platform</n-text>
        </div>
        <n-text depth="3" class="text-xs">© 2026 Platform. All rights reserved.</n-text>
        <div class="flex gap-4">
          <n-button text size="tiny" depth="3">隐私政策</n-button>
          <n-button text size="tiny" depth="3">服务条款</n-button>
          <n-button text size="tiny" depth="3">文档</n-button>
        </div>
      </div>
    </n-layout-footer>
  </n-layout>
</template>
