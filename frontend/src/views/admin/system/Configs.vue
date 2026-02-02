<script setup lang="ts">
import { h } from 'vue'
import { NButton, NTag, NSpace, useMessage, NForm, NFormItem, NInput } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { CrudTable, CrudSearch, CrudModal, CrudConfirm, type SearchField } from '@/components'
import { useTable, useModal } from '@/composables'
import { configApi } from '@/api'
import type { SysConfig, CreateSysConfigRequest, UpdateSysConfigRequest } from '@/types'
import { Op } from '@/utils/ssql'

defineOptions({ name: 'SystemConfigs' })

const message = useMessage()

// 搜索字段配置
const searchFields: SearchField[] = [
  { key: 'name', label: '参数名称', type: 'input' },
  { key: 'key', label: '参数键名', type: 'input' },
]

// 使用 useTable
const table = useTable<SysConfig, { name?: string; key?: string }>({
  api: (params) => configApi.list(params),
  opMap: { name: Op.Like, key: Op.Like },
})

// 使用 useModal
const modal = useModal<CreateSysConfigRequest & { id?: number }>({
  defaultData: {
    name: '',
    key: '',
    value: '',
    isBuiltin: 0,
    remark: '',
  },
  validate: (data) => {
    if (!data.name) return '请输入参数名称'
    if (!data.key) return '请输入参数键名'
    if (!data.value) return '请输入参数键值'
    return null
  },
  createApi: (data) => configApi.create(data),
  updateApi: (id, data) => configApi.update(id, data as UpdateSysConfigRequest),
  onSuccess: () => {
    message.success(modal.isEdit.value ? '更新成功' : '创建成功')
    table.reload()
  },
  onError: (err) => message.error(err.message || '操作失败'),
})

// 表格列定义
const columns: DataTableColumns<SysConfig> = [
  { title: 'ID', key: 'id', width: 80 },
  { title: '参数名称', key: 'name', width: 150 },
  { title: '参数键名', key: 'key', width: 180, ellipsis: { tooltip: true } },
  { title: '参数键值', key: 'value', ellipsis: { tooltip: true } },
  {
    title: '系统内置',
    key: 'isBuiltin',
    width: 100,
    render: (row) =>
      h(NTag, { type: row.isBuiltin === 1 ? 'warning' : 'default', size: 'small' }, () =>
        row.isBuiltin === 1 ? '是' : '否',
      ),
  },
  { title: '备注', key: 'remark', width: 150, ellipsis: { tooltip: true } },
  {
    title: '创建时间',
    key: 'createdAt',
    width: 180,
    render: (row) => (row.createdAt ? new Date(row.createdAt).toLocaleString() : '-'),
  },
  {
    title: '操作',
    key: 'actions',
    width: 150,
    fixed: 'right',
    render: (row) =>
      h(NSpace, { size: 'small' }, () => [
        h(
          NButton,
          { size: 'small', quaternary: true, type: 'primary', onClick: () => handleEdit(row) },
          () => '编辑',
        ),
        h(CrudConfirm, {
          title: '确定要删除该配置吗？',
          disabled: row.isBuiltin === 1,
          onConfirm: () => handleDelete(row.id),
        }),
      ]),
  },
]

function handleEdit(row: SysConfig) {
  modal.edit(row.id, {
    name: row.name,
    key: row.key,
    value: row.value,
    isBuiltin: row.isBuiltin,
    remark: row.remark || '',
  })
}

async function handleDelete(id: number) {
  try {
    await configApi.delete(id)
    message.success('删除成功')
    table.reload()
  } catch (err: unknown) {
    message.error((err as Error).message || '删除失败')
  }
}

async function handleRefreshCache() {
  try {
    await configApi.refreshCache()
    message.success('缓存刷新成功')
  } catch (err: unknown) {
    message.error((err as Error).message || '刷新缓存失败')
  }
}
</script>

<template>
  <div class="page-configs">
    <CrudTable
      title="参数配置管理"
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
        <NSpace>
          <NButton @click="handleRefreshCache">刷新缓存</NButton>
          <NButton type="primary" @click="modal.open('新增配置')">新增</NButton>
        </NSpace>
      </template>
    </CrudTable>

    <CrudModal
      v-model:show="modal.visible.value"
      :title="modal.title.value"
      :loading="modal.loading.value"
      @confirm="modal.save"
    >
      <NForm label-placement="left" label-width="80">
        <NFormItem label="参数名称" required>
          <NInput v-model:value="modal.formData.name" placeholder="请输入参数名称" />
        </NFormItem>
        <NFormItem label="参数键名" required>
          <NInput
            v-model:value="modal.formData.key"
            placeholder="请输入参数键名"
            :disabled="modal.isEdit.value"
          />
        </NFormItem>
        <NFormItem label="参数键值" required>
          <NInput
            v-model:value="modal.formData.value"
            type="textarea"
            placeholder="请输入参数键值"
          />
        </NFormItem>
        <NFormItem label="备注">
          <NInput v-model:value="modal.formData.remark" type="textarea" placeholder="请输入备注" />
        </NFormItem>
      </NForm>
    </CrudModal>
  </div>
</template>

<style scoped>
.page-configs {
  height: 100%;
}
</style>
