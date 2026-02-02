<script setup lang="ts">
import { shallowRef, onMounted, h, reactive } from 'vue'
import {
  NButton,
  NSpace,
  useMessage,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NTag,
  NSwitch,
  NSelect,
} from 'naive-ui'
import type { DataTableColumns, SelectOption } from 'naive-ui'
import { PageTable, FormModal, SearchForm, ConfirmButton } from '@/components'
import type { SearchFieldConfig } from '@/components'
import { vipApi, roleApi } from '@/api'
import type { VipTier, CreateVipTierRequest, UpdateVipTierRequest, Role } from '@/types'

const message = useMessage()

// 数据状态
const loading = shallowRef(false)
const data = shallowRef<VipTier[]>([])
const total = shallowRef(0)
const page = shallowRef(1)
const pageSize = shallowRef(10)
const roles = shallowRef<Role[]>([])
const roleOptions = shallowRef<SelectOption[]>([])

// 搜索条件
const searchParams = shallowRef<Record<string, any>>({})

// 弹窗状态
const modalVisible = shallowRef(false)
const modalLoading = shallowRef(false)
const modalTitle = shallowRef('新增VIP等级')
const editingId = shallowRef<number | null>(null)
const formData = reactive<CreateVipTierRequest & { id?: number }>({
  name: '',
  code: '',
  roleId: null,
  price: 0,
  durationDays: 30,
  description: '',
  status: 1,
})

// 搜索字段配置
const searchFields: SearchFieldConfig[] = [
  { key: 'name', label: '等级名称', type: 'input' },
  { key: 'code', label: '等级编码', type: 'input' },
]

// 表格列定义
const columns: DataTableColumns<VipTier> = [
  { title: 'ID', key: 'id', width: 80 },
  {
    title: '等级名称',
    key: 'name',
    width: 120,
    render: (row) => h(NTag, { type: 'info' }, () => row.name),
  },
  { title: '等级编码', key: 'code', width: 120 },
  {
    title: '绑定角色',
    key: 'roleId',
    width: 120,
    render: (row) => {
      const role = roles.value.find((r) => r.id === row.roleId)
      return role ? role.name : '-'
    },
  },
  {
    title: '价格',
    key: 'price',
    width: 100,
    render: (row) => `¥${row.price.toFixed(2)}`,
  },
  {
    title: '有效期',
    key: 'durationDays',
    width: 100,
    render: (row) => (row.durationDays === 0 ? '永久' : `${row.durationDays}天`),
  },
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
      h(NTag, { type: row.status === 1 ? 'success' : 'error' }, () =>
        row.status === 1 ? '启用' : '禁用',
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
          title: '确定要删除该VIP等级吗？',
          onConfirm: () => handleDelete(row.id),
        }),
      ]),
  },
]

// 加载角色列表
async function loadRoles() {
  try {
    const res = await roleApi.list({ pageSize: 1000 })
    roles.value = res.data
    roleOptions.value = res.data.map((r) => ({ label: r.name, value: r.id }))
  } catch (err: any) {
    console.error('加载角色失败', err)
  }
}

// 加载数据
async function loadData() {
  loading.value = true
  try {
    const res = await vipApi.listTiers({
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
  modalTitle.value = '新增VIP等级'
  Object.assign(formData, {
    name: '',
    code: '',
    roleId: null,
    price: 0,
    durationDays: 30,
    description: '',
    status: 1,
  })
  modalVisible.value = true
}

// 编辑
function handleEdit(row: VipTier) {
  editingId.value = row.id
  modalTitle.value = '编辑VIP等级'
  Object.assign(formData, {
    name: row.name,
    code: row.code,
    roleId: row.roleId,
    price: row.price,
    durationDays: row.durationDays,
    description: row.description || '',
    status: row.status,
  })
  modalVisible.value = true
}

// 删除
async function handleDelete(id: number) {
  try {
    await vipApi.deleteTier(id)
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
      await vipApi.updateTier(editingId.value, formData as UpdateVipTierRequest)
      message.success('更新成功')
    } else {
      await vipApi.createTier(formData as CreateVipTierRequest)
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
  loadRoles()
  loadData()
})
</script>

<template>
  <div class="page-vip-tiers">
    <PageTable
      title="VIP等级管理"
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
        <NButton type="primary" @click="handleAdd">新增VIP等级</NButton>
      </template>
    </PageTable>

    <FormModal
      v-model:show="modalVisible"
      :title="modalTitle"
      :loading="modalLoading"
      @confirm="handleSave"
    >
      <NForm label-placement="left" label-width="80">
        <NFormItem label="等级名称" required>
          <NInput v-model:value="formData.name" placeholder="请输入等级名称，如：白银会员" />
        </NFormItem>
        <NFormItem label="等级编码" required>
          <NInput v-model:value="formData.code" placeholder="请输入等级编码，如：silver" />
        </NFormItem>
        <NFormItem label="绑定角色">
          <NSelect
            v-model:value="formData.roleId"
            :options="roleOptions"
            placeholder="请选择绑定角色（可选）"
            clearable
            filterable
            style="width: 100%"
          />
        </NFormItem>
        <NFormItem label="价格">
          <NInputNumber
            v-model:value="formData.price"
            :min="0"
            :precision="2"
            placeholder="请输入价格"
            style="width: 100%"
          >
            <template #prefix>¥</template>
          </NInputNumber>
        </NFormItem>
        <NFormItem label="有效期">
          <NInputNumber
            v-model:value="formData.durationDays"
            :min="0"
            placeholder="0表示永久，否则为天数"
            style="width: 100%"
          >
            <template #suffix>天</template>
          </NInputNumber>
        </NFormItem>
        <NFormItem label="描述">
          <NInput
            v-model:value="formData.description"
            type="textarea"
            placeholder="请输入描述"
            :rows="3"
          />
        </NFormItem>
        <NFormItem label="是否启用">
          <NSwitch v-model:value="formData.status" :checked-value="1" :unchecked-value="0" />
        </NFormItem>
      </NForm>
    </FormModal>
  </div>
</template>

<style scoped>
.page-vip-tiers {
  height: 100%;
}
</style>
