<template>
  <div class="settings-panel">
    <el-form label-position="top">
      <el-form-item label="界面主题">
        <el-radio-group v-model="settings.theme">
          <el-radio label="light">浅色</el-radio>
          <el-radio label="dark">深色</el-radio>
          <el-radio label="system">跟随系统</el-radio>
        </el-radio-group>
      </el-form-item>
      
      <el-form-item label="字体大小">
        <el-slider
          v-model="settings.fontSize"
          :min="12"
          :max="20"
          :step="1"
          show-stops
          show-input
          input-size="small"
        />
      </el-form-item>
      
      <el-divider content-position="left">对话设置</el-divider>
      
      <el-form-item label="自动保存对话历史">
        <el-switch v-model="settings.saveChatHistory" />
      </el-form-item>
      
      <el-form-item label="最大保存对话数量">
        <el-input-number v-model="settings.maxHistoryLength" :min="5" :max="100" :step="5" />
      </el-form-item>
      
      <el-divider content-position="left">Office集成</el-divider>
      
      <el-form-item label="读取文档内容作为上下文">
        <el-switch v-model="settings.useDocumentContext" />
      </el-form-item>
      
      <el-form-item label="允许AI修改文档">
        <el-switch v-model="settings.allowDocumentModification" />
      </el-form-item>
      
      <el-divider content-position="left">隐私设置</el-divider>
      
      <el-form-item label="数据使用">
        <el-checkbox v-model="settings.allowTelemetry">允许收集匿名使用数据以改进服务</el-checkbox>
      </el-form-item>
    </el-form>
    
    <div class="settings-actions">
      <el-button type="primary" @click="saveSettings">保存设置</el-button>
      <el-button @click="resetSettings">重置默认</el-button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';

export default {
  name: 'SettingsPanel',
  emits: ['close'],
  setup(props, { emit }) {
    // 默认设置
    const defaultSettings = {
      theme: 'light',
      fontSize: 14,
      saveChatHistory: true,
      maxHistoryLength: 50,
      useDocumentContext: true,
      allowDocumentModification: false,
      allowTelemetry: false
    };
    
    // 当前设置
    const settings = ref({...defaultSettings});
    
    // 初始化设置
    onMounted(() => {
      loadSettings();
    });
    
    // 加载设置
    const loadSettings = () => {
      try {
        const savedSettings = localStorage.getItem('userSettings');
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings);
          // 合并保存的设置和默认设置，确保有新添加的设置项
          settings.value = { ...defaultSettings, ...parsedSettings };
        }
      } catch (error) {
        console.error('加载设置失败:', error);
        settings.value = { ...defaultSettings };
      }
    };
    
    // 保存设置
    const saveSettings = () => {
      try {
        localStorage.setItem('userSettings', JSON.stringify(settings.value));
        ElMessage.success('设置已保存');
        
        // 应用设置
        applySettings();
        
        // 关闭面板
        emit('close');
      } catch (error) {
        console.error('保存设置失败:', error);
        ElMessage.error('保存设置失败');
      }
    };
    
    // 重置设置
    const resetSettings = () => {
      settings.value = { ...defaultSettings };
      ElMessage.info('设置已重置为默认值');
    };
    
    // 应用设置
    const applySettings = () => {
      // 应用字体大小
      document.documentElement.style.fontSize = `${settings.value.fontSize}px`;
      
      // 应用主题
      if (settings.value.theme === 'dark') {
        document.documentElement.classList.add('dark-theme');
      } else if (settings.value.theme === 'light') {
        document.documentElement.classList.remove('dark-theme');
      } else if (settings.value.theme === 'system') {
        // 系统主题跟随
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          document.documentElement.classList.add('dark-theme');
        } else {
          document.documentElement.classList.remove('dark-theme');
        }
      }
      
      // 可以添加其他设置的应用逻辑
    };
    
    return {
      settings,
      saveSettings,
      resetSettings
    };
  }
};
</script>

<style>
.settings-panel {
  padding: 10px;
}

.settings-actions {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 深色主题CSS可以在这里添加 */
.dark-theme {
  --el-bg-color: #1a1a1a;
  --el-text-color-primary: #e0e0e0;
  --el-border-color: #444;
  /* 更多深色主题变量 */
}
</style> 