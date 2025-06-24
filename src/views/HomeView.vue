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
            <div class="status-item">
              <span class="status-label">MIDI 输出</span>
              <span :class="['status-value', midiEnabled ? 'enabled' : 'disabled']">
                {{ midiEnabled ? '✅ 已连接' : '⏳ 待连接' }}
              </span>
            </div>
            <div class="status-item" v-if="bridgeConnected">
              <span class="status-label">浏览器桥接</span>
              <span class="status-value enabled">✅ 已连接</span>
            </div>
          </div>
        </div>

        <div class="panel-section">
          <h2>输入映射</h2>
          <div class="mapping-controls">
            <button @click="enablePressure" :disabled="pressureSupported" class="control-btn">
              启用压感输入
            </button>
            <button @click="enableMidi" :disabled="midiEnabled" class="control-btn">
              连接 MIDI 设备
            </button>
            <button @click="showCapabilityTest" class="control-btn info">
              🔍 检测浏览器能力
            </button>
            <button @click="bridgeConnected ? disconnectBridge() : connectBridge()"
              :class="['control-btn', bridgeConnected ? 'success' : 'warning']"
              :disabled="bridgeStatus === 'connecting'">
              {{ bridgeStatus === 'connecting' ? '🔄 连接中...' : bridgeConnected ? '🔗 断开桥接' : '🌉 连接桥接' }}
            </button>
            <button @click="resetAll" class="control-btn danger">
              重置所有设置
            </button>
          </div>
        </div>

        <div class="panel-section">
          <h2>MIDI 映射</h2>
          <div class="midi-mappings">
            <div class="mapping-item">
              <span>压力 → CC 1 (调制轮)</span>
              <span class="mapping-value">{{ Math.round(pressureValue * 127) }}</span>
            </div>
            <div class="mapping-item">
              <span>X 坐标 → CC 74 (滤波器)</span>
              <span class="mapping-value">{{ Math.round(xPosition * 127) }}</span>
            </div>
            <div class="mapping-item">
              <span>Y 坐标 → CC 71 (共鸣)</span>
              <span class="mapping-value">{{ Math.round(yPosition * 127) }}</span>
            </div>
          </div>
        </div>
      </aside>

      <!-- 右侧可视化区域 -->
      <section class="visualization-area">
        <div class="viz-header">
          <h2>实时可视化</h2>
          <div class="viz-controls">
            <button @click="toggleVisualization" class="viz-btn">
              {{ visualizationActive ? '⏸️ 暂停' : '▶️ 开始' }}
            </button>
          </div>
        </div>

        <!-- 触控区域 -->
        <div ref="touchArea" class="touch-area">
          <div class="touch-indicator" :style="indicatorStyle"></div>
          <div class="touch-trails">
            <div v-for="(trail, index) in touchTrails" :key="index" class="trail-point" :style="trail.style"></div>
          </div>
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
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { BrowserBridge, type BridgeMessage, type PressureData } from '@/utils/BrowserBridge'
import { CapabilityDetector, type BrowserCapabilities } from '@/utils/CapabilityDetector'

// 状态管理
const pressureSupported = ref(false)
const midiEnabled = ref(false)
const visualizationActive = ref(true)
const bridgeConnected = ref(false)
const browserCapabilities = ref<BrowserCapabilities | null>(null)

// 浏览器桥接
const bridge = new BrowserBridge()
const bridgeStatus = ref<'disconnected' | 'connecting' | 'connected' | 'reconnecting'>('disconnected')

// 输入数据
const pressureValue = ref(0)
const xPosition = ref(0.5)
const yPosition = ref(0.5)
const isPressed = ref(false)

// 触控轨迹
interface TrailPoint {
  style: {
    left: string
    top: string
    opacity: number
  }
  id: number
}

const touchTrails = ref<TrailPoint[]>([])
let trailId = 0

// DOM 引用
const touchArea = ref<HTMLElement>()

// 计算属性
const indicatorStyle = computed(() => ({
  transform: `translate(${xPosition.value * 100}%, ${yPosition.value * 100}%)`,
  opacity: pressureValue.value,
  scale: `${0.5 + pressureValue.value * 0.5}`
}))

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
      platform: navigator.platform
    })

    // 无论检测结果如何，都设置压感支持状态
    pressureSupported.value = browserCapabilities.value.pressure

    console.log('✅ 压感支持状态:', pressureSupported.value)

    if (!browserCapabilities.value.pressure && !browserCapabilities.value.midi) {
      // 如果两个功能都不支持，显示指导
      CapabilityDetector.showBrowserGuidance(browserCapabilities.value)

      // 尝试连接桥接服务
      await connectBridge()

      // 即使在桥接模式下，也要提供基本的交互功能
      console.log('🔄 设置基本交互功能（桥接模式）')
      setupFallbackEvents()
    } else if (!browserCapabilities.value.pressure || !browserCapabilities.value.midi) {
      // 如果只缺少一个功能，尝试桥接
      await connectBridge()

      // 如果支持压感，初始化压感；否则使用备用方案
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
      // 单浏览器方案
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
    console.log('📩 收到桥接消息:', message.type, message.data)
    
    switch (message.type) {
      case 'pressure':
        const pressureData = message.data as PressureData
        console.log('🎯 更新压感数据:', pressureData)
        pressureValue.value = pressureData.pressure
        xPosition.value = pressureData.x
        yPosition.value = pressureData.y
        
        // 在接收端也更新轨迹（如果可视化激活）
        addTrail()
        break
      case 'midi':
        // MIDI 数据已由另一个浏览器处理
        console.log('🎹 收到 MIDI 数据:', message.data)
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
      const midiAccess = await navigator.requestMIDIAccess()
      midiEnabled.value = true
      console.log('✅ MIDI 设备已连接')
      return midiAccess
    }
  } catch (error) {
    console.error('❌ MIDI 连接失败:', error)
  }
  return null
}

