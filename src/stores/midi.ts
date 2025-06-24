import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface MidiMapping {
  id: string
  source: string // 输入通道名称
  sourceDevice: string // 设备类型
  sourceChannel: string // 通道ID
  cc: number // MIDI CC 号
  minValue: number
  maxValue: number
  curve: 'linear' | 'exponential' | 'logarithmic'
  enabled: boolean
}

export interface MidiDevice {
  id: string
  name: string
  manufacturer: string
  isConnected: boolean
}

export const useMidiStore = defineStore('midi', () => {
  // 状态
  const mappings = ref<MidiMapping[]>([])
  const devices = ref<MidiDevice[]>([])
  const selectedDevice = ref<string | null>(null)
  const isInitialized = ref(false)
  const lastError = ref<string | null>(null)

  // 计算属性
  const activeMappings = computed(() => {
    return mappings.value.filter((mapping) => mapping.enabled)
  })

  const connectedDevices = computed(() => {
    return devices.value.filter((device) => device.isConnected)
  })

  // 动作
  function addMapping(mapping: Omit<MidiMapping, 'id'>) {
    const newMapping: MidiMapping = {
      ...mapping,
      id: generateId(),
    }
    mappings.value.push(newMapping)
    return newMapping.id
  }

  function removeMapping(id: string) {
    const index = mappings.value.findIndex((mapping) => mapping.id === id)
    if (index > -1) {
      mappings.value.splice(index, 1)
    }
  }

  function updateMapping(id: string, updates: Partial<MidiMapping>) {
    const mapping = mappings.value.find((m) => m.id === id)
    if (mapping) {
      Object.assign(mapping, updates)
    }
  }

  function toggleMapping(id: string) {
    const mapping = mappings.value.find((m) => m.id === id)
    if (mapping) {
      mapping.enabled = !mapping.enabled
    }
  }

  function addDevice(device: Omit<MidiDevice, 'id'>) {
    const newDevice: MidiDevice = {
      ...device,
      id: generateId(),
    }
    devices.value.push(newDevice)
    return newDevice.id
  }

  function removeDevice(id: string) {
    const index = devices.value.findIndex((device) => device.id === id)
    if (index > -1) {
      devices.value.splice(index, 1)
      if (selectedDevice.value === id) {
        selectedDevice.value = null
      }
    }
  }

  function setDeviceConnected(id: string, connected: boolean) {
    const device = devices.value.find((d) => d.id === id)
    if (device) {
      device.isConnected = connected
    }
  }

  function selectDevice(id: string) {
    const device = devices.value.find((d) => d.id === id)
    if (device && device.isConnected) {
      selectedDevice.value = id
    }
  }

  function sendMidiCC(cc: number, value: number) {
    if (!selectedDevice.value) {
      lastError.value = '没有选择 MIDI 设备'
      return false
    }

    try {
      // 这里应该调用 WEBMIDI.js 发送 CC 消息
      // 具体实现将在服务层完成
      console.log(`发送 MIDI CC: ${cc}, 值: ${value}`)
      return true
    } catch (error) {
      lastError.value = error instanceof Error ? error.message : '发送 MIDI 消息失败'
      return false
    }
  }

  function clearError() {
    lastError.value = null
  }

  function generateId(): string {
    return Math.random().toString(36).substr(2, 9)
  }

  // 初始化
  function initialize() {
    if (!isInitialized.value) {
      // 添加一些示例映射
      addMapping({
        source: '压力',
        sourceDevice: 'trackpad',
        sourceChannel: 'pressure',
        cc: 1,
        minValue: 0,
        maxValue: 127,
        curve: 'linear',
        enabled: true,
      })

      addMapping({
        source: 'X 坐标',
        sourceDevice: 'trackpad',
        sourceChannel: 'x',
        cc: 2,
        minValue: 0,
        maxValue: 127,
        curve: 'linear',
        enabled: true,
      })

      isInitialized.value = true
    }
  }

  return {
    // 状态
    mappings,
    devices,
    selectedDevice,
    isInitialized,
    lastError,

    // 计算属性
    activeMappings,
    connectedDevices,

    // 动作
    addMapping,
    removeMapping,
    updateMapping,
    toggleMapping,
    addDevice,
    removeDevice,
    setDeviceConnected,
    selectDevice,
    sendMidiCC,
    clearError,
    initialize,
  }
})
