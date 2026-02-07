<script setup lang="ts">
import { h, ref, onMounted } from 'vue'
import { NButton, NTag, NSpace, useMessage, NForm, NFormItem, NInput, NSelect } from 'naive-ui'
import type { DataTableColumns, SelectOption } from 'naive-ui'
import { CronNaive } from '@vue-js-cron/naive-ui'
import '@vue-js-cron/naive-ui/dist/naive-ui.css'
import { CrudTable, CrudSearch, CrudModal, CrudConfirm, type SearchField } from '@/components'
import { useTable, useModal } from '@/composables'
import { jobApi } from '@/api'
import type { Job, CreateJobRequest, UpdateJobRequest } from '@/types'
import { Op } from '@/utils/ssql'

defineOptions({ name: 'JobManagement' })

const message = useMessage()
const handlers = ref<SelectOption[]>([])

// 加载handlers
onMounted(async () => {
  try {
    const res = await jobApi.getHandlers()
    handlers.value = res.map((h: string) => ({ label: h, value: h }))
  } catch (e) {
    console.error(e)
  }
})

// 搜索字段
const searchFields: SearchField[] = [
  { key: 'name', label: '任务名称', type: 'input' },
  { key: 'group', label: '任务分组', type: 'input' },
  { key: 'handler', label: '处理器', type: 'input' },
  {
    key: 'status',
    label: '状态',
    type: 'select',
    options: [
      { label: '运行', value: 1 },
      { label: '暂停', value: 0 },
    ],
  },
]

// useTable
const table = useTable<Job, { name?: string; group?: string; handler?: string; status?: number }>({
  api: (params) => jobApi.list(params),
  opMap: { name: Op.Like, group: Op.Like, handler: Op.Like },
})

// useModal
const modal = useModal<CreateJobRequest & { id?: number }>({
  defaultData: {
    name: '',
    group: 'default',
    handler: '',
    cron: '',
    params: '',
    status: 1,
    remark: '',
  },
  validate: (data) => {
    if (!data.name) return '请输入任务名称'
    if (!data.handler) return '请选择处理器'
    if (!data.cron) return '请输入Cron表达式'
    return null
  },
  createApi: (data) => jobApi.create(data),
  updateApi: (id, data) => jobApi.update(id, data as UpdateJobRequest),
  onSuccess: () => {
    message.success(modal.isEdit.value ? '更新成功' : '创建成功')
    table.reload()
  },
  onError: (err) => message.error(err.message || '操作失败'),
})

// 表格列
const columns: DataTableColumns<Job> = [
  { title: 'ID', key: 'id', width: 60 },
  { title: '任务名称', key: 'name', width: 150 },
  { title: '分组', key: 'group', width: 100 },
  { title: '处理器', key: 'handler', width: 180, ellipsis: { tooltip: true } },
  { title: 'Cron', key: 'cron', width: 120 },
  {
    title: '状态',
    key: 'status',
    width: 80,
    render: (row) =>
      h(NTag, { type: row.status === 1 ? 'success' : 'warning', size: 'small' }, () =>
        row.status === 1 ? '运行' : '暂停',
      ),
  },
  { title: '备注', key: 'remark', ellipsis: { tooltip: true } },
  {
    title: '操作',
    key: 'actions',
    width: 220,
    fixed: 'right',
    render: (row) =>
      h(NSpace, { size: 'small' }, () => [
        h(
          NButton,
          { size: 'small', quaternary: true, type: 'info', onClick: () => handleRun(row.id) },
          () => '执行',
        ),
        h(
          NButton,
          {
            size: 'small',
            quaternary: true,
            type: row.status === 1 ? 'warning' : 'success',
            onClick: () => handleToggle(row),
          },
          () => (row.status === 1 ? '暂停' : '启用'),
        ),
        h(
          NButton,
          { size: 'small', quaternary: true, type: 'primary', onClick: () => handleEdit(row) },
          () => '编辑',
        ),
        h(CrudConfirm, { title: '确定要删除吗？', onConfirm: () => handleDelete(row.id) }),
      ]),
  },
]

function handleEdit(row: Job) {
  modal.edit(row.id, {
    name: row.name,
    group: row.group,
    handler: row.handler,
    cron: row.cron,
    params: row.params || '',
    status: row.status,
    remark: row.remark || '',
  })
}

async function handleDelete(id: number) {
  try {
    await jobApi.delete(id)
    message.success('删除成功')
    table.reload()
  } catch (err: unknown) {
    message.error((err as Error).message || '删除失败')
  }
}

async function handleRun(id: number) {
  try {
    await jobApi.run(id)
    message.success('执行成功')
  } catch (err: unknown) {
    message.error((err as Error).message || '执行失败')
  }
}

async function handleToggle(row: Job) {
  try {
    if (row.status === 1) {
      await jobApi.disable(row.id)
      message.success('已暂停')
    } else {
      await jobApi.enable(row.id)
      message.success('已启用')
    }
    table.reload()
  } catch (err: unknown) {
    message.error((err as Error).message || '操作失败')
  }
}
</script>

<template>
  <div class="page-jobs">
    <CrudTable
      title="定时任务管理"
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
        <NButton type="primary" @click="modal.open('新增任务')">新增</NButton>
      </template>
    </CrudTable>

    <CrudModal
      v-model:show="modal.visible.value"
      :title="modal.title.value"
      :loading="modal.loading.value"
      @confirm="modal.save"
    >
      <NForm label-placement="left" label-width="80">
        <NFormItem label="任务名称" required>
          <NInput v-model:value="modal.formData.name" placeholder="请输入任务名称" />
        </NFormItem>
        <NFormItem label="任务分组">
          <NInput v-model:value="modal.formData.group" placeholder="请输入分组" />
        </NFormItem>
        <NFormItem label="处理器" required>
          <NSelect
            v-model:value="modal.formData.handler"
            :options="handlers"
            placeholder="请选择处理器"
            filterable
            :disabled="modal.isEdit.value"
          />
        </NFormItem>
        <NFormItem label="Cron" required>
          <CronNaive v-model="modal.formData.cron" locale="zh-cn" />
        </NFormItem>
        <NFormItem label="参数(JSON)">
          <NInput
            v-model:value="modal.formData.params"
            type="textarea"
            placeholder='如: {"days": 30}'
          />
        </NFormItem>
        <NFormItem label="状态">
          <NSelect
            v-model:value="modal.formData.status"
            :options="[
              { label: '运行', value: 1 },
              { label: '暂停', value: 0 },
            ]"
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
.page-jobs {
  height: 100%;
}
</style>
