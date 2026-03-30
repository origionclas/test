import request from '../utils/request'
import { CreateMessageRequest} from '../types/chat'
/**
 * ==================== 会话相关 API ====================
 */

/**
 * 创建新会话
 * @param userId - 用户ID
 * @param title - 会话标题
 * @param modelName - 使用的模型名称（可选）
 * @param systemPrompt - 系统提示词（可选）
 * 
 * 后端: POST /api/chat/sessions
 * 请求体: { user_id, title?, model_name?, system_prompt? }
 */
export function createSession(
  userId: number,
  title?: string,
  modelName?: string,
  systemPrompt?: string
) {
  return request.post('/chat/sessions', {
    user_id: userId,
    title:title,
    model_name: modelName,
    system_prompt: systemPrompt,
  })
}

/**
 * 获取用户的所有会话列表
 * @param userId - 用户ID
 * @param skip - 跳过的记录数（分页）
 * @param limit - 返回的最大记录数
 * @param includeArchived - 是否包含已归档的会话
 * 
 * 后端: GET /api/chat/sessions?user_id={userId}&skip={skip}&limit={limit}&include_archived={includeArchived}
 */
export function getUserSessions(
  userId: number,
  skip: number = 0,
  limit: number = 20,
  includeArchived: boolean = false
) {
  return request.get('/chat/sessions', {
    params: {
      user_id: userId,
      skip,
      limit,
      include_archived: includeArchived,
    },
  })
}

/**
 * 搜索会话（在标题和消息内容中搜索）
 * @param userId - 用户ID
 * @param query - 搜索关键词
 * @param skip - 跳过的记录数（分页）
 * @param limit - 返回的最大记录数
 * 
 * 后端: GET /api/chat/sessions/search?user_id={userId}&query={query}&skip={skip}&limit={limit}
 */
export function searchSessions(
  userId: number,
  query: string,
  skip: number = 0,
  limit: number = 20
) {
  return request.get('/chat/sessions/search', {
    params: {
      user_id: userId,
      query,
      skip,
      limit,
    },
  })
}

/**
 * 获取会话及其所有历史消息
 * @param sessionId - 会话ID
 * @param userId - 用户ID
 * 
 * 后端: GET /api/chat/sessions/{session_id}?user_id={userId}
 */
export function getSessionWithHistory(
  sessionId: number,
  userId: number
) {
  return request.get(`/chat/sessions/${sessionId}`, {
    params: {
      user_id: userId,
    },
  })
}

/**
 * 获取会话基本信息（不包括消息）
 * @param sessionId - 会话ID
 * @param userId - 用户ID
 * 
 * 后端: GET /api/chat/sessions/{session_id}/info?user_id={userId}
 */
export function getSessionInfo(
  sessionId: number,
  userId: number
) {
  return request.get(`/chat/sessions/${sessionId}/info`, {
    params: {
      user_id: userId,
    },
  })
}

/**
 * 更新会话信息
 * @param sessionId - 会话ID
 * @param userId - 用户ID
 * @param title - 新的会话标题（可选）
 * @param modelName - 新的模型名称（可选）
 * @param systemPrompt - 新的系统提示词（可选）
 * @param isArchived - 是否归档（可选）
 * 
 * 后端: PUT /api/chat/sessions/{session_id}
 * 请求体: { session_id, user_id, title?, model_name?, system_prompt?, is_archived? }
 */
export function updateSession(
  sessionId: number,
  userId: number,
  data: {
    title?: string
    modelName?: string
    systemPrompt?: string
    isArchived?: boolean
  }
) {
  return request.put(`/chat/sessions/${sessionId}`, {
    session_id: sessionId,
    user_id: userId,
    title: data.title,
    model_name: data.modelName,
    system_prompt: data.systemPrompt,
    is_archived: data.isArchived,
  })
}

/**
 * 软删除会话及其所有消息
 * @param sessionId - 会话ID
 * @param userId - 用户ID
 * 
 * 后端: DELETE /api/chat/sessions/{session_id}?user_id={userId}
 * 返回: 204 No Content
 */
export function deleteSession(
  sessionId: number,
  userId: number
) {
  return request.delete(`/chat/sessions/${sessionId}`, {
    params: {
      user_id: userId,
    },
  })
}
/**
 * 硬删除会话及其所有消息
 */
