<template>
  <ChatLayout>
    <div class="chat-container">
      <!-- 聊天头部 -->
      <div class="chat-header">
        <h2>{{ agentStore.currentSession?.title || '新对话' }}</h2>
        <!-- <div class="header-actions"> -->
          <!-- <button v-if="agentStore.currentSessionId" class="action-btn" title="刷新">
            <span>↻</span>
          </button>
          <button class="action-btn" title="新对话" :disabled="!authStore.user?.id" @click="startNewConversation">
            <span>＋</span>
          </button> -->
        <!-- </div> -->
      </div>

      <!-- 消息区域 -->
      <div ref="messageContainer" class="messages-area">
        <div v-if="agentStore.currentMessages.length === 0" class="empty-state" style="cursor: pointer;">
          <div class="empty-icon">💬</div>
          <div class="empty-text">开始新的对话</div>
          <div class="empty-hint">输入您的问题或请求...</div>
        </div>

        <div
          v-for="message in agentStore.currentMessages"
          :key="message.id" 
          class="message-item"
          :class="{ 'is-user': message.role === 'user', 'is-assistant': message.role === 'assistant' }"
        >
          <div v-if="message.role === 'assistant'" class="message-avatar assistant">AI</div>
          <div class="message-content">
            <div class="message-bubble">
              <div class="message-text">{{ message.content }}
                <span v-if="message.status" class="status-tip">{{ message.status }}</span>
              </div>
              <!-- <div class="message-time">{{ formatTime(message.timestamp) }}</div> -->
            </div>
          </div>
          <!-- <div v-if="message.role === 'user'" class="message-avatar user">
            {{ authStore.user?.username?.[0] || 'U' }}
          </div> -->
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="chat-input-area">
        <div class="input-wrapper">
          <textarea
            ref="messageInputRef"
            v-model="inputMessage"
            class="message-input"
            placeholder="输入消息... (Shift+Enter 换行, Enter 发送)"
            @keydown.enter.exact="handleSendMessage"
            @keydown.shift.enter="insertNewline"
          ></textarea>
          <div class="but-group">
            <button v-if="agentStore.messageLoading && isSending" class="stop-btn" @click="handleStopGeneration">
              <span class="send-icon">⏳</span>
              </button>
            <button v-else :disabled="!inputMessage.trim() || isSending" class="send-btn" @click="handleSendClick">
            <span v-if="!isSending" class="send-icon">⬆</span>
            <span v-else class="send-icon" >⚡</span>
          </button>
          </div>
        </div>
      </div>
    </div>
  </ChatLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useAgentStore } from '../stores/agent'
import { useAuthStore } from '../stores/auth'
import ChatLayout from '../layouts/ChatLayout.vue'
import { ElMessage } from 'element-plus'

const agentStore = useAgentStore()
const authStore = useAuthStore()

const inputMessage = ref('')
const messageContainer = ref<HTMLElement | null>(null)
const messageInputRef = ref<HTMLTextAreaElement | null>(null)
const isSending = ref(false)
// 监听页面卸载事件，停止生成
const handleBeforeUnload = () => {
  agentStore.stopGeneration();
};
onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload);
})

