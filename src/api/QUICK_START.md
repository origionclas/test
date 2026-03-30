# ⚡ 快速开始指南（5分钟上手）

## 🎯 目标

在 5 分钟内理解并使用所有 12 个聊天 API

---

## 📍 第 1 分钟：了解文件位置

### 前端 API 实现

```
src/api/agent.ts  ← 所有 API 函数都在这里
```

### TypeScript 类型

```
src/types/chat.ts  ← 所有类型定义都在这里
```

### 文档文件

```
src/api/
├── README.md                        ← 项目总览
├── IMPLEMENTATION_SUMMARY.md        ← 完整总结
├── API_COMPLETE_REFERENCE.md        ← 完整参考
├── BACKEND_FRONTEND_MAPPING.md      ← 参数映射
├── CHAT_API_GUIDE.md                ← 详细指南
└── FLOW_DIAGRAM.md                  ← 流程图表
```

---

## 📍 第 2 分钟：导入 API 和类型

### 导入 API 函数

```typescript
// 会话相关
import {
  createSession,
  getUserSessions,
  searchSessions,
  getSessionWithHistory,
  getSessionInfo,
  updateSession,
  deleteSession,
  archiveSession,
} from '@/api/agent';

// 消息相关
import { createMessage, getSessionMessages, getMessage, deleteMessage } from '@/api/agent';
```

### 导入类型定义

```typescript
import type { Session, Message, SessionResponse, MessageResponse, ChatState } from '@/types/chat';
```

---

## 📍 第 3 分钟：最简单的使用示例

### 示例 1：创建会话

```typescript
const session = await createSession(
  123, // userId
  '新的对话', // title (可选)
  'gpt-4', // modelName (可选)
);
```

### 示例 2：获取会话列表

```typescript
const sessions = await getUserSessions(123);
```

### 示例 3：发送消息

```typescript
const message = await createMessage(
  456, // sessionId
  123, // userId
  'user', // role
  '你好', // content
  'user', // messageType
);
```

### 示例 4：删除会话

```typescript
await deleteSession(456, 123);
```

---

## 📍 第 4 分钟：常见场景

### 场景 1：初始化聊天页面

```typescript
export default {
  setup() {
    const sessions = ref([]);
    const messages = ref([]);
    const authStore = useAuthStore();

    // 加载会话列表
    async function loadSessions() {
      const userId = authStore.user?.id;
      sessions.value = await getUserSessions(userId);
    }

    // 选择会话并加载消息
    async function selectSession(sessionId: number) {
      const userId = authStore.user?.id;
      const data = await getSessionWithHistory(sessionId, userId);
      messages.value = data.messages;
    }

    onMounted(() => loadSessions());

    return { sessions, messages, selectSession };
  },
};
```

### 场景 2：发送消息

```typescript
async function sendMessage(content: string) {
  const userId = authStore.user?.id;
  const sessionId = route.params.sessionId;

  // 发送用户消息
  const userMsg = await createMessage(sessionId, userId, 'user', content, 'user');
  messages.value.push(userMsg);

  // 模拟 AI 回复
  setTimeout(async () => {
    const aiMsg = await createMessage(sessionId, userId, 'assistant', 'AI 的响应...', 'assistant');
    messages.value.push(aiMsg);
  }, 1000);
}
```

### 场景 3：删除会话

```typescript
async function deleteConversation(sessionId: number) {
  const userId = authStore.user?.id;

  try {
    await deleteSession(sessionId, userId);
    sessions.value = sessions.value.filter((s) => s.id !== sessionId);
    ElMessage.success('删除成功');
  } catch (error) {
    ElMessage.error('删除失败');
  }
}
```

---

## 📍 第 5 分钟：参数速查表

### 会话 API 速查

| 函数                    | 参数                                    | 说明       |
| ----------------------- | --------------------------------------- | ---------- |
| `createSession`         | `(userId, title?, modelName?, prompt?)` | 创建       |
| `getUserSessions`       | `(userId, skip?, limit?)`               | 列表       |
| `searchSessions`        | `(userId, query, skip?, limit?)`        | 搜索       |
| `getSessionWithHistory` | `(sessionId, userId)`                   | 获取+消息  |
| `getSessionInfo`        | `(sessionId, userId)`                   | 仅基本信息 |
| `updateSession`         | `(sessionId, userId, data)`             | 更新       |
| `deleteSession`         | `(sessionId, userId)`                   | 删除       |
| `archiveSession`        | `(sessionId, userId)`                   | 归档       |