export function hardDeleteSession(
  sessionId: number,
  userId: number
) {
  return request.delete(`/chat/session/hard/${sessionId}`, {
    params: {
      user_id: userId,
    },
  })
}

/**
 * 归档会话
 * @param sessionId - 会话ID
 * @param userId - 用户ID
 * 
 * 后端: PUT /api/chat/sessions/{session_id}/archive?user_id={userId}
 */
export function archiveSession(
  sessionId: number,
  userId: number
) {
  return request.put(`/chat/sessions/${sessionId}/archive`, {}, {
    params: {
      user_id: userId,
    },
  })
}

/**
 * ==================== 消息相关 API ====================
 */

/**
 * 向会话中添加新消息
 * @param sessionId - 会话ID
 * @param userId - 用户ID
 * @param role - 消息角色
 * @param content - 消息内容
 * @param messageType - 消息类型（user/assistant/system）
 * @param modelName - 使用的模型名称（可选）
 * 
 * 后端: POST /api/chat/sessions/{session_id}/messages?user_id={userId}
 * 请求体: { session_id, role, content, message_type, model_name? }
 */
export function createMessage(data: CreateMessageRequest) {
  return request.post(`/chat/sessions/${data.session_id}/messages`, {
    session_id: data.session_id,
    user_id: data.user_id,
    role: data.role,
    content: data.content,
    message_type: data.message_type,
    model_name: data.model_name,
  })
}

/**
 * 获取会话中的所有消息
 * @param sessionId - 会话ID
 * @param userId - 用户ID
 * @param skip - 跳过的记录数（分页）
 * @param limit - 返回的最大记录数
 * 
 * 后端: GET /api/chat/sessions/{session_id}/messages?user_id={userId}&skip={skip}&limit={limit}
 */
export function getSessionMessages(
  sessionId: number,
  userId: number,
  skip: number = 0,
  limit: number = 50
) {
  return request.get(`/chat/sessions/${sessionId}/messages`, {
    params: {
      user_id: userId,
      skip,
      limit,
    },
  })
}

/**
 * 获取单个消息
 * @param messageId - 消息ID
 * @param userId - 用户ID
 * 
 * 后端: GET /api/chat/messages/{message_id}?user_id={userId}
 */
export function getMessage(
  messageId: number,
  userId: number
) {
  return request.get(`/chat/messages/${messageId}`, {
    params: {
      user_id: userId,
    },
  })
}

/**
 * 删除消息（软删除）
 * @param messageId - 消息ID
 * @param userId - 用户ID
 * 
 * 后端: DELETE /api/chat/messages/{message_id}?user_id={userId}
 * 返回: 204 No Content
 */
export function deleteMessage(
  messageId: number,
  userId: number
) {
  return request.delete(`/chat/messages/${messageId}`, {
    params: {
      user_id: userId,
    },
  })
}

/**
 * 删除用户的所有会话
 * @param userId - 用户ID
 * 
 * 后端: DELETE /api/chat/sessions?user_id={userId}
 */
export function deleteAllSessions(userId: number) {
  return request.delete(`/chat/sessions/hard/${userId}`)
}
/**
 * 聊天接口
 */
export async function connectToChat(
  url: string,
  data: any,
  handleStreamEvent: (eventData: any) => void,
  signal?: AbortSignal
) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    signal: signal,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  // 监听 abort 事件，主动取消 reader
  const abortHandler = () => {
    reader.cancel().catch(() => {});
  };
  signal?.addEventListener('abort', abortHandler);

  try {
    while (true) {
      // 检查是否已经 abort
      if (signal?.aborted) break;

      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value, { stream: false });
      const lines = text.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6).trim();

          if (dataStr === '[DONE]') {
            return;
          }

          if (dataStr && dataStr.startsWith('{')) {
            try {
              const json = JSON.parse(dataStr);
              handleStreamEvent(json);
            } catch (error) {
              console.error('Parse error:', dataStr, error);
            }
          }
        }
      }
    }
  } catch (error: any) {
    // abort 导致的错误直接忽略
    if (error?.name === 'AbortError') {
      return;
    }
    throw error;
  } finally {
    signal?.removeEventListener('abort', abortHandler);
    reader.releaseLock();
  }
}



