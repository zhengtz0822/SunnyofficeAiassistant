<template>
  <div class="compact-layout" :class="{ 'dark-mode': isDarkMode }">
    <!-- 顶部导航栏 -->
    <div class="top-nav">
      <div class="app-branding">
        <div class="app-logo">
          <img src="/assets/icon-32.png" alt="Logo" class="logo-img" />
        </div>
        <h1 class="app-title">Office AI 助手</h1>
        <div class="host-tag">{{ officeHostName }}</div>
      </div>
      
      <div class="nav-tabs">
        <div 
          v-for="tab in tabs" 
          :key="tab.id"
          class="nav-tab"
          :class="{ 'active': activeTab === tab.id }"
          @click="switchTab(tab.id)"
        >
          <el-icon><component :is="tab.icon" /></el-icon>
          <span>{{ tab.label }}</span>
          <div class="tab-indicator" v-if="activeTab === tab.id"></div>
        </div>
      </div>
      
      <div class="nav-actions">
        <el-tooltip content="切换深色模式" placement="bottom">
          <div class="theme-toggle" @click="toggleDarkMode">
            <el-icon v-if="isDarkMode"><Sunny /></el-icon>
            <el-icon v-else><Moon /></el-icon>
          </div>
        </el-tooltip>
        
        <el-dropdown trigger="click" @command="handleCommand">
          <div class="settings-btn">
            <el-icon><Setting /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="settings">
                <el-icon><Tools /></el-icon> 设置
              </el-dropdown-item>
              <el-dropdown-item command="modelConfig">
                <el-icon><Connection /></el-icon> 模型配置
              </el-dropdown-item>
              <el-dropdown-item command="about" divided>
                <el-icon><InfoFilled /></el-icon> 关于
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
    
    <!-- 内容区域 -->
    <div class="content-area">
      <!-- 聊天区域 -->
      <div 
        class="tab-content-container"
        v-show="activeTab === 'chat'"
      >
        <slot name="chat-area"></slot>
      </div>
      
      <!-- Excel 分析区域 -->
      <div 
        class="tab-content-container"
        v-show="activeTab === 'excel'"
      >
        <slot name="excel-area"></slot>
      </div>
      
      <!-- Word 分析区域 -->
      <div 
        class="tab-content-container"
        v-show="activeTab === 'word'"
      >
        <slot name="word-area"></slot>
      </div>
      
      <!-- 工具区域 -->
      <div 
        class="tab-content-container"
        v-show="activeTab === 'tools'"
      >
        <slot name="tools-area"></slot>
      </div>
      
      <!-- 提示库区域 -->
      <div 
        class="tab-content-container"
        v-show="activeTab === 'prompts'"
      >
        <slot name="prompts-area"></slot>
      </div>
    </div>
    
    <!-- 设置对话框 -->
    <el-dialog v-model="showSettingsDialog" title="设置" width="500px" class="material-dialog">
      <settings-panel @close="showSettingsDialog = false"></settings-panel>
    </el-dialog>
    
    <!-- 模型配置对话框 -->
    <el-dialog v-model="showModelConfigDialog" title="AI模型配置" width="650px" class="material-dialog">
      <model-config @close="showModelConfigDialog = false"></model-config>
    </el-dialog>

    <!-- 关于对话框 -->
    <el-dialog v-model="showAboutDialog" title="关于 Office AI 助手" width="400px" class="material-dialog">
      <div class="about-content">
        <img src="/assets/icon-80.png" alt="Logo" class="about-logo" />
        <h3>Office AI 助手</h3>
        <p class="version">版本 1.0.0</p>
        <p class="description">
          Office AI 助手是一个智能工具，为 Word 和 Excel 提供 AI 驱动的分析和辅助功能。
        </p>
        <div class="about-footer">
          <p>© 2023 AI助手开发团队</p>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted, defineAsyncComponent, watch } from 'vue';
import { 
  Setting, 
  Tools, 
  Connection, 
  InfoFilled, 
  ChatLineRound, 
  Grid, 
  Document, 
  Operation,
  Sunny,
  Moon
} from '@element-plus/icons-vue';
import { generateCssVariables } from '@/styles/material-theme';

// 异步加载组件
const SettingsPanel = defineAsyncComponent(() => import('../common/SettingsPanel.vue'));
const ModelConfig = defineAsyncComponent(() => import('../common/ModelConfig.vue'));

