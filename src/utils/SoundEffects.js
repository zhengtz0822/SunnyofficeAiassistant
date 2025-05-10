// 单例模式实现的打字声音效果
class TypewriterSound {
  constructor() {
    this.audioContext = null
    this.lastPlayTime = 0
    this.minTimeBetweenSounds = 50 // 声音之间的最小间隔（毫秒）
    this.enabled = false
    this.soundVariations = 3 // 声音变化数量
  }

  initialize() {
    if (!this.audioContext && window.AudioContext) {
      try {
        this.audioContext = new AudioContext()
      } catch (e) {
        console.error("无法创建AudioContext:", e)
      }
    }
  }

  enable() {
    this.enabled = true
    this.initialize()
  }

  disable() {
    this.enabled = false
  }

  playKeySound() {
    if (!this.enabled || !this.audioContext) return

    const now = Date.now()
    // 限制声音播放频率
    if (now - this.lastPlayTime < this.minTimeBetweenSounds) return
    this.lastPlayTime = now

    try {
      // 创建振荡器
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()

      // 随机选择一个声音变体
      const variation = Math.floor(Math.random() * this.soundVariations)
      const baseFrequency = 800 + variation * 200

      // 设置振荡器参数
      oscillator.type = "sine"
      oscillator.frequency.setValueAtTime(baseFrequency, this.audioContext.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(baseFrequency - 200, this.audioContext.currentTime + 0.1)

      // 设置增益（音量）
      gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1)

      // 连接节点
      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      // 播放声音
      oscillator.start()
      oscillator.stop(this.audioContext.currentTime + 0.1)
    } catch (e) {
      console.error("播放按键声音时出错:", e)
    }
  }
}

// 导出单例
export const typewriterSound = new TypewriterSound()

// 添加到全局，便于调试
window.typewriterSound = typewriterSound
