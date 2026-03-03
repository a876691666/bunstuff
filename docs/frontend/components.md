# 组件体系

## 🎯 概述

组件分为两层：**通用组件**（5 个）提供基础 UI 能力，**CRUD 组件**（4 个）封装增删改查场景。两者配合使用，可快速构建管理页面。

## 📦 通用组件

### PageTable

分页数据表格，封装 Naive UI 的 `NDataTable` + `NPagination`。

```vue
<PageTable
  :columns="columns"
  :data="data"
  :loading="loading"
  :total="total"
  :page="page"
  :page-size="pageSize"
  @update:page="setPage"
  @update:page-size="setPageSize"
/>
```

| Props | 类型 | 说明 |
|-------|------|------|
| `columns` | `DataTableColumn[]` | 表格列定义 |
| `data` | `any[]` | 表格数据 |
| `loading` | `boolean` | 加载状态 |
| `total` | `number` | 总记录数 |
| `page` | `number` | 当前页码 |
| `pageSize` | `number` | 每页条数 |

### FormModal

表单弹窗，封装 `NModal` + `NForm`，内置提交和关闭逻辑。

```vue
<FormModal
  :visible="visible"
  :title="title"
  :loading="loading"
  @close="close"
  @submit="save"
>
  <NFormItem label="用户名" path="username">
    <NInput v-model:value="formData.username" />
  </NFormItem>
</FormModal>
```

| Props | 类型 | 说明 |
|-------|------|------|
| `visible` | `boolean` | 是否显示 |
| `title` | `string` | 弹窗标题 |
| `loading` | `boolean` | 提交加载状态 |

### FormField

统一表单项，封装 `NFormItem`，内置常用校验模式。

```vue
<FormField label="邮箱" path="email" required type="email">
  <NInput v-model:value="formData.email" />
</FormField>
```

### SearchForm

搜索表单，水平排列搜索条件，带搜索和重置按钮。

```vue
<SearchForm @search="search" @reset="reset">
  <NFormItem label="用户名">
    <NInput v-model:value="query.username" />
  </NFormItem>
  <NFormItem label="状态">
    <NSelect v-model:value="query.status" :options="statusOptions" />
  </NFormItem>
</SearchForm>
```

### ConfirmButton

确认操作按钮，点击后弹出确认对话框，确认后执行操作。

```vue
<ConfirmButton
  content="确定要删除该记录吗？"
  @confirm="handleDelete(row.id)"
>
  <NButton type="error" size="small">删除</NButton>
</ConfirmButton>
```

## 🔧 CRUD 组件

CRUD 组件是通用组件的上层封装，专为增删改查场景优化。

### CrudTable

整合 PageTable，自动关联 `useTable` composable。

```vue
<CrudTable
  :use-table="table"
  :columns="columns"
>
  <template #toolbar>
    <NButton @click="modal.open()">新增</NButton>
  </template>
  <template #action="{ row }">
    <NButton size="small" @click="modal.edit(row)">编辑</NButton>
    <CrudConfirm @confirm="handleDelete(row.id)">删除</CrudConfirm>
  </template>
</CrudTable>
```

### CrudSearch

搜索区域组件，配合 `useTable` 的 `search` 和 `reset` 方法。

```vue
<CrudSearch :fields="searchFields" :use-table="table" />
```

| Props | 类型 | 说明 |
|-------|------|------|
| `fields` | `SearchField[]` | 搜索字段配置 |
| `useTable` | `UseTableReturn` | table composable 实例 |

### CrudModal

表单弹窗组件，直接绑定 `useModal` composable。

```vue
<CrudModal :use-modal="modal">
  <NFormItem label="名称" path="name">
    <NInput v-model:value="modal.formData.value.name" />
  </NFormItem>
</CrudModal>
```

### CrudConfirm

删除确认组件，简化版的 ConfirmButton。

```vue
<CrudConfirm @confirm="table.reload()">
  删除
</CrudConfirm>
```

## 🏗️ 组件层次关系

```
CRUD 组件（业务层）
├── CrudTable   → 使用 PageTable
├── CrudSearch  → 使用 SearchForm
├── CrudModal   → 使用 FormModal
└── CrudConfirm → 使用 ConfirmButton

通用组件（基础层）
├── PageTable     → NDataTable + NPagination
├── FormModal     → NModal + NForm
├── FormField     → NFormItem
├── SearchForm    → NForm (水平)
└── ConfirmButton → NPopconfirm / NDialog
```

:::tip
开发标准 CRUD 页面时优先使用 CRUD 组件 + composables 组合，可大幅减少模板代码。详见 [CRUD 开发指南](./crud-components.md)。
:::
