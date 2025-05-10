<template>
  <div class="chat-message" :class="{ 'user-message': isUser, 'ai-message': !isUser }">
    <div class="message-avatar">
      <el-avatar :size="40" :src="avatarSrc" :icon="avatarIcon" />
    </div>
    <div class="message-content">
      <div class="message-header">
        <span class="message-sender">{{ sender }}</span>
        <span class="message-time">{{ formattedTime }}</span>
      </div>
      <div class="message-body">
        <!-- 加载动画 -->
        <animated-loading v-if="isLoading" />
        
        <!-- 打字机效果文本 -->
        <typewriter-text 
          v-else-if="!isUser && useTypewriter" 
          :text="message.content" 
          :speed="typewriterSpeed" 
          :html="renderHTML"
          :delay="300"
          @typing-complete="onTypingComplete"
          class="typing-animation"
        />
        
        <!-- 普通文本 -->
        <div v-else class="message-text" v-html="formattedContent"></div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref, inject } from 'vue';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import AnimatedLoading from './AnimatedLoading.vue';
import TypewriterText from './TypewriterText.vue';

export default {
  name: 'ChatMessage',
  components: {
    AnimatedLoading,
    TypewriterText
  },
  props: {
    message: {
      type: Object,
      required: true
    },
    isLoading: {
      type: Boolean,
      default: false
    }
  },
  setup(props, { emit }) {
    // 尝试注入全局配置，如果没有则使用默认值
    const globalConfig = inject('chatConfig', {
      useTypewriter: true,
      typewriterSpeed: 70,
      renderHTML: true
    });
    
    const isUser = computed(() => props.message.role === 'user');
    const sender = computed(() => isUser.value ? '您' : 'AI助手');
    const isTypingComplete = ref(true);
    
    const useTypewriter = computed(() => {
      return !isUser.value && globalConfig.useTypewriter;
    });
    
    const typewriterSpeed = computed(() => {
      // 根据消息长度动态调整速度，并保持较慢的基础速度
      const baseSpeed = globalConfig.typewriterSpeed;
      const contentLength = props.message.content?.length || 0;
      
      // 更平滑的速度调整，确保短消息也有明显的打字效果
      if (contentLength > 1000) return Math.max(60, baseSpeed * 0.9);
      if (contentLength > 500) return Math.max(70, baseSpeed * 0.95);
      // 短消息使用完整速度，确保打字效果明显
      return Math.max(80, baseSpeed);
    });
    
    const avatarSrc = computed(() => {
      return isUser.value 
        ? '/images/user-avatar.png' 
        : '/images/ai-avatar.png';
    });
    
    const avatarIcon = computed(() => {
      return isUser.value ? 'UserFilled' : 'Service';
    });
    
    const formattedTime = computed(() => {
      const date = new Date(props.message.timestamp || Date.now());
      return formatDistanceToNow(date, { addSuffix: true, locale: zhCN });
    });
    
    const formattedContent = computed(() => {
      // 简单地对内容进行格式化，例如处理换行符
      return props.message.content?.replace(/\n/g, '<br>') || '';
    });
    
    const onTypingComplete = () => {
      isTypingComplete.value = true;
      emit('typing-complete');
    };
    
    return {
      isUser,
      sender,
      avatarSrc,
      avatarIcon,
      formattedTime,
      formattedContent,
      useTypewriter,
      typewriterSpeed,
      renderHTML: globalConfig.renderHTML,
      onTypingComplete
    };
  }
};
</script>

<style scoped>
.chat-message {
  display: flex;
  margin-bottom: 20px;
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.message-avatar {
  margin-right: 12px;
  flex-shrink: 0;
}

.message-content {
  flex: 1;
  min-width: 0;
}

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.message-sender {
  font-weight: 500;
  font-size: 14px;
}

.message-time {
  font-size: 12px;
  color: var(--el-text-color-secondary, #909399);
}

.message-body {
  background-color: var(--el-fill-color-lighter, #f5f7fa);
  border-radius: 8px;
  padding: 12px;
  position: relative;
}

.user-message .message-body {
  background-color: var(--el-color-primary-light-9, #ecf5ff);
}

.message-text {
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

/* 代码块样式 */
:deep(.message-text pre),
:deep(.typewriter-text pre) {
  background-color: var(--el-fill-color-darker, #e6e8eb);
  border-radius: 4px;
  padding: 12px;
  overflow-x: auto;
  margin: 8px 0;
}

:deep(.message-text code),
:deep(.typewriter-text code) {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 14px;
}

:deep(a) {
  color: var(--el-color-primary);
  text-decoration: none;
}

:deep(a:hover) {
  text-decoration: underline;
}

/* 打字机动画效果 */
.typing-animation {
  position: relative;
  opacity: 1;
  transition: opacity 0.3s ease-in-out;
}

.typing-animation::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.05);
  animation: typingBg 0.8s ease-in-out forwards;
}

@keyframes typingBg {
  0% { opacity: 0.8; }
  100% { opacity: 0; }
}
</style>
