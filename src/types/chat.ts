/**
 * Chat API 相关的 TypeScript 类型定义
 */

// ==================== 会话类型 ====================

/**
 * 会话基本信息
 */
export interface Session {
  id: number
  user_id: number
  title: string
  token: string
  model_name?: string
  system_prompt?: string
  is_archived: boolean
  created_at: string
  updated_at: string
}

/**
 * 创建会话请求
 */
export interface CreateSessionRequest {
  user_id: number
  title?: string
  model_name?: string
  system_prompt?: string
}

/**
 * 更新会话请求
 */
export interface UpdateSessionRequest {
  session_id: number
  user_id: number
  title?: string
  model_name?: string
  system_prompt?: string
  is_archived?: boolean
}

/**
 * 会话响应（单个）
 */
export interface SessionResponse extends Session {
  message_count?: number
  last_message?: string
  last_message_time?: string
}

/**
 * 会话响应（包含消息）
 */
export interface SessionWithMessages extends SessionResponse {
  messages: Message[]
}

/**
 * 会话列表响应
 */
export interface SessionListResponse {
  items: SessionResponse[]
  total: number
  skip: number
  limit: number
}

// ==================== 消息类型 ====================

/**
 * 消息角色类型
 */
export type MessageRole = 'user' | 'assistant' | 'system'

/**
 * 消息类型
 */
export type MessageType = 'user' | 'assistant' | 'system'

/**
 * 消息基本信息
 */
export interface Message {
  id: number
  session_id: number
  user_id: number
  role: MessageRole
  content: string
  message_type: MessageType
  model_name?: string
  is_deleted: boolean
  created_at: string
  updated_at: string
  status?: string
}


  // sessionId: number,
  // userId: number,
  // role: string,
  // content: string,
  // messageType: 'user' | 'assistant' | 'system',
  // modelName?: string

/**
 * 创建消息请求
 */
export interface CreateMessageRequest {
  session_id: number
  user_id: number
  role: MessageRole
  content: string
  message_type: MessageType
  model_name?: string
}

/**
 * 消息响应
 */
export interface MessageResponse extends Message {}

/**
 * 消息列表响应
 */
export interface MessageListResponse {
  items: MessageResponse[]
  total: number
  skip: number
  limit: number
}

// ==================== API 查询参数类型 ====================

/**
 * 获取会话列表查询参数
 */
export interface GetSessionsParams {
  user_id: number
  skip?: number
  limit?: number
  include_archived?: boolean
}

/**
 * 搜索会话查询参数
 */
export interface SearchSessionsParams {
  user_id: number
  query: string
  skip?: number
  limit?: number
}

/**
 * 获取会话消息查询参数
 */
export interface GetMessagesParams {
  user_id: number
  skip?: number
  limit?: number
}

// ==================== 响应类型 ====================

/**
 * API 标准响应
 */
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

/**
 * API 错误响应
 */
export interface ApiError {
  detail: string
  status_code: number
}

// ==================== 业务逻辑类型 ====================

/**
 * 聊天状态
 */
export interface ChatState {
  currentSessionId: number | null
  sessions: SessionResponse[]
  messages: MessageResponse[]
  loading: boolean
  error: string | null
}

/**
 * 消息组
 */
export interface MessageGroup {
  date: string
  messages: Message[]
}

/**
 * 会话统计
 */
export interface SessionStats {
  totalSessions: number
  archivedSessions: number
  totalMessages: number
  lastSessionTime: string
}

/**
 * 搜索结果
 */
export interface SearchResult {
  sessions: SessionResponse[]
  total: number
}

// ==================== 前端使用的辅助类型 ====================

/**
 * 会话表单数据（用于创建/编辑）
 */
export interface SessionFormData {
  title: string
  modelName?: string
  systemPrompt?: string
}

/**
 * 消息输入数据
 */
export interface MessageInput {
  content: string
  role?: MessageRole
}

/**
 * 分页参数
 */
export interface PaginationParams {
  skip: number
  limit: number
}

/**
 * UI 状态
 */
export interface UIState {
  isLoading: boolean
  isSending: boolean
  isDeleting: boolean
  selectedSessionId: number | null
  showArchived: boolean
}

export interface ChatWithAgentParams {
  sessionId: number
  userId: number
  message: string
  modelName?: string
  session_token?: string
}
