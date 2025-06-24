/**
 * 双浏览器桥接解决方案
 * Safari (主模式): 负责压感输入，发送数据
 * Chrome (从模式): 负责 MIDI 输出，接收数据
 */

export type BridgeMode = 'master' | 'slave' | 'auto'

export interface PressureData {
  pressure: number
  x: number
  y: number
}

export interface MidiData {
  cc: number
  value: number
  channel: number
}

export interface StatusData {
  browser: 'safari' | 'chrome' | 'other'
  mode: BridgeMode
  capabilities: {
    pressure: boolean
    midi: boolean
  }
}

export interface BridgeMessage {
  type: 'pressure' | 'position' | 'midi' | 'status'
  data: PressureData | MidiData | StatusData
  timestamp: number
}

export class BrowserBridge {
  private ws: WebSocket | null = null
  private isConnected = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectInterval = 2000
  private messageCallbacks: Array<(message: BridgeMessage) => void> = []
  private mode: BridgeMode = 'auto'

  constructor(
    private port: number = 8080,
    mode: BridgeMode = 'auto',
  ) {
    this.mode = mode === 'auto' ? this.detectBridgeMode() : mode
  }

  private detectBridgeMode(): BridgeMode {
    const userAgent = navigator.userAgent.toLowerCase()
    const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent)
    const isChrome = /chrome/.test(userAgent)

    // Safari 优先作为主模式（压感输入）
    if (isSafari) return 'master'
    // Chrome 作为从模式（MIDI 输出）
    if (isChrome) return 'slave'
    // 其他浏览器默认从模式
    return 'slave'
  }

  get bridgeMode(): BridgeMode {
    return this.mode
  }

  get isMaster(): boolean {
    return this.mode === 'master'
  }

  get isSlave(): boolean {
    return this.mode === 'slave'
  }

  get connected(): boolean {
    return this.isConnected
  }

  get status(): string {
    if (this.isConnected) return 'connected'
    if (this.reconnectAttempts > 0) return 'reconnecting'
    return 'disconnected'
  }

  async connect(): Promise<boolean> {
    try {
      this.ws = new WebSocket(`ws://localhost:${this.port}`)

      this.ws.onopen = () => {
        console.log('🔗 浏览器桥接已连接')
        this.isConnected = true
        this.reconnectAttempts = 0
        this.sendStatus()
      }

      this.ws.onclose = () => {
        console.log('🔌 浏览器桥接已断开')
        this.isConnected = false
        this.attemptReconnect()
      }

      this.ws.onerror = (error) => {
        console.error('❌ 桥接连接错误:', error)
      }

      return new Promise((resolve) => {
        if (this.ws) {
          this.ws.onopen = () => {
            this.isConnected = true
            resolve(true)
          }
          this.ws.onerror = () => resolve(false)
        }
      })
    } catch (error) {
      console.error('❌ 无法连接到桥接服务:', error)
      return false
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`🔄 尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
      setTimeout(() => this.connect(), this.reconnectInterval)
    }
  }

  sendPressureData(pressure: number, x: number, y: number) {
    // 只有主模式才发送压感数据
    if (this.mode === 'master') {
      this.send({
        type: 'pressure',
        data: { pressure, x, y },
        timestamp: Date.now(),
      })
    }
  }

  sendMidiData(cc: number, value: number, channel = 0) {
    // 只有从模式才发送 MIDI 数据
    if (this.mode === 'slave') {
      this.send({
        type: 'midi',
        data: { cc, value, channel },
        timestamp: Date.now(),
      })
    }
  }

  private send(message: BridgeMessage) {
    if (this.ws && this.isConnected) {
      this.ws.send(JSON.stringify(message))
    }
  }

  private sendStatus() {
    const userAgent = navigator.userAgent.toLowerCase()
    const platform = navigator.platform.toLowerCase()

    const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent)
    const isChrome = /chrome/.test(userAgent)
    const isMac = /mac/.test(platform) || /iphone|ipad/.test(userAgent)
    const isIOS = /iphone|ipad/.test(userAgent)

    // 压感支持检测
    let pressureSupported = false
    if (isSafari && (isMac || isIOS)) {
      pressureSupported = true
    } else if (isChrome) {
      // Chrome 在某些设备上支持压感（数位板、触屏设备）
      const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      const hasPointerEvents = 'onpointerdown' in window
      const isSurface = /surface/.test(userAgent)
      pressureSupported = hasTouchSupport || hasPointerEvents || isSurface
    }

    this.send({
      type: 'status',
      data: {
        browser: isSafari ? 'safari' : isChrome ? 'chrome' : 'other',
        mode: this.mode,
        capabilities: {
          pressure: pressureSupported,
          midi: isChrome || !!navigator.requestMIDIAccess,
        },
      },
      timestamp: Date.now(),
    })
  }

  onMessage(callback: (message: BridgeMessage) => void) {
    this.messageCallbacks.push(callback)

    if (this.ws) {
      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          // 通知所有回调
          this.messageCallbacks.forEach((cb) => cb(message))
        } catch (error) {
          console.error('❌ 解析桥接消息失败:', error)
        }
      }
    }
  }

  removeMessageCallback(callback: (message: BridgeMessage) => void) {
    const index = this.messageCallbacks.indexOf(callback)
    if (index > -1) {
      this.messageCallbacks.splice(index, 1)
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
      this.isConnected = false
    }
  }
}
