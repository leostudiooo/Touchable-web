# MIDI 设置同步指南

## 🎛️ 新功能概述

我们已经实现了 MIDI 设置在主从机之间的自动同步功能，并重新设计了 MIDI 设置区域的用户界面。

## ⭐ 主要改进

### 1. MIDI 设置自动同步

- **主机（Safari）** 修改 MIDI 映射后，设置会自动同步到**从机（Chrome/Edge）**
- 支持同步的设置包括：
  - ✅ 启用/禁用映射开关
  - ✅ CC 控制器编号（0-127）
  - ✅ 参数名称
  - ✅ MIDI 通道（1-16）

### 2. 全新的 MIDI 设置界面

- 🎨 现代化卡片式布局
- 🌓 完美支持深色模式
- 📱 移动端友好设计
- ✨ 悬停效果和过渡动画
- 🎯 实时数值显示（0-127 范围）

### 3. 桥接服务器增强

- 📊 详细的 MIDI 设置同步日志
- 🔍 可视化的数据流向显示

## 🔧 使用方法

### 启动服务

```bash
# 启动前端开发服务器
npm run dev

# 启动桥接服务器
npm run bridge
```

### 测试同步功能

1. 打开两个浏览器窗口：

   - **Safari**（主模式）- http://localhost:5173
   - **Chrome**（从模式）- http://localhost:5173

2. 在两个浏览器中都点击 **"连接桥接"** 按钮

3. 在 Safari 中修改 MIDI 设置：

   - 切换启用/禁用开关
   - 修改 CC 控制器编号
   - 更改参数名称
   - 调整 MIDI 通道

4. 观察 Chrome 中的设置是否自动同步更新

### 验证同步状态

- 桥接服务器终端会显示详细的同步日志
- 浏览器开发者控制台会显示同步过程
- 从机界面会实时反映主机的设置变更

## 🎹 MIDI 映射默认配置

| 参数   | 默认CC | 通道 | 名称   |
| ------ | ------ | ---- | ------ |
| 压力值 | CC1    | 1    | 调制轮 |
| X坐标  | CC74   | 1    | 滤波器 |
| Y坐标  | CC71   | 1    | 共鸣   |

## 🐛 故障排除

### 同步不工作

1. 检查桥接服务器是否运行在 `ws://localhost:8080`
2. 确认两个浏览器都显示 "已连接" 状态
3. 查看桥接服务器和浏览器控制台的错误信息

### 界面显示异常

1. 清除浏览器缓存并刷新页面
2. 检查浏览器是否支持现代 CSS 特性
3. 尝试切换浏览器的深色/浅色模式

## 📝 技术细节

### 同步机制

- 主机通过 WebSocket 发送 `midi-settings` 消息
- 桥接服务器广播消息到所有从机
- 从机接收后更新本地 MIDI 配置

### 消息格式

```typescript
interface MidiSettings {
  pressure: { enabled: boolean; cc: number; channel: number; name: string }
  x: { enabled: boolean; cc: number; channel: number; name: string }
  y: { enabled: boolean; cc: number; channel: number; name: string }
}
```

### CSS 设计亮点

- 使用 CSS Grid 和 Flexbox 布局
- CSS 自定义属性支持主题切换
- 渐变背景和阴影效果
- 响应式设计适配各种屏幕尺寸

## 🔮 下一步计划

- [ ] 支持更多 MIDI 控制器类型（PC、Pitch Bend等）
- [ ] 添加 MIDI 设置预设保存/加载功能
- [ ] 实现 MIDI 输出设备选择
- [ ] 添加 MIDI 学习模式（自动映射）
