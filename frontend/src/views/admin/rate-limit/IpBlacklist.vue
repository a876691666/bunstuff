<script setup lang="ts">
import { h } from 'vue'
import {
  NButton,
  NTag,
  NSpace,
  NSelect,
  useMessage,
  NForm,
  NFormItem,
  NInput,
  NDatePicker,
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { CrudTable, CrudSearch, CrudModal, CrudConfirm, type SearchField } from '@/components'
import { useTable, useModal } from '@/composables'
import { ipBlacklistApi } from '@/api'
import type { IpBlacklist, CreateIpBlacklistRequest, UpdateIpBlacklistRequest } from '@/types'
import { Op } from '@/utils/ssql'

defineOptions({ name: 'IpBlacklist' })

const message = useMessage()

// 搜索字段
const searchFields: SearchField[] = [
  { key: 'ip', label: 'IP地址', type: 'input' },
  {
    key: 'source',
    label: '来源',
    type: 'select',
    options: [
      { label: '手动', value: 'manual' },
      { label: '自动', value: 'auto' },
    ],
  },
  {
    key: 'status',
    label: '状态',
    type: 'select',
    options: [
      { label: '封禁中', value: 1 },
      { label: '已解封', value: 0 },
    ],
  },
]

// useTable
const table = useTable<IpBlacklist, { ip?: string; source?: string; status?: number }>({
  api: (params) => ipBlacklistApi.list(params),
  opMap: { ip: Op.Like },
})

// useModal
const modal = useModal<CreateIpBlacklistRequest & { id?: number }>({
  defaultData: {
    ip: '',
    reason: '',
    expireAt: null,
    status: 1,
    remark: '',
  },
  validate: (data) => {
    if (!data.ip) return '请输入IP地址'
    // 简单 IP 格式验证
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/
    if (!ipRegex.test(data.ip)) return 'IP地址格式不正确'
    return null
  },
  createApi: (data) => ipBlacklistApi.create(data),
  updateApi: (id, data) => ipBlacklistApi.update(id, data as UpdateIpBlacklistRequest),
  onSuccess: () => {
    message.success(modal.isEdit.value ? '更新成功' : '添加成功')
    table.reload()
  },
  onError: (err) => message.error(err.message || '操作失败'),
})

// 表格列
const columns: DataTableColumns<IpBlacklist> = [
  { title: 'ID', key: 'id', width: 60 },
  { title: 'IP地址', key: 'ip', width: 150 },
  { title: '封禁原因', key: 'reason', width: 200, ellipsis: { tooltip: true } },
  {
    title: '来源',
    key: 'source',
    width: 80,
    render: (row) =>
      h(
        NTag,
        { type: row.source === 'auto' ? 'warning' : 'info', size: 'small' },
        () => (row.source === 'auto' ? '自动' : '手动'),
      ),
  },
  {
    title: '触发次数',
    key: 'triggerCount',
    width: 90,
    render: (row) => (row.triggerCount > 0 ? `${row.triggerCount}次` : '-'),
  },
  {
    title: '过期时间',
    key: 'expireAt',
    width: 170,
    render: (row) => {
      if (!row.expireAt) return h(NTag, { type: 'error', size: 'small' }, () => '永久')
      const expireDate = new Date(row.expireAt)
      const isExpired = expireDate < new Date()
      return h(
        NTag,
        { type: isExpired ? 'default' : 'warning', size: 'small' },
        () => (isExpired ? '已过期' : expireDate.toLocaleString()),
      )
    },
  },
  {
    title: '状态',
    key: 'status',
    width: 80,
    render: (row) =>
      h(NTag, { type: row.status === 1 ? 'error' : 'default', size: 'small' }, () =>
        row.status === 1 ? '封禁中' : '已解封',
      ),
  },
  { title: '备注', key: 'remark', ellipsis: { tooltip: true } },
  {
    title: '创建时间',
    key: 'createdAt',
    width: 170,
    render: (row) => (row.createdAt ? new Date(row.createdAt).toLocaleString() : '-'),
  },
  {
    title: '操作',
    key: 'actions',
    width: 200,
    fixed: 'right',
    render: (row) =>
      h(NSpace, { size: 'small' }, () => [
        row.status === 1
          ? h(
              NButton,
              { size: 'small', quaternary: true, type: 'success', onClick: () => handleUnblock(row.id) },
              () => '解封',
            )
          : null,
        h(
          NButton,
          { size: 'small', quaternary: true, type: 'primary', onClick: () => handleEdit(row) },
          () => '编辑',
        ),
        h(CrudConfirm, { title: '确定要删除此记录吗？', onConfirm: () => handleDelete(row.id) }),
      ]),
  },
]

function handleEdit(row: IpBlacklist) {
  modal.edit(row.id, {
    ip: row.ip,
    reason: row.reason,
    expireAt: row.expireAt,
    status: row.status,
    remark: row.remark || '',
  })
}

async function handleDelete(id: number) {
  try {
    await ipBlacklistApi.delete(id)
    message.success('删除成功')
    table.reload()
  } catch (err: unknown) {
    message.error((err as Error).message || '删除失败')
  }
}

async function handleUnblock(id: number) {
  try {
    await ipBlacklistApi.unblock(id)
    message.success('解封成功')
    table.reload()
  } catch (err: unknown) {
    message.error((err as Error).message || '解封失败')
  }
}

async function handleReload() {
  try {
    await ipBlacklistApi.reload()
    message.success('缓存已重载')
  } catch (err: unknown) {
    message.error((err as Error).message || '重载失败')
  }
}

// 日期时间戳处理
function handleExpireChange(timestamp: number | null) {
  modal.formData.expireAt = timestamp ? new Date(timestamp).toISOString() : null
}
</script>

<template>
  <div class="page-ip-blacklist">
    <CrudTable
      title="IP黑名单管理"
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
        <NSpace>
          <NButton @click="handleReload">重载缓存</NButton>
          <NButton type="primary" @click="modal.open('手动封禁IP')">添加</NButton>
        </NSpace>
      </template>
    </CrudTable>

    <CrudModal
      v-model:show="modal.visible.value"
      :title="modal.title.value"
      :loading="modal.loading.value"
      @confirm="modal.save"
    >
      <NForm label-placement="left" label-width="90">
        <NFormItem label="IP地址" required>
          <NInput
            v-model:value="modal.formData.ip"
            placeholder="如：192.168.1.100"
            :disabled="modal.isEdit.value"
          />
        </NFormItem>
        <NFormItem label="封禁原因">
          <NInput v-model:value="modal.formData.reason" placeholder="请输入封禁原因" />
        </NFormItem>
        <NFormItem label="过期时间">
          <NDatePicker
            type="datetime"
            :value="modal.formData.expireAt ? new Date(modal.formData.expireAt).getTime() : null"
            clearable
            placeholder="留空表示永久封禁"
            style="width: 100%"
            @update:value="handleExpireChange"
          />
        </NFormItem>
        <NFormItem label="状态">
          <NSelect
            v-model:value="modal.formData.status"
            :options="[
              { label: '封禁中', value: 1 },
              { label: '已解封', value: 0 },
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
.page-ip-blacklist {
  height: 100%;
}
</style>
