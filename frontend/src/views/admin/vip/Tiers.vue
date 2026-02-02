<script setup lang="ts">
import { shallowRef, onMounted, h } from 'vue'
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
import { CrudTable, CrudSearch, CrudModal, CrudConfirm, type SearchField } from '@/components'
import { useTable, useModal } from '@/composables'
import { vipApi, roleApi } from '@/api'
import type { VipTier, CreateVipTierRequest, UpdateVipTierRequest, Role } from '@/types'
import { Op } from '@/utils/ssql'

defineOptions({ name: 'VipTiers' })

const message = useMessage()
const roles = shallowRef<Role[]>([])
const roleOptions = shallowRef<SelectOption[]>([])

// 搜索字段配置
const searchFields: SearchField[] = [
  { key: 'name', label: '等级名称', type: 'input' },
  { key: 'code', label: '等级编码', type: 'input' },
]

// 使用 useTable
const table = useTable<VipTier, { name?: string; code?: string }>({
  api: (params) => vipApi.listTiers(params),
  opMap: { name: Op.Like, code: Op.Like },
})

// 使用 useModal
const modal = useModal<CreateVipTierRequest & { id?: number }>({
  defaultData: {
    name: '',
    code: '',
    roleId: null,
    price: 0,
    durationDays: 30,
    description: '',
    status: 1,
  },
  validate: (data) => {
    if (!data.name) return '请输入等级名称'
    if (!data.code) return '请输入等级编码'
    return null
  },
  createApi: (data) => vipApi.createTier(data),
  updateApi: (id, data) => vipApi.updateTier(id, data as UpdateVipTierRequest),
  onSuccess: () => {
    message.success(modal.isEdit.value ? '更新成功' : '创建成功')
    table.reload()
  },
  onError: (err) => message.error(err.message || '操作失败'),
})

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
          { size: 'small', quaternary: true, type: 'primary', onClick: () => handleEdit(row) },
          () => '编辑',
        ),
        h(CrudConfirm, {
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
  } catch (err: unknown) {
    console.error('加载角色失败', err)
  }
}

function handleEdit(row: VipTier) {
  modal.edit(row.id, {
    name: row.name,
    code: row.code,
    roleId: row.roleId,
    price: row.price,
    durationDays: row.durationDays,
    description: row.description || '',
    status: row.status,
  })
}

async function handleDelete(id: number) {
  try {
    await vipApi.deleteTier(id)
    message.success('删除成功')
    table.reload()
  } catch (err: unknown) {
    message.error((err as Error).message || '删除失败')
  }
}

onMounted(() => {
  loadRoles()
})
</script>

<template>
  <div class="page-vip-tiers">
    <CrudTable
      title="VIP等级管理"
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
        <NButton type="primary" @click="modal.open('新增VIP等级')">新增VIP等级</NButton>
      </template>
    </CrudTable>

    <CrudModal
      v-model:show="modal.visible.value"
      :title="modal.title.value"
      :loading="modal.loading.value"
      @confirm="modal.save"
    >
      <NForm label-placement="left" label-width="80">
        <NFormItem label="等级名称" required>
          <NInput v-model:value="modal.formData.name" placeholder="请输入等级名称，如：白银会员" />
        </NFormItem>
        <NFormItem label="等级编码" required>
          <NInput v-model:value="modal.formData.code" placeholder="请输入等级编码，如：silver" />
        </NFormItem>
        <NFormItem label="绑定角色">
          <NSelect
            v-model:value="modal.formData.roleId"
            :options="roleOptions"
            placeholder="请选择绑定角色（可选）"
            clearable
            filterable
            style="width: 100%"
          />
        </NFormItem>
        <NFormItem label="价格">
          <NInputNumber
            v-model:value="modal.formData.price"
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
            v-model:value="modal.formData.durationDays"
            :min="0"
            placeholder="0表示永久，否则为天数"
            style="width: 100%"
          >
            <template #suffix>天</template>
          </NInputNumber>
        </NFormItem>
        <NFormItem label="描述">
          <NInput
            v-model:value="modal.formData.description"
            type="textarea"
            placeholder="请输入描述"
            :rows="3"
          />
        </NFormItem>
        <NFormItem label="是否启用">
          <NSwitch v-model:value="modal.formData.status" :checked-value="1" :unchecked-value="0" />
        </NFormItem>
      </NForm>
    </CrudModal>
  </div>
</template>

<style scoped>
.page-vip-tiers {
  height: 100%;
}
</style>
