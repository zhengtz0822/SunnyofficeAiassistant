<template>
  <div class="main-layout" :class="{ 'is-vertical': layoutMode === 'vertical' }">
    <div class="layout-header">
      <div class="app-branding">
        <h1 class="app-title">Office AI 助手</h1>
        <el-tag effect="plain" class="host-tag">{{ officeHostName }}</el-tag>
      </div>
      <div class="layout-controls">
        <el-tooltip content="切换布局方向" placement="bottom">
          <el-button 
            type="text" 
            :icon="layoutMode === 'horizontal' ? 'SwitchButton' : 'Operation'" 
            @click="toggleLayoutMode"
            class="layout-toggle-btn"
          />
        </el-tooltip>
        <el-dropdown trigger="click" @command="handleCommand">
          <el-button type="text" class="settings-btn">
            <el-icon><Setting /></el-icon>
          </el-button>
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

    <div class="layout-content">
      <div 
        class="chat-area-container"
        :style="{ 
          width: layoutMode === 'horizontal' ? `${chatAreaSize}%` : '100%',
          height: layoutMode === 'vertical' ? `${chatAreaSize}%` : '100%'
        }"
      >
        <slot name="chat-area"></slot>
      </div>

      <div class="resize-handle" @mousedown="startResize" :class="{ 'vertical': layoutMode === 'vertical' }">
        <div class="handle-line"></div>
      </div>

      <div 
        class="functional-area-container"
        :style="{ 
          width: layoutMode === 'horizontal' ? `${100 - chatAreaSize}%` : '100%',
          height: layoutMode === 'vertical' ? `${100 - chatAreaSize}%` : '100%'
        }"
      >
        <slot name="functional-area"></slot>
      </div>
    </div>

    <!-- 设置对话框 -->
    <el-dialog v-model="showSettingsDialog" title="设置" width="500px" class="custom-dialog">
      <settings-panel @close="showSettingsDialog = false"></settings-panel>
    </el-dialog>
    
    <!-- 模型配置对话框 -->
    <el-dialog v-model="showModelConfigDialog" title="AI模型配置" width="650px" class="custom-dialog">
      <model-config @close="showModelConfigDialog = false"></model-config>
    </el-dialog>

    <!-- 关于对话框 -->
    <el-dialog v-model="showAboutDialog" title="关于 Office AI 助手" width="400px" class="custom-dialog">
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
import { ref, computed, onMounted, defineAsyncComponent } from 'vue';
import { Setting, Tools, Connection, InfoFilled, SwitchButton, Operation } from '@element-plus/icons-vue';

// 异步加载组件
const SettingsPanel = defineAsyncComponent(() => import('../common/SettingsPanel.vue'));
const ModelConfig = defineAsyncComponent(() => import('../common/ModelConfig.vue'));