onUnmounted(() => {
  // 组件卸载时清理所有打字机效果
  agentStore.clearTypingEffects()
  handleBeforeUnload() // 停止生成
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInMs = now.getTime() - timestamp
  const diffInMinutes = Math.floor(diffInMs / 60000)

  if (diffInMinutes < 1) {
    return '刚刚'
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} 分钟前`
  } else if (diffInMinutes < 1440) {
    return `${Math.floor(diffInMinutes / 60)} 小时前`
  } else {
    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
}

function insertNewline(event: KeyboardEvent) {
  event.preventDefault()
  inputMessage.value += '\n'
}

function handleSendClick() {
  handleSendMessage()
}

// async function startNewConversation() {
//   if (!authStore.user?.id) {
//     ElMessage.warning('请先登录')
//     return
//   }
//   // 清除当前会话以触发创建新会话
//   agentStore.setCurrentSession(null as unknown as number)
//   await nextTick()
//   messageInputRef.value?.focus()
// }
function handleStopGeneration() {
  agentStore.stopGeneration()
  agentStore.clearTypingEffects() // 停止生成时清除打字机效果
  agentStore.messageLoading = false // 停止生成时重置消息加载状态
  isSending.value = false
}
async function handleSendMessage(event?: KeyboardEvent) {
  if (event && event.shiftKey) {
    return // Shift+Enter 换行，不发送
  }

  if (event) {
    event.preventDefault()
  }

  // 检查用户是否登录
  if (!authStore.user?.id) {
    ElMessage.warning('请先登录后再发送消息')
    return
  }

  const message = inputMessage.value.trim()
  if (!message) {
    return
  }

  isSending.value = true
  agentStore.messageLoading = true // 开始发送消息，设置加载状态
  agentStore.clearTypingEffects() // 发送新消息前清除所有打字机效果

  try {
    const userMsg = await agentStore.sendUserMessage(authStore.user.id, message)
    // 发送消息后立即清空输入框并滚动到底部
    inputMessage.value = ''
    await scrollToBottom()

    // 延迟后生成助手回复
    setTimeout(async () => {
      try {
        const sessionId = agentStore.currentSessionId
        if (sessionId) {
          await agentStore.generateAssistantMessage(authStore.user!.id, sessionId, userMsg)
          await scrollToBottom()
        }
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : '生成回复失败'
        console.error('generateAssistantMessage failed', e)
        ElMessage.error(errMsg)
      } finally {
        isSending.value = false
        agentStore.messageLoading = false
      }
    }, 800)
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : '发送消息失败'
    console.error('sendUserMessage failed', e)
    ElMessage.error(errMsg)
    isSending.value = false
    agentStore.messageLoading = false
  }
}

async function scrollToBottom() {
  await nextTick()
  if (messageContainer.value) {
    messageContainer.value.scrollTop = messageContainer.value.scrollHeight
  }
}

// 自动滚动：当 store 中的消息列表变化时，等待 DOM 更新后滚动到底部
watch(
  () => agentStore.currentMessages.length,
  async () => {
    await nextTick()
    if (messageContainer.value) {
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight
    }
  }
)
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
}

/* 聊天头部 */
.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #e5e5e5;
  background: white;
  flex-shrink: 0;
}

.chat-header h2 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 6px 12px;
  background: #f5f5f5;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
}

.action-btn:hover:not(:disabled) {
  background: #efefef;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 消息区域 */
.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: white;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
  color: #666;
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 13px;
  color: #999;
}

/* 消息项 */
.message-item {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-item.is-user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  color: white;
  flex-shrink: 0;
}

.message-avatar.user {
  background: #10a37f;
}

.message-avatar.assistant {
  background: #6366f1;
}

.message-content {
  flex: 1;
  max-width: 70%;
}

.message-item.is-user .message-content {
  display: flex;
  justify-content: flex-end;
}

.message-bubble {
  padding: 12px 16px;
  border-radius: 12px;
  background: #f0f0f0;
  word-wrap: break-word;
  white-space: pre-wrap;
}
.status-tip {
  font-size: 12px;
  color: #999;
  margin-left: 8px;
}

.message-item.is-user .message-bubble {
  background: #10a37f;
  color: white;
}

.message-item.is-assistant .message-bubble {
  background: #f0f0f0;
  color: #333;
}

.message-text {
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 4px;
}

.message-time {
  font-size: 12px;
  opacity: 0.7;
  margin-top: 4px;
}

.message-item.is-user .message-time {
  text-align: right;
}

/* 输入区域 */
.chat-input-area {
  padding: 16px 24px;
  border-top: 1px solid #e5e5e5;
  background: white;
  flex-shrink: 0;
}

.input-wrapper {
  display: flex;
  gap: 10px;
  align-items: flex-end;
}

.message-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  resize: none;
  max-height: 120px;
  line-height: 1.5;
  transition: border-color 0.2s;
}

.message-input:focus {
  outline: none;
  border-color: #10a37f;
  box-shadow: 0 0 0 2px rgba(16, 163, 127, 0.1);
}

.message-input::placeholder {
  color: #999;
}

.send-btn {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: #10a37f;
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition: all 0.2s;
  flex-shrink: 0;
}

.send-btn:hover:not(:disabled) {
  background: #0d8a6f;
  transform: translateY(-2px);
}

.send-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.send-icon {
  display: inline-block;
}

/* 没有对话状态 */
.no-conversation {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
}

.no-conversation-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.no-conversation-text {
  font-size: 16px;
  color: #666;
  margin-bottom: 8px;
}

.no-conversation-hint {
  font-size: 13px;
  color: #999;
}

/* 滚动条美化 */
.messages-area::-webkit-scrollbar {
  width: 6px;
}

.messages-area::-webkit-scrollbar-track {
  background: transparent;
}

.messages-area::-webkit-scrollbar-thumb {
  background: #d4d4d4;
  border-radius: 3px;
}

.messages-area::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
.button-group {
  display: flex;
  align-items: center;
  margin-left: 8px;
}

/* 红色正方形停止按钮，类似 ChatGPT 风格 */
.stop-btn {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  background: #212121; /* 或者用红色 #ef5350 */
  border: 1px solid #424242;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.stop-btn:hover {
  background: #f44336;
  border-color: #f44336;
}
</style>