# 聊天 API 完整集成指南

## 📋 API 函数总览

### 会话相关 API（Session）

| 函数名                  | 方法   | 路径                          | 说明               |
| ----------------------- | ------ | ----------------------------- | ------------------ |
| `createSession`         | POST   | `/chat/sessions`              | 创建新会话         |
| `getUserSessions`       | GET    | `/chat/sessions`              | 获取用户所有会话   |
| `searchSessions`        | GET    | `/chat/sessions/search`       | 搜索会话           |
| `getSessionWithHistory` | GET    | `/chat/sessions/{id}`         | 获取会话及历史消息 |
| `getSessionInfo`        | GET    | `/chat/sessions/{id}/info`    | 获取会话基本信息   |
| `updateSession`         | PUT    | `/chat/sessions/{id}`         | 更新会话信息       |
| `deleteSession`         | DELETE | `/chat/sessions/{id}`         | 删除会话（软删除） |
| `archiveSession`        | PUT    | `/chat/sessions/{id}/archive` | 归档会话           |

### 消息相关 API（Message）

| 函数名               | 方法   | 路径                           | 说明               |
| -------------------- | ------ | ------------------------------ | ------------------ |
| `createMessage`      | POST   | `/chat/sessions/{id}/messages` | 添加新消息         |
| `getSessionMessages` | GET    | `/chat/sessions/{id}/messages` | 获取会话消息       |
| `getMessage`         | GET    | `/chat/messages/{id}`          | 获取单个消息       |
| `deleteMessage`      | DELETE | `/chat/messages/{id}`          | 删除消息（软删除） |

---

## 🚀 使用示例

### 1. 创建会话

```typescript
import { createSession } from '@/api/agent';

// 简单创建
await createSession(userId);

// 带标题和模型
await createSession(userId, '新的对话', 'gpt-4', 'You are a helpful assistant.');
```

**对应后端请求：**

```
POST /api/chat/sessions
{
  "user_id": 123,
  "title": "新的对话",
  "model_name": "gpt-4",
  "system_prompt": "You are a helpful assistant."
}
```

---

### 2. 获取用户会话列表

```typescript
import { getUserSessions } from '@/api/agent';

// 基本调用
const sessions = await getUserSessions(userId);

// 带分页
const sessions = await getUserSessions(userId, 0, 10);

// 包含已归档的会话
const sessions = await getUserSessions(userId, 0, 10, true);
```

**对应后端请求：**

```
GET /api/chat/sessions?user_id=123&skip=0&limit=10&include_archived=false
```

---

### 3. 搜索会话

```typescript
import { searchSessions } from '@/api/agent';

const results = await searchSessions(userId, 'Python');

// 带分页
const results = await searchSessions(userId, 'Vue', 0, 20);
```

**对应后端请求：**

```
GET /api/chat/sessions/search?user_id=123&query=Python&skip=0&limit=20
```

---

### 4. 获取会话及其历史消息

```typescript
import { getSessionWithHistory } from '@/api/agent';

const sessionData = await getSessionWithHistory(sessionId, userId);
// 返回: { id, title, messages: [...], ... }
```

**对应后端请求：**

```
GET /api/chat/sessions/123?user_id=456
```

---

### 5. 发送消息

```typescript
import { createMessage } from '@/api/agent';

// 用户消息
await createMessage(sessionId, userId, 'user', '你好，请解释一下 Vue3 的响应式原理', 'user');

// AI 助手消息
await createMessage(
  sessionId,
  userId,
  'assistant',
  'Vue3 使用 Proxy 对象来实现响应式...',
  'assistant',
  'gpt-4',
);

// 系统消息
await createMessage(sessionId, userId, 'system', '这是一个系统通知', 'system');
```

**对应后端请求：**

```
POST /api/chat/sessions/123/messages?user_id=456
{
  "session_id": 123,
  "role": "user",
  "content": "你好，请解释一下 Vue3 的响应式原理",
  "message_type": "user",
  "model_name": null
}
```

---

### 6. 获取会话消息列表

```typescript
import { getSessionMessages } from '@/api/agent';

// 基本调用
const messages = await getSessionMessages(sessionId, userId);

// 带分页
const messages = await getSessionMessages(sessionId, userId, 0, 20);
```

