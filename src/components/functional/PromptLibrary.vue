<template>
  <div class="prompt-library">
    <div class="prompt-header">
      <h3 class="section-title">提示模板库</h3>
      <div class="prompt-actions">
        <el-input
          v-model="searchQuery"
          placeholder="搜索提示模板..."
          prefix-icon="Search"
          clearable
          class="search-input material-input"
        />
        <el-button 
          type="primary" 
          size="small" 
          @click="showAddPromptDialog"
          class="material-button"
        >
          <el-icon><Plus /></el-icon> 新建
        </el-button>
      </div>
    </div>
    
    <div class="prompt-categories">
      <el-radio-group v-model="activeCategory" size="small">
        <el-radio-button label="all">全部</el-radio-button>
        <el-radio-button v-for="category in categories" :key="category" :label="category">
          {{ getCategoryName(category) }}
        </el-radio-button>
      </el-radio-group>
    </div>
    
    <div class="prompts-container">
      <el-empty v-if="filteredPrompts.length === 0" description="没有找到匹配的提示模板" />
      
      <div v-else class="prompts-scroll-container">
        <el-card
          v-for="prompt in filteredPrompts"
          :key="prompt.id"
          class="prompt-card"
          shadow="hover"
        >
          <template #header>
            <div class="prompt-header">
              <span class="prompt-title">{{ prompt.title }}</span>
              <el-tag size="small" :type="getCategoryType(prompt.category)" class="category-tag">
                {{ getCategoryName(prompt.category) }}
              </el-tag>
            </div>
          </template>
          <div class="prompt-content">
            <p class="prompt-description">{{ prompt.description }}</p>
            <div class="prompt-template">
              <div class="template-header">
                <span>提示模板</span>
                <el-button type="text" size="small" @click="copyPrompt(prompt.template)" class="copy-btn">
                  <el-icon><CopyDocument /></el-icon> 复制
                </el-button>
              </div>
              <div class="template-content">
                {{ prompt.template }}
              </div>
            </div>
            <div class="prompt-actions">
              <el-button type="primary" @click="usePrompt(prompt)" class="material-button">使用此提示</el-button>
              <el-button type="text" @click="editPrompt(prompt)" class="edit-btn">
                <el-icon><EditPen /></el-icon>
              </el-button>
            </div>
          </div>
        </el-card>
      </div>
    </div>
    
    <!-- 编辑提示对话框 -->
    <el-dialog
      v-model="showEditDialog"
      :title="isNewPrompt ? '添加提示模板' : '编辑提示模板'"
      width="600px"
      class="material-dialog"
    >
      <el-form :model="currentPrompt" label-width="100px">
        <el-form-item label="标题">
          <el-input v-model="currentPrompt.title" class="material-input" />
        </el-form-item>
        <el-form-item label="类别">
          <el-select v-model="currentPrompt.category" class="material-select">
            <el-option
              v-for="category in categories"
              :key="category"
              :label="getCategoryName(category)"
              :value="category"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="currentPrompt.description" type="textarea" :rows="2" class="material-input" />
        </el-form-item>
        <el-form-item label="提示模板">
          <el-input v-model="currentPrompt.template" type="textarea" :rows="5" class="material-input" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false" class="material-button">取消</el-button>
        <el-button type="primary" @click="savePrompt" class="material-button">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { Search, CopyDocument, EditPen, Plus } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

