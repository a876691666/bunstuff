# CRUD 开发指南

## 🎯 概述

本指南介绍如何使用 **CrudTable + CrudSearch + CrudModal** 组件配合 **useTable + useModal** composable，快速开发标准增删改查页面。

## 🚀 开发步骤

### 步骤总览

| 步骤 | 内容 | 涉及 |
|------|------|------|
| 1 | 定义搜索字段 | `searchFields` 配置 |
| 2 | 初始化 useTable | API + query + opMap |
| 3 | 初始化 useModal | defaultData + API + 回调 |
| 4 | 定义表格列 | `columns` 配置 |
| 5 | 编写模板 | CrudSearch + CrudTable + CrudModal |

### 步骤 1：定义搜索字段

```ts
const searchFields = [
  { label: '用户名', key: 'username', type: 'input' },
  { label: '状态', key: 'status', type: 'select', options: statusOptions },
  { label: '创建时间', key: 'createdAt', type: 'daterange' },
]
```

### 步骤 2：初始化 useTable

```ts
const table = useTable<User, UserQuery>({
  api: userApi.list,
  defaultQuery: {
    username: '',
    status: null,
    createdAt: null,
  },
  defaultPageSize: 10,
  opMap: {
    username: 'like',
    status: 'eq',
    createdAt: 'between',
  }
})
```

### 步骤 3：初始化 useModal

```ts
const modal = useModal<CreateUserDto, number>({
  defaultData: {
    username: '',
    password: '',
    nickname: '',
    email: '',
    status: 1,
  },
  createApi: userApi.create,
  updateApi: userApi.update,
  onSuccess: () => {
    message.success(modal.isEdit.value ? '更新成功' : '创建成功')
    table.reload()
  }
})
```

### 步骤 4：定义表格列

```ts
const columns: DataTableColumn<User>[] = [
  { title: 'ID', key: 'id', width: 80 },
  { title: '用户名', key: 'username' },
  { title: '昵称', key: 'nickname' },
  { title: '邮箱', key: 'email' },
  {
    title: '状态',
    key: 'status',
    render: (row) => getStatusLabel(row.status)
  },
  { title: '创建时间', key: 'createdAt', width: 180 },
  {
    title: '操作',
    key: 'action',
    width: 200,
    fixed: 'right',
  }
]
```

### 步骤 5：编写模板

```vue
<template>
  <div>
    <!-- 搜索区域 -->
    <CrudSearch :fields="searchFields" :use-table="table" />

    <!-- 数据表格 -->
    <CrudTable :use-table="table" :columns="columns">
      <template #toolbar>
        <NButton type="primary" @click="modal.open()">
          <template #icon><NIcon><AddOutline /></NIcon></template>
          新增
        </NButton>
      </template>

      <template #action="{ row }">
        <NSpace>
          <NButton size="small" @click="modal.edit(row)">编辑</NButton>
          <CrudConfirm @confirm="handleDelete(row.id)">删除</CrudConfirm>
        </NSpace>
      </template>
    </CrudTable>

    <!-- 表单弹窗 -->
    <CrudModal :use-modal="modal">
      <NFormItem label="用户名" path="username">
        <NInput v-model:value="modal.formData.value.username" :disabled="modal.isEdit.value" />
      </NFormItem>
      <NFormItem v-if="!modal.isEdit.value" label="密码" path="password">
        <NInput v-model:value="modal.formData.value.password" type="password" />
      </NFormItem>
      <NFormItem label="昵称" path="nickname">
        <NInput v-model:value="modal.formData.value.nickname" />
      </NFormItem>
      <NFormItem label="邮箱" path="email">
        <NInput v-model:value="modal.formData.value.email" />
      </NFormItem>
      <NFormItem label="状态" path="status">
        <NSelect v-model:value="modal.formData.value.status" :options="statusOptions" />
      </NFormItem>
    </CrudModal>
  </div>
</template>
```

## 🔧 删除处理

```ts
async function handleDelete(id: number) {
  await userApi.delete(id)
  message.success('删除成功')
  table.reload()
}
```

## 📐 SSQL 前端构建器

对于复杂查询场景，可以使用 SSQL Builder 手动构建筛选条件：

```ts
import { where } from '@/utils/ssql'

// 链式调用
const filter = where()
  .like('username', 'admin')
  .eq('status', 1)
  .between('createdAt', '2025-01-01', '2025-12-31')
  .toString()

// 输出: username~admin,status=1,createdAt><2025-01-01|2025-12-31
```

### 支持的操作符

| 方法 | SSQL 符号 | SQL 等价 |
|------|-----------|----------|
| `eq(key, value)` | `=` | `= value` |
| `ne(key, value)` | `!=` | `!= value` |
| `gt(key, value)` | `>` | `> value` |
| `gte(key, value)` | `>=` | `>= value` |
| `lt(key, value)` | `<` | `< value` |
| `lte(key, value)` | `<=` | `<= value` |
| `like(key, value)` | `~` | `LIKE '%value%'` |
| `in(key, values)` | `@` | `IN (values)` |
| `between(key, a, b)` | `><` | `BETWEEN a AND b` |

:::tip
`useTable` 的 `opMap` 配置在内部会自动调用 SSQL Builder，大多数场景无需手动使用。仅在需要自定义复杂查询时才需要直接使用 `where()` 构建器。
:::

## 📋 完整文件结构

一个标准 CRUD 页面的文件结构：

```
views/system/users/
└── Index.vue          # 单文件组件，包含以上所有逻辑
```

:::warning
编辑模式下，某些字段可能需要禁用（如用户名）。使用 `modal.isEdit.value` 判断当前模式，通过 `:disabled` 或 `v-if` 控制。
:::
