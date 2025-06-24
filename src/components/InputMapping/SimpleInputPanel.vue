<template>
  <div class="simple-input-panel">
    <div class="status-section">
      <h2>输入映射面板</h2>
      <div class="status-indicator">
        <span class="status-dot" :class="{ active: isActive }"></span>
        <span>{{ statusText }}</span>
      </div>
    </div>

    <div class="device-section">
      <h3>设备类型选择</h3>
      <div class="device-buttons">
        <button
          v-for="device in devices"
          :key="device.id"
          :class="{ active: selectedDevice === device.id }"
          @click="selectDevice(device.id)"
        >
          {{ device.name }}
        </button>
      </div>
    </div>

    <div class="channels-section">
      <h3>输入通道 ({{ selectedDeviceName }})</h3>
      <div class="channels-list">
        <div v-for="channel in currentChannels" :key="channel.id" class="channel-item">
          <span class="channel-name">{{ channel.name }}</span>
          <span class="channel-value">{{ channel.value.toFixed(3) }}</span>
          <div class="channel-bar">
            <div class="channel-fill" :style="{ width: channel.value * 100 + '%' }"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="midi-section">
      <h3>MIDI 输出</h3>
      <div class="midi-status">
        <p>MIDI 设备: {{ midiDeviceCount }} 个可用</p>
        <button @click="testMidi" class="test-btn">发送测试 CC</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const selectedDevice = ref('trackpad')
const isActive = ref(false)
const midiDeviceCount = ref(0)

const devices = [
  { id: 'trackpad', name: '触控板' },
  { id: 'tablet', name: '数位板' },
  { id: 'gamepad', name: '游戏手柄' },
]

// 模拟通道数据
const channels = ref({
  trackpad: [
    { id: 'pressure', name: '压力', value: 0 },
    { id: 'x', name: 'X 坐标', value: 0 },
    { id: 'y', name: 'Y 坐标', value: 0 },
  ],
  tablet: [
    { id: 'pressure', name: '压力', value: 0 },
    { id: 'x', name: 'X 坐标', value: 0 },
    { id: 'y', name: 'Y 坐标', value: 0 },
    { id: 'tilt_x', name: 'X 倾斜', value: 0 },
    { id: 'tilt_y', name: 'Y 倾斜', value: 0 },
  ],
  gamepad: [
    { id: 'left_stick_x', name: '左摇杆 X', value: 0 },
    { id: 'left_stick_y', name: '左摇杆 Y', value: 0 },
    { id: 'right_stick_x', name: '右摇杆 X', value: 0 },
    { id: 'right_stick_y', name: '右摇杆 Y', value: 0 },
  ],
})

const selectedDeviceName = computed(() => {
  return devices.find((d) => d.id === selectedDevice.value)?.name || ''
})

const currentChannels = computed(() => {
  return channels.value[selectedDevice.value as keyof typeof channels.value] || []
})

const statusText = computed(() => {
  return isActive.value ? '系统已就绪' : '正在初始化...'
})

function selectDevice(deviceId: string) {
  selectedDevice.value = deviceId
}

function testMidi() {
  console.log('发送测试 MIDI CC')
  // 这里可以集成真实的 MIDI 输出测试
}

// 模拟初始化过程
onMounted(() => {
  setTimeout(() => {
    isActive.value = true
    midiDeviceCount.value = 1
  }, 1000)

  // 模拟数据更新
  const interval = setInterval(() => {
    // 更新触控板数据
    channels.value.trackpad[0].value = Math.random() * 0.8
    channels.value.trackpad[1].value = Math.sin(Date.now() / 1000) * 0.5 + 0.5
    channels.value.trackpad[2].value = Math.cos(Date.now() / 1500) * 0.5 + 0.5
  }, 100)

  onUnmounted(() => {
    clearInterval(interval)
  })
})
</script>

<style scoped>
.simple-input-panel {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
}

.status-section {
  margin-bottom: 25px;
}

.simple-input-panel h2 {
  color: #333;
  margin-bottom: 10px;
}

.simple-input-panel h3 {
  color: #555;
  font-size: 16px;
  margin-bottom: 12px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  font-size: 14px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ccc;
  transition: background-color 0.3s;
}

.status-dot.active {
  background: #28a745;
}

.device-section,
.channels-section,
.midi-section {
  margin-bottom: 25px;
}

.device-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.device-buttons button {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.device-buttons button:hover {
  background: #f5f5f5;
}

.device-buttons button.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.channels-list {
  border: 1px solid #ddd;
  border-radius: 6px;
  overflow: hidden;
}

.channel-item {
  padding: 12px;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
  gap: 12px;
}

.channel-item:last-child {
  border-bottom: none;
}

.channel-name {
  font-weight: 500;
  min-width: 80px;
  color: #333;
}

.channel-value {
  font-family: monospace;
  color: #007bff;
  min-width: 60px;
  text-align: right;
}

.channel-bar {
  flex: 1;
  height: 6px;
  background: #e9ecef;
  border-radius: 3px;
  overflow: hidden;
}

.channel-fill {
  height: 100%;
  background: linear-gradient(90deg, #28a745, #ffc107, #dc3545);
  transition: width 0.1s ease;
}

.midi-status {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.midi-status p {
  margin-bottom: 10px;
  color: #666;
}

.test-btn {
  padding: 6px 12px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.test-btn:hover {
  background: #218838;
}
</style>
