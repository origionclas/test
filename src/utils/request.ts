import axios, { AxiosInstance } from 'axios'
import { getToken, removeToken, removeUserId } from './TokenUtils'
// import { msgError } from './MsgNNotice'
import router from '../router'

axios.defaults.headers['Content-Type'] = 'application/json;charset=utf-8'

// 获取 API 基础 URL
const getBaseURL = () => {
  // 尝试从 import.meta.env 获取，如果没有则使用默认值
  const envUrl = (import.meta.env as any)?.APP_BASE_API
  console.log('Base URL:', envUrl);
  return envUrl || '/api'
}

// 创建 axios 实例
const service: AxiosInstance = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000
})

// 不需要 token 的接口列表
const noTokenUrls: string[] = ['/user/login', '/user/register', '/user/refresh-token']

// 请求拦截器
service.interceptors.request.use(
  config => {
    const token = getToken()
    const url = config.url || ''

    // 如果需要 token 且有 token，添加到 header
    if (!noTokenUrls.some(path => url.includes(path))) {
      if (token) {
        // token 已经包含 Bearer 前缀，直接使用
        config.headers['Authorization'] = token
      }
    }

    // 处理 FormData（文件上传）
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }

    return config
  },
  error => Promise.reject(error)
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    const data = response.data

    // 处理业务逻辑错误
    if (data?.code === 401 || data?.code === 'UNAUTHORIZED') {
      console.error('Token 已过期或无效')
      removeToken()
      removeUserId()
      // 跳转到登录页（但不是在拦截器中直接跳转，防止无限循环）
      if (router.currentRoute.value.name !== 'login') {
        router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } })
      }
      return Promise.reject(new Error('认证失败，请重新登录'))
    }

    if (data?.code && data.code !== 200 && data.code !== 'SUCCESS' && data.code !== 'OK') {
      return Promise.reject(new Error(data.message || '请求失败'))
    }

    return response
  },
  error => {
    let errorMessage = '请求失败'

    if (error.response) {
      const status = error.response.status
      const data = error.response.data

      // 处理不同的 HTTP 状态码
      switch (status) {
        case 400:
          errorMessage = data?.message || '请求参数错误'
          break
        case 401:
          errorMessage = '认证失败，请重新登录'
          removeToken()
          removeUserId()
          router.push({ name: 'login' })
          break
        case 403:
          errorMessage = '没有权限访问该资源'
          break
        case 404:
          errorMessage = '请求的资源不存在'
          break
        case 500:
          errorMessage = '服务器内部错误'
          break
        case 502:
        case 503:
          errorMessage = '服务暂时不可用'
          break
        default:
          errorMessage = data?.message || `请求失败 (${status})`
      }
    } else if (error.request) {
      errorMessage = '网络连接失败，请检查网络设置'
    } else {
      errorMessage = error.message || '未知错误'
    }

    return Promise.reject(new Error(errorMessage))
  }
)


export default service