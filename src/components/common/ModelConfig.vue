<template>
  <div class="model-config">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="模型列表" name="modelList">
        <el-table :data="modelConfigs" style="width: 100%" :max-height="400" :resize-observer="tblResizeObserver">
          <el-table-column prop="name" label="模型名称" />
          <el-table-column prop="apiUrl" label="API地址" />
          <el-table-column label="操作">
            <template #default="scope">
              <el-button size="small" @click="editModel(scope.row)">编辑</el-button>
              <el-button size="small" type="danger" @click="deleteModel(scope.row)">删除</el-button>
              <el-button 
                size="small" 
                type="primary" 
                v-if="scope.row.id !== defaultModel"
                @click="setAsDefault(scope.row)">
                设为默认
              </el-button>
              <el-tag v-else type="success">默认</el-tag>
            </template>
          </el-table-column>
        </el-table>
        <div class="table-actions">
          <el-button type="primary" @click="showAddForm">添加模型</el-button>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="添加/编辑模型" name="editModel" v-if="showEditForm">
        <el-form :model="currentModel" label-width="120px" class="model-form">
          <el-form-item label="模型名称">
            <el-input v-model="currentModel.name" />
          </el-form-item>
          <el-form-item label="API地址">
            <el-input v-model="currentModel.apiUrl" />
          </el-form-item>
          <el-form-item label="API密钥">
            <el-input v-model="currentModel.apiKey" type="password" show-password />
          </el-form-item>
          
          <el-collapse>
            <el-collapse-item title="高级设置" name="advanced">
              <el-form-item label="温度">
                <el-slider v-model="currentModel.temperature" :min="0" :max="1" :step="0.1" />
              </el-form-item>
              <el-form-item label="最大Token">
                <el-input-number v-model="currentModel.maxTokens" :min="100" :max="8000" />
              </el-form-item>
              <!-- 其他参数 -->
            </el-collapse-item>
          </el-collapse>
          
          <el-form-item>
            <el-button type="primary" @click="saveModel">保存</el-button>
            <el-button @click="testConnection">测试连接</el-button>
            <el-button @click="cancelEdit">取消</el-button>
          </el-form-item>
        </el-form>
        
        <div v-if="testResult" class="test-result">
          <el-alert
            :title="testResult.success ? '连接成功' : '连接失败'"
            :type="testResult.success ? 'success' : 'error'"
            :description="testResult.message"
            show-icon
          />
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

