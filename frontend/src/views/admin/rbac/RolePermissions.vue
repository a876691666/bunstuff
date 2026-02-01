<script setup lang="ts">
import { shallowRef, onMounted } from 'vue'
import { NButton, NSpace, useMessage, NCard, NSpin, NEmpty, NTag, NAlert, NCheckbox } from 'naive-ui'
import { roleApi, permissionApi, rolePermissionApi } from '@/api'
import type { Role, Permission } from '@/types'

const message = useMessage()

// 角色列表
const roles = shallowRef<Role[]>([])
const roleLoading = shallowRef(false)
const selectedRoleId = shallowRef<number | null>(null)

// 权限列表
const permissions = shallowRef<Permission[]>([])
const permissionLoading = shallowRef(false)

// 已选权限
const checkedPermissionIds = shallowRef<number[]>([])
const originCheckedIds = shallowRef<number[]>([])
const saving = shallowRef(false)

// 加载角色列表
async function loadRoles() {
  roleLoading.value = true
  try {
    const res = await roleApi.list({ pageSize: 1000 })
    roles.value = res.data
  } catch (err: any) {
    message.error(err.message || '加载角色失败')
  } finally {
    roleLoading.value = false
  }
}

// 加载权限列表
async function loadPermissions() {
  permissionLoading.value = true
  try {
    const res = await permissionApi.list({ pageSize: 1000 })
    permissions.value = res.data
  } catch (err: any) {
    message.error(err.message || '加载权限失败')
  } finally {
    permissionLoading.value = false
  }
}

// 加载角色的权限
async function loadRolePermissions(roleId: number) {
  permissionLoading.value = true
  try {
    const res = await rolePermissionApi.getPermissionIds(roleId)
    checkedPermissionIds.value = res
    originCheckedIds.value = [...res]
  } catch (err: any) {
    message.error(err.message || '加载角色权限失败')
  } finally {
    permissionLoading.value = false
  }
}

// 选择角色
function handleSelectRole(roleId: number) {
  selectedRoleId.value = roleId
  loadRolePermissions(roleId)
}

// 保存
async function handleSave() {
  if (!selectedRoleId.value) {
    message.warning('请先选择角色')
    return
  }

  saving.value = true
  try {
    await rolePermissionApi.batchSet(selectedRoleId.value, checkedPermissionIds.value)
    message.success('保存成功')
    originCheckedIds.value = [...checkedPermissionIds.value]
  } catch (err: any) {
    message.error(err.message || '保存失败')
  } finally {
    saving.value = false
  }
}

// 重置
function handleReset() {
  checkedPermissionIds.value = [...originCheckedIds.value]
}

// 全选
function handleSelectAll() {
  checkedPermissionIds.value = permissions.value.map((p) => p.id)
}

// 取消全选
function handleClearAll() {
  checkedPermissionIds.value = []
}

// 是否有变更
function hasChanges() {
  if (checkedPermissionIds.value.length !== originCheckedIds.value.length) return true
  const sorted1 = [...checkedPermissionIds.value].sort()
  const sorted2 = [...originCheckedIds.value].sort()
  return sorted1.some((v, i) => v !== sorted2[i])
}

// 按模块分组权限
function getPermissionGroups() {
  const groups: Record<string, Permission[]> = {}
  for (const perm of permissions.value) {
    // 从code中提取模块名（如 user:list -> user）
    const module = perm.code.split(':')[0] || '其他'
    if (!groups[module]) {
      groups[module] = []
    }
    groups[module].push(perm)
  }
  return groups
}

// 切换模块全选
function handleToggleModule(module: string, perms: Permission[]) {
  const permIds = perms.map((p) => p.id)
  const allChecked = permIds.every((id) => checkedPermissionIds.value.includes(id))

  if (allChecked) {
    // 取消选中
    checkedPermissionIds.value = checkedPermissionIds.value.filter((id) => !permIds.includes(id))
  } else {
    // 全部选中
    const newIds = new Set([...checkedPermissionIds.value, ...permIds])
    checkedPermissionIds.value = Array.from(newIds)
  }
}

// 检查模块是否全选
function isModuleAllChecked(perms: Permission[]) {
  return perms.every((p) => checkedPermissionIds.value.includes(p.id))
}

// 检查模块是否部分选中
function isModuleIndeterminate(perms: Permission[]) {
  const checked = perms.filter((p) => checkedPermissionIds.value.includes(p.id))
  return checked.length > 0 && checked.length < perms.length
}

