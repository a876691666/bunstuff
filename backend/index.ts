import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { staticPlugin } from '@elysiajs/static'
import { openapi } from '@elysiajs/openapi'
import { resolve } from 'path'
import { rateLimitPlugin } from '@/plugins/rate-limit'
import { bootstrap, printServerUrls } from '@/core/bootstrap'
import { openApiTags } from '@/core'

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
        tags: openApiTags,
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
