import { defineConfig } from '@/core/policy'

export default defineConfig({
  module: 'auth-client',
  name: '客户端 - 认证',
  description: '用户认证相关接口（登录、注册、登出等）',
  permissions: [],
  roles: {},
})
