import { defineStore } from 'pinia'

interface AppState {
  loading: boolean
  currentTime: string
  version: string
}

export const useAppStore = defineStore('app', {
  state: (): AppState => ({
    loading: false,
    currentTime: new Date().toLocaleString(),
    version: '0.1.0'
  }),
  
  actions: {
    setLoading(loading: boolean) {
      this.loading = loading
    },
    
    updateCurrentTime() {
      this.currentTime = new Date().toLocaleString()
    }
  }
})