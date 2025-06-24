<template>
  <div class="touchable-app">
    <!-- 顶部标题栏 -->
    <header class="app-header">
      <h1>🎹 Touchable Web</h1>
      <p>将触控设备转换为 MIDI 控制器</p>
    </header>

    <!-- 主要内容区 -->
    <main class="main-content">
      <!-- 左侧控制面板 -->
      <aside class="control-panel">
        <div class="panel-section">
          <h2>设备状态</h2>
          <div class="status-grid">
            <div class="status-item">
              <span class="status-label">压感支持</span>
              <span :class="['status-value', pressureSupported ? 'enabled' : 'disabled']">
                {{ pressureSupported ? '✅ 已启用' : '❌ 不支持' }}
              </span>
            </div>
            <div class="status-item" v-if="pressureSupported">
              <span class="status-label">Force Touch 屏蔽</span>
              <label class="force-touch-toggle">
                <input type="checkbox" v-model="forceTouchBlocked" @change="syncMidiSettings">
                <span :class="['status-value', forceTouchBlocked ? 'enabled' : 'disabled']">
                  {{ forceTouchBlocked ? '✅ 已启用' : '❌ 未启用' }}
                </span>
              </label>
            </div>
            <div class="status-note" v-if="pressureSupported && forceTouchBlocked">
              <small>⚠️ 屏蔽超过 50% 的压感输入，适用于 Force Touch 设备</small>
            </div>
            <div class="status-item">
              <span class="status-label">MIDI 输出</span>
              <span :class="['status-value', midiEnabled ? 'enabled' : 'disabled']">
                {{ midiEnabled ? '✅ 已连接' : '⏳ 待连接' }}
              </span>
            </div>
            <div class="status-item" v-if="bridgeConnected">
              <span class="status-label">浏览器桥接</span>
              <span class="status-value enabled">
                ✅ 已连接 ({{ bridge.bridgeMode === 'master' ? '主模式' : '从模式' }})
              </span>
            </div>
          </div>
        </div>

        <div class="panel-section">
          <h2>MIDI 映射</h2>
          <div class="midi-mappings">
            <div class="mapping-item">
              <div class="mapping-config">
                <label>
                  <input type="checkbox" v-model="midiMappings.pressure.enabled" class="mapping-checkbox"
                    @change="syncMidiSettings" />
                  压力 → CC
                </label>
                <div class="mapping-input-row">
                  <input type="number" v-model="midiMappings.pressure.cc" min="0" max="127" class="cc-input"
                    :disabled="!midiMappings.pressure.enabled" @change="syncMidiSettings" />
                  <input type="text" v-model="midiMappings.pressure.name" class="name-input"
                    :disabled="!midiMappings.pressure.enabled" placeholder="名称" @change="syncMidiSettings" />
                </div>
              </div>
              <span class="mapping-value">{{ Math.round(pressureValue * 127) }}</span>
            </div>

            <div class="mapping-item">
              <div class="mapping-config">
                <label>
                  <input type="checkbox" v-model="midiMappings.x.enabled" class="mapping-checkbox"
                    @change="syncMidiSettings" />
                  X 坐标 → CC
                </label>
                <div class="mapping-input-row">
                  <input type="number" v-model="midiMappings.x.cc" min="0" max="127" class="cc-input"
                    :disabled="!midiMappings.x.enabled" @change="syncMidiSettings" />
                  <input type="text" v-model="midiMappings.x.name" class="name-input"
                    :disabled="!midiMappings.x.enabled" placeholder="名称" @change="syncMidiSettings" />
                </div>
              </div>
              <span class="mapping-value">{{ Math.round(xPosition * 127) }}</span>
            </div>

            <div class="mapping-item">
              <div class="mapping-config">
                <label>
                  <input type="checkbox" v-model="midiMappings.y.enabled" class="mapping-checkbox"
                    @change="syncMidiSettings" />
                  Y 坐标 → CC
                </label>
                <div class="mapping-input-row">
                  <input type="number" v-model="midiMappings.y.cc" min="0" max="127" class="cc-input"
                    :disabled="!midiMappings.y.enabled" @change="syncMidiSettings" />
                  <input type="text" v-model="midiMappings.y.name" class="name-input"
                    :disabled="!midiMappings.y.enabled" placeholder="名称" @change="syncMidiSettings" />
                </div>
              </div>
              <span class="mapping-value">{{ Math.round(yPosition * 127) }}</span>
            </div>

            <div class="midi-channel">
              <label>MIDI 通道:</label>
              <select v-model="midiMappings.pressure.channel" class="channel-select" @change="updateAllChannels">
                <option v-for="n in 16" :key="n - 1" :value="n - 1">{{ n }}</option>
              </select>
            </div>

            <div class="midi-device" v-if="midiOutputs.length > 0">
              <label>MIDI 设备:</label>
              <select v-model="selectedMidiOutput" class="device-select" @change="onMidiDeviceChange">
                <option value="">选择 MIDI 设备</option>
                <option v-for="output in midiOutputs" :key="output.id" :value="output.id">
                  {{ output.name || `设备 ${output.id}` }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <div class="panel-section">
          <h2>输入映射</h2>
          <div class="mapping-controls">
            <button @click="showCapabilityTest" class="control-btn info">🔍 检测浏览器能力</button>
            <button @click="bridgeConnected ? disconnectBridge() : connectBridge()"
              :class="['control-btn', bridgeConnected ? 'success' : 'warning']"
              :disabled="bridgeStatus === 'connecting'">
              {{
                bridgeStatus === 'connecting'
                  ? '🔄 连接中...'
                  : bridgeConnected
                    ? '🔗 断开桥接'
                    : '🌉 连接桥接'
              }}
            </button>
            <button @click="resetAll" class="control-btn danger">重置所有设置</button>
          </div>
        </div>
      </aside>

      <!-- 右侧可视化区域 -->
      <section class="visualization-area">
        <div class="viz-header">
          <h2>实时可视化</h2>
        </div>

        <!-- 触控区域 -->
        <div ref="touchArea" class="touch-area">
          <div class="touch-indicator" :style="indicatorStyle"></div>
        </div>

        <!-- 参数显示 -->
        <div class="parameter-display">
          <div class="param-item">
            <label>压力值</label>
            <div class="param-bar">
              <div class="param-fill" :style="{ width: `${pressureValue * 100}%` }"></div>
            </div>
            <span class="param-value">{{ (pressureValue * 100).toFixed(1) }}%</span>
          </div>
          <div class="param-item">
            <label>X 坐标</label>
            <div class="param-bar">
              <div class="param-fill" :style="{ width: `${xPosition * 100}%` }"></div>
            </div>
            <span class="param-value">{{ (xPosition * 100).toFixed(1) }}%</span>
          </div>
          <div class="param-item">
            <label>Y 坐标</label>
            <div class="param-bar">
              <div class="param-fill" :style="{ width: `${yPosition * 100}%` }"></div>
            </div>
            <span class="param-value">{{ (yPosition * 100).toFixed(1) }}%</span>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  BrowserBridge,
  type BridgeMessage,
  type PressureData,
  type MidiSettings,
} from '@/utils/BrowserBridge'
import { CapabilityDetector, type BrowserCapabilities } from '@/utils/CapabilityDetector'