export default {
  name: 'ModelConfig',
  emits: ['close'],
  setup(props, { emit }) {
    const activeTab = ref('modelList');
    const modelConfigs = ref([]);
    const currentModel = ref({
      id: null,
      name: '',
      apiUrl: '',
      apiKey: '',
      temperature: 0.7,
      maxTokens: 2000
    });
    const defaultModel = ref(null);
    const showEditForm = ref(false);
    const testResult = ref(null);
    const tblResizeObserver = ref(null);
    
    // 加载模型配置
    onMounted(() => {
      loadModelConfigs();
    });
    
    const loadModelConfigs = () => {
      try {
        // 从存储加载模型配置
        const configs = getFromStorage('modelConfigs') || [];
        modelConfigs.value = Array.isArray(configs) ? configs : [];
        defaultModel.value = getFromStorage('defaultModelId');
        
        // 如果没有配置，自动添加一个空模板
        if (modelConfigs.value.length === 0) {
          const defaultId = Date.now();
          modelConfigs.value = [
            {
              id: defaultId,
              name: '默认模型(示例)',
              apiUrl: 'https://api.example.com/v1/chat/completions',
              apiKey: '',
              model: 'gpt-3.5-turbo',
              temperature: 0.7,
              maxTokens: 2000
            }
          ];
          defaultModel.value = defaultId;
          saveToStorage('modelConfigs', modelConfigs.value);
          saveToStorage('defaultModelId', defaultId);
        }
      } catch (error) {
        console.error('加载模型配置失败:', error);
        ElMessage.error('加载模型配置失败，已重置为默认设置');
        
        // 重置为默认配置
        const defaultId = Date.now();
        modelConfigs.value = [
          {
            id: defaultId,
            name: '默认模型(示例)',
            apiUrl: 'https://api.example.com/v1/chat/completions',
            apiKey: '',
            model: 'gpt-3.5-turbo',
            temperature: 0.7,
            maxTokens: 2000
          }
        ];
        defaultModel.value = defaultId;
        saveToStorage('modelConfigs', modelConfigs.value);
        saveToStorage('defaultModelId', defaultId);
      }
    };
    
    const showAddForm = () => {
      currentModel.value = {
        id: Date.now(),
        name: '',
        apiUrl: '',
        apiKey: '',
        temperature: 0.7,
        maxTokens: 2000
      };
      showEditForm.value = true;
      activeTab.value = 'editModel';
      testResult.value = null;
    };
    
    const editModel = (model) => {
      // 克隆模型对象以避免直接修改原对象
      currentModel.value = {...model};
      showEditForm.value = true;
      activeTab.value = 'editModel';
      testResult.value = null;
    };
    
    const saveModel = () => {
      // 验证必填字段
      if (!currentModel.value.name.trim()) {
        ElMessage.error('请输入模型名称');
        return;
      }
      
      if (!currentModel.value.apiUrl.trim()) {
        ElMessage.error('请输入API地址');
        return;
      }
      
      const index = modelConfigs.value.findIndex(m => m.id === currentModel.value.id);
      if (index >= 0) {
        // 更新现有模型
        modelConfigs.value[index] = {...currentModel.value};
      } else {
        // 添加新模型
        modelConfigs.value.push({...currentModel.value});
      }
      
      // 如果这是第一个模型，设为默认
      if (modelConfigs.value.length === 1) {
        defaultModel.value = currentModel.value.id;
        saveToStorage('defaultModelId', defaultModel.value);
      }
      
      saveToStorage('modelConfigs', modelConfigs.value);
      showEditForm.value = false;
      activeTab.value = 'modelList';
      
      ElMessage.success('模型配置已保存');
    };
    
    const deleteModel = (model) => {
      // 删除确认
      ElMessageBox.confirm(
        '确定要删除这个模型配置吗?',
        '提示',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        const index = modelConfigs.value.findIndex(m => m.id === model.id);
        if (index >= 0) {
          modelConfigs.value.splice(index, 1);
          saveToStorage('modelConfigs', modelConfigs.value);
          
          // 如果删除的是默认模型，需要重新设置默认
          if (model.id === defaultModel.value && modelConfigs.value.length > 0) {
            defaultModel.value = modelConfigs.value[0].id;
            saveToStorage('defaultModelId', defaultModel.value);
          } else if (modelConfigs.value.length === 0) {
            defaultModel.value = null;
            saveToStorage('defaultModelId', null);
          }
          
          ElMessage.success('模型配置已删除');
        }
      }).catch(() => {
        // 取消删除
      });
    };
    
    const setAsDefault = (model) => {
      defaultModel.value = model.id;
      saveToStorage('defaultModelId', defaultModel.value);
      ElMessage.success(`已将 "${model.name}" 设为默认模型`);
    };
    
    const cancelEdit = () => {
      showEditForm.value = false;
      activeTab.value = 'modelList';
      testResult.value = null;
    };
    
    const testConnection = async () => {
      // 验证必填字段
      if (!currentModel.value.apiUrl.trim()) {
        ElMessage.error('请输入API地址');
        return;
      }
      
      if (!currentModel.value.apiKey.trim()) {
        ElMessage.error('请输入API密钥');
        return;
      }
      
      testResult.value = { 
        success: null, 
        message: '正在测试连接，请稍候...' 
      };
      
      try {
        // 导入aiModelService
        const { aiModelService } = await import('@/services/apiService');
        
        // 实际测试连接
        const result = await aiModelService.testConnection(currentModel.value);
        testResult.value = result;
      } catch (error) {
        console.error('测试连接错误:', error);
        testResult.value = {
          success: false,
          message: `连接失败: ${error.message || '未知错误'}`
        };
      }
    };
    
    // 数据存储方法
    const saveToStorage = (key, value) => {
      try {
        // 判断是否在Office环境中
        if (window.Office && Office.context && Office.context.roamingSettings) {
          // 使用Office roamingSettings
          Office.context.roamingSettings.set(key, JSON.stringify(value));
          Office.context.roamingSettings.saveAsync();
        } else {
          // 降级使用localStorage
          localStorage.setItem(key, JSON.stringify(value));
        }
      } catch (error) {
        console.error('保存数据失败:', error);
        // 降级使用localStorage
        try {
          localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
          console.error('无法保存到localStorage:', e);
        }
      }
    };
    
    const getFromStorage = (key) => {
      try {
        let value;
        // 判断是否在Office环境中
        if (window.Office && Office.context && Office.context.roamingSettings) {
          // 使用Office roamingSettings
          value = Office.context.roamingSettings.get(key);
        } else {
          // 降级使用localStorage
          value = localStorage.getItem(key);
        }
        
        return value ? JSON.parse(value) : null;
      } catch (error) {
        console.error('获取数据失败:', error);
        // 尝试从localStorage获取
        try {
          const value = localStorage.getItem(key);
          return value ? JSON.parse(value) : null;
        } catch (e) {
          console.error('无法从localStorage获取:', e);
          return null;
        }
      }
    };
    
    return {
      activeTab,
      modelConfigs,
      currentModel,
      defaultModel,
      showEditForm,
      testResult,
      showAddForm,
      editModel,
      saveModel,
      deleteModel,
      setAsDefault,
      cancelEdit,
      testConnection,
      tblResizeObserver
    };
  }
};
</script>

<style>
.model-config {
  padding: 15px;
}

.model-form {
  min-height: 400px; /* 添加固定的最小高度 */
}

.table-actions {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
}

.test-result {
  margin-top: 20px;
}
</style> 