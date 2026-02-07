<script setup lang="ts">
import { h } from 'vue'
import {
  NButton,
  NTag,
  NSpace,
  NSelect,
  NInputNumber,
  useMessage,
  NForm,
  NFormItem,
  NInput,
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { CrudTable, CrudSearch, CrudModal, CrudConfirm, type SearchField } from '@/components'
import { useTable, useModal } from '@/composables'
import { rateLimitRuleApi } from '@/api'
import type { RateLimitRule, CreateRateLimitRuleRequest, UpdateRateLimitRuleRequest } from '@/types'
import { Op } from '@/utils/ssql'

defineOptions({ name: 'RateLimitRules' })

const message = useMessage()

// 限流模式选项
const modeOptions = [
  { label: '时间窗口', value: 'time_window' },
  { label: '并发限流', value: 'concurrent' },
  { label: '滑动窗口', value: 'sliding_window' },
]

// 限流维度选项
const dimensionOptions = [
  { label: '按IP', value: 'ip' },
  { label: '全局', value: 'global' },
  { label: '按用户', value: 'user' },
]

// HTTP方法选项
const methodOptions = [
  { label: '全部', value: '*' },
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'DELETE', value: 'DELETE' },
  { label: 'PATCH', value: 'PATCH' },
]

// 搜索字段
const searchFields: SearchField[] = [
  { key: 'name', label: '规则名称', type: 'input' },
  { key: 'code', label: '规则编码', type: 'input' },
  {
    key: 'mode',
    label: '限流模式',
    type: 'select',
    options: modeOptions,
  },
  {
    key: 'status',
    label: '状态',
    type: 'select',
    options: [
      { label: '启用', value: 1 },
      { label: '禁用', value: 0 },
    ],
  },
]

// useTable
const table = useTable<
  RateLimitRule,
  { name?: string; code?: string; mode?: string; status?: number }
>({
  api: (params) => rateLimitRuleApi.list(params),
  opMap: { name: Op.Like, code: Op.Like },
})

// useModal
const modal = useModal<CreateRateLimitRuleRequest & { id?: number }>({
  defaultData: {
    name: '',
    code: '',
    mode: 'time_window',
    pathPattern: '/api/**',
    method: '*',
    dimension: 'ip',
    windowSeconds: 60,
    maxRequests: 100,
    maxConcurrent: 10,
    blacklistThreshold: 0,
    responseCode: 429,
    responseMessage: '请求过于频繁，请稍后再试',
    priority: 100,
    status: 1,
    remark: '',
  },
  validate: (data) => {
    if (!data.name) return '请输入规则名称'
    if (!data.code) return '请输入规则编码'
    if (!data.pathPattern) return '请输入匹配路径'
    return null
  },
  createApi: (data) => rateLimitRuleApi.create(data),
  updateApi: (id, data) => rateLimitRuleApi.update(id, data as UpdateRateLimitRuleRequest),
  onSuccess: () => {
    message.success(modal.isEdit.value ? '更新成功' : '创建成功')
    table.reload()
  },
  onError: (err) => message.error(err.message || '操作失败'),
})

// 模式标签映射
const modeMap: Record<string, { label: string; type: 'info' | 'warning' | 'success' }> = {
  time_window: { label: '时间窗口', type: 'info' },
  concurrent: { label: '并发限流', type: 'warning' },
  sliding_window: { label: '滑动窗口', type: 'success' },
}

// 维度标签映射
const dimensionMap: Record<string, string> = {
  ip: '按IP',
  global: '全局',
  user: '按用户',
}

// 表格列
const columns: DataTableColumns<RateLimitRule> = [
  { title: 'ID', key: 'id', width: 60 },
  { title: '规则名称', key: 'name', width: 150 },
  { title: '编码', key: 'code', width: 140, ellipsis: { tooltip: true } },
  {
    title: '模式',
    key: 'mode',
    width: 100,
    render: (row) => {
      const info = modeMap[row.mode] || { label: row.mode, type: 'default' as const }
      return h(NTag, { type: info.type, size: 'small' }, () => info.label)
    },
  },
  { title: '路径', key: 'pathPattern', width: 180, ellipsis: { tooltip: true } },
  { title: '方法', key: 'method', width: 80 },
  {
    title: '维度',
    key: 'dimension',
    width: 80,
    render: (row) => dimensionMap[row.dimension] || row.dimension,
  },
  {
    title: '限流配置',
    key: 'config',
    width: 160,
    render: (row) => {
      if (row.mode === 'concurrent') {
        return `最大并发: ${row.maxConcurrent}`
      }
      return `${row.maxRequests}次/${row.windowSeconds}秒`
    },
  },
  {
    title: '黑名单阈值',
    key: 'blacklistThreshold',
    width: 100,
    render: (row) => (row.blacklistThreshold > 0 ? `${row.blacklistThreshold}次` : '不封禁'),
  },
  { title: '优先级', key: 'priority', width: 80 },
  {
    title: '状态',
    key: 'status',
    width: 80,
    render: (row) =>
      h(NTag, { type: row.status === 1 ? 'success' : 'warning', size: 'small' }, () =>
        row.status === 1 ? '启用' : '禁用',
      ),
  },
  {
    title: '操作',
    key: 'actions',
    width: 180,
    fixed: 'right',
    render: (row) =>
      h(NSpace, { size: 'small' }, () => [
        h(
          NButton,
          {
            size: 'small',
            quaternary: true,
            type: row.status === 1 ? 'warning' : 'success',
            onClick: () => handleToggle(row),
          },
          () => (row.status === 1 ? '禁用' : '启用'),
        ),
        h(
          NButton,
          { size: 'small', quaternary: true, type: 'primary', onClick: () => handleEdit(row) },
          () => '编辑',
        ),
        h(CrudConfirm, { title: '确定要删除此规则吗？', onConfirm: () => handleDelete(row.id) }),
      ]),
  },
]

