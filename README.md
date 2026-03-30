# 项目文件结构总结

## 📁 API 模块文件

```
src/api/
├── agent.ts                          # ✅ 主 API 文件 - 所有聊天相关 API
├── CHAT_API_GUIDE.md                # 详细的使用指南和完整示例
├── BACKEND_FRONTEND_MAPPING.md       # 后端 → 前端参数映射表
└── API_MAPPING_GUIDE.md             # API 对应指南（旧版参考）
```

## 📝 agent.ts 文件内容

### 会话 API 函数列表

```typescript
// 创建会话
export function createSession(
  userId: number,
  title?: string,
  modelName?: string,
  systemPrompt?: string,
);

// 获取用户的所有会话列表
export function getUserSessions(
  userId: number,
  skip?: number,
  limit?: number,
  includeArchived?: boolean,
);

// 搜索会话
export function searchSessions(userId: number, query: string, skip?: number, limit?: number);

// 获取会话及其历史消息
export function getSessionWithHistory(sessionId: number, userId: number);

// 获取会话基本信息
export function getSessionInfo(sessionId: number, userId: number);

// 更新会话信息
export function updateSession(
  sessionId: number,
  userId: number,
  data: { title?; modelName?; systemPrompt?; isArchived? },
);

// 删除会话（软删除）
export function deleteSession(sessionId: number, userId: number);

// 归档会话
export function archiveSession(sessionId: number, userId: number);
```

### 消息 API 函数列表

```typescript
// 向会话添加新消息
export function createMessage(
  sessionId: number,
  userId: number,
  role: string,
  content: string,
  messageType: 'user' | 'assistant' | 'system',
  modelName?: string,
);

// 获取会话的所有消息
export function getSessionMessages(
  sessionId: number,
  userId: number,
  skip?: number,
  limit?: number,
);

// 获取单个消息
export function getMessage(messageId: number, userId: number);

// 删除消息（软删除）
export function deleteMessage(messageId: number, userId: number);
```

---

## 📚 使用文档

### 快速开始

1. **查看参数映射** → `BACKEND_FRONTEND_MAPPING.md`
2. **学习使用示例** → `CHAT_API_GUIDE.md`
3. **集成到组件** → 参考下面的示例代码

### 文件选择指南

| 需求                    | 查看文件                      |
| ----------------------- | ----------------------------- |
| 了解每个 API 的后端参数 | `BACKEND_FRONTEND_MAPPING.md` |
| 查看完整组件示例        | `CHAT_API_GUIDE.md`           |
| 快速查看 API 列表       | 本文件（项目文件结构总结）    |
| 理解参数对应关系        | `API_MAPPING_GUIDE.md`        |

---

## 🚀 集成示例

### 在 ChatLayout 中使用

```typescript
import { getUserSessions, deleteSession, createSession } from '@/api/agent';

export default {
  setup() {
    const agentStore = useAgentStore();
    const authStore = useAuthStore();

    async function handleDeleteConversation(id: string) {
      const sessionId = parseInt(id);
      const userId = authStore.user?.id;

      if (!userId) return;

      try {
        await deleteSession(sessionId, userId);
        agentStore.deleteConversation(id);
      } catch (error) {
        ElMessage.error('删除失败');
      }
    }

    return { handleDeleteConversation };
  },
};
```

### 在聊天页面中使用

```typescript
import { getSessionWithHistory, createMessage, getSessionMessages } from '@/api/agent';

export default {
  setup() {
    const authStore = useAuthStore();
    const messages = ref([]);

    async function loadMessages(sessionId: number) {
      const userId = authStore.user?.id;
      const data = await getSessionWithHistory(sessionId, userId);
      messages.value = data.messages;
    }

    async function sendMessage(content: string) {
      const userId = authStore.user?.id;
      const sessionId = route.params.sessionId;

      await createMessage(sessionId, userId, 'user', content, 'user');
    }

    return { loadMessages, sendMessage };
  },
};
```

---

## 🔑 关键参数说明

### userId（用户ID）

- 来源：`authStore.user?.id`
- 用途：权限验证，确保用户只能访问自己的数据
- 传递方式：查询参数或请求体

### sessionId（会话ID）

