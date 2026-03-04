# 布局系统

## 🎯 概述

管理后台使用 `AdminLayout.vue`（约 301 行）作为主布局组件，基于 Naive UI 的 Layout 组件体系构建经典的顶栏 + 侧栏 + 内容区三栏布局。

## 🏗️ 布局结构

```
┌─────────────────────────────────────────────────────────┐
│ NLayoutHeader (64px)                                     │
│  ┌──────┬────────────────────────┬────────────────────┐ │
│  │ Logo │  NMenu (horizontal)    │  UserDropdown      │ │
│  │      │  顶部菜单              │  头像+用户名       │ │
│  └──────┴────────────────────────┴────────────────────┘ │
├────────────┬────────────────────────────────────────────┤
│ NLayoutSider│ NLayoutContent                            │
│ (240px)    │  ┌──────────────────────────────────────┐ │
│            │  │ NBreadcrumb (面包屑导航)              │ │
│ NMenu      │  ├──────────────────────────────────────┤ │
│ (vertical) │  │                                      │ │
│            │  │ RouterView (页面内容)                 │ │
│ 侧栏菜单   │  │                                      │ │
│            │  │                                      │ │
│ ◀ 可折叠   │  │                                      │ │
│ (→ 64px)   │  │                                      │ │
│            │  └──────────────────────────────────────┘ │
└────────────┴────────────────────────────────────────────┘
```

## 📦 组件层级

```vue
<NConfigProvider :locale="zhCN" :date-locale="dateZhCN">
  <NMessageProvider>
    <NDialogProvider>
      <NNotificationProvider>
        <NLayout position="absolute">
          <!-- 顶部导航栏 -->
          <NLayoutHeader bordered>
            <Logo />
            <NMenu mode="horizontal" />
            <UserDropdown />
          </NLayoutHeader>

          <!-- 主体区域 -->
          <NLayout has-sider>
            <!-- 侧边栏 -->
            <NLayoutSider
              bordered
              collapse-mode="width"
              :collapsed-width="64"
              :width="240"
              show-trigger
            >
              <NMenu :options="sideMenuOptions" />
            </NLayoutSider>

            <!-- 内容区域 -->
            <NLayoutContent>
              <NBreadcrumb />
              <RouterView />
            </NLayoutContent>
          </NLayout>
        </NLayout>
      </NNotificationProvider>
    </NDialogProvider>
  </NMessageProvider>
</NConfigProvider>
```

## 🔝 顶部导航栏

高度固定 **64px**，包含三个区域：

| 区域 | 组件               | 说明                         |
| ---- | ------------------ | ---------------------------- |
| 左侧 | Logo               | 系统 Logo 和名称             |
| 中间 | NMenu (horizontal) | 顶部一级菜单                 |
| 右侧 | UserDropdown       | 用户头像 + 用户名 + 下拉菜单 |

### UserDropdown 下拉菜单

| 选项     | 图标              | 跳转/操作            |
| -------- | ----------------- | -------------------- |
| 个人资料 | PersonOutline     | `/profile`           |
| 修改密码 | LockClosedOutline | `/change-password`   |
| 退出登录 | LogOutOutline     | `authStore.logout()` |

## 📎 侧边栏

| 属性     | 值                      | 说明             |
| -------- | ----------------------- | ---------------- |
| 展开宽度 | 240px                   | 正常状态         |
| 折叠宽度 | 64px                    | 仅显示图标       |
| 折叠方式 | `collapse-mode="width"` | 宽度过渡动画     |
| 触发器   | `show-trigger`          | 底部显示折叠按钮 |

### 菜单数据来源

侧栏菜单数据来自 `authStore.menuTree`，通过 `convertMenuTree` 方法转换为 Naive UI NMenu 所需的格式：

```ts
function convertMenuTree(items: MenuItem[]): MenuOption[] {
  return items
    .filter((item) => item.type !== 3) // 过滤按钮
    .map((item) => ({
      label: () =>
        item.type === 2
          ? h(RouterLink, { to: item.path }, { default: () => item.title })
          : item.title,
      key: item.path,
      icon: () => renderIcon(item.icon),
      children: item.children ? convertMenuTree(item.children) : undefined,
    }))
}
```

## 🎨 图标映射

后端菜单项的 `icon` 字段存储图标名称字符串，前端通过映射表转换为 ionicons5 组件：

```ts
import {
  HomeOutline,
  PeopleOutline,
  SettingsOutline,
  ShieldOutline,
  KeyOutline,
  DocumentOutline,
  // ...
} from '@vicons/ionicons5'

const iconMap: Record<string, Component> = {
  home: HomeOutline,
  people: PeopleOutline,
  settings: SettingsOutline,
  shield: ShieldOutline,
  key: KeyOutline,
  document: DocumentOutline,
  // ...更多映射
}

function renderIcon(iconName: string) {
  const icon = iconMap[iconName]
  return icon ? h(NIcon, null, { default: () => h(icon) }) : null
}
```

## 🍞 面包屑导航

基于 `route.matched` 自动生成面包屑：

```ts
const breadcrumbs = computed(() =>
  route.matched
    .filter((r) => r.meta?.title)
    .map((r) => ({
      label: r.meta.title as string,
      path: r.path,
    })),
)
```

```vue
<NBreadcrumb>
  <NBreadcrumbItem v-for="item in breadcrumbs" :key="item.path">
    <RouterLink :to="item.path">{{ item.label }}</RouterLink>
  </NBreadcrumbItem>
</NBreadcrumb>
```

## 🌐 Provider 链

全局 Provider 从外到内嵌套，确保所有子组件可以使用对应的 API：

```
NConfigProvider (zhCN 中文国际化)
  └─ NMessageProvider (消息提示)
       └─ NDialogProvider (对话框)
            └─ NNotificationProvider (通知)
                 └─ AdminLayout (布局内容)
```

:::tip
`NConfigProvider` 配置了 `locale={zhCN}` 和 `dateLocale={dateZhCN}`，所有 Naive UI 组件自动使用中文语言包。
:::

:::warning
Provider 的嵌套顺序有要求：NConfigProvider 必须在最外层，NMessageProvider 等可以在其内部任意顺序，但都必须包裹实际布局内容。
:::
