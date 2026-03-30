# 后端接口 → 前端 API 参数映射表

## 会话操作映射

### 1. 创建会话

**后端接口：**

```python
@app_router.post("/sessions", response_model=SessionResponse, status_code=201)
def create_session(
    request: SessionCreate,  # 请求体
    db: Session = Depends(get_db)
):
```

**前端调用：**

```typescript
createSession(
  userId: number,           // 来自 request.user_id
  title?: string,           // 来自 request.title
  modelName?: string,       // 来自 request.model_name
  systemPrompt?: string     // 来自 request.system_prompt
)
```

**参数对应：**
| 后端 | 前端参数 | 位置 | HTTP |
|-----|--------|------|------|
| `request.user_id` | `userId` | 请求体 | POST |
| `request.title` | `title` | 请求体 | POST |
| `request.model_name` | `modelName` | 请求体 | POST |
| `request.system_prompt` | `systemPrompt` | 请求体 | POST |

---

### 2. 获取会话列表

**后端接口：**

```python
@app_router.get("/sessions", response_model=List[SessionResponse])
def get_user_sessions(
    user_id: int = Query(...),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    include_archived: bool = Query(False),
    db: Session = Depends(get_db)
):
```

**前端调用：**

```typescript
getUserSessions(
  userId: number,           // 查询参数
  skip: number = 0,         // 查询参数
  limit: number = 20,       // 查询参数
  includeArchived: boolean = false  // 查询参数
)
```

**参数对应：**
| 后端 | 前端参数 | HTTP | 示例 |
|-----|--------|------|------|
| `user_id: int = Query(...)` | `userId` | `?user_id=123` | GET |
| `skip: int = Query(0)` | `skip` | `?skip=0` | GET |
| `limit: int = Query(20)` | `limit` | `?limit=20` | GET |
| `include_archived: bool = Query(False)` | `includeArchived` | `?include_archived=false` | GET |

---

### 3. 搜索会话

**后端接口：**

```python
@app_router.get("/sessions/search", response_model=List[SessionResponse])
def search_sessions(
    user_id: int = Query(...),
    query: str = Query(..., min_length=1),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
```

**前端调用：**

```typescript
searchSessions(
  userId: number,           // 查询参数
  query: string,            // 查询参数
  skip: number = 0,         // 查询参数
  limit: number = 20        // 查询参数
)
```

---

### 4. 获取会话及历史消息

**后端接口：**

```python
@app_router.get("/sessions/{session_id}", response_model=SessionWithMessages)
def get_session_with_history(
    session_id: int,                    # 路径参数
    user_id: int = Query(...),          # 查询参数
    db: Session = Depends(get_db)
):
```

**前端调用：**

```typescript
getSessionWithHistory(
  sessionId: number,        // 路径参数 → /sessions/{sessionId}
  userId: number            // 查询参数 → ?user_id=123
)
```

**参数对应：**
| 后端 | 前端参数 | HTTP 位置 | 示例 |
|-----|--------|---------|------|
| `session_id: int` | `sessionId` | URL路径 | `/sessions/456` |
| `user_id: int = Query(...)` | `userId` | 查询参数 | `?user_id=123` |

---

### 5. 获取会话基本信息

**后端接口：**

```python
@app_router.get("/sessions/{session_id}/info", response_model=SessionResponse)
def get_session_info(
    session_id: int,                    # 路径参数
    user_id: int = Query(...),          # 查询参数
    db: Session = Depends(get_db)
):
```

**前端调用：**

```typescript
getSessionInfo(
  sessionId: number,        // 路径参数
  userId: number            // 查询参数
)
```

**HTTP 请求：**

```
GET /api/chat/sessions/456/info?user_id=123
```

---

### 6. 更新会话信息

**后端接口：**

```python
@app_router.put("/sessions/{session_id}", response_model=SessionResponse)
def update_session(
    request: SessionUpdate,    # 请求体 (包含 session_id, user_id)
    db: Session = Depends(get_db)
):
```

**前端调用：**

```typescript
updateSession(
  sessionId: number,          // 路径参数 + 请求体
  userId: number,             // 请求体
  data: {
    title?: string,           // 请求体
    modelName?: string,       // 请求体 (model_name)
    systemPrompt?: string,    // 请求体 (system_prompt)
    isArchived?: boolean      // 请求体 (is_archived)
  }
)
```

**HTTP 请求：**

```
PUT /api/chat/sessions/456
{
  "session_id": 456,
  "user_id": 123,
  "title": "新标题",
  "model_name": "gpt-4",
  "system_prompt": "...",
  "is_archived": false
}
```

---

### 7. 删除会话（软删除）

**后端接口：**

```python
@app_router.delete("/sessions/{session_id}", status_code=204)
def delete_session(
    session_id: int,                    # 路径参数
    user_id: int = Query(...),          # 查询参数
    db: Session = Depends(get_db)
):
```

**前端调用：**

```typescript
deleteSession(
  sessionId: number,        // 路径参数
  userId: number            // 查询参数
)
```

**HTTP 请求：**

```
DELETE /api/chat/sessions/456?user_id=123
```

---

### 8. 归档会话

**后端接口：**

```python
@app_router.put("/sessions/{session_id}/archive", response_model=SessionResponse)
def archive_session(
    session_id: int,                    # 路径参数
    user_id: int = Query(...),          # 查询参数
    db: Session = Depends(get_db)
):
```

**前端调用：**

