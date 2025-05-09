<template>
  <div class="chat-area">
    <div class="chat-messages" ref="messagesContainerRef">
      <!-- 聊天消息流 - 将消息和对应的思考过程放在一起 -->
      <div v-for="(message, index) in messages" :key="index" class="message-group">
        <!-- 用户消息 -->
        <div v-if="message.role === 'user'" class="message user-message">
          <div class="message-avatar">
            <el-avatar :icon="UserFilled" />
          </div>
          <div class="message-content">
            <div class="message-text" v-html="formatMessage(message.content || '')"></div>
            <div class="message-time">{{ formatTime(message.timestamp) }}</div>
          </div>
        </div>
        
        <!-- AI消息 -->
        <div v-else class="message ai-message">
          <div class="message-avatar">
            <el-avatar :icon="Monitor" />
          </div>
          <div class="message-content">
            <div class="message-text" v-html="formatMessage(message.content || '')"></div>
            <div class="message-time">{{ formatTime(message.timestamp) }}</div>
          </div>
        </div>
        
        <!-- 如果是AI消息且有思考过程，显示思考区块 -->
        <div v-if="message.role === 'assistant' && message.thinking" 
          class="thinking-block"
        >
          <div class="thinking-header" @click="toggleThinking(index)">
            <el-icon :class="{ 'is-rotate': expandedThinking[index] }"><ArrowDown /></el-icon>
            <span class="thinking-status">已深度思考</span>
            <span class="thinking-time">(耗时 {{ index + 1 }}秒)</span>
          </div>
          <div v-show="expandedThinking[index]" class="thinking-content">
            <pre>{{ message.thinking }}</pre>
          </div>
        </div>
      </div>
      
      <!-- 加载中的消息 -->
      <div v-if="isLoading && !error" class="message-group">
        <!-- 正在生成的AI消息 -->
        <div class="message ai-message">
          <div class="message-avatar">
            <el-avatar :icon="Monitor" />
          </div>
          <div class="message-content">
            <!-- 流式消息状态 -->
            <div v-if="streaming && currentStreamingMessage" class="message-text">
              <div class="typewriter-text">
                <span v-html="formatMessage(currentStreamingMessage.content || '')"></span>
                <span class="cursor"></span>
              </div>
            </div>
            <div v-else class="message-text">
              <el-skeleton :rows="2" animated />
            </div>
          </div>
        </div>
        
        <!-- 实时思考过程展示 -->
        <div v-if="showThinking && thinkingContent" class="thinking-block thinking-block-active">
          <div class="thinking-header" @click="toggleGlobalThinking">
            <el-icon :class="{ 'is-rotate': showThinking }"><ArrowDown /></el-icon>
            <span class="thinking-status thinking-status-active">
              <span class="thinking-dot"></span>
              正在思考...
            </span>
          </div>
          <div v-show="showThinking" class="thinking-content">
            <div class="typewriter-text">
              <pre>{{ thinkingContent }}</pre>
              <span class="cursor"></span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 错误消息 -->
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </div>
    
    <div class="chat-input">
      <el-input
        v-model="userInput"
        type="textarea"
        :rows="3"
        placeholder="输入您的问题..."
        resize="none"
        @keydown.enter.ctrl.prevent="sendMessage"
      />
      <div class="input-actions">
        <el-tooltip content="启用/禁用思考过程" placement="top">
          <el-button 
            :type="enableThinking ? 'success' : 'default'" 
            :icon="Cpu" 
            circle
            @click="toggleEnableThinking"
            class="action-btn"
          />
        </el-tooltip>
        
        <el-tooltip content="清空对话" placement="top">
          <el-button 
            type="default" 
            :icon="Delete" 
            circle
            @click="confirmClearChat"
            class="action-btn"
          />
        </el-tooltip>
        
        <el-tooltip content="发送消息 (Ctrl+Enter)" placement="top">
          <el-button 
            type="primary" 
            :disabled="!userInput.trim() || isLoading" 
            @click="sendMessage"
            class="send-btn"
          >
            <el-icon><Position /></el-icon>
            发送
          </el-button>
        </el-tooltip>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed, nextTick, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowDown, UserFilled, Monitor, Position, Cpu, Delete } from '@element-plus/icons-vue';
import { useChatStore } from '@/store/modules/chatStore';
import { officeContextService } from '@/services/apiService';

