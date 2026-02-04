<script setup lang="ts">
import {
  NLayout,
  NLayoutHeader,
  NLayoutSider,
  NLayoutContent,
  NMenu,
  NDropdown,
  NAvatar,
  NIcon,
  NBreadcrumb,
  NBreadcrumbItem,
  NSpace,
} from 'naive-ui'
import { h, shallowRef, type Component } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores'
import type { MenuOption } from 'naive-ui'
import {
  HomeOutline,
  PersonOutline,
  ShieldCheckmarkOutline,
  SettingsOutline,
  MenuOutline,
  LockClosedOutline,
  KeyOutline,
  ListOutline,
  PeopleOutline,
  DiamondOutline,
  ServerOutline,
} from '@vicons/ionicons5'
import type { MenuTree } from '@/types'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const collapsed = shallowRef(false)
const activeTopMenu = shallowRef('admin')

// 图标映射
const iconMap: Record<string, Component> = {
  home: HomeOutline,
  person: PersonOutline,
  shield: ShieldCheckmarkOutline,
  settings: SettingsOutline,
  menu: MenuOutline,
  lock: LockClosedOutline,
  key: KeyOutline,
  list: ListOutline,
  people: PeopleOutline,
  diamond: DiamondOutline,
  server: ServerOutline,
}

function renderIcon(iconName: string | null) {
  if (!iconName) return undefined
  const icon = iconMap[iconName] || MenuOutline
  return () => h(NIcon, null, { default: () => h(icon) })
}

// 顶部菜单选项
const topMenuOptions: MenuOption[] = [
  {
    label: '管理后台',
    key: 'admin',
    icon: renderIcon('settings'),
  },
]

// 将后端菜单树转换为 Naive UI 菜单格式
function convertMenuTree(menus: MenuTree[]): MenuOption[] {
  return menus
    .filter((menu) => !menu.isHidden) // 过滤隐藏菜单
    .sort((a, b) => a.sort - b.sort)
    .map((menu) => {
      const option: MenuOption = {
        label: menu.name,
        key: menu.path || String(menu.id),
        icon: renderIcon(menu.icon),
      }
      if (menu.children && menu.children.length > 0) {
        const children = convertMenuTree(menu.children)
        if (children.length > 0) {
          option.children = children
        }
      }
      return option
    })
}

// 侧边栏菜单
const sideMenuOptions = (): MenuOption[] => {
  // 使用后端返回的菜单数据
  if (authStore.menuTree.length > 0) {
    return convertMenuTree(authStore.menuTree)
  }
  // 没有菜单数据时返回空数组
  return []
}

// 用户下拉菜单
const userDropdownOptions = [
  {
    label: '个人信息',
    key: 'profile',
    icon: renderIcon('person'),
  },
  {
    label: '修改密码',
    key: 'password',
    icon: renderIcon('lock'),
  },
  {
    type: 'divider',
    key: 'd1',
  },
  {
    label: '退出登录',
    key: 'logout',
    icon: renderIcon('settings'),
  },
]

function handleTopMenuSelect(key: string) {
  activeTopMenu.value = key
}

function handleSideMenuSelect(key: string) {
  if (key.startsWith('/')) {
    router.push(key)
  }
}

async function handleUserDropdownSelect(key: string) {
  switch (key) {
    case 'profile':
      router.push('/profile')
      break
    case 'password':
      router.push('/change-password')
      break
    case 'logout':
      await authStore.logout()
      router.push('/login')
      break
  }
}

// 面包屑
const breadcrumbs = () => {
  const items: { label: string; path?: string }[] = [{ label: '首页', path: '/dashboard' }]

  const matched = route.matched
  for (const record of matched) {
    if (record.meta.title) {
      items.push({
        label: record.meta.title as string,
        path: record.path,
      })
    }
  }

  return items
}
</script>

<template>
  <NLayout class="admin-layout" position="absolute">
    <!-- 顶部导航 -->
    <NLayoutHeader class="header" bordered>
      <div class="header-left">
        <div class="logo">
          <span class="logo-icon">🎯</span>
          <span class="logo-text">管理系统</span>
        </div>
        <NMenu
          mode="horizontal"
          :options="topMenuOptions"
          :value="activeTopMenu"
          @update:value="handleTopMenuSelect"
        />
      </div>
      <div class="header-right">
        <NDropdown :options="userDropdownOptions" @select="handleUserDropdownSelect">
          <NSpace align="center" class="user-info">
            <NAvatar round size="small">
              {{ authStore.user?.username?.charAt(0)?.toUpperCase() || 'U' }}
            </NAvatar>
            <span>{{ authStore.user?.nickname || authStore.user?.username || '用户' }}</span>
          </NSpace>
        </NDropdown>
      </div>
    </NLayoutHeader>

    <NLayout has-sider position="absolute" style="top: 64px">
      <!-- 侧边栏 -->
      <NLayoutSider
        bordered
        collapse-mode="width"
        :collapsed-width="64"
        :width="240"
        :collapsed="collapsed"
        show-trigger
        @collapse="collapsed = true"
        @expand="collapsed = false"
      >
        <NMenu
          :collapsed="collapsed"
          :collapsed-width="64"
          :collapsed-icon-size="22"
          :options="sideMenuOptions()"
          :value="route.path"
          @update:value="handleSideMenuSelect"
        />
      </NLayoutSider>

      <!-- 内容区域 -->
      <NLayoutContent class="content" content-style="padding: 24px;">
        <!-- 面包屑 -->
        <NBreadcrumb class="breadcrumb">
          <NBreadcrumbItem v-for="(item, index) in breadcrumbs()" :key="index">
            <router-link v-if="item.path && index < breadcrumbs().length - 1" :to="item.path">
              {{ item.label }}
            </router-link>
            <span v-else>{{ item.label }}</span>
          </NBreadcrumbItem>
        </NBreadcrumb>

        <!-- 页面内容 -->
        <div class="page-content">
          <router-view />
        </div>
      </NLayoutContent>
    </NLayout>
  </NLayout>
</template>

<style scoped>
.admin-layout {
  height: 100vh;
}

.header {
  height: 64px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 24px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-icon {
  font-size: 28px;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.user-info:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.content {
  background-color: #f5f7f9;
}

.breadcrumb {
  margin-bottom: 16px;
}

.page-content {
  min-height: calc(100vh - 64px - 48px - 40px);
}
</style>
