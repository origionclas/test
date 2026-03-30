"""
后端接口与前端函数对应关系
这是一个图形化的参考，用于快速理解接口对应
"""

# ============================================================

# 会话操作流程

# ============================================================

创建会话流程：
┌─────────────────────────────────────────────────────────┐
│ 前端：createSession(userId, title?, modelName?, prompt) │
├─────────────────────────────────────────────────────────┤
│ HTTP: POST /api/chat/sessions │
├─────────────────────────────────────────────────────────┤
│ 后端参数： │
│ - request.user_id │
│ - request.title (可选) │
│ - request.model_name (可选) │
│ - request.system_prompt (可选) │
├─────────────────────────────────────────────────────────┤
│ 返回：SessionResponse │
└─────────────────────────────────────────────────────────┘

获取会话列表流程：
┌─────────────────────────────────────────────────────────┐
│ 前端：getUserSessions(userId, skip?, limit?, archived?) │
├─────────────────────────────────────────────────────────┤
│ HTTP: GET /api/chat/sessions? │
│ user_id={userId} │
│ &skip={skip} │
│ &limit={limit} │
│ &include_archived={archived} │
├─────────────────────────────────────────────────────────┤
│ 后端参数： │
│ - user_id: int = Query(...) │
│ - skip: int = Query(0) │
│ - limit: int = Query(20) │
│ - include_archived: bool = Query(False) │
├─────────────────────────────────────────────────────────┤
│ 返回：List[SessionResponse] │
└─────────────────────────────────────────────────────────┘

搜索会话流程：
┌─────────────────────────────────────────────────────────┐
│ 前端：searchSessions(userId, query, skip?, limit?) │
├─────────────────────────────────────────────────────────┤
│ HTTP: GET /api/chat/sessions/search? │
│ user_id={userId} │
│ &query={query} │
│ &skip={skip} │
│ &limit={limit} │
├─────────────────────────────────────────────────────────┤
│ 后端参数： │
│ - user_id: int = Query(...) │
│ - query: str = Query(..., min_length=1) │
│ - skip: int = Query(0) │
│ - limit: int = Query(20) │
├─────────────────────────────────────────────────────────┤
│ 返回：List[SessionResponse] │
└─────────────────────────────────────────────────────────┘

获取会话及历史消息流程：
┌─────────────────────────────────────────────────────────┐
│ 前端：getSessionWithHistory(sessionId, userId) │
├─────────────────────────────────────────────────────────┤
│ HTTP: GET /api/chat/sessions/{sessionId}? │
│ user_id={userId} │
├─────────────────────────────────────────────────────────┤
│ 后端参数： │
│ - session_id: int (路径参数) │
│ - user_id: int = Query(...) │
├─────────────────────────────────────────────────────────┤
│ 返回：SessionWithMessages │
│ { │
│ "id": 123, │
│ "title": "...", │
│ "messages": [...] │
│ } │
└─────────────────────────────────────────────────────────┘

获取会话基本信息流程：
┌─────────────────────────────────────────────────────────┐
│ 前端：getSessionInfo(sessionId, userId) │
├─────────────────────────────────────────────────────────┤
│ HTTP: GET /api/chat/sessions/{sessionId}/info? │
│ user_id={userId} │
├─────────────────────────────────────────────────────────┤
│ 后端参数： │
│ - session_id: int (路径参数) │
│ - user_id: int = Query(...) │
├─────────────────────────────────────────────────────────┤
│ 返回：SessionResponse (不含消息) │
└─────────────────────────────────────────────────────────┘

更新会话信息流程：
┌─────────────────────────────────────────────────────────┐
│ 前端：updateSession(sessionId, userId, { │
│ title?, modelName?, systemPrompt?, isArchived? │
│ }) │
├─────────────────────────────────────────────────────────┤
│ HTTP: PUT /api/chat/sessions/{sessionId} │
├─────────────────────────────────────────────────────────┤
│ 请求体： │
│ { │
│ "session_id": 123, │
│ "user_id": 456, │
│ "title": "...", │
│ "model_name": "...", │
│ "system_prompt": "...", │
│ "is_archived": false │
│ } │
├─────────────────────────────────────────────────────────┤
│ 返回：SessionResponse (更新后) │
└─────────────────────────────────────────────────────────┘

