<template>
  <div class="chat-container">
    <div class="chat-settings">
      <el-button size="small" @click="showSettings = true">
        <el-icon><Setting /></el-icon>
        聊天设置
      </el-button>
    </div>
    
    <div class="chat-messages" ref="messagesContainer">
      <chat-message 
        v-for="(msg, index) in visibleMessages" 
        :key="index" 
        :message="msg" 
        @typing-complete="onMessageTypingComplete(index)"
      />
      
      <!-- 加载中的消息 -->
      <chat-message 
        v-if="isWaitingForResponse" 
        :message="loadingMessage" 
        :isLoading="true" 
      />
    </div>
    
    <div class="chat-input">
      <el-input
        v-model="userInput"
        type="textarea"
        :rows="2"
        placeholder="输入您的问题..."
        resize="none"
        @keydown.enter.prevent="sendMessage"
      />
      <el-button 
        type="primary" 
        :icon="Send" 
        circle 
        @click="sendMessage"
        :disabled="isInputDisabled"
      />
    </div>
    
    <!-- 设置对话框 -->
    <el-dialog
      v-model="showSettings"
      title="聊天设置"
      width="400px"
    >
      <el-form label-position="top">
        <el-form-item label="打字机效果">
          <el-switch v-model="chatConfig.useTypewriter" />
        </el-form-item>
        
        <el-form-item label="打字速度" v-if="chatConfig.useTypewriter">
          <el-slider 
            v-model="chatConfig.typewriterSpeed" 
            :min="20" 
            :max="150" 
            :step="10"
            :format-tooltip="value => `${value}ms`"
          />
          <div class="speed-description">
            <span>快速</span>
            <span>慢速</span>
          </div>
        </el-form-item>
        
        <el-form-item label="打字声音">
          <el-switch v-model="chatConfig.enableSound" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showSettings = false">取消</el-button>
          <el-button type="primary" @click="saveSettings">
            保存
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed, nextTick, onMounted, provide } from 'vue';
import { Send, Setting } from '@element-plus/icons-vue';
import ChatMessage from './ChatMessage.vue';

export default {
  name: 'ChatContainer',
  components: {
    ChatMessage
  },
  setup() {
    const messages = ref([
      {
        role: 'assistant',
        content: '您好！我是您的AI助手，有什么可以帮您的吗？',
        timestamp: Date.now()
      }
    ]);
    
    const visibleMessages = ref([...messages.value]);
    const userInput = ref('');
    const isWaitingForResponse = ref(false);
    const messagesContainer = ref(null);
    const showSettings = ref(false);
    const isTyping = ref(false);
    
    // 聊天设置
    const chatConfig = ref({
      useTypewriter: true,
      typewriterSpeed: 50, // 增加默认值，使打字更慢
      enableSound: false
    });
    
    // 提供聊天配置给子组件
    provide('chatConfig', chatConfig.value);
    
    const loadingMessage = computed(() => ({
      role: 'assistant',
      content: '',
      timestamp: Date.now()
    }));
    
    const isInputDisabled = computed(() => {
      return isWaitingForResponse.value || isTyping.value || !userInput.value.trim();
    });
    
    const scrollToBottom = () => {
      nextTick(() => {
        if (messagesContainer.value) {
          messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
        }
      });
    };
    
    const onMessageTypingComplete = (index) => {
      isTyping.value = false;
    };
    
    const sendMessage = async () => {
      if (isInputDisabled.value) return;
      
      // 添加用户消息
      const userMessage = {
        role: 'user',
        content: userInput.value,
        timestamp: Date.now()
      };
      
      messages.value.push(userMessage);
      visibleMessages.value.push(userMessage);
      
      // 清空输入框
      const userQuestion = userInput.value;
      userInput.value = '';
      
      // 滚动到底部
      scrollToBottom();
      
      // 设置等待状态
      isWaitingForResponse.value = true;
      
      try {
        // 这里是模拟API调用，实际项目中应替换为真实的API调用
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 添加AI回复
        const aiResponse = {
          role: 'assistant',
          content: `您的问题是: "${userQuestion}"。这是一个模拟回复，实际项目中应替换为真实的API响应。我会添加一些额外的文本以便您可以看到打字机效果。

这是第二段落，用来演示多行文本。打字机效果可以让AI回复看起来更自然，就像真人在实时输入一样。

最后，这是一个简单的代码示例：
\`\`\`javascript
function sayHello() {
  console.log("Hello, world!");
}
\`\`\``,
          timestamp: Date.now()
        };
        
        // 将AI回复添加到消息列表
        messages.value.push(aiResponse);
        visibleMessages.value.push(aiResponse);
        
        // 如果启用了打字机效果，设置打字状态
        if (chatConfig.value.useTypewriter) {
          isTyping.value = true;
        }
      } catch (error) {
        console.error('获取回复失败:', error);
        // 添加错误消息
        const errorMessage = {
          role: 'assistant',
          content: '抱歉，我遇到了一些问题，无法回答您的问题。请稍后再试。',
          timestamp: Date.now()
        };
        
        messages.value.push(errorMessage);
        visibleMessages.value.push(errorMessage);
      } finally {
        // 取消等待状态
        isWaitingForResponse.value = false;
        
        // 滚动到底部
        scrollToBottom();
      }
    };
    
    const saveSettings = () => {
      // 保存设置
      localStorage.setItem('chatConfig', JSON.stringify(chatConfig.value));
      showSettings.value = false;
    };
    
    // 加载保存的设置
    const loadSavedSettings = () => {
      try {
        const savedConfig = localStorage.getItem('chatConfig');
        if (savedConfig) {
          chatConfig.value = { ...chatConfig.value, ...JSON.parse(savedConfig) };
        }
      } catch (error) {
        console.error('加载设置失败:', error);
      }
    };
    
    onMounted(() => {
      loadSavedSettings();
      scrollToBottom();
    });
    
    return {
      messages,
      visibleMessages,
      userInput,
      isWaitingForResponse,
      loadingMessage,
      messagesContainer,
      sendMessage,
      isInputDisabled,
      showSettings,
      chatConfig,
      saveSettings,
      onMessageTypingComplete,
      Send,
      Setting
    };
  }
};
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--el-bg-color, #ffffff);
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

.chat-settings {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  padding-top: 40px;
}

.chat-input {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  padding: 16px;
  border-top: 1px solid var(--el-border-color-lighter, #ebeef5);
  background-color: var(--el-bg-color, #ffffff);
}

.chat-input .el-textarea {
  flex: 1;
}

.chat-input .el-button {
  margin-bottom: 4px;
}

.speed-description {
  display: flex;
  justify-content: space-between;
  margin-top: 5px;
  color: var(--el-text-color-secondary, #909399);
  font-size: 12px;
}
</style>