// 状态管理
const pressureSupported = ref(false)
const midiEnabled = ref(false)
const bridgeConnected = ref(false)
const browserCapabilities = ref<BrowserCapabilities | null>(null)
const forceTouchBlocked = ref(false) // Force Touch 屏蔽状态

// MIDI 设备管理
const midiAccess = ref<MIDIAccess | null>(null)
const midiOutputs = ref<MIDIOutput[]>([])
const selectedMidiOutput = ref<string>('')

// 浏览器桥接
const bridge = new BrowserBridge()
const bridgeStatus = ref<'disconnected' | 'connecting' | 'connected' | 'reconnecting'>(
  'disconnected',
)

// 输入数据
const pressureValue = ref(0)
const xPosition = ref(0.5)
const yPosition = ref(0.5)
const isPressed = ref(false)

// MIDI 映射配置
interface MidiMapping {
  enabled: boolean
  cc: number
  channel: number
  name: string
}

// MIDI 配置
const midiMappings = ref({
  pressure: { enabled: true, cc: 1, channel: 0, name: '调制轮' } as MidiMapping,
  x: { enabled: true, cc: 74, channel: 0, name: '滤波器' } as MidiMapping,
  y: { enabled: true, cc: 71, channel: 0, name: '共鸣' } as MidiMapping,
})

