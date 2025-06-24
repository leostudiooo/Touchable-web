import { WebSocketServer } from 'ws';

const PORT = 8080;

console.log('🌉 启动浏览器桥接服务器...');

const wss = new WebSocketServer({ port: PORT });

// 存储连接的客户端
const clients = new Set();

wss.on('connection', (ws) => {
  console.log('🔗 新客户端连接');
  clients.add(ws);

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      const mode = message.data?.mode || 'unknown';
      const browser = message.data?.browser || 'unknown';

      // 特别处理 MIDI 设置消息
      if (message.type === 'midi-settings') {
        console.log(`🎛️ MIDI设置同步: ${browser} [${mode}模式] -> 从机`);
        console.log('   设置详情:', JSON.stringify(message.data, null, 2));
      } else {
        console.log(`📨 收到消息: ${message.type} from ${browser} [${mode}模式]`);
      }

      // 广播给所有其他客户端
      clients.forEach((client) => {
        if (client !== ws && client.readyState === 1) { // WebSocket.OPEN = 1
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
console.log('1. Safari (主模式) - 负责压感输入，发送数据');
console.log('2. Chrome (从模式) - 负责 MIDI 输出，接收数据');
console.log('3. 在两个浏览器中都点击"连接桥接"按钮');
console.log('4. 在 Safari 中操作触控区域，数据会自动同步到 Chrome');

process.on('SIGINT', () => {
  console.log('\n👋 关闭桥接服务器...');
  wss.close();
  process.exit(0);
});
