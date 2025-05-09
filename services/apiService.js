import axios from "axios"

/**
 * AI模型服务类 - 用于与各种LLM API交互
 */
class AIModelService {
  constructor() {
    this.defaultHeaders = {
      "Content-Type": "application/json",
    }
    this.modelConfig = null
  }

  /**
   * 初始化模型配置
   * @param {Object} config - 模型配置信息
   */
  initializeModel(config) {
    this.modelConfig = config
    console.log("初始化AI模型:", config.name)
  }

  /**
   * 加载默认模型配置或从存储读取
   * @returns {Promise<boolean>} 是否成功加载配置
   */
  async loadModelConfig() {
    try {
      let modelConfigs = []
      let defaultModelId = null

      // 从存储加载配置
      if (window.Office && Office.context && Office.context.roamingSettings) {
        const configs = Office.context.roamingSettings.get("modelConfigs")
        const defaultId = Office.context.roamingSettings.get("defaultModelId")

        if (configs) modelConfigs = JSON.parse(configs)
        if (defaultId) defaultModelId = JSON.parse(defaultId)
      } else {
        const configs = localStorage.getItem("modelConfigs")
        const defaultId = localStorage.getItem("defaultModelId")

        if (configs) modelConfigs = JSON.parse(configs)
        if (defaultId) defaultModelId = JSON.parse(defaultId)
      }

      // 如果有默认模型
      if (modelConfigs.length > 0 && defaultModelId) {
        const defaultModel = modelConfigs.find((m) => m.id === defaultModelId)
        if (defaultModel) {
          this.initializeModel(defaultModel)
          return true
        }
      }

      // 如果没有找到默认模型但有模型配置
      if (modelConfigs.length > 0) {
        this.initializeModel(modelConfigs[0])
        return true
      }

      // 没有配置，使用默认值
      console.log("没有找到模型配置")
      return false
    } catch (error) {
      console.error("加载模型配置失败:", error)
      return false
    }
  }

  /**
   * 设置API请求头
   * @returns {Object} 请求头
   */
  getHeaders() {
    const headers = { ...this.defaultHeaders }

    if (this.modelConfig && this.modelConfig.apiKey) {
      const apiUrl = this.modelConfig.apiUrl
      // 根据不同API提供商设置认证头
      if (apiUrl.includes("openai.com")) {
        headers["Authorization"] = `Bearer ${this.modelConfig.apiKey}`
      } else if (apiUrl.includes("azure.com")) {
        headers["api-key"] = this.modelConfig.apiKey
      } else if (apiUrl.includes("deepseek.com") || apiUrl.includes("/api/deepseek")) {
        // 为DeepSeek API设置特殊头
        headers["Authorization"] = `Bearer ${this.modelConfig.apiKey}`
        // 添加CORS相关头
        headers["Origin"] = "https://localhost:3001"
        headers["Referer"] = "https://localhost:3001/"
        console.log("为DeepSeek设置特殊头:", headers)
      } else {
        // 默认使用Bearer方式
        headers["Authorization"] = `Bearer ${this.modelConfig.apiKey}`
      }
    }

    return headers
  }

