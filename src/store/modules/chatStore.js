import { defineStore } from "pinia"
import { aiModelService } from "@/services/apiService"

/**
 * 聊天状态管理
 */
export const useChatStore = defineStore("chat", {
  state: () => ({
    messages: [], // 聊天消息历史
    isLoading: false, // 是否正在加载
    error: null, // 错误信息
    chatContext: null, // 当前聊天上下文（如Excel数据、Word文本等）
    streaming: false, // 是否正在流式接收消息
    currentStreamingIndex: -1, // 当前流式接收的消息索引
    thinkingContent: "", // 思考过程内容
    showThinking: false, // 是否显示思考过程
    lastChunkTime: 0, // 最后一次接收数据块的时间
  }),

  getters: {
    /**
     * 获取聊天历史记录
     */
    chatHistory(state) {
      return state.messages
    },

    /**
     * 获取最后一条消息
     */
    lastMessage(state) {
      return state.messages.length > 0 ? state.messages[state.messages.length - 1] : null
    },

    /**
     * 获取聊天上下文
     */
    context(state) {
      return state.chatContext
    },

    /**
     * 获取当前正在流式接收的消息
     */
    currentStreamingMessage(state) {
      return state.currentStreamingIndex >= 0 ? state.messages[state.currentStreamingIndex] : null
    },
  },

  actions: {
    /**
     * 初始化聊天
     */
    initChat() {
      this.messages = [
        {
          role: "assistant",
          content: "您好，我是Office AI助手。请问有什么可以帮助您的？",
          timestamp: new Date(),
        },
      ]
      this.isLoading = false
      this.streaming = false
      this.currentStreamingIndex = -1
      this.thinkingContent = ""
      this.showThinking = false
      this.error = null
      this.lastChunkTime = 0
    },

    /**
     * 设置聊天上下文
     * @param {Object} context - 聊天上下文内容
     */
    setContext(context) {
      this.chatContext = context
    },

    /**
     * 添加用户消息
     * @param {String} content - 用户消息内容
     */
    addUserMessage(content) {
      this.messages.push({
        role: "user",
        content,
        timestamp: new Date(),
      })
    },

    /**
     * 添加助手消息
     * @param {String} content - 助手消息内容
     * @param {Object} options - 附加选项
     */
    addAssistantMessage(content, options = {}) {
      this.messages.push({
        role: "assistant",
        content,
        thinking: options.thinking || null,
        timestamp: new Date(),
      })

      return this.messages.length - 1 // 返回新消息的索引
    },

    /**
     * 更新流式接收的消息内容
     * @param {String} content - 新的消息内容
     */
    updateStreamingMessage(content) {
      if (this.currentStreamingIndex >= 0 && this.currentStreamingIndex < this.messages.length) {
        // 记录当前时间，用于控制打字机效果的速度
        this.lastChunkTime = Date.now()
        this.messages[this.currentStreamingIndex].content = content
      }
    },

    /**
     * 更新思考过程内容
     * @param {String} thinking - 思考过程内容
     */
    updateThinkingContent(thinking) {
      // 记录当前时间，用于控制打字机效果的速度
      this.lastChunkTime = Date.now()
      this.thinkingContent = thinking

      if (thinking && thinking.trim() !== "") {
        this.showThinking = true
      }
    },

    /**
     * 切换显示/隐藏思考过程
     * @param {Boolean} value - 是否显示
     */
    toggleThinking(value) {
      if (value !== undefined) {
        this.showThinking = value
      } else {
        this.showThinking = !this.showThinking
      }
    },

    /**
     * 发送消息给AI（流式响应）
     * @param {String} userInput - 用户输入内容
     * @param {Boolean} enableThinking - 是否启用思考过程
     * @param {Number} retryCount - 重试次数
     */
    async sendStreamMessage(userInput, enableThinking = true, retryCount = 0) {
      if (!userInput || userInput.trim() === "") {
        return
      }

      try {
        // 如果是首次尝试（非重试），则添加用户消息
        if (retryCount === 0) {
          this.addUserMessage(userInput)
        }

        // 设置状态
        this.isLoading = true
        this.streaming = true
        this.thinkingContent = ""
        this.showThinking = enableThinking // 确保根据启用状态设置思考过程显示
        this.error = null
        this.lastChunkTime = Date.now() // 初始化最后一次接收数据块的时间

        // 跟踪预创建的响应消息索引
        let messageIndex = this.currentStreamingIndex

        // 当开始新请求时，创建一个空的助手消息用于流式更新
        if (retryCount === 0 || messageIndex < 0) {
          // 先清除任何可能存在的预创建消息
          if (this.currentStreamingIndex >= 0) {
            const lastMsg = this.messages[this.currentStreamingIndex]
            if (lastMsg && (!lastMsg.content || lastMsg.content.trim() === "")) {
              // 删除空消息以避免重复
              this.messages.splice(this.currentStreamingIndex, 1)
            }
          }

          // 添加新的消息
          messageIndex = this.addAssistantMessage("", { thinking: enableThinking ? "" : null })
          this.currentStreamingIndex = messageIndex
        }

        // 构建消息历史（排除最后一个空的助手消息）
        const lastMessageIndex = this.messages.length - 1
        const chatMessages = this.messages.slice(0, lastMessageIndex).map((msg) => ({
          role: msg.role,
          content: msg.content,
        }))

        // 如果有上下文，添加上下文信息
        if (this.chatContext) {
          // 添加上下文系统消息
          chatMessages.unshift({
            role: "system",
            content: `当前上下文信息: ${JSON.stringify(this.chatContext)}`,
          })
        }

        // 处理接收到的数据块
        const handleChunk = (chunk, fullContent) => {
          // 控制打字机效果的速度
          const now = Date.now()
          const timeSinceLastChunk = now - this.lastChunkTime

          // 如果距离上次更新时间太短，可以添加一个小延迟
          // 这样可以让打字机效果更加明显
          if (timeSinceLastChunk < 20) {
            setTimeout(() => {
              this.updateStreamingMessage(fullContent)
            }, 20 - timeSinceLastChunk)
          } else {
            this.updateStreamingMessage(fullContent)
          }
        }

        // 处理思考过程
        const handleThinking = enableThinking
          ? (thinking) => {
              // 控制打字机效果的速度
              const now = Date.now()
              const timeSinceLastChunk = now - this.lastChunkTime

              if (timeSinceLastChunk < 20) {
                setTimeout(() => {
                  this.updateThinkingContent(thinking)
                  this.toggleThinking(true) // 自动显示思考过程
                }, 20 - timeSinceLastChunk)
              } else {
                this.updateThinkingContent(thinking)
                this.toggleThinking(true) // 自动显示思考过程
              }
            }
          : null

        // 发送流式请求
        const response = await aiModelService.sendStreamChatRequest(chatMessages, {}, handleChunk, handleThinking)

        // 确保最终内容已更新
        if (response.text) {
          this.updateStreamingMessage(response.text)
        }

        // 更新思考过程
        if (response.thinking) {
          this.messages[this.currentStreamingIndex].thinking = response.thinking
        }

        // 请求成功完成
        console.log("流式请求成功完成")

        return response
      } catch (error) {
        console.error("流式消息请求失败:", error)

        // 尝试重试（最多重试2次）
        if (retryCount < 2) {
          console.log(`尝试第${retryCount + 1}次重试...`)

          // 短暂延迟后重试
          setTimeout(() => {
            this.sendStreamMessage(userInput, enableThinking, retryCount + 1)
          }, 1000)

          return
        }

        // 处理错误
        this.error = error.message || "发送消息失败"
        console.error("设置错误状态:", this.error)

        // 更新当前消息为错误信息
        if (this.currentStreamingIndex >= 0) {
          this.updateStreamingMessage(`抱歉，发生了错误: ${this.error}`)
        } else {
          // 如果没有流式消息索引，添加新错误消息
          this.addAssistantMessage(`抱歉，发生了错误: ${this.error}`)
        }
      } finally {
        // 如果不是重试过程中，或者是最后一次重试，才清除状态
        if (retryCount >= 2 || !this.error) {
          setTimeout(() => {
            // 延迟清除状态，确保UI有时间更新
            this.isLoading = false
            this.streaming = false
            this.currentStreamingIndex = -1
            console.log("清除流式状态")
          }, 500)
        }
      }
    },

    /**
     * 清空聊天历史
     */
    clearChat() {
      this.initChat()
    },

    /**
     * 保存聊天历史
     */
    saveChatHistory() {
      try {
        // 保存最近的50条消息
        const historyToSave = this.messages.slice(-50)
        localStorage.setItem("chatHistory", JSON.stringify(historyToSave))
        return true
      } catch (error) {
        console.error("保存聊天历史失败:", error)
        return false
      }
    },

    /**
     * 加载聊天历史
     */
    loadChatHistory() {
      try {
        const savedHistory = localStorage.getItem("chatHistory")
        if (savedHistory) {
          this.messages = JSON.parse(savedHistory)
          return true
        }
        return false
      } catch (error) {
        console.error("加载聊天历史失败:", error)
        return false
      }
    },
  },
})
