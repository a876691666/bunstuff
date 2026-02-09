<script setup lang="ts">
import { h, ref, computed, onMounted, watch } from 'vue'
import {
  NButton,
  NTag,
  NSpace,
  NSelect,
  NCard,
  NEmpty,
  useMessage,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
} from 'naive-ui'
import type { DataTableColumns, SelectOption } from 'naive-ui'
import { CrudTable, CrudSearch, CrudModal, CrudConfirm, type SearchField } from '@/components'
// composables not used directly in this page (manual table management)
import { crudApi, crudTableApi } from '@/api'
import type { CrudTable as CrudTableType, ColumnDef } from '@/types'

defineOptions({ name: 'CrudTest' })

const message = useMessage()

// ====== 表选择 ======
const registeredTables = ref<string[]>([])
const crudTableConfigs = ref<CrudTableType[]>([])
const selectedTable = ref<string | null>(null)
const loadingTables = ref(false)

const tableOptions = computed<SelectOption[]>(() =>
  registeredTables.value.map((name) => {
    const config = crudTableConfigs.value.find((c) => c.tableName === name)
    return { label: config ? `${config.displayName} (${name})` : name, value: name }
  }),
)

// 当前选中表的列定义
const currentColumns = computed<ColumnDef[]>(() => {
  if (!selectedTable.value) return []
  const config = crudTableConfigs.value.find((c) => c.tableName === selectedTable.value)
  if (!config) return []
  try {
    return JSON.parse(config.columns || '[]')
  } catch {
    return []
  }
})

// 当前选中表的配置
const currentConfig = computed<CrudTableType | undefined>(() =>
  crudTableConfigs.value.find((c) => c.tableName === selectedTable.value),
)

async function loadRegisteredTables() {
  loadingTables.value = true
  try {
    const [tables, configs] = await Promise.all([
      crudApi.listTables(),
      crudTableApi.list({ pageSize: 1000 }),
    ])
    registeredTables.value = tables
    crudTableConfigs.value = configs.data
    // 自动选中第一个
    if (tables.length > 0 && !selectedTable.value) {
      selectedTable.value = tables[0] ?? null
    }
  } catch (err: unknown) {
    message.error((err as Error).message || '加载表列表失败')
  } finally {
    loadingTables.value = false
  }
}

onMounted(loadRegisteredTables)

// ====== 动态表格 ======

// 根据列定义动态生成搜索字段
const dynamicSearchFields = computed<SearchField[]>(() => {
  return currentColumns.value
    .filter((col) => !col.primaryKey && col.type === 'string')
    .slice(0, 4) // 最多 4 个搜索字段
    .map((col) => ({
      key: col.name,
      label: col.description || col.name,
      type: 'input' as const,
    }))
})



// 动态表格列
const dynamicTableColumns = computed<DataTableColumns<Record<string, unknown>>>(() => {
  const cols: DataTableColumns<Record<string, unknown>> = []

  for (const col of currentColumns.value) {
    cols.push({
      title: col.description || col.name,
      key: col.name,
      width: col.primaryKey ? 60 : col.type === 'string' ? 150 : 100,
      ellipsis: col.type === 'string' ? { tooltip: true } : undefined,
    })
  }

  // 时间戳列
  cols.push({ title: '创建时间', key: 'createdAt', width: 170 })
  cols.push({ title: '更新时间', key: 'updatedAt', width: 170 })

  // 操作列
  cols.push({
    title: '操作',
    key: 'actions',
    width: 150,
    fixed: 'right',
    render: (row) =>
      h(NSpace, { size: 'small' }, () => [
        h(
          NButton,
          {
            size: 'small',
            quaternary: true,
            type: 'primary',
            onClick: () => handleEdit(row),
          },
          () => '编辑',
        ),
        h(CrudConfirm, {
          title: '确定要删除吗？',
          onConfirm: () => handleDelete(row.id as number),
        }),
      ]),
  })

  return cols
})

// 表格数据
const tableData = ref<Record<string, unknown>[]>([])
const tableLoading = ref(false)
const tablePage = ref(1)
const tablePageSize = ref(10)
const tableTotal = ref(0)
const tableQuery = ref<Record<string, unknown>>({})

async function loadTableData() {
  if (!selectedTable.value) return
  tableLoading.value = true
  try {
    // 构建 filter
    const params: Record<string, unknown> = {
      page: tablePage.value,
      pageSize: tablePageSize.value,
    }
    // 简单的搜索过滤
    const filters: string[] = []
    for (const [key, val] of Object.entries(tableQuery.value)) {
      if (val !== undefined && val !== null && val !== '') {
        filters.push(`${key}~"${val}"`)
      }
    }
    if (filters.length > 0) {
      params.filter = `(${filters.join(' && ')})`
    }

    const result = await crudApi.list(selectedTable.value, params)
    tableData.value = result.data
    tableTotal.value = result.total
  } catch (err: unknown) {
    message.error((err as Error).message || '加载数据失败')
  } finally {
    tableLoading.value = false
  }
}

function handleSearch() {
  tablePage.value = 1
  loadTableData()
}

function handleReset() {
  tableQuery.value = {}
  tablePage.value = 1
  loadTableData()
}

function setPage(p: number) {
  tablePage.value = p
  loadTableData()
}