  /**
   * 发送聊天请求到AI模型
   * @param {Array} messages - 聊天消息历史
   * @param {Object} options - 额外选项
   * @returns {Promise} 聊天响应
   */
  async sendChatRequest(messages, options = {}) {
    if (!this.modelConfig) {
      const loaded = await this.loadModelConfig()
      if (loaded !== true) {
        console.error("未能加载模型配置", loaded)
        throw new Error("模型未配置。请在设置中配置AI模型。")
      }
    }

    try {
      const defaultOptions = {
        temperature: this.modelConfig.temperature || 0.7,
        max_tokens: this.modelConfig.maxTokens || 2000,
      }

      const requestOptions = { ...defaultOptions, ...options }

      // 构建请求数据
      let requestData
      let apiUrl = this.modelConfig.apiUrl

      // 处理DeepSeek API的代理
      if (apiUrl.includes("api.deepseek.com")) {
        console.log("原始DeepSeek API URL:", apiUrl)

        // 确定API端点路径
        let endpoint = "/v1/chat/completions"
        if (apiUrl.includes("/v1/chat/completions")) {
          endpoint = "/v1/chat/completions"
        } else if (apiUrl.includes("/v1/completions")) {
          endpoint = "/v1/completions"
        }

        // 直接使用固定路径，而不是尝试解析URL
        apiUrl = `/api/deepseek${endpoint}`
        console.log("代理后DeepSeek API URL:", apiUrl)
      }

      // 根据不同API格式构建请求
      if (this.modelConfig.apiUrl.includes("openai.com")) {
        requestData = {
          model: this.modelConfig.model || "gpt-3.5-turbo",
          messages,
          temperature: requestOptions.temperature,
          max_tokens: requestOptions.max_tokens,
        }
      } else {
        // 通用格式
        requestData = {
          messages,
          temperature: requestOptions.temperature,
          max_tokens: requestOptions.max_tokens,
        }

        // 如果有指定模型
        if (this.modelConfig.model) {
          requestData.model = this.modelConfig.model
        } else if (this.modelConfig.name) {
          requestData.model = this.modelConfig.name
        }
      }

      console.log("发送请求到:", apiUrl)
      const response = await axios.post(apiUrl, requestData, {
        headers: this.getHeaders(),
        timeout: 60000, // 60秒超时
      })

      // 解析响应
      if (response.data) {
        // OpenAI格式响应
        if (response.data.choices && response.data.choices.length > 0) {
          return {
            text: response.data.choices[0].message?.content || response.data.choices[0].text,
            role: response.data.choices[0].message?.role || "assistant",
          }
        }

        // Claude/Anthropic格式响应
        if (response.data.content && response.data.role) {
          return {
            text: response.data.content,
            role: response.data.role,
          }
        }

        // 其他情况，尝试直接返回响应文本
        if (typeof response.data === "string") {
          return {
            text: response.data,
            role: "assistant",
          }
        }

        // 数据结构未识别
        console.warn("未能识别的API响应格式:", response.data)
        return {
          text: "无法解析模型响应",
          role: "assistant",
        }
      }

      throw new Error("API返回空响应")
    } catch (error) {
      console.error("AI聊天请求失败:", error)
      throw error
    }
  }

  /**
   * 发送特定任务请求
   * @param {String} task - 任务类型
   * @param {Object} data - 任务数据
   * @returns {Promise} 任务响应
   */
  async sendTaskRequest(task, data) {
    if (!this.modelConfig) {
      const loaded = await this.loadModelConfig()
      if (loaded !== true) {
        console.error("未能加载模型配置", loaded)
        throw new Error("模型未配置。请在设置中配置AI模型。")
      }
    }

    try {
      // 构建基于任务的提示语
      let messages = []

      switch (task) {
        case "analyze_excel":
          messages = [
            { role: "system", content: "你是一个专业的数据分析助手，精通Excel数据分析。请分析以下数据并提供洞见。" },
            { role: "user", content: `请分析以下Excel数据:\n${JSON.stringify(data.excelData)}` },
          ]
          break

        case "generate_formula":
          messages = [
            { role: "system", content: "你是一个Excel公式专家，能够根据需求生成最优的Excel公式。" },
            { role: "user", content: `请根据以下需求生成Excel公式:\n${data.requirement}` },
          ]
          break

        case "analyze_text":
          messages = [
            { role: "system", content: "你是一个文本分析专家，能够分析文档的可读性、情感和关键词。" },
            { role: "user", content: `请对以下文本进行${data.analysisType}分析:\n${data.text}` },
          ]
          break

        case "summarize_document":
          messages = [
            { role: "system", content: "你是一个文档摘要专家，能够提取文档的关键信息并生成准确的摘要。" },
            { role: "user", content: `请为以下文档生成摘要，长度为原文的${data.percentage}%:\n${data.text}` },
          ]
          break

        default:
          throw new Error(`未知任务类型: ${task}`)
      }

      // 使用chatCompletion端点处理任务
      const response = await this.sendChatRequest(messages)
      return response.text
    } catch (error) {
      console.error(`${task}任务请求失败:`, error)
      throw error
    }
  }

