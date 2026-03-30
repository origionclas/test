import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { Session, Message as APIMessage,CreateMessageRequest} from '@/types/chat'
import { createSession, connectToChat,createMessage } from '@/api/agent'
/** 用户信息（后端返回的格式） */
export interface User {
  id: number
  username: string
  email?: string
  avatar?: string
  is_active?: boolean
}

/** 会话信息（对应后端 Session 模型） */
export interface Conversation extends Session {
  // 扩展 Session 类型，添加本地 UI 状态
}

/** 消息信息（对应后端 Message 模型） */
export interface Message extends APIMessage {
  // 扩展 APIMessage 类型，添加本地 UI 状态
}

// Agent Store：管理会话和消息状态，只负责getting和setting状态，不负责调用API
export const useAgentStore = defineStore('agent', () => {
  // 会话列表 - 从后端 getUserSessions 加载
  const sessions = ref<Session[]>([])

  // 消息列表 - 从后端 getSessionWithHistory 加载
  const messages = ref<APIMessage[]>([])

  // 临时id
  const tempId = ref<number>(0)
  // 当前选中的会话 ID
  const currentSessionId = ref<number | null>(0)

  // 加载状态
  const loading = ref(false)
  const messageLoading = ref(false)

  // 打字机效果相关
  const typingTimers = ref<Map<number, number>>(new Map())
  const messageBuffers = ref<Map<number, string>>(new Map())

  // 计算属性：当前会话
  // 计算属性何时更新：当 currentSessionId.value 或 sessions.value 变化时重新计算
  const currentSession = computed(() => {
    return sessions.value.find(s => s.id === currentSessionId.value)
  })
  // 中断控制器
  const abortController = ref<AbortController | null>(null);

  // 监听会话切换，清理副作用（不能在 computed 里做副作用）
  watch(currentSessionId, (newId, oldId) => {
    if (newId !== oldId) {
      tempId.value = 0;
      clearTypingEffects()
      stopGeneration()
    }
  })

  // 计算属性：当前会话的消息（按时间排序）
  // 计算属性何时更新：当 messages.value 变化时重新计算
  const currentMessages = computed(() => {
    return messages.value.sort((a, b) => {
      const timeA = new Date(a.created_at || 0).getTime()
      const timeB = new Date(b.created_at || 0).getTime()
      return timeA - timeB
    })
  })

  function seTempId(temp: number) {
      return tempId.value = temp;
  }

  /**
   * 设置当前会话
   * 注意：这只是更新本地状态，不调用 API
   * 组件应该调用 getSessionWithHistory() 来加载消息
   */
  function setCurrentSessionId(sessionId: number) {
    currentSessionId.value = sessionId

  }


  /**
   * 设置会话列表
   * API 调用 getUserSessions 后调用这个方法
   */
  function setSessions(data: Session[]) {
    sessions.value = data
  }
  /**
   * 获取会话列表
   */
  function getSessions() {
    return sessions.value
  }

  /**
   * 设置消息列表
   * API 调用 getSessionWithHistory 后调用这个方法
   */
  function setMessages(data: APIMessage[]) {
    messages.value = []
    messages.value = data
  }

  /**
   * 添加消息到列表（创建消息后）
   * API 调用 createMessage 后调用这个方法
   */
  function addMessage(message: APIMessage) {
    messages.value.push(message)
    // 更新会话的 message_count
    const session = sessions.value.find(s => s.id === message.session_id)
    if (session) {
      // session.message_count = (session.message_count || 0) + 1
    }
  }

  /**
   * 删除消息
   * API 调用 deleteMessage 后调用这个方法
   */ 
  function removeMessage(messageId: number) {
    messages.value = messages.value.filter(m => m.id !== messageId)
    // 更新会话的 message_count
    const session = sessions.value.find(s => s.id === currentSessionId.value)
    if (session) {
      // session.message_count = Math.max(0, (session.message_count || 0) - 1)
    }
  }

  /**
   * 删除会话
   * API 调用 deleteSession 后调用这个方法
   */
  function removeSession(sessionId: number) {
    sessions.value = sessions.value.filter(s => s.id !== sessionId)
    if (currentSessionId.value === sessionId) {
      currentSessionId.value = sessions.value[0]?.id || null
      messages.value = []
    }
  }

  /**
   * 清空所有会话(全部清理)
   * API 调用 deleteAllSessions 后调用这个方法
   */
  function clearAllSessionsAndMsg() {
    sessions.value = []
    currentSessionId.value = 0
    messages.value = []
    tempId.value = 0;
    stopGeneration()
    clearTypingEffects()
    messageLoading.value = false

  }

  /**
   * 重命名会话
   * 直接更新本地会话标题
   */
  function renameSession(sessionId: number, newTitle: string) {
    const session = sessions.value.find(s => s.id === sessionId)
    if (session) {
      session.title = newTitle
    }
  }

  /**
   * 更新会话信息
   * API 调用 updateSession 后调用这个方法
   */
  function updateSession(sessionId: number, updates: Partial<Session>) {
    const session = sessions.value.find(s => s.id === sessionId)
    if (session) {
      Object.assign(session, updates)
    }
  }

  /**
   * 清空状态（登出时调用）
   */
  function clearAll() {
    // 清理所有打字机定时器
    typingTimers.value.forEach(timer => clearInterval(timer))
    typingTimers.value.clear()
    messageBuffers.value.clear()

    sessions.value = []
    messages.value = []
    currentSessionId.value = null
  }

  /**
   * 清理打字机效果（切换会话时调用）
   */
  function clearTypingEffects() {
    typingTimers.value.forEach(timer => clearInterval(timer))
    typingTimers.value.clear()
    messageBuffers.value.clear()
  }

  /**
   * 创建新会话或使用现有会话，然后发送用户消息
   * 
   * @param userId - 用户ID
   * @param messageContent - 消息内容
   * @param sessionTitle - 会话标题（仅创建新会话时使用）
   */
  async function sendUserMessage(userId: number, sessionTitle: string = '新对话') {
    if (!userId || userId <= 0) {
      throw new Error('用户未登录或 userId 无效')
    }

    let sessionId = currentSessionId.value
    
    // 如果没有当前会话，创建新会话
    if (sessionId === null || sessionId === 0) {
      try {
        const resp = await createSession(userId, sessionTitle)
        const newSession = resp.data
        sessions.value.push(newSession)
        setCurrentSessionId(newSession.id)
        sessionId = newSession.id
      } catch (error) {
        throw new Error(`创建会话失败: ${error instanceof Error ? error.message : '未知错误'}`)
      }
    }
    // 添加消息api
    if (!sessionId) {
      throw new Error('会话ID无效')
    }

    try {
      const messageData: CreateMessageRequest = {
        session_id: sessionId,
        user_id: userId,
        role: 'user',
        content: sessionTitle,
        message_type: 'user',
      }
      const resp = await createMessage(messageData)
      const newMessage = resp.data
      addMessage(newMessage)
      return newMessage
    } catch (error) {
      throw new Error(`发送消息失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

    const handleStreamEvent = (data :any) => {
        switch (data.type) {
            case 'content':
                // 显示 AI 回复内容
                appendMessage(data.content,tempId.value);
                break;
            case 'tool_start':
                // 显示工具调用状态
                showToolStatus(`正在调用: ${data.tool}`,tempId.value);
                break;
            case 'tool_query':
                // 显示工具查询状态
                showToolStatus(`工具查询: ${data.query}`,tempId.value);
                break;
            case 'tool_error':
                // 显示工具错误 
                showToolError(data.error,tempId.value);
                break;
            case 'tool_end':
                // 工具调用完成
                hideToolStatus(tempId.value,data.tool);
                break;
            case 'end':
                // 消息已保存，可以更新 UI
                updateMessageId(data.id,tempId.value);
                break;
            case 'done':
                // 响应完成，清理状态
                clearMessage(tempId.value);
                break;
            case 'error':
                // 显示错误
                showError(data.error,tempId.value);
                break;
            default:
                console.warn('未知数据类型:', data.type);
                break;
        }
    };

    // 处理流式响应的辅助函数
    const appendMessage = (content: string, tempId: number) => {
      // 将内容添加到缓冲区
      const currentBuffer = messageBuffers.value.get(tempId) || '';
      messageBuffers.value.set(tempId, currentBuffer + content);

      // 如果还没有启动打字机效果，启动它
      if (!typingTimers.value.has(tempId)) {
        startTypingEffect(tempId);
      }
    };

    // 打字机效果函数
    const startTypingEffect = (tempId: number) => {
      const msg = messages.value.find(m => m.id === tempId);
      if (!msg) return;

      let currentIndex = 0;

      const timer = window.setInterval(() => {
        const buffer = messageBuffers.value.get(tempId) || '';

        // 如果缓冲区有内容，逐字显示
        if (currentIndex < buffer.length) {
          // 每次显示 2 个字符，让效果更流畅
          const charsToAdd = Math.min(2, buffer.length - currentIndex);
          msg.content = buffer.substring(0, currentIndex + charsToAdd);
          currentIndex += charsToAdd;
        }

        // 如果已经显示完所有内容且状态不是generating，清理定时器
        if (currentIndex >= buffer.length && msg.status !== 'generating') {
          clearInterval(timer);
          typingTimers.value.delete(tempId);
          messageBuffers.value.delete(tempId);
        }
      }, 30); // 每 30ms 显示一次，可以调整速度

      typingTimers.value.set(tempId, timer);
    };
    const showToolStatus = (_status: string, tempId: number) => {
      const msg = messages.value.find(m => m.id === tempId);
      if (msg) {
        // 非 content 数据片段不写入消息正文
        msg.status = 'generating';
      }
    }
    const hideToolStatus = (tempId: number, _status: string) => {
      const msg = messages.value.find(m => m.id === tempId);
      if (msg) {
        // 非 content 数据片段不写入消息正文
        msg.status = 'generating';
      }
    }
    const updateMessageId = (newId: number, temptId: number) => {
      const msg = messages.value.find(m => m.id === temptId);
      if (msg) {
          // 只更新消息的ID，不清理定时器和缓冲区
          // 让打字机效果继续使用原始的 temptId 运行
          msg.id = newId;
          tempId.value = 0;
          msg.status = 'done';
          // 注意：不清理 typingTimers 和 messageBuffers，让打字机效果自然完成
      }
    }
    const showToolError = (_error: string, temptId: number) => {
      const msg = messages.value.find(m => m.id === temptId);
      if (msg) {
          // 非 content 数据片段不写入消息正文
          msg.status = 'generating';
      }
    }
    const showError = (error: string, temptId: number) => {
      const msg = messages.value.find(m => m.id === temptId);
      if (msg) {
          // 需要放入缓冲区吗？错误可能发生在内容生成过程中，放入缓冲区可以让错误信息也有打字机效果
          messageBuffers.value.set(temptId, (messageBuffers.value.get(temptId) || '') + `\n\n[错误]: ${error}`);
          msg.status = 'error';
          tempId.value = 0;

          // 清理定时器和缓冲区
          const timer = typingTimers.value.get(temptId);
          if (timer) {
              clearInterval(timer);
              typingTimers.value.delete(temptId);
          }
          messageBuffers.value.delete(temptId);
      }
    }
    const clearMessage = (temptId: number) => {
      const msg = messages.value.find(m => m.id === temptId);
      if (msg) {
          tempId.value = 0;
          msg.status = ''; // 标记为非 generating，打字机效果会自然完成后清理
          // 不直接赋值 msg.content，让打字机定时器继续把缓冲区内容逐字显示完
      }
    }

   async function stopGeneration() {
    // 先调用后端取消接口
    if (currentSession.value?.id) {
      await fetch(`/api/talk/cancel/${currentSession.value.id}`, { method: 'POST' })
            .catch(() => {});
    }
    // 再 abort 前端请求
    if (abortController.value) {
        abortController.value.abort();
        abortController.value = null;
        messageLoading.value = false;
    }
    const msg = messages.value.find(m => m.id === tempId.value);
    if (msg) {
        // msg.content = (messageBuffers.value.get(tempId.value) || msg.content) + '\n\n[已停止]';
        const buffer = messageBuffers.value.get(tempId.value);
        if (buffer) {
         messageBuffers.value.set(tempId.value, buffer + '\n\n[已停止]');
        }
        msg.status = 'stopped';
    }
}


  /**
   * 生成助手回复（暂时使用模拟数据，可替换为真实 API）
   * @param userId - 用户ID
   * @param sessionId - 会话ID
   * @param userMessageContent - 用户消息内容（用于生成上下文）
   */
  async function generateAssistantMessage(userId: number, sessionId: number, messageData: CreateMessageRequest) {
    if (!userId || userId <= 0) {
      throw new Error('用户未登录或 userId 无效')
    }

    // TODO: 当后端提供生成接口时，替换为真实 API 调用
    try {
      abortController.value = new AbortController();
      // 生成临时id
      seTempId(Date.now())
        const msg: APIMessage = {
        session_id: sessionId,
        id: tempId.value,
        role: 'assistant',
        content:'',
        message_type: 'assistant',
        user_id: userId,
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        model_name: 'default-model',
        status: 'generating',
      }
      messages.value.push(msg)
      const requestData = {
          session_id: messageData.session_id,
          session_token: currentSession.value?.token || '',
          user_id: messageData.user_id,
          message: messageData.content,
          model_name: messageData.model_name || 'default-model',
        }
        console.log('requestData:',requestData);
      // 连接到后端聊天流式响应（必须 await，否则 messageLoading 会立即变 false）
      await connectToChat('/api/talk/stream', requestData, handleStreamEvent, abortController.value?.signal);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return; // 用户主动停止，不抛出错误
      }
      throw new Error(`生成回复失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      messageLoading.value = false
      abortController.value = null
    }  
  }

  return {
    // 状态
    sessions,
    messages,
    currentSessionId,
    loading,
    messageLoading,

    // 计算属性
    currentSession,
    currentMessages,

    // 方法
    seTempId,
    setCurrentSessionId,
    setSessions,
    getSessions,
    setMessages,
    addMessage,
    removeMessage,
    removeSession,
    renameSession,
    updateSession,
    clearAllSessionsAndMsg,
    clearAll,
    clearTypingEffects,
    sendUserMessage,
    generateAssistantMessage,
    stopGeneration,
  }
})
