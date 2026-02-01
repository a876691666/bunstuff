<script setup lang="ts">
import { shallowRef, onMounted } from 'vue'
import { NButton, NSpace, useMessage, NTree, NCard, NSpin, NEmpty, NTag, NAlert } from 'naive-ui'
import type { TreeOption } from 'naive-ui'
import { roleApi, menuApi, roleMenuApi } from '@/api'
import type { Role, MenuTree } from '@/types'

const message = useMessage()

// 角色列表
const roles = shallowRef<Role[]>([])
const roleLoading = shallowRef(false)
const selectedRoleId = shallowRef<number | null>(null)

// 菜单树
const menuTree = shallowRef<MenuTree[]>([])
const menuLoading = shallowRef(false)

// 已选菜单
const checkedMenuIds = shallowRef<number[]>([])
const originCheckedIds = shallowRef<number[]>([])
const saving = shallowRef(false)

// 转换菜单树为NTree选项
function convertToTreeOptions(tree: MenuTree[]): TreeOption[] {
  return tree.map((item) => ({
    key: item.id,
    label: item.name,
    children: item.children && item.children.length > 0 ? convertToTreeOptions(item.children) : undefined,
  }))
}

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

// 加载菜单树
async function loadMenuTree() {
  menuLoading.value = true
  try {
    const res = await menuApi.tree()
    menuTree.value = res
  } catch (err: any) {
    message.error(err.message || '加载菜单树失败')
  } finally {
    menuLoading.value = false
  }
}

// 加载角色的菜单
async function loadRoleMenus(roleId: number) {
  menuLoading.value = true
  try {
    const res = await roleMenuApi.getMenuIds(roleId)
    checkedMenuIds.value = res
    originCheckedIds.value = [...res]
  } catch (err: any) {
    message.error(err.message || '加载角色菜单失败')
  } finally {
    menuLoading.value = false
  }
}

// 选择角色
function handleSelectRole(roleId: number) {
  selectedRoleId.value = roleId
  loadRoleMenus(roleId)
}

// 保存
async function handleSave() {
  if (!selectedRoleId.value) {
    message.warning('请先选择角色')
    return
  }

  saving.value = true
  try {
    await roleMenuApi.batchSet(selectedRoleId.value, checkedMenuIds.value)
    message.success('保存成功')
    originCheckedIds.value = [...checkedMenuIds.value]
  } catch (err: any) {
    message.error(err.message || '保存失败')
  } finally {
    saving.value = false
  }
}

// 重置
function handleReset() {
  checkedMenuIds.value = [...originCheckedIds.value]
}

// 全选
function handleSelectAll() {
  const getAllIds = (tree: MenuTree[]): number[] => {
    const ids: number[] = []
    for (const item of tree) {
      ids.push(item.id)
      if (item.children && item.children.length > 0) {
        ids.push(...getAllIds(item.children))
      }
    }
    return ids
  }
  checkedMenuIds.value = getAllIds(menuTree.value)
}

// 取消全选
function handleClearAll() {
  checkedMenuIds.value = []
}

// 是否有变更
function hasChanges() {
  if (checkedMenuIds.value.length !== originCheckedIds.value.length) return true
  const sorted1 = [...checkedMenuIds.value].sort()
  const sorted2 = [...originCheckedIds.value].sort()
  return sorted1.some((v, i) => v !== sorted2[i])
}

onMounted(() => {
  loadRoles()
  loadMenuTree()
})
</script>

<template>
  <div class="page-role-menus">
    <NAlert type="info" :bordered="false" style="margin-bottom: 16px">
      选择左侧角色，在右侧勾选该角色可访问的菜单，然后点击保存。
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

      <!-- 菜单树 -->
      <NCard title="菜单权限" class="menu-card">
        <template #header-extra>
          <NSpace>
            <NButton size="small" @click="handleSelectAll">全选</NButton>
            <NButton size="small" @click="handleClearAll">取消全选</NButton>
          </NSpace>
        </template>

        <NSpin :show="menuLoading">
          <div v-if="!selectedRoleId" class="empty-tip">
            <NEmpty description="请先选择左侧角色" />
          </div>
          <div v-else class="menu-tree-wrapper">
            <NTree
              v-model:checked-keys="checkedMenuIds"
              :data="convertToTreeOptions(menuTree)"
              checkable
              cascade
              selectable
              block-line
              expand-on-click
              default-expand-all
            />
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
.page-role-menus {
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

.menu-card {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.menu-card :deep(.n-card__content) {
  flex: 1;
  overflow: auto;
}

.empty-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
}

.menu-tree-wrapper {
  min-height: 200px;
}
</style>