  /**
   * 测试API连接
   * @param {Object} config - 模型配置信息
   * @returns {Promise<Object>} 测试结果
   */
  async testConnection(config) {
    // 保存原始配置
    const originalConfig = this.modelConfig

    try {
      if (!config || !config.apiUrl) {
        return {
          success: false,
          message: "无效的配置: 缺少API地址",
        }
      }

      // 检查是否需要修改DeepSeek API URL为使用代理
      if (config.apiUrl.includes("api.deepseek.com")) {
        console.log("测试连接原始DeepSeek URL:", config.apiUrl)
        const proxyConfig = { ...config }

        // 确定API端点路径
        let endpoint = "/v1/chat/completions"
        if (config.apiUrl.includes("/v1/chat/completions")) {
          endpoint = "/v1/chat/completions"
        } else if (config.apiUrl.includes("/v1/completions")) {
          endpoint = "/v1/completions"
        }

        // 直接使用固定路径
        proxyConfig.apiUrl = `/api/deepseek${endpoint}`
        console.log("测试连接代理URL:", proxyConfig.apiUrl)
        this.initializeModel(proxyConfig)
      } else {
        // 使用原始配置
        this.initializeModel(config)
      }

      // 发送简单请求测试连接
      const messages = [{ role: "user", content: '请回复"连接测试成功"' }]

      const response = await this.sendChatRequest(messages, { max_tokens: 20 })

      return {
        success: true,
        message: "连接成功! API响应: " + response.text,
      }
    } catch (error) {
      console.error("测试连接失败:", error)
      return {
        success: false,
        message: `连接失败: ${error.message || "未知错误"}`,
      }
    } finally {
      // 恢复原始配置
      this.modelConfig = originalConfig
    }
  }

