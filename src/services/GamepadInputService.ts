import { useInputDeviceStore } from '@/stores/inputDevice'
import { useVisualizationStore } from '@/stores/visualization'

export class GamepadInputService {
  private isInitialized = false
  private inputDeviceStore = useInputDeviceStore()
  private visualizationStore = useVisualizationStore()
  private animationFrame: number | null = null
  private connectedGamepads = new Map<number, Gamepad>()

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true

    try {
      // 检查浏览器是否支持 Gamepad API
      if (!('getGamepads' in navigator)) {
        console.warn('Gamepad API not supported')
        return false
      }

      // 监听游戏手柄连接和断开
      window.addEventListener('gamepadconnected', this.handleGamepadConnected.bind(this))
      window.addEventListener('gamepaddisconnected', this.handleGamepadDisconnected.bind(this))

      // 开始轮询游戏手柄状态
      this.startPolling()

      this.isInitialized = true
      console.log('Gamepad input service initialized')
      return true
    } catch (error) {
      console.error('Failed to initialize gamepad input:', error)
      return false
    }
  }

  private handleGamepadConnected(event: GamepadEvent) {
    const gamepad = event.gamepad
    this.connectedGamepads.set(gamepad.index, gamepad)
    this.inputDeviceStore.setDeviceConnected('gamepad', true)

    console.log(`Gamepad connected: ${gamepad.id}`)
  }

  private handleGamepadDisconnected(event: GamepadEvent) {
    const gamepad = event.gamepad
    this.connectedGamepads.delete(gamepad.index)

    if (this.connectedGamepads.size === 0) {
      this.inputDeviceStore.setDeviceConnected('gamepad', false)
    }

    console.log(`Gamepad disconnected: ${gamepad.id}`)
  }

  private startPolling() {
    const poll = () => {
      this.updateGamepadStates()
      this.animationFrame = requestAnimationFrame(poll)
    }

    this.animationFrame = requestAnimationFrame(poll)
  }

  private updateGamepadStates() {
    const gamepads = navigator.getGamepads()

    for (let i = 0; i < gamepads.length; i++) {
      const gamepad = gamepads[i]
      if (gamepad && this.connectedGamepads.has(gamepad.index)) {
        this.processGamepadInput(gamepad)
      }
    }
  }

  private processGamepadInput(gamepad: Gamepad) {
    // 处理摇杆输入
    if (gamepad.axes.length >= 2) {
      // 左摇杆
      const leftStickX = gamepad.axes[0]
      const leftStickY = gamepad.axes[1]

      this.inputDeviceStore.updateChannelValue('gamepad', 'left_stick_x', leftStickX)
      this.inputDeviceStore.updateChannelValue('gamepad', 'left_stick_y', leftStickY)

      this.visualizationStore.updateParameter('左摇杆 X', (leftStickX + 1) / 2) // 转换到 0-1 范围
      this.visualizationStore.updateParameter('左摇杆 Y', (leftStickY + 1) / 2)
    }

    if (gamepad.axes.length >= 4) {
      // 右摇杆
      const rightStickX = gamepad.axes[2]
      const rightStickY = gamepad.axes[3]

      this.inputDeviceStore.updateChannelValue('gamepad', 'right_stick_x', rightStickX)
      this.inputDeviceStore.updateChannelValue('gamepad', 'right_stick_y', rightStickY)

      this.visualizationStore.updateParameter('右摇杆 X', (rightStickX + 1) / 2)
      this.visualizationStore.updateParameter('右摇杆 Y', (rightStickY + 1) / 2)
    }

    // 处理扳机输入
    if (gamepad.buttons.length > 6) {
      // 左扳机（通常是索引 6）
      const leftTrigger = gamepad.buttons[6]?.value || 0
      this.inputDeviceStore.updateChannelValue('gamepad', 'left_trigger', leftTrigger)
      this.visualizationStore.updateParameter('左扳机', leftTrigger)

      // 右扳机（通常是索引 7）
      const rightTrigger = gamepad.buttons[7]?.value || 0
      this.inputDeviceStore.updateChannelValue('gamepad', 'right_trigger', rightTrigger)
      this.visualizationStore.updateParameter('右扳机', rightTrigger)
    }
  }

  destroy() {
    // 停止轮询
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame)
      this.animationFrame = null
    }

    // 移除事件监听器
    window.removeEventListener('gamepadconnected', this.handleGamepadConnected.bind(this))
    window.removeEventListener('gamepaddisconnected', this.handleGamepadDisconnected.bind(this))

    // 清理状态
    this.connectedGamepads.clear()
    this.isInitialized = false
  }
}