**对应后端请求：**

```
GET /api/chat/sessions/123/messages?user_id=456&skip=0&limit=50
```

---

### 7. 更新会话信息

```typescript
import { updateSession } from '@/api/agent';

// 更新标题
await updateSession(sessionId, userId, {
  title: '新的会话标题',
});

// 更新多个字段
await updateSession(sessionId, userId, {
  title: 'JavaScript 学习',
  modelName: 'gpt-4',
  systemPrompt: 'You are a JavaScript expert',
  isArchived: false,
});
```

**对应后端请求：**

```
PUT /api/chat/sessions/123
{
  "session_id": 123,
  "user_id": 456,
  "title": "新的会话标题",
  "model_name": "gpt-4",
  "system_prompt": "You are a JavaScript expert",
  "is_archived": false
}
```

---

### 8. 删除会话

```typescript
import { deleteSession } from '@/api/agent';

await deleteSession(sessionId, userId);
```

**对应后端请求：**

```
DELETE /api/chat/sessions/123?user_id=456
```

---

### 9. 归档会话

```typescript
import { archiveSession } from '@/api/agent';

await archiveSession(sessionId, userId);
```

**对应后端请求：**

```
PUT /api/chat/sessions/123/archive?user_id=456
```

---

## 💻 完整组件示例

```vue
<template>
  <div class="chat-app">
    <!-- 会话列表 -->
    <div class="session-list">
      <button @click="handleNewSession">新建会话</button>
      <div
        v-for="session in sessions"
        :key="session.id"
        @click="selectSession(session.id)"
        :class="{ active: currentSessionId === session.id }"
      >
        <span>{{ session.title }}</span>
        <button @click.stop="handleDeleteSession(session.id)">删除</button>
      </div>
    </div>

    <!-- 聊天区域 -->
    <div v-if="currentSession" class="chat-area">
      <h2>{{ currentSession.title }}</h2>

      <!-- 消息列表 -->
      <div class="messages">
        <div
          v-for="message in messages"
          :key="message.id"
          :class="['message', message.message_type]"
        >
          <strong>{{ message.role }}:</strong>
          {{ message.content }}
        </div>
      </div>

      <!-- 输入框 -->
      <div class="input-area">
        <textarea v-model="inputMessage" />
        <button @click="handleSendMessage">发送</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import {
  getUserSessions,
  createSession,
  deleteSession,
  getSessionWithHistory,
  createMessage,
  getSessionMessages,
} from '@/api/agent';

const userId = ref(456); // 从 auth store 获取
const sessions = ref([]);
const currentSessionId = ref<number | null>(null);
const currentSession = ref<any>(null);
const messages = ref([]);
const inputMessage = ref('');

// 获取会话列表
async function loadSessions() {
  try {
    const data = await getUserSessions(userId.value);
    sessions.value = data;
  } catch (error) {
    ElMessage.error('获取会话列表失败');
  }
}

// 新建会话
async function handleNewSession() {
  try {
    const title = prompt('输入会话标题：');
    if (!title) return;

    const newSession = await createSession(userId.value, title);
    sessions.value.unshift(newSession);
    selectSession(newSession.id);
    ElMessage.success('会话创建成功');
  } catch (error) {
    ElMessage.error('创建会话失败');
  }
}

// 选择会话
async function selectSession(sessionId: number) {
  currentSessionId.value = sessionId;
  try {
    const sessionData = await getSessionWithHistory(sessionId, userId.value);
    currentSession.value = sessionData;
    messages.value = sessionData.messages || [];
  } catch (error) {
    ElMessage.error('获取会话详情失败');
  }
}

// 删除会话
async function handleDeleteSession(sessionId: number) {
  if (!confirm('确定删除此会话吗？')) return;

  try {
    await deleteSession(sessionId, userId.value);
    sessions.value = sessions.value.filter((s) => s.id !== sessionId);
    if (currentSessionId.value === sessionId) {
      currentSessionId.value = null;
      currentSession.value = null;
      messages.value = [];
    }
    ElMessage.success('会话已删除');
  } catch (error) {
    ElMessage.error('删除会话失败');
  }
}

// 发送消息
async function handleSendMessage() {
  if (!inputMessage.value.trim()) return;
  if (!currentSessionId.value) return;

  try {
    // 添加用户消息
    const userMsg = await createMessage(
      currentSessionId.value,
      userId.value,
      'user',
      inputMessage.value,
      'user',
    );
    messages.value.push(userMsg);
    inputMessage.value = '';

    // 模拟 AI 回复
    setTimeout(async () => {
      const aiMsg = await createMessage(
        currentSessionId.value!,
        userId.value,
        'assistant',
        '这是一个自动回复...',
        'assistant',
        'gpt-4',
      );
      messages.value.push(aiMsg);
    }, 1000);
  } catch (error) {
    ElMessage.error('发送消息失败');
  }
}

onMounted(() => {
  loadSessions();
});
</script>

<style scoped>
.chat-app {
  display: flex;
  height: 100vh;
}

.session-list {
  width: 250px;
  border-right: 1px solid #e5e5e5;
  padding: 10px;
  overflow-y: auto;
}

.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.messages {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.message {
  margin-bottom: 10px;
  padding: 10px;
  border-radius: 5px;
}

.message.user {
  background: #e3f2fd;
  margin-left: 50px;
}

.message.assistant {
  background: #f5f5f5;
  margin-right: 50px;
}

.input-area {
  padding: 20px;
  border-top: 1px solid #e5e5e5;
  display: flex;
  gap: 10px;
}

textarea {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
}

button {
  padding: 10px 20px;
  background: #10a37f;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}
</style>
```

