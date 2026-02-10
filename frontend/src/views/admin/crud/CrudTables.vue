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
  NSwitch,
  NCard,
  NDivider,
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
  return {
    name: '',
    type: 'string',
    primaryKey: false,
    autoIncrement: false,
    nullable: false,
    unique: false,
    default: undefined,
    description: '',
    showInCreate: true,
    showInUpdate: true,
    showInFilter: false,
    showInList: true,
  }
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
      :width="860"
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
        <NDivider style="margin: 12px 0 8px">列定义</NDivider>

        <div class="col-editor">
          <NCard
            v-for="(col, index) in editColumns"
            :key="index"
            size="small"
            class="col-card"
            :segmented="{ content: true }"
          >
            <template #header>
              <span class="col-card-title">列 {{ index + 1 }}</span>
            </template>
            <template #header-extra>
              <NButton size="tiny" quaternary type="error" @click="removeColumn(index)">
                删除
              </NButton>
            </template>

            <!-- 第一行：列名、类型、说明 -->
            <div class="col-row">
              <div class="col-field">
                <label class="col-label">列名 <span class="required">*</span></label>
                <NInput
                  v-model:value="col.name"
                  placeholder="如 name"
                  size="small"
                  @update:value="onColumnChange"
                />
              </div>
              <div class="col-field">
                <label class="col-label">类型 <span class="required">*</span></label>
                <NSelect
                  v-model:value="col.type"
                  :options="columnTypeOptions"
                  placeholder="类型"
                  size="small"
                  :disabled="modal.isEdit.value && !!col.name"
                  @update:value="onColumnChange"
                />
              </div>
              <div class="col-field col-field-grow">
                <label class="col-label">说明</label>
                <NInput
                  v-model:value="col.description"
                  placeholder="字段描述"
                  size="small"
                  @update:value="onColumnChange"
                />
              </div>
            </div>

            <!-- 第二行：默认值 + 数据库选项 -->
            <div class="col-row" style="margin-top: 8px">
              <div class="col-field">
                <label class="col-label">默认值</label>
                <NInput
                  :value="col.default !== undefined && col.default !== null ? String(col.default) : ''"
                  placeholder="无"
                  size="small"
                  @update:value="(v: string) => { col.default = v === '' ? undefined : (col.type === 'number' ? Number(v) : v); onColumnChange() }"
                />
              </div>
              <div class="col-switch-group">
                <label class="col-switch-item">
                  <NSwitch
                    v-model:value="col.primaryKey"
                    size="small"
                    @update:value="onColumnChange"
                  />
                  <span>主键</span>
                </label>
                <label class="col-switch-item">
                  <NSwitch
                    v-model:value="col.autoIncrement"
                    size="small"
                    :disabled="col.type !== 'number'"
                    @update:value="onColumnChange"
                  />
                  <span>自增</span>
                </label>
                <label class="col-switch-item">
                  <NSwitch
                    v-model:value="col.nullable"
                    size="small"
                    @update:value="onColumnChange"
                  />
                  <span>可空</span>
                </label>
                <label class="col-switch-item">
                  <NSwitch
                    v-model:value="col.unique"
                    size="small"
                    @update:value="onColumnChange"
                  />
                  <span>唯一</span>
                </label>
              </div>
            </div>

            <!-- 第三行：UI 显示控制 -->
            <div class="col-row" style="margin-top: 8px">
              <div class="col-switch-group">
                <span class="col-label" style="margin-right: 4px">UI 控制：</span>
                <label class="col-switch-item">
                  <NSwitch
                    v-model:value="col.showInCreate"
                    size="small"
                    @update:value="onColumnChange"
                  />
                  <span>新建</span>
                </label>
                <label class="col-switch-item">
                  <NSwitch
                    v-model:value="col.showInUpdate"
                    size="small"
                    @update:value="onColumnChange"
                  />
                  <span>更新</span>
                </label>
                <label class="col-switch-item">
                  <NSwitch
                    v-model:value="col.showInFilter"
                    size="small"
                    @update:value="onColumnChange"
                  />
                  <span>过滤</span>
                </label>
                <label class="col-switch-item">
                  <NSwitch
                    v-model:value="col.showInList"
                    size="small"
                    @update:value="onColumnChange"
                  />
                  <span>列表</span>
                </label>
              </div>
            </div>
          </NCard>

          <NButton size="small" dashed style="width: 100%" @click="addColumn">
            + 添加列
          </NButton>
        </div>

        <NDivider style="margin: 12px 0 8px" />

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

/* 列编辑器 */
.col-editor {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  max-height: 420px;
  overflow-y: auto;
  padding: 4px 2px;
}

.col-card {
  border: 1px solid var(--n-border-color, #e0e0e6);
  border-radius: 6px;
}

.col-card-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--n-text-color-2, #666);
}

.col-row {
  display: flex;
  gap: 10px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.col-field {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 130px;
}

.col-field-grow {
  flex: 1;
  min-width: 150px;
}

.col-label {
  font-size: 12px;
  color: var(--n-text-color-3, #999);
  line-height: 1;
  margin-bottom: 2px;
}

.col-label .required {
  color: #e03030;
}

.col-switch-group {
  display: flex;
  gap: 14px;
  align-items: center;
  flex-wrap: wrap;
  padding-bottom: 2px;
}

.col-switch-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--n-text-color-2, #666);
  cursor: pointer;
  white-space: nowrap;
}
</style>
