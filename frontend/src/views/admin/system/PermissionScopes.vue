<script setup lang="ts">
import { shallowRef, onMounted, h, reactive } from 'vue'
import { NButton, NSpace, useMessage, NForm, NFormItem, NInput, NSelect } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { PageTable, FormModal, SearchForm, ConfirmButton } from '@/components'
import type { SearchFieldConfig } from '@/components'
import { permissionScopeApi, permissionApi } from '@/api'
import type {
  PermissionScope,
  Permission,
  CreatePermissionScopeRequest,
  UpdatePermissionScopeRequest,
} from '@/types'

const message = useMessage()

// 数据状态
const loading = shallowRef(false)
const data = shallowRef<PermissionScope[]>([])
const total = shallowRef(0)
const page = shallowRef(1)
const pageSize = shallowRef(10)
const permissions = shallowRef<Permission[]>([])

// 搜索条件
const searchParams = shallowRef<Record<string, any>>({})

// 弹窗状态
const modalVisible = shallowRef(false)
const modalLoading = shallowRef(false)
const modalTitle = shallowRef('新增数据权限')
const editingId = shallowRef<number | null>(null)
const formData = reactive<CreatePermissionScopeRequest & { id?: number }>({
  permissionId: 0,
  name: '',
  tableName: '',
  ssqlRule: '',
  description: '',
})

// 搜索字段配置
const searchFields: SearchFieldConfig[] = [
  { key: 'name', label: '规则名称', type: 'input' },
  { key: 'tableName', label: '表名', type: 'input' },
]

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
          {
            size: 'small',
            quaternary: true,
            type: 'primary',
            onClick: () => handleEdit(row),
          },
          () => '编辑',
        ),
        h(ConfirmButton, {
          title: '确定要删除该数据权限吗？',
          onConfirm: () => handleDelete(row.id),
        }),
      ]),
  },
]

// 加载数据
async function loadData() {
  loading.value = true
  try {
    const res = await permissionScopeApi.list({
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

// 加载权限列表
async function loadPermissions() {
  try {
    const res = await permissionApi.list({ pageSize: 1000 })
    permissions.value = res.data
  } catch (err: any) {
    console.error('加载权限失败', err)
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
  modalTitle.value = '新增数据权限'
  Object.assign(formData, {
    permissionId: 0,
    name: '',
    tableName: '',
    ssqlRule: '',
    description: '',
  })
  modalVisible.value = true
}

// 编辑
function handleEdit(row: PermissionScope) {
  editingId.value = row.id
  modalTitle.value = '编辑数据权限'
  Object.assign(formData, {
    permissionId: row.permissionId,
    name: row.name,
    tableName: row.tableName,
    ssqlRule: row.ssqlRule,
    description: row.description || '',
  })
  modalVisible.value = true
}

// 删除
async function handleDelete(id: number) {
  try {
    await permissionScopeApi.delete(id)
    message.success('删除成功')
    loadData()
  } catch (err: any) {
    message.error(err.message || '删除失败')
  }
}

// 保存
async function handleSave() {
  if (!formData.permissionId || !formData.name || !formData.tableName || !formData.ssqlRule) {
    message.warning('请填写必填项')
    return
  }

  modalLoading.value = true
  try {
    if (editingId.value) {
      await permissionScopeApi.update(editingId.value, formData as UpdatePermissionScopeRequest)
      message.success('更新成功')
    } else {
      await permissionScopeApi.create(formData as CreatePermissionScopeRequest)
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
  loadPermissions()
})
</script>

<template>
  <div class="page-permission-scopes">
    <PageTable
      title="数据权限管理"
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
        <NButton type="primary" @click="handleAdd">新增数据权限</NButton>
      </template>
    </PageTable>

    <FormModal
      v-model:show="modalVisible"
      :title="modalTitle"
      :loading="modalLoading"
      @confirm="handleSave"
    >
      <NForm label-placement="left" label-width="80">
        <NFormItem label="关联权限" required>
          <NSelect
            v-model:value="formData.permissionId"
            :options="permissions.map((p) => ({ label: `${p.name} (${p.code})`, value: p.id }))"
            placeholder="请选择关联权限"
            filterable
            :disabled="!!editingId"
          />
        </NFormItem>
        <NFormItem label="规则名称" required>
          <NInput v-model:value="formData.name" placeholder="请输入规则名称" />
        </NFormItem>
        <NFormItem label="表名" required>
          <NInput v-model:value="formData.tableName" placeholder="请输入表名" />
        </NFormItem>
        <NFormItem label="SSQL规则" required>
          <NInput
            v-model:value="formData.ssqlRule"
            type="textarea"
            placeholder="请输入SSQL过滤规则"
            :rows="4"
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
      </NForm>
    </FormModal>
  </div>
</template>

<style scoped>
.page-permission-scopes {
  height: 100%;
}
</style>
