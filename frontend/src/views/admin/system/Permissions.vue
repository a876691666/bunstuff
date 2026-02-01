<script setup lang="ts">
import { shallowRef, onMounted, h, reactive } from 'vue'
import { NButton, NSpace, useMessage, NForm, NFormItem, NInput } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { PageTable, FormModal, SearchForm, ConfirmButton } from '@/components'
import type { SearchFieldConfig } from '@/components'
import { permissionApi } from '@/api'
import type { Permission, CreatePermissionRequest, UpdatePermissionRequest } from '@/types'

const message = useMessage()

// 数据状态
const loading = shallowRef(false)
const data = shallowRef<Permission[]>([])
const total = shallowRef(0)
const page = shallowRef(1)
const pageSize = shallowRef(10)

// 搜索条件
const searchParams = shallowRef<Record<string, any>>({})

// 弹窗状态
const modalVisible = shallowRef(false)
const modalLoading = shallowRef(false)
const modalTitle = shallowRef('新增权限')
const editingId = shallowRef<number | null>(null)
const formData = reactive<CreatePermissionRequest & { id?: number }>({
  name: '',
  code: '',
  resource: '',
  description: '',
})

// 搜索字段配置
const searchFields: SearchFieldConfig[] = [
  { key: 'name', label: '权限名称', type: 'input' },
  { key: 'code', label: '权限编码', type: 'input' },
  { key: 'resource', label: '资源标识', type: 'input' },
]

// 表格列定义
const columns: DataTableColumns<Permission> = [
  { title: 'ID', key: 'id', width: 80 },
  { title: '权限名称', key: 'name', width: 150 },
  { title: '权限编码', key: 'code', width: 200 },
  { title: '资源标识', key: 'resource', width: 150, render: (row) => row.resource || '-' },
  { title: '描述', key: 'description', ellipsis: { tooltip: true }, render: (row) => row.description || '-' },
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
          title: '确定要删除该权限吗？',
          onConfirm: () => handleDelete(row.id),
        }),
      ]),
  },
]

// 加载数据
async function loadData() {
  loading.value = true
  try {
    const res = await permissionApi.list({
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
  modalTitle.value = '新增权限'
  Object.assign(formData, {
    name: '',
    code: '',
    resource: '',
    description: '',
  })
  modalVisible.value = true
}

// 编辑
function handleEdit(row: Permission) {
  editingId.value = row.id
  modalTitle.value = '编辑权限'
  Object.assign(formData, {
    name: row.name,
    code: row.code,
    resource: row.resource || '',
    description: row.description || '',
  })
  modalVisible.value = true
}

// 删除
async function handleDelete(id: number) {
  try {
    await permissionApi.delete(id)
    message.success('删除成功')
    loadData()
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
      await permissionApi.update(editingId.value, formData as UpdatePermissionRequest)
      message.success('更新成功')
    } else {
      await permissionApi.create(formData as CreatePermissionRequest)
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
})
</script>

<template>
  <div class="page-permissions">
    <PageTable
      title="权限管理"
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
        <NButton type="primary" @click="handleAdd">新增权限</NButton>
      </template>
    </PageTable>

    <FormModal
      v-model:show="modalVisible"
      :title="modalTitle"
      :loading="modalLoading"
      @confirm="handleSave"
    >
      <NForm label-placement="left" label-width="80">
        <NFormItem label="权限名称" required>
          <NInput v-model:value="formData.name" placeholder="请输入权限名称" />
        </NFormItem>
        <NFormItem label="权限编码" required>
          <NInput
            v-model:value="formData.code"
            placeholder="格式：资源:操作，如 user:create"
            :disabled="!!editingId"
          />
        </NFormItem>
        <NFormItem label="资源标识">
          <NInput v-model:value="formData.resource" placeholder="请输入资源标识" />
        </NFormItem>
        <NFormItem label="描述">
          <NInput
            v-model:value="formData.description"
            type="textarea"
            placeholder="请输入描述"
            :rows="3"
          />
        </NFormItem>
      </NForm>
    </FormModal>
  </div>
</template>

<style scoped>
.page-permissions {
  height: 100%;
}
</style>