export default {
  name: 'ChatArea',
  components: {
    ArrowDown,
    UserFilled,
    Monitor,
    Position,
    Cpu,
    Delete
  },
  emits: ['clear-messages'],
  setup(props, { emit }) {
    const messagesContainerRef = ref(null);
    const userInput = ref('');
    const enableThinking = ref(true);
    const expandedThinking = ref({});
    
    // 使用Pinia聊天状态
    const chatStore = useChatStore();
    const { 
      messages, 
      isLoading, 
      streaming, 
      thinkingContent, 
      showThinking,
      currentStreamingIndex,
      error 
    } = storeToRefs(chatStore);
    
    // 获取当前流式接收的消息
    const currentStreamingMessage = computed(() => {
      if (currentStreamingIndex.value >= 0 && currentStreamingIndex.value < messages.value.length) {
        return messages.value[currentStreamingIndex.value];
      }
      return null;
    });
    
    // 监听消息变化，自动滚动到底部
    watch(messages, () => {
      nextTick(() => {
        scrollToBottom();
      });
    });
    
    // 监听思考内容变化
    watch(thinkingContent, () => {
      if (thinkingContent.value) {
        nextTick(() => {
          scrollToBottom();
        });
      }
    });
    
    // 监听当前流式消息内容变化
    watch(() => currentStreamingMessage.value?.content, () => {
      nextTick(() => {
        scrollToBottom();
      });
    });
    
    // 监听错误变化
    watch(error, (newError) => {
      if (newError) {
        ElMessage.error(newError);
      }
    });

    onMounted(async () => {
      // 初始化聊天
      if (messages.value.length === 0) {
        chatStore.initChat();
      } else {
        // 如果已有消息，尝试加载聊天历史
        const loaded = chatStore.loadChatHistory();
        if (!loaded) {
          chatStore.initChat();
        }
      }
      
      // 为历史消息初始化思考过程显示状态
      messages.value.forEach((_, index) => {
        expandedThinking.value[index] = false;
      });
      
      // 尝试获取Office上下文
      try {
        await getOfficeContext();
      } catch (error) {
        console.error('获取Office上下文失败:', error);
      }
      
      // 初始滚动到底部
      nextTick(() => {
        scrollToBottom();
      });
      
      // 从本地存储加载思考过程设置
      const savedEnableThinking = localStorage.getItem('enableThinking');
      if (savedEnableThinking !== null) {
        enableThinking.value = savedEnableThinking === 'true';
      }
    });
    
    // 获取Office上下文
    const getOfficeContext = async () => {
      try {
        // 检测Office应用类型
        const hostType = officeContextService.getHostType();
        
        if (!hostType) {
          console.log('非Office环境');
          return;
        }
        
        let context = {
          hostType,
          timestamp: new Date().toISOString()
        };
        
        // 根据不同Office应用类型获取相应上下文
        if (officeContextService.isExcel()) {
          try {
            const selectionData = await officeContextService.getExcelSelectionData();
            context.excelSelection = selectionData;
          } catch (error) {
            console.warn('获取Excel选中数据失败:', error);
          }
        } else if (officeContextService.isWord()) {
          try {
            const documentContent = await officeContextService.getWordDocumentContent();
            // 文档可能很长，只取前500个字符作为上下文
            const previewContent = documentContent.length > 500 
              ? documentContent.substring(0, 500) + '...' 
              : documentContent;
            context.wordDocument = {
              preview: previewContent,
              length: documentContent.length
            };
          } catch (error) {
            console.warn('获取Word文档内容失败:', error);
          }
        }
        
        // 设置聊天上下文
        chatStore.setContext(context);
      } catch (error) {
        console.error('获取Office上下文失败:', error);
      }
    };
    
    // 发送消息
    const sendMessage = async () => {
      const message = userInput.value.trim();
      if (!message || isLoading.value) return;
      
      // 清空输入框
      userInput.value = '';
      
      // 发送流式消息给AI
      await chatStore.sendStreamMessage(message, enableThinking.value);
      
      // 保存聊天历史
      chatStore.saveChatHistory();
    };
    
    // 确认清空对话
    const confirmClearChat = () => {
      ElMessageBox.confirm(
        '确定要清空所有对话历史吗？此操作不可恢复。',
        '清空对话',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        clearMessages();
      }).catch(() => {
        // 用户取消操作
      });
    };
    
    // 清空消息
    const clearMessages = () => {
      chatStore.clearChat();
      // 清空思考过程显示状态映射
      expandedThinking.value = {};
      emit('clear-messages');
    };
    
    // 切换是否启用思考过程
    const toggleEnableThinking = () => {
      enableThinking.value = !enableThinking.value;
      // 保存到本地存储
      localStorage.setItem('enableThinking', enableThinking.value.toString());
      ElMessage.success(`思考过程已${enableThinking.value ? '启用' : '禁用'}`);
    };
    
    // 格式化消息内容（处理换行符等）
    const formatMessage = (text) => {
      if (!text) return '';
      return text.replace(/\n/g, '<br>');
    };
    
    // 格式化时间
    const formatTime = (timestamp) => {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
    
    // 滚动到底部
    const scrollToBottom = () => {
      if (messagesContainerRef.value) {
        messagesContainerRef.value.scrollTop = messagesContainerRef.value.scrollHeight;
      }
    };
    
    // 切换指定消息的思考过程显示状态
    const toggleThinking = (index) => {
      expandedThinking.value = {
        ...expandedThinking.value,
        [index]: !expandedThinking.value[index]
      };
    };
    
    // 切换全局思考过程显示状态
    const toggleGlobalThinking = () => {
      chatStore.toggleThinking();
    };

    return {
      userInput,
      messages,
      isLoading,
      streaming,
      thinkingContent,
      showThinking,
      enableThinking,
      expandedThinking,
      messagesContainerRef,
      currentStreamingMessage,
      sendMessage,
      clearMessages,
      confirmClearChat,
      formatMessage,
      formatTime,
      toggleThinking,
      toggleGlobalThinking,
      toggleEnableThinking,
      error,
      UserFilled,
      Monitor,
      Cpu,
      Delete,
      Position
    };
  }
};
</script>

