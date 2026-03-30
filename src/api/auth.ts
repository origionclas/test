// login
import request from '../utils/request'

export interface LoginPayload {
  username: string
  password: string
}

export interface RegisterPayload {
  username: string
  password: string
  email?: string
}

export function loginForUser(paload: LoginPayload) {
    return request.post('/user/login', paload)
}
// logout
export function logout() {
    return request.post('/user/logout')
}

// 更新用户信息
export function updateUserProfile(userId: number, data: {username?: string, email?: string, avatar?: string}) {
    return request.put(`/user/${userId}`, data)
}

// register
export function register(paload: RegisterPayload) {
    return request.post('/user/register', paload)
}