// 监听 MIDI 设置变化并同步到从机
const syncMidiSettings = () => {
  if (bridgeConnected.value && bridge.isMaster) {
    console.log('🎛️ [主模式] 同步 MIDI 设置到从机')
    const settingsToSync = {
      ...midiMappings.value,
      forceTouchBlocked: forceTouchBlocked.value
    }
    bridge.sendMidiSettings(settingsToSync)
  }
}

// 更新所有通道
const updateAllChannels = () => {
  const channel = midiMappings.value.pressure.channel
  midiMappings.value.x.channel = channel
  midiMappings.value.y.channel = channel
  syncMidiSettings()
}

// MIDI 设备管理
const updateMidiDevices = (access: MIDIAccess) => {
  midiAccess.value = access
  midiOutputs.value = Array.from(access.outputs.values())

  // 如果还没有选择设备且有可用设备，自动选择第一个
  if (!selectedMidiOutput.value && midiOutputs.value.length > 0) {
    selectedMidiOutput.value = midiOutputs.value[0].id
  }

  console.log('🎹 发现 MIDI 设备:', midiOutputs.value.map(output => ({
    id: output.id,
    name: output.name
  })))
}

const onMidiDeviceChange = () => {
  console.log('🎹 切换 MIDI 设备:', selectedMidiOutput.value)
}

// DOM 引用
const touchArea = ref<HTMLElement>()

// 计算属性
const indicatorStyle = computed(() => ({
  left: `${xPosition.value * 100}%`,
  top: `${yPosition.value * 100}%`,
  opacity: pressureValue.value,
  transform: `translate(-50%, -50%) scale(${0.5 + pressureValue.value * 0.5})`,
}))

// Force Touch 屏蔽处理函数
const processPressureValue = (rawPressure: number): number => {
  if (forceTouchBlocked.value) {
    // 屏蔽模式：忽略 50% 以上的压感，将 0-0.5 映射到 0-1
    const clampedPressure = Math.min(rawPressure, 0.5)
    const mappedPressure = clampedPressure * 2 // 将 0-0.5 映射到 0-1

    if (rawPressure > 0.5) {
      console.log(`🚫 Force Touch 屏蔽: 原始压力 ${rawPressure.toFixed(2)} → 映射压力 ${mappedPressure.toFixed(2)}`)
    }

    return mappedPressure
  }
  return rawPressure
}

// 方法
const enablePressure = async () => {
  try {
    console.log('🔍 开始检测浏览器能力...')

    // 首先检测浏览器能力
    browserCapabilities.value = await CapabilityDetector.detectCapabilities()

    console.log('🔍 检测结果:', {
      browser: browserCapabilities.value.browser,
      pressure: browserCapabilities.value.pressure,
      midi: browserCapabilities.value.midi,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
    })

    // 无论检测结果如何，都设置压感支持状态
    pressureSupported.value = browserCapabilities.value.pressure

    console.log('✅ 压感支持状态:', pressureSupported.value)
    console.log('🔧 桥接模式:', bridge.bridgeMode)

    // 无论浏览器能力如何，都尝试连接桥接服务
    console.log('🌉 自动尝试连接桥接服务...')
    await connectBridge()

    if (!browserCapabilities.value.pressure && !browserCapabilities.value.midi) {
      // 如果两个功能都不支持，显示指导
      CapabilityDetector.showBrowserGuidance(browserCapabilities.value)

      // 即使在桥接模式下，也要提供基本的交互功能
      console.log('🔄 设置基本交互功能（桥接模式）')
      setupFallbackEvents()
    } else if (!browserCapabilities.value.pressure || !browserCapabilities.value.midi) {
      // 如果只缺少一个功能，初始化支持的功能
      if (pressureSupported.value) {
        console.log('🎯 初始化压感输入...')
        await initializePressure()
      } else {
        console.log('🔄 设置基本交互功能（部分支持）')
        setupFallbackEvents()
      }

      if (browserCapabilities.value.midi) {
        midiEnabled.value = true
        console.log('🎹 初始化 MIDI...')
        await initializeMidi()
      }
    } else {
      // 全功能浏览器：初始化所有功能
      midiEnabled.value = browserCapabilities.value.midi

      if (pressureSupported.value) {
        console.log('🎯 初始化压感输入...')
        await initializePressure()
      }

      if (midiEnabled.value) {
        console.log('🎹 初始化 MIDI...')
        await initializeMidi()
      }
    }
  } catch (error) {
    console.error('❌ 启用压感失败:', error)
  }
}