```typescript
archiveSession(
  sessionId: number,        // 路径参数
  userId: number            // 查询参数
)
```

**HTTP 请求：**

```
PUT /api/chat/sessions/456/archive?user_id=123
```

---

## 消息操作映射

### 1. 添加消息

**后端接口：**

```python
@app_router.post("/sessions/{session_id}/messages", response_model=MessageResponse, status_code=201)
def add_message_to_session(
    session_id: int,                    # 路径参数
    request: MessageCreate,             # 请求体
    user_id: int = Query(...),          # 查询参数
    db: Session = Depends(get_db)
):
```

**前端调用：**

```typescript
createMessage(
  sessionId: number,         // 路径参数
  userId: number,            // 查询参数
  role: string,              // 请求体
  content: string,           // 请求体
  messageType: 'user' | 'assistant' | 'system',  // 请求体
  modelName?: string         // 请求体
)
```

**参数对应：**
| 后端 | 前端参数 | HTTP 位置 | 示例 |
|-----|--------|---------|------|
| `session_id: int` | `sessionId` | URL路径 | `/sessions/456/messages` |
| `request.session_id` | `sessionId` | 请求体 | `"session_id": 456` |
| `request.role` | `role` | 请求体 | `"role": "user"` |
| `request.content` | `content` | 请求体 | `"content": "你好"` |
| `request.message_type` | `messageType` | 请求体 | `"message_type": "user"` |
| `request.model_name` | `modelName` | 请求体 | `"model_name": "gpt-4"` |
| `user_id: int = Query(...)` | `userId` | 查询参数 | `?user_id=123` |

**HTTP 请求：**

```
POST /api/chat/sessions/456/messages?user_id=123
{
  "session_id": 456,
  "role": "user",
  "content": "你好，请解释一下 Vue3",
  "message_type": "user",
  "model_name": null
}
```

---

### 2. 获取会话消息列表

**后端接口：**

```python
@app_router.get("/sessions/{session_id}/messages", response_model=List[MessageResponse])
def get_session_messages(
    session_id: int,                    # 路径参数
    user_id: int = Query(...),          # 查询参数
    skip: int = Query(0, ge=0),         # 查询参数
    limit: int = Query(50, ge=1, le=200),  # 查询参数
    db: Session = Depends(get_db)
):
```

**前端调用：**

```typescript
getSessionMessages(
  sessionId: number,        // 路径参数
  userId: number,           // 查询参数
  skip: number = 0,         // 查询参数
  limit: number = 50        // 查询参数
)
```

---

### 3. 获取单个消息

**后端接口：**

```python
@app_router.get("/messages/{message_id}", response_model=MessageResponse)
def get_message(
    message_id: int,                    # 路径参数
    user_id: int = Query(...),          # 查询参数
    db: Session = Depends(get_db)
):
```

**前端调用：**

```typescript
getMessage(
  messageId: number,        // 路径参数
  userId: number            // 查询参数
)
```

---

### 4. 删除消息（软删除）

**后端接口：**

```python
@app_router.delete("/messages/{message_id}", status_code=204)
def delete_message(
    message_id: int,                    # 路径参数
    user_id: int = Query(...),          # 查询参数
    db: Session = Depends(get_db)
):
```

**前端调用：**

```typescript
deleteMessage(
  messageId: number,        // 路径参数
  userId: number            // 查询参数
)
```

---

## 参数转换规则

### 命名转换

| 后端（Python）     | 前端（TypeScript） | 说明                     |
| ------------------ | ------------------ | ------------------------ |
| `user_id`          | `userId`           | 查询参数和请求体自动转换 |
| `session_id`       | `sessionId`        | 路径参数和请求体自动转换 |
| `message_id`       | `messageId`        | 路径参数自动转换         |
| `model_name`       | `modelName`        | 请求体自动转换           |
| `system_prompt`    | `systemPrompt`     | 请求体自动转换           |
| `message_type`     | `messageType`      | 请求体自动转换           |
| `is_archived`      | `isArchived`       | 请求体自动转换           |
| `include_archived` | `includeArchived`  | 查询参数自动转换         |

### 位置转换规则

| HTTP 部分 | 后端标记                       | 前端处理          |
| --------- | ------------------------------ | ----------------- |
| URL 路径  | `/sessions/{session_id}`       | 直接嵌入 URL      |
| 查询参数  | `Query(...)`                   | `params: {}` 对象 |
| 请求体    | 类型注解（如 `SessionCreate`） | 直接作为数据传递  |

---

## 完整 HTTP 请求对应示例

```
后端：def delete_session(session_id: int, user_id: int = Query(...))
↓
前端：deleteSession(123, 456)
↓
HTTP：DELETE /api/chat/sessions/123?user_id=456
```

```
后端：def update_session(request: SessionUpdate)
      # SessionUpdate 包含: session_id, user_id, title, model_name, ...
↓
前端：updateSession(123, 456, { title: '新标题' })
↓
HTTP：PUT /api/chat/sessions/123
{
  "session_id": 123,
  "user_id": 456,
  "title": "新标题",
  "model_name": null,
  ...
}
```

```
后端：def create_message(session_id: int, request: MessageCreate, user_id: int = Query(...))
↓
前端：createMessage(123, 456, 'user', '你好', 'user')
↓
HTTP：POST /api/chat/sessions/123/messages?user_id=456
{
  "session_id": 123,
  "role": "user",
  "content": "你好",
  "message_type": "user",
  "model_name": null
}
```
