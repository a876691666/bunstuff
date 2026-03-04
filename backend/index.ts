import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { staticPlugin } from '@elysiajs/static'
import { openapi } from '@elysiajs/openapi'
import { resolve } from 'path'
import { rateLimitPlugin } from '@/plugins/rate-limit'
import { bootstrap, printServerUrls } from '@/core/bootstrap'

// ===== 执行初始化流程：目录 → Seeds → Services → API =====
const { api, rootPath } = await bootstrap()

// ===== 构建 Elysia 应用并启动 =====
const uploadsDir = resolve(rootPath, 'uploads')

const app = new Elysia()
  .use(cors())
  // 全局错误处理：service 层 throw 的 Error 自动转为 R.fail 响应
  .onError({ as: 'global' }, ({ error, set }) => {
    if (error instanceof Error && error.message) {
      set.status = 200
      return { code: 400, message: error.message }
    }
  })
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
      assets: resolve(rootPath, 'client'),
      prefix: '/',
      alwaysStatic: true,
      indexHTML: false,
      ignorePatterns: ['/api', '/uploads', '/openapi', '/_admin'],
    }),
  )
  .get('/*', (c) => Bun.file(resolve(rootPath, 'client', 'index.html')))
  .use(
    staticPlugin({
      assets: resolve(rootPath, 'frontend'),
      prefix: '/_admin',
      alwaysStatic: true,
      indexHTML: false,
      ignorePatterns: ['/api', '/uploads', '/openapi'],
    }),
  )
  .get('/_admin', (c) => Bun.file(resolve(rootPath, 'frontend', 'index.html')))
  .get('/_admin/*', (c) => Bun.file(resolve(rootPath, 'frontend', 'index.html')))
  // 全局使用自定义的限流插件，应用于所有路由
  .use(rateLimitPlugin())
  .get('/api/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }))
  .use(api)
  .listen(3000)

printServerUrls(app.server?.hostname ?? 'localhost', app.server?.port ?? 3000)
