<script setup lang="ts">
import { shallowRef, reactive } from 'vue'
import { useRouter } from 'vue-router'
import {
  NCard,
  NForm,
  NFormItem,
  NInput,
  NButton,
  useMessage,
} from 'naive-ui'
import { authApi } from '@/api'
import { useAuthStore } from '@/stores'

const router = useRouter()
const message = useMessage()
const authStore = useAuthStore()

const loading = shallowRef(false)

const form = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

async function handleSubmit() {
  if (!form.oldPassword || !form.newPassword || !form.confirmPassword) {
    message.warning('请填写所有必填项')
    return
  }

  if (form.newPassword !== form.confirmPassword) {
    message.warning('两次密码不一致')
    return
  }

  if (form.newPassword.length < 6) {
    message.warning('新密码长度至少6位')
    return
  }

  loading.value = true
  try {
    await authApi.changePassword({
      oldPassword: form.oldPassword,
      newPassword: form.newPassword,
    })
    message.success('密码修改成功，请重新登录')
    await authStore.logout()
    router.push('/login')
  } catch (err: any) {
    message.error(err.message || '修改失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <NCard title="修改密码">
    <NForm style="max-width: 500px">
      <NFormItem label="原密码" required>
        <NInput
          v-model:value="form.oldPassword"
          type="password"
          placeholder="请输入原密码"
          show-password-on="click"
        />
      </NFormItem>
      <NFormItem label="新密码" required>
        <NInput
          v-model:value="form.newPassword"
          type="password"
          placeholder="请输入新密码（至少6位）"
          show-password-on="click"
        />
      </NFormItem>
      <NFormItem label="确认新密码" required>
        <NInput
          v-model:value="form.confirmPassword"
          type="password"
          placeholder="请再次输入新密码"
          show-password-on="click"
        />
      </NFormItem>
      <NFormItem>
        <NButton type="primary" :loading="loading" @click="handleSubmit">
          确认修改
        </NButton>
      </NFormItem>
    </NForm>
  </NCard>
</template>