export default {
  name: 'MainLayout',
  components: {
    SettingsPanel,
    ModelConfig,
    Setting,
    Tools,
    Connection,
    InfoFilled,
    SwitchButton,
    Operation
  },
  props: {
    officeHostName: {
      type: String,
      default: '未知应用'
    }
  },
  setup() {
    // 布局模式：horizontal 或 vertical
    const layoutMode = ref('horizontal');
    // 聊天区域大小百分比
    const chatAreaSize = ref(60);
    // 对话框显示状态
    const showSettingsDialog = ref(false);
    const showModelConfigDialog = ref(false);
    const showAboutDialog = ref(false);
    // 调整大小相关状态
    const isResizing = ref(false);
    const startPosition = ref(0);
    const startSize = ref(0);

    // 切换布局模式
    const toggleLayoutMode = () => {
      layoutMode.value = layoutMode.value === 'horizontal' ? 'vertical' : 'horizontal';
      // 重置大小为默认值
      chatAreaSize.value = 60;
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

    // 开始调整大小
    const startResize = (e) => {
      isResizing.value = true;
      startPosition.value = layoutMode.value === 'horizontal' ? e.clientX : e.clientY;
      startSize.value = chatAreaSize.value;

      // 添加事件监听
      document.addEventListener('mousemove', handleResize);
      document.addEventListener('mouseup', stopResize);
      
      // 添加禁止选择文本的类
      document.body.classList.add('resizing');
    };

    // 处理调整大小
    const handleResize = (e) => {
      if (!isResizing.value) return;

      const container = document.querySelector('.layout-content');
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      let newSize;

      if (layoutMode.value === 'horizontal') {
        const delta = e.clientX - startPosition.value;
        const containerWidth = containerRect.width;
        newSize = startSize.value + (delta / containerWidth) * 100;
      } else {
        const delta = e.clientY - startPosition.value;
        const containerHeight = containerRect.height;
        newSize = startSize.value + (delta / containerHeight) * 100;
      }

      // 限制大小范围
      chatAreaSize.value = Math.max(30, Math.min(70, newSize));
    };

    // 停止调整大小
    const stopResize = () => {
      isResizing.value = false;
      document.removeEventListener('mousemove', handleResize);
      document.removeEventListener('mouseup', stopResize);
      
      // 移除禁止选择文本的类
      document.body.classList.remove('resizing');
    };

    // 初始化
    onMounted(() => {
      // 从本地存储加载布局偏好
      const savedLayout = localStorage.getItem('layoutMode');
      const savedSize = localStorage.getItem('chatAreaSize');
      
      if (savedLayout) {
        layoutMode.value = savedLayout;
      }
      
      if (savedSize) {
        chatAreaSize.value = parseFloat(savedSize);
      }
    });

    return {
      layoutMode,
      chatAreaSize,
      showSettingsDialog,
      showModelConfigDialog,
      showAboutDialog,
      toggleLayoutMode,
      handleCommand,
      startResize,
      handleResize,
      stopResize
    };
  }
};
</script>

<style>
.main-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background-color: var(--el-bg-color-page, #f5f7fa);
  color: var(--el-text-color-primary);
}

.layout-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(to right, #3E63DD, #6E56CF);
  color: white;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.app-branding {
  display: flex;
  align-items: center;
}

.app-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  letter-spacing: 0.5px;
}

.host-tag {
  margin-left: 12px;
  background-color: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
}

.layout-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.layout-toggle-btn,
.settings-btn {
  color: white;
  font-size: 18px;
}

.layout-content {
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
}

.main-layout.is-vertical .layout-content {
  flex-direction: column;
}

.chat-area-container,
.functional-area-container {
  overflow: hidden;
  transition: width 0.3s ease, height 0.3s ease;
  position: relative;
}

.resize-handle {
  width: 8px;
  background-color: transparent;
  cursor: col-resize;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 5;
  transition: background-color 0.2s;
}

.resize-handle.vertical {
  width: 100%;
  height: 8px;
  cursor: row-resize;
}

.resize-handle:hover,
.resize-handle:active {
  background-color: rgba(62, 99, 221, 0.1);
}

.handle-line {
  width: 4px;
  height: 40px;
  background-color: #e0e0e0;
  border-radius: 2px;
}

.resize-handle.vertical .handle-line {
  width: 40px;
  height: 4px;
}

.resize-handle:hover .handle-line,
.resize-handle:active .handle-line {
  background-color: #3E63DD;
}

/* 禁止在调整大小时选择文本 */
body.resizing {
  user-select: none;
  cursor: col-resize;
}

body.resizing .main-layout.is-vertical {
  cursor: row-resize;
}

/* 自定义对话框样式 */
.custom-dialog .el-dialog__header {
  border-bottom: 1px solid var(--el-border-color-lighter);
  padding: 16px 20px;
  margin-right: 0;
}

.custom-dialog .el-dialog__body {
  padding: 20px;
}

/* 关于对话框样式 */
.about-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 10px 0;
}

.about-logo {
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
}

.about-content h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
}

.version {
  color: var(--el-text-color-secondary);
  margin: 0 0 16px 0;
  font-size: 14px;
}

.description {
  margin-bottom: 20px;
  line-height: 1.6;
  color: var(--el-text-color-regular);
}

.about-footer {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
  width: 100%;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
