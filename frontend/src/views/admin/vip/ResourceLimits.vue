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
  NSelect,
  NTag,
} from 'naive-ui'
import type { DataTableColumns, SelectOption } from 'naive-ui'
import { CrudTable, CrudSearch, CrudModal, CrudConfirm, type SearchField } from '@/components'
import { useModal } from '@/composables'
import { vipApi } from '@/api'
import type {
  VipResourceLimit,
  VipTier,
  CreateVipResourceLimitRequest,
  UpdateVipResourceLimitRequest,
} from '@/types'

defineOptions({ name: 'VipResourceLimits' })

const message = useMessage()

// 数据状态
const loading = shallowRef(false)
const data = shallowRef<VipResourceLimit[]>([])
const total = shallowRef(0)
const page = shallowRef(1)
const pageSize = shallowRef(10)
const tiers = shallowRef<VipTier[]>([])
const searchParams = shallowRef<Record<string, any>>({})

// 使用 useModal
const modal = useModal<CreateVipResourceLimitRequest & { id?: number }>({
  defaultData: {
    vipTierId: 0,
    resourceKey: '',
    limitValue: 0,
    description: '',
  },
  validate: (data) => {
    if (!data.vipTierId) return '请选择VIP等级'
    if (!data.resourceKey) return '请输入资源键'
    return null
  },
  createApi: (data) => vipApi.createResourceLimit(data),
  updateApi: (id, data) => vipApi.updateResourceLimit(id, data as UpdateVipResourceLimitRequest),
  onSuccess: () => {
    message.success(modal.isEdit.value ? '更新成功' : '创建成功')
    loadData()
  },
  onError: (err) => message.error(err.message || '操作失败'),
})

// 搜索字段配置
const searchFields: SearchField[] = [{ key: 'resourceKey', label: '资源键', type: 'input' }]

// 表格列定义
const columns: DataTableColumns<VipResourceLimit> = [
  { title: 'ID', key: 'id', width: 80 },
  {
    title: 'VIP等级',
    key: 'vipTierId',
    width: 120,
    render: (row) => {
      const tier = tiers.value.find((t) => t.id === row.vipTierId)
      return tier?.name || String(row.vipTierId)
    },
  },
  { title: '资源键', key: 'resourceKey', width: 150 },
  {
    title: '限制值',
    key: 'limitValue',
    width: 100,
    render: (row) =>
      row.limitValue === -1 ? h(NTag, { type: 'success' }, () => '无限') : row.limitValue,
  },
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
          title: '确定要删除该资源限制吗？',
          onConfirm: () => handleDelete(row.id),
        }),
      ]),
  },
]

// 加载数据
async function loadData() {
  loading.value = true
  try {
    if (searchParams.value.vipTierId) {
      const res = await vipApi.getResourceLimits(searchParams.value.vipTierId)
      data.value = res
      total.value = res.length
    } else {
      const allLimits: VipResourceLimit[] = []
      for (const tier of tiers.value) {
        try {
          const limits = await vipApi.getResourceLimits(tier.id)
          allLimits.push(...limits)
        } catch {
          // 忽略单个等级的错误
        }
      }
      data.value = allLimits
      total.value = allLimits.length
    }
  } catch (err: unknown) {
    message.error((err as Error).message || '加载失败')
  } finally {
    loading.value = false
  }
}

// 加载VIP等级列表
async function loadTiers() {
  try {
    const res = await vipApi.listTiers({ pageSize: 100 })
    tiers.value = res.data
  } catch (err: unknown) {
    console.error('加载VIP等级失败', err)
  }
}

function handleSearch() {
  page.value = 1
  loadData()
}

function handleReset() {
  page.value = 1
  loadData()
}

function handleEdit(row: VipResourceLimit) {
  modal.edit(row.id, {
    vipTierId: row.vipTierId,
    resourceKey: row.resourceKey,
    limitValue: row.limitValue,
    description: row.description || '',
  })
}

async function handleDelete(id: number) {
  try {
    await vipApi.deleteResourceLimit(id)
    message.success('删除成功')
    loadData()
  } catch (err: unknown) {
    message.error((err as Error).message || '删除失败')
  }
}

function handlePageChange(p: number) {
  page.value = p
  loadData()
}

function handlePageSizeChange(ps: number) {
  pageSize.value = ps
  page.value = 1
  loadData()
}

function getTierOptions(): SelectOption[] {
  return tiers.value.map((t) => ({ label: t.name, value: t.id }))
}

onMounted(async () => {
  await loadTiers()
  loadData()
})
</script>

<template>
  <div class="page-resource-limits">
    <CrudTable
      title="资源限制管理"
      :columns="columns"
      :data="data"
      :loading="loading"
      :page="page"
      :page-size="pageSize"
      :total="total"
      @update:page="handlePageChange"
      @update:page-size="handlePageSizeChange"
    >
      <template #toolbar>
        <CrudSearch
          v-model="searchParams"
          :fields="searchFields"
          :loading="loading"
          @search="handleSearch"
          @reset="handleReset"
        />
      </template>

      <template #header-extra>
        <NButton type="primary" @click="modal.open('新增资源限制')">新增资源限制</NButton>
      </template>
    </CrudTable>

    <CrudModal
      v-model:show="modal.visible.value"
      :title="modal.title.value"
      :loading="modal.loading.value"
      @confirm="modal.save"
    >
      <NForm label-placement="left" label-width="80">
        <NFormItem label="VIP等级" required>
          <NSelect
            v-model:value="modal.formData.vipTierId"
            :options="getTierOptions()"
            placeholder="请选择VIP等级"
          />
        </NFormItem>
        <NFormItem label="资源键" required>
          <NInput
            v-model:value="modal.formData.resourceKey"
            placeholder="请输入资源键，如：scene:create"
          />
        </NFormItem>
        <NFormItem label="限制值">
          <NInputNumber
            v-model:value="modal.formData.limitValue"
            :min="-1"
            placeholder="-1表示无限制"
            style="width: 100%"
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
.page-resource-limits {
  height: 100%;
}
</style>
