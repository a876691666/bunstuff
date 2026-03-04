# 开发规范

本章节定义 Bunstuff 项目的开发规范和约定，确保代码风格一致、结构清晰。

## 📝 命名规范

### 文件命名

| 类型        | 规范                  | 示例                             |
| ----------- | --------------------- | -------------------------------- |
| 目录名      | `kebab-case`          | `dict-data/`, `login-log/`       |
| Schema 文件 | `schema.ts`           | `models/users/schema.ts`         |
| Seed 文件   | `seed.ts`             | `models/users/seed.ts`           |
| 服务文件    | `kebab-case.ts`       | `services/sys-config.ts`         |
| 插件文件    | `kebab-case.ts`       | `plugins/rate-limit.ts`          |
| 路由目录    | `kebab-case/index.ts` | `api/admin/job-log/index.ts`     |
| 权限文件    | `policy.ts`           | `api/admin/users/policy.ts`      |
| Vue 组件    | `PascalCase.vue`      | `PageTable.vue`, `FormModal.vue` |
| 组合函数    | `camelCase.ts`        | `useTable.ts`, `useModal.ts`     |

### 变量命名

| 类型       | 规范           | 示例                                   |
| ---------- | -------------- | -------------------------------------- |
| Schema 类  | `XxxSchema`    | `UserSchema`, `RoleSchema`             |
| Model 实例 | `XxxModel`     | `UserModel`, `RoleModel`               |
| Service 类 | `XxxService`   | `UserService`, `RoleService`           |
| Plugin     | `xxxPlugin`    | `authPlugin`, `rbacPlugin`             |
| 权限编码   | `模块:端:操作` | `user:admin:list`, `role:admin:create` |
| 数据表名   | `snake_case`   | `users`, `dict_type`, `sys_config`     |

## 🔧 后端开发规范

### 新增模块流程

新增一个完整的后端模块需要 4 步：

```
步骤 1: models/xxx/schema.ts       ← 定义表结构
步骤 2: models/xxx/seed.ts         ← 初始数据（可选）
步骤 3: services/xxx.ts            ← 业务服务
步骤 4: api/admin/xxx/index.ts     ← API 路由
步骤 5: api/admin/xxx/policy.ts    ← 权限策略（可选）
步骤 6: bun run generate           ← 自动注册
```

### Schema 定义规范

```typescript
// models/xxx/schema.ts
import { TimestampSchema, column } from '@pkg/orm'

export const tableName = 'xxx'

export default class XxxSchema extends TimestampSchema {
  tableName = tableName

  // 字段定义：类型 + 修饰链
  name = column.string().description('名称')
  status = column.number().default(1).description('状态 0停用 1正常')
  remark = column.string().nullable().description('备注')
}
```

### Service 规范

```typescript
// services/xxx.ts
import { CrudService } from '@/core/crud'
import XxxSchema from '@/models/xxx/schema'

class XxxServiceClass extends CrudService<XxxSchema> {
  constructor() {
    super(XxxSchema)
  }
}

export const xxxService = new XxxServiceClass()
```

### API 路由规范

```typescript
// api/admin/xxx/index.ts
import { Elysia } from 'elysia'
import { xxxService as service } from '@/services/xxx'
import { R } from '@/services/response'

export default new Elysia({ prefix: '/xxx' }).get(
  '/',
  async ({ query }) => {
    const result = await service.findAll(query)
    return R.page(result)
  },
  {
    query: service.getSchema('query'),
    response: { 200: PagedResponse(service.getSchema()) },
    detail: {
      tags: ['管理 - XXX'],
      summary: 'XXX 列表',
      security: [{ bearerAuth: [] }],
      rbac: { permissions: ['xxx:admin:list'], scope: 'xxx:admin:list' },
      operLog: { title: 'XXX管理', type: 'list' },
    },
  },
)
```

### 权限编码规范

权限编码采用三段式格式：`模块:端:操作`

