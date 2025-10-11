import { createPinia } from 'pinia'

// 创建Pinia实例
const pinia = createPinia()

// 导出所有store
export { useGithubStore } from './github'
export { usePingCodeStore } from './pingcode'
export { useAppStore } from './app'
export { useThemeStore } from './theme'
export { useNotesStore } from './notes'

export default pinia