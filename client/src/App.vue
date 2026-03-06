<script setup lang="ts">
import { darkTheme, zhCN, dateZhCN } from 'naive-ui'
import { useRoute } from 'vue-router'
import BasicLayout from '@/layouts/basic.vue'
import FullLayout from '@/layouts/full.vue'
import LandingLayout from '@/layouts/landing.vue'
import { isDark } from '@/store/app'

const route = useRoute()
</script>

<template>
  <n-config-provider :theme="isDark ? darkTheme : null" :locale="zhCN" :date-locale="dateZhCN" class="h-full">
    <n-dialog-provider>
      <n-notification-provider>
        <n-message-provider>
          <n-loading-bar-provider>
            <component :is="route.meta.layout === 'full' ? FullLayout : route.meta.layout === 'landing' ? LandingLayout : BasicLayout" />
          </n-loading-bar-provider>
        </n-message-provider>
      </n-notification-provider>
    </n-dialog-provider>
  </n-config-provider>
</template>