export default {
  name: 'PromptLibrary',
  components: {
    Search,
    CopyDocument,
    EditPen,
    Plus
  },
  emits: ['use-prompt'],
  setup(props, { emit }) {
    const searchQuery = ref('');
    const activeCategory = ref('all');
    const showEditDialog = ref(false);
    const isNewPrompt = ref(false);
    const currentPrompt = ref({
      id: '',
      title: '',
      category: 'general',
      description: '',
      template: ''
    });
    
    // 预设提示模板
    const prompts = ref([
      {
        id: '1',
        title: '文档摘要',
        category: 'document',
        description: '生成文档内容的简洁摘要',
        template: '请为以下文档内容生成一个简洁的摘要，突出关键信息和主要观点：\n\n[文档内容]'
      },
      {
        id: '2',
        title: '数据分析',
        category: 'excel',
        description: '分析Excel数据并提供洞察',
        template: '请分析以下Excel数据，提供关键洞察、趋势和建议：\n\n[数据内容]'
      },
      {
        id: '3',
        title: '内容改写',
        category: 'writing',
        description: '改写文本以提高清晰度和专业性',
        template: '请改写以下文本，使其更加清晰、专业和引人入胜，同时保持原意：\n\n[原文本]'
      },
      {
        id: '4',
        title: 'Excel公式生成',
        category: 'excel',
        description: '根据需求生成Excel公式',
        template: '请根据以下需求生成适当的Excel公式：\n\n需求：[描述你的需求]\n数据范围：[相关单元格范围]'
      },
      {
        id: '5',
        title: '文档校对',
        category: 'document',
        description: '检查文档中的语法和拼写错误',
        template: '请检查以下文本中的语法、拼写和标点错误，并提供修正建议：\n\n[文本内容]'
      }
    ]);
    
    // 类别列表
    const categories = ['general', 'document', 'excel', 'writing', 'presentation'];
    
    // 获取类别名称
    const getCategoryName = (category) => {
      const categoryMap = {
        'general': '通用',
        'document': '文档',
        'excel': '电子表格',
        'writing': '写作',
        'presentation': '演示'
      };
      return categoryMap[category] || category;
    };
    
    // 获取类别标签类型
    const getCategoryType = (category) => {
      const typeMap = {
        'general': '',
        'document': 'success',
        'excel': 'warning',
        'writing': 'info',
        'presentation': 'danger'
      };
      return typeMap[category] || '';
    };
    
    // 过滤后的提示列表
    const filteredPrompts = computed(() => {
      return prompts.value.filter(prompt => {
        // 类别过滤
        if (activeCategory.value !== 'all' && prompt.category !== activeCategory.value) {
          return false;
        }
        
        // 搜索过滤
        if (searchQuery.value) {
          const query = searchQuery.value.toLowerCase();
          return (
            prompt.title.toLowerCase().includes(query) ||
            prompt.description.toLowerCase().includes(query) ||
            prompt.template.toLowerCase().includes(query)
          );
        }
        
        return true;
      });
    });
    
    // 使用提示
    const usePrompt = (prompt) => {
      emit('use-prompt', prompt.template);
      ElMessage({
        message: `已选择提示模板: ${prompt.title}`,
        type: 'success',
        offset: 60
      });
    };
    
    // 复制提示
    const copyPrompt = (template) => {
      navigator.clipboard.writeText(template)
        .then(() => {
          ElMessage({
            message: '提示模板已复制到剪贴板',
            type: 'success',
            offset: 60
          });
        })
        .catch(() => {
          ElMessage.error('复制失败，请手动复制');
        });
    };
    
    // 显示添加提示对话框
    const showAddPromptDialog = () => {
      currentPrompt.value = {
        id: Date.now().toString(),
        title: '',
        category: 'general',
        description: '',
        template: ''
      };
      isNewPrompt.value = true;
      showEditDialog.value = true;
    };
    
    // 编辑提示
    const editPrompt = (prompt) => {
      currentPrompt.value = { ...prompt };
      isNewPrompt.value = false;
      showEditDialog.value = true;
    };
    
    // 保存提示
    const savePrompt = () => {
      if (!currentPrompt.value.title || !currentPrompt.value.template) {
        ElMessage.warning('标题和提示模板不能为空');
        return;
      }
      
      if (isNewPrompt.value) {
        // 添加新提示
        const newPrompt = {
          ...currentPrompt.value,
          id: Date.now().toString()
        };
        prompts.value.push(newPrompt);
      } else {
        // 更新现有提示
        const index = prompts.value.findIndex(p => p.id === currentPrompt.value.id);
        if (index !== -1) {
          prompts.value[index] = { ...currentPrompt.value };
        }
      }
      
      // 保存到本地存储
      savePromptsToStorage();
      
      showEditDialog.value = false;
      ElMessage({
        message: isNewPrompt.value ? '提示模板已添加' : '提示模板已更新',
        type: 'success',
        offset: 60
      });
    };
    
    // 保存提示到本地存储
    const savePromptsToStorage = () => {
      try {
        localStorage.setItem('promptLibrary', JSON.stringify(prompts.value));
      } catch (error) {
        console.error('保存提示库失败:', error);
      }
    };
    
    // 从本地存储加载提示
    const loadPromptsFromStorage = () => {
      try {
        const savedPrompts = localStorage.getItem('promptLibrary');
        if (savedPrompts) {
          prompts.value = JSON.parse(savedPrompts);
        }
      } catch (error) {
        console.error('加载提示库失败:', error);
      }
    };
    
    onMounted(() => {
      loadPromptsFromStorage();
    });
    
    return {
      searchQuery,
      activeCategory,
      categories,
      prompts,
      filteredPrompts,
      showEditDialog,
      isNewPrompt,
      currentPrompt,
      getCategoryName,
      getCategoryType,
      usePrompt,
      copyPrompt,
      showAddPromptDialog,
      editPrompt,
      savePrompt
    };
  }
};
</script>

