import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { createAdminApi, createApi } from './modules'
import { openapi } from '@elysiajs/openapi'
import { sessionStore } from '@/modules/auth'
import { rbacService } from '@/modules/rbac'
import { dictService, configService } from '@/modules/system'

// 从环境变量或命令行参数读取配置
const SEED_AUTO_RUN = process.env.SEED_AUTO_RUN === 'true' || Bun.argv.includes('--seed')

// 初始化会话存储（从数据库加载）
await sessionStore.init()

// 初始化 RBAC 缓存
await rbacService.init()
console.log('✅ RBAC cache initialized')

// 初始化字典缓存
await dictService.initCache()
console.log('✅ Dict cache initialized')

// 初始化配置缓存
await configService.initCache()
console.log('✅ Config cache initialized')

// 创建 API 实例，传入 seed 配置
const api = createApi({
  seed: {
    autoRun: SEED_AUTO_RUN || true,
  },
})

const adminApi = createAdminApi({
  seed: {
    autoRun: SEED_AUTO_RUN || true,
  },
})

const app = new Elysia()
  .use(cors())
  .use(
    openapi({
      documentation: {
        info: {
          title: 'RBAC Admin API',
          version: '1.0.0',
          description: '基于 RBAC 的后台管理系统 API',
        },
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
              description: 'JWT 认证令牌',
            },
          },
        },
        tags: [
          // 客户端接口
          { name: '客户端 - 认证', description: '用户认证相关接口（登录、注册、登出等）' },
          { name: '客户端 - RBAC权限', description: '当前用户权限查询接口' },
          { name: '客户端 - 字典', description: '字典数据查询接口' },
          { name: '客户端 - 参数配置', description: '参数配置查询接口' },
          { name: '客户端 - 通知公告', description: '通知公告查询、SSE接口' },
          { name: '客户端 - 文件', description: '文件上传下载接口' },
          // 管理端接口
          { name: '管理 - 认证', description: '【管理】会话管理、在线用户管理' },
          { name: '管理 - 用户', description: '【管理】用户 CRUD 操作' },
          { name: '管理 - 角色', description: '【管理】角色 CRUD 操作' },
          { name: '管理 - 权限', description: '【管理】权限 CRUD 操作' },
          { name: '管理 - 菜单', description: '【管理】菜单 CRUD 操作' },
          { name: '管理 - 数据权限', description: '【管理】数据过滤规则管理' },
          { name: '管理 - 角色权限', description: '【管理】角色权限关联管理' },
          { name: '管理 - 角色菜单', description: '【管理】角色菜单关联管理' },
          { name: '管理 - RBAC权限', description: '【管理】角色/用户权限查询、缓存管理' },
          { name: '管理 - 字典', description: '【管理】字典类型和字典数据管理' },
          { name: '管理 - 参数配置', description: '【管理】系统参数配置管理' },
          { name: '管理 - 登录日志', description: '【管理】登录日志查询管理' },
          { name: '管理 - 通知公告', description: '【管理】通知公告发布管理' },
          { name: '管理 - 文件管理', description: '【管理】文件上传删除管理' },
          { name: '管理 - Seed', description: '【管理】数据初始化管理' },
        ],
      },
    }),
  )
  .get('/', () => 'Hello from Elysia!')
  .get('/api/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }))
  .use(api)
  .use(adminApi)
  .listen(3000)

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`)