| 段   | 说明       | 示例                                           |
| ---- | ---------- | ---------------------------------------------- |
| 模块 | 功能模块名 | `user`, `role`, `menu`, `dict`                 |
| 端   | 使用端     | `admin`（管理端）, 省略则为客户端              |
| 操作 | 具体动作   | `list`, `create`, `update`, `delete`, `export` |

示例：

```
user:admin:list      # 管理端 - 用户列表
user:admin:create    # 管理端 - 创建用户
role:admin:update    # 管理端 - 更新角色
dict:admin:delete    # 管理端 - 删除字典
```

### 统一响应规范

所有 API 接口使用 `R` 工具返回统一格式：

```typescript
import { R } from '@/services/response'

// 成功响应
R.ok(data) // { code: 200, message: 'ok', data }
R.success('操作成功') // { code: 200, message: '操作成功' }
R.page({ list, total, page }) // { code: 200, data: [...], total, page }

// 错误响应
R.badRequest('参数错误') // { code: 400, message: '参数错误' }
R.unauthorized('未登录') // { code: 401, message: '未登录' }
R.forbidden('无权限') // { code: 403, message: '无权限' }
R.notFound('未找到') // { code: 404, message: '未找到' }
R.serverError('服务器错误') // { code: 500, message: '服务器错误' }
```

## 💻 前端开发规范

### 新增页面流程

```
步骤 1: api/xxx.ts              ← 定义 API 请求
步骤 2: views/admin/xxx.vue     ← 页面视图
步骤 3: router 配置             ← 动态路由由菜单自动生成
```

### 页面开发模式

推荐使用 `useTable` + `useModal` + `useDict` 组合模式：

```vue
<script setup lang="ts">
import { useTable } from '@/composables/useTable'
import { useModal } from '@/composables/useModal'
import { xxxApi } from '@/api/xxx'

const { tableData, loading, pagination, handleSearch } = useTable(xxxApi.list)
const { visible, formData, handleAdd, handleEdit, handleSave } = useModal(xxxApi)
</script>

<template>
  <PageTable :data="tableData" :loading="loading" :pagination="pagination">
    <template #header>
      <n-button @click="handleAdd">新增</n-button>
    </template>
  </PageTable>
  <FormModal v-model:visible="visible" :data="formData" @save="handleSave" />
</template>
```

## 📐 SSQL 过滤规范

前端通过 SSQL Builder 构建查询条件，后端自动解析过滤：

```typescript
// 前端 - SSQLBuilder
const filter = new SSQLBuilder().eq('status', 1).like('name', keyword).build()

// 后端 - 自动处理
// CrudService.findAll(query) 自动解析 query.filter 中的 SSQL 条件
```

常用 SSQL 语法：

| 语法              | 说明     | 示例                          |
| ----------------- | -------- | ----------------------------- |
| `=`               | 等于     | `status = 1`                  |
| `!=`              | 不等于   | `status != 0`                 |
| `~`               | 模糊匹配 | `name ~ 'test'`               |
| `>` `<` `>=` `<=` | 比较     | `age > 18`                    |
| `?=`              | IN 查询  | `status ?= [1,2,3]`           |
| `><`              | BETWEEN  | `age >< [18,60]`              |
| `=null`           | 为空     | `remark =null`                |
| `&&`              | 且       | `status = 1 && name ~ 'test'` |
| `\|\|`            | 或       | `status = 1 \|\| status = 2`  |

## 📋 Git 提交规范

```
feat: 新功能
fix: 修复 bug
docs: 文档更新
style: 代码格式（不影响功能）
refactor: 重构
perf: 性能优化
test: 测试
chore: 构建/工具变更
```

示例：

```bash
git commit -m "feat: 新增 VIP 会员管理模块"
git commit -m "fix: 修复 RBAC 权限缓存未刷新问题"
git commit -m "docs: 更新部署文档"
```
