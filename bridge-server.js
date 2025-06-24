#!/usr/bin/env node

/**
 * 简单的 WebSocket 桥接服务器
 * 用于在不同浏览器间同步压感和 MIDI 数据
 */

const WebSocket = require('ws');

const PORT = 8080;

console.log('🌉 启动浏览器桥接服务器...');

const wss = new WebSocket.Server({ port: PORT });

// 存储连接的客户端
const clients = new Set();

wss.on('connection', (ws) => {
  console.log('🔗 新客户端连接');
  clients.add(ws);

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log(`📨 收到消息: ${message.type} from ${message.data?.browser || 'unknown'}`);

      // 广播给所有其他客户端
      clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(data.toString());
        }
      });
    } catch (error) {
      console.error('❌ 解析消息失败:', error);
    }
  });

  ws.on('close', () => {
    console.log('🔌 客户端断开连接');
    clients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket 错误:', error);
    clients.delete(ws);
  });

  // 发送欢迎消息
  ws.send(JSON.stringify({
    type: 'status',
    data: { message: '桥接服务器已连接' },
    timestamp: Date.now()
  }));
});

console.log(`✅ 桥接服务器运行在 ws://localhost:${PORT}`);
console.log('📝 使用说明:');
console.log('1. 在 Safari 中打开应用获得压感支持');
console.log('2. 在 Chrome 中打开应用获得 MIDI 支持');
console.log('3. 点击"连接桥接"按钮即可实现跨浏览器协作');

process.on('SIGINT', () => {
  console.log('\n👋 关闭桥接服务器...');
  wss.close();
  process.exit(0);
});
