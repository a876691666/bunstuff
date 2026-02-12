# 开发规范

## 命名规范

### 文件命名

| 场景 | 规范 | 示例 |
|------|------|------|
| 模型目录 | kebab-case | `dict-type/`、`role-permission/` |
| 模块目录 | kebab-case | `rate-limit/`、`login-log/` |
| 服务文件 | `service.ts` | `modules/auth/main/service.ts` |
| 路由文件 | `api_client.ts` / `api_admin.ts` | 客户端 / 管理端 |
| 插件文件 | `plugin.ts` | `modules/auth/main/plugin.ts` |
| Vue 组件 | PascalCase | `PageTable.vue`、`FormModal.vue` |
| Vue 视图 | PascalCase | `Users.vue`、`Roles.vue` |
| 组合函数 | `use*.ts` | `useTable.ts`、`useModal.ts` |

### 变量命名

| 场景 | 规范 | 示例 |
|------|------|------|
| Schema 类 | PascalCase + Schema 后缀 | `UsersSchema`、`RoleSchema` |
| Model 导出 | PascalCase | `User`、`Role`、`Menu` |
| Service 导出 | camelCase | `userService`、`roleService` |
| Plugin 导出 | camelCase + Plugin 后缀 | `authPlugin`、`rbacPlugin` |
| 权限编码 | 冒号分隔 | `user:admin:list`、`role:admin:create` |
| 字典编码 | snake_case | `sys_status`、`notice_type` |

## 后端开发规范

### 新增功能模块

1. **创建模型** — 在 `models/` 下新建目录

```typescript
// models/article/schema.ts
import { TimestampSchema, column } from '@pkg/orm'

export default class ArticleSchema extends TimestampSchema {
  id = column.number().primaryKey().autoIncrement().description('文章ID')
  title = column.string().default('').description('标题')
  content = column.string().default('').description('内容')
  status = column.number().default(1).description('状态：1正常 0禁用')
  authorId = column.number().default(0).description('作者ID')
}
```

```typescript
// models/article/index.ts
import { db } from '../main'
import Schema from './schema'
const Article = await db.model({ tableName: 'article', schema: Schema })
export default Article
```

2. **创建服务** — 继承 `CrudService`

```typescript
// modules/article/main/service.ts
import { CrudService } from '@/modules/crud-service'
import Article from '@/models/article'

class ArticleService extends CrudService<typeof Article.schemaInstance> {
  constructor() {
    super(Article)
  }
}

export const articleService = new ArticleService()
```

3. **创建路由** — 遵循 CRUD 模板

```typescript
// modules/article/main/api_admin.ts
import Elysia from 'elysia'
import { authPlugin } from '@/modules/auth/main/plugin'
import { rbacPlugin } from '@/modules/rbac/main/plugin'
import { query, idParams } from '@/packages/route-model'
import { R, PagedResponse, SuccessResponse, ErrorResponse } from '@/modules/response'
import Article from '@/models/article'
import { articleService } from './service'

export const articleAdminApi = new Elysia({ prefix: '/article', tags: ['文章管理'] })
  .use(authPlugin())
  .use(rbacPlugin())
  
  .get('/', async (ctx) => R.page(await articleService.findAll(ctx.query, ctx)), {
    query: query(),
    response: { 200: PagedResponse(Article.getSchema()) },
    detail: { rbac: { scope: { permissions: ['article:admin:list'] } } },
  })
  
  .get('/:id', async (ctx) => {
    const data = await articleService.findById(ctx.params.id, ctx)
    return data ? R.ok(data) : R.notFound('文章')
  }, {
    params: idParams(),
    response: { 200: SuccessResponse(Article.getSchema()), 404: ErrorResponse },
    detail: { rbac: { scope: { permissions: ['article:admin:read'] } } },
  })
  
  .post('/', async (ctx) => R.ok(await articleService.create(ctx.body, ctx)), {
    body: Article.getSchema({ exclude: ['id'], required: ['title'] }),
    response: { 200: SuccessResponse(Article.getSchema()) },
    detail: { rbac: { scope: { permissions: ['article:admin:create'] } } },
  })
  
  .put('/:id', async (ctx) => {
    const r = await articleService.update(ctx.params.id, ctx.body, ctx)
    return r ? R.ok(r) : R.notFound('文章')
  }, {
    params: idParams(),
    body: Article.getSchema({ exclude: ['id'], partial: true }),
    detail: { rbac: { scope: { permissions: ['article:admin:update'] } } },
  })
  
  .delete('/:id', async (ctx) => {
    return (await articleService.delete(ctx.params.id, ctx))
      ? R.success('删除成功') : R.notFound('文章')
  }, {
    params: idParams(),
    detail: { rbac: { scope: { permissions: ['article:admin:delete'] } } },
  })
```

