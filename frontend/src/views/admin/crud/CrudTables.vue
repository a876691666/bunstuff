<script setup lang="ts">
import { h } from 'vue'
import {
  NButton,
  NTag,
  NSpace,
  useMessage,
  NForm,
  NFormItem,
  NInput,
  NSelect,
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { CrudTable, CrudSearch, CrudModal, CrudConfirm, type SearchField } from '@/components'
import { useTable, useModal } from '@/composables'
import { crudTableApi } from '@/api'
import type {
  CrudTable as CrudTableType,
  CreateCrudTableRequest,
  UpdateCrudTableRequest,
  ColumnDef,
} from '@/types'
import { Op } from '@/utils/ssql'

defineOptions({ name: 'CrudTableManagement' })

const message = useMessage()

const columnTypeOptions = [
  { label: '字符串 (string)', value: 'string' },
  { label: '数字 (number)', value: 'number' },
  { label: '布尔 (boolean)', value: 'boolean' },
  { label: '日期 (date)', value: 'date' },
]

// 搜索字段
const searchFields: SearchField[] = [
  { key: 'tableName', label: '表名', type: 'input' },
  { key: 'displayName', label: '显示名称', type: 'input' },
  {
    key: 'status',
    label: '状态',
    type: 'select',
    options: [
      { label: '启用', value: 1 },
      { label: '禁用', value: 0 },
    ],
  },
]

// useTable
const table = useTable<
  CrudTableType,
  { tableName?: string; displayName?: string; status?: number }
>({
  api: (params) => crudTableApi.list(params),
  opMap: { tableName: Op.Like, displayName: Op.Like, status: Op.Eq },
})

// 解析 columns JSON
function parseColumns(columnsJson: string): ColumnDef[] {
  try {
    return JSON.parse(columnsJson || '[]')
  } catch {
    return []
  }
}

// 创建默认列
function createDefaultColumn(): ColumnDef {
  return { name: '', type: 'string', description: '' }
}

// useModal
const modal = useModal<CreateCrudTableRequest & { id?: number }>({
  defaultData: {
    tableName: '',
    displayName: '',
    columns: '[]',
    description: '',
    status: 1,
    remark: '',
  },
  validate: (data) => {
    if (!data.tableName) return '请输入表名'
    if (!data.displayName) return '请输入显示名称'
    // 校验 columns JSON
    try {
      const cols = JSON.parse(data.columns || '[]')
      if (!Array.isArray(cols)) return '列定义必须为 JSON 数组'
      for (const col of cols) {
        if (!col.name) return '每一列必须有列名'
        if (!col.type) return '每一列必须有类型'
      }
    } catch {
      return '列定义 JSON 格式错误'
    }
    return null
  },
  createApi: (data) => crudTableApi.create(data),
  updateApi: (id, data) => crudTableApi.update(id, data as UpdateCrudTableRequest),
  onSuccess: () => {
    message.success(modal.isEdit.value ? '更新成功' : '创建成功')
    table.reload()
  },
  onError: (err) => message.error(err.message || '操作失败'),
})

// 列编辑器中使用的响应式列数组
import { ref, watch } from 'vue'
const editColumns = ref<ColumnDef[]>([])

// 当弹窗打开时，将 columns JSON 解析为数组
watch(
  () => modal.visible.value,
  (visible) => {
    if (visible) {
      editColumns.value = parseColumns(modal.formData.columns)
    }
  },
)

// 同步列数组回 JSON
function syncColumnsToForm() {
  modal.formData.columns = JSON.stringify(editColumns.value)
}

function addColumn() {
  editColumns.value.push(createDefaultColumn())
  syncColumnsToForm()
}

function removeColumn(index: number) {
  editColumns.value.splice(index, 1)
  syncColumnsToForm()
}

function onColumnChange() {
  syncColumnsToForm()
}

// 表格列
const columns: DataTableColumns<CrudTableType> = [
  { title: 'ID', key: 'id', width: 60 },
  { title: '表名', key: 'tableName', width: 150 },
  { title: '显示名称', key: 'displayName', width: 150 },
  {
    title: '列数',
    key: 'columns',
    width: 80,
    render: (row) => {
      const cols = parseColumns(row.columns)
      return cols.length
    },
  },
  { title: '描述', key: 'description', ellipsis: { tooltip: true } },
  {
    title: '状态',
    key: 'status',
    width: 80,
    render: (row) =>
      h(
        NTag,
        { type: row.status === 1 ? 'success' : 'error', size: 'small' },
        () => (row.status === 1 ? '启用' : '禁用'),
      ),
  },
  { title: '创建时间', key: 'createdAt', width: 170 },
  {
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
          title: '确定要删除该表配置吗？',
          onConfirm: () => handleDelete(row.id),
        }),
      ]),
  },
]

