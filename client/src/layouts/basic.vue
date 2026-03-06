<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { menuOptions } from '@/config/menus'
import {
  MoonOutline as MoonIcon,
  SunnyOutline as SunIcon,
  MenuOutline as MenuIcon,
  LogOutOutline as LogoutIcon,
} from '@vicons/ionicons5'
import { apiLogout } from '@/api/auth'
import { isDark, toggleTheme, toggleCollapsed, collapsed } from '@/store/app'
import { clearAuth, authUser } from '@/store/auth'
import { useMessage } from 'naive-ui'

const router = useRouter()
const route = useRoute()
const message = useMessage()

function handleMenuUpdate(key: string) {
  router.push(key)
}

async function handleLogout() {
  try {
    await apiLogout()
  } catch {}
  clearAuth()
  router.push('/')
  message.success('已退出登录')
}
</script>

<template>
  <n-layout has-sider class="h-full">
    <n-layout-sider
      bordered
      :collapsed="collapsed"
      collapse-mode="width"
      :collapsed-width="64"
      :width="220"
      show-trigger
      @collapse="collapsed = true"
      @expand="collapsed = false"
    >
      <div class="flex items-center justify-center h-12 font-bold text-lg">
        <span v-if="!collapsed">Client</span>
        <span v-else>C</span>
      </div>
      <n-menu
        :collapsed="collapsed"
        :collapsed-width="64"
        :options="menuOptions"
        :value="route.path"
        @update:value="handleMenuUpdate"
      />
    </n-layout-sider>

    <n-layout>
      <n-layout-header bordered class="h-12 flex items-center justify-between px-6">
        <n-button quaternary circle @click="toggleCollapsed">
          <template #icon>
            <n-icon><MenuIcon /></n-icon>
          </template>
        </n-button>
        <div class="flex items-center gap-2">
          <n-text depth="3" class="text-sm" v-if="authUser">{{
            authUser.nickname || authUser.username
          }}</n-text>
          <n-button quaternary circle @click="toggleTheme">
            <template #icon>
              <n-icon>
                <MoonIcon v-if="!isDark" />
                <SunIcon v-else />
              </n-icon>
            </template>
          </n-button>
          <n-button quaternary circle @click="handleLogout">
            <template #icon>
              <n-icon><LogoutIcon /></n-icon>
            </template>
          </n-button>
        </div>
      </n-layout-header>

      <n-layout-content content-class="p-6" class="h-[calc(100%-48px)] overflow-auto">
        <RouterView />
      </n-layout-content>
    </n-layout>
  </n-layout>
</template>
