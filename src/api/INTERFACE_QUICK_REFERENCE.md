## 前后端接口对应速查表

### 你的问题: 后端接口如何在前端调用

```python
# 后端接口定义
def delete_session(
    session_id: int,
    user_id: int = Query(..., description="用户ID"),
    db: Session = Depends(get_db)
):
```

### 前端对应实现

```typescript
// 1️⃣ 定义 API 函数 (api/agent.ts)
export function deleteSession(sessionId: number, userId: number) {
  return request.delete(`/chat/sessions/${sessionId}`, {
    params: {
      userId, // 查询参数，会被转换为 ?userId=456
    },
  });
}

// 2️⃣ 在组件中调用 (layouts/ChatLayout.vue)
async function handleDeleteConversation(id: string) {
  try {
    const sessionId = parseInt(id);
    const userId = authStore.user?.id; // 从 store 获取用户ID
    await deleteSession(sessionId, userId);
    ElMessage.success('对话已删除');
  } catch (error) {
    ElMessage.error('删除失败');
  }
}
```

### HTTP 请求对应关系

| 后端参数                     | 说明         | 前端实现                                      | 最终 HTTP       |
| ---------------------------- | ------------ | --------------------------------------------- | --------------- |
| `session_id`                 | 路径参数     | 嵌入 URL: `` `/chat/sessions/${sessionId}` `` | `/sessions/123` |
| `user_id: int = Query(...)`  | 查询参数     | `params: { userId }`                          | `?userId=456`   |
| `db: Session = Depends(...)` | 后端依赖注入 | 无需传入                                      | 后端处理        |

**完整请求：**

```
DELETE /api/chat/sessions/123?userId=456
```

---

## 常见接口模式对应

### 模式 1: GET + 查询参数 ✅

```python
# 后端
def search_sessions(
    user_id: int = Query(...),
    keyword: str = Query(...)
):
```

```typescript
// 前端
export function searchSessions(userId: number, keyword: string) {
  return request.get('/chat/sessions/search', {
    params: { userId, keyword },
  });
}
// HTTP: GET /api/chat/sessions/search?userId=456&keyword=python
```

---

### 模式 2: GET + 路径参数 ✅

```python
# 后端
def get_session(session_id: int):
```

```typescript
// 前端
export function getSessionDetails(sessionId: number) {
  return request.get(`/chat/sessions/${sessionId}`);
}
// HTTP: GET /api/chat/sessions/123
```

---

### 模式 3: POST + 请求体 ✅

```python
# 后端
def create_session(
    session_data: SessionCreate,
    user_id: int = Query(...)
):
```

```typescript
// 前端
export function createSession(userId: number, title: string) {
  return request.post('/chat/sessions', {
    title,
    userId,
  });
}
// HTTP: POST /api/chat/sessions
// Body: { "title": "...", "userId": 456 }
```

---

### 模式 4: DELETE + 路径 + 查询参数 ✅

```python
# 后端
def delete_session(
    session_id: int,
    user_id: int = Query(...)
):
```

```typescript
// 前端
export function deleteSession(sessionId: number, userId: number) {
  return request.delete(`/chat/sessions/${sessionId}`, {
    params: { userId },
  });
}
// HTTP: DELETE /api/chat/sessions/123?userId=456
```

---

## Request 工具使用速查

```typescript
import request from '@/utils/request';

// GET - 只路径参数
request.get('/users/123');

// GET - 查询参数
request.get('/users/search', { params: { name: 'Tom' } });

// POST - 请求体
request.post('/users', { name: 'Tom', age: 20 });

// POST - 请求体 + 查询参数
request.post('/users/123/action', { action: 'activate' }, { params: { userId: 456 } });

// PUT - 更新
request.put('/users/123', { name: 'Jerry' });

// DELETE - 路径参数
request.delete('/users/123');

// DELETE - 路径参数 + 查询参数
request.delete('/users/123', { params: { permanent: true } });
```

---

## 本项目中的实现示例

### 文件位置

- API 定义: `src/api/agent.ts`
- 使用示例: `src/layouts/ChatLayout.vue`
- 参考文档: `src/api/API_MAPPING_GUIDE.md`

### 删除会话的完整流程

**1. API 层** (`src/api/agent.ts`)

```typescript
export function deleteSession(sessionId: number, userId: number) {
  return request.delete(`/chat/sessions/${sessionId}`, {
    params: { userId },
  });
}
```

**2. 业务层** (`src/layouts/ChatLayout.vue`)

```typescript
async function handleDeleteConversation(id: string) {
  const sessionId = parseInt(id);
  const userId = authStore.user?.id;

  await deleteSession(sessionId, userId);
  agentStore.deleteConversation(id);
  ElMessage.success('对话已删除');
}
```

**3. UI 层** (模板)

```vue
<button @click="handleDeleteConversation(conv.id)">删除</button>
```

---

## 快速诊断

遇到接口调用问题？检查以下几点：

- [ ] 后端参数是 `Query(...)` 还是请求体？
- [ ] 路径参数是否正确嵌入了 URL？
- [ ] 查询参数是否放在 `params` 对象中？
- [ ] 用户 ID / Token 是否正确传递？
- [ ] HTTP 方法是否正确（GET/POST/PUT/DELETE）？
- [ ] CORS 是否配置正确？

---

## 生成的 HTTP 请求示例

```bash
# 删除会话
curl -X DELETE "http://localhost:8000/api/chat/sessions/123?userId=456" \
  -H "Authorization: Bearer {token}"

# 搜索会话
curl -X GET "http://localhost:8000/api/chat/sessions/search?userId=456&keyword=python" \
  -H "Authorization: Bearer {token}"

# 创建会话
curl -X POST "http://localhost:8000/api/chat/sessions" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"userId":456,"title":"新对话"}'
```
