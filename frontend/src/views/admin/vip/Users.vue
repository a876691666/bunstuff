<script setup lang="ts">
import { shallowRef, onMounted, h, reactive } from 'vue'
import {
  NButton,
  NSpace,
  useMessage,
  NForm,
  NFormItem,
  NSelect,
  NTag,
  NDescriptions,
  NDescriptionsItem,
  NCard,
  NDrawer,
  NDrawerContent,
  NEmpty,
} from 'naive-ui'
import type { DataTableColumns, SelectOption } from 'naive-ui'
import { PageTable, FormModal, SearchForm, ConfirmButton } from '@/components'
import type { SearchFieldConfig } from '@/components'
import { vipApi, userApi } from '@/api'
import type { UserVip, VipTier, User, UserResourceUsageInfo } from '@/types'

const message = useMessage()

// 数据状态
const loading = shallowRef(false)
const data = shallowRef<UserVip[]>([])
const total = shallowRef(0)
const page = shallowRef(1)
const pageSize = shallowRef(10)

// 用户和VIP等级列表
const users = shallowRef<User[]>([])
const tiers = shallowRef<VipTier[]>([])

// 搜索条件
const searchParams = shallowRef<Record<string, any>>({})

// 升级弹窗状态
const upgradeVisible = shallowRef(false)
const upgradeLoading = shallowRef(false)
const upgradeForm = reactive({
  userId: 0 as number,
  tierId: 0 as number,
})

// 资源详情抽屉
const detailVisible = shallowRef(false)
const detailLoading = shallowRef(false)
const currentUser = shallowRef<UserVip | null>(null)
const resourceUsage = shallowRef<UserResourceUsageInfo[]>([])

// 搜索字段配置
const searchFields: SearchFieldConfig[] = [{ key: 'userId', label: '用户ID', type: 'input' }]

// 表格列定义
const columns: DataTableColumns<UserVip> = [
  { title: '用户ID', key: 'userId', width: 100 },
  {
    title: 'VIP等级',
    key: 'tierName',
    width: 120,
    render: (row) => {
      const tier = tiers.value.find((t) => t.id === row.vipTierId)
      return h(NTag, { type: 'info' }, () => tier?.name || '未知')
    },
  },
  {
    title: '到期时间',
    key: 'expireTime',
    width: 180,
    render: (row) => {
      if (!row.expireTime) {
        return h(NTag, { type: 'success' }, () => '永久')
      }
      const expired = new Date(row.expireTime) < new Date()
      return h(NTag, { type: expired ? 'error' : 'default' }, () =>
        new Date(row.expireTime!).toLocaleString(),
      )
    },
  },
  {
    title: '绑定状态',
    key: 'bindingStatus',
    width: 100,
    render: (row) =>
      h(NTag, { type: row.bindingStatus === 1 ? 'success' : 'warning' }, () =>
        row.bindingStatus === 1 ? '已确认' : '待确认',
      ),
  },
  {
    title: '状态',
    key: 'status',
    width: 80,
    render: (row) => {
      const expired = row.expireTime && new Date(row.expireTime) < new Date()
      if (row.status === 0) {
        return h(NTag, { type: 'error' }, () => '禁用')
      }
      return h(NTag, { type: expired ? 'error' : 'success' }, () => (expired ? '已过期' : '有效'))
    },
  },
  {
    title: '操作',
    key: 'actions',
    width: 250,
    fixed: 'right',
    render: (row) =>
      h(NSpace, { size: 'small' }, () => [
        h(
          NButton,
          {
            size: 'small',
            quaternary: true,
            type: 'primary',
            onClick: () => handleViewDetail(row),
          },
          () => '资源详情',
        ),
        row.bindingStatus === 0
          ? h(
              NButton,
              {
                size: 'small',
                quaternary: true,
                type: 'success',
                onClick: () => handleConfirmBinding(row.id, true),
              },
              () => '确认绑定',
            )
          : null,
        h(
          NButton,
          {
            size: 'small',
            quaternary: true,
            type: 'info',
            onClick: () => handleUpgrade(row),
          },
          () => '变更',
        ),
        h(ConfirmButton, {
          title: '确定要取消该用户的VIP吗？',
          buttonText: '取消VIP',
          onConfirm: () => handleCancel(row.userId),
        }),
      ]),
  },
]

