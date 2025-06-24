# Touchable-web

将通用线性输入设备（如压感触控板、数位笔、游戏手柄等）转换为 MIDI CC 输出的 Web 应用。

## 项目特性

- 🎯 **多设备支持**: 支持触控板、数位板、游戏手柄等多种输入设备
- 🎵 **MIDI 输出**: 实时转换输入信号为 MIDI CC 消息
- 📊 **实时可视化**: 参数曲线图表和压力可视化
- ⚡ **高性能**: 低延迟的输入处理和输出
- 📱 **PWA 支持**: 支持离线使用和桌面安装

## 技术栈

- **前端框架**: Vue 3 + TypeScript
- **构建工具**: Vite
- **状态管理**: Pinia
- **路由**: Vue Router
- **可视化**: Chart.js + Vue-ChartJS
- **MIDI**: WEBMIDI.js
- **输入处理**: Pressure.js, Gamepad.js
- **PWA**: Vite PWA Plugin

## 开发环境设置

### 环境要求

- Node.js >= 18
- pnpm (推荐) 或 npm

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm dev
```

### 构建生产版本

```bash
pnpm build
```

### 预览构建结果

```bash
pnpm preview
```

## 项目结构

```
src/
├── components/           # Vue 组件
│   ├── InputMapping/    # 输入映射面板组件
│   ├── Visualization/   # 可视化面板组件
│   └── Common/          # 通用组件
├── views/               # 页面组件
├── stores/              # Pinia 状态管理
│   ├── inputDevice.ts   # 输入设备管理
│   ├── midi.ts          # MIDI 输出管理
│   └── visualization.ts # 可视化数据管理
├── services/            # 核心服务
├── composables/         # Vue 组合式函数
├── utils/               # 工具函数
└── assets/              # 静态资源
```

## 使用说明

1. **选择输入设备**: 在左侧面板选择要使用的设备类型（触控板、数位板、游戏手柄）
2. **配置 MIDI 映射**: 将输入通道映射到对应的 MIDI CC 号
3. **连接 MIDI 设备**: 连接你的 MIDI 设备或软件
4. **开始使用**: 在输入设备上操作，查看右侧的实时可视化效果

## 支持的设备

### 触控板

- 压力检测（可配置是否忽略 Force Touch）
- X/Y 坐标追踪

### 数位板

- 压力感应
- X/Y 坐标
- 笔的倾斜角度

### 游戏手柄

- 摇杆轴向
- 扳机压力
- 按键状态

## 开发计划

- [ ] 完善输入设备驱动
- [ ] 添加更多映射配置选项
- [ ] 支持自定义映射曲线
- [ ] 添加预设配置功能
- [ ] 改进 PWA 功能

## 贡献

欢迎提交 Issues 和 Pull Requests！

## 许可证

MIT License
