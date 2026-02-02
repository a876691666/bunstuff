<script setup lang="ts">
import { h, shallowRef, onMounted } from 'vue'
import {
  NButton,
  NTag,
  NSpace,
  useMessage,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NInputNumber,
} from 'naive-ui'
import type { DataTableColumns, SelectOption } from 'naive-ui'
import { CrudTable, CrudSearch, CrudModal, CrudConfirm, type SearchField } from '@/components'
import { useTable, useModal } from '@/composables'
import { dictApi } from '@/api'
import type { DictData, DictType, CreateDictDataRequest, UpdateDictDataRequest } from '@/types'
import { Op } from '@/utils/ssql'

defineOptions({ name: 'SystemDictData' })

const message = useMessage()

// 字典类型列表
const dictTypes = shallowRef<DictType[]>([])
const dictTypeOptions = shallowRef<SelectOption[]>([])

async function loadDictTypes() {
  try {
    const res = await dictApi.listTypes({ pageSize: 1000 })
    dictTypes.value = res.data
    dictTypeOptions.value = res.data.map((t) => ({ label: `${t.name} (${t.type})`, value: t.type }))
  } catch (err: unknown) {
    console.error('加载字典类型失败', err)
  }
}

// 搜索字段配置
const searchFields = shallowRef<SearchField[]>([
  { key: 'dictType', label: '字典类型', type: 'select', options: [] },
  { key: 'label', label: '字典标签', type: 'input' },
  {
    key: 'status',
    label: '状态',
    type: 'select',
    options: [
      { label: '正常', value: 1 },
      { label: '禁用', value: 0 },
    ],
  },
])

// 使用 useTable
const table = useTable<DictData, { dictType?: string; label?: string; status?: number }>({
  api: (params) => dictApi.listData(params),
  opMap: { label: Op.Like },
  immediate: false,
})

// 使用 useModal
const modal = useModal<CreateDictDataRequest & { id?: number }>({
  defaultData: {
    dictType: '',
    label: '',
    value: '',
    cssClass: '',
    listClass: '',
    sort: 0,
    status: 1,
    isDefault: 0,
    remark: '',
  },
  validate: (data) => {
    if (!data.dictType) return '请选择字典类型'
    if (!data.label) return '请输入字典标签'
    if (!data.value) return '请输入字典键值'
    return null
  },
  createApi: (data) => dictApi.createData(data),
  updateApi: (id, data) => dictApi.updateData(id, data as UpdateDictDataRequest),
  onSuccess: () => {
    message.success(modal.isEdit.value ? '更新成功' : '创建成功')
    table.reload()
  },
  onError: (err) => message.error(err.message || '操作失败'),
})

// 表格列定义
const columns: DataTableColumns<DictData> = [
  { title: 'ID', key: 'id', width: 80 },
  { title: '字典类型', key: 'dictType', width: 120 },
  { title: '字典标签', key: 'label', width: 120 },
  { title: '字典键值', key: 'value', width: 100 },
  { title: '排序', key: 'sort', width: 80 },
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
    title: '默认',
    key: 'isDefault',
    width: 80,
    render: (row) =>
      h(NTag, { type: row.isDefault === 1 ? 'info' : 'default', size: 'small' }, () =>
        row.isDefault === 1 ? '是' : '否',
      ),
  },
  { title: '备注', key: 'remark', ellipsis: { tooltip: true } },
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
          title: '确定要删除该字典数据吗？',
          onConfirm: () => handleDelete(row.id),
        }),
      ]),
  },
]

function handleEdit(row: DictData) {
  modal.edit(row.id, {
    dictType: row.dictType,
    label: row.label,
    value: row.value,
    cssClass: row.cssClass || '',
    listClass: row.listClass || '',
    sort: row.sort,
    status: row.status,
    isDefault: row.isDefault,
    remark: row.remark || '',
  })
}

async function handleDelete(id: number) {
  try {
    await dictApi.deleteData(id)
    message.success('删除成功')
    table.reload()
  } catch (err: unknown) {
    message.error((err as Error).message || '删除失败')
  }
}

onMounted(async () => {
  await loadDictTypes()
  if (searchFields.value[0]) {
    searchFields.value[0].options = dictTypeOptions.value
  }
  table.load()
})
</script>

<template>
  <div class="page-dict-data">
    <CrudTable
      title="字典数据管理"
      :columns="columns"
      :data="table.data.value"
      :loading="table.loading.value"
      :page="table.page.value"
      :page-size="table.pageSize.value"
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
        <NButton type="primary" @click="modal.open('新增字典数据')">新增</NButton>
      </template>
    </CrudTable>

    <CrudModal
      v-model:show="modal.visible.value"
      :title="modal.title.value"
      :loading="modal.loading.value"
      @confirm="modal.save"
    >
      <NForm label-placement="left" label-width="80">
        <NFormItem label="字典类型" required>
          <NSelect
            v-model:value="modal.formData.dictType"
            :options="dictTypeOptions"
            placeholder="请选择字典类型"
            :disabled="modal.isEdit.value"
          />
        </NFormItem>
        <NFormItem label="字典标签" required>
          <NInput v-model:value="modal.formData.label" placeholder="请输入字典标签" />
        </NFormItem>
        <NFormItem label="字典键值" required>
          <NInput v-model:value="modal.formData.value" placeholder="请输入字典键值" />
        </NFormItem>
        <NFormItem label="排序">
          <NInputNumber v-model:value="modal.formData.sort" :min="0" placeholder="请输入排序" />
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
        <NFormItem label="是否默认">
          <NSelect
            v-model:value="modal.formData.isDefault"
            :options="[
              { label: '是', value: 1 },
              { label: '否', value: 0 },
            ]"
          />
        </NFormItem>
        <NFormItem label="CSS 类">
          <NInput v-model:value="modal.formData.cssClass" placeholder="请输入CSS类名" />
        </NFormItem>
        <NFormItem label="备注">
          <NInput v-model:value="modal.formData.remark" type="textarea" placeholder="请输入备注" />
        </NFormItem>
      </NForm>
    </CrudModal>
  </div>
</template>

<style scoped>
.page-dict-data {
  height: 100%;
}
</style>
