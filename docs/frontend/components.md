# 通用组件

## 概述

`frontend/src/components/common/` 包含高度复用的通用组件，基于 Naive UI 封装。

## PageTable

分页数据表格组件，封装常见表格功能：

```vue
<template>
  <PageTable
    :columns="columns"
    :data="tableData"
    :loading="loading"
    :pagination="pagination"
    @page-change="handlePageChange"
  >
    <!-- 表格上方操作区 -->
    <template #header>
      <n-button type="primary" @click="openCreate">新增</n-button>
    </template>
    
    <!-- 搜索区域 -->
    <template #search>
      <SearchForm :fields="searchFields" @search="handleSearch" />
    </template>
  </PageTable>
</template>

<script setup lang="ts">
const columns = [
  { title: 'ID', key: 'id', width: 80 },
  { title: '名称', key: 'name' },
  { title: '状态', key: 'status', render: (row) => h(NTag, ...) },
  {
    title: '操作', key: 'actions',
    render: (row) => h(NSpace, null, [
      h(NButton, { onClick: () => openEdit(row) }, '编辑'),
      h(ConfirmButton, { onConfirm: () => handleDelete(row.id) }, '删除'),
    ]),
  },
]
</script>
```

## FormModal

表单弹窗组件，支持新增和编辑模式：

```vue
<template>
  <FormModal
    v-model:visible="modalVisible"
    :title="modalTitle"
    :loading="saving"
    @confirm="handleSave"
  >
    <FormField label="名称" required>
      <n-input v-model:value="formData.name" />
    </FormField>
    
    <FormField label="状态">
      <n-select v-model:value="formData.status" :options="statusOptions" />
    </FormField>
    
    <FormField label="备注">
      <n-input v-model:value="formData.remark" type="textarea" />
    </FormField>
  </FormModal>
</template>
```

## FormField

表单字段包装组件，提供统一的标签和布局：

```vue
<FormField label="用户名" required>
  <n-input v-model:value="form.username" />
</FormField>

<FormField label="角色">
  <n-select v-model:value="form.roleId" :options="roles" />
</FormField>

<FormField label="描述">
  <n-input v-model:value="form.description" type="textarea" :rows="3" />
</FormField>
```

## SearchForm

搜索表单组件，配合 `useTable` 使用：

```vue
<SearchForm
  :fields="[
    { key: 'username', label: '用户名', type: 'input' },
    { key: 'status', label: '状态', type: 'select', options: statusOptions },
    { key: 'createdAt', label: '创建时间', type: 'daterange' },
  ]"
  @search="handleSearch"
  @reset="handleReset"
/>
```

## ConfirmButton

带确认弹窗的操作按钮，用于危险操作：

```vue
<!-- 删除确认 -->
<ConfirmButton
  type="error"
  content="确定要删除吗？"
  @confirm="handleDelete(row.id)"
>
  删除
</ConfirmButton>

<!-- 自定义确认文案 -->
<ConfirmButton
  type="warning"
  content="确定要禁用该用户吗？"
  @confirm="handleDisable(row.id)"
>
  禁用
</ConfirmButton>
```
