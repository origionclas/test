# 前后端接口对应指南

## 1. 删除会话接口 - 核心示例

### 后端接口定义

```python
@router.delete("/sessions/{session_id}")
def delete_session(
    session_id: int,
    user_id: int = Query(..., description="用户ID"),
    db: Session = Depends(get_db)
):
    """
    参数说明：
    - session_id: 路径参数，会话ID
    - user_id: 查询参数，用户ID
    - db: 依赖注入，数据库连接
    """
    ...
```

### 前端接口实现

```typescript
export function deleteSession(sessionId: number, userId: number) {
  return request.delete(`/chat/sessions/${sessionId}`, {
    params: {
      userId, // 查询参数，会自动转换为 ?userId=456
    },
  });
}
```

### HTTP 请求详解

```
DELETE /api/chat/sessions/123?userId=456 HTTP/1.1
```

**映射关系：**
| 后端参数 | 类型 | 前端传入 | HTTP 位置 |
|---------|------|---------|---------|
| session_id | 路径参数 | sessionId | URL 路径 |
| user_id | 查询参数 | userId | 查询字符串 |
| db | 依赖注入 | 无需传入 | 服务端处理 |

---

## 2. 前端调用示例

### 在组件中使用

```typescript
<script setup lang="ts">
import { deleteSession } from '@/api/agent'
import { ElMessage } from 'element-plus'

async function handleDeleteConversation(sessionId: number, userId: number) {
    try {
        const response = await deleteSession(sessionId, userId)
        ElMessage.success('对话已删除')
        // 刷新列表
        await loadSessions()
    } catch (error) {
        ElMessage.error('删除对话失败')
        console.error(error)
    }
}
</script>
```

### 使用 Composition API

```typescript
import { ref } from 'vue';
import { deleteSession } from '@/api/agent';

const sessions = ref([]);
const loading = ref(false);

async function deleteSessionHandle(sessionId: number, userId: number) {
  loading.value = true;
  try {
    await deleteSession(sessionId, userId);
    // 从列表中移除
    sessions.value = sessions.value.filter((s) => s.id !== sessionId);
  } finally {
    loading.value = false;
  }
}
```

---

## 3. 其他常见接口模式

### GET 请求 - 查询参数

**后端：**

```python
@router.get("/sessions/search")
def search_sessions(
    user_id: int = Query(...),
    keyword: str = Query(...)
):
```

**前端：**

```typescript
export function searchSessions(userId: number, keyword: string) {
  return request.get(`/chat/sessions/search`, {
    params: {
      userId,
      keyword,
    },
  });
}
```

**HTTP 请求：**

```
GET /api/chat/sessions/search?userId=456&keyword=python
```

---

### GET 请求 - 路径参数

**后端：**

```python
@router.get("/sessions/{session_id}")
def get_session(session_id: int):
```

**前端：**

```typescript
export function getSessionDetails(sessionId: number) {
  return request.get(`/chat/sessions/${sessionId}`);
}
```

**HTTP 请求：**

```
GET /api/chat/sessions/123
```

---

### POST 请求 - 请求体

**后端：**

```python
@router.post("/sessions")
def create_session(
    session_data: SessionCreate,  # 从请求体中获取
    user_id: int = Query(...)      # 从查询参数中获取
):
```

**前端：**

```typescript
export function createSession(userId: number, title: string, model?: string) {
  return request.post(`/chat/sessions`, {
    userId,
    title,
    model,
  });
}
```

**HTTP 请求：**

```
POST /api/chat/sessions?userId=456
Content-Type: application/json

{
    "title": "新的对话",
    "model": "gpt-3.5-turbo"
}
```

---

### PUT 请求 - 更新

**后端：**

```python
@router.put("/sessions/{session_id}")
def update_session(
    session_id: int,
    session_data: SessionUpdate,
    user_id: int = Query(...)
):
```

**前端：**

```typescript
export function updateSessionInfo(
  sessionId: number,
  userId: number,
  data: { title?: string; model?: string },
) {
  return request.put(`/chat/sessions/${sessionId}`, {
    userId,
    ...data,
  });
}
```

**HTTP 请求：**

```
PUT /api/chat/sessions/123?userId=456
Content-Type: application/json

{
    "title": "更新的标题",
    "model": "gpt-4"
}
```

---

## 4. 参数传递规则总结

| 参数位置 | 用途           | 前端实现         | 示例                          |
| -------- | -------------- | ---------------- | ----------------------------- |
| 路径参数 | 资源定位       | 直接嵌入 URL     | `/chat/sessions/${sessionId}` |
| 查询参数 | 过滤、分页     | `params` 对象    | `params: { userId, pageNum }` |
| 请求体   | 数据提交       | 直接作为第二参数 | `request.post(url, data)`     |
| 请求头   | 认证、内容类型 | axios 自动处理   | 默认包含 token                |

---

## 5. Request 工具函数说明

项目中的 `request` 对象是基于 axios 封装的：

```typescript
// GET 请求
request.get(url, { params: {} });

// POST 请求
request.post(url, data, { params: {} });

// PUT 请求
request.put(url, data, { params: {} });

// DELETE 请求
request.delete(url, { params: {} });

// PATCH 请求
request.patch(url, data, { params: {} });
```

---

## 6. 错误处理

```typescript
import { ElMessage } from 'element-plus';

async function deleteSessionSafely(sessionId: number, userId: number) {
  try {
    await deleteSession(sessionId, userId);
    ElMessage.success('删除成功');
  } catch (error: any) {
    // 处理不同的错误类型
    if (error.response?.status === 401) {
      ElMessage.error('未授权，请重新登录');
    } else if (error.response?.status === 403) {
      ElMessage.error('禁止操作此会话');
    } else if (error.response?.status === 404) {
      ElMessage.error('会话不存在');
    } else {
      ElMessage.error('删除失败：' + error.message);
    }
  }
}
```

---

## 7. 快速参考

### 删除会话 ✅

```typescript
// 调用
await deleteSession(123, 456)

// 等价于
DELETE /api/chat/sessions/123?userId=456
```

### 创建会话 ✅

```typescript
// 调用
await createSession(456, '新对话', 'gpt-4')

// 等价于
POST /api/chat/sessions
{
    "userId": 456,
    "title": "新对话",
    "model": "gpt-4"
}
```

### 更新会话 ✅

```typescript
// 调用
await updateSessionInfo(123, 456, { title: '更新标题' })

// 等价于
PUT /api/chat/sessions/123
{
    "userId": 456,
    "title": "更新标题"
}
```
