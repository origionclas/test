# 后端接口 ↔ 前端函数对应表

## 会话相关接口

| 序号 | 后端端点                          | HTTP方法 | 前端函数                | 参数                                          | 说明               |
| ---- | --------------------------------- | -------- | ----------------------- | --------------------------------------------- | ------------------ |
| 1    | `/api/chat/sessions`              | POST     | `createSession`         | `(userId, title?, modelName?, systemPrompt?)` | 创建新会话         |
| 2    | `/api/chat/sessions`              | GET      | `getUserSessions`       | `(userId, skip?, limit?, includeArchived?)`   | 获取用户所有会话   |
| 3    | `/api/chat/sessions/search`       | GET      | `searchSessions`        | `(userId, query, skip?, limit?)`              | 搜索会话           |
| 4    | `/api/chat/sessions/{id}`         | GET      | `getSessionWithHistory` | `(sessionId, userId)`                         | 获取会话及历史消息 |
| 5    | `/api/chat/sessions/{id}/info`    | GET      | `getSessionInfo`        | `(sessionId, userId)`                         | 获取会话基本信息   |
| 6    | `/api/chat/sessions/{id}`         | PUT      | `updateSession`         | `(sessionId, userId, data)`                   | 更新会话信息       |
| 7    | `/api/chat/sessions/{id}`         | DELETE   | `deleteSession`         | `(sessionId, userId)`                         | 软删除会话         |
| 8    | `/api/chat/sessions/{id}/archive` | PUT      | `archiveSession`        | `(sessionId, userId)`                         | 归档会话           |

## 消息相关接口

| 序号 | 后端端点                           | HTTP方法 | 前端函数             | 参数                                                          | 说明         |
| ---- | ---------------------------------- | -------- | -------------------- | ------------------------------------------------------------- | ------------ |
| 9    | `/api/chat/sessions/{id}/messages` | POST     | `createMessage`      | `(sessionId, userId, role, content, messageType, modelName?)` | 添加新消息   |
| 10   | `/api/chat/sessions/{id}/messages` | GET      | `getSessionMessages` | `(sessionId, userId, skip?, limit?)`                          | 获取会话消息 |
| 11   | `/api/chat/messages/{id}`          | GET      | `getMessage`         | `(messageId, userId)`                                         | 获取单个消息 |
| 12   | `/api/chat/messages/{id}`          | DELETE   | `deleteMessage`      | `(messageId, userId)`                                         | 软删除消息   |

---

## 详细参数对应

### 1. createSession

```
后端：POST /api/chat/sessions
请求体：{
  "user_id": 123,
  "title": "新会话",
  "model_name": "gpt-4",
  "system_prompt": "You are helpful..."
}

前端：createSession(123, '新会话', 'gpt-4', 'You are helpful...')
```

### 2. getUserSessions

```
后端：GET /api/chat/sessions?user_id=123&skip=0&limit=20&include_archived=false

前端：getUserSessions(123, 0, 20, false)
```

### 3. searchSessions

```
后端：GET /api/chat/sessions/search?user_id=123&query=python&skip=0&limit=20

前端：searchSessions(123, 'python', 0, 20)
```

### 4. getSessionWithHistory

```
后端：GET /api/chat/sessions/456?user_id=123

前端：getSessionWithHistory(456, 123)
```

### 5. getSessionInfo

```
后端：GET /api/chat/sessions/456/info?user_id=123

前端：getSessionInfo(456, 123)
```

### 6. updateSession

```
后端：PUT /api/chat/sessions/456
请求体：{
  "session_id": 456,
  "user_id": 123,
  "title": "新标题",
  "model_name": "gpt-4",
  "system_prompt": "...",
  "is_archived": false
}

前端：updateSession(456, 123, {
  title: '新标题',
  modelName: 'gpt-4',
  systemPrompt: '...',
  isArchived: false
})
```

### 7. deleteSession

```
后端：DELETE /api/chat/sessions/456?user_id=123

前端：deleteSession(456, 123)
```

### 8. archiveSession

```
后端：PUT /api/chat/sessions/456/archive?user_id=123

前端：archiveSession(456, 123)
```

### 9. createMessage

```
后端：POST /api/chat/sessions/456/messages?user_id=123
请求体：{
  "session_id": 456,
  "role": "user",
  "content": "你好",
  "message_type": "user",
  "model_name": null
}

前端：createMessage(456, 123, 'user', '你好', 'user', null)
```

### 10. getSessionMessages

```
后端：GET /api/chat/sessions/456/messages?user_id=123&skip=0&limit=50

前端：getSessionMessages(456, 123, 0, 50)
```

### 11. getMessage

```
后端：GET /api/chat/messages/789?user_id=123

前端：getMessage(789, 123)
```

### 12. deleteMessage

```
后端：DELETE /api/chat/messages/789?user_id=123

前端：deleteMessage(789, 123)
```

---

## HTTP 请求完整示例

