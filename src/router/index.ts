import { createRouter, createWebHistory, RouteRecordRaw, NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { isTokenExpired } from '../utils/TokenParser'
import { removeToken, removeUserId } from '../utils/TokenUtils'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('../pages/index.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../pages/login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('../pages/register.vue'),
    meta: { requiresAuth: false }
  },
  // 404 重定向
  {
    path: '/:pathMatch(.*)*',
    redirect: () => {
      const token = localStorage.getItem('token')
      return token ? '/' : '/login'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

/**
 * 导航守卫：检查认证状态
 */
router.beforeEach(
  async (
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
    next: NavigationGuardNext
  ) => {
    console.log("from:", from);
    console.log("to:", to);
    // const requiresAuth = to.meta.requiresAuth as boolean | undefined
    // console.log("requiresAuth:", requiresAuth);
    const token = localStorage.getItem('token')
    console.log("token:", token);
    const isAuthenticated = !!token
    console.log("isAuthenticated:", isAuthenticated);
    // 需要认证但未登录
    if (to.meta.requiresAuth && !isAuthenticated) {
      console.log("asfasdfkjabsdasifukbaefiuaefub")
      // 现在出现一个问题本第一次加载是from:/,to:/login,于是走了第一个判断
      // 但是第一个判断让他去/login,导致to:/login
      // 这就会走两次路由守卫
      // 如何第一次直接跳转登录页面
      return next({
        name: 'login',
        query: { redirect: to.fullPath }
      })
    }

    // 已登录且要访问登录页,where you from,come to your from
    if (isAuthenticated && to.name === 'login') {
      next({ name: 'home' })
      return
    }
    // token 是否过期
    if (isAuthenticated && isTokenExpired(token!)) {
      console.warn('Token expired, redirecting to login')
      removeToken()
      removeUserId()
      next({
        name: 'login',
        query: { redirect: to.fullPath }
      })
      return
    }
    
    next()
  }
)

export default router