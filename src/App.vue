<template>
  <div class="app-container">
    <el-config-provider :locale="zhCn">
      <compact-layout 
        :office-host-name="officeHostName"
        :is-excel="isExcel"
        :is-word="isWord"
      >
        <template #chat-area>
          <chat-area @clear-chat="handleClearChat" />
        </template>
        
        <template #excel-area v-if="isExcel">
          <excel-analyzer />
        </template>
        
        <template #word-area v-if="isWord">
          <text-analyzer />
        </template>
        
        <template #tools-area>
          <preset-tools />
        </template>
        
        <template #prompts-area>
          <prompt-library @use-prompt="handleUsePrompt" />
        </template>
      </compact-layout>
    </el-config-provider>
  </div>
</template>

<script>
import { computed, defineAsyncComponent } from 'vue';
import zhCn from 'element-plus/dist/locale/zh-cn.mjs';

// 导入布局组件
import CompactLayout from './components/layout/CompactLayout.vue';
import ChatArea from './components/chat/ChatArea.vue';
import PresetTools from './components/functional/PresetTools.vue';
import PromptLibrary from './components/functional/PromptLibrary.vue';

// 异步加载组件
const ExcelAnalyzer = defineAsyncComponent(() => import('./components/excel/ExcelAnalyzer.vue'));
const TextAnalyzer = defineAsyncComponent(() => import('./components/word/TextAnalyzer.vue'));

// 导入 Material Design 主题
import { generateCssVariables } from './styles/material-theme';

// Declare Office variable if it's not globally available
let Office = window.Office || null;

export default {
  name: 'App',
  components: {
    CompactLayout,
    ChatArea,
    ExcelAnalyzer,
    TextAnalyzer,
    PresetTools,
    PromptLibrary
  },
  setup() {
    // 获取当前Office应用类型
    const officeHost = Office?.context?.host || null;
    
    // 计算属性：获取当前Office应用的名称
    const officeHostName = computed(() => {
      switch (officeHost) {
        case Office?.HostType?.Excel:
          return 'Excel';
        case Office?.HostType?.Word:
          return 'Word';
        case Office?.HostType?.PowerPoint:
          return 'PowerPoint';
        case Office?.HostType?.Outlook:
          return 'Outlook';
        default:
          return '未知应用';
      }
    });
    
    // 计算属性：是否为Excel
    const isExcel = computed(() => {
      return officeHost === Office?.HostType?.Excel;
    });
    
    // 计算属性：是否为Word
    const isWord = computed(() => {
      return officeHost === Office?.HostType?.Word;
    });
    
    // 处理清空聊天
    const handleClearChat = () => {
      console.log('聊天已清空');
      // 可以添加其他清空聊天相关的逻辑
    };
    
    // 处理使用提示
    const handleUsePrompt = (promptTemplate) => {
      console.log('使用提示模板:', promptTemplate);
      // 这里可以添加将提示模板发送到聊天界面的逻辑
    };
    
    return {
      officeHostName,
      isExcel,
      isWord,
      handleClearChat,
      handleUsePrompt,
      zhCn
    };
  }
};
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');

.app-container {
  height: 100vh;
  width: 100%;
  overflow: hidden;
  font-family: var(--md-font-family, 'Roboto', 'Microsoft YaHei', 'Segoe UI', sans-serif);
}

/* 全局 Material Design 样式 */
body {
  margin: 0;
  padding: 0;
  font-family: var(--md-font-family, 'Roboto', 'Microsoft YaHei', 'Segoe UI', sans-serif);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: var(--md-background-default, #FAFAFA);
  color: var(--md-text-primary, rgba(0, 0, 0, 0.87));
}

/* 按钮样式 */
.el-button {
  border-radius: 4px;
  font-weight: 500;
  letter-spacing: 0.02em;
  transition: background-color 0.25s cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1),
              border-color 0.25s cubic-bezier(0.4, 0, 0.2, 1),
              color 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.el-button--primary {
  background-color: var(--md-primary-main, #2196F3);
  border-color: var(--md-primary-main, #2196F3);
  color: var(--md-primary-contrast, #FFFFFF);
}

.el-button--primary:hover {
  background-color: var(--md-primary-dark, #1976D2);
  border-color: var(--md-primary-dark, #1976D2);
  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.2),
              0 4px 5px 0 rgba(0, 0, 0, 0.14),
              0 1px 10px 0 rgba(0, 0, 0, 0.12);
}

.el-button--primary:active {
  background-color: var(--md-primary-dark, #1976D2);
  border-color: var(--md-primary-dark, #1976D2);
  box-shadow: 0 5px 5px -3px rgba(0, 0, 0, 0.2),
              0 8px 10px 1px rgba(0, 0, 0, 0.14),
              0 3px 14px 2px rgba(0, 0, 0, 0.12);
}

/* 输入框样式 */
.el-input__wrapper {
  border-radius: 4px;
  transition: box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.el-input__wrapper.is-focus {
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
}

/* 卡片样式 */
.el-card {
  border-radius: 8px;
  overflow: hidden;
  transition: box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1),
              transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
}

.el-card__header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--md-divider, rgba(0, 0, 0, 0.12));
}

.el-card__body {
  padding: 16px 20px;
}

/* 标签页样式 */
.el-tabs__nav-wrap::after {
  height: 1px;
  background-color: var(--md-divider, rgba(0, 0, 0, 0.12));
}

.el-tabs__item {
  font-weight: 500;
  transition: color 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.el-tabs__item.is-active {
  color: var(--md-primary-main, #2196F3);
}

.el-tabs__active-bar {
  background-color: var(--md-primary-main, #2196F3);
  height: 2px;
}

/* 标签样式 */
.el-tag {
  border-radius: 16px;
  font-weight: 500;
  padding: 0 10px;
  height: 24px;
  line-height: 22px;
}

/* 表格样式 */
.el-table {
  border-radius: 4px;
  overflow: hidden;
}

.el-table th.el-table__cell {
  background-color: var(--md-background-default, #FAFAFA);
  font-weight: 500;
}

/* 对话框样式 */
.el-dialog {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 11px 15px -7px rgba(0, 0, 0, 0.2),
              0 24px 38px 3px rgba(0, 0, 0, 0.14),
              0 9px 46px 8px rgba(0, 0, 0, 0.12);
}

.el-dialog__header {
  padding: 16px 24px;
}

.el-dialog__body {
  padding: 20px 24px;
}

.el-dialog__footer {
  padding: 12px 24px 20px;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background-color: rgba(0, 0, 0, 0.3);
}
</style>
