<script setup lang="ts">
import { shallowRef, onMounted, h, reactive } from 'vue'
import { NButton, NTag, NSpace, useMessage, NForm, NFormItem, NInput, NSelect } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { PageTable, FormModal, SearchForm, ConfirmButton } from '@/components'
import type { SearchFieldConfig } from '@/components'
import { userApi, roleApi } from '@/api'
import type { User, Role, CreateUserRequest, UpdateUserRequest } from '@/types'

defineOptions({
  name: 'SystemUsers',
})

const message = useMessage()

// 数据状态
const loading = shallowRef(false)
const data = shallowRef<User[]>([])
const total = shallowRef(0)
const page = shallowRef(1)
const pageSize = shallowRef(10)
const roles = shallowRef<Role[]>([])

// 搜索条件
const searchParams = shallowRef<Record<string, string>>({})

// 弹窗状态
const modalVisible = shallowRef(false)
const modalLoading = shallowRef(false)
const modalTitle = shallowRef('新增用户')
const editingId = shallowRef<number | null>(null)
const formData = reactive<CreateUserRequest & { id?: number }>({
  username: '',
  password: '',
  nickname: '',
  email: '',
  phone: '',
  roleId: undefined,
  status: 1,
})

// 搜索字段配置
const searchFields: SearchFieldConfig[] = [
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
      return role?.name || row.roleId
    },
  },
  {
    title: '状态',
    key: 'status',
    width: 80,
    render: (row) =>
      h(NTag, { type: row.status === 1 ? 'success' : 'error', size: 'small' }, () =>
        row.status === 1 ? '正常' : '禁用'
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
          {
            size: 'small',
            quaternary: true,
            type: 'primary',
            onClick: () => handleEdit(row),
          },
          () => '编辑'
        ),
        h(ConfirmButton, {
          title: '确定要删除该用户吗？',
          onConfirm: () => handleDelete(row.id),
        }),
      ]),
  },
]

// 加载数据
async function loadData() {
  loading.value = true
  try {
    const res = await userApi.list({
      page: page.value,
      pageSize: pageSize.value,
      ...searchParams.value,
    })
    data.value = res.data
    total.value = res.total
  } catch (err: any) {
    message.error(err.message || '加载失败')
  } finally {
    loading.value = false
  }
}

// 加载角色列表
async function loadRoles() {
  try {
    const res = await roleApi.list({ pageSize: 1000 })
    roles.value = res.data
  } catch (err: any) {
    console.error('加载角色失败', err)
  }
}

// 搜索
function handleSearch() {
  page.value = 1
  loadData()
}

// 重置
function handleReset() {
  page.value = 1
  loadData()
}

// 新增
function handleAdd() {
  editingId.value = null
  modalTitle.value = '新增用户'
  Object.assign(formData, {
    username: '',
    password: '',
    nickname: '',
    email: '',
    phone: '',
    roleId: undefined,
    status: 1,
  })
  modalVisible.value = true
}

// 编辑
function handleEdit(row: User) {
  editingId.value = row.id
  modalTitle.value = '编辑用户'
  Object.assign(formData, {
    username: row.username,
    password: '',
    nickname: row.nickname || '',
    email: row.email || '',
    phone: row.phone || '',
    roleId: row.roleId,
    status: row.status,
  })
  modalVisible.value = true
}

// 删除
async function handleDelete(id: number) {
  try {
    await userApi.delete(id)
    message.success('删除成功')
    loadData()
  } catch (err: any) {
    message.error(err.message || '删除失败')
  }
}

// 保存
async function handleSave() {
  if (!formData.username) {
    message.warning('请输入用户名')
    return
  }

  if (!editingId.value && !formData.password) {
    message.warning('请输入密码')
    return
  }

  modalLoading.value = true
  try {
    if (editingId.value) {
      const updateData: UpdateUserRequest = {
        nickname: formData.nickname || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        roleId: formData.roleId,
        status: formData.status,
      }
      if (formData.password) {
        updateData.password = formData.password
      }
      await userApi.update(editingId.value, updateData)
      message.success('更新成功')
    } else {
      await userApi.create(formData as CreateUserRequest)
      message.success('创建成功')
    }
    modalVisible.value = false
    loadData()
  } catch (err: any) {
    message.error(err.message || '保存失败')
  } finally {
    modalLoading.value = false
  }
}

// 分页
function handlePageChange(p: number) {
  page.value = p
  loadData()
}

function handlePageSizeChange(ps: number) {
  pageSize.value = ps
  page.value = 1
  loadData()
}

onMounted(() => {
  loadData()
  loadRoles()
})
</script>

<template>
  <div class="page-users">
    <PageTable
      title="用户管理"
      :columns="columns"
      :data="data"
      :loading="loading"
      :pagination="{
        page: page,
        pageSize: pageSize,
        pageCount: Math.ceil(total / pageSize),
        showSizePicker: true,
        pageSizes: [10, 20, 50, 100],
        itemCount: total,
      }"
      @update:page="handlePageChange"
      @update:page-size="handlePageSizeChange"
    >
      <template #toolbar>
        <SearchForm
          v-model="searchParams"
          :fields="searchFields"
          :loading="loading"
          @search="handleSearch"
          @reset="handleReset"
        />
      </template>

      <template #header-extra>
        <NButton type="primary" @click="handleAdd">新增用户</NButton>
      </template>
    </PageTable>

    <FormModal
      v-model:show="modalVisible"
      :title="modalTitle"
      :loading="modalLoading"
      @confirm="handleSave"
    >
      <NForm label-placement="left" label-width="80">
        <NFormItem label="用户名" required>
          <NInput
            v-model:value="formData.username"
            placeholder="请输入用户名"
            :disabled="!!editingId"
          />
        </NFormItem>
        <NFormItem :label="editingId ? '新密码' : '密码'" :required="!editingId">
          <NInput
            v-model:value="formData.password"
            type="password"
            :placeholder="editingId ? '不修改请留空' : '请输入密码'"
            show-password-on="click"
          />
        </NFormItem>
        <NFormItem label="昵称">
          <NInput v-model:value="formData.nickname" placeholder="请输入昵称" />
        </NFormItem>
        <NFormItem label="邮箱">
          <NInput v-model:value="formData.email" placeholder="请输入邮箱" />
        </NFormItem>
        <NFormItem label="手机号">
          <NInput v-model:value="formData.phone" placeholder="请输入手机号" />
        </NFormItem>
        <NFormItem label="角色">
          <NSelect
            v-model:value="formData.roleId"
            :options="roles.map((r) => ({ label: r.name, value: r.id }))"
            placeholder="请选择角色"
            clearable
          />
        </NFormItem>
        <NFormItem label="状态">
          <NSelect
            v-model:value="formData.status"
            :options="[
              { label: '正常', value: 1 },
              { label: '禁用', value: 0 },
            ]"
          />
        </NFormItem>
      </NForm>
    </FormModal>
  </div>
</template>

<style scoped>
.page-users {
  height: 100%;
}
</style>
