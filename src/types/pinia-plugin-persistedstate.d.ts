import 'pinia'

// 扩展 Pinia 的类型声明，使得 options API 的 defineStore 接受 `persist` 配置
// 兼容常见的 pinia-plugin-persistedstate 用法（paths 或 strategies）
declare module 'pinia' {
  interface DefineStoreOptionsBase<S, Store> {
    persist?:
      | boolean
      | {
          // 兼容简单配置：paths 列表
          paths?: string[]
          // 兼容策略配置：多策略支持（key, storage, paths）
          strategies?: Array<{
            key?: string
            storage?: Storage
            paths?: string[]
          }>
        }
  }
}