- 来源：路由参数或会话列表
- 用途：标识特定的对话会话
- 传递方式：URL 路径参数

### query（搜索关键词）

- 用途：在会话标题和消息内容中搜索
- 传递方式：查询参数
- 最小长度：1 个字符

### messageType（消息类型）

- 可选值：`user`（用户消息）、`assistant`（AI 响应）、`system`（系统消息）
- 用途：区分不同类型的消息
- 默认值：取决于 `role` 参数

### skip/limit（分页）

- skip：跳过的记录数（起始位置）
- limit：返回的最大记录数
- 默认：skip=0, limit=20（会话）或 limit=50（消息）

---

## ✅ API 完整性检查

### 会话操作

- [x] 创建会话 - `createSession`
- [x] 获取列表 - `getUserSessions`
- [x] 搜索会话 - `searchSessions`
- [x] 获取详情 - `getSessionWithHistory`
- [x] 获取基本信息 - `getSessionInfo`
- [x] 更新信息 - `updateSession`
- [x] 删除会话 - `deleteSession`
- [x] 归档会话 - `archiveSession`

### 消息操作

- [x] 创建消息 - `createMessage`
- [x] 获取列表 - `getSessionMessages`
- [x] 获取单条 - `getMessage`
- [x] 删除消息 - `deleteMessage`

---

## 🔄 常见工作流

### 1. 初始化聊天

```typescript
// 1. 获取所有会话
const sessions = await getUserSessions(userId);

// 2. 选择第一个会话
const sessionId = sessions[0].id;

// 3. 加载会话消息
const sessionData = await getSessionWithHistory(sessionId, userId);

// 4. 显示消息列表
messages.value = sessionData.messages;
```

### 2. 发送消息

```typescript
// 1. 发送用户消息
await createMessage(sessionId, userId, 'user', content, 'user');

// 2. 等待 AI 响应（模拟或实际）
// 3. 发送 AI 响应消息
await createMessage(sessionId, userId, 'assistant', aiResponse, 'assistant', 'gpt-4');

// 4. 刷新消息列表
messages.value = await getSessionMessages(sessionId, userId);
```

### 3. 管理会话

```typescript
// 创建新会话
const newSession = await createSession(userId, '新的对话');

// 更新会话标题
await updateSession(sessionId, userId, { title: '新标题' });

// 归档会话
await archiveSession(sessionId, userId);

// 删除会话
await deleteSession(sessionId, userId);
```

---

## 📞 错误处理最佳实践

```typescript
try {
  const data = await deleteSession(sessionId, userId);
} catch (error: unknown) {
  if (error instanceof Error) {
    const response = (error as any).response;

    if (response?.status === 401) {
      // 未授权 - 跳转到登录
      router.push('/login');
    } else if (response?.status === 403) {
      // 禁止访问 - 可能是权限问题
      ElMessage.error('你没有权限执行此操作');
    } else if (response?.status === 404) {
      // 资源不存在 - 可能已被删除
      ElMessage.error('资源不存在');
    } else if (response?.status === 500) {
      // 服务器错误
      ElMessage.error('服务器出错，请稍后重试');
    } else {
      ElMessage.error(error.message);
    }
  }
}
```

---

## 🎯 集成检查清单

在集成 API 时，确保：

- [ ] 导入了正确的函数 `import { ... } from '@/api/agent'`
- [ ] 所有 API 调用都传入了 `userId` 参数
- [ ] 路径参数正确嵌入到 URL 中
- [ ] 查询参数使用了 `params` 对象
- [ ] 实现了错误处理
- [ ] 数据转换正确（蛇形 → 驼峰命名）
- [ ] 权限验证完成
- [ ] 页面状态更新正确
- [ ] 加载状态处理完整
- [ ] 用户反馈消息清晰

---

## 📖 相关文件引用

- **后端路由**: 对应 `src/routers/chat.py` 或类似文件
- **Stores**: `src/stores/agent.ts` - 保存会话和消息状态
- **Layouts**: `src/layouts/ChatLayout.vue` - 使用这些 API
- **Pages**: `src/pages/chat/index.vue`, `src/pages/index.vue`
- **Utils**: `src/utils/request.ts` - axios 实例配置