const setupBridgeListeners = () => {
  bridge.onMessage((message: BridgeMessage) => {
    console.log(`📩 [${bridge.bridgeMode}模式] 收到桥接消息:`, message.type, message.data)

    switch (message.type) {
      case 'pressure':
        // 只有从模式才接收压感数据
        if (bridge.isSlave) {
          const pressureData = message.data as PressureData
          console.log('🎯 [从模式] 更新压感数据:', pressureData)
          pressureValue.value = pressureData.pressure
          xPosition.value = pressureData.x
          yPosition.value = pressureData.y

          // 从模式下接收到数据后处理 MIDI 输出
          if (midiEnabled.value) {
            console.log('🎹 [从模式] 处理 MIDI 输出')
            sendMidiData()
          }
        }
        break
      case 'midi-settings':
        // 只有从模式才接收 MIDI 设置
        if (bridge.isSlave) {
          const settings = message.data as MidiSettings
          console.log('🎛️ [从模式] 更新 MIDI 设置:', settings)
          // 更新本地 MIDI 映射配置
          midiMappings.value = {
            pressure: settings.pressure,
            x: settings.x,
            y: settings.y
          }
          // 更新 Force Touch 屏蔽状态
          if (typeof settings.forceTouchBlocked !== 'undefined') {
            forceTouchBlocked.value = settings.forceTouchBlocked
            console.log('🎛️ [从模式] 更新 Force Touch 屏蔽状态:', settings.forceTouchBlocked)
          }
        }
        break
      case 'midi':
        console.log('🎹 收到 MIDI 确认:', message.data)
        break
      case 'status':
        console.log('📊 桥接状态更新:', message.data)
        break
    }
  })
}

const initializeMidi = async () => {
  try {
    if (navigator.requestMIDIAccess) {
      const access = await navigator.requestMIDIAccess()
      midiEnabled.value = true
      updateMidiDevices(access)
      console.log('✅ MIDI 设备已连接')
      return access
    }
  } catch (error) {
    console.error('❌ MIDI 连接失败:', error)
  }
  return null
}

const resetAll = () => {
  pressureValue.value = 0
  xPosition.value = 0.5
  yPosition.value = 0.5
  isPressed.value = false
  console.log('🔄 已重置所有设置')
}

const connectBridge = async () => {
  try {
    bridgeStatus.value = 'connecting'
    const connected = await bridge.connect()
    bridgeConnected.value = connected
    bridgeStatus.value = connected ? 'connected' : 'disconnected'

    if (connected) {
      console.log(`🔗 已连接到双浏览器桥接服务 [${bridge.bridgeMode}模式]`)
      setupBridgeListeners()

      // 根据模式给出不同提示
      if (bridge.isMaster) {
        console.log('🎯 Safari 主模式：请在触控区域进行操作，数据将发送到 Chrome')
        // 主机连接后立即同步当前 MIDI 设置到从机
        setTimeout(() => {
          syncMidiSettings()
        }, 500) // 稍微延迟确保从机已连接
      } else {
        console.log('🎹 Chrome 从模式：等待接收来自 Safari 的压感数据')
      }
    } else {
      console.log('❌ 无法连接到桥接服务，请确保桥接服务器正在运行')
    }

    return connected
  } catch (error) {
    console.error('❌ 桥接连接失败:', error)
    bridgeStatus.value = 'disconnected'
    bridgeConnected.value = false
    return false
  }
}

