/**
 * 浏览器能力检测和智能降级方案
 */

export interface BrowserCapabilities {
  pressure: boolean
  midi: boolean
  browser: string
  recommendation: string
}

export class CapabilityDetector {
  static async detectCapabilities(): Promise<BrowserCapabilities> {
    const userAgent = navigator.userAgent.toLowerCase()
    const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent)
    const isChrome = /chrome/.test(userAgent)
    const isFirefox = /firefox/.test(userAgent)

    let browser = 'unknown'
    if (isSafari) browser = 'safari'
    else if (isChrome) browser = 'chrome'
    else if (isFirefox) browser = 'firefox'

    // 检测压感支持
    const pressureSupported = await this.checkPressureSupport()

    // 检测 MIDI 支持
    const midiSupported = await this.checkMidiSupport()

    let recommendation = ''
    if (pressureSupported && midiSupported) {
      recommendation = '✅ 完全支持！享受完整的压感到 MIDI 体验'
    } else if (!pressureSupported && !midiSupported) {
      if (isSafari) {
        recommendation = '❌ MIDI 支持缺失。建议同时打开 Chrome 启用桥接模式'
      } else if (isChrome) {
        recommendation =
          '❌ 压感支持缺失。Chrome 不支持 Mac 触控板的压感事件，建议同时打开 Safari 启用桥接模式'
      } else {
        recommendation = '建议使用 Chrome (MIDI) + Safari (压感) 双浏览器桥接方案'
      }
    } else if (!pressureSupported) {
      if (isChrome) {
        recommendation =
          '⚠️ Chrome 不支持 Mac 触控板压感事件。建议在 Safari 中打开获得完整体验，或启用桥接模式'
      } else {
        recommendation = '⚠️ 缺少压感支持。建议在 Safari 中打开获得完整体验，或启用桥接模式'
      }
    } else if (!midiSupported) {
      recommendation = '⚠️ 缺少 MIDI 支持。建议在 Chrome 中打开连接 MIDI 设备，或启用桥接模式'
    }