### 消息 API 速查

| 函数                 | 参数                                               | 说明     |
| -------------------- | -------------------------------------------------- | -------- |
| `createMessage`      | `(sessionId, userId, role, content, type, model?)` | 发送     |
| `getSessionMessages` | `(sessionId, userId, skip?, limit?)`               | 列表     |
| `getMessage`         | `(messageId, userId)`                              | 获取单条 |
| `deleteMessage`      | `(messageId, userId)`                              | 删除     |

---

## ✅ 完成检查

现在你已经知道：

- ✅ API 函数在哪里：`src/api/agent.ts`
- ✅ 类型定义在哪里：`src/types/chat.ts`
- ✅ 如何导入 API：`import { ... } from '@/api/agent'`
- ✅ 如何导入类型：`import type { ... } from '@/types/chat'`
- ✅ 如何使用 API：`await createSession(userId, title)`
- ✅ 常见场景怎么实现

---

## 🚀 开始编写代码吧！

### 简单模板

```vue
<template>
  <div class="chat">
    <ul>
      <li v-for="session in sessions" :key="session.id">
        {{ session.title }}
        <button @click="deleteConversation(session.id)">删除</button>
      </li>
    </ul>

    <button @click="createNewSession">新建对话</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { createSession, getUserSessions, deleteSession } from '@/api/agent';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const sessions = ref([]);

async function loadSessions() {
  const userId = authStore.user?.id;
  sessions.value = await getUserSessions(userId);
}

async function createNewSession() {
  const userId = authStore.user?.id;
  const title = prompt('输入会话标题');
  if (title) {
    const session = await createSession(userId, title);
    sessions.value.unshift(session);
    ElMessage.success('创建成功');
  }
}

async function deleteConversation(sessionId: number) {
  const userId = authStore.user?.id;
  if (confirm('确定删除？')) {
    await deleteSession(sessionId, userId);
    await loadSessions();
    ElMessage.success('删除成功');
  }
}

onMounted(() => loadSessions());
</script>

<style scoped>
.chat {
  padding: 20px;
}

ul {
  list-style: none;
  padding: 0;
}

li {
  padding: 10px;
  border: 1px solid #ddd;
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

button {
  padding: 5px 10px;
  background: #10a37f;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
}
</style>
```

---

## 📚 需要更多帮助？

| 需求          | 查看文件                      | 说明         |
| ------------- | ----------------------------- | ------------ |
| 了解 API 列表 | `README.md`                   | 项目总览     |
| 完整参考      | `API_COMPLETE_REFERENCE.md`   | 所有接口映射 |
| 参数对应      | `BACKEND_FRONTEND_MAPPING.md` | 后端参数映射 |
| 使用示例      | `CHAT_API_GUIDE.md`           | 详细示例     |
| 流程图表      | `FLOW_DIAGRAM.md`             | 可视化流程   |
| 完整总结      | `IMPLEMENTATION_SUMMARY.md`   | 工作总结     |

---

## 💡 常见问题

### Q1: userId 从哪里获取？

**A:** 从 auth store 获取

```typescript
const userId = authStore.user?.id;
```

### Q2: 如何处理错误？

**A:** 使用 try/catch

```typescript
try {
  await deleteSession(sessionId, userId);
} catch (error) {
  ElMessage.error('操作失败');
}
```

### Q3: 如何知道参数顺序？

**A:** 查看 TypeScript 提示或参考文档

```typescript
// 参数顺序：sessionId → userId → role → content → messageType → modelName?
createMessage(sessionId, userId, role, content, messageType, modelName);
```

### Q4: 后端返回的参数名是蛇形（snake_case）吗？

**A:** 是的，但 request 工具已自动转换

```typescript
// 你看到的是驼峰命名
session.modelName    // 后端是 model_name

// 发送时自动转换为蛇形
{ modelName: 'gpt-4' } → { model_name: 'gpt-4' }
```

---

## 🎯 下一步

1. **复制上面的简单模板到你的组件**
2. **根据实际需求调整**
3. **参考详细文档了解更多选项**
4. **完整测试所有功能**

---

## 📊 API 覆盖情况

```
后端有 12 个接口
↓
前端实现了 12 个函数
↓
你现在可以使用所有功能 ✅
```

---

## 🎉 恭喜！

你已经了解了所有聊天 API 的使用方法。

现在开始编码吧！🚀