const disconnectBridge = () => {
  bridge.disconnect()
  bridgeConnected.value = false
  bridgeStatus.value = 'disconnected'
  console.log('🔌 已断开桥接连接')
}

const showCapabilityTest = async () => {
  try {
    const capabilities = await CapabilityDetector.detectCapabilities()
    CapabilityDetector.showBrowserGuidance(capabilities)
  } catch (error) {
    console.error('能力检测失败:', error)
  }
}

// 触控事件处理
const updatePosition = (event: MouseEvent | TouchEvent) => {
  if (!touchArea.value) return

  const rect = touchArea.value.getBoundingClientRect()
  let clientX: number, clientY: number

  if (event instanceof MouseEvent) {
    clientX = event.clientX
    clientY = event.clientY
  } else {
    const touch = event.touches[0] || event.changedTouches[0]
    clientX = touch.clientX
    clientY = touch.clientY
  }

  xPosition.value = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
  yPosition.value = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height))
}

// Pressure.js 集成
const initializePressure = async () => {
  try {
    const Pressure = await import('pressure')

    if (touchArea.value) {
      Pressure.set(
        touchArea.value,
        {
          start: (event: MouseEvent | TouchEvent) => {
            isPressed.value = true
            updatePosition(event)
            sendMidiData()
          },
          change: (force: number, event: MouseEvent | TouchEvent) => {
            // 应用 Force Touch 屏蔽逻辑
            pressureValue.value = processPressureValue(force)
            updatePosition(event)
            sendMidiData()
          },
          end: () => {
            isPressed.value = false
            pressureValue.value = 0
            sendMidiData()
          },
        },
        {
          preventDefault: false,
          preventSelect: false,
        },
      )

      console.log('✅ Pressure.js 已集成')
    }
  } catch (error) {
    console.warn('⚠️ Pressure.js 加载失败，使用备用方案:', error)
    // 如果 Pressure.js 失败，使用备用的鼠标/触摸事件
    setupFallbackEvents()
  }
}

// 备用事件处理（当 Pressure.js 不可用时）
const setupFallbackEvents = () => {
  if (!touchArea.value) return

  console.log('🔄 设置备用鼠标/触摸事件')

  // 鼠标事件
  touchArea.value.addEventListener('mousedown', (event: MouseEvent) => {
    isPressed.value = true
    const rawPressure = 0.5 // 默认压力值
    pressureValue.value = processPressureValue(rawPressure)
    updatePosition(event)
    sendMidiData()
  })

  touchArea.value.addEventListener('mousemove', (event: MouseEvent) => {
    if (isPressed.value) {
      updatePosition(event)
      sendMidiData()
    }
  })

  touchArea.value.addEventListener('mouseup', () => {
    isPressed.value = false
    pressureValue.value = 0
    sendMidiData()
  })

  // 触摸事件
  touchArea.value.addEventListener('touchstart', (event: TouchEvent) => {
    isPressed.value = true
    const touch = event.touches[0]
    // 在支持的设备上尝试获取压感
    const rawPressure = touch.force || 0.5
    pressureValue.value = processPressureValue(rawPressure)
    updatePosition(event)
    sendMidiData()
  })

  touchArea.value.addEventListener('touchmove', (event: TouchEvent) => {
    const touch = event.touches[0]
    const rawPressure = touch.force || pressureValue.value
    pressureValue.value = processPressureValue(rawPressure)
    updatePosition(event)
    sendMidiData()
  })

  touchArea.value.addEventListener('touchend', () => {
    isPressed.value = false
    pressureValue.value = 0
    sendMidiData()
  })
}

