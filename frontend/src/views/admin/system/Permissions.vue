<script setup lang="ts">
import { h } from 'vue'
import { NButton, NSpace, useMessage, NForm, NFormItem, NInput } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { CrudTable, CrudSearch, CrudModal, CrudConfirm, type SearchField } from '@/components'
import { useTable, useModal } from '@/composables'
import { permissionApi } from '@/api'
import type { Permission, CreatePermissionRequest, UpdatePermissionRequest } from '@/types'
import { Op } from '@/utils/ssql'

defineOptions({ name: 'SystemPermissions' })

const message = useMessage()

// 搜索字段配置
const searchFields: SearchField[] = [
  { key: 'name', label: '权限名称', type: 'input' },
  { key: 'code', label: '权限编码', type: 'input' },
  { key: 'resource', label: '资源标识', type: 'input' },
]

// 使用 useTable
const table = useTable<Permission, { name?: string; code?: string; resource?: string }>({
  api: (params) => permissionApi.list(params),
  opMap: { name: Op.Like, code: Op.Like, resource: Op.Like },
})

// 使用 useModal
const modal = useModal<CreatePermissionRequest & { id?: number }>({
  defaultData: {
    name: '',
    code: '',
    resource: '',
    description: '',
  },
  validate: (data) => {
    if (!data.name) return '请输入权限名称'
    if (!data.code) return '请输入权限编码'
    return null
  },
  createApi: (data) => permissionApi.create(data),
  updateApi: (id, data) => permissionApi.update(id, data as UpdatePermissionRequest),
  onSuccess: () => {
    message.success(modal.isEdit.value ? '更新成功' : '创建成功')
    table.reload()
  },
  onError: (err) => message.error(err.message || '操作失败'),
})

// 表格列定义
const columns: DataTableColumns<Permission> = [
  { title: 'ID', key: 'id', width: 80 },
  { title: '权限名称', key: 'name', width: 150 },
  { title: '权限编码', key: 'code', width: 200 },
  { title: '资源标识', key: 'resource', width: 150, render: (row) => row.resource || '-' },
  {
    title: '描述',
    key: 'description',
    ellipsis: { tooltip: true },
    render: (row) => row.description || '-',
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
          title: '确定要删除该权限吗？',
          onConfirm: () => handleDelete(row.id),
        }),
      ]),
  },
]

function handleEdit(row: Permission) {
  modal.edit(row.id, {
    name: row.name,
    code: row.code,
    resource: row.resource || '',
    description: row.description || '',
  })
}

async function handleDelete(id: number) {
  try {
    await permissionApi.delete(id)
    message.success('删除成功')
    table.reload()
  } catch (err: unknown) {
    message.error((err as Error).message || '删除失败')
  }
}
</script>

<template>
  <div class="page-permissions">
    <CrudTable
      title="权限管理"
      :columns="columns"
      :data="table.data.value"
      :loading="table.loading.value"
      v-model:page="table.page.value"
      v-model:page-size="table.pageSize.value"
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
        <NButton type="primary" @click="modal.open('新增权限')">新增权限</NButton>
      </template>
    </CrudTable>

    <CrudModal
      v-model:show="modal.visible.value"
      :title="modal.title.value"
      :loading="modal.loading.value"
      @confirm="modal.save"
    >
      <NForm label-placement="left" label-width="80">
        <NFormItem label="权限名称" required>
          <NInput v-model:value="modal.formData.name" placeholder="请输入权限名称" />
        </NFormItem>
        <NFormItem label="权限编码" required>
          <NInput
            v-model:value="modal.formData.code"
            placeholder="格式：资源:操作，如 user:create"
            :disabled="modal.isEdit.value"
          />
        </NFormItem>
        <NFormItem label="资源标识">
          <NInput v-model:value="modal.formData.resource" placeholder="请输入资源标识" />
        </NFormItem>
        <NFormItem label="描述">
          <NInput
            v-model:value="modal.formData.description"
            type="textarea"
            placeholder="请输入描述"
            :rows="3"
          />
        </NFormItem>
      </NForm>
    </CrudModal>
  </div>
</template>

<style scoped>
.page-permissions {
  height: 100%;
}
</style>
