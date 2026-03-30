<template>
  <div class="chat-layout">
    <!-- 左侧边栏 -->
    <aside class="sidebar">
      <!-- 新建对话按钮 -->
      <div class="sidebar-header">
        <button class="new-chat-btn" @click="handleNewChat">
          <span class="icon">+</span>
          <span>新建对话</span>
        </button>
      </div>

      <!-- 会话列表 -->
      <div class="conversation-list">
        <div
          v-for="conv in (agentStore.sessions as Session[])"
          :key="conv.id"
          class="conversation-item"
          :class="{ active: agentStore.currentSessionId === conv.id }"
          @click="currentSession(conv.id)"
        >
          <div class="conv-title">{{ conv.title }}</div>
          <div class="conv-meta">
            <div class="dropdown" @click.stop>
              <button
                class="menu-trigger"
                @click="toggleDropdown(conv.id)"
              >
                ⋮
              </button>
              <div v-if="activeDropdown === conv.id" class="dropdown-menu">
                <button
                  class="dropdown-item"
                  @click="handleRenameConversation(conv.id,conv.user_id,conv.title)"
                >
                  重命名
                </button>
                <button
                  class="dropdown-item delete"
                  @click="handleDeleteConversation(conv.id)"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 用户设置（左下角） -->
      <div class="sidebar-footer">
        <div class="user-profile" @click="toggleUserMenu">
          <img
            v-if="authStore.user?.avatar"
            :src="authStore.user.avatar"
            :alt="authStore.user?.username"
            class="user-avatar"
          />
          <div v-else class="user-avatar-placeholder">{{ authStore.user?.username?.[0] || 'U' }}</div>
          <div class="user-info">
            <div class="user-name">{{ authStore.user?.username || '用户' }}</div>
            <div class="user-email">{{ authStore.user?.email || '未设置邮箱' }}</div>
          </div>
        </div>
        <div v-if="showUserMenu" class="user-menu">
          <button class="menu-item" @click="openEditUserDialog">
            修改用户信息
          </button>
          <button class="menu-item" @click="openSessionManageDialog">
            会话管理
          </button>
          <button class="menu-item logout-btn" @click="handleLogout">
            退出登录
          </button>
        </div>
      </div>
    </aside>

    <!-- 右侧聊天区域 -->
    <main class="chat-main">
      <slot />
    </main>

    <!-- 修改用户信息弹窗 -->
    <el-dialog
      v-model="editUserDialogVisible"
      title="修改用户信息"
      width="400px"
      @close="resetEditUserForm"
    >
      <el-form :model="editUserForm" label-width="100px">
        <el-form-item label="用户名">
          <el-input
            v-model="editUserForm.username"
            placeholder="请输入用户名"
          />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input
            v-model="editUserForm.email"
            placeholder="请输入邮箱"
            type="email"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editUserDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleUpdateUserProfile">确定</el-button>
      </template>
    </el-dialog>

    <!-- 会话管理弹窗 -->
    <el-dialog
      v-model="sessionManageDialogVisible"
      title="会话管理"
      width="400px"
    >
      <div class="session-manage-content">
        <p class="manage-info">当前会话数：{{ agentStore.sessions.length }}</p>
        <el-alert
          type="warning"
          title="删除所有会话后无法恢复，请谨慎操作"
          :closable="false"
          class="manage-alert"
        />
      </div>
      <template #footer>
        <el-button @click="sessionManageDialogVisible = false">关闭</el-button>
        <el-button type="danger" @click="handleDeleteAllSessions">删除所有会话</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref,onMounted } from 'vue'
import { useAgentStore } from '../stores/agent'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import { hardDeleteSession, updateSession,getUserSessions,createSession, deleteAllSessions,getSessionWithHistory,} from '../api/agent'
import { updateUserProfile } from '../api/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import {Session} from '@/types/chat'
import {getUserId,removeUserId,removeToken} from '../utils/TokenUtils'

const agentStore = useAgentStore()
const authStore = useAuthStore()
const router = useRouter()
// 用户菜单开关
const showUserMenu = ref(false)
const activeDropdown = ref<number | null>(null)
const deleting = ref(false)


// 在组件挂载时加载会话列表
onMounted(async () => {
  // 支持两种情形：authStore.user（完整用户）或仅有 userId（登录后只返回 userId 或 token）
  const uid = getUserId()
  if (authStore.isAuthenticated && uid) {
    try {
      const resp = await getUserSessions(Number(uid))
      console.log('getUserSessions resp:', resp)
      // 兼容两种后端返回格式：{ items: Session[] } 或直接返回 Session[]
      const sessions = resp.data?.items ?? resp.data
      agentStore.setSessions(sessions)
      // 如果有会话，默认加载最新的会话
      if (sessions.length > 0) {
        const latestSession = sessions[sessions.length - 1]
        await getSessionWithHistory(latestSession.id, Number(uid)).then((response) => {
          agentStore.setMessages(response.data.messages)
        })
        agentStore.setCurrentSessionId(latestSession.id)
      }
    } catch (error: unknown) {
      let errorMsg = '加载会话失败'
      if (error instanceof Error) {
        errorMsg = error.message
      }
      ElMessage.error(errorMsg)
      console.error('Fetch sessions error:', error)
    }
  } else {
    console.log('Skipping fetch sessions: isAuthenticated=', authStore.isAuthenticated, 'userId=', uid)
  }
})
// 切换当前会话
async function currentSession(sessionId: number) {
  const uid = getUserId()
    if (!authStore.isAuthenticated || !uid) {
      ElMessage.error('用户未认证，无法加载会话')
      return
    }
     // 新的消息，流，新的会话，流会话 
  await getSessionWithHistory(sessionId, Number(uid) ?? 0).then((response) => {
    agentStore.setMessages(response.data.messages)
  })
agentStore.setCurrentSessionId(sessionId)
}