const sendMidiData = () => {
  // 发送桥接数据（只有主模式才发送）
  if (bridgeConnected.value && bridge.isMaster) {
    console.log('📡 [主模式] 发送桥接数据:', {
      pressure: pressureValue.value,
      x: xPosition.value,
      y: yPosition.value,
    })
    bridge.sendPressureData(pressureValue.value, xPosition.value, yPosition.value)
  }

  // 发送 MIDI 数据（如果支持且有选中的设备）
  if (midiEnabled.value && selectedMidiOutput.value) {
    const selectedOutput = midiOutputs.value.find(output => output.id === selectedMidiOutput.value)

    if (selectedOutput) {
      console.log('🎹 发送 MIDI 数据:', {
        device: selectedOutput.name,
        pressure: Math.round(pressureValue.value * 127),
        x: Math.round(xPosition.value * 127),
        y: Math.round(yPosition.value * 127),
      })

      // 发送 MIDI CC 消息
      const channel = midiMappings.value.pressure.channel

      if (midiMappings.value.pressure.enabled) {
        selectedOutput.send([0xB0 + channel, midiMappings.value.pressure.cc, Math.round(pressureValue.value * 127)])
      }

      if (midiMappings.value.x.enabled) {
        selectedOutput.send([0xB0 + channel, midiMappings.value.x.cc, Math.round(xPosition.value * 127)])
      }

      if (midiMappings.value.y.enabled) {
        selectedOutput.send([0xB0 + channel, midiMappings.value.y.cc, Math.round(yPosition.value * 127)])
      }
    }

    // 如果是桥接从模式，也通过桥接发送 MIDI 确认
    if (bridgeConnected.value && bridge.isSlave) {
      bridge.sendMidiData(1, Math.round(pressureValue.value * 127))
      bridge.sendMidiData(74, Math.round(xPosition.value * 127))
      bridge.sendMidiData(71, Math.round(yPosition.value * 127))
    }
  }
}

// 生命周期
onMounted(() => {
  console.log('🚀 Touchable Web 已启动')
  // 自动尝试启用功能
  enablePressure()
})

onUnmounted(() => {
  console.log('👋 Touchable Web 已关闭')
})
</script>

<style scoped>
.touchable-app {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-background);
  color: var(--color-text);
  overflow: hidden;
  /* 禁用页面选择功能 */
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

/* 顶部标题栏 */
.app-header {
  padding: 1rem 2rem;
  text-align: center;
  background: var(--color-background-soft);
  border-bottom: 1px solid var(--color-border);
}

.app-header h1 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--color-heading);
}

.app-header p {
  margin: 0.5rem 0 0 0;
  opacity: 0.8;
  font-size: 0.9rem;
}

/* 主要内容区域 */
.main-content {
  display: flex;
  flex: 1;
  min-height: 0;
}

/* 左侧控制面板 */
.control-panel {
  width: 350px;
  background: var(--color-background-soft);
  border-right: 1px solid var(--color-border);
  padding: 1rem;
  overflow-y: auto;
}

.panel-section {
  margin-bottom: 1.5rem;
}

.panel-section h2 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  color: var(--color-heading);
}

/* 状态网格 */
.status-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 4px;
}

.status-label {
  font-size: 0.9rem;
}

.status-value {
  font-size: 0.8rem;
  font-weight: 500;
}

.status-value.enabled {
  color: #27ae60;
}

.status-value.disabled {
  color: #e74c3c;
}

/* 状态说明 */
.status-note {
  padding: 0.5rem;
  background: var(--color-background-mute);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  margin-top: 0.5rem;
}

.status-note small {
  color: var(--color-text-mute);
  font-size: 0.75rem;
  line-height: 1.3;
}

/* 控制按钮 */
.mapping-controls {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.control-btn {
  padding: 0.75rem;
  background: #4a90e2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.2s;
}

.control-btn:hover:not(:disabled) {
  background: #357abd;
}

.control-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.control-btn.danger {
  background: #e74c3c;
}

.control-btn.danger:hover {
  background: #c0392b;
}

.control-btn.info {
  background: #3498db;
}

.control-btn.info:hover {
  background: #2980b9;
}

.control-btn.success {
  background: #27ae60;
}

.control-btn.success:hover {
  background: #229954;
}

.control-btn.warning {
  background: #f39c12;
}

.control-btn.warning:hover {
  background: #e67e22;
}

/* MIDI 映射 */
.midi-mappings {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.mapping-item {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.2s ease;
}

.mapping-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-color: #4a90e2;
}

.mapping-config {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.mapping-config label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: var(--color-heading);
  font-size: 0.9rem;
}

.mapping-checkbox {
  width: 18px;
  height: 18px;
  accent-color: #4a90e2;
  cursor: pointer;
}

.mapping-checkbox:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.cc-input,
.name-input {
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-background-soft);
  color: var(--color-text);
  font-size: 0.85rem;
  transition: border-color 0.2s ease;
}