onMounted(() => {
  loadRoles()
  loadPermissions()
})
</script>

<template>
  <div class="page-role-permissions">
    <NAlert type="info" :bordered="false" style="margin-bottom: 16px">
      选择左侧角色，在右侧勾选该角色拥有的权限，然后点击保存。
    </NAlert>

    <div class="content-wrapper">
      <!-- 角色列表 -->
      <NCard title="角色列表" class="role-card">
        <NSpin :show="roleLoading">
          <div class="role-list">
            <div
              v-for="role in roles"
              :key="role.id"
              :class="['role-item', { active: selectedRoleId === role.id }]"
              @click="handleSelectRole(role.id)"
            >
              <span class="role-name">{{ role.name }}</span>
              <NTag v-if="role.code" size="small" :bordered="false">{{ role.code }}</NTag>
            </div>
            <NEmpty v-if="!roleLoading && roles.length === 0" description="暂无角色" />
          </div>
        </NSpin>
      </NCard>

      <!-- 权限列表 -->
      <NCard title="权限配置" class="permission-card">
        <template #header-extra>
          <NSpace>
            <NButton size="small" @click="handleSelectAll">全选</NButton>
            <NButton size="small" @click="handleClearAll">取消全选</NButton>
          </NSpace>
        </template>

        <NSpin :show="permissionLoading">
          <div v-if="!selectedRoleId" class="empty-tip">
            <NEmpty description="请先选择左侧角色" />
          </div>
          <div v-else class="permission-groups">
            <div v-for="(perms, module) in getPermissionGroups()" :key="module" class="permission-group">
              <div class="group-header">
                <NCheckbox
                  :checked="isModuleAllChecked(perms)"
                  :indeterminate="isModuleIndeterminate(perms)"
                  @update:checked="handleToggleModule(module as string, perms)"
                >
                  <span class="module-name">{{ module }}</span>
                </NCheckbox>
                <NTag size="small" :bordered="false">{{ perms.length }}</NTag>
              </div>
              <div class="group-items">
                <NCheckbox
                  v-for="perm in perms"
                  :key="perm.id"
                  :checked="checkedPermissionIds.includes(perm.id)"
                  @update:checked="
                    (checked) => {
                      if (checked) {
                        checkedPermissionIds = [...checkedPermissionIds, perm.id]
                      } else {
                        checkedPermissionIds = checkedPermissionIds.filter((id) => id !== perm.id)
                      }
                    }
                  "
                >
                  <span class="perm-name">{{ perm.name }}</span>
                  <span class="perm-code">({{ perm.code }})</span>
                </NCheckbox>
              </div>
            </div>
            <NEmpty v-if="Object.keys(getPermissionGroups()).length === 0" description="暂无权限数据" />
          </div>
        </NSpin>

        <template #action>
          <NSpace justify="end">
            <NButton @click="handleReset" :disabled="!hasChanges()">重置</NButton>
            <NButton
              type="primary"
              @click="handleSave"
              :loading="saving"
              :disabled="!selectedRoleId || !hasChanges()"
            >
              保存
            </NButton>
          </NSpace>
        </template>
      </NCard>
    </div>
  </div>
</template>

<style scoped>
.page-role-permissions {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.content-wrapper {
  flex: 1;
  display: flex;
  gap: 16px;
  min-height: 0;
}

.role-card {
  width: 300px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}

.role-card :deep(.n-card__content) {
  flex: 1;
  overflow: auto;
}

.role-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.role-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.role-item:hover {
  background-color: var(--n-item-color-hover, #f0f0f0);
}

.role-item.active {
  background-color: var(--n-item-color-active, #e6f4ff);
  color: var(--n-item-text-color-active, #1890ff);
}

.role-name {
  font-weight: 500;
}

.permission-card {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.permission-card :deep(.n-card__content) {
  flex: 1;
  overflow: auto;
}

.empty-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
}

.permission-groups {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.permission-group {
  border: 1px solid var(--n-border-color, #e0e0e6);
  border-radius: 4px;
  overflow: hidden;
}

.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background-color: var(--n-header-color, #fafafc);
  border-bottom: 1px solid var(--n-border-color, #e0e0e6);
}

.module-name {
  font-weight: 500;
  text-transform: capitalize;
}

.group-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px;
}

.group-items .n-checkbox {
  margin: 0;
}

.perm-name {
  margin-right: 4px;
}

.perm-code {
  color: var(--n-text-color-3, #999);
  font-size: 12px;
}
</style>
