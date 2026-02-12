# CRUD 组件

## 概述

`frontend/src/components/crud/` 提供面向动态 CRUD 的专用组件集。

## CrudTable

动态 CRUD 表格组件，根据表配置自动渲染列和操作：

```vue
<CrudTable
  :table-name="tableName"
  :columns="columns"
  :searchable="true"
  :creatable="true"
  :editable="true"
  :deletable="true"
/>
```

## CrudSearch

CRUD 搜索组件，根据列配置自动生成搜索表单：

```vue
<CrudSearch
  :columns="columns"
  @search="handleSearch"
  @reset="handleReset"
/>
```

## CrudModal

CRUD 表单弹窗，根据列配置自动生成表单字段：

```vue
<CrudModal
  v-model:visible="visible"
  :columns="columns"
  :data="formData"
  :loading="saving"
  @confirm="handleSave"
/>
```

## CrudConfirm

CRUD 操作确认组件：

```vue
<CrudConfirm
  title="确认删除"
  content="删除后数据无法恢复，是否继续？"
  @confirm="handleDelete"
/>
```

## 动态 CRUD 页面

动态 CRUD 页面组合以上组件，实现零代码的数据管理界面：

```vue
<script setup lang="ts">
import { CrudTable, CrudSearch, CrudModal, CrudConfirm } from '@/components/crud'
import { crudApi } from '@/api/crud'

const props = defineProps<{
  tableName: string
}>()

// 自动根据 tableName 加载表配置和数据
</script>
```

这些组件与后端的动态 CRUD 模块配合使用，管理员通过管理界面定义表结构后，前端自动生成完整的 CRUD 界面。