4. **注册路由** — 在 `modules/index.ts` 中添加

```typescript
import { articleAdminApi } from './article/main/api_admin'

export function createAdminApi() {
  return new Elysia({ prefix: '/api/admin' })
    // ... 其他路由
    .use(articleAdminApi)
}
```

### 权限编码规范

权限编码采用三段式格式：`{资源}:{范围}:{操作}`

```
user:admin:list      # 管理端-用户列表
user:admin:create    # 管理端-创建用户
user:admin:update    # 管理端-更新用户
user:admin:delete    # 管理端-删除用户
article:client:read  # 客户端-读取文章
```

### 响应格式规范

所有 API 必须使用统一响应工具 `R`：

```typescript
// 成功
R.ok(data)              // { code: 0, message: '操作成功', data }
R.success('创建成功')    // { code: 0, message: '创建成功' }
R.page(pagedResult)     // { code: 0, data: [...], total, page, pageSize }

// 错误
R.badRequest('参数错误') // { code: 400, message: '参数错误' }
R.unauthorized()        // { code: 401, message: '未认证' }
R.forbidden()           // { code: 403, message: '无权限' }
R.notFound('资源')      // { code: 404, message: '资源不存在' }
R.serverError()         // { code: 500, message: '服务器错误' }
```

## 前端开发规范

### 新增管理页面

1. **创建 API** — 在 `frontend/src/api/` 下新增

```typescript
// api/article.ts
import { http } from '@/utils/http'

export const articleApi = {
  list: (params?: any) => http.getPage('/api/admin/article', params),
  detail: (id: number) => http.get(`/api/admin/article/${id}`),
  create: (data: any) => http.post('/api/admin/article', data),
  update: (id: number, data: any) => http.put(`/api/admin/article/${id}`, data),
  delete: (id: number) => http.delete(`/api/admin/article/${id}`),
}
```

2. **创建视图** — 使用通用组合函数

```vue
<script setup lang="ts">
import { PageTable, FormModal, FormField } from '@/components/common'
import { useTable, useModal } from '@/composables'
import { articleApi } from '@/api/article'

const { tableData, loading, pagination, handlePageChange, refresh } = useTable({
  fetchApi: articleApi.list,
})

const { modalVisible, modalTitle, formData, openCreate, openEdit, handleSave } = useModal({
  createApi: articleApi.create,
  updateApi: articleApi.update,
  onSuccess: refresh,
})

const columns = [
  { title: 'ID', key: 'id', width: 80 },
  { title: '标题', key: 'title' },
  { title: '状态', key: 'status' },
  { title: '创建时间', key: 'createdAt' },
]
</script>
```

### 组件使用规范

- 列表页统一使用 `PageTable` 组件
- 表单弹窗统一使用 `FormModal` 组件
- 搜索条件使用 `SearchForm` 组件
- 危险操作使用 `ConfirmButton` 组件
- 表格逻辑复用 `useTable` 组合函数
- 弹窗逻辑复用 `useModal` 组合函数
- 字典数据使用 `useDict` 组合函数

### SSQL 过滤规范

前端搜索条件通过 SSQL Builder 构建：

```typescript
import { SSQLBuilder } from '@/utils/ssql'

const filter = new SSQLBuilder()
  .eq('status', 1)
  .like('title', keyword)
  .build()

// 发送给后端：GET /api/admin/article?filter=status%20%3D%201%20%26%26%20title%20~%20'keyword'
```

## Git 提交规范

建议使用 Conventional Commits：

```
feat: 新增文章管理模块
fix: 修复用户列表分页问题
docs: 更新 API 文档
refactor: 重构权限检查逻辑
chore: 更新依赖版本
```