// 修改用户信息相关
const editUserDialogVisible = ref(false)
const editUserForm = ref({
  username: '',
  email: '',
})

// 会话管理相关
const sessionManageDialogVisible = ref(false)

function toggleUserMenu() {
  showUserMenu.value = !showUserMenu.value
}

function toggleDropdown(sessionId: number) {
  activeDropdown.value = activeDropdown.value === sessionId ? null : sessionId
}

function openEditUserDialog() {
  editUserForm.value = {
    username: authStore.user?.username || '',
    email: authStore.user?.email || '',
  }
  editUserDialogVisible.value = true
  showUserMenu.value = false
}

async function handleUpdateUserProfile() {
  if (!authStore.user?.id) {
    ElMessage.error('用户信息未加载')
    return
  }

  try {
    const updateData: {username?: string, email?: string} = {}
    if (editUserForm.value.username) {
      updateData.username = editUserForm.value.username
    }
    if (editUserForm.value.email) {
      updateData.email = editUserForm.value.email
    }

    await updateUserProfile(authStore.user.id, updateData)
    
    // 更新 store 中的用户信息
    if (authStore.user) {
      if (editUserForm.value.username) {
        authStore.user.username = editUserForm.value.username
      }
      if (editUserForm.value.email) {
        authStore.user.email = editUserForm.value.email
      }
    }
    
    ElMessage.success('用户信息已更新')
    editUserDialogVisible.value = false
  } catch (error: unknown) {
    let errorMsg = '更新用户信息失败'
    if (error instanceof Error) {
      errorMsg = error.message
    }
    ElMessage.error(errorMsg)
    console.error('Update user profile error:', error)
  }
}

function resetEditUserForm() {
  editUserForm.value = {
    username: '',
    email: '',
  }
}

function openSessionManageDialog() {
  sessionManageDialogVisible.value = true
  showUserMenu.value = false
}

