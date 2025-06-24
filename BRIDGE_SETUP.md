# 双浏览器桥接服务器

这是一个简单的 WebSocket 服务器，用于在 Safari (压感) 和 Chrome (MIDI) 之间传递数据。

## 快速启动

### 选项1: 使用 Node.js

```bash
npm install ws
node bridge-server.js
```

### 选项2: 使用 Python

```bash
pip install websockets
python bridge-server.py
```

### 选项3: 使用 Deno

```bash
deno run --allow-net bridge-server.ts
```

## 使用说明

1. 启动桥接服务器
2. 在 Safari 中打开 Touchable Web (用于压感输入)
3. 在 Chrome 中打开 Touchable Web (用于 MIDI 输出)
4. 两个浏览器会自动建立连接并同步数据

## 服务器代码

### Node.js 版本 (bridge-server.js)

```javascript
const WebSocket = require('ws')

const wss = new WebSocket.Server({ port: 8080 })
let clients = new Map()

wss.on('connection', function connection(ws) {
  console.log('新客户端已连接')

  ws.on('message', function incoming(data) {
    try {
      const message = JSON.parse(data)

      // 根据消息类型路由到不同的客户端
      if (message.type === 'status') {
        clients.set(ws, message.data)
        console.log('客户端注册:', message.data.browser)
      } else {
        // 转发消息给其他客户端
        wss.clients.forEach(function each(client) {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(data)
          }
        })
      }
    } catch (error) {
      console.error('解析消息失败:', error)
    }
  })

  ws.on('close', function () {
    clients.delete(ws)
    console.log('客户端已断开')
  })
})

console.log('🚀 桥接服务器启动在端口 8080')
```

### Python 版本 (bridge-server.py)

```python
import asyncio
import websockets
import json

clients = {}

async def handle_client(websocket, path):
    print("新客户端已连接")

    try:
        async for message in websocket:
            try:
                data = json.loads(message)

                if data['type'] == 'status':
                    clients[websocket] = data['data']
                    print(f"客户端注册: {data['data']['browser']}")
                else:
                    # 转发消息给其他客户端
                    for client in clients:
                        if client != websocket and client.open:
                            await client.send(message)

            except json.JSONDecodeError:
                print("解析消息失败")

    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        if websocket in clients:
            del clients[websocket]
        print("客户端已断开")

start_server = websockets.serve(handle_client, "localhost", 8080)
print("🚀 桥接服务器启动在端口 8080")
asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
```

## 工作原理

1. **Safari 端**: 检测到压感输入变化时，通过 WebSocket 发送压感数据
2. **Chrome 端**: 接收压感数据，转换为 MIDI CC 消息并发送到 MIDI 设备
3. **双向同步**: 两个浏览器的界面保持同步更新

## 优势

- ✅ 充分利用每个浏览器的优势
- ✅ 无需插件或扩展
- ✅ 实时同步，延迟极低
- ✅ 支持多个 MIDI 设备
- ✅ 可扩展到更多功能