export default {
  name: 'CompactLayout',
  components: {
    SettingsPanel,
    ModelConfig,
    Setting,
    Tools,
    Connection,
    InfoFilled,
    ChatLineRound,
    Grid,
    Document,
    Operation,
    Sunny,
    Moon
  },
  props: {
    officeHostName: {
      type: String,
      default: '未知应用'
    },
    isExcel: {
      type: Boolean,
      default: false
    },
    isWord: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    // 标签页配置
    const tabs = computed(() => {
      const baseTabs = [
        {
          id: 'chat',
          label: 'AI 对话',
          icon: 'ChatLineRound'
        },
        {
          id: 'tools',
          label: '通用工具',
          icon: 'Tools'
        },
        {
          id: 'prompts',
          label: '提示库',
          icon: 'Operation'
        }
      ];
      
      // 根据当前 Office 应用添加特定标签
      if (props.isExcel) {
        baseTabs.splice(1, 0, {
          id: 'excel',
          label: 'Excel 分析',
          icon: 'Grid'
        });
      }
      
      if (props.isWord) {
        baseTabs.splice(1, 0, {
          id: 'word',
          label: 'Word 分析',
          icon: 'Document'
        });
      }
      
      return baseTabs;
    });
    
    // 当前活动标签
    const activeTab = ref('chat');
    
    // 对话框显示状态
    const showSettingsDialog = ref(false);
    const showModelConfigDialog = ref(false);
    const showAboutDialog = ref(false);
    
    // 深色模式状态
    const isDarkMode = ref(false);
    
    // 切换标签
    const switchTab = (tabId) => {
      activeTab.value = tabId;
      // 保存到本地存储
      localStorage.setItem('activeTab', tabId);
    };
    
    // 处理下拉菜单命令
    const handleCommand = (command) => {
      switch (command) {
        case 'settings':
          showSettingsDialog.value = true;
          break;
        case 'modelConfig':
          showModelConfigDialog.value = true;
          break;
        case 'about':
          showAboutDialog.value = true;
          break;
      }
    };
    
    // 切换深色模式
    const toggleDarkMode = () => {
      isDarkMode.value = !isDarkMode.value;
      // 保存到本地存储
      localStorage.setItem('darkMode', isDarkMode.value.toString());
      // 应用主题
      applyTheme();
    };
    
    // 应用主题
    const applyTheme = () => {
      // 生成 CSS 变量
      const cssVars = generateCssVariables(isDarkMode.value);
      
      // 创建或更新样式标签
      let styleEl = document.getElementById('material-theme-vars');
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'material-theme-vars';
        document.head.appendChild(styleEl);
      }
      
      styleEl.textContent = cssVars;
      
      // 添加或移除 dark-mode 类
      if (isDarkMode.value) {
        document.documentElement.classList.add('dark-mode');
      } else {
        document.documentElement.classList.remove('dark-mode');
      }
    };
    
    // 监听 Office 应用类型变化，自动切换到相应标签
    watch(() => [props.isExcel, props.isWord], () => {
      if (props.isExcel && activeTab.value === 'word') {
        activeTab.value = 'excel';
      } else if (props.isWord && activeTab.value === 'excel') {
        activeTab.value = 'word';
      }
    });
    
    // 初始化
    onMounted(() => {
      // 从本地存储加载上次活动的标签
      const savedTab = localStorage.getItem('activeTab');
      if (savedTab) {
        // 检查保存的标签是否在当前可用的标签中
        const isValidTab = tabs.value.some(tab => tab.id === savedTab);
        if (isValidTab) {
          activeTab.value = savedTab;
        }
      } else {
        // 默认选择适合当前 Office 应用的标签
        if (props.isExcel) {
          activeTab.value = 'excel';
        } else if (props.isWord) {
          activeTab.value = 'word';
        } else {
          activeTab.value = 'chat';
        }
      }
      
      // 从本地存储加载深色模式设置
      const savedDarkMode = localStorage.getItem('darkMode');
      if (savedDarkMode !== null) {
        isDarkMode.value = savedDarkMode === 'true';
      } else {
        // 检查系统偏好
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        isDarkMode.value = prefersDark;
      }
      
      // 应用主题
      applyTheme();
    });
    
    return {
      tabs,
      activeTab,
      showSettingsDialog,
      showModelConfigDialog,
      showAboutDialog,
      isDarkMode,
      switchTab,
      handleCommand,
      toggleDarkMode
    };
  }
};
</script>

