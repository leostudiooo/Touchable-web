<template>
  <div class="simple-viz-panel">
    <h2>实时可视化面板</h2>

    <div class="interactive-area">
      <h3>交互测试区域</h3>
      <div class="test-surface" @mousemove="handleMouseMove" @mousedown="handleMouseDown" @mouseup="handleMouseUp"
        @mouseleave="handleMouseLeave">
        <div class="surface-info">
          <div>坐标: ({{ mouseX.toFixed(2) }}, {{ mouseY.toFixed(2) }})</div>
          <div>按下状态: {{ isPressed ? '是' : '否' }}</div>
          <div>模拟压力: {{ pressure.toFixed(2) }}</div>
        </div>
      </div>
    </div>

    <div class="visualization-area">
      <h3>压力可视化</h3>
      <div class="pressure-container">
        <div class="pressure-circle" :style="{
          width: circleSize + 'px',
          height: circleSize + 'px',
          opacity: circleOpacity
        }"></div>
        <div class="pressure-info">
          <div>圆圈大小: {{ circleSize }}px</div>
          <div>不透明度: {{ circleOpacity.toFixed(2) }}</div>
        </div>
      </div>
    </div>

    <div class="realtime-data">
      <h3>实时数据流</h3>
      <div class="data-grid">
        <div class="data-item">
          <span class="data-label">X 轴</span>
          <div class="data-bar">
            <div class="data-fill" :style="{ width: (mouseX * 100) + '%' }"></div>
          </div>
          <span class="data-value">{{ (mouseX * 127).toFixed(0) }}</span>
        </div>

        <div class="data-item">
          <span class="data-label">Y 轴</span>
          <div class="data-bar">
            <div class="data-fill" :style="{ width: (mouseY * 100) + '%' }"></div>
          </div>
          <span class="data-value">{{ (mouseY * 127).toFixed(0) }}</span>
        </div>

        <div class="data-item">
          <span class="data-label">压力</span>
          <div class="data-bar">
            <div class="data-fill" :style="{ width: (pressure * 100) + '%' }"></div>
          </div>
          <span class="data-value">{{ (pressure * 127).toFixed(0) }}</span>
        </div>
      </div>
    </div>

    <div class="midi-output">
      <h3>MIDI CC 输出模拟</h3>
      <div class="midi-messages">
        <div v-for="(message, index) in recentMessages" :key="index" class="midi-message">
          CC{{ message.cc }}: {{ message.value }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const mouseX = ref(0)
const mouseY = ref(0)
const isPressed = ref(false)
const pressure = ref(0)
const recentMessages = ref<Array<{ cc: number, value: number }>>([])

const circleSize = computed(() => {
  return Math.max(30, 30 + pressure.value * 100)
})

const circleOpacity = computed(() => {
  return Math.max(0.3, 0.3 + pressure.value * 0.7)
})

function handleMouseMove(event: MouseEvent) {
  const rect = (event.target as HTMLElement).getBoundingClientRect()
  mouseX.value = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width))
  mouseY.value = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height))

  // 更新压力值（基于鼠标按下状态和移动速度）
  if (isPressed.value) {
    pressure.value = Math.min(1, pressure.value + 0.1)
  } else {
    pressure.value = Math.max(0, pressure.value - 0.05)
  }
}

function handleMouseDown() {
  isPressed.value = true
  pressure.value = 0.5
}

function handleMouseUp() {
  isPressed.value = false
}

function handleMouseLeave() {
  isPressed.value = false
  pressure.value = 0
}

// 监听数据变化，模拟 MIDI 输出
let throttleTimer: number | null = null
watch([mouseX, mouseY, pressure], () => {
  // 节流处理
  if (throttleTimer) return

  throttleTimer = window.setTimeout(() => {
    // 模拟发送 MIDI CC 消息
    const messages = [
      { cc: 1, value: Math.round(pressure.value * 127) },
      { cc: 2, value: Math.round(mouseX.value * 127) },
      { cc: 3, value: Math.round(mouseY.value * 127) }
    ]

    // 只保留最近的几条消息
    recentMessages.value = messages
    throttleTimer = null
  }, 100)
})
</script>

<style scoped>
.simple-viz-panel {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
}

.simple-viz-panel h2 {
  color: #333;
  margin-bottom: 20px;
}

.simple-viz-panel h3 {
  color: #555;
  font-size: 16px;
  margin-bottom: 12px;
}

.interactive-area,
.visualization-area,
.realtime-data,
.midi-output {
  margin-bottom: 25px;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  border: 1px solid #e9ecef;
}

.test-surface {
  width: 100%;
  height: 150px;
  background: linear-gradient(45deg, #f0f0f0, #e0e0e0);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: crosshair;
  user-select: none;
  position: relative;
  border: 2px solid #ddd;
  transition: border-color 0.2s;
}

.test-surface:hover {
  border-color: #007bff;
}

.surface-info {
  background: rgba(255, 255, 255, 0.9);
  padding: 10px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
  border: 1px solid #ddd;
}

.surface-info div {
  margin: 2px 0;
}

.pressure-container {
  display: flex;
  align-items: center;
  gap: 20px;
}

.pressure-circle {
  background: radial-gradient(circle, rgba(0, 123, 255, 0.6), rgba(0, 123, 255, 0.2));
  border-radius: 50%;
  transition: all 0.1s ease;
  border: 2px solid rgba(0, 123, 255, 0.8);
  flex-shrink: 0;
}

.pressure-info {
  font-family: monospace;
  font-size: 12px;
  color: #666;
}

.pressure-info div {
  margin: 2px 0;
}

.data-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.data-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.data-label {
  min-width: 50px;
  font-weight: 500;
  color: #333;
  font-size: 13px;
}

.data-bar {
  flex: 1;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}

.data-fill {
  height: 100%;
  background: linear-gradient(90deg, #28a745, #ffc107, #dc3545);
  transition: width 0.1s ease;
}

.data-value {
  min-width: 35px;
  text-align: right;
  font-family: monospace;
  color: #007bff;
  font-weight: 500;
  font-size: 12px;
}

.midi-messages {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.midi-message {
  background: #ffffff;
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid #ddd;
  font-family: monospace;
  font-size: 12px;
  color: #333;
  font-weight: 500;
}
</style>