function setPageSize(ps: number) {
  tablePageSize.value = ps
  tablePage.value = 1
  loadTableData()
}

// 切换表时重新加载
watch(selectedTable, () => {
  tableQuery.value = {}
  tablePage.value = 1
  loadTableData()
})

// ====== 新增/编辑弹窗 ======
const modalVisible = ref(false)
const modalTitle = ref('')
const modalLoading = ref(false)
const editingId = ref<number | null>(null)
const formData = ref<Record<string, unknown>>({})

function buildDefaultFormData(): Record<string, unknown> {
  const data: Record<string, unknown> = {}
  for (const col of currentColumns.value) {
    if (col.primaryKey && col.autoIncrement) continue
    switch (col.type) {
      case 'number':
        data[col.name] = col.default ?? 0
        break
      case 'boolean':
        data[col.name] = col.default ?? false
        break
      default:
        data[col.name] = col.default ?? ''
    }
  }
  return data
}

function openCreate() {
  editingId.value = null
  modalTitle.value = `新增 ${currentConfig.value?.displayName || selectedTable.value} 数据`
  formData.value = buildDefaultFormData()
  modalVisible.value = true
}

function handleEdit(row: Record<string, unknown>) {
  editingId.value = row.id as number
  modalTitle.value = `编辑 ${currentConfig.value?.displayName || selectedTable.value} 数据`
  const data: Record<string, unknown> = {}
  for (const col of currentColumns.value) {
    if (col.primaryKey && col.autoIncrement) continue
    data[col.name] = row[col.name] ?? ''
  }
  formData.value = data
  modalVisible.value = true
}

async function handleSave() {
  if (!selectedTable.value) return
  modalLoading.value = true
  try {
    if (editingId.value) {
      await crudApi.update(selectedTable.value, editingId.value, formData.value)
      message.success('更新成功')
    } else {
      await crudApi.create(selectedTable.value, formData.value)
      message.success('创建成功')
    }
    modalVisible.value = false
    loadTableData()
  } catch (err: unknown) {
    message.error((err as Error).message || '操作失败')
  } finally {
    modalLoading.value = false
  }
}

async function handleDelete(id: number) {
  if (!selectedTable.value) return
  try {
    await crudApi.delete(selectedTable.value, id)
    message.success('删除成功')
    loadTableData()
  } catch (err: unknown) {
    message.error((err as Error).message || '删除失败')
  }
}
</script>

<template>
  <div class="page-crud-test">
    <!-- 表选择区域 -->
    <NCard size="small" style="margin-bottom: 12px">
      <NSpace align="center">
        <span style="font-weight: 500">选择数据表：</span>
        <NSelect
          v-model:value="selectedTable"
          :options="tableOptions"
          placeholder="请选择已注册的 CRUD 表"
          style="width: 300px"
          :loading="loadingTables"
          filterable
        />
        <NButton @click="loadRegisteredTables" :loading="loadingTables" size="small">
          刷新列表
        </NButton>
        <NTag v-if="currentConfig" type="info" size="small">
          {{ currentConfig.description || '无描述' }}
        </NTag>
      </NSpace>
    </NCard>

    <!-- 数据表格 -->
    <template v-if="selectedTable">
      <CrudTable
        :title="`${currentConfig?.displayName || selectedTable} 数据`"
        :columns="dynamicTableColumns"
        :data="tableData"
        :loading="tableLoading"
        :page="tablePage"
        :page-size="tablePageSize"
        :total="tableTotal"
        @update:page="setPage"
        @update:page-size="setPageSize"
      >
        <template #toolbar>
          <CrudSearch
            v-model="tableQuery"
            :fields="dynamicSearchFields"
            :loading="tableLoading"
            @search="handleSearch"
            @reset="handleReset"
          />
        </template>

        <template #header-extra>
          <NButton type="primary" @click="openCreate">新增数据</NButton>
        </template>
      </CrudTable>
    </template>

    <NCard v-else>
      <NEmpty description="请先选择一个数据表" />
    </NCard>

    <!-- 新增/编辑弹窗 -->
    <CrudModal
      v-model:show="modalVisible"
      :title="modalTitle"
      :loading="modalLoading"
      @confirm="handleSave"
    >
      <NForm label-placement="left" label-width="100">
        <template v-for="col in currentColumns" :key="col.name">
          <NFormItem
            v-if="!(col.primaryKey && col.autoIncrement)"
            :label="col.description || col.name"
          >
            <!-- 数字类型 -->
            <NInputNumber
              v-if="col.type === 'number'"
              v-model:value="(formData[col.name] as number)"
              :placeholder="`请输入${col.description || col.name}`"
              style="width: 100%"
            />
            <!-- 布尔类型 -->
            <NSelect
              v-else-if="col.type === 'boolean'"
              v-model:value="(formData[col.name] as number)"
              :options="[
                { label: '是', value: 1 },
                { label: '否', value: 0 },
              ]"
            />
            <!-- 字符串 / 日期 / 默认 -->
            <NInput
              v-else
              v-model:value="(formData[col.name] as string)"
              :placeholder="`请输入${col.description || col.name}`"
              :type="col.type === 'date' ? 'text' : 'text'"
            />
          </NFormItem>
        </template>
      </NForm>
    </CrudModal>
  </div>
</template>

<style scoped>
.page-crud-test {
  height: 100%;
}
</style>