.cc-input:focus,
.name-input:focus {
  outline: none;
  border-color: #4a90e2;
  box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
}

.cc-input:disabled,
.name-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--color-background-mute);
}

.cc-input {
  width: 70px;
}

.name-input {
  flex: 1;
}

.mapping-input-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.mapping-value {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #4a90e2, #357abd);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.8rem;
  min-width: 50px;
  box-shadow: 0 2px 4px rgba(74, 144, 226, 0.3);
}

.midi-channel {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.5rem;
  padding: 0.75rem;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 6px;
}

.midi-channel label {
  font-weight: 500;
  color: var(--color-heading);
  font-size: 0.9rem;
}

.channel-select,
.device-select {
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-background);
  color: var(--color-text);
  font-size: 0.85rem;
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.channel-select:focus,
.device-select:focus {
  outline: none;
  border-color: #4a90e2;
  box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
}

.channel-select:hover,
.device-select:hover {
  border-color: #4a90e2;
}

.midi-device {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.5rem;
  padding: 0.75rem;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 6px;
}

.midi-device label {
  font-weight: 500;
  color: var(--color-heading);
  font-size: 0.9rem;
}

.device-select {
  flex: 1;
  min-width: 120px;
}

/* Force Touch 切换开关 */
.force-touch-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.force-touch-toggle input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #4a90e2;
  cursor: pointer;
}

/* 深色模式优化 */
@media (prefers-color-scheme: dark) {
  .mapping-item:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  .mapping-value {
    box-shadow: 0 2px 4px rgba(74, 144, 226, 0.4);
  }
}

/* 右侧可视化区域 */
.visualization-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--color-background);
}

.viz-header {
  padding: 1rem;
  background: var(--color-background-soft);
  border-bottom: 1px solid var(--color-border);
}

.viz-header h2 {
  margin: 0;
  font-size: 1.1rem;
}

/* 触控区域 */
.touch-area {
  flex: 1;
  position: relative;
  background:
    linear-gradient(45deg, var(--color-background-soft) 25%, transparent 25%),
    linear-gradient(-45deg, var(--color-background-soft) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, var(--color-background-soft) 75%),
    linear-gradient(-45deg, transparent 75%, var(--color-background-soft) 75%);
  background-size: 20px 20px;
  background-position:
    0 0,
    0 10px,
    10px -10px,
    -10px 0px;
  cursor: crosshair;
  overflow: hidden;
}

.touch-indicator {
  position: absolute;
  width: 30px;
  height: 30px;
  background: radial-gradient(circle, #4a90e2, transparent);
  border-radius: 50%;
  pointer-events: none;
  transform-origin: center;
}

/* 参数显示 */
.parameter-display {
  padding: 1rem;
  background: var(--color-background-soft);
  border-top: 1px solid var(--color-border);
}

.param-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.param-item label {
  width: 60px;
  font-size: 0.8rem;
  font-weight: 500;
}

.param-bar {
  flex: 1;
  height: 8px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  overflow: hidden;
}

.param-fill {
  height: 100%;
  background: linear-gradient(90deg, #4a90e2, #27ae60);
  /* 移除过渡效果以获得即时响应 */
}

.param-value {
  width: 50px;
  text-align: right;
  font-size: 0.8rem;
  font-weight: bold;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-content {
    flex-direction: column;
  }

  .control-panel {
    width: 100%;
    height: 200px;
    border-right: none;
    border-bottom: 1px solid var(--color-border);
  }

  .app-header {
    padding: 0.75rem 1rem;
  }

  .app-header h1 {
    font-size: 1.25rem;
  }
}
</style>
