<script setup lang="ts">
import { shallowRef, onMounted, h, reactive } from 'vue'
import { NButton, NSpace, useMessage, NForm, NFormItem, NInput, NInputNumber, NSelect, NTag } from 'naive-ui'
import type { DataTableColumns, SelectOption } from 'naive-ui'
import { PageTable, FormModal, SearchForm, ConfirmButton } from '@/components'
import type { SearchFieldConfig } from '@/components'
import { vipApi } from '@/api'
import type { VipResourceLimit, VipTier, CreateVipResourceLimitRequest, UpdateVipResourceLimitRequest } from '@/types'

const message = useMessage()

// 数据状态
const loading = shallowRef(false)
const data = shallowRef<VipResourceLimit[]>([])
const total = shallowRef(0)
const page = shallowRef(1)
const pageSize = shallowRef(10)
const tiers = shallowRef<VipTier[]>([])

// 搜索条件
const searchParams = shallowRef<Record<string, any>>({})

// 弹窗状态
const modalVisible = shallowRef(false)
const modalLoading = shallowRef(false)
const modalTitle = shallowRef('新增资源限制')
const editingId = shallowRef<number | null>(null)
const formData = reactive<CreateVipResourceLimitRequest & { id?: number }>({
  vipTierId: 0,
  resourceKey: '',
  limitValue: 0,
  description: '',
})

// 搜索字段配置
const searchFields: SearchFieldConfig[] = [
  { key: 'resourceKey', label: '资源键', type: 'input' },
]

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
    render: (row) => (row.limitValue === -1 ? h(NTag, { type: 'success' }, () => '无限') : row.limitValue),
  },
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
          title: '确定要删除该资源限制吗？',
          onConfirm: () => handleDelete(row.id),
        }),
      ]),
  },
]

// 加载数据
// TODO: 后端需要添加分页获取所有资源限制的接口
// 目前只能按 vipTierId 获取，没有全局列表接口
async function loadData() {
  loading.value = true
  try {
    // 如果有选中的 vipTierId，则获取该等级的资源限制
    if (searchParams.value.vipTierId) {
      const res = await vipApi.getResourceLimits(searchParams.value.vipTierId)
      data.value = res
      total.value = res.length
    } else {
      // 没有 vipTierId 时，需要遍历所有等级获取资源限制
      // 或者等待后端添加全局列表接口
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
  } catch (err: any) {
    message.error(err.message || '加载失败')
  } finally {
    loading.value = false
  }
}

// 加载VIP等级列表
async function loadTiers() {
  try {
    const res = await vipApi.listTiers({ pageSize: 100 })
    tiers.value = res.data
  } catch (err: any) {
    console.error('加载VIP等级失败', err)
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
  modalTitle.value = '新增资源限制'
  Object.assign(formData, {
    vipTierId: 0,
    resourceKey: '',
    limitValue: 0,
    description: '',
  })
  modalVisible.value = true
}

// 编辑
function handleEdit(row: VipResourceLimit) {
  editingId.value = row.id
  modalTitle.value = '编辑资源限制'
  Object.assign(formData, {
    vipTierId: row.vipTierId,
    resourceKey: row.resourceKey,
    limitValue: row.limitValue,
    description: row.description || '',
  })
  modalVisible.value = true
}

// 删除
async function handleDelete(id: number) {
  try {
    await vipApi.deleteResourceLimit(id)
    message.success('删除成功')
    loadData()
  } catch (err: any) {
    message.error(err.message || '删除失败')
  }
}

// 保存
async function handleSave() {
  if (!formData.vipTierId || !formData.resourceKey) {
    message.warning('请填写必填项')
    return
  }

  modalLoading.value = true
  try {
    if (editingId.value) {
      await vipApi.updateResourceLimit(editingId.value, formData as UpdateVipResourceLimitRequest)
      message.success('更新成功')
    } else {
      await vipApi.createResourceLimit(formData as CreateVipResourceLimitRequest)
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

// VIP等级选项
function getTierOptions(): SelectOption[] {
  return tiers.value.map((t) => ({
    label: t.name,
    value: t.id,
  }))
}

onMounted(async () => {
  await loadTiers()
  loadData()
})
</script>

<template>
  <div class="page-resource-limits">
    <PageTable
      title="资源限制管理"
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
        <NButton type="primary" @click="handleAdd">新增资源限制</NButton>
      </template>
    </PageTable>

    <FormModal
      v-model:show="modalVisible"
      :title="modalTitle"
      :loading="modalLoading"
      @confirm="handleSave"
    >
      <NForm label-placement="left" label-width="80">
        <NFormItem label="VIP等级" required>
          <NSelect
            v-model:value="formData.vipTierId"
            :options="getTierOptions()"
            placeholder="请选择VIP等级"
          />
        </NFormItem>
        <NFormItem label="资源键" required>
          <NInput v-model:value="formData.resourceKey" placeholder="请输入资源键，如：scene:create" />
        </NFormItem>
        <NFormItem label="限制值">
          <NInputNumber
            v-model:value="formData.limitValue"
            :min="-1"
            placeholder="-1表示无限制"
            style="width: 100%"
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
.page-resource-limits {
  height: 100%;
}
</style>
