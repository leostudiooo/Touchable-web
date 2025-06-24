<template>
  <div v-if="isVisible" class="mapping-dialog-overlay" @click="close">
    <div class="mapping-dialog" @click.stop>
      <div class="dialog-header">
        <h3>添加 MIDI 映射</h3>
        <button @click="close" class="close-btn">×</button>
      </div>

      <div class="dialog-content">
        <div class="form-group">
          <label>输入通道</label>
          <select v-model="formData.sourceChannel">
            <option value="">请选择输入通道</option>
            <option v-for="channel in availableChannels" :key="channel.id" :value="channel.id">
              {{ channel.name }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>MIDI CC 号</label>
          <input v-model.number="formData.cc" type="number" min="0" max="127" placeholder="0-127" />
        </div>

        <div class="form-group">
          <label>最小值</label>
          <input v-model.number="formData.minValue" type="number" min="0" max="127" />
        </div>

        <div class="form-group">
          <label>最大值</label>
          <input v-model.number="formData.maxValue" type="number" min="0" max="127" />
        </div>

        <div class="form-group">
          <label>映射曲线</label>
          <select v-model="formData.curve">
            <option value="linear">线性</option>
            <option value="exponential">指数</option>
            <option value="logarithmic">对数</option>
          </select>
        </div>
      </div>

      <div class="dialog-actions">
        <button @click="close" class="btn-secondary">取消</button>
        <button @click="save" class="btn-primary" :disabled="!isFormValid">保存</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useInputDeviceStore } from '@/stores/inputDevice'
import { useMidiStore } from '@/stores/midi'
import type { InputChannel } from '@/stores/inputDevice'
import type { MidiMapping } from '@/stores/midi'

interface Props {
  isVisible: boolean
  deviceType: string
}

interface Emits {
  (e: 'close'): void
  (e: 'save', mapping: Omit<MidiMapping, 'id'>): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const inputDeviceStore = useInputDeviceStore()
const midiStore = useMidiStore()

const formData = ref({
  sourceChannel: '',
  cc: 1,
  minValue: 0,
  maxValue: 127,
  curve: 'linear' as 'linear' | 'exponential' | 'logarithmic',
})

const availableChannels = computed((): InputChannel[] => {
  return inputDeviceStore.getChannelsForDevice(props.deviceType)
})

const isFormValid = computed(() => {
  return (
    formData.value.sourceChannel &&
    formData.value.cc >= 0 &&
    formData.value.cc <= 127 &&
    formData.value.minValue >= 0 &&
    formData.value.maxValue <= 127 &&
    formData.value.minValue <= formData.value.maxValue
  )
})

// 重置表单当对话框打开时
watch(
  () => props.isVisible,
  (newValue) => {
    if (newValue) {
      resetForm()
    }
  },
)

function resetForm() {
  formData.value = {
    sourceChannel: '',
    cc: 1,
    minValue: 0,
    maxValue: 127,
    curve: 'linear',
  }
}

function close() {
  emit('close')
}

function save() {
  if (!isFormValid.value) return

  const selectedChannel = availableChannels.value.find(
    (ch) => ch.id === formData.value.sourceChannel,
  )
  if (!selectedChannel) return

  const mapping = {
    source: selectedChannel.name,
    sourceDevice: props.deviceType,
    sourceChannel: formData.value.sourceChannel,
    cc: formData.value.cc,
    minValue: formData.value.minValue,
    maxValue: formData.value.maxValue,
    curve: formData.value.curve,
    enabled: true,
  }

  midiStore.addMapping(mapping)
  emit('save', mapping)
  close()
}
</script>

<style scoped>
.mapping-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.mapping-dialog {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  width: 400px;
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;
}

.dialog-header {
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog-header h3 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.close-btn:hover {
  background: #f5f5f5;
}

.dialog-content {
  padding: 20px;
  max-height: 400px;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  color: #555;
  font-weight: 500;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.dialog-actions {
  padding: 20px;
  border-top: 1px solid #e9ecef;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-secondary,
.btn-primary {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