function handleEdit(row: RateLimitRule) {
  modal.edit(row.id, {
    name: row.name,
    code: row.code,
    mode: row.mode,
    pathPattern: row.pathPattern,
    method: row.method,
    dimension: row.dimension,
    windowSeconds: row.windowSeconds,
    maxRequests: row.maxRequests,
    maxConcurrent: row.maxConcurrent,
    blacklistThreshold: row.blacklistThreshold,
    responseCode: row.responseCode,
    responseMessage: row.responseMessage,
    priority: row.priority,
    status: row.status,
    remark: row.remark || '',
  })
}

async function handleDelete(id: number) {
  try {
    await rateLimitRuleApi.delete(id)
    message.success('删除成功')
    table.reload()
  } catch (err: unknown) {
    message.error((err as Error).message || '删除失败')
  }
}

async function handleToggle(row: RateLimitRule) {
  try {
    await rateLimitRuleApi.update(row.id, { status: row.status === 1 ? 0 : 1 })
    message.success(row.status === 1 ? '已禁用' : '已启用')
    table.reload()
  } catch (err: unknown) {
    message.error((err as Error).message || '操作失败')
  }
}

async function handleReload() {
  try {
    await rateLimitRuleApi.reload()
    message.success('缓存已重载')
  } catch (err: unknown) {
    message.error((err as Error).message || '重载失败')
  }
}
</script>

<template>
  <div class="page-rate-limit-rules">
    <CrudTable
      title="限流规则管理"
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
          <NButton type="primary" @click="modal.open('新增限流规则')">新增</NButton>
        </NSpace>
      </template>
    </CrudTable>

    <CrudModal
      v-model:show="modal.visible.value"
      :title="modal.title.value"
      :loading="modal.loading.value"
      style="width: 680px"
      @confirm="modal.save"
    >
      <NForm label-placement="left" label-width="110">
        <NFormItem label="规则名称" required>
          <NInput v-model:value="modal.formData.name" placeholder="如：登录接口限流" />
        </NFormItem>
        <NFormItem label="规则编码" required>
          <NInput
            v-model:value="modal.formData.code"
            placeholder="如：login_rate_limit"
            :disabled="modal.isEdit.value"
          />
        </NFormItem>
        <NFormItem label="限流模式" required>
          <NSelect v-model:value="modal.formData.mode" :options="modeOptions" />
        </NFormItem>
        <NFormItem label="匹配路径" required>
          <NInput
            v-model:value="modal.formData.pathPattern"
            placeholder="如：/api/auth/login 或 /api/admin/**"
          />
        </NFormItem>
        <NFormItem label="请求方法">
          <NSelect v-model:value="modal.formData.method" :options="methodOptions" />
        </NFormItem>
        <NFormItem label="限流维度">
          <NSelect v-model:value="modal.formData.dimension" :options="dimensionOptions" />
        </NFormItem>

        <!-- 时间窗口模式的配置 -->
        <template v-if="modal.formData.mode !== 'concurrent'">
          <NFormItem label="时间窗口(秒)">
            <NInputNumber
              v-model:value="modal.formData.windowSeconds"
              :min="1"
              :max="86400"
              style="width: 100%"
              placeholder="如：60"
            />
          </NFormItem>
          <NFormItem label="最大请求数">
            <NInputNumber
              v-model:value="modal.formData.maxRequests"
              :min="1"
              :max="100000"
              style="width: 100%"
              placeholder="如：100"
            />
          </NFormItem>
        </template>

        <!-- 并发模式的配置 -->
        <template v-if="modal.formData.mode === 'concurrent'">
          <NFormItem label="最大并发数">
            <NInputNumber
              v-model:value="modal.formData.maxConcurrent"
              :min="1"
              :max="10000"
              style="width: 100%"
              placeholder="如：10"
            />
          </NFormItem>
        </template>

        <NFormItem label="黑名单阈值">
          <NInputNumber
            v-model:value="modal.formData.blacklistThreshold"
            :min="0"
            :max="1000"
            style="width: 100%"
            placeholder="0表示不自动封禁"
          />
        </NFormItem>
        <NFormItem label="响应码">
          <NInputNumber
            v-model:value="modal.formData.responseCode"
            :min="400"
            :max="599"
            style="width: 100%"
          />
        </NFormItem>
        <NFormItem label="响应消息">
          <NInput v-model:value="modal.formData.responseMessage" placeholder="触发限流后的提示" />
        </NFormItem>
        <NFormItem label="优先级">
          <NInputNumber
            v-model:value="modal.formData.priority"
            :min="0"
            :max="10000"
            style="width: 100%"
            placeholder="越小越优先"
          />
        </NFormItem>
        <NFormItem label="状态">
          <NSelect
            v-model:value="modal.formData.status"
            :options="[
              { label: '启用', value: 1 },
              { label: '禁用', value: 0 },
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
.page-rate-limit-rules {
  height: 100%;
}
</style>
