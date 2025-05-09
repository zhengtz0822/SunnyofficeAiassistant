<template>
  <div class="app-container">
    <el-config-provider :locale="zhCn">
      <header class="app-header">
        <h1 class="app-title">Office AI助手</h1>
        <div class="app-info">
          <el-tag>{{ officeHostName }}</el-tag>
        </div>
      </header>
      
      <main class="app-content">
        <!-- 根据当前Office主机类型显示对应组件 -->
        <component :is="currentHostComponent" v-if="currentHostComponent"></component>
        
        <!-- 如果不支持当前主机类型，显示提示信息 -->
        <div v-if="!isHostSupported" class="host-not-supported">
          <el-alert
            title="不支持的Office应用"
            type="warning"
            description="当前AI助手仅支持Word和Excel，请在Word或Excel中使用。"
            show-icon
          ></el-alert>
        </div>
        
        <!-- 聊天界面组件（通用，始终显示） -->
        <chat-interface></chat-interface>
      </main>
      
      <footer class="app-footer">
        <el-button size="small" @click="openSettings">
          <el-icon><Setting /></el-icon> 设置
        </el-button>
        <el-button size="small" @click="openModelConfig">
          <el-icon><Connection /></el-icon> 模型配置
        </el-button>
      </footer>
      
      <!-- 设置对话框 -->
      <el-dialog v-model="showSettingsDialog" title="设置" width="500px">
        <settings-panel @close="showSettingsDialog = false"></settings-panel>
      </el-dialog>
      
      <!-- 模型配置对话框 -->
      <el-dialog v-model="showModelConfigDialog" title="AI模型配置" width="650px">
        <model-config @close="showModelConfigDialog = false"></model-config>
      </el-dialog>
    </el-config-provider>
  </div>
</template>

<script>
import { ref, computed, defineAsyncComponent } from 'vue';
import { Setting, Connection } from '@element-plus/icons-vue';
import zhCn from 'element-plus/dist/locale/zh-cn.mjs';

// 异步加载组件
const ChatInterface = defineAsyncComponent(() => import('./components/common/ChatInterface.vue'));
const SettingsPanel = defineAsyncComponent(() => import('./components/common/SettingsPanel.vue'));
const ModelConfig = defineAsyncComponent(() => import('./components/common/ModelConfig.vue'));

export default {
  name: 'App',
  components: {
    ChatInterface,
    SettingsPanel,
    ModelConfig,
    Setting,
    Connection
  },
  setup() {
    const showSettingsDialog = ref(false);
    const showModelConfigDialog = ref(false);
    
    // 获取当前Office应用类型
    const officeHost = Office?.context?.host || null;
    
    // 计算属性：获取当前Office应用的名称
    const officeHostName = computed(() => {
      switch (officeHost) {
        case Office.HostType.Excel:
          return 'Excel';
        case Office.HostType.Word:
          return 'Word';
        case Office.HostType.PowerPoint:
          return 'PowerPoint';
        case Office.HostType.Outlook:
          return 'Outlook';
        default:
          return '未知应用';
      }
    });
    
    // 计算属性：确定是否支持当前Office应用
    const isHostSupported = computed(() => {
      return officeHost === Office.HostType.Excel || officeHost === Office.HostType.Word;
    });
    
    // 计算属性：根据当前Office应用确定要加载的组件
    const currentHostComponent = computed(() => {
      switch (officeHost) {
        case Office.HostType.Excel:
          return 'excel-analyzer'; // 将在main.js中动态注册
        case Office.HostType.Word:
          return 'text-analyzer'; // 将在main.js中动态注册
        default:
          return null;
      }
    });
    
    // 打开设置面板
    const openSettings = () => {
      showSettingsDialog.value = true;
    };
    
    // 打开模型配置面板
    const openModelConfig = () => {
      showModelConfigDialog.value = true;
    };
    
    return {
      showSettingsDialog,
      showModelConfigDialog,
      officeHostName,
      isHostSupported,
      currentHostComponent,
      openSettings,
      openModelConfig,
      zhCn
    };
  }
};
</script>

<style>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 10px;
  box-sizing: border-box;
  font-family: 'Microsoft YaHei', 'Segoe UI', sans-serif;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 10px;
  border-bottom: 1px solid #eaeaea;
}

.app-title {
  font-size: 18px;
  margin: 0;
}

.app-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px 0;
}

.app-footer {
  padding-top: 10px;
  border-top: 1px solid #eaeaea;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.host-not-supported {
  margin: 20px 0;
}
</style> 