<style>
.prompt-library {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.prompt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 18px;
  font-weight: 500;
  margin: 0;
  color: var(--md-text-primary);
  position: relative;
  display: flex;
  align-items: center;
}

.section-title::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 18px;
  background: linear-gradient(to bottom, var(--md-primary-main), var(--md-primary-dark));
  border-radius: 2px;
  margin-right: 8px;
}

.prompt-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-input {
  width: 220px;
}

.prompt-categories {
  margin-bottom: 20px;
  overflow-x: auto;
  white-space: nowrap;
  padding-bottom: 8px;
  scrollbar-width: thin;
}

.prompt-categories::-webkit-scrollbar {
  height: 4px;
}

.prompt-categories::-webkit-scrollbar-track {
  background: transparent;
}

.prompt-categories::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
}

.prompts-container {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.prompts-scroll-container {
  height: 100%;
  overflow-y: auto;
  padding-right: 8px;
  scrollbar-width: thin;
}

.prompts-scroll-container::-webkit-scrollbar {
  width: 6px;
}

.prompts-scroll-container::-webkit-scrollbar-track {
  background: transparent;
}

.prompts-scroll-container::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.prompts-scroll-container::-webkit-scrollbar-thumb:hover {
  background-color: rgba(0, 0, 0, 0.3);
}

.prompt-card {
  margin-bottom: 16px;
  border-radius: var(--md-radius-md);
  overflow: hidden;
  box-shadow: var(--md-shadow-sm);
  transition: box-shadow var(--md-transition-duration-short) var(--md-transition-easing-standard),
              transform var(--md-transition-duration-short) var(--md-transition-easing-standard);
}

.prompt-card:hover {
  box-shadow: var(--md-shadow-md);
  transform: translateY(-2px);
}

.prompt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.prompt-title {
  font-weight: 500;
  font-size: 16px;
  color: var(--md-text-primary);
}

.category-tag {
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  font-size: 11px;
}

.prompt-description {
  color: var(--md-text-secondary);
  margin-bottom: 16px;
  line-height: 1.5;
}

.prompt-template {
  background-color: var(--md-background-default);
  border-radius: var(--md-radius-sm);
  padding: 12px;
  margin-bottom: 16px;
}

.template-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--md-text-primary);
}

.copy-btn {
  color: var(--md-primary-main);
  transition: color var(--md-transition-duration-short) var(--md-transition-easing-standard);
}

.copy-btn:hover {
  color: var(--md-primary-dark);
}

.template-content {
  font-family: monospace;
  white-space: pre-wrap;
  color: var(--md-text-secondary);
  font-size: 14px;
  line-height: 1.6;
  max-height: 120px;
  overflow-y: auto;
  padding: 8px;
  background-color: var(--md-background-paper);
  border-radius: var(--md-radius-sm);
  border: 1px solid var(--md-divider);
}

.prompt-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.edit-btn {
  color: var(--md-text-secondary);
  transition: color var(--md-transition-duration-short) var(--md-transition-easing-standard),
              transform var(--md-transition-duration-short) var(--md-transition-easing-standard);
}

.edit-btn:hover {
  color: var(--md-primary-main);
  transform: scale(1.1);
}
</style>
