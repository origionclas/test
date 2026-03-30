import { defineStore } from 'pinia'
import { getToken } from '../utils/TokenUtils'

export interface User {
  id: number
  username: string
  email?: string
  avatar?: string
  isActive?: boolean
}



export interface LoginResponse {
  token: string
  user: User
}




export const useAuthStore = defineStore('auth',  {
  state: () => {
    return {
      user: null as User | null,
      isAuthenticated: !!getToken(),
    }
  },

  actions: {
   

    getUser() {
      return this.user
    },
    setUser (user: User | null) {
      this.user = user
    },
    getIsAuthenticated() {
      return this.isAuthenticated
    },
    setIsAuthenticated(isAuth: boolean) {
      this.isAuthenticated = isAuth
    }

  /**
   * 检查认证状态
   */
  // function checkAuth(): boolean {
  //   const storedToken = getToken()
  //   if (storedToken) {
  //     token.value = storedToken
  //     isAuthenticated.value = true
  //     return true
  //   }
  //   isAuthenticated.value = false
  //   return false
  // }


  },
  persist: {
    paths: [ 'user', 'isAuthenticated'],
  },

})