// 加载数据
async function loadData() {
  loading.value = true
  try {
    const res = await vipApi.listUserVips({
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

// 加载用户列表
async function loadUsers() {
  try {
    const res = await userApi.list({ pageSize: 1000 })
    users.value = res.data
  } catch (err: any) {
    console.error('加载用户列表失败', err)
  }
}

// 加载VIP等级列表
async function loadTiers() {
  try {
    const res = await vipApi.listTiers({ pageSize: 100 })
    tiers.value = res.data.filter((t) => t.status === 1)
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

// 新增用户VIP
function handleAdd() {
  Object.assign(upgradeForm, {
    userId: 0,
    tierId: 0,
  })
  upgradeVisible.value = true
}

// 升级用户VIP
function handleUpgrade(row: UserVip) {
  Object.assign(upgradeForm, {
    userId: row.userId,
    tierId: row.vipTierId,
  })
  upgradeVisible.value = true
}

// 确认绑定
async function handleConfirmBinding(userVipId: number, confirm: boolean) {
  try {
    await vipApi.confirmVipBinding(userVipId, confirm)
    message.success(confirm ? '绑定确认成功' : '绑定已取消')
    loadData()
  } catch (err: any) {
    message.error(err.message || '操作失败')
  }
}

// 取消用户VIP
async function handleCancel(userId: number) {
  try {
    await vipApi.cancelUserVip(userId)
    message.success('已取消VIP')
    loadData()
  } catch (err: any) {
    message.error(err.message || '操作失败')
  }
}

// 保存升级
async function handleSaveUpgrade() {
  if (!upgradeForm.userId || !upgradeForm.tierId) {
    message.warning('请选择用户和VIP等级')
    return
  }

  // 获取 VIP 等级的 code
  const tier = tiers.value.find((t) => t.id === upgradeForm.tierId)
  if (!tier) {
    message.warning('无效的VIP等级')
    return
  }

  upgradeLoading.value = true
  try {
    await vipApi.upgradeUserVipDirect(upgradeForm.userId, tier.code)
    message.success('升级成功')
    upgradeVisible.value = false
    loadData()
  } catch (err: any) {
    message.error(err.message || '升级失败')
  } finally {
    upgradeLoading.value = false
  }
}

// 查看资源详情
async function handleViewDetail(row: UserVip) {
  currentUser.value = row
  detailVisible.value = true
  detailLoading.value = true
  try {
    const res = await vipApi.getUserResourceUsage(row.userId)
    resourceUsage.value = res
  } catch (err: any) {
    message.error(err.message || '加载资源详情失败')
  } finally {
    detailLoading.value = false
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

// 用户选项
function getUserOptions(): SelectOption[] {
  return users.value.map((u) => ({
    label: `${u.username} (ID: ${u.id})`,
    value: u.id,
  }))
}

// VIP等级选项
function getTierOptions(): SelectOption[] {
  return tiers.value.map((t) => ({
    label: `${t.name} (¥${t.price})`,
    value: t.id,
  }))
}

onMounted(() => {
  loadData()
  loadUsers()
  loadTiers()
})
</script>

<template>
  <div class="page-vip-users">
    <PageTable
      title="用户VIP管理"
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
        <NButton type="primary" @click="handleAdd">添加用户VIP</NButton>
      </template>
    </PageTable>

    <!-- 升级弹窗 -->
    <FormModal
      v-model:show="upgradeVisible"
      title="设置用户VIP"
      :loading="upgradeLoading"
      @confirm="handleSaveUpgrade"
    >
      <NForm label-placement="left" label-width="80">
        <NFormItem label="用户" required>
          <NSelect
            v-model:value="upgradeForm.userId"
            :options="getUserOptions()"
            placeholder="请选择用户"
            filterable
          />
        </NFormItem>
        <NFormItem label="VIP等级" required>
          <NSelect
            v-model:value="upgradeForm.tierId"
            :options="getTierOptions()"
            placeholder="请选择VIP等级"
          />
        </NFormItem>
      </NForm>
    </FormModal>

    <!-- 资源详情抽屉 -->
    <NDrawer v-model:show="detailVisible" :width="500">
      <NDrawerContent title="用户资源使用详情" :native-scrollbar="false">
        <div v-if="currentUser">
          <NCard title="VIP信息" size="small" style="margin-bottom: 16px">
            <NDescriptions label-placement="left" :column="1">
              <NDescriptionsItem label="用户ID">{{ currentUser.userId }}</NDescriptionsItem>
              <NDescriptionsItem label="VIP等级">
                <NTag type="info">
                  {{ tiers.find((t) => t.id === currentUser!.vipTierId)?.name || '未知' }}
                </NTag>
              </NDescriptionsItem>
              <NDescriptionsItem label="到期时间">
                {{
                  currentUser.expireTime
                    ? new Date(currentUser.expireTime).toLocaleString()
                    : '永久'
                }}
              </NDescriptionsItem>
              <NDescriptionsItem label="绑定状态">
                <NTag :type="currentUser.bindingStatus === 1 ? 'success' : 'warning'">
                  {{ currentUser.bindingStatus === 1 ? '已确认' : '待确认' }}
                </NTag>
              </NDescriptionsItem>
            </NDescriptions>
          </NCard>

          <NCard title="资源使用情况" size="small">
            <template v-if="detailLoading">
              <div style="text-align: center; padding: 20px">加载中...</div>
            </template>
            <template v-else-if="resourceUsage.length === 0">
              <NEmpty description="暂无资源使用记录" />
            </template>
            <template v-else>
              <div class="resource-list">
                <div v-for="item in resourceUsage" :key="item.resourceKey" class="resource-item">
                  <div class="resource-header">
                    <span class="resource-name">{{ item.resourceKey }}</span>
                    <NTag :type="item.canUse ? 'success' : 'error'" size="small">
                      {{ item.canUse ? '可用' : '已达上限' }}
                    </NTag>
                  </div>
                  <div class="resource-stats">
                    <span>已使用: {{ item.currentUsage }}</span>
                    <span>限制: {{ item.limitValue === -1 ? '无限' : item.limitValue }}</span>
                    <span>剩余: {{ item.available === -1 ? '无限' : item.available }}</span>
                  </div>
                  <div v-if="item.description" class="resource-desc">{{ item.description }}</div>
                </div>
              </div>
            </template>
          </NCard>
        </div>
      </NDrawerContent>
    </NDrawer>
  </div>
</template>

<style scoped>
.page-vip-users {
  height: 100%;
}

.resource-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.resource-item {
  padding: 12px;
  background-color: var(--n-color-embedded, #fafafc);
  border-radius: 4px;
}

.resource-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.resource-name {
  font-weight: 500;
}

.resource-stats {
  display: flex;
  gap: 16px;
  color: var(--n-text-color-3, #999);
  font-size: 12px;
  margin-bottom: 4px;
}

.resource-desc {
  color: var(--n-text-color-3, #999);
  font-size: 12px;
}
</style>
