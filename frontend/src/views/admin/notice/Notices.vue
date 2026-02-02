<script setup lang="ts">
import { h, shallowRef, onMounted } from 'vue'
import { NButton, NTag, NSpace, useMessage, NForm, NFormItem, NInput, NSelect } from 'naive-ui'
import type { DataTableColumns, SelectOption } from 'naive-ui'
import { CrudTable, CrudSearch, CrudModal, CrudConfirm, type SearchField } from '@/components'
import { useTable, useModal } from '@/composables'
import { noticeApi, dictClientApi } from '@/api'
import type { Notice, CreateNoticeRequest, UpdateNoticeRequest } from '@/types'
import { Op } from '@/utils/ssql'

defineOptions({ name: 'NoticeList' })

const message = useMessage()

// 公告类型选项
const typeOptions = shallowRef<SelectOption[]>([])

async function loadTypeOptions() {
  try {
    const data = await dictClientApi.getByType('sys_notice_type')
    typeOptions.value = data.map((d) => ({ label: d.label, value: d.value }))
  } catch {
    // 默认选项
    typeOptions.value = [
      { label: '通知', value: '1' },
      { label: '公告', value: '2' },
    ]
  }
}

// 搜索字段配置
const searchFields = shallowRef<SearchField[]>([
  { key: 'title', label: '标题', type: 'input' },
  { key: 'type', label: '类型', type: 'select', options: [] },
  {
    key: 'status',
    label: '状态',
    type: 'select',
    options: [
      { label: '正常', value: 1 },
      { label: '关闭', value: 0 },
    ],
  },
])

// 使用 useTable
const table = useTable<Notice, { title?: string; type?: string; status?: number }>({
  api: (params) => noticeApi.list(params),
  opMap: { title: Op.Like },
  immediate: false,
})

// 使用 useModal
const modal = useModal<CreateNoticeRequest & { id?: number }>({
  defaultData: {
    title: '',
    content: '',
    type: '1',
    status: 1,
    remark: '',
  },
  validate: (data) => {
    if (!data.title) return '请输入公告标题'
    if (!data.content) return '请输入公告内容'
    return null
  },
  createApi: (data) => noticeApi.create(data),
  updateApi: (id, data) => noticeApi.update(id, data as UpdateNoticeRequest),
  onSuccess: () => {
    message.success(modal.isEdit.value ? '更新成功' : '创建成功')
    table.reload()
  },
  onError: (err) => message.error(err.message || '操作失败'),
})

// 获取类型标签
function getTypeLabel(type: string) {
  return typeOptions.value.find((o) => o.value === type)?.label || type
}

// 表格列定义
const columns: DataTableColumns<Notice> = [
  { title: 'ID', key: 'id', width: 80 },
  { title: '公告标题', key: 'title', width: 200, ellipsis: { tooltip: true } },
  {
    title: '公告类型',
    key: 'type',
    width: 100,
    render: (row) => h(NTag, { size: 'small' }, () => getTypeLabel(row.type)),
  },
  {
    title: '状态',
    key: 'status',
    width: 80,
    render: (row) =>
      h(NTag, { type: row.status === 1 ? 'success' : 'error', size: 'small' }, () =>
        row.status === 1 ? '正常' : '关闭',
      ),
  },
  { title: '备注', key: 'remark', ellipsis: { tooltip: true } },
  {
    title: '创建时间',
    key: 'createdAt',
    width: 180,
    render: (row) => (row.createdAt ? new Date(row.createdAt).toLocaleString() : '-'),
  },
  {
    title: '操作',
    key: 'actions',
    width: 200,
    fixed: 'right',
    render: (row) =>
      h(NSpace, { size: 'small' }, () => [
        h(
          NButton,
          { size: 'small', quaternary: true, type: 'primary', onClick: () => handleEdit(row) },
          () => '编辑',
        ),
        row.status === 0
          ? h(
              NButton,
              {
                size: 'small',
                quaternary: true,
                type: 'success',
                onClick: () => handlePublish(row.id),
              },
              () => '发布',
            )
          : h(
              NButton,
              {
                size: 'small',
                quaternary: true,
                type: 'warning',
                onClick: () => handleUnpublish(row.id),
              },
              () => '下架',
            ),
        h(CrudConfirm, {
          title: '确定要删除该公告吗？',
          onConfirm: () => handleDelete(row.id),
        }),
      ]),
  },
]

function handleEdit(row: Notice) {
  modal.edit(row.id, {
    title: row.title,
    content: row.content,
    type: row.type,
    status: row.status,
    remark: row.remark || '',
  })
}

async function handleDelete(id: number) {
  try {
    await noticeApi.delete(id)
    message.success('删除成功')
    table.reload()
  } catch (err: unknown) {
    message.error((err as Error).message || '删除失败')
  }
}

async function handlePublish(id: number) {
  try {
    await noticeApi.publish(id)
    message.success('发布成功')
    table.reload()
  } catch (err: unknown) {
    message.error((err as Error).message || '发布失败')
  }
}

async function handleUnpublish(id: number) {
  try {
    await noticeApi.unpublish(id)
    message.success('下架成功')
    table.reload()
  } catch (err: unknown) {
    message.error((err as Error).message || '下架失败')
  }
}

onMounted(async () => {
  await loadTypeOptions()
  if (searchFields.value[1]) {
    searchFields.value[1].options = typeOptions.value
  }
  table.load()
})
</script>

<template>
  <div class="page-notices">
    <CrudTable
      title="通知公告管理"
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
        <NButton type="primary" @click="modal.open('新增公告')">新增</NButton>
      </template>
    </CrudTable>

    <CrudModal
      v-model:show="modal.visible.value"
      :title="modal.title.value"
      :loading="modal.loading.value"
      :width="700"
      @confirm="modal.save"
    >
      <NForm label-placement="left" label-width="80">
        <NFormItem label="公告标题" required>
          <NInput v-model:value="modal.formData.title" placeholder="请输入公告标题" />
        </NFormItem>
        <NFormItem label="公告类型">
          <NSelect
            v-model:value="modal.formData.type"
            :options="typeOptions"
            placeholder="请选择公告类型"
          />
        </NFormItem>
        <NFormItem label="状态">
          <NSelect
            v-model:value="modal.formData.status"
            :options="[
              { label: '正常', value: 1 },
              { label: '关闭', value: 0 },
            ]"
          />
        </NFormItem>
        <NFormItem label="公告内容" required>
          <NInput
            v-model:value="modal.formData.content"
            type="textarea"
            placeholder="请输入公告内容"
            :rows="6"
          />
        </NFormItem>
        <NFormItem label="备注">
          <NInput v-model:value="modal.formData.remark" type="textarea" placeholder="请输入备注" />
        </NFormItem>
      </NForm>
    </CrudModal>
  </div>
</template>

<style scoped>
.page-notices {
  height: 100%;
}
</style>