删除会话流程：
┌─────────────────────────────────────────────────────────┐
│ 前端：deleteSession(sessionId, userId) │
├─────────────────────────────────────────────────────────┤
│ HTTP: DELETE /api/chat/sessions/{sessionId}? │
│ user_id={userId} │
├─────────────────────────────────────────────────────────┤
│ 后端参数： │
│ - session_id: int (路径参数) │
│ - user_id: int = Query(...) │
├─────────────────────────────────────────────────────────┤
│ 返回：204 No Content │
└─────────────────────────────────────────────────────────┘

归档会话流程：
┌─────────────────────────────────────────────────────────┐
│ 前端：archiveSession(sessionId, userId) │
├─────────────────────────────────────────────────────────┤
│ HTTP: PUT /api/chat/sessions/{sessionId}/archive? │
│ user_id={userId} │
├─────────────────────────────────────────────────────────┤
│ 后端参数： │
│ - session_id: int (路径参数) │
│ - user_id: int = Query(...) │
├─────────────────────────────────────────────────────────┤
│ 返回：SessionResponse (is_archived=true) │
└─────────────────────────────────────────────────────────┘

# ============================================================

# 消息操作流程

# ============================================================

添加消息流程：
┌─────────────────────────────────────────────────────────┐
│ 前端：createMessage( │
│ sessionId, userId, │
│ role, content, messageType, modelName? │
│ ) │
├─────────────────────────────────────────────────────────┤
│ HTTP: POST /api/chat/sessions/{sessionId}/messages? │
│ user_id={userId} │
├─────────────────────────────────────────────────────────┤
│ 请求体： │
│ { │
│ "session_id": 123, │
│ "role": "user", │
│ "content": "你好", │
│ "message_type": "user", │
│ "model_name": null │
│ } │
├─────────────────────────────────────────────────────────┤
│ 返回：MessageResponse │
│ { │
│ "id": 789, │
│ "session_id": 123, │
│ "role": "user", │
│ "content": "你好", │
│ "created_at": "2024-01-27T10:00:00" │
│ } │
└─────────────────────────────────────────────────────────┘

获取会话消息流程：
┌─────────────────────────────────────────────────────────┐
│ 前端：getSessionMessages( │
│ sessionId, userId, skip?, limit? │
│ ) │
├─────────────────────────────────────────────────────────┤
│ HTTP: GET /api/chat/sessions/{sessionId}/messages? │
│ user_id={userId} │
│ &skip={skip} │
│ &limit={limit} │
├─────────────────────────────────────────────────────────┤
│ 后端参数： │
│ - session_id: int (路径参数) │
│ - user_id: int = Query(...) │
│ - skip: int = Query(0) │
│ - limit: int = Query(50) │
├─────────────────────────────────────────────────────────┤
│ 返回：List[MessageResponse] │
└─────────────────────────────────────────────────────────┘

获取单个消息流程：
┌─────────────────────────────────────────────────────────┐
│ 前端：getMessage(messageId, userId) │
├─────────────────────────────────────────────────────────┤
│ HTTP: GET /api/chat/messages/{messageId}? │
│ user_id={userId} │
├─────────────────────────────────────────────────────────┤
│ 后端参数： │
│ - message_id: int (路径参数) │
│ - user_id: int = Query(...) │
├─────────────────────────────────────────────────────────┤
│ 返回：MessageResponse │
└─────────────────────────────────────────────────────────┘

删除消息流程：
┌─────────────────────────────────────────────────────────┐
│ 前端：deleteMessage(messageId, userId) │
├─────────────────────────────────────────────────────────┤
│ HTTP: DELETE /api/chat/messages/{messageId}? │
│ user_id={userId} │
├─────────────────────────────────────────────────────────┤
│ 后端参数： │
│ - message_id: int (路径参数) │
│ - user_id: int = Query(...) │
├─────────────────────────────────────────────────────────┤
│ 返回：204 No Content │
└─────────────────────────────────────────────────────────┘

