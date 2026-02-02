<script setup lang="ts">
import { shallowRef, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { NCard, NForm, NFormItem, NInput, NButton, NTabs, NTabPane, useMessage } from 'naive-ui'
import { useAuthStore } from '@/stores'

defineOptions({
  name: 'LoginPage',
})

const router = useRouter()
const message = useMessage()
const authStore = useAuthStore()

const activeTab = shallowRef('login')
const loading = shallowRef(false)

// 登录表单
const loginForm = reactive({
  username: '',
  password: '',
})

// 注册表单
const registerForm = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  nickname: '',
  email: '',
})

async function handleLogin() {
  if (!loginForm.username || !loginForm.password) {
    message.warning('请输入用户名和密码')
    return
  }

  loading.value = true
  try {
    await authStore.login({
      username: loginForm.username,
      password: loginForm.password,
    })
    message.success('登录成功')
    router.push('/admin')
  } catch (err: any) {
    message.error(err.message || '登录失败')
  } finally {
    loading.value = false
  }
}

async function handleRegister() {
  if (!registerForm.username || !registerForm.password) {
    message.warning('请填写必填项')
    return
  }

  if (registerForm.password !== registerForm.confirmPassword) {
    message.warning('两次密码不一致')
    return
  }

  loading.value = true
  try {
    await authStore.register({
      username: registerForm.username,
      password: registerForm.password,
      nickname: registerForm.nickname || undefined,
      email: registerForm.email || undefined,
    })
    message.success('注册成功，请登录')
    activeTab.value = 'login'
    loginForm.username = registerForm.username
    loginForm.password = ''
  } catch (err: any) {
    message.error(err.message || '注册失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-container">
    <NCard class="login-card" :bordered="false">
      <div class="login-header">
        <h1>管理系统</h1>
        <p>欢迎使用</p>
      </div>

      <NTabs v-model:value="activeTab" type="line" animated>
        <NTabPane name="login" tab="登录">
          <NForm>
            <NFormItem label="用户名" path="username">
              <NInput
                v-model:value="loginForm.username"
                placeholder="请输入用户名"
                @keyup.enter="handleLogin"
              />
            </NFormItem>
            <NFormItem label="密码" path="password">
              <NInput
                v-model:value="loginForm.password"
                type="password"
                placeholder="请输入密码"
                show-password-on="click"
                @keyup.enter="handleLogin"
              />
            </NFormItem>
            <NFormItem>
              <NButton type="primary" block :loading="loading" @click="handleLogin"> 登录 </NButton>
            </NFormItem>
          </NForm>
        </NTabPane>

        <NTabPane name="register" tab="注册">
          <NForm>
            <NFormItem label="用户名" path="username" required>
              <NInput v-model:value="registerForm.username" placeholder="请输入用户名" />
            </NFormItem>
            <NFormItem label="密码" path="password" required>
              <NInput
                v-model:value="registerForm.password"
                type="password"
                placeholder="请输入密码"
                show-password-on="click"
              />
            </NFormItem>
            <NFormItem label="确认密码" path="confirmPassword" required>
              <NInput
                v-model:value="registerForm.confirmPassword"
                type="password"
                placeholder="请再次输入密码"
                show-password-on="click"
              />
            </NFormItem>
            <NFormItem label="昵称" path="nickname">
              <NInput v-model:value="registerForm.nickname" placeholder="请输入昵称（选填）" />
            </NFormItem>
            <NFormItem label="邮箱" path="email">
              <NInput v-model:value="registerForm.email" placeholder="请输入邮箱（选填）" />
            </NFormItem>
            <NFormItem>
              <NButton type="primary" block :loading="loading" @click="handleRegister">
                注册
              </NButton>
            </NFormItem>
          </NForm>
        </NTabPane>
      </NTabs>
    </NCard>
  </div>
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 400px;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.login-header {
  text-align: center;
  margin-bottom: 24px;
}

.login-header h1 {
  margin: 0 0 8px;
  font-size: 28px;
  font-weight: 600;
  color: #333;
}

.login-header p {
  margin: 0;
  color: #666;
}
</style>