<style>
.chat-area {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: white;
  border-radius: var(--md-radius-lg);
  box-shadow: var(--md-shadow-sm);
  overflow: hidden;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background-color: #f8fafc;
  scrollbar-width: thin;
}

.message-group {
  margin-bottom: 20px;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.message {
  display: flex;
  margin-bottom: 8px;
}

.message-avatar {
  margin-right: 12px;
  flex-shrink: 0;
}

.message-avatar .el-avatar {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.message-content {
  padding: 12px 16px;
  border-radius: var(--md-radius-lg);
  max-width: 85%;
  position: relative;
}

.user-message .message-content {
  background: linear-gradient(135deg, #0ea5e9, #0284c7);
  color: white;
  margin-left: auto;
  margin-right: 0;
  box-shadow: 0 2px 8px rgba(14, 165, 233, 0.2);
}

.ai-message .message-content {
  background-color: white;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.message-text {
  word-break: break-word;
  line-height: 1.6;
}

.message-time {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 6px;
  text-align: right;
}

.ai-message .message-time {
  color: #94a3b8;
}

.chat-input {
  padding: 16px;
  background-color: white;
  border-top: 1px solid #e2e8f0;
}

.input-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: 12px;
  gap: 8px;
}

.action-btn {
  transition: all 0.2s ease;
}

.action-btn:hover {
  transform: translateY(-1px);
}

.send-btn {
  min-width: 80px;
}

/* 打字机效果 */
.typewriter-text {
  display: inline-block;
  position: relative;
}

.cursor {
  display: inline-block;
  width: 2px;
  height: 1.2em;
  background-color: currentColor;
  margin-left: 2px;
  vertical-align: middle;
  animation: blink 0.7s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* 思考过程样式 - 独立区块但与消息关联 */
.thinking-block {
  background-color: #f8fafc;
  border-radius: var(--md-radius-md);
  margin: 0 0 0 48px; /* 左侧与头像对齐 */
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border-left: 3px solid #94a3b8;
  overflow: hidden;
  transition: all 0.2s ease;
}

.thinking-block-active {
  border-left-color: #10b981;
}

.thinking-header {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 10px 14px;
  background-color: #f1f5f9;
  transition: background-color 0.2s;
}

.thinking-header:hover {
  background-color: #e2e8f0;
}

.thinking-header .el-icon {
  margin-right: 8px;
  transition: transform 0.3s;
  color: #64748b;
}

.thinking-header .is-rotate {
  transform: rotate(180deg);
}

.thinking-status {
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
}

.thinking-status-active {
  color: #10b981;
  display: flex;
  align-items: center;
}

.thinking-dot {
  width: 8px;
  height: 8px;
  background-color: #10b981;
  border-radius: 50%;
  margin-right: 6px;
  animation: pulse 1.5s infinite;
}

.thinking-time {
  font-size: 12px;
  color: #94a3b8;
  margin-left: 8px;
}

.thinking-content {
  padding: 14px;
  background-color: white;
  border-top: 1px solid #e2e8f0;
  font-size: 13px;
  max-height: 300px;
  overflow-y: auto;
}

.thinking-content pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: 'Consolas', 'Monaco', monospace;
  line-height: 1.6;
  color: #475569;
}

@keyframes pulse {
  0% { transform: scale(0.8); opacity: 0.7; }
  50% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(0.8); opacity: 0.7; }
}

/* 错误消息样式 */
.error-message {
  color: #ef4444;
  margin: 12px 0;
  font-size: 14px;
  text-align: center;
  background-color: #fee2e2;
  padding: 12px 16px;
  border-radius: var(--md-radius-md);
  box-shadow: 0 2px 4px rgba(239, 68, 68, 0.1);
  animation: fadeIn 0.3s ease;
}
</style>
