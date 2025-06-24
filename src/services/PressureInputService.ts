import { useInputDeviceStore } from '@/stores/inputDevice'
import { useVisualizationStore } from '@/stores/visualization'

export class PressureInputService {
  private isInitialized = false
  private inputDeviceStore = useInputDeviceStore()
  private visualizationStore = useVisualizationStore()

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true

    try {
      // 检查浏览器是否支持 Pressure.js
      if (typeof window === 'undefined') {
        console.warn('Pressure.js: Window is not available')
        return false
      }

      // 动态导入 Pressure.js
      const Pressure = await import('pressure')

      // 设置压力监听
      Pressure.set(
        document.body,
        {
          start: (event: MouseEvent | TouchEvent) => {
            this.handlePressureStart(event)
          },
          change: (force: number, event: MouseEvent | TouchEvent) => {
            this.handlePressureChange(force, event)
          },
          end: (event: MouseEvent | TouchEvent) => {
            this.handlePressureEnd(event)
          },
        },
        {
          // 配置选项
          only: 'mouse', // 只监听鼠标事件
          preventDefault: false,
          preventSelect: false,
        },
      )

      this.inputDeviceStore.setDeviceConnected('trackpad', true)
      this.isInitialized = true

      console.log('Pressure input service initialized')
      return true
    } catch (error) {
      console.error('Failed to initialize pressure input:', error)
      return false
    }
  }

  private handlePressureStart(event: MouseEvent | TouchEvent) {
    // 处理压力开始事件
    this.updateCoordinates(event)
  }

  private handlePressureChange(force: number, event: MouseEvent | TouchEvent) {
    // 更新压力值
    this.inputDeviceStore.updateChannelValue('trackpad', 'pressure', force)
    this.visualizationStore.updateParameter('压力', force)

    // 更新坐标
    this.updateCoordinates(event)
  }

  private handlePressureEnd(_event: MouseEvent | TouchEvent) {
    // 压力结束，重置为0
    this.inputDeviceStore.updateChannelValue('trackpad', 'pressure', 0)
    this.visualizationStore.updateParameter('压力', 0)
  }

  private updateCoordinates(event: MouseEvent | TouchEvent) {
    if (!event || !('clientX' in event)) return

    const target = event.target as HTMLElement
    if (!target) return

    const rect = target.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width
    const y = (event.clientY - rect.top) / rect.height

    // 确保坐标在 0-1 范围内
    const normalizedX = Math.max(0, Math.min(1, x))
    const normalizedY = Math.max(0, Math.min(1, y))

    this.inputDeviceStore.updateChannelValue('trackpad', 'x', normalizedX)
    this.inputDeviceStore.updateChannelValue('trackpad', 'y', normalizedY)

    this.visualizationStore.updateParameter('X 坐标', normalizedX)
    this.visualizationStore.updateParameter('Y 坐标', normalizedY)
  }

  destroy() {
    // 清理资源
    this.isInitialized = false
  }
}
