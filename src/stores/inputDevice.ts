import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface InputChannel {
  id: string
  name: string
  value: number
  min: number
  max: number
  type: 'pressure' | 'position' | 'button' | 'axis'
}

export interface DeviceConfig {
  id: string
  name: string
  channels: InputChannel[]
  isConnected: boolean
}

export const useInputDeviceStore = defineStore('inputDevice', () => {
  // 状态
  const activeDeviceType = ref<string>('trackpad')
  const devices = ref<Map<string, DeviceConfig>>(new Map())
  const isInitialized = ref(false)

  // 预定义设备类型的通道
  const deviceChannelTemplates = {
    trackpad: [
      { id: 'pressure', name: '压力', value: 0, min: 0, max: 1, type: 'pressure' as const },
      { id: 'x', name: 'X 坐标', value: 0, min: 0, max: 1, type: 'position' as const },
      { id: 'y', name: 'Y 坐标', value: 0, min: 0, max: 1, type: 'position' as const },
    ],
    tablet: [
      { id: 'pressure', name: '压力', value: 0, min: 0, max: 1, type: 'pressure' as const },
      { id: 'x', name: 'X 坐标', value: 0, min: 0, max: 1, type: 'position' as const },
      { id: 'y', name: 'Y 坐标', value: 0, min: 0, max: 1, type: 'position' as const },
      { id: 'tilt_x', name: 'X 倾斜', value: 0, min: -1, max: 1, type: 'position' as const },
      { id: 'tilt_y', name: 'Y 倾斜', value: 0, min: -1, max: 1, type: 'position' as const },
    ],
    gamepad: [
      { id: 'left_stick_x', name: '左摇杆 X', value: 0, min: -1, max: 1, type: 'axis' as const },
      { id: 'left_stick_y', name: '左摇杆 Y', value: 0, min: -1, max: 1, type: 'axis' as const },
      { id: 'right_stick_x', name: '右摇杆 X', value: 0, min: -1, max: 1, type: 'axis' as const },
      { id: 'right_stick_y', name: '右摇杆 Y', value: 0, min: -1, max: 1, type: 'axis' as const },
      { id: 'left_trigger', name: '左扳机', value: 0, min: 0, max: 1, type: 'axis' as const },
      { id: 'right_trigger', name: '右扳机', value: 0, min: 0, max: 1, type: 'axis' as const },
    ],
  }

  // 计算属性
  const activeDevice = computed(() => {
    return devices.value.get(activeDeviceType.value)
  })

  const availableChannels = computed(() => {
    const device = activeDevice.value
    return device ? device.channels : []
  })

  // 动作
  function setActiveDevice(deviceType: string) {
    activeDeviceType.value = deviceType
    initializeDevice(deviceType)
  }

  function initializeDevice(deviceType: string) {
    if (!devices.value.has(deviceType)) {
      const template = deviceChannelTemplates[deviceType as keyof typeof deviceChannelTemplates]
      if (template) {
        const device: DeviceConfig = {
          id: deviceType,
          name: getDeviceName(deviceType),
          channels: template.map((ch) => ({ ...ch })),
          isConnected: false,
        }
        devices.value.set(deviceType, device)
      }
    }
  }

  function getDeviceName(deviceType: string): string {
    const names: Record<string, string> = {
      trackpad: '触控板',
      tablet: '数位板',
      gamepad: '游戏手柄',
    }
    return names[deviceType] || deviceType
  }

  function updateChannelValue(deviceType: string, channelId: string, value: number) {
    const device = devices.value.get(deviceType)
    if (device) {
      const channel = device.channels.find((ch) => ch.id === channelId)
      if (channel) {
        // 确保值在范围内
        channel.value = Math.max(channel.min, Math.min(channel.max, value))
      }
    }
  }

  function setDeviceConnected(deviceType: string, connected: boolean) {
    const device = devices.value.get(deviceType)
    if (device) {
      device.isConnected = connected
    }
  }

  function getChannelsForDevice(deviceType: string): InputChannel[] {
    const device = devices.value.get(deviceType)
    return device ? device.channels : []
  }

  // 初始化默认设备
  function initialize() {
    if (!isInitialized.value) {
      Object.keys(deviceChannelTemplates).forEach((deviceType) => {
        initializeDevice(deviceType)
      })
      isInitialized.value = true
    }
  }

  return {
    // 状态
    activeDeviceType,
    devices,
    isInitialized,

    // 计算属性
    activeDevice,
    availableChannels,

    // 动作
    setActiveDevice,
    initializeDevice,
    updateChannelValue,
    setDeviceConnected,
    getChannelsForDevice,
    initialize,
  }
})
