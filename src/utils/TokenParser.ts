/**
 * JWT Token 工具函数
 */

export interface TokenPayload {
  sub?: string | number
  username?: string
  exp?: number
  iat?: number
  [key: string]: any
}

/**
 * 解析 JWT token 中的 payload
 */
export function parseToken(token: string): TokenPayload | null {
  try {
    // 移除 "Bearer " 前缀
    const tokenStr = token.startsWith('Bearer ') ? token.substring(7) : token
    
    // JWT 格式: header.payload.signature
    const parts = tokenStr.split('.')
    if (parts.length !== 3) {
      return null
    }

    // 解码 payload
    const payload = JSON.parse(atob(parts[1]))
    return payload
  } catch (error) {
    console.error('Failed to parse token:', error)
    return null
  }
}

/**
 * 检查 token 是否过期
 * @param token JWT token
 * @param bufferSeconds 缓冲时间（秒），提前该时间认为 token 过期
 * @returns true 表示已过期，false 表示未过期
 */
export function isTokenExpired(token: string, bufferSeconds: number = 60): boolean {
  const payload = parseToken(token)
  
  if (!payload || !payload.exp) {
    // 如果无法解析或没有过期时间（例如后端返回的是不含 exp 的不透明 token），
    // 不要默认当作已过期 — 返回 false 以允许导航。后端应负责 token 的有效性检查，
    // 或者前端可以通过其他方式验证 token。
    return false
  }

  // exp 是以秒为单位的 Unix 时间戳
  const expirationTime = payload.exp * 1000 // 转换为毫秒
  const currentTime = Date.now()
  const bufferTime = bufferSeconds * 1000 // 缓冲时间转换为毫秒

  return currentTime > expirationTime - bufferTime
}

/**
 * 获取 token 剩余有效时间（秒）
 */
export function getTokenExpiresIn(token: string): number | null {
  const payload = parseToken(token)
  
  if (!payload || !payload.exp) {
    return null
  }

  const expirationTime = payload.exp * 1000 // 转换为毫秒
  const currentTime = Date.now()
  const remainingTime = Math.floor((expirationTime - currentTime) / 1000)

  return remainingTime > 0 ? remainingTime : 0
}
