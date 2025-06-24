<template>
  <div class="home-view">
    <header class="app-header">
      <h1 class="app-title">🎹 Touchable Web</h1>
      <p class="app-subtitle">将触控设备转换为 MIDI 控制器</p>
    </header>

    <div class="main-layout">
      <!-- 左侧面板：输入映射管理 -->
      <div class="left-panel">
        <div class="panel-header">
          <h2 class="panel-title">输入映射</h2>
        </div>
        <div class="panel-content">
          <div class="feature-list">
            <div class="feature-item">✅ 应用已加载成功</div>
            <div class="feature-item">📱 支持触控板压感输入</div>
            <div class="feature-item">🎮 支持游戏手柄输入</div>
            <div class="feature-item">🎹 支持 MIDI 输出</div>
          </div>
          <button class="test-button" @click="startTest">
            {{ isTestRunning ? '停止测试' : '开始测试' }}
          </button>
        </div>
      </div>

      <!-- 右侧面板：实时可视化 -->
      <div class="right-panel">
        <div class="panel-header">
          <h2 class="panel-title">实时可视化</h2>
        </div>
        <div class="panel-content">
          <div class="feature-list">
            <div class="feature-item">📊 实时数据可视化</div>
            <div class="feature-item">🔄 参数变化追踪</div>
            <div class="feature-item">📈 历史数据图表</div>
          </div>
          <div class="status-card">
            <p class="status-text">状态：待连接设备</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
console.log('🚀 HomeView 组件已加载')
</script>

<style scoped>
/* 基础布局 */
.home-view {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-background);
  color: var(--color-text);
  overflow: hidden;
}

/* 应用头部 */
.app-header {
  padding: 1.5rem 2rem;
  text-align: center;
  background: var(--color-background-soft);
  border-bottom: 1px solid var(--color-border);
}

.app-title {
  font-size: 2rem;
  font-weight: 600;
  margin: 0;
  color: var(--color-heading);
}

.app-subtitle {
  font-size: 1.1rem;
  margin: 0.5rem 0 0 0;
  color: var(--color-text);
  opacity: 0.8;
}

/* 主要布局 */
.main-layout {
  display: flex;
  flex: 1;
  min-height: 0;
}

/* 面板共同样式 */
.left-panel,
.right-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.left-panel {
  width: 420px;
  min-width: 350px;
  background: var(--color-background-soft);
  border-right: 1px solid var(--color-border);
}

.right-panel {
  flex: 1;
  background: var(--color-background);
}

/* 面板头部 */
.panel-header {
  padding: 1rem 1.5rem;
  background: var(--color-background-mute);
  border-bottom: 1px solid var(--color-border);
}

.panel-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  color: var(--color-heading);
}

/* 面板内容 */
.panel-content {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
}

/* 功能列表 */
.feature-list {
  margin-bottom: 1.5rem;
}

.feature-item {
  padding: 0.75rem 0;
  font-size: 0.95rem;
  color: var(--color-text);
  border-bottom: 1px solid var(--color-border);
}

.feature-item:last-child {
  border-bottom: none;
}

/* 按钮样式 */
.test-button {
  width: 100%;
  padding: 0.75rem 1.5rem;
  background: #4a90e2;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.test-button:hover {
  background: #357abd;
  transform: translateY(-1px);
}

.test-button:active {
  transform: translateY(0);
}

/* 状态卡片 */
.status-card {
  margin-top: 1.5rem;
  padding: 1rem;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 6px;
}

.status-text {
  margin: 0;
  color: var(--color-text);
  font-size: 0.95rem;
}

/* 响应式设计 */
@media (min-width: 1024px) {
  .left-panel {
    width: 480px;
    min-width: 400px;
  }

  .app-title {
    font-size: 2.5rem;
  }
}

@media (max-width: 768px) {
  .main-layout {
    flex-direction: column;
  }

  .left-panel {
    width: 100%;
    min-width: unset;
    border-right: none;
    border-bottom: 1px solid var(--color-border);
  }

  .app-header {
    padding: 1rem;
  }

  .app-title {
    font-size: 1.5rem;
  }

  .panel-content {
    padding: 1rem;
  }
}

@media (max-width: 480px) {
  .app-header {
    padding: 0.75rem;
  }

  .app-title {
    font-size: 1.25rem;
  }

  .app-subtitle {
    font-size: 1rem;
  }
}

/* 深色模式特殊处理 */
@media (prefers-color-scheme: dark) {
  .test-button {
    background: #5a9fd4;
  }

  .test-button:hover {
    background: #4a8bc2;
  }
}
</style>
