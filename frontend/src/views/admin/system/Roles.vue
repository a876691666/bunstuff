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
import { roleApi } from '@/api'
import type { Role, CreateRoleRequest, UpdateRoleRequest } from '@/types'
import { Op } from '@/utils/ssql'

defineOptions({ name: 'SystemRoles' })

const message = useMessage()

// 搜索字段配置
const searchFields: SearchField[] = [
  { key: 'name', label: '角色名称', type: 'input' },
  { key: 'id', label: '角色编码', type: 'input' },
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
const table = useTable<Role, { name?: string; id?: string; status?: number }>({
  api: (params) => roleApi.list(params),
  opMap: { name: Op.Like, id: Op.Like, status: Op.Eq },
})

// 使用 useModal
const modal = useModal<CreateRoleRequest & { id?: string }, string>({
  defaultData: {
    id: '',
    name: '',
    description: '',
    status: 1,
  },
  validate: (data) => {
    if (!data.name) return '请输入角色名称'
    if (!data.id) return '请输入角色编码'
    return null
  },
  createApi: (data) => roleApi.create(data),
  updateApi: (id, data) => roleApi.update(id, data as UpdateRoleRequest),
  onSuccess: () => {
    message.success(modal.isEdit.value ? '更新成功' : '创建成功')
    table.reload()
  },
  onError: (err) => message.error(err.message || '操作失败'),
})

// 表格列定义
const columns: DataTableColumns<Role> = [
  { title: '角色编码', key: 'id', width: 150 },
  { title: '角色名称', key: 'name', width: 150 },
  {
    title: '描述',
    key: 'description',
    ellipsis: { tooltip: true },
    render: (row) => row.description || '-',
  },
  {
    title: '状态',
    key: 'status',
    width: 80,
    render: (row) =>
      h(NTag, { type: row.status === 1 ? 'success' : 'error', size: 'small' }, () =>
        row.status === 1 ? '正常' : '禁用',
      ),
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
          title: '确定要删除该角色吗？',
          onConfirm: () => handleDelete(row.id),
        }),
      ]),
  },
]

// 转换角色为选项
function handleEdit(row: Role) {
  modal.edit(row.id, {
    id: row.id,
    name: row.name,
    description: row.description || '',
    status: row.status,
  })
}

async function handleDelete(id: string) {
  try {
    await roleApi.delete(id)
    message.success('删除成功')
    table.reload()
  } catch (err: unknown) {
    message.error((err as Error).message || '删除失败')
  }
}
</script>

<template>
  <div class="page-roles">
    <CrudTable
      title="角色管理"
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
        <NButton type="primary" @click="modal.open('新增角色')">新增角色</NButton>
      </template>
    </CrudTable>

    <CrudModal
      v-model:show="modal.visible.value"
      :title="modal.title.value"
      :loading="modal.loading.value"
      @confirm="modal.save"
    >
      <NForm label-placement="left" label-width="80">
        <NFormItem label="角色编码" required>
          <NInput
            v-model:value="modal.formData.id"
            placeholder="请输入角色编码"
            :disabled="modal.isEdit.value"
          />
        </NFormItem>
        <NFormItem label="角色名称" required>
          <NInput v-model:value="modal.formData.name" placeholder="请输入角色名称" />
        </NFormItem>
        <NFormItem label="描述">
          <NInput
            v-model:value="modal.formData.description"
            type="textarea"
            placeholder="请输入描述"
            :rows="3"
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
      </NForm>
    </CrudModal>
  </div>
</template>

<style scoped>
.page-roles {
  height: 100%;
}
</style>
