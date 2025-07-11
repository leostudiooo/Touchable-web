# Touchable Web 使用指南

## 功能概述

Touchable Web 是一个将触控设备转换为 MIDI 控制器的 Web 应用，支持：

- 🎯 压感输入（Safari + macOS 触控板）
- 🎹 MIDI 输出（Chrome + Web MIDI API）
- 🌉 双浏览器桥接（Safari + Chrome 协作）

## 浏览器支持

### Safari（推荐用于压感输入）

- ✅ 支持 Mac 触控板压感检测
- ✅ 支持触摸事件的 force 属性
- ❌ 不支持 Web MIDI API

### Chrome（推荐用于 MIDI 输出）

- ✅ 支持 Web MIDI API
- ✅ 支持数位板压感（如 Wacom）
- ❌ 不支持 Mac 触控板压感

## 快速开始

### 方案一：单浏览器使用（功能有限）

1. 在 **Safari** 中打开应用 → 获得压感但无 MIDI 输出
2. 在 **Chrome** 中打开应用 → 获得 MIDI 但无压感

### 方案二：双浏览器桥接（推荐）

1. 启动桥接服务器：

   ```bash
   npm run bridge
   ```

2. 在 Safari 中打开 `http://localhost:5173/`
3. 在 Chrome 中打开 `http://localhost:5173/`
4. 在两个浏览器中都点击"连接桥接"
5. 现在可以在 Safari 中使用压感，MIDI 数据会自动发送到 Chrome

## 操作方法

### 压感输入

- **触控板**：用力按压可产生不同的压感值
- **鼠标**：点击拖拽使用固定压感值
- **触摸屏**：支持多点触控和压感

### MIDI 映射

- **压力** → CC 1 (调制轮)
- **X 坐标** → CC 74 (滤波器)
- **Y 坐标** → CC 71 (共鸣)

### 可视化

- 实时显示触控轨迹
- 压感值实时反馈
- 参数数值显示

## 故障排除

### Safari 显示"压感不支持"

1. 确保在 macOS 上运行
2. 检查浏览器控制台的调试信息
3. 尝试点击"检测浏览器能力"按钮

### Chrome 无法连接 MIDI

1. 确保有 MIDI 设备连接
2. 检查浏览器 MIDI 权限
3. 尝试重新连接 MIDI 设备

### 桥接连接失败

1. 确保桥接服务器正在运行
2. 检查端口 8080 是否被占用
3. 查看服务器控制台日志

## 开发调试

- 打开浏览器开发者工具查看详细日志
- 使用"检测浏览器能力"按钮获取设备信息
- 桥接服务器会显示实时连接状态

## 技术栈

- Vue 3 + TypeScript + Vite
- Pressure.js（压感检测）
- Web MIDI API
- WebSocket（桥接通信）

1. **基础架构** ✅

   - Vue 3 + TypeScript + Vite 项目搭建
   - Pinia 状态管理
   - Vue Router 路由配置
   - PWA 支持配置

2. **核心依赖库** ✅

   - WEBMIDI.js (MIDI 输出)
   - Pressure.js (压感输入)
   - Gamepad.js (游戏手柄输入)
   - Chart.js + Vue-ChartJS (数据可视化)

3. **输入设备服务** ✅

   - `PressureInputService` - 处理触控板压感输入
   - `GamepadInputService` - 处理游戏手柄输入
   - `MidiOutputService` - 处理 MIDI 输出
   - `InputManagerService` - 统一管理所有输入设备

4. **状态管理** ✅

   - `inputDevice` store - 输入设备状态管理
   - `midi` store - MIDI 映射和设备管理
   - `visualization` store - 实时数据可视化

5. **用户界面** ✅
   - 左侧：输入映射面板（设备选择、通道映射、MIDI 配置）
   - 右侧：实时可视化面板（参数曲线图、压力圆圈显示）
   - 映射配置对话框
   - 测试区域

## 如何使用

### 1. 启动应用

```bash
cd /Users/lilingfeng/Repositories/Touchable-web
pnpm dev
```

访问：http://localhost:5173

