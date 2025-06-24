<template>
  <div class="input-mapping-panel">
    <div class="panel-header">
      <h2>输入映射</h2>
      <div class="status-indicator">
        <div v-if="isInitializing" class="status-item status-loading">🔄 正在初始化...</div>
        <div v-else-if="initializationError" class="status-item status-error">
          ❌ {{ initializationError }}
        </div>
        <div v-else-if="isInitialized" class="status-item status-ready">✅ 已就绪</div>
      </div>
    </div>

    <div class="panel-content">
      <!-- 设备选择 -->
      <div class="device-selection">
        <h3>设备类型</h3>
        <div class="device-buttons">
          <button
            v-for="device in deviceTypes"
            :key="device.id"
            :class="{ active: selectedDeviceType === device.id }"
            @click="selectDeviceType(device.id)"
          >
            {{ device.name }}
          </button>
        </div>
      </div>

      <!-- 输入通道列表 -->
      <div class="input-channels">
        <h3>可用输入通道</h3>
        <div class="channels-list">
          <div v-for="channel in availableChannels" :key="channel.id" class="channel-item">
            <span class="channel-name">{{ channel.name }}</span>
            <span class="channel-value">{{ channel.value.toFixed(2) }}</span>
          </div>
        </div>
      </div>

      <!-- MIDI 映射 -->
      <div class="midi-mapping">
        <h3>MIDI CC 映射</h3>
        <div class="mapping-list">
          <div v-for="mapping in midiMappings" :key="mapping.id" class="mapping-item">
            <div class="mapping-source">{{ mapping.source }}</div>
            <div class="mapping-arrow">→</div>
            <div class="mapping-target">CC {{ mapping.cc }}</div>
            <button @click="removeMapping(mapping.id)" class="remove-btn">×</button>
          </div>
        </div>
        <button @click="addMapping" class="add-mapping-btn">+ 添加映射</button>
      </div>
    </div>

    <!-- 映射配置对话框 -->
    <MappingDialog
      :is-visible="showMappingDialog"
      :device-type="selectedDeviceType"
      @close="closeMappingDialog"
      @save="handleMappingSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useInputDeviceStore } from '@/stores/inputDevice'
import { useMidiStore } from '@/stores/midi'
import { useInputManager } from '@/composables/useInputManager'
import MappingDialog from './MappingDialog.vue'
import type { MidiMapping } from '@/stores/midi'

const inputDeviceStore = useInputDeviceStore()
const midiStore = useMidiStore()
const { isInitialized, isInitializing, initializationError } = useInputManager()

const deviceTypes = [
  { id: 'trackpad', name: '触控板' },
  { id: 'tablet', name: '数位板' },
  { id: 'gamepad', name: '游戏手柄' },
]

const selectedDeviceType = ref('trackpad')
const showMappingDialog = ref(false)

const availableChannels = computed(() => {
  return inputDeviceStore.getChannelsForDevice(selectedDeviceType.value)
})

const midiMappings = computed(() => {
  return midiStore.mappings
})

function selectDeviceType(deviceType: string) {
  selectedDeviceType.value = deviceType
  inputDeviceStore.setActiveDevice(deviceType)
}

function addMapping() {
  showMappingDialog.value = true
}

function closeMappingDialog() {
  showMappingDialog.value = false
}

function handleMappingSave(mapping: Omit<MidiMapping, 'id'>) {
  console.log('Mapping saved:', mapping)
}

function removeMapping(id: string) {
  midiStore.removeMapping(id)
}
</script>

<style scoped>
.input-mapping-panel {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-header h2 {
  margin: 0 0 10px 0;
  color: #333;
}

.status-indicator {
  margin-bottom: 10px;
}

.status-item {
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-loading {
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.status-error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.status-ready {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
}

.device-selection,
.input-channels,
.midi-mapping {
  margin-bottom: 30px;
}

.device-selection h3,
.input-channels h3,
.midi-mapping h3 {
  margin: 0 0 15px 0;
  color: #555;
  font-size: 16px;
}

.device-buttons {
  display: flex;
  gap: 10px;
}

.device-buttons button {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
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

.channels-list,
.mapping-list {
  border: 1px solid #ddd;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
}

.channel-item,
.mapping-item {
  padding: 10px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.channel-item:last-child,
.mapping-item:last-child {
  border-bottom: none;
}

.channel-name {
  font-weight: 500;
}

.channel-value {
  color: #666;
  font-family: monospace;
}

.mapping-item {
  justify-content: flex-start;
  gap: 10px;
}

.mapping-source,
.mapping-target {
  padding: 4px 8px;
  background: #f8f9fa;
  border-radius: 3px;
  font-size: 12px;
}

.mapping-arrow {
  color: #666;
}

.remove-btn {
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 3px;
  width: 20px;
  height: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: auto;
}

.add-mapping-btn {
  width: 100%;
  padding: 10px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
}

.add-mapping-btn:hover {
  background: #218838;
}
</style>
