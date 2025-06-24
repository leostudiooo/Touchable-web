import { WebMidi, type MidiOutput, type MidiEvent } from 'webmidi'
import { useMidiStore } from '@/stores/midi'

export class MidiOutputService {
  private isInitialized = false
  private midiStore = useMidiStore()
  private selectedOutput: MidiOutput | null = null

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true

    try {
      // 启用 WebMidi
      await new Promise<void>((resolve, reject) => {
        WebMidi.enable((error) => {
          if (error) {
            reject(error)
          } else {
            resolve()
          }
        })
      })

      // 扫描可用的 MIDI 设备
      this.scanMidiDevices()

      // 监听设备连接和断开
      WebMidi.addListener('connected', this.handleDeviceConnected.bind(this))
      WebMidi.addListener('disconnected', this.handleDeviceDisconnected.bind(this))

      this.isInitialized = true
      console.log('MIDI output service initialized')
      return true
    } catch (error) {
      console.error('Failed to initialize MIDI output:', error)
      return false
    }
  }

  private scanMidiDevices() {
    // 清空现有设备列表
    this.midiStore.devices.forEach((device) => {
      this.midiStore.removeDevice(device.id)
    })

    // 添加输出设备
    WebMidi.outputs.forEach((output) => {
      this.midiStore.addDevice({
        name: output.name,
        manufacturer: output.manufacturer || 'Unknown',
        isConnected: true,
      })
    })

    // 如果有设备且没有选择设备，自动选择第一个
    if (WebMidi.outputs.length > 0 && !this.selectedOutput) {
      this.selectOutput(WebMidi.outputs[0])
    }
  }

  private handleDeviceConnected(event: MidiEvent) {
    console.log('MIDI device connected:', event)
    this.scanMidiDevices()
  }

  private handleDeviceDisconnected(event: MidiEvent) {
    console.log('MIDI device disconnected:', event)
    this.scanMidiDevices()
  }

  selectOutput(output: MidiOutput) {
    this.selectedOutput = output
    console.log(`Selected MIDI output: ${output.name}`)
  }

  selectOutputById(id: string) {
    const output = WebMidi.outputs.find((o) => o.id === id)
    if (output) {
      this.selectOutput(output)
      this.midiStore.selectDevice(id)
    }
  }

  sendControlChange(controller: number, value: number, channel: number = 1): boolean {
    if (!this.selectedOutput) {
      this.midiStore.lastError = '没有选择 MIDI 输出设备'
      return false
    }

    try {
      // 确保值在 0-127 范围内
      const midiValue = Math.max(0, Math.min(127, Math.round(value)))

      this.selectedOutput.sendControlChange(controller, midiValue, channel)
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '发送 MIDI 消息失败'
      this.midiStore.lastError = errorMessage
      console.error('Failed to send MIDI CC:', error)
      return false
    }
  }

  // 批量发送多个 CC 消息
  sendMultipleCC(messages: Array<{ cc: number; value: number; channel?: number }>): boolean {
    if (!this.selectedOutput) {
      this.midiStore.lastError = '没有选择 MIDI 输出设备'
      return false
    }

    try {
      messages.forEach(({ cc, value, channel = 1 }) => {
        const midiValue = Math.max(0, Math.min(127, Math.round(value)))
        this.selectedOutput!.sendControlChange(cc, midiValue, channel)
      })
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '发送 MIDI 消息失败'
      this.midiStore.lastError = errorMessage
      console.error('Failed to send MIDI CC batch:', error)
      return false
    }
  }

  // 获取可用的输出设备
  getAvailableOutputs(): MidiOutput[] {
    return WebMidi.outputs
  }

  // 获取当前选择的输出设备
  getCurrentOutput(): MidiOutput | null {
    return this.selectedOutput
  }

  destroy() {
    if (this.isInitialized) {
      WebMidi.disable()
      this.selectedOutput = null
      this.isInitialized = false
    }
  }
}