### 2. 测试输入功能

1. **触控板测试**：

   - 在右侧测试区域内移动鼠标
   - 点击并拖动鼠标
   - 观察左侧输入通道的实时数值变化
   - 查看右侧可视化面板的参数曲线和压力圆圈

2. **游戏手柄测试**：
   - 连接游戏手柄到电脑
   - 切换左侧设备类型为"游戏手柄"
   - 操作手柄摇杆和扳机
   - 观察相应参数变化

### 3. 配置 MIDI 映射

1. 点击左侧"+ 添加映射"按钮
2. 选择输入通道（如压力、X坐标等）
3. 设置目标 MIDI CC 号（0-127）
4. 配置数值范围和映射曲线
5. 保存映射配置

### 4. 连接 MIDI 设备

1. 连接 MIDI 设备或启动 MIDI 软件
2. 应用会自动检测可用的 MIDI 输出设备
3. 开始操作输入设备，MIDI CC 消息将实时发送

## 技术架构

```
┌─────────────────────────────────────────────────────────┐
│                    Vue 3 前端应用                        │
├─────────────────────────────────────────────────────────┤
│  输入映射面板  │           实时可视化面板                   │
│  - 设备选择    │           - 参数曲线图                    │
│  - 通道映射    │           - 压力圆圈                      │
│  - MIDI配置    │           - 测试区域                      │
├─────────────────────────────────────────────────────────┤
│                   Pinia 状态管理                         │
│  inputDevice  │    midi     │    visualization         │
├─────────────────────────────────────────────────────────┤
│                    核心服务层                            │
│  InputManagerService（统一管理）                          │
│  ├─ PressureInputService（压感）                         │
│  ├─ GamepadInputService（手柄）                          │
│  └─ MidiOutputService（MIDI输出）                        │
├─────────────────────────────────────────────────────────┤
│                   浏览器 Web API                         │
│  Pressure.js  │  Gamepad API  │  WEBMIDI.js            │
└─────────────────────────────────────────────────────────┘
```

## 支持的设备类型

### 触控板 (trackpad)

- **压力** - 鼠标点击压力（模拟）
- **X 坐标** - 鼠标水平位置
- **Y 坐标** - 鼠标垂直位置

### 数位板 (tablet)

- **压力** - 压感笔压力
- **X 坐标** - 笔尖水平位置
- **Y 坐标** - 笔尖垂直位置
- **X 倾斜** - 笔的水平倾斜角度
- **Y 倾斜** - 笔的垂直倾斜角度

### 游戏手柄 (gamepad)

- **左摇杆 X/Y** - 左摇杆轴向
- **右摇杆 X/Y** - 右摇杆轴向
- **左扳机** - 左扳机压力
- **右扳机** - 右扳机压力

## 开发工具命令

```bash
# 开发模式
pnpm dev

# 构建生产版本
pnpm build

# 预览构建结果
pnpm preview

# 代码格式化
pnpm format

# 类型检查
pnpm type-check
```

## 下一步开发计划

1. **完善压感检测** - 实现真实的触控板压感识别
2. **数位板支持** - 集成数位板专用 API
3. **映射曲线编辑器** - 可视化映射曲线编辑
4. **预设配置** - 保存和加载映射预设
5. **性能优化** - 减少输入延迟，优化实时渲染
6. **PWA 完善** - 离线功能，桌面应用体验

## 故障排除

### 常见问题

1. **MIDI 设备未检测到**

   - 确保 MIDI 设备已连接并被系统识别
   - 检查浏览器是否支持 WEBMIDI API
   - 尝试刷新页面重新初始化

2. **游戏手柄无响应**

   - 确保手柄已连接并被系统识别
   - 在手柄上按任意按键激活连接
   - 检查浏览器控制台是否有错误信息

3. **压感输入不敏感**
   - 当前使用鼠标点击模拟压感
   - 真实压感需要支持的硬件设备
   - 可在测试区域验证基本输入功能

---

**项目状态**: 🚀 核心功能已完成，可用于基础测试和开发

**最后更新**: 2025年6月24日
