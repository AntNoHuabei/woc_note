import { defineStore } from 'pinia'

// 只保留三种主题模式
export type Theme = 'system' | 'light' | 'dark'

// 系统主题媒体查询
const systemDarkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

export const useThemeStore = defineStore('theme', {
  state: () => ({
    currentTheme: 'system' as Theme
  }),
  
  getters: {
    themeClass: (state) => {
      // 如果是系统主题，根据系统设置返回实际的主题类
      if (state.currentTheme === 'system') {
        return systemDarkModeMediaQuery.matches ? 'theme-dark' : 'theme-light'
      }
      return `theme-${state.currentTheme}`
    },
    
    // 返回实际应用的主题（解析系统主题）
    actualTheme: (state) => {
      if (state.currentTheme === 'system') {
        return systemDarkModeMediaQuery.matches ? 'dark' : 'light'
      }
      return state.currentTheme
    }
  },
  
  actions: {
    initTheme() {
      // 从localStorage读取保存的主题
      const savedTheme = localStorage.getItem('theme') as Theme | null
      if (savedTheme) {
        this.changeTheme(savedTheme)
      } else {
        // 默认使用系统主题
        this.changeTheme('system')
      }
      
      // 监听系统主题变化
      systemDarkModeMediaQuery.addEventListener('change', () => {
        // 只有当当前是系统主题时，才响应系统变化
        if (this.currentTheme === 'system') {
          this.applyTheme()
        }
      })
    },
    
    changeTheme(theme: Theme) {
      // 更新状态
      this.currentTheme = theme
      // 应用主题
      this.applyTheme()
      // 保存主题设置
      localStorage.setItem('theme', theme)
    },
    
    // 应用主题到DOM
    applyTheme() {
      // 移除所有主题类
      document.body.classList.remove('theme-light', 'theme-dark')
      // 添加实际的主题类
      document.body.classList.add(this.themeClass)
    }
  }
})