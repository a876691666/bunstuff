import { ref } from 'vue'

export const isDark = ref(false)
export const collapsed = ref(false)

export function toggleTheme() {
  isDark.value = !isDark.value
}

export function toggleCollapsed() {
  collapsed.value = !collapsed.value
}
