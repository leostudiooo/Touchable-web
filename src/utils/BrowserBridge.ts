/**
 * 双浏览器桥接解决方案
 * Safari: 负责压感输入
 * Chrome: 负责 MIDI 输出
 */

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

  constructor(private port: number = 8080) {}

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
    this.send({
      type: 'pressure',
      data: { pressure, x, y },
      timestamp: Date.now(),
    })
  }

  sendMidiData(cc: number, value: number, channel = 0) {
    this.send({
      type: 'midi',
      data: { cc, value, channel },
      timestamp: Date.now(),
    })
  }

  private send(message: BridgeMessage) {
    if (this.ws && this.isConnected) {
      this.ws.send(JSON.stringify(message))
    }
  }

  private sendStatus() {
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
    const isChrome = /chrome/i.test(navigator.userAgent)

    this.send({
      type: 'status',
      data: {
        browser: isSafari ? 'safari' : isChrome ? 'chrome' : 'other',
        capabilities: {
          pressure: isSafari,
          midi: isChrome || !!navigator.requestMIDIAccess,
        },
      },
      timestamp: Date.now(),
    })
  }

  onMessage(callback: (message: BridgeMessage) => void) {
    if (this.ws) {
      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          callback(message)
        } catch (error) {
          console.error('❌ 解析桥接消息失败:', error)
        }
      }
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