    return {
      pressure: pressureSupported,
      midi: midiSupported,
      browser,
      recommendation,
    }
  }

  private static async checkPressureSupport(): Promise<boolean> {
    const userAgent = navigator.userAgent.toLowerCase()
    const platform = navigator.platform.toLowerCase()

    // Safari on macOS/iOS - 支持压感
    const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent)
    const isMac = /mac/.test(platform) || /iphone|ipad/.test(userAgent)
    const isIOS = /iphone|ipad/.test(userAgent)

    if (isSafari && (isMac || isIOS)) {
      return true
    }

    // Chrome 在某些设备上支持压感（数位板、触屏设备）
    const isChrome = /chrome/.test(userAgent)
    if (isChrome) {
      // 检查是否有触摸支持
      const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      // 检查是否可能是数位板或支持压感的设备
      const mightHavePressure = hasTouchSupport || this.detectPenTablet()
      return mightHavePressure
    }

    // Firefox 等其他浏览器通常不支持压感
    return false
  }

  private static detectPenTablet(): boolean {
    // 检测可能的数位板或触控笔设备
    const userAgent = navigator.userAgent.toLowerCase()

    // 检查是否有指针事件支持（通常数位板会有）
    const hasPointerEvents = 'onpointerdown' in window

    // 检查是否支持触摸或者有高精度输入设备
    const hasPrecisionInput =
      navigator.maxTouchPoints > 0 || 'ontouchstart' in window || hasPointerEvents

    // Surface 设备通常支持压感
    const isSurface = /surface/.test(userAgent)

    return hasPrecisionInput || isSurface
  }

  private static async checkMidiSupport(): Promise<boolean> {
    try {
      if (!navigator.requestMIDIAccess) return false

      const midiAccess = await navigator.requestMIDIAccess()
      return midiAccess !== null
    } catch {
      return false
    }
  }

  static showBrowserGuidance(capabilities: BrowserCapabilities): void {
    const modal = this.createGuidanceModal(capabilities)
    document.body.appendChild(modal)
  }

  private static createGuidanceModal(capabilities: BrowserCapabilities): HTMLElement {
    const modal = document.createElement('div')
    modal.className = 'browser-guidance-modal'
    modal.innerHTML = `
      <div class="modal-content">
        <h2>🌐 浏览器兼容性检测</h2>
        <div class="capability-status">
          <div class="status-item ${capabilities.pressure ? 'supported' : 'not-supported'}">
            <span class="icon">${capabilities.pressure ? '✅' : '❌'}</span>
            <span>压感输入支持</span>
            <small>${capabilities.pressure ? '支持压感输入' : '不支持压感输入'}</small>
          </div>
          <div class="status-item ${capabilities.midi ? 'supported' : 'not-supported'}">
            <span class="icon">${capabilities.midi ? '✅' : '❌'}</span>
            <span>MIDI 输出支持</span>
            <small>${capabilities.midi ? '支持 MIDI 输出' : '不支持 MIDI 输出'}</small>
          </div>
        </div>
        <div class="browser-info">
          <p><strong>当前浏览器:</strong> ${capabilities.browser.charAt(0).toUpperCase() + capabilities.browser.slice(1)}</p>
          <p><strong>建议:</strong> ${capabilities.recommendation}</p>
        </div>
        ${!capabilities.pressure || !capabilities.midi ? this.createSolutionButtons() : ''}
        <button class="close-btn" onclick="this.parentElement.parentElement.remove()">
          我知道了
        </button>
      </div>
      <style>
        .browser-guidance-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.8);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 10000;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .modal-content {
          background: white;
          color: #2c3e50;
          padding: 2rem;
          border-radius: 12px;
          max-width: 500px;
          text-align: center;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }

        @media (prefers-color-scheme: dark) {
          .modal-content {
            background: #2c2c2c;
            color: #e8e8e8;
            box-shadow: 0 10px 30px rgba(0,0,0,0.6);
          }
          .status-item {
            background: #3a3a3a !important;
          }
          .status-item.supported {
            background: #1a3a1a !important;
          }
          .status-item.not-supported {
            background: #3a1a1a !important;
          }
          .browser-info {
            background: #3a3a3a !important;
          }
          .solution-btn {
            background: #4a90e2;
          }
          .close-btn {
            background: #666;
            color: #e8e8e8;
          }
          .close-btn:hover {
            background: #777;
          }
        }

        .capability-status {
          display: flex;
          justify-content: space-around;
          margin: 1.5rem 0;
          gap: 1rem;
        }
        .status-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem;
          border-radius: 8px;
          background: #f8f9fa;
          min-width: 120px;
        }
        .status-item.supported {
          color: #27ae60;
          background: #e8f5e8;
        }
        .status-item.not-supported {
          color: #e74c3c;
          background: #fdeaea;
        }
        .status-item small {
          font-size: 0.75rem;
          opacity: 0.8;
        }
        .browser-info {
          margin: 1.5rem 0;
          text-align: left;
          background: #f8f9fa;
          padding: 1rem;
          border-radius: 8px;
        }
        .solution-buttons {
          display: flex;
          gap: 1rem;
          margin: 1rem 0;
          flex-wrap: wrap;
          justify-content: center;
        }
        .solution-btn, .close-btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }
        .solution-btn {
          background: #4a90e2;
          color: white;
          font-size: 0.9rem;
        }
        .solution-btn:hover {
          background: #357abd;
        }
        .close-btn {
          background: #bdc3c7;
          color: #2c3e50;
          margin-top: 1rem;
        }
        .close-btn:hover {
          background: #95a5a6;
        }
      </style>
    `
    return modal
  }

  private static createSolutionButtons(): string {
    const userAgent = navigator.userAgent.toLowerCase()
    const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent)
    const isChrome = /chrome/.test(userAgent)

    return `
      <div class="solution-buttons">
        ${
          !isChrome
            ? `
          <button class="solution-btn" onclick="window.open('https://www.google.com/chrome/', '_blank')">
            📥 下载 Chrome (MIDI)
          </button>`
            : ''
        }
        ${
          !isSafari
            ? `
          <button class="solution-btn" onclick="alert('请在 Safari 中打开此页面以获得压感支持\\n或启用桥接模式实现双浏览器协作')">
            🍃 使用 Safari (压感)
          </button>`
            : ''
        }
        <button class="solution-btn" onclick="window.open('${window.location.href}', '_blank')">
          🔗 新标签页打开
        </button>
        <button class="solution-btn" onclick="alert('桥接模式：在两个浏览器中同时打开此页面，\\n系统会自动同步压感和MIDI数据')">
          🌉 了解桥接模式
        </button>
      </div>
    `
  }
}
