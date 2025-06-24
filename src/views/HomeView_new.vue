<template>
  <div class="home-view">
    <div class="main-layout">
      <!-- 左侧面板：输入映射管理 -->
      <div class="left-panel">
        <InputMappingPanel />
      </div>

      <!-- 右侧面板：实时可视化 -->
      <div class="right-panel">
        <VisualizationPanel />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import InputMappingPanel from '@/components/InputMapping/InputMappingPanel.vue'
import VisualizationPanel from '@/components/Visualization/VisualizationPanel.vue'
</script>

<style scoped>
.home-view {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-background);
  color: var(--color-text);
  overflow: hidden;
}

.main-layout {
  display: flex;
  flex: 1;
  min-height: 0;
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

/* 响应式设计 */
@media (min-width: 1024px) {
  .left-panel {
    width: 480px;
    min-width: 400px;
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
}
</style>