---

## 📝 参数对应关系速查表

### 后端 → 前端参数映射

| 后端参数名   | 前端调用方式      | 位置     | 示例                 |
| ------------ | ----------------- | -------- | -------------------- |
| `user_id`    | 函数参数 `userId` | 查询参数 | `userId: 123`        |
| `session_id` | 路径参数/请求体   | URL路径  | `sessionId: 456`     |
| `query`      | 函数参数 `query`  | 查询参数 | `query: 'Python'`    |
| `skip/limit` | 可选参数          | 查询参数 | `skip: 0, limit: 20` |
| `title`      | 数据对象          | 请求体   | `{ title: '...' }`   |
| `content`    | 函数参数          | 请求体   | `content: '你好'`    |

---

## 🔄 HTTP 请求完整示例

### 创建会话

```bash
curl -X POST http://localhost:8000/api/chat/sessions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "user_id": 123,
    "title": "新会话",
    "model_name": "gpt-4",
    "system_prompt": "..."
  }'
```

### 获取会话列表

```bash
curl -X GET "http://localhost:8000/api/chat/sessions?user_id=123&skip=0&limit=20" \
  -H "Authorization: Bearer {token}"
```

### 发送消息

```bash
curl -X POST "http://localhost:8000/api/chat/sessions/456/messages?user_id=123" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "session_id": 456,
    "role": "user",
    "content": "你好",
    "message_type": "user"
  }'
```

### 删除会话

```bash
curl -X DELETE "http://localhost:8000/api/chat/sessions/456?user_id=123" \
  -H "Authorization: Bearer {token}"
```

---

## ⚠️ 常见错误处理

```typescript
import { getUserSessions } from '@/api/agent';
import { ElMessage } from 'element-plus';

async function loadSessions() {
  try {
    const data = await getUserSessions(userId);
    return data;
  } catch (error: unknown) {
    if (error instanceof Error) {
      const response = (error as any).response;

      if (response?.status === 401) {
        ElMessage.error('未授权，请重新登录');
      } else if (response?.status === 403) {
        ElMessage.error('禁止访问此资源');
      } else if (response?.status === 404) {
        ElMessage.error('资源不存在');
      } else if (response?.status === 500) {
        ElMessage.error('服务器错误，请稍后重试');
      } else {
        ElMessage.error(`错误: ${error.message}`);
      }
    }
  }
}
```

---

## ✅ 快速检查清单

- [ ] 所有 API 调用都包含 `userId` 参数
- [ ] 路径参数正确嵌入到 URL 中
- [ ] 查询参数使用 `params` 对象传递
- [ ] 请求体参数使用蛇形命名 (`model_name` 而不是 `modelName`)
- [ ] 消息类型选择正确 (`user`, `assistant`, `system`)
- [ ] 错误处理完整
- [ ] 权限验证通过
