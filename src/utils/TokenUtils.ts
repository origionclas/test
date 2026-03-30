const tokenKey: string = 'token'
const userID: string = 'userId'

/**
 * 设置 token
 */
export function setToken(tokenValue: string) {
  localStorage.setItem(tokenKey, tokenValue)
  return tokenValue
}

/**
 * 获取 token
 */
export function getToken() {
  return localStorage.getItem(tokenKey) || ''
}

/**
 * 移除 token
 */
export function removeToken() {
  return localStorage.removeItem(tokenKey)
}

/**
 * 设置 userId
 */
export function serUserId(userId: number) {
  localStorage.setItem(userID, String(userId))
  return userId
}

/**
 * 获取 userId
 */
export function getUserId() {
  return localStorage.getItem(userID) || 0
}

/**
 * 移除 userId
 */
export function removeUserId() {
  return localStorage.removeItem(userID)
}