# ============================================================

# 参数转换规则

# ============================================================

命名转换（自动处理）：
┌─────────────────────────────────────────────────────────┐
│ 前端（TypeScript） → 后端（Python） │
├─────────────────────────────────────────────────────────┤
│ userId → user_id │
│ sessionId → session_id │
│ messageId → message_id │
│ modelName → model_name │
│ systemPrompt → system_prompt │
│ messageType → message_type │
│ isArchived → is_archived │
│ includeArchived → include_archived │
└─────────────────────────────────────────────────────────┘

位置转换（必须正确处理）：
┌─────────────────────────────────────────────────────────┐
│ 后端标记 → 前端处理 → HTTP 位置 │
├─────────────────────────────────────────────────────────┤
│ {session_id} → 嵌入 URL → /sessions/123 │
│ Query(...) → params: {} → ?user_id=456 │
│ 类型注解 → 请求体 → { ... } │
└─────────────────────────────────────────────────────────┘

# ============================================================

# 函数选择决策树

# ============================================================

我想要...

1. 管理会话
   ├─ 创建新会话
   │ └─> createSession(userId, title?, modelName?, prompt?)
   │
   ├─ 查看所有会话
   │ ├─ 简单列表 → getUserSessions(userId)
   │ └─ 分页列表 → getUserSessions(userId, skip, limit)
   │
   ├─ 搜索会话
   │ └─> searchSessions(userId, query, skip?, limit?)
   │
   ├─ 查看会话
   │ ├─ 带消息 → getSessionWithHistory(sessionId, userId)
   │ └─ 仅基本信息 → getSessionInfo(sessionId, userId)
   │
   ├─ 编辑会话
   │ └─> updateSession(sessionId, userId, { title?, ... })
   │
   ├─ 删除会话
   │ └─> deleteSession(sessionId, userId)
   │
   └─ 归档会话
   └─> archiveSession(sessionId, userId)

2. 管理消息
   ├─ 发送消息
   │ └─> createMessage(
   │ sessionId, userId, role, content,
   │ messageType, modelName?
   │ )
   │
   ├─ 获取消息列表
   │ ├─ 基本列表 → getSessionMessages(sessionId, userId)
   │ └─ 分页列表 → getSessionMessages(sessionId, userId, skip, limit)
   │
   ├─ 查看单个消息
   │ └─> getMessage(messageId, userId)
   │
   └─ 删除消息
   └─> deleteMessage(messageId, userId)

# ============================================================

# 错误处理流程

# ============================================================

try {
const result = await deleteSession(sessionId, userId)
// 成功处理
ElMessage.success('删除成功')
} catch (error: unknown) {
if (error instanceof Error) {
const response = (error as any).response

    ┌─ 401 ─ 未授权
    │  └─> 跳转登录页：router.push('/login')
    │
    ├─ 403 ─ 禁止访问
    │  └─> 显示错误：ElMessage.error('无权限')
    │
    ├─ 404 ─ 资源不存在
    │  └─> 显示错误：ElMessage.error('不存在')
    │
    ├─ 500 ─ 服务器错误
    │  └─> 显示错误：ElMessage.error('服务器错误')
    │
    └─ 其他 ─ 未知错误
       └─> 显示错误：ElMessage.error(error.message)

}
}

# ============================================================

# 总结

# ============================================================

✅ 12 个 API 接口全部实现
✅ 所有参数自动转换
✅ 完整的类型定义
✅ 详细的文档说明
✅ 开箱即用，无需配置

前端导入：
import {
createSession,
getUserSessions,
searchSessions,
getSessionWithHistory,
getSessionInfo,
updateSession,
deleteSession,
archiveSession,
createMessage,
getSessionMessages,
getMessage,
deleteMessage
} from '@/api/agent'

立即开始使用！🚀
"""