const enableMidi = async () => {
  try {
    if (navigator.requestMIDIAccess) {
      const midiAccess = await navigator.requestMIDIAccess()
      midiEnabled.value = true
      console.log('✅ MIDI 设备已连接')

      // 发送测试 MIDI 消息
      for (const output of midiAccess.outputs.values()) {
        // CC 1 (调制轮) = 压力
        output.send([0xB0, 1, Math.round(pressureValue.value * 127)])
        break
      }
    } else {
      console.log('❌ 浏览器不支持 Web MIDI API')
    }
  } catch (error) {
    console.error('❌ MIDI 连接失败:', error)
  }
}

const resetAll = () => {
  pressureValue.value = 0
  xPosition.value = 0.5
  yPosition.value = 0.5
  isPressed.value = false
  touchTrails.value = []
  console.log('🔄 已重置所有设置')
}

const connectBridge = async () => {
  try {
    bridgeStatus.value = 'connecting'
    const connected = await bridge.connect()
    bridgeConnected.value = connected
    bridgeStatus.value = connected ? 'connected' : 'disconnected'

    if (connected) {
      console.log('🔗 已连接到双浏览器桥接服务')
      setupBridgeListeners()
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

const toggleVisualization = () => {
  visualizationActive.value = !visualizationActive.value
  console.log('📊 可视化', visualizationActive.value ? '已启动' : '已暂停')
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
      Pressure.set(touchArea.value, {
        start: (event: MouseEvent | TouchEvent) => {
          isPressed.value = true
          updatePosition(event)
          addTrail()
          sendMidiData()
        },
        change: (force: number, event: MouseEvent | TouchEvent) => {
          pressureValue.value = force // 使用 Pressure.js 的真实压感值
          updatePosition(event)
          addTrail()
          sendMidiData()
        },
        end: () => {
          isPressed.value = false
          pressureValue.value = 0
          sendMidiData()
        }
      }, {
        preventDefault: false,
        preventSelect: false
      })

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
    pressureValue.value = 0.5 // 默认压力值
    updatePosition(event)
    addTrail()
    sendMidiData()
  })

  touchArea.value.addEventListener('mousemove', (event: MouseEvent) => {
    if (isPressed.value) {
      updatePosition(event)
      addTrail()
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
    pressureValue.value = touch.force || 0.5
    updatePosition(event)
    addTrail()
    sendMidiData()
  })

  touchArea.value.addEventListener('touchmove', (event: TouchEvent) => {
    const touch = event.touches[0]
    pressureValue.value = touch.force || pressureValue.value
    updatePosition(event)
    addTrail()
    sendMidiData()
  })

  touchArea.value.addEventListener('touchend', () => {
    isPressed.value = false
    pressureValue.value = 0
    sendMidiData()
  })
}

const addTrail = () => {
  if (!visualizationActive.value) return

  touchTrails.value.push({
    id: trailId++,
    style: {
      left: `${xPosition.value * 100}%`,
      top: `${yPosition.value * 100}%`,
      opacity: pressureValue.value,
    }
  })

  // 限制轨迹数量
  if (touchTrails.value.length > 20) {
    touchTrails.value.shift()
  }
}

const sendMidiData = () => {
  // 发送桥接数据（如果已连接）
  if (bridgeConnected.value) {
    console.log('📡 发送桥接数据:', { 
      pressure: pressureValue.value, 
      x: xPosition.value, 
      y: yPosition.value 
    })
    bridge.sendPressureData(pressureValue.value, xPosition.value, yPosition.value)
  }
  
  // 发送 MIDI 数据（如果支持）
  if (midiEnabled.value) {
    // 这里可以添加实际的 MIDI 发送逻辑
    console.log('🎹 MIDI:', {
      pressure: Math.round(pressureValue.value * 127),
      x: Math.round(xPosition.value * 127),
      y: Math.round(yPosition.value * 127)
    })
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
  gap: 0.5rem;
}

.mapping-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 0.8rem;
}

.mapping-value {
  font-weight: bold;
  color: #4a90e2;
}

/* 右侧可视化区域 */
.visualization-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--color-background);
}

.viz-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--color-background-soft);
  border-bottom: 1px solid var(--color-border);
}

.viz-header h2 {
  margin: 0;
  font-size: 1.1rem;
}

.viz-btn {
  padding: 0.5rem 1rem;
  background: #27ae60;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}

.viz-btn:hover {
  background: #219a52;
}

/* 触控区域 */
.touch-area {
  flex: 1;
  position: relative;
  background: linear-gradient(45deg, var(--color-background-soft) 25%, transparent 25%),
    linear-gradient(-45deg, var(--color-background-soft) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, var(--color-background-soft) 75%),
    linear-gradient(-45deg, transparent 75%, var(--color-background-soft) 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
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

.touch-trails {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.trail-point {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #e74c3c;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: fade-out 2s ease-out forwards;
}

@keyframes fade-out {
  0% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }

  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.5);
  }
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
