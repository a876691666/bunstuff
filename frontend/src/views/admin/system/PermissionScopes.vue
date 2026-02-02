<script setup lang="ts">
import { shallowRef, onMounted, h } from 'vue'
import { NButton, NSpace, useMessage, NForm, NFormItem, NInput, NSelect } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { CrudTable, CrudSearch, CrudModal, CrudConfirm, type SearchField } from '@/components'
import { useTable, useModal } from '@/composables'
import { permissionScopeApi, permissionApi } from '@/api'
import type {
  PermissionScope,
  Permission,
  CreatePermissionScopeRequest,
  UpdatePermissionScopeRequest,
} from '@/types'
import { Op } from '@/utils/ssql'

defineOptions({ name: 'SystemPermissionScopes' })

const message = useMessage()
const permissions = shallowRef<Permission[]>([])

// 搜索字段配置
const searchFields: SearchField[] = [
  { key: 'name', label: '规则名称', type: 'input' },
  { key: 'tableName', label: '表名', type: 'input' },
]

// 使用 useTable
const table = useTable<PermissionScope, { name?: string; tableName?: string }>({
  api: (params) => permissionScopeApi.list(params),
  opMap: { name: Op.Like, tableName: Op.Like },
})

// 使用 useModal
const modal = useModal<CreatePermissionScopeRequest & { id?: number }>({
  defaultData: {
    permissionId: 0,
    name: '',
    tableName: '',
    ssqlRule: '',
    description: '',
  },
  validate: (data) => {
    if (!data.permissionId) return '请选择关联权限'
    if (!data.name) return '请输入规则名称'
    if (!data.tableName) return '请输入表名'
    if (!data.ssqlRule) return '请输入SSQL规则'
    return null
  },
  createApi: (data) => permissionScopeApi.create(data),
  updateApi: (id, data) => permissionScopeApi.update(id, data as UpdatePermissionScopeRequest),
  onSuccess: () => {
    message.success(modal.isEdit.value ? '更新成功' : '创建成功')
    table.reload()
  },
  onError: (err) => message.error(err.message || '操作失败'),
})

// 表格列定义
const columns: DataTableColumns<PermissionScope> = [
  { title: 'ID', key: 'id', width: 80 },
  {
    title: '关联权限',
    key: 'permissionId',
    width: 150,
    render: (row) => {
      const perm = permissions.value.find((p) => p.id === row.permissionId)
      return perm?.name || row.permissionId
    },
  },
  { title: '规则名称', key: 'name', width: 150 },
  { title: '表名', key: 'tableName', width: 150 },
  { title: 'SSQL规则', key: 'ssqlRule', width: 200, ellipsis: { tooltip: true } },
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
          title: '确定要删除该数据权限吗？',
          onConfirm: () => handleDelete(row.id),
        }),
      ]),
  },
]

// 加载权限列表
async function loadPermissions() {
  try {
    const res = await permissionApi.list({ pageSize: 1000 })
    permissions.value = res.data
  } catch (err: unknown) {
    console.error('加载权限失败', err)
  }
}

function handleEdit(row: PermissionScope) {
  modal.edit(row.id, {
    permissionId: row.permissionId,
    name: row.name,
    tableName: row.tableName,
    ssqlRule: row.ssqlRule,
    description: row.description || '',
  })
}

async function handleDelete(id: number) {
  try {
    await permissionScopeApi.delete(id)
    message.success('删除成功')
    table.reload()
  } catch (err: unknown) {
    message.error((err as Error).message || '删除失败')
  }
}

onMounted(() => {
  loadPermissions()
})
</script>

<template>
  <div class="page-permission-scopes">
    <CrudTable
      title="数据权限管理"
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
        <NButton type="primary" @click="modal.open('新增数据权限')">新增数据权限</NButton>
      </template>
    </CrudTable>

    <CrudModal
      v-model:show="modal.visible.value"
      :title="modal.title.value"
      :loading="modal.loading.value"
      @confirm="modal.save"
    >
      <NForm label-placement="left" label-width="80">
        <NFormItem label="关联权限" required>
          <NSelect
            v-model:value="modal.formData.permissionId"
            :options="permissions.map((p) => ({ label: `${p.name} (${p.code})`, value: p.id }))"
            placeholder="请选择关联权限"
            filterable
            :disabled="modal.isEdit.value"
          />
        </NFormItem>
        <NFormItem label="规则名称" required>
          <NInput v-model:value="modal.formData.name" placeholder="请输入规则名称" />
        </NFormItem>
        <NFormItem label="表名" required>
          <NInput v-model:value="modal.formData.tableName" placeholder="请输入表名" />
        </NFormItem>
        <NFormItem label="SSQL规则" required>
          <NInput
            v-model:value="modal.formData.ssqlRule"
            type="textarea"
            placeholder="请输入SSQL过滤规则"
            :rows="4"
          />
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
.page-permission-scopes {
  height: 100%;
}
</style>