### 创建会话

```http
POST /api/chat/sessions HTTP/1.1
Host: localhost:8000
Authorization: Bearer {token}
Content-Type: application/json

{
  "user_id": 123,
  "title": "Vue3 学习",
  "model_name": "gpt-4",
  "system_prompt": "You are a Vue3 expert"
}
```

### 搜索会话

```http
GET /api/chat/sessions/search?user_id=123&query=TypeScript&skip=0&limit=20 HTTP/1.1
Host: localhost:8000
Authorization: Bearer {token}
```

### 发送消息

```http
POST /api/chat/sessions/456/messages?user_id=123 HTTP/1.1
Host: localhost:8000
Authorization: Bearer {token}
Content-Type: application/json

{
  "session_id": 456,
  "role": "user",
  "content": "请解释一下 Vue3 的 Composition API",
  "message_type": "user",
  "model_name": null
}
```

### 删除会话

```http
DELETE /api/chat/sessions/456?user_id=123 HTTP/1.1
Host: localhost:8000
Authorization: Bearer {token}
```

### 更新会话

```http
PUT /api/chat/sessions/456 HTTP/1.1
Host: localhost:8000
Authorization: Bearer {token}
Content-Type: application/json

{
  "session_id": 456,
  "user_id": 123,
  "title": "Vue3 深入学习",
  "model_name": "gpt-4",
  "system_prompt": "You are a Vue3 expert",
  "is_archived": false
}
```

---

## 前端调用模式总结

### 模式 1：路径参数 + 查询参数

```typescript
// 例：删除会话
deleteSession(sessionId, userId);
// ↓
// DELETE /api/chat/sessions/{sessionId}?user_id={userId}
```

### 模式 2：查询参数

```typescript
// 例：搜索会话
searchSessions(userId, query, skip, limit);
// ↓
// GET /api/chat/sessions/search?user_id={userId}&query={query}&skip={skip}&limit={limit}
```

### 模式 3：请求体 + 路径参数 + 查询参数

```typescript
// 例：发送消息
createMessage(sessionId, userId, role, content, messageType, modelName);
// ↓
// POST /api/chat/sessions/{sessionId}/messages?user_id={userId}
// 请求体：{ session_id, role, content, message_type, model_name }
```

### 模式 4：请求体

```typescript
// 例：创建会话
createSession(userId, title, modelName, systemPrompt);
// ↓
// POST /api/chat/sessions
// 请求体：{ user_id, title, model_name, system_prompt }
```

---

## 参数位置说明

| 位置     | 后端标记       | 前端处理     | 示例                       |
| -------- | -------------- | ------------ | -------------------------- |
| URL路径  | `{session_id}` | 嵌入URL      | `/sessions/${sessionId}`   |
| 查询参数 | `Query(...)`   | `params: {}` | `params: { user_id: 123 }` |
| 请求体   | 类型注解       | 直接数据     | `{ user_id, title, ... }`  |

---

## 快速速查表

```
// 会话操作
创建     → createSession(userId, title?, model?, prompt?)
列表     → getUserSessions(userId, skip?, limit?, archived?)
搜索     → searchSessions(userId, query, skip?, limit?)
详情+消息 → getSessionWithHistory(sessionId, userId)
基本信息  → getSessionInfo(sessionId, userId)
更新     → updateSession(sessionId, userId, data)
删除     → deleteSession(sessionId, userId)
归档     → archiveSession(sessionId, userId)

// 消息操作
创建     → createMessage(sessionId, userId, role, content, type, model?)
列表     → getSessionMessages(sessionId, userId, skip?, limit?)
获取     → getMessage(messageId, userId)
删除     → deleteMessage(messageId, userId)
```

---

## 错误状态码处理

| HTTP 状态码 | 含义                  | 处理方式             |
| ----------- | --------------------- | -------------------- |
| 200         | OK                    | 请求成功             |
| 201         | Created               | 资源创建成功         |
| 204         | No Content            | 删除成功（无返回体） |
| 400         | Bad Request           | 请求参数错误         |
| 401         | Unauthorized          | 需要登录             |
| 403         | Forbidden             | 无权限操作           |
| 404         | Not Found             | 资源不存在           |
| 500         | Internal Server Error | 服务器错误           |

---

## 集成检查清单

使用 API 时检查以下几点：

- [ ] 导入了 `import { createSession, ... } from '@/api/agent'`
- [ ] 所有查询参数都在 `params` 对象中
- [ ] 路径参数正确嵌入到 URL 中
- [ ] 用户 ID 从 `authStore.user?.id` 获取
- [ ] 请求体中的参数使用了正确的命名（蛇形）
- [ ] 实现了完整的错误处理
- [ ] 添加了用户反馈消息（成功/失败）
- [ ] 异步操作使用了 `async/await`
- [ ] 依赖项正确注入（如 `authStore`）
- [ ] 测试了所有 CRUD 操作
