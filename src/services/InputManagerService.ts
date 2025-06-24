import { PressureInputService } from './PressureInputService'
import { GamepadInputService } from './GamepadInputService'
import { MidiOutputService } from './MidiOutputService'
import { useInputDeviceStore } from '@/stores/inputDevice'
import { useMidiStore } from '@/stores/midi'
import { useVisualizationStore } from '@/stores/visualization'

export class InputManagerService {
  private pressureService: PressureInputService
  private gamepadService: GamepadInputService
  private midiService: MidiOutputService

  private inputDeviceStore = useInputDeviceStore()
  private midiStore = useMidiStore()
  private visualizationStore = useVisualizationStore()

  private isInitialized = false
  private mappingUpdateInterval: number | null = null

  constructor() {
    this.pressureService = new PressureInputService()
    this.gamepadService = new GamepadInputService()
    this.midiService = new MidiOutputService()
  }

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true

    try {
      console.log('Initializing input manager...')

      // 初始化各个服务
      const pressureResult = await this.pressureService.initialize()
      const gamepadResult = await this.gamepadService.initialize()
      const midiResult = await this.midiService.initialize()

      console.log('Service initialization results:', {
        pressure: pressureResult,
        gamepad: gamepadResult,
        midi: midiResult,
      })

      // 开始映射更新循环
      this.startMappingUpdates()

      this.isInitialized = true
      console.log('Input manager initialized successfully')
      return true
    } catch (error) {
      console.error('Failed to initialize input manager:', error)
      return false
    }
  }

  private startMappingUpdates() {
    // 以 60fps 的频率处理映射更新
    this.mappingUpdateInterval = window.setInterval(() => {
      this.processMappings()
    }, 1000 / 60)
  }

  private processMappings() {
    const activeMappings = this.midiStore.activeMappings
    const activeDevice = this.inputDeviceStore.activeDevice

    if (!activeDevice || activeMappings.length === 0) {
      return
    }

    // 处理每个活动映射
    activeMappings.forEach((mapping) => {
      if (mapping.sourceDevice === activeDevice.id) {
        const channel = activeDevice.channels.find((ch) => ch.id === mapping.sourceChannel)
        if (channel) {
          // 应用映射曲线和范围转换
          let mappedValue = this.applyMappingCurve(channel.value, mapping.curve)
          mappedValue = this.mapToRange(
            mappedValue,
            channel.min,
            channel.max,
            mapping.minValue,
            mapping.maxValue,
          )

          // 发送 MIDI CC
          this.midiService.sendControlChange(mapping.cc, mappedValue)
        }
      }
    })
  }

  private applyMappingCurve(
    value: number,
    curve: 'linear' | 'exponential' | 'logarithmic',
  ): number {
    // 确保值在 0-1 范围内
    const normalizedValue = Math.max(0, Math.min(1, value))

    switch (curve) {
      case 'exponential':
        return Math.pow(normalizedValue, 2)

      case 'logarithmic':
        // 避免 log(0)，使用小的偏移量
        return Math.log(normalizedValue * 0.99 + 0.01) / Math.log(1.01)

      case 'linear':
      default:
        return normalizedValue
    }
  }

  private mapToRange(
    value: number,
    sourceMin: number,
    sourceMax: number,
    targetMin: number,
    targetMax: number,
  ): number {
    // 首先归一化到 0-1
    const normalized = (value - sourceMin) / (sourceMax - sourceMin)

    // 然后映射到目标范围
    return targetMin + normalized * (targetMax - targetMin)
  }

  // 手动触发映射更新（用于测试）
  triggerMappingUpdate() {
    this.processMappings()
  }

  // 获取服务实例
  getPressureService(): PressureInputService {
    return this.pressureService
  }

  getGamepadService(): GamepadInputService {
    return this.gamepadService
  }

  getMidiService(): MidiOutputService {
    return this.midiService
  }

  // 清理资源
  destroy() {
    if (this.mappingUpdateInterval !== null) {
      clearInterval(this.mappingUpdateInterval)
      this.mappingUpdateInterval = null
    }

    this.pressureService.destroy()
    this.gamepadService.destroy()
    this.midiService.destroy()

    this.isInitialized = false
  }
}

// 创建全局单例实例
export const inputManager = new InputManagerService()
