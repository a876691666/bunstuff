# 组合式函数

## 🎯 概述

项目封装了 3 个核心 composable，覆盖表格数据、弹窗表单和字典数据三大场景。它们与 CRUD 组件深度配合，实现最小化的页面开发代码。

## 📦 useTable\<T, Q\>

表格数据管理，自动处理分页、加载、搜索和 SSQL 筛选构建。

### 配置参数

```ts
interface UseTableConfig<T, Q> {
  api: (params: any) => Promise<PagedResult<T>> // 列表查询 API
  defaultQuery?: Partial<Q> // 默认查询条件
  defaultPageSize?: number // 默认每页条数，默认 10
  immediate?: boolean // 是否立即加载，默认 true
  opMap?: Record<string, string> // SSQL 操作符映射
  transform?: (data: T[]) => T[] // 数据转换函数
}
```

### 返回值

| 返回值        | 类型                      | 说明                  |
| ------------- | ------------------------- | --------------------- |
| `loading`     | `Ref<boolean>`            | 加载状态              |
| `data`        | `Ref<T[]>`                | 表格数据              |
| `total`       | `Ref<number>`             | 总记录数              |
| `page`        | `Ref<number>`             | 当前页码              |
| `pageSize`    | `Ref<number>`             | 每页条数              |
| `query`       | `Ref<Q>`                  | 查询参数              |
| `load`        | `() => Promise<void>`     | 加载数据（当前参数）  |
| `reload`      | `() => Promise<void>`     | 重新加载（重置页码）  |
| `search`      | `() => void`              | 搜索（重置到第 1 页） |
| `reset`       | `() => void`              | 重置查询条件并搜索    |
| `setPage`     | `(p: number) => void`     | 设置页码并加载        |
| `setPageSize` | `(s: number) => void`     | 设置每页条数并加载    |
| `setQuery`    | `(q: Partial<Q>) => void` | 更新查询参数          |

### SSQL 操作符映射

通过 `opMap` 配置，自动将查询参数转换为 SSQL 筛选字符串：

```ts
const table = useTable<User, UserQuery>({
  api: userApi.list,
  defaultQuery: { username: '', status: null },
  opMap: {
    username: 'like', // username LIKE '%value%'
    status: 'eq', // status = value
    createdAt: 'between', // createdAt BETWEEN a AND b
  },
})
```

:::tip
`opMap` 中的 key 对应 query 的字段名，value 对应 SSQL 操作符。空值字段会自动跳过，不会生成无意义的筛选条件。
:::

### 使用示例

```ts
const table = useTable<User, { username: string; status: number | null }>({
  api: userApi.list,
  defaultQuery: { username: '', status: null },
  defaultPageSize: 20,
  opMap: { username: 'like', status: 'eq' },
})

// 模板中
// table.data / table.loading / table.total / table.page / table.pageSize
// table.search() / table.reset() / table.setPage(n)
```

## 📦 useModal\<T, Id\>

表单弹窗管理，统一处理新建/编辑模式、表单状态和提交逻辑。

### 配置参数

```ts
interface UseModalConfig<T, Id> {
  defaultData: T | (() => T) // 默认表单数据
  validate?: () => Promise<boolean> // 表单验证函数
  createApi?: (data: T) => Promise<any> // 创建接口
  updateApi?: (id: Id, data: T) => Promise<any> // 更新接口
  onSuccess?: () => void // 成功回调（通常 reload 表格）
  onError?: (err: Error) => void // 失败回调
}
```

### 返回值

| 返回值      | 类型                            | 说明                          |
| ----------- | ------------------------------- | ----------------------------- |
| `visible`   | `Ref<boolean>`                  | 弹窗是否可见                  |
| `loading`   | `Ref<boolean>`                  | 提交加载状态                  |
| `title`     | `Ref<string>`                   | 弹窗标题（自动：新增/编辑）   |
| `editingId` | `Ref<Id \| null>`               | 编辑中的记录 ID               |
| `formData`  | `Ref<T>`                        | 表单数据                      |
| `isEdit`    | `ComputedRef<boolean>`          | 是否为编辑模式                |
| `open`      | `(data?: Partial<T>) => void`   | 打开新建弹窗                  |
| `edit`      | `(row: T & { id: Id }) => void` | 打开编辑弹窗                  |
| `close`     | `() => void`                    | 关闭弹窗                      |
| `save`      | `() => Promise<void>`           | 提交表单（自动判断新建/编辑） |
| `resetForm` | `() => void`                    | 重置表单数据                  |

### 使用示例

```ts
const modal = useModal<CreateUserDto, number>({
  defaultData: { username: '', password: '', nickname: '' },
  createApi: userApi.create,
  updateApi: userApi.update,
  onSuccess: () => {
    message.success(modal.isEdit.value ? '更新成功' : '创建成功')
    table.reload()
  },
})

// modal.open()        → 打开新增弹窗
// modal.edit(row)     → 打开编辑弹窗，自动填充数据
// modal.save()        → 提交（自动判断 create/update）
```

## 📦 useDict / useDicts

字典数据管理，自动加载和缓存字典项。

### useDict(dictType)

```ts
const { data, loading, options, getLabel, getValue, refresh } = useDict('sys_status')
```

| 返回值     | 类型                          | 说明             |
| ---------- | ----------------------------- | ---------------- |
| `data`     | `Ref<DictItem[]>`             | 字典项列表       |
| `loading`  | `Ref<boolean>`                | 加载状态         |
| `options`  | `ComputedRef<SelectOption[]>` | NSelect 选项格式 |
| `getLabel` | `(value: any) => string`      | 根据值获取标签   |
| `getValue` | `(label: string) => any`      | 根据标签获取值   |
| `refresh`  | `() => Promise<void>`         | 强制刷新缓存     |

:::tip
`useDict` 内置内存缓存，同一 `dictType` 在多个组件中使用只会请求一次 API。调用 `refresh()` 可清除缓存并重新加载。
:::

### useDicts(types[])

批量加载多个字典：

```ts
const dicts = useDicts(['sys_status', 'sys_gender', 'sys_yes_no'])

// dicts.sys_status.options
// dicts.sys_gender.getLabel(1)
```

### 在模板中使用

```vue
<script setup>
const { options: statusOptions, getLabel: getStatusLabel } = useDict('sys_status')
</script>

<template>
  <!-- 搜索表单中 -->
  <NSelect v-model:value="query.status" :options="statusOptions" clearable />

  <!-- 表格列中 -->
  <template #status="{ row }">
    {{ getStatusLabel(row.status) }}
  </template>
</template>
```

:::warning
字典缓存生命周期为当前页面会话，页面刷新后缓存会重建。如果后端字典数据有变更，需要调用 `refresh()` 手动更新。
:::
