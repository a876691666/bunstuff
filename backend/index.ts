import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { staticPlugin } from '@elysiajs/static'
import { createApi } from './core'
import { openapi } from '@elysiajs/openapi'
import { mkdirSync, existsSync } from 'fs'
import { resolve } from 'path'
import * as session from '@/services/session'
import * as rbacService from '@/services/rbac'
import * as dictService from '@/services/dict'
import * as configService from '@/services/sys-config'
import * as rateLimitService from '@/services/rate-limit'
import { rateLimitPlugin } from '@/plugins/rate-limit'
import * as jobService from '@/services/job'
import { crudRegistry } from '@/services/crud-table'
import { runSeeds } from '@/core/seed'

// 自动创建必要目录
const uploadsDir = resolve(process.cwd(), 'uploads')
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true })
  console.log('📁 Created uploads directory')
}

// 从环境变量或命令行参数读取配置
const SEED_AUTO_RUN = process.env.SEED_AUTO_RUN === 'true' || Bun.argv.includes('--seed')

// ===== 阶段1: 执行 Seed（确保数据库基础数据就绪） =====
await runSeeds({ autoRun: SEED_AUTO_RUN || true })

// ===== 阶段2: 初始化所有缓存（基于 seed 后的数据） =====
await session.init()

await rbacService.init()
console.log('✅ RBAC cache initialized')

await dictService.initCache()
console.log('✅ Dict cache initialized')

await configService.initCache()
console.log('✅ Config cache initialized')

await rateLimitService.initCache()
console.log('✅ RateLimit cache initialized')

await crudRegistry.initFromDb()

// ===== 阶段3: 构建 Elysia 应用并启动 =====
await jobService.start()

const api = createApi()

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
          { name: '管理 - 操作日志', description: '【管理】操作日志查询管理' },
          { name: '管理 - 通知公告', description: '【管理】通知公告发布管理' },
          { name: '管理 - 文件管理', description: '【管理】文件上传删除管理' },
          { name: '管理 - 定时任务', description: '【管理】定时任务调度管理' },
          { name: '管理 - 限流规则', description: '【管理】API限流规则配置管理' },
          { name: '管理 - IP黑名单', description: '【管理】IP黑名单管理' },
          { name: '管理 - Seed', description: '【管理】数据初始化管理' },
        ],
      },
    }),
  )
  // 配置静态文件服务，提供 uploads 目录的文件访问
  .use(
    staticPlugin({
      assets: uploadsDir,
      prefix: '/uploads',
    }),
  )
  // 配置前端静态文件服务
  .use(
    staticPlugin({
      assets: resolve(process.cwd(), 'client'),
      prefix: '/',
      alwaysStatic: true,
      indexHTML: false,
      ignorePatterns: ['/api', '/uploads', '/openapi', '/_admin'],
    }),
  )
  .get('/*', (c) => Bun.file(resolve(process.cwd(), 'client', 'index.html')))
  .use(
    staticPlugin({
      assets: resolve(process.cwd(), 'frontend'),
      prefix: '/_admin',
      alwaysStatic: true,
      indexHTML: false,
      ignorePatterns: ['/api', '/uploads', '/openapi'],
    }),
  )
  .get('/_admin', (c) => Bun.file(resolve(process.cwd(), 'frontend', 'index.html')))
  .get('/_admin/*', (c) => Bun.file(resolve(process.cwd(), 'frontend', 'index.html')))
  // 全局使用自定义的限流插件，应用于所有路由
  .use(rateLimitPlugin())
  .get('/api/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }))
  .use(api)
  .listen(3000)

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`)