function handleEdit(row: CrudTableType) {
  modal.edit(row.id, {
    tableName: row.tableName,
    displayName: row.displayName,
    columns: row.columns,
    description: row.description || '',
    status: row.status,
    remark: row.remark || '',
  })
}

async function handleDelete(id: number) {
  try {
    await crudTableApi.delete(id)
    message.success('删除成功')
    table.reload()
  } catch (err: unknown) {
    message.error((err as Error).message || '删除失败')
  }
}
</script>

<template>
  <div class="page-crud-tables">
    <CrudTable
      title="CRUD 表配置管理"
      :columns="columns"
      :data="table.data.value"
      :loading="table.loading.value"
      :page="table.page.value"
      :page-size="table.pageSize.value"
      :total="table.total.value"
      @update:page="table.setPage"
      @update:page-size="table.setPageSize"
    >
      <template #toolbar>
        <CrudSearch
          v-model="table.query.value"
          :fields="searchFields"
          :loading="table.loading.value"
          @search="table.search"
          @reset="table.reset"
        />
      </template>

      <template #header-extra>
        <NButton type="primary" @click="modal.open('新增表配置')">新增表配置</NButton>
      </template>
    </CrudTable>

    <CrudModal
      v-model:show="modal.visible.value"
      :title="modal.title.value"
      :loading="modal.loading.value"
      @confirm="modal.save"
    >
      <NForm label-placement="left" label-width="80">
        <NFormItem label="表名" required>
          <NInput
            v-model:value="modal.formData.tableName"
            placeholder="请输入表名（如 my_table）"
            :disabled="modal.isEdit.value"
          />
        </NFormItem>
        <NFormItem label="显示名称" required>
          <NInput v-model:value="modal.formData.displayName" placeholder="请输入显示名称" />
        </NFormItem>
        <NFormItem label="描述">
          <NInput
            v-model:value="modal.formData.description"
            type="textarea"
            placeholder="请输入表描述"
          />
        </NFormItem>

        <!-- 列定义编辑器 -->
        <NFormItem label="列定义" required>
          <div style="width: 100%">
            <div
              v-for="(col, index) in editColumns"
              :key="index"
              style="
                display: flex;
                gap: 8px;
                margin-bottom: 8px;
                align-items: center;
                flex-wrap: wrap;
              "
            >
              <NInput
                v-model:value="col.name"
                placeholder="列名"
                style="width: 120px"
                @update:value="onColumnChange"
              />
              <NSelect
                v-model:value="col.type"
                :options="columnTypeOptions"
                placeholder="类型"
                style="width: 140px"
                @update:value="onColumnChange"
              />
              <NInput
                v-model:value="col.description"
                placeholder="说明"
                style="width: 140px"
                @update:value="onColumnChange"
              />
              <NButton size="small" quaternary type="error" @click="removeColumn(index)">
                删除
              </NButton>
            </div>
            <NButton size="small" dashed @click="addColumn">+ 添加列</NButton>
          </div>
        </NFormItem>

        <NFormItem label="状态">
          <NSelect
            v-model:value="modal.formData.status"
            :options="[
              { label: '启用', value: 1 },
              { label: '禁用', value: 0 },
            ]"
          />
        </NFormItem>
        <NFormItem label="备注">
          <NInput
            v-model:value="modal.formData.remark"
            type="textarea"
            placeholder="请输入备注"
          />
        </NFormItem>
      </NForm>
    </CrudModal>
  </div>
</template>

<style scoped>
.page-crud-tables {
  height: 100%;
}
</style>
