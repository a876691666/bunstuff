<script setup lang="ts">
import { shallowRef, onMounted, h, reactive } from 'vue'
import {
  NButton,
  NTag,
  NSpace,
  useMessage,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NTreeSelect,
} from 'naive-ui'
import type { DataTableColumns, TreeSelectOption } from 'naive-ui'
import { PageTable, FormModal, SearchForm, ConfirmButton } from '@/components'
import type { SearchFieldConfig } from '@/components'
import { roleApi } from '@/api'
import type { Role, RoleTree, CreateRoleRequest, UpdateRoleRequest } from '@/types'

const message = useMessage()

// 数据状态
const loading = shallowRef(false)
const data = shallowRef<Role[]>([])
const total = shallowRef(0)
const page = shallowRef(1)
const pageSize = shallowRef(10)
const roleTree = shallowRef<RoleTree[]>([])

// 搜索条件
const searchParams = shallowRef<Record<string, any>>({})

// 弹窗状态
const modalVisible = shallowRef(false)
const modalLoading = shallowRef(false)
const modalTitle = shallowRef('新增角色')
const editingId = shallowRef<number | null>(null)
const formData = reactive<CreateRoleRequest & { id?: number }>({
  name: '',
  code: '',
  parentId: null,
  description: '',
  status: 1,
})

// 搜索字段配置
const searchFields: SearchFieldConfig[] = [
  { key: 'name', label: '角色名称', type: 'input' },
  { key: 'code', label: '角色编码', type: 'input' },
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
const columns: DataTableColumns<Role> = [
  { title: 'ID', key: 'id', width: 80 },
  { title: '角色名称', key: 'name', width: 150 },
  { title: '角色编码', key: 'code', width: 150 },
  { title: '父角色ID', key: 'parentId', width: 100, render: (row) => row.parentId ?? '-' },
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
          {
            size: 'small',
            quaternary: true,
            type: 'primary',
            onClick: () => handleEdit(row),
          },
          () => '编辑',
        ),
        h(ConfirmButton, {
          title: '确定要删除该角色吗？',
          onConfirm: () => handleDelete(row.id),
        }),
      ]),
  },
]

// 转换角色树为TreeSelect选项
function convertToTreeOptions(roles: RoleTree[]): TreeSelectOption[] {
  return roles.map((role) => ({
    label: role.name,
    key: role.id,
    children: role.children ? convertToTreeOptions(role.children) : undefined,
  }))
}

// 加载数据
async function loadData() {
  loading.value = true
  try {
    const res = await roleApi.list({
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

// 加载角色树
async function loadRoleTree() {
  try {
    const res = await roleApi.tree()
    roleTree.value = res
  } catch (err: unknown) {
    console.error('加载角色树失败', err)
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
  modalTitle.value = '新增角色'
  Object.assign(formData, {
    name: '',
    code: '',
    parentId: null,
    description: '',
    status: 1,
  })
  modalVisible.value = true
}

// 编辑
function handleEdit(row: Role) {
  editingId.value = row.id
  modalTitle.value = '编辑角色'
  Object.assign(formData, {
    name: row.name,
    code: row.code,
    parentId: row.parentId,
    description: row.description || '',
    status: row.status,
  })
  modalVisible.value = true
}

// 删除
async function handleDelete(id: number) {
  try {
    await roleApi.delete(id)
    message.success('删除成功')
    loadData()
    loadRoleTree()
  } catch (err: any) {
    message.error(err.message || '删除失败')
  }
}

// 保存
async function handleSave() {
  if (!formData.name || !formData.code) {
    message.warning('请填写必填项')
    return
  }

  modalLoading.value = true
  try {
    if (editingId.value) {
      await roleApi.update(editingId.value, formData as UpdateRoleRequest)
      message.success('更新成功')
    } else {
      await roleApi.create(formData as CreateRoleRequest)
      message.success('创建成功')
    }
    modalVisible.value = false
    loadData()
    loadRoleTree()
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
  loadRoleTree()
})
</script>

<template>
  <div class="page-roles">
    <PageTable
      title="角色管理"
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
        <NButton type="primary" @click="handleAdd">新增角色</NButton>
      </template>
    </PageTable>

    <FormModal
      v-model:show="modalVisible"
      :title="modalTitle"
      :loading="modalLoading"
      @confirm="handleSave"
    >
      <NForm label-placement="left" label-width="80">
        <NFormItem label="角色名称" required>
          <NInput v-model:value="formData.name" placeholder="请输入角色名称" />
        </NFormItem>
        <NFormItem label="角色编码" required>
          <NInput
            v-model:value="formData.code"
            placeholder="请输入角色编码"
            :disabled="!!editingId"
          />
        </NFormItem>
        <NFormItem label="父角色">
          <NTreeSelect
            v-model:value="formData.parentId"
            :options="convertToTreeOptions(roleTree)"
            placeholder="请选择父角色"
            clearable
            :disabled="editingId === formData.parentId"
          />
        </NFormItem>
        <NFormItem label="描述">
          <NInput
            v-model:value="formData.description"
            type="textarea"
            placeholder="请输入描述"
            :rows="3"
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
.page-roles {
  height: 100%;
}
</style>
