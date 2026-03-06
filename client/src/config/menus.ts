import type { MenuOption } from 'naive-ui'
import { h } from 'vue'
import { NIcon } from 'naive-ui'
import { HomeOutline, InformationCircleOutline } from '@vicons/ionicons5'
import type { Component } from 'vue'

function renderIcon(icon: Component) {
  return () => h(NIcon, null, { default: () => h(icon) })
}

export const menuOptions: MenuOption[] = [
  {
    label: '首页',
    key: '/space',
    icon: renderIcon(HomeOutline),
  },
  {
    label: '关于',
    key: '/space/about',
    icon: renderIcon(InformationCircleOutline),
  },
]
