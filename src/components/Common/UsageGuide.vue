<template>
  <div class="usage-guide" v-if="showGuide">
    <div class="guide-overlay" @click="closeGuide">
      <div class="guide-content" @click.stop>
        <div class="guide-header">
          <h2>🎵 Touchable-web 使用指南</h2>
          <button @click="closeGuide" class="close-btn">×</button>
        </div>

        <div class="guide-body">
          <div class="guide-section">
            <h3>📱 当前功能演示</h3>
            <ul>
              <li>左侧面板显示输入设备状态和通道数据</li>
              <li>右侧面板提供交互测试区域</li>
              <li>在测试区域移动鼠标查看实时数据变化</li>
              <li>点击并拖动鼠标模拟压感输入</li>
            </ul>
          </div>

          <div class="guide-section">
            <h3>🎯 如何测试</h3>
            <ol>
              <li>在右侧"交互测试区域"内移动鼠标</li>
              <li>按住鼠标左键并拖动模拟压力输入</li>
              <li>观察左侧通道数据的实时变化</li>
              <li>查看右侧压力圆圈大小和 MIDI CC 输出</li>
              <li>切换左侧设备类型查看不同通道配置</li>
            </ol>
          </div>

          <div class="guide-section">
            <h3>🔧 技术特性</h3>
            <ul>
              <li><strong>多设备支持</strong>: 触控板、数位板、游戏手柄</li>
              <li><strong>实时数据流</strong>: 60fps 数据采集和处理</li>
              <li><strong>MIDI 输出</strong>: 标准 MIDI CC 消息格式</li>
              <li><strong>响应式界面</strong>: 现代化 Web 技术栈</li>
            </ul>
          </div>

          <div class="guide-section">
            <h3>⚡ 下一步开发</h3>
            <p>当前版本是功能演示，后续将添加：</p>
            <ul>
              <li>真实硬件设备集成</li>
              <li>完整的 MIDI 映射配置</li>
              <li>自定义映射曲线编辑</li>
              <li>配置预设保存/加载</li>
            </ul>
          </div>
        </div>

        <div class="guide-footer">
          <button @click="closeGuide" class="guide-btn">开始体验</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  showGuide: boolean
}

interface Emits {
  (e: 'close'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

function closeGuide() {
  emit('close')
}
</script>

<style scoped>
.guide-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.guide-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  width: 600px;
  max-width: 90vw;
  max-height: 80vh;
  overflow: hidden;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.guide-header {
  padding: 25px 30px 20px;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.guide-header h2 {
  margin: 0;
  font-size: 24px;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 24px;
  width: 35px;
  height: 35px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.guide-body {
  padding: 20px 30px;
  max-height: 50vh;
  overflow-y: auto;
}

.guide-section {
  margin-bottom: 24px;
}

.guide-section:last-child {
  margin-bottom: 0;
}

.guide-section h3 {
  color: #333;
  margin-bottom: 12px;
  font-size: 18px;
}

.guide-section ul,
.guide-section ol {
  margin-left: 20px;
  color: #555;
  line-height: 1.6;
}

.guide-section li {
  margin-bottom: 6px;
}

.guide-section p {
  color: #666;
  line-height: 1.6;
  margin-bottom: 8px;
}

.guide-section strong {
  color: #333;
}

.guide-footer {
  padding: 20px 30px;
  border-top: 1px solid #e9ecef;
  text-align: center;
  background: #f8f9fa;
}

.guide-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: transform 0.2s;
}

.guide-btn:hover {
  transform: translateY(-1px);
}
</style>
