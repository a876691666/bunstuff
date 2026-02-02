<script setup lang="ts">
import { h } from 'vue'
import { NButton, NTag, NSpace, useMessage, NForm, NFormItem, NInput, NSelect } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { CrudTable, CrudSearch, CrudModal, CrudConfirm, type SearchField } from '@/components'
import { useTable, useModal } from '@/composables'
import { dictApi } from '@/api'
import type { DictType, CreateDictTypeRequest, UpdateDictTypeRequest } from '@/types'
import { Op } from '@/utils/ssql'

defineOptions({ name: 'SystemDictTypes' })

const message = useMessage()

// 搜索字段配置
const searchFields: SearchField[] = [
  { key: 'name', label: '字典名称', type: 'input' },
  { key: 'type', label: '字典类型', type: 'input' },
  {
    key: 'status',
    label: '状态',
    type: 'select',
    options: [
      { label: '正常', value: 1 },
      { label: '禁用', value: 0 },
    ],
  },
]

// 使用 useTable
const table = useTable<DictType, { name?: string; type?: string; status?: number }>({
  api: (params) => dictApi.listTypes(params),
  opMap: { name: Op.Like, type: Op.Like },
})

// 使用 useModal
const modal = useModal<CreateDictTypeRequest & { id?: number }>({
  defaultData: {
    name: '',
    type: '',
    status: 1,
    remark: '',
  },
  validate: (data) => {
    if (!data.name) return '请输入字典名称'
    if (!data.type) return '请输入字典类型'
    return null
  },
  createApi: (data) => dictApi.createType(data),
  updateApi: (id, data) => dictApi.updateType(id, data as UpdateDictTypeRequest),
  onSuccess: () => {
    message.success(modal.isEdit.value ? '更新成功' : '创建成功')
    table.reload()
  },
  onError: (err) => message.error(err.message || '操作失败'),
})

// 表格列定义
const columns: DataTableColumns<DictType> = [
  { title: 'ID', key: 'id', width: 80 },
  { title: '字典名称', key: 'name', width: 150 },
  { title: '字典类型', key: 'type', width: 150 },
  {
    title: '状态',
    key: 'status',
    width: 80,
    render: (row) =>
      h(NTag, { type: row.status === 1 ? 'success' : 'error', size: 'small' }, () =>
        row.status === 1 ? '正常' : '禁用',
      ),
  },
  { title: '备注', key: 'remark', ellipsis: { tooltip: true } },
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
          title: '确定要删除该字典类型吗？',
          onConfirm: () => handleDelete(row.id),
        }),
      ]),
  },
]

function handleEdit(row: DictType) {
  modal.edit(row.id, {
    name: row.name,
    type: row.type,
    status: row.status,
    remark: row.remark || '',
  })
}

async function handleDelete(id: number) {
  try {
    await dictApi.deleteType(id)
    message.success('删除成功')
    table.reload()
  } catch (err: unknown) {
    message.error((err as Error).message || '删除失败')
  }
}
</script>

<template>
  <div class="page-dict-types">
    <CrudTable
      title="字典类型管理"
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
        <NButton type="primary" @click="modal.open('新增字典类型')">新增</NButton>
      </template>
    </CrudTable>

    <CrudModal
      v-model:show="modal.visible.value"
      :title="modal.title.value"
      :loading="modal.loading.value"
      @confirm="modal.save"
    >
      <NForm label-placement="left" label-width="80">
        <NFormItem label="字典名称" required>
          <NInput v-model:value="modal.formData.name" placeholder="请输入字典名称" />
        </NFormItem>
        <NFormItem label="字典类型" required>
          <NInput
            v-model:value="modal.formData.type"
            placeholder="请输入字典类型"
            :disabled="modal.isEdit.value"
          />
        </NFormItem>
        <NFormItem label="状态">
          <NSelect
            v-model:value="modal.formData.status"
            :options="[
              { label: '正常', value: 1 },
              { label: '禁用', value: 0 },
            ]"
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
.page-dict-types {
  height: 100%;
}
</style>
