<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { register, RegisterPayload } from '../api/auth'
import { msgError, msgSuccess } from '../utils/MsgNNotice'

const router = useRouter()
const username = ref('')
const password = ref('')
const email = ref('')
const confirmPassword = ref('')
const loading = ref(false)

const isFormValid = computed(() => {
  return username.value.trim().length >= 3 && password.value.length >= 6 && confirmPassword.value.length >= 6 && email.value.includes('@')
})

async function handleRegister() {
  if (!isFormValid.value) {
    msgError('请输入有效的用户名（至少3个字符）和密码（至少6个字符）')
    return
  }
  if (password.value !== confirmPassword.value) {
    msgError('两次输入的密码不一致')
    return
  }

  loading.value = true
  try {
    const payload: RegisterPayload = {
      username: username.value.trim(),
      password: password.value,
      email: email.value.trim()
    }
    await register(payload)
    msgSuccess('注册成功，请登录')
    router.push('/login')
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '注册失败，请稍后重试'
    msgError(errorMessage)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="register-container">
    <div class="register-box">
      <div class="register-header">
        <h1>Agent UI</h1>
        <p>创建账户</p>
      </div>

      <form class="register-form" @submit.prevent="handleRegister">
        <div class="form-group">
          <label for="username">用户名</label>
          <input
            id="username"
            v-model="username"
            type="text"
            placeholder="输入用户名"
            class="form-input"
            :disabled="loading"
          />
        </div>

        <div class="form-group">
          <label for="email">邮箱</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="输入邮箱"
            class="form-input"
            :disabled="loading"
          />
        </div>

        <div class="form-group">
          <label for="password">密码</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="输入密码"
            class="form-input"
            :disabled="loading"
          />
        </div>

        <div class="form-group">
          <label for="confirmPassword">确认密码</label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            placeholder="确认密码"
            class="form-input"
            :disabled="loading"
          />
        </div>

        <button type="submit" class="register-button" :disabled="!isFormValid || loading">
          <span v-if="!loading">注册</span>
          <span v-else>注册中...</span>
        </button>
      </form>

      <div class="register-footer">
        <p>已有账号？<router-link to="/login">立即登录</router-link></p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

.register-box {
  width: 100%;
  max-width: 420px;
  padding: 40px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.register-header {
  text-align: center;
  margin-bottom: 32px;
}

.register-header h1 {
  margin: 0 0 8px 0;
  font-size: 28px;
  color: #1a1a1a;
  font-weight: 600;
}

.register-header p {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: #1a1a1a;
}

.form-input {
  padding: 10px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.3s;
}

.form-input:hover {
  border-color: #40a9ff;
}

.form-input:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.register-button {
  padding: 10px;
  margin-top: 8px;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 500;
  color: white;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  cursor: pointer;
  transition: all 0.3s;
}

.register-button:hover:not(:disabled) {
  box-shadow: 0 8px 16px rgba(102, 126, 234, 0.4);
  transform: translateY(-2px);
}

.register-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.register-footer {
  text-align: center;
  margin-top: 24px;
  font-size: 14px;
  color: #666;
}

.register-footer a {
  color: #1890ff;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s;
}

.register-footer a:hover {
  color: #40a9ff;
}
</style>
