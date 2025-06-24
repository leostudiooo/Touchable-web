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
    if (!pressureSupported && !midiSupported) {
      recommendation = '建议使用 Chrome (MIDI) + Safari (压感) 双浏览器方案'
    } else if (!pressureSupported) {
      recommendation = '缺少压感支持，建议在 Safari 中打开此页面获得完整体验'
    } else if (!midiSupported) {
      recommendation = '缺少 MIDI 支持，建议在 Chrome 中打开此页面连接 MIDI 设备'
    } else {
      recommendation = '✅ 完全支持！'
    }

    return {
      pressure: pressureSupported,
      midi: midiSupported,
      browser,
      recommendation,
    }
  }

  private static async checkPressureSupport(): Promise<boolean> {
    // 检查是否支持触摸事件和压感
    if (!('ontouchstart' in window)) return false

    return new Promise((resolve) => {
      let hasForce = false

      const testHandler = (event: TouchEvent) => {
        if (event.touches.length > 0 && event.touches[0].force !== undefined) {
          hasForce = true
        }
        document.removeEventListener('touchstart', testHandler)
        resolve(hasForce)
      }

      document.addEventListener('touchstart', testHandler, { passive: true })

      // 如果3秒内没有触摸，返回 false
      setTimeout(() => {
        document.removeEventListener('touchstart', testHandler)
        resolve(false)
      }, 3000)
    })
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
          </div>
          <div class="status-item ${capabilities.midi ? 'supported' : 'not-supported'}">
            <span class="icon">${capabilities.midi ? '✅' : '❌'}</span>
            <span>MIDI 输出支持</span>
          </div>
        </div>
        <div class="browser-info">
          <p><strong>当前浏览器:</strong> ${capabilities.browser}</p>
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
        }
        .modal-content {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          max-width: 500px;
          text-align: center;
        }
        .capability-status {
          display: flex;
          justify-content: space-around;
          margin: 1.5rem 0;
        }
        .status-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }
        .status-item.supported { color: #27ae60; }
        .status-item.not-supported { color: #e74c3c; }
        .browser-info {
          margin: 1.5rem 0;
          text-align: left;
        }
        .solution-buttons {
          display: flex;
          gap: 1rem;
          margin: 1rem 0;
        }
        .solution-btn, .close-btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
        }
        .solution-btn {
          background: #4a90e2;
          color: white;
        }
        .close-btn {
          background: #bdc3c7;
          color: #2c3e50;
        }
      </style>
    `
    return modal
  }

  private static createSolutionButtons(): string {
    return `
      <div class="solution-buttons">
        <button class="solution-btn" onclick="window.open('https://www.google.com/chrome/', '_blank')">
          下载 Chrome
        </button>
        <button class="solution-btn" onclick="alert('请在 Safari 中打开此页面以获得压感支持')">
          使用 Safari
        </button>
        <button class="solution-btn" onclick="window.open('${window.location.href}', '_blank')">
          在新标签页打开
        </button>
      </div>
    `
  }
}
