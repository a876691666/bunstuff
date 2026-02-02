<script setup lang="ts">
import { h, onMounted, shallowRef } from 'vue'
import { NButton, NTag, NSpace, useMessage, NForm, NFormItem, NInput, NSelect } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { CrudTable, CrudSearch, CrudModal, CrudConfirm, type SearchField } from '@/components'
import { useTable, useModal } from '@/composables'
import { userApi, roleApi } from '@/api'
import type { User, Role, CreateUserRequest, UpdateUserRequest } from '@/types'
import { Op } from '@/utils/ssql'

defineOptions({ name: 'SystemUsers' })

const message = useMessage()

// 角色列表
const roles = shallowRef<Role[]>([])

// 搜索字段配置
const searchFields: SearchField[] = [
  { key: 'username', label: '用户名', type: 'input' },
  { key: 'nickname', label: '昵称', type: 'input' },
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
const table = useTable<User, { username?: string; nickname?: string; status?: number }>({
  api: (params) => userApi.list(params),
  opMap: { username: Op.Like, nickname: Op.Like, status: Op.Eq },
})

// 使用 useModal
const modal = useModal<CreateUserRequest & { id?: number }>({
  defaultData: {
    username: '',
    password: '',
    nickname: '',
    email: '',
    phone: '',
    roleId: undefined,
    status: 1,
  },
  validate: (data, isEdit) => {
    if (!data.username) return '请输入用户名'
    if (!isEdit && !data.password) return '请输入密码'
    return null
  },
  createApi: (data) => userApi.create(data),
  updateApi: (id, data) => {
    const updateData: UpdateUserRequest = {
      nickname: data.nickname || undefined,
      email: data.email || undefined,
      phone: data.phone || undefined,
      roleId: data.roleId,
      status: data.status,
    }
    if (data.password) {
      updateData.password = data.password
    }
    return userApi.update(id, updateData)
  },
  onSuccess: () => {
    message.success(modal.isEdit.value ? '更新成功' : '创建成功')
    table.reload()
  },
  onError: (err) => message.error(err.message || '操作失败'),
})

// 表格列定义
const columns: DataTableColumns<User> = [
  { title: 'ID', key: 'id', width: 80 },
  { title: '用户名', key: 'username', width: 120 },
  { title: '昵称', key: 'nickname', width: 120, render: (row) => row.nickname || '-' },
  { title: '邮箱', key: 'email', width: 180, render: (row) => row.email || '-' },
  { title: '手机号', key: 'phone', width: 130, render: (row) => row.phone || '-' },
  {
    title: '角色',
    key: 'roleId',
    width: 100,
    render: (row) => {
      const role = roles.value.find((r) => r.id === row.roleId)
      return role?.name || row.roleId || '-'
    },
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
          title: '确定要删除该用户吗？',
          onConfirm: () => handleDelete(row.id),
        }),
      ]),
  },
]

function handleEdit(row: User) {
  modal.edit(row.id, {
    username: row.username,
    password: '',
    nickname: row.nickname || '',
    email: row.email || '',
    phone: row.phone || '',
    roleId: row.roleId,
    status: row.status,
  })
}

async function handleDelete(id: number) {
  try {
    await userApi.delete(id)
    message.success('删除成功')
    table.reload()
  } catch (err: unknown) {
    message.error((err as Error).message || '删除失败')
  }
}

// 加载角色列表
async function loadRoles() {
  try {
    const res = await roleApi.list({ pageSize: 1000 })
    roles.value = res.data
  } catch (err) {
    console.error('加载角色失败', err)
  }
}

onMounted(() => {
  loadRoles()
})
</script>

<template>
  <div class="page-users">
    <CrudTable
      title="用户管理"
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
        <NButton type="primary" @click="modal.open('新增用户')">新增用户</NButton>
      </template>
    </CrudTable>

    <CrudModal
      v-model:show="modal.visible.value"
      :title="modal.title.value"
      :loading="modal.loading.value"
      @confirm="modal.save"
    >
      <NForm label-placement="left" label-width="80">
        <NFormItem label="用户名" required>
          <NInput
            v-model:value="modal.formData.username"
            placeholder="请输入用户名"
            :disabled="modal.isEdit.value"
          />
        </NFormItem>
        <NFormItem :label="modal.isEdit.value ? '新密码' : '密码'" :required="!modal.isEdit.value">
          <NInput
            v-model:value="modal.formData.password"
            type="password"
            :placeholder="modal.isEdit.value ? '不修改请留空' : '请输入密码'"
            show-password-on="click"
          />
        </NFormItem>
        <NFormItem label="昵称">
          <NInput v-model:value="modal.formData.nickname" placeholder="请输入昵称" />
        </NFormItem>
        <NFormItem label="邮箱">
          <NInput v-model:value="modal.formData.email" placeholder="请输入邮箱" />
        </NFormItem>
        <NFormItem label="手机号">
          <NInput v-model:value="modal.formData.phone" placeholder="请输入手机号" />
        </NFormItem>
        <NFormItem label="角色">
          <NSelect
            v-model:value="modal.formData.roleId"
            :options="roles.map((r) => ({ label: r.name, value: r.id }))"
            placeholder="请选择角色"
            clearable
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
.page-users {
  height: 100%;
}
</style>
