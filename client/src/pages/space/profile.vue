<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import { definePage } from 'vue-router/experimental'
import { useMessage } from 'naive-ui'
import {
  PersonOutline as PersonIcon,
  ShieldCheckmarkOutline as SecurityIcon,
} from '@vicons/ionicons5'
import { apiGetMe, apiUpdateProfile, apiChangePassword } from '@/api/auth'
import type { UserProfile, UpdateProfileBody } from '@/api/auth'
import { authUser } from '@/store/auth'

definePage({ meta: { layout: 'basic', requiresAuth: true } })

const message = useMessage()
const loading = ref(false)
const saving = ref(false)
const pwdLoading = ref(false)
const activeTab = ref('profile')

const profile = shallowRef<UserProfile | null>(null)
const form = shallowRef<UpdateProfileBody>({
  nickname: '',
  email: null,
  phone: null,
})

const pwdForm = shallowRef({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const avatarChar = () => {
  const p = profile.value
  if (!p) return '?'
  const name = p.nickname || p.username || '?'
  return name.charAt(0).toUpperCase()
}

const roleName = () => {
  const r = profile.value?.roleId
  if (!r) return ''
  const map: Record<string, string> = { admin: '管理员', user: '普通用户', vip: 'VIP 用户' }
  return map[r] ?? r
}

async function loadProfile() {
  loading.value = true
  try {
    const data = await apiGetMe()
    profile.value = data
    form.value = {
      nickname: data.nickname ?? '',
      email: data.email,
      phone: data.phone,
    }
  } catch {
    // http 层已统一处理
  } finally {
    loading.value = false
  }
}

async function handleSaveProfile() {
  saving.value = true
  try {
    const data = await apiUpdateProfile(form.value)
    profile.value = data
    if (authUser.value) {
      authUser.value = { ...authUser.value, nickname: data.nickname }
      localStorage.setItem('auth_user', JSON.stringify(authUser.value))
    }
    message.success('资料更新成功')
  } catch {
    // http 层已统一处理
  } finally {
    saving.value = false
  }
}

async function handleChangePassword() {
  const { oldPassword, newPassword, confirmPassword } = pwdForm.value
  if (!oldPassword || !newPassword) {
    message.warning('请填写完整')
    return
  }
  if (newPassword !== confirmPassword) {
    message.warning('两次密码输入不一致')
    return
  }
  if (newPassword.length < 6) {
    message.warning('新密码至少6位')
    return
  }
  pwdLoading.value = true
  try {
    await apiChangePassword(oldPassword, newPassword)
    pwdForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
    message.success('密码修改成功')
  } catch {
    // http 层已统一处理
  } finally {
    pwdLoading.value = false
  }
}

loadProfile()
</script>

<template>
  <div class="h-full flex flex-col gap-0">
    <!-- 页头 -->
    <div class="pb-5 border-b border-[var(--n-border-color)]">
      <n-spin :show="loading && !profile">
        <div v-if="profile" class="flex items-center gap-5">
          <n-avatar
            :size="72"
            round
            :src="profile.avatar || undefined"
            class="shrink-0"
            :style="{ fontSize: '28px', fontWeight: 600 }"
          >
            {{ avatarChar() }}
          </n-avatar>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-3">
              <n-text class="text-xl font-semibold" style="letter-spacing: -0.3px">
                {{ profile.nickname || profile.username }}
              </n-text>
              <n-tag :bordered="false" size="small" type="info" round>
                {{ roleName() }}
              </n-tag>
            </div>
            <n-text depth="3" class="text-sm mt-0.5 block">@{{ profile.username }}</n-text>
            <div class="flex items-center gap-4 mt-2">
              <n-text v-if="profile.email" depth="3" class="text-xs">{{ profile.email }}</n-text>
              <n-text v-if="profile.phone" depth="3" class="text-xs">{{ profile.phone }}</n-text>
            </div>
          </div>
        </div>
        <div v-else class="h-18" />
      </n-spin>
    </div>

    <!-- 选项卡导航 -->
    <div class="flex gap-0 border-b border-[var(--n-border-color)]">
      <button
        class="px-4 py-2.5 text-sm cursor-pointer bg-transparent border-none border-b-2 transition-colors"
        :class="activeTab === 'profile'
          ? 'border-b-[var(--n-color)] text-[var(--n-text-color)] font-medium'
          : 'border-b-transparent text-[var(--n-text-color-3)] hover:text-[var(--n-text-color-2)]'"
        @click="activeTab = 'profile'"
      >
        <span class="flex items-center gap-1.5">
          <n-icon :size="15"><PersonIcon /></n-icon>
          基本资料
        </span>
      </button>
      <button
        class="px-4 py-2.5 text-sm cursor-pointer bg-transparent border-none border-b-2 transition-colors"
        :class="activeTab === 'security'
          ? 'border-b-[var(--n-color)] text-[var(--n-text-color)] font-medium'
          : 'border-b-transparent text-[var(--n-text-color-3)] hover:text-[var(--n-text-color-2)]'"
        @click="activeTab = 'security'"
      >
        <span class="flex items-center gap-1.5">
          <n-icon :size="15"><SecurityIcon /></n-icon>
          安全设置
        </span>
      </button>
    </div>

    <!-- 内容区 -->
    <div class="pt-6 flex-1">
      <!-- 基本资料 -->
      <div v-show="activeTab === 'profile'" class="max-w-lg">
        <n-text class="text-base font-medium block mb-1">基本资料</n-text>
        <n-text depth="3" class="text-xs block mb-5">更新您的个人信息，这些信息将展示在您的个人主页上。</n-text>

        <div class="flex flex-col gap-5">
          <div>
            <n-text depth="3" class="text-xs block mb-1.5">昵称</n-text>
            <n-input
              :value="form.nickname ?? ''"
              placeholder="设置一个昵称"
              @update:value="(v: string) => { form = { ...form, nickname: v } }"
            />
          </div>

          <div>
            <n-text depth="3" class="text-xs block mb-1.5">邮箱</n-text>
            <n-input
              :value="form.email ?? ''"
              placeholder="your@email.com"
              @update:value="(v: string) => { form = { ...form, email: v || null } }"
            />
          </div>

          <div>
            <n-text depth="3" class="text-xs block mb-1.5">手机号</n-text>
            <n-input
              :value="form.phone ?? ''"
              placeholder="输入手机号"
              @update:value="(v: string) => { form = { ...form, phone: v || null } }"
            />
          </div>

          <div class="flex justify-end pt-2 border-t border-[var(--n-border-color)]">
            <n-button type="primary" :loading="saving" @click="handleSaveProfile" size="medium">
              保存修改
            </n-button>
          </div>
        </div>
      </div>

      <!-- 安全设置 -->
      <div v-show="activeTab === 'security'" class="max-w-lg">
        <n-text class="text-base font-medium block mb-1">修改密码</n-text>
        <n-text depth="3" class="text-xs block mb-5">定期更换密码有助于保护您的账户安全。</n-text>

        <div class="flex flex-col gap-5">
          <div>
            <n-text depth="3" class="text-xs block mb-1.5">当前密码</n-text>
            <n-input
              type="password"
              show-password-on="click"
              :value="pwdForm.oldPassword"
              placeholder="输入当前密码"
              @update:value="(v: string) => { pwdForm = { ...pwdForm, oldPassword: v } }"
            />
          </div>

          <div>
            <n-text depth="3" class="text-xs block mb-1.5">新密码</n-text>
            <n-input
              type="password"
              show-password-on="click"
              :value="pwdForm.newPassword"
              placeholder="至少 6 个字符"
              @update:value="(v: string) => { pwdForm = { ...pwdForm, newPassword: v } }"
            />
          </div>

          <div>
            <n-text depth="3" class="text-xs block mb-1.5">确认新密码</n-text>
            <n-input
              type="password"
              show-password-on="click"
              :value="pwdForm.confirmPassword"
              placeholder="再次输入新密码"
              @update:value="(v: string) => { pwdForm = { ...pwdForm, confirmPassword: v } }"
            />
          </div>

          <div class="flex justify-end pt-2 border-t border-[var(--n-border-color)]">
            <n-button type="warning" :loading="pwdLoading" @click="handleChangePassword" size="medium">
              修改密码
            </n-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