  /**
   * 发送流式聊天请求到AI模型
   * @param {Array} messages - 聊天消息历史
   * @param {Object} options - 额外选项
   * @param {Function} onChunk - 处理每个数据块的回调
   * @param {Function} onThinking - 处理思考过程的回调
   * @returns {Promise} 完成的聊天响应
   */
  async sendStreamChatRequest(messages, options = {}, onChunk = null, onThinking = null) {
    if (!this.modelConfig) {
      const loaded = await this.loadModelConfig()
      if (loaded !== true) {
        console.error("未能加载模型配置", loaded)
        throw new Error("模型未配置。请在设置中配置AI模型。")
      }
    }

    try {
      const defaultOptions = {
        temperature: this.modelConfig.temperature || 0.7,
        max_tokens: this.modelConfig.maxTokens || 2000,
        stream: true, // 启用流式输出
      }

      const requestOptions = { ...defaultOptions, ...options }

      // 构建请求数据
      let requestData
      let apiUrl = this.modelConfig.apiUrl

      // 处理DeepSeek API的代理
      if (apiUrl.includes("api.deepseek.com")) {
        console.log("流式请求 - 原始DeepSeek API URL:", apiUrl)

        // 确定API端点路径
        let endpoint = "/v1/chat/completions"
        if (apiUrl.includes("/v1/chat/completions")) {
          endpoint = "/v1/chat/completions"
        } else if (apiUrl.includes("/v1/completions")) {
          endpoint = "/v1/completions"
        }

        // 直接使用固定路径，而不是尝试解析URL
        apiUrl = `/api/deepseek${endpoint}`
        console.log("流式请求 - 代理后DeepSeek API URL:", apiUrl)
      }

      // 根据不同API格式构建请求
      if (this.modelConfig.apiUrl.includes("openai.com")) {
        requestData = {
          model: this.modelConfig.model || "gpt-3.5-turbo",
          messages,
          temperature: requestOptions.temperature,
          max_tokens: requestOptions.max_tokens,
          stream: true,
        }
      } else {
        // 通用格式
        requestData = {
          messages,
          temperature: requestOptions.temperature,
          max_tokens: requestOptions.max_tokens,
          stream: true,
        }

        // 如果有指定模型
        if (this.modelConfig.model) {
          requestData.model = this.modelConfig.model
        } else if (this.modelConfig.name) {
          requestData.model = this.modelConfig.name
        }
      }

      // 如果传入了思考过程回调，自动添加system消息要求输出思考过程
      if (onThinking) {
        // 在消息顶部添加要求输出思考过程的system消息
        const systemMessage = {
          role: "system",
          content: `请按照以下格式输出你的思考过程和回复内容（务必区分）：

1. 首先，输出你的详细思考过程，用<thinking>标签包裹:

<thinking>
我的思考过程：
- 首先，我理解这个问题是关于...
- 然后，我分析了以下几点...
- 最后，结合上下文，我得出了这样的结论...
</thinking>

2. 然后，输出你的实际回复内容（不需要标签，直接输出）：

你好！这是我的回复内容...

请务必先输出完整思考过程，再输出回复内容，并确保它们明确分离。`,
        }

        // 确保不修改原始消息数组
        const messagesWithThinking = [systemMessage, ...messages]
        requestData.messages = messagesWithThinking
      }

      console.log("发送流式请求到:", apiUrl)

      // 状态变量
      let fullText = ""
      let finalContent = ""
      const thinkingContent = ""
      let streamEnded = false // 跟踪流是否已结束

      // 处理思考过程的辅助变量
      let inThinkingBlock = false // 标记是否正在处理思考块
      let thinkingBuffer = "" // 思考内容缓冲区
      let responseBuffer = "" // 响应内容缓冲区

      // 使用fetch API进行流式请求
      try {
        console.log("使用fetch API进行流式请求...")

        const controller = new AbortController()
        const signal = controller.signal

        // 设置超时
        const timeoutId = setTimeout(() => {
          controller.abort()
          console.log("请求超时中止")
        }, 60000) // 60秒超时

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify(requestData),
          signal,
        })

        // 清除超时定时器
        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`HTTP错误! 状态: ${response.status}`)
        }

        if (!response.body) {
          throw new Error("响应没有可读取的流")
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder("utf-8")
        let buffer = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            console.log("流读取完成")
            streamEnded = true
            break
          }

          // 解码接收到的数据
          const chunk = decoder.decode(value, { stream: true })
          buffer += chunk

          // 处理完整的数据行
          const lines = buffer.split("\n")
          buffer = lines.pop() || "" // 保留最后一个可能不完整的行

          for (const line of lines) {
            const trimmedLine = line.trim()
            if (!trimmedLine || !trimmedLine.startsWith("data:")) continue

            const data = trimmedLine.slice(5).trim()

            // 空行或[DONE]表示流结束
            if (data === "" || data === "[DONE]") {
              streamEnded = true
              continue
            }

            try {
              const json = JSON.parse(data)
              const token = json.choices?.[0]?.delta?.content || ""

              if (token) {
                fullText += token

                // 检测思考过程开始标签
                if (fullText.includes("<thinking>") && !inThinkingBlock) {
                  inThinkingBlock = true
                  console.log("检测到思考过程开始标签")

                  // 获取标签之前的内容（如果有）加入响应内容
                  const parts = fullText.split("<thinking>")
                  if (parts[0]) {
                    responseBuffer += parts[0]
                    if (onChunk) {
                      onChunk(parts[0], responseBuffer)
                    }
                  }

                  // 重置全文以去除已处理部分
                  fullText = "<thinking>" + (parts[1] || "")
                  continue
                }

                // 检测思考过程结束标签
                if (inThinkingBlock && fullText.includes("</thinking>")) {
                  inThinkingBlock = false
                  console.log("检测到思考过程结束标签")

                  // 提取思考内容并回调
                  const parts = fullText.split("</thinking>")
                  const thinkingPart = parts[0].replace("<thinking>", "")
                  thinkingBuffer += thinkingPart

                  if (onThinking) {
                    onThinking(thinkingBuffer)
                  }

                  // 重置全文以仅包含标签后的内容
                  fullText = parts[1] || ""

                  // 将标签后的内容加入响应
                  if (fullText) {
                    responseBuffer += fullText
                    if (onChunk) {
                      onChunk(fullText, responseBuffer)
                    }
                  }
                  continue
                }

                // 在思考块内收集思考内容
                if (inThinkingBlock) {
                  // 仅累积思考内容，不发送到响应
                  continue
                }

                // 不在思考块内，正常累积响应内容
                responseBuffer += token
                finalContent = responseBuffer

                if (onChunk) {
                  onChunk(token, finalContent)
                }
              }
            } catch (jsonError) {
              console.warn("解析流式响应JSON失败:", jsonError)
            }
          }
        }

        // 最后一次回调，确保完整内容
        if (onChunk && finalContent) {
          onChunk(finalContent, finalContent)
        }

        // 确保思考过程完全收集
        if (inThinkingBlock && fullText.includes("<thinking>")) {
          const thinkingPart = fullText.replace("<thinking>", "")
          thinkingBuffer += thinkingPart

          if (onThinking) {
            onThinking(thinkingBuffer)
          }
        }
      } catch (fetchError) {
        console.error("流式请求fetch错误:", fetchError)
        if (fetchError.name === "AbortError") {
          throw new Error("请求超时")
        }
        throw fetchError
      }

      console.log("流式请求完成，得到结果:", finalContent.length, "字符")
      console.log("思考过程:", thinkingBuffer ? thinkingBuffer.length + "字符" : "无")

      // 延迟返回结果，确保UI更新
      await new Promise((resolve) => setTimeout(resolve, 100))

      return {
        text: finalContent,
        role: "assistant",
        thinking: thinkingBuffer,
      }
    } catch (error) {
      console.error("流式AI聊天请求失败:", error)
      throw error
    }
  }
}

