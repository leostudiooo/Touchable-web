import { ref, onMounted, onUnmounted } from 'vue'
import { inputManager } from '@/services/InputManagerService'

export function useInputManager() {
  const isInitialized = ref(false)
  const isInitializing = ref(false)
  const initializationError = ref<string | null>(null)

  const initialize = async () => {
    if (isInitializing.value || isInitialized.value) return

    isInitializing.value = true
    initializationError.value = null

    try {
      const result = await inputManager.initialize()
      if (result) {
        isInitialized.value = true
        console.log('Input manager initialized from composable')
      } else {
        initializationError.value = '输入管理器初始化失败'
      }
    } catch (error) {
      initializationError.value = error instanceof Error ? error.message : '未知错误'
      console.error('Error initializing input manager:', error)
    } finally {
      isInitializing.value = false
    }
  }

  const destroy = () => {
    inputManager.destroy()
    isInitialized.value = false
  }

  // 自动初始化和清理
  onMounted(() => {
    initialize()
  })

  onUnmounted(() => {
    // 注意：不要在这里销毁，因为可能有其他组件在使用
    // destroy()
  })

  return {
    isInitialized,
    isInitializing,
    initializationError,
    initialize,
    destroy,
    inputManager,
  }
}
