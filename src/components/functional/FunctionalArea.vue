<template>
  <div class="functional-area">
    <div class="functional-area-header">
      <h2 class="area-title">功能工具</h2>
      <div class="functional-controls">
        <el-tooltip content="刷新" placement="top">
          <el-button 
            type="text" 
            :icon="Refresh" 
            @click="refreshTools"
            class="control-btn"
          />
        </el-tooltip>
      </div>
    </div>
    
    <div class="functional-area-content">
      <el-tabs v-model="activeTab" class="functional-tabs" tab-position="left">
        <!-- Office 应用特定功能 -->
        <el-tab-pane v-if="isExcel" name="excel" lazy>
          <template #label>
            <div class="tab-label">
              <el-icon><Grid /></el-icon>
              <span>Excel 分析</span>
            </div>
          </template>
          <excel-analyzer />
        </el-tab-pane>
        
        <el-tab-pane v-if="isWord" name="word" lazy>
          <template #label>
            <div class="tab-label">
              <el-icon><Document /></el-icon>
              <span>Word 分析</span>
            </div>
          </template>
          <text-analyzer />
        </el-tab-pane>
        
        <!-- 通用工具 -->
        <el-tab-pane name="tools" lazy>
          <template #label>
            <div class="tab-label">
              <el-icon><Tools /></el-icon>
              <span>通用工具</span>
            </div>
          </template>
          <preset-tools />
        </el-tab-pane>
        
        <!-- 快捷提示 -->
        <el-tab-pane name="prompts" lazy>
          <template #label>
            <div class="tab-label">
              <el-icon><ChatLineRound /></el-icon>
              <span>快捷提示</span>
            </div>
          </template>
          <prompt-library @use-prompt="handleUsePrompt" />
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, defineAsyncComponent } from 'vue';
import { Refresh, Grid, Document, Tools, ChatLineRound } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

// 异步加载组件
const ExcelAnalyzer = defineAsyncComponent(() => import('../excel/ExcelAnalyzer.vue'));
const TextAnalyzer = defineAsyncComponent(() => import('../word/TextAnalyzer.vue'));
const PresetTools = defineAsyncComponent(() => import('./PresetTools.vue'));
const PromptLibrary = defineAsyncComponent(() => import('./PromptLibrary.vue'));

// Declare Office variable
/* global Office */

export default {
  name: 'FunctionalArea',
  components: {
    ExcelAnalyzer,
    TextAnalyzer,
    PresetTools,
    PromptLibrary,
    Refresh,
    Grid,
    Document,
    Tools,
    ChatLineRound
  },
  emits: ['use-prompt'],
  setup(props, { emit }) {
    const activeTab = ref('tools');
    
    // 检测当前Office应用类型
    const officeHost = Office?.context?.host || null;
    
    // 计算属性：是否为Excel
    const isExcel = computed(() => {
      return officeHost === Office.HostType.Excel;
    });
    
    // 计算属性：是否为Word
    const isWord = computed(() => {
      return officeHost === Office.HostType.Word;
    });
    
    // 刷新工具
    const refreshTools = () => {
      ElMessage.success('功能区已刷新');
      // 这里可以添加实际的刷新逻辑
    };
    
    // 处理使用提示
    const handleUsePrompt = (prompt) => {
      emit('use-prompt', prompt);
    };
    
    onMounted(() => {
      // 根据当前Office应用类型设置默认活动标签
      if (isExcel.value) {
        activeTab.value = 'excel';
      } else if (isWord.value) {
        activeTab.value = 'word';
      } else {
        activeTab.value = 'tools';
      }
    });
    
    return {
      activeTab,
      isExcel,
      isWord,
      refreshTools,
      handleUsePrompt,
      Refresh
    };
  }
};
</script>

<style>
.functional-area {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.functional-area-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(to right, #6E56CF, #5E63DD);
  color: white;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}

.area-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  letter-spacing: 0.5px;
}

.functional-controls {
  display: flex;
  gap: 8px;
}

.control-btn {
  color: rgba(255, 255, 255, 0.8);
  font-size: 16px;
  transition: all 0.2s ease;
}

.control-btn:hover {
  color: white;
  transform: scale(1.05);
}

.functional-area-content {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.functional-tabs {
  height: 100%;
}

.functional-tabs .el-tabs__content {
  padding: 16px;
  height: calc(100% - 32px);
  overflow-y: auto;
}

.functional-tabs .el-tabs__nav {
  background-color: var(--el-bg-color-page);
  border-right: 1px solid var(--el-border-color-lighter);
}

.functional-tabs .el-tabs__item {
  height: auto;
  padding: 16px 20px;
  text-align: left;
}

.functional-tabs .el-tabs__item.is-active {
  background-color: rgba(62, 99, 221, 0.1);
  color: #3E63DD;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab-label .el-icon {
  font-size: 18px;
}
</style>
