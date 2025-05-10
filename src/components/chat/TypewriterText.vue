<template>
  <div class="typewriter-container">
    <div class="typewriter-text" ref="textContainer"></div>
    <div v-if="isTyping" class="typing-cursor"></div>
  </div>
</template>

<script>
import { ref, onMounted, watch, onBeforeUnmount, inject } from 'vue';
import { typewriterSound } from '@/utils/SoundEffects';

export default {
  name: 'TypewriterText',
  props: {
    text: {
      type: String,
      required: true
    },
    speed: {
      type: Number,
      default: 50 // 每个字符的打字速度（毫秒），值越大越慢
    },
    delay: {
      type: Number,
      default: 0 // 开始打字前的延迟
    },
    html: {
      type: Boolean,
      default: false // 是否解析HTML
    }
  },
  emits: ['typing-complete'],
  setup(props, { emit }) {
    const textContainer = ref(null);
    const isTyping = ref(false);
    let typingTimeout = null;
    let currentIndex = 0;
    let fullText = '';
    
    // 尝试注入全局配置
    const globalConfig = inject('chatConfig', {
      enableSound: false
    });
    
    // 处理代码块的特殊情况
    const processSpecialContent = (text) => {
      // 如果启用了HTML，可以处理代码块等特殊内容
      if (props.html) {
        // 这里可以添加更复杂的处理逻辑
        return text;
      }
      return text;
    };
    
    const typeText = () => {
      if (!textContainer.value) return;
      
      if (currentIndex === 0) {
        isTyping.value = true;
        fullText = processSpecialContent(props.text);
        
        // 清除之前的内容
        if (props.html) {
          textContainer.value.innerHTML = '';
        } else {
          textContainer.value.textContent = '';
        }
      }
      
      if (currentIndex < fullText.length) {
        // 播放按键声音
        if (globalConfig.enableSound) {
          const currentChar = fullText[currentIndex];
          // 只在非空白字符时播放声音
          if (!/\s/.test(currentChar)) {
            typewriterSound.playKeySound();
          }
        }
        
        // 逐字添加并强制DOM更新
        const newText = fullText.substring(0, currentIndex + 1);
        
        // 移除之前可能添加的高亮字符
        const highlightChars = textContainer.value.querySelectorAll('.highlight-char');
        highlightChars.forEach(el => {
          el.classList.remove('highlight-char');
        });
        
        if (props.html) {
          // 使用不同的方式更新HTML以确保渲染更新
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = newText;
          textContainer.value.innerHTML = tempDiv.innerHTML;
          
          // 强制重排以确保视觉上的变化
          void textContainer.value.offsetHeight;
        } else {
          textContainer.value.textContent = newText;
          // 强制重排
          void textContainer.value.offsetHeight;
        }
        
        // 尝试给最后一个字符添加高亮效果（仅在非HTML模式下有效）
        if (!props.html && textContainer.value.textContent.length > 0) {
          const textNode = textContainer.value.firstChild;
          if (textNode && textNode.nodeType === Node.TEXT_NODE) {
            const text = textNode.nodeValue;
            const lastChar = text.charAt(text.length - 1);
            
            // 将文本节点分割，用span包裹最后一个字符
            if (text.length > 1) {
              textContainer.value.innerHTML = '';
              
              // 添加前面的文本
              const beforeText = document.createTextNode(text.substring(0, text.length - 1));
              textContainer.value.appendChild(beforeText);
              
              // 添加高亮的最后一个字符
              const span = document.createElement('span');
              span.className = 'highlight-char';
              span.textContent = lastChar;
              textContainer.value.appendChild(span);
              
              // 300ms后移除高亮效果
              setTimeout(() => {
                span.classList.remove('highlight-char');
              }, 300);
            }
          }
        }
        
        currentIndex++;
        
        // 根据字符类型动态调整下一个字符的延迟
        let nextDelay = props.speed;
        const nextChar = currentIndex < fullText.length ? fullText[currentIndex] : '';
        
        // 增加基础延迟以确保每个字符可见
        const baseDelay = props.speed * 1.2; // 增加基础延迟
        
        if (nextChar === '.' || nextChar === '!' || nextChar === '?' || nextChar === '。' || nextChar === '！' || nextChar === '？') {
          // 句子结束符号后添加更长延迟
          nextDelay = baseDelay * 6;
        } else if (nextChar === ',' || nextChar === ';' || nextChar === ':' || nextChar === '，' || nextChar === '；' || nextChar === '：') {
          // 句内停顿符号后添加额外延迟
          nextDelay = baseDelay * 4;
        } else if (nextChar === '\n') {
          // 换行符后添加额外延迟
          nextDelay = baseDelay * 3;
        } else {
          // 为普通字符添加微小的随机变化，使打字看起来更自然
          // 增加随机范围，使字符间的延迟差异更明显
          nextDelay = baseDelay + Math.floor(Math.random() * (baseDelay * 0.8));
        }
        
        // 使用setTimeout递归调用
        typingTimeout = setTimeout(typeText, nextDelay);
      } else {
        // 打字完成
        isTyping.value = false;
        emit('typing-complete');
      }
    };
    
    // 当文本变化时重新开始打字
    watch(() => props.text, () => {
      // 清除旧的打字任务
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      
      // 重置索引
      currentIndex = 0;
      
      // 如果有文本则开始打字
      if (props.text) {
        // 延迟后开始打字
        setTimeout(() => {
          typeText();
        }, props.delay);
      } else {
        isTyping.value = false;
        if (textContainer.value) {
          if (props.html) {
            textContainer.value.innerHTML = '';
          } else {
            textContainer.value.textContent = '';
          }
        }
      }
    }, { immediate: true });
    
    // 初始化声音系统
    onMounted(() => {
      if (globalConfig.enableSound) {
        typewriterSound.enable();
      }
    });
    
    // 监听声音设置变化
    watch(() => globalConfig.enableSound, (newValue) => {
      if (newValue) {
        typewriterSound.enable();
      } else {
        typewriterSound.disable();
      }
    });
    
    // 组件销毁时清理
    onBeforeUnmount(() => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    });
    
    return {
      textContainer,
      isTyping
    };
  }
};
</script>

<style scoped>
.typewriter-container {
  display: inline-flex;
  align-items: center;
  position: relative;
}

.typewriter-text {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.5;
  min-height: 20px; /* 确保即使内容为空也有高度 */
}

.typing-cursor {
  display: inline-block;
  width: 3px;
  height: 18px;
  background-color: currentColor;
  margin-left: 2px;
  animation: blink 0.7s infinite;
  position: relative;
  top: 2px;
  opacity: 0.8;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.2; }
}

/* 为最后打出的字符添加高亮效果 */
.typewriter-text span.highlight-char {
  background-color: rgba(255, 255, 0, 0.2);
  transition: background-color 0.3s ease-out;
}
</style>
