# 组合式函数

## 概述

`frontend/src/composables/` 提供可复用的组合式函数，封装常见业务逻辑。

## useTable

表格数据管理，封装分页、加载、搜索和 SSQL 过滤：

```typescript
import { useTable } from '@/composables/useTable'
import { articleApi } from '@/api/article'

const {
  tableData,       // Ref<any[]>     — 表格数据
  loading,         // Ref<boolean>   — 加载状态
  pagination,      // Reactive       — 分页信息 { page, pageSize, total }
  
  refresh,         // () => void     — 刷新当前页
  handlePageChange,// (page) => void — 翻页
  handleSearch,    // (conditions) => void — 搜索
  handleReset,     // () => void     — 重置搜索
} = useTable({
  fetchApi: articleApi.list,
  defaultPageSize: 10,
  immediate: true,        // 是否立即加载
})
```

### SSQL 搜索集成

`useTable` 内部使用 SSQL Builder 构建过滤条件：

```typescript
// 搜索时
handleSearch({
  username: 'admin',    // → username ~ 'admin'
  status: 1,            // → status = 1
})

// 自动构建 SSQL: username ~ 'admin' && status = 1
// 发送请求: GET /api/admin/users?page=1&pageSize=10&filter=username%20~%20'admin'%20%26%26%20status%20%3D%201
```

## useModal

弹窗逻辑管理，封装新增/编辑/保存流程：

```typescript
import { useModal } from '@/composables/useModal'
import { articleApi } from '@/api/article'

const {
  modalVisible,   // Ref<boolean>    — 弹窗显示状态
  modalTitle,     // Computed<string> — 弹窗标题（新增/编辑）
  formData,       // Ref<any>        — 表单数据
  saving,         // Ref<boolean>    — 保存中状态
  isEdit,         // Ref<boolean>    — 是否编辑模式
  
  openCreate,     // () => void      — 打开新增弹窗
  openEdit,       // (row) => void   — 打开编辑弹窗
  close,          // () => void      — 关闭弹窗
  handleSave,     // () => void      — 保存（自动判断新增/编辑）
} = useModal({
  createApi: articleApi.create,
  updateApi: articleApi.update,
  onSuccess: () => refresh(),        // 保存成功回调
  defaultFormData: {                 // 默认表单数据
    title: '',
    content: '',
    status: 1,
  },
})
```

### 使用示例

```vue
<script setup lang="ts">
// 新增
const handleCreate = () => {
  openCreate()
  // formData 重置为 defaultFormData
  // modalTitle = '新增'
}

// 编辑
const handleEdit = (row: any) => {
  openEdit(row)
  // formData 填充为 row 数据
  // modalTitle = '编辑'
}
</script>

<template>
  <n-button @click="handleCreate">新增</n-button>
  <n-button @click="handleEdit(row)">编辑</n-button>
  
  <FormModal
    v-model:visible="modalVisible"
    :title="modalTitle"
    :loading="saving"
    @confirm="handleSave"
  >
    <FormField label="标题">
      <n-input v-model:value="formData.title" />
    </FormField>
  </FormModal>
</template>
```

## useDict

字典数据管理，带缓存：

```typescript
import { useDict } from '@/composables/useDict'

const {
  options,     // Ref<{ label, value }[]>  — 选项列表
  dictMap,     // Ref<Record<string, string>> — value → label 映射
  getLabel,    // (value) => string — 获取标签
  loading,     // Ref<boolean>
} = useDict('sys_status')

// 在模板中使用
// <n-select :options="options" />
// <span>{{ getLabel(row.status) }}</span>
```

### 缓存机制

`useDict` 在全局缓存字典数据，相同 `dictType` 只请求一次：

```typescript
// 多处使用同一字典类型，只会发送一次请求
const { options: statusOptions } = useDict('sys_status')
const { options: statusOptions2 } = useDict('sys_status')  // 命中缓存
```

## 完整页面示例

```vue
<script setup lang="ts">
import { PageTable, FormModal, FormField, ConfirmButton, SearchForm } from '@/components/common'
import { useTable, useModal, useDict } from '@/composables'
import { articleApi } from '@/api/article'

// 字典
const { options: statusOptions, getLabel: getStatusLabel } = useDict('sys_status')

// 表格
const { tableData, loading, pagination, handlePageChange, handleSearch, handleReset, refresh } = useTable({
  fetchApi: articleApi.list,
})

// 弹窗
const { modalVisible, modalTitle, formData, saving, openCreate, openEdit, handleSave } = useModal({
  createApi: articleApi.create,
  updateApi: articleApi.update,
  onSuccess: refresh,
  defaultFormData: { title: '', status: 1 },
})

// 删除
const handleDelete = async (id: number) => {
  await articleApi.delete(id)
  refresh()
}

// 表格列
const columns = [
  { title: 'ID', key: 'id', width: 80 },
  { title: '标题', key: 'title' },
  {
    title: '状态', key: 'status',
    render: (row) => getStatusLabel(row.status),
  },
  { title: '创建时间', key: 'createdAt', width: 180 },
  {
    title: '操作', key: 'actions', width: 200,
    render: (row) => [
      h(NButton, { size: 'small', onClick: () => openEdit(row) }, '编辑'),
      h(ConfirmButton, { size: 'small', onConfirm: () => handleDelete(row.id) }, '删除'),
    ],
  },
]
</script>

<template>
  <PageTable :columns="columns" :data="tableData" :loading="loading"
    :pagination="pagination" @page-change="handlePageChange">
    <template #header>
      <n-button type="primary" @click="openCreate">新增</n-button>
    </template>
    <template #search>
      <SearchForm
        :fields="[
          { key: 'title', label: '标题', type: 'input' },
          { key: 'status', label: '状态', type: 'select', options: statusOptions },
        ]"
        @search="handleSearch"
        @reset="handleReset"
      />
    </template>
  </PageTable>

  <FormModal v-model:visible="modalVisible" :title="modalTitle" :loading="saving" @confirm="handleSave">
    <FormField label="标题" required>
      <n-input v-model:value="formData.title" />
    </FormField>
    <FormField label="状态">
      <n-select v-model:value="formData.status" :options="statusOptions" />
    </FormField>
  </FormModal>
</template>
```