<style>
.compact-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background-color: var(--md-background-default);
  color: var(--md-text-primary);
  font-family: var(--md-font-family);
  transition: background-color var(--md-transition-duration-standard) var(--md-transition-easing-standard);
}

.top-nav {
  display: flex;
  align-items: center;
  padding: 0 16px;
  height: 64px;
  background: linear-gradient(135deg, var(--md-primary-main), var(--md-primary-dark));
  color: var(--md-primary-contrast);
  box-shadow: var(--md-shadow-md);
  z-index: 10;
  position: relative;
}

.app-branding {
  display: flex;
  align-items: center;
  min-width: 180px;
}

.app-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.logo-img {
  width: 28px;
  height: 28px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.app-title {
  font-size: 18px;
  font-weight: 500;
  margin: 0;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.host-tag {
  margin-left: 12px;
  background-color: rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  padding: 2px 10px;
  font-size: 12px;
  font-weight: 500;
}

.nav-tabs {
  display: flex;
  flex: 1;
  margin: 0 20px;
  overflow-x: auto;
  scrollbar-width: none; /* Firefox */
}

.nav-tabs::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Edge */
}

.nav-tab {
  display: flex;
  align-items: center;
  padding: 0 16px;
  height: 64px;
  cursor: pointer;
  position: relative;
  color: rgba(255, 255, 255, 0.7);
  transition: all var(--md-transition-duration-short) var(--md-transition-easing-standard);
  white-space: nowrap;
  font-weight: 500;
  letter-spacing: 0.02em;
}

.nav-tab:hover {
  color: white;
  background-color: rgba(255, 255, 255, 0.08);
}

.nav-tab.active {
  color: white;
}

.tab-indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background-color: white;
  border-top-left-radius: 3px;
  border-top-right-radius: 3px;
  animation: slideIn 0.3s var(--md-transition-easing-standard);
}

@keyframes slideIn {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

.nav-tab .el-icon {
  margin-right: 8px;
  font-size: 20px;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.settings-btn,
.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  color: white;
  font-size: 20px;
  transition: background-color var(--md-transition-duration-short) var(--md-transition-easing-standard);
}

.settings-btn:hover,
.theme-toggle:hover {
  background-color: rgba(255, 255, 255, 0.15);
}

.content-area {
  flex: 1;
  overflow: hidden;
  position: relative;
  padding: 16px;
}

.tab-content-container {
  height: 100%;
  animation: fadeScale 0.3s var(--md-transition-easing-standard);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

@keyframes fadeScale {
  from { 
    opacity: 0; 
    transform: scale(0.98);
  }
  to { 
    opacity: 1; 
    transform: scale(1);
  }
}

/* Material Design 对话框样式 */
.material-dialog .el-dialog__header {
  background-color: var(--md-primary-main);
  color: var(--md-primary-contrast);
  padding: 16px 24px;
  margin-right: 0;
  border-top-left-radius: var(--md-radius-md);
  border-top-right-radius: var(--md-radius-md);
}

.material-dialog .el-dialog__title {
  color: var(--md-primary-contrast);
  font-weight: 500;
}

.material-dialog .el-dialog__headerbtn .el-dialog__close {
  color: var(--md-primary-contrast);
}

.material-dialog .el-dialog__body {
  padding: 24px;
}

.material-dialog .el-dialog {
  border-radius: var(--md-radius-md);
  overflow: hidden;
  box-shadow: var(--md-shadow-xl);
}

/* 关于对话框样式 */
.about-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 16px 0;
}

.about-logo {
  width: 72px;
  height: 72px;
  margin-bottom: 20px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.about-content h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 500;
  color: var(--md-text-primary);
}

.version {
  color: var(--md-text-secondary);
  margin: 0 0 20px 0;
  font-size: 14px;
}

.description {
  margin-bottom: 24px;
  line-height: 1.6;
  color: var(--md-text-secondary);
}

.about-footer {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--md-divider);
  width: 100%;
  font-size: 12px;
  color: var(--md-text-secondary);
}

/* 深色模式样式 */
.dark-mode {
  background-color: var(--md-background-default);
  color: var(--md-text-primary);
}
</style>