// 导出单例
export const aiModelService = new AIModelService()

/**
 * Office上下文服务 - 处理Office特定的API请求
 */
class OfficeContextService {
  /**
   * 检测当前Office应用类型
   * @returns {String} Office应用类型
   */
  getHostType() {
    if (window.Office && Office.context) {
      return Office.context.host
    }
    return null
  }

  /**
   * 检查是否运行在Excel中
   */
  isExcel() {
    return this.getHostType() === Office.HostType.Excel
  }

  /**
   * 检查是否运行在Word中
   */
  isWord() {
    return this.getHostType() === Office.HostType.Word
  }

  /**
   * 获取当前Excel选中区域数据
   */
  async getExcelSelectionData() {
    if (!this.isExcel()) {
      throw new Error("非Excel环境")
    }

    try {
      return await Excel.run(async (context) => {
        const range = context.workbook.getSelectedRange()
        range.load(["values", "address"])

        await context.sync()

        return {
          address: range.address,
          values: range.values,
        }
      })
    } catch (error) {
      console.error("获取Excel选中区域数据失败:", error)
      throw error
    }
  }

  /**
   * 获取当前Word文档内容
   */
  async getWordDocumentContent() {
    if (!this.isWord()) {
      throw new Error("非Word环境")
    }

    try {
      return await Word.run(async (context) => {
        const body = context.document.body
        body.load("text")

        await context.sync()

        return body.text
      })
    } catch (error) {
      console.error("获取Word文档内容失败:", error)
      throw error
    }
  }
}

// 导出单例
export const officeContextService = new OfficeContextService()
