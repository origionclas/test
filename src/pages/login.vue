<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { msgError, msgSuccess } from '../utils/MsgNNotice'
import { loginForUser, LoginPayload } from '../api/auth'
import { setToken, serUserId } from '../utils/TokenUtils'
const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const rememberMe = ref(false)
const loading = ref(false)

const isFormValid = computed(() => {
  return username.value.trim().length >= 3 && password.value.length >= 6
})

async function handleLogin() {
  if (!isFormValid.value) {
    msgError('请输入有效的用户名（至少3个字符）和密码（至少6个字符）')
    return
  }

  loading.value = true
  try {
    const loginBody: LoginPayload  = {
        username: username.value.trim(),
        password: password.value
    } 
      const response = await loginForUser(loginBody)
      console.log('Login response:', response)
      const data = response.data

      if (!data || !data.token) {
        throw new Error('服务器未返回 token')
      }

      // 直接保存完整的 token（包含 Bearer 前缀）
      const tokenValue = data.token

      // 保存 token 和 userId
      setToken(tokenValue)

      if (data.user && data.user.id) {
        serUserId(data.user.id)
        authStore.setUser(data.user)
      }

      authStore.setIsAuthenticated(true)
      msgSuccess('登录成功')
    
    // 清空表单
    username.value = ''
    password.value = ''
    
    // 导航到首页或之前访问的页面
    // const redirect = router.currentRoute.value.query.redirect as string
    router.push( '/')
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '登录失败，请检查用户名和密码'
    console.log('Login error:', error)
    msgError(errorMessage)
  } finally {
    loading.value = false
  }
}

function handleKeyPress(event: KeyboardEvent) {
  if (event.key === 'Enter' && isFormValid.value && !loading.value) {
    handleLogin()
  }
}
</script>

<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <h1>Agent UI</h1>
        <p>智能代理用户界面</p>
      </div>

      <form class="login-form" @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="username">用户名</label>
          <input
            id="username"
            v-model="username"
            type="text"
            placeholder="输入用户名"
            class="form-input"
            :disabled="loading"
            @keypress="handleKeyPress"
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
            @keypress="handleKeyPress"
          />
        </div>

        <div class="form-options">
          <label class="checkbox">
            <input v-model="rememberMe" type="checkbox" :disabled="loading" />
            记住我
          </label>
          <a href="#" class="forgot-password">忘记密码？</a>
        </div>

        <button
          type="submit"
          class="login-button"
          :disabled="!isFormValid || loading"
        >
          <span v-if="!loading">登录</span>
          <span v-else>登录中...</span>
        </button>
      </form>

      <div class="login-footer">
        <p>还没有账号？<router-link to="/register">立即注册</router-link></p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

.login-box {
  width: 100%;
  max-width: 420px;
  padding: 40px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-header h1 {
  margin: 0 0 8px 0;
  font-size: 28px;
  color: #1a1a1a;
  font-weight: 600;
}

.login-header p {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.login-form {
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

.form-input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: #666;
}

.checkbox input {
  cursor: pointer;
}

.forgot-password {
  color: #1890ff;
  text-decoration: none;
  transition: color 0.3s;
}

.forgot-password:hover {
  color: #40a9ff;
}

.login-button {
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

.login-button:hover:not(:disabled) {
  box-shadow: 0 8px 16px rgba(102, 126, 234, 0.4);
  transform: translateY(-2px);
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-button:active:not(:disabled) {
  transform: translateY(0);
}

.login-footer {
  text-align: center;
  margin-top: 24px;
  font-size: 14px;
  color: #666;
}

.login-footer a {
  color: #1890ff;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s;
}

.login-footer a:hover {
  color: #40a9ff;
}
</style>