async function handleDeleteAllSessions() {
  try {
    await ElMessageBox.confirm(
      '确定要删除所有会话吗？此操作无法撤销。',
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    const userId = authStore.user?.id
    if (!userId) {
      ElMessage.error('用户信息未加载')
      return
    }

    await deleteAllSessions(userId)
    ElMessage.success('所有会话已删除')
    agentStore.clearAllSessionsAndMsg()
    sessionManageDialogVisible.value = false
  } catch (error: any) {
    if (error.action !== 'cancel') {
      let errorMsg = '删除会话失败'
      if (error instanceof Error) {
        errorMsg = error.message
      }
      ElMessage.error(errorMsg)
      console.error('Delete all sessions error:', error)
    }
  }
}

async function handleRenameConversation(id: number, user_id: number, currentTitle: string) {
  const newTitle = prompt('请输入新的会话标题：', currentTitle)
  if (newTitle && newTitle !== currentTitle) {
    try {
      // 调用后端 API 更新会话标题
     await updateSession(id,user_id, { title: newTitle }).then(() => {
        // 更新缓存 store
        agentStore.renameSession(id, newTitle)
        ElMessage.success('会话已重命名')
      })
    } catch (error: unknown) {
      let errorMsg = '重命名失败'
      if (error instanceof Error) {
        errorMsg = error.message
      }
      ElMessage.error(errorMsg)
      console.error('Rename conversation error:', error)
    }
  }
  activeDropdown.value = null
}

function handleNewChat() {
  const title = prompt('请输入对话标题：', '新对话')
  if (title) {
    const conversation: Session = {
        id: 0, // 临时 ID，实际应由后端生成
        user_id: authStore.user?.id || 0,
        title: title,
        token: "",
        is_archived: false,
        model_name: 'gpt-3.5-turbo',
        system_prompt: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        }
      createSession(conversation.user_id, conversation.title, conversation.model_name, conversation.system_prompt).then(response => {
      const newSession = response.data
      agentStore.sessions.push(newSession)
      agentStore.setCurrentSessionId(newSession.id)
      agentStore.setMessages([])
      ElMessage.success('新对话已创建')
    })
  }
}

async function handleDeleteConversation(id: number) {
  if (!confirm('确定要删除这个对话吗？')) {
    return
  }

  deleting.value = true
  try {
    // 调用后端 API 删除会话
    // 对应后端接口：def delete_session(session_id: int, user_id: int = Query(...))
    // 前端会发送：DELETE /api/chat/sessions/{id}?userId={userId}
    const userId = authStore.user?.id
    
    if (!userId) {
      ElMessage.error('用户信息未加载')
      return
    }

    await hardDeleteSession(id, userId)
    // 从本地 store 中移除
    agentStore.removeSession(id)
    ElMessage.success('对话已删除')
    // 如果删除的是当前会话，切换到其他会话或清空消息
    if (agentStore.currentSessionId === id) {
      // 清理一下当前会话的消息，避免闪烁
      agentStore.setMessages([])
      // agentStore里的watch监听到变化会自动清理
      // 切换到剩余的最后一个会话（如果有）
      const remainingSessions = agentStore.sessions.filter((s) => s.id !== id)
      if (remainingSessions.length > 0) {
        const newCurrentSession = remainingSessions[remainingSessions.length - 1]
        agentStore.setCurrentSessionId(newCurrentSession.id)
        await getSessionWithHistory(newCurrentSession.id, Number(userId)).then((response) => {
          agentStore.setMessages(response.data.messages)
        })
      } else {
        agentStore.setMessages([])
      agentStore.setCurrentSessionId(0)
      }
    }
  } catch (error: unknown) {
    let errorMsg = '删除对话失败'
    if (error instanceof Error) {
      errorMsg = error.message
    }
    ElMessage.error(errorMsg)
    console.error('Delete conversation error:', error)
  } finally {
    deleting.value = false
    activeDropdown.value = null
  }
}

function handleLogout() {
  if (confirm('确定要退出登录吗？')) {
    // 清除认证状态
    authStore.setIsAuthenticated(false)
    authStore.setUser(null)
    removeToken()
    removeUserId()
    // 清除all数据
    agentStore.clearAllSessionsAndMsg()
    // 导航到登录页
    router.push('/login')
  }
}
</script>

<style scoped>
.chat-layout {
  display: flex;
  height: 100vh;
  background: #fff;
  overflow: hidden;
}

/* 左侧边栏 */
.sidebar {
  width: 280px;
  background: #f9f9f9;
  border-right: 1px solid #e5e5e5;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #e5e5e5;
}

.new-chat-btn {
  width: 100%;
  padding: 10px 16px;
  background: #10a37f;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background 0.3s;
}

.new-chat-btn:hover {
  background: #0d8a6f;
}

.icon {
  font-size: 18px;
  font-weight: bold;
}

/* 会话列表 */
.conversation-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.conversation-item {
  padding: 12px;
  position: relative;
  margin-bottom: 4px;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.conversation-item:hover {
  background: #f5f5f5;
}

.conversation-item.active {
  background: #e7f4e8;
  border-color: #10a37f;
}

.conv-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.conv-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 4px;
}

.dropdown {
  position: relative;
}

.menu-trigger {
  background: none;
  border: none;
  color: #ccc;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.menu-trigger:hover {
  color: #999;
}

.dropdown-menu {
  position: absolute;
  top: auto;
  bottom: auto; /* 把菜单显示在会话项的底部 */
  left: auto; /* 靠右对齐，稍微向内偏移，避免贴边 */
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
  z-index: 1200; /* 提高堆叠层级，确保覆盖其他元素 */
  min-width: 140px;
}

.dropdown-item {
  display: block;
  width: 100%;
  padding: 8px 12px;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  font-size: 13px;
  color: #333;
  transition: background 0.2s;
}

.dropdown-item:hover {
  background: #f5f5f5;
}

.dropdown-item:first-child {
  border-radius: 4px 4px 0 0;
}

.dropdown-item:last-child {
  border-radius: 0 0 4px 4px;
}

.dropdown-item.delete:hover {
  color: #ff4d4f;
  background: #fff1f0;
}

/* 左下角用户设置 */
.sidebar-footer {
  padding: 12px;
  border-top: 1px solid #e5e5e5;
  position: relative;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.user-profile:hover {
  background: #f0f0f0;
}

.user-avatar,
.user-avatar-placeholder {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #10a37f;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: bold;
  flex-shrink: 0;
}

.user-avatar {
  object-fit: cover;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 13px;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-email {
  font-size: 12px;
  color: #999;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-menu {
  position: absolute;
  bottom: 60px;
  left: 12px;
  right: 12px;
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.menu-item {
  width: 100%;
  padding: 10px 12px;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  font-size: 13px;
  color: #333;
  transition: background 0.2s;
}

.menu-item:hover {
  background: #f5f5f5;
}

.menu-item:first-child {
  border-radius: 5px 5px 0 0;
}

.menu-item:last-child {
  border-radius: 0 0 5px 5px;
}

.logout-btn:hover {
  color: #ff4d4f;
  background: #fff1f0;
}

/* 会话管理样式 */
.session-manage-content {
  padding: 12px 0;
}

.manage-info {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #333;
}

.manage-alert {
  margin-bottom: 12px;
}

/* 右侧主区域 */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 滚动条美化 */
.conversation-list::-webkit-scrollbar {
  width: 6px;
}

.conversation-list::-webkit-scrollbar-track {
  background: transparent;
}

.conversation-list::-webkit-scrollbar-thumb {
  background: #d4d4d4;
  border-radius: 3px;
}

.conversation-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
