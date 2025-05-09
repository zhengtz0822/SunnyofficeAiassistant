<template>
  <div class="preset-tools">
    <div class="tools-header">
      <h3 class="section-title">通用工具</h3>
      <el-input
        v-model="searchQuery"
        placeholder="搜索工具..."
        prefix-icon="Search"
        clearable
        class="search-input"
      />
    </div>
    
    <div class="tools-grid">
      <el-card 
        v-for="tool in filteredTools" 
        :key="tool.id" 
        class="tool-card"
        shadow="hover"
        @click="activateTool(tool)"
      >
        <div class="tool-icon" :style="{ backgroundColor: tool.color }">
          <el-icon><component :is="tool.icon" /></el-icon>
        </div>
        <div class="tool-info">
          <h4 class="tool-title">{{ tool.title }}</h4>
          <p class="tool-description">{{ tool.description }}</p>
        </div>
      </el-card>
    </div>
    
    <h3 class="section-title">最近使用</h3>
    <div class="recent-tools">
      <el-empty v-if="recentTools.length === 0" description="暂无最近使用的工具" />
      <div v-else class="recent-tools-list">
        <div 
          v-for="tool in recentTools" 
          :key="tool.id" 
          class="recent-tool-item"
          @click="activateTool(tool)"
        >
          <div class="recent-tool-icon" :style="{ backgroundColor: tool.color }">
            <el-icon><component :is="tool.icon" /></el-icon>
          </div>
          <span class="recent-tool-title">{{ tool.title }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { 
  Document, 
  DataAnalysis, 
  PictureFilled, 
  EditPen, 
  Reading, 
  Histogram, 
  Promotion, 
  Search,
  Refresh
} from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

export default {
  name: 'PresetTools',
  components: {
    Document, 
    DataAnalysis, 
    PictureFilled, 
    EditPen, 
    Reading, 
    Histogram, 
    Promotion, 
    Search,
    Refresh
  },
  setup() {
    const searchQuery = ref('');
    
    const tools = ref([
      {
        id: 'summarize',
        title: '文档摘要',
        description: '自动生成文档内容的摘要',
        icon: 'Reading',
        color: '#0ea5e9'
      },
      {
        id: 'analyze',
        title: '数据分析',
        description: '分析数据并提供洞察',
        icon: 'DataAnalysis',
        color: '#8b5cf6'
      },
      {
        id: 'visualize',
        title: '数据可视化',
        description: '创建图表和可视化展示',
        icon: 'Histogram',
        color: '#10b981'
      },
      {
        id: 'generate',
        title: '内容生成',
        description: '生成文本、表格或图表',
        icon: 'EditPen',
        color: '#f59e0b'
      },
      {
        id: 'image',
        title: '图像处理',
        description: '处理和优化文档中的图像',
        icon: 'PictureFilled',
        color: '#ef4444'
      },
      {
        id: 'search',
        title: '智能搜索',
        description: '在文档中搜索并提取信息',
        icon: 'Search',
        color: '#1e293b'
      },
      {
        id: 'format',
        title: '格式化工具',
        description: '优化文档格式和样式',
        icon: 'Document',
        color: '#0ea5e9'
      },
      {
        id: 'refresh',
        title: '刷新数据',
        description: '刷新和更新文档数据',
        icon: 'Refresh',
        color: '#8b5cf6'
      }
    ]);
    
    const recentTools = ref([]);
    
    // 过滤工具
    const filteredTools = computed(() => {
      if (!searchQuery.value) return tools.value;
      
      const query = searchQuery.value.toLowerCase();
      return tools.value.filter(tool => 
        tool.title.toLowerCase().includes(query) || 
        tool.description.toLowerCase().includes(query)
      );
    });
    
    // 激活工具
    const activateTool = (tool) => {
      ElMessage({
        message: `已启动工具: ${tool.title}`,
        type: 'success',
        offset: 60
      });
      
      // 添加到最近使用
      const existingIndex = recentTools.value.findIndex(t => t.id === tool.id);
      if (existingIndex !== -1) {
        // 如果已存在，移除旧的
        recentTools.value.splice(existingIndex, 1);
      }
      
      // 添加到最前面
      recentTools.value.unshift(tool);
      
      // 限制最近使用数量
      if (recentTools.value.length > 5) {
        recentTools.value = recentTools.value.slice(0, 5);
      }
      
      // 保存到本地存储
      saveRecentTools();
    };
    
    // 保存最近使用的工具
    const saveRecentTools = () => {
      try {
        localStorage.setItem('recentTools', JSON.stringify(recentTools.value.map(t => t.id)));
      } catch (error) {
        console.error('保存最近工具失败:', error);
      }
    };
    
    // 加载最近使用的工具
    const loadRecentTools = () => {
      try {
        const savedRecentTools = localStorage.getItem('recentTools');
        if (savedRecentTools) {
          const recentToolIds = JSON.parse(savedRecentTools);
          recentTools.value = recentToolIds
            .map(id => tools.value.find(t => t.id === id))
            .filter(Boolean);
        }
      } catch (error) {
        console.error('加载最近工具失败:', error);
      }
    };
    
    onMounted(() => {
      loadRecentTools();
    });
    
    return {
      searchQuery,
      tools,
      filteredTools,
      recentTools,
      activateTool
    };
  }
};
</script>

<style>
.preset-tools {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tools-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.search-input {
  width: 200px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: var(--text-primary);
  position: relative;
  display: flex;
  align-items: center;
}

.section-title::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 16px;
  background: linear-gradient(to bottom, #0ea5e9, #0284c7);
  border-radius: 2px;
  margin-right: 8px;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
  overflow-y: auto;
  flex: 1;
}

.tool-card {
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  display: flex;
  flex-direction: column;
}

.tool-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.tool-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  color: white;
  font-size: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.tool-info {
  flex: 1;
}

.tool-title {
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 6px 0;
  color: var(--text-primary);
}

.tool-description {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.4;
}

.recent-tools {
  margin-bottom: 16px;
  max-height: 80px;
  overflow-y: auto;
}

.recent-tools-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.recent-tool-item {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  background-color: #f1f5f9;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
}

.recent-tool-item:hover {
  background-color: #e2e8f0;
  transform: translateY(-1px);
}

.recent-tool-icon {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  color: white;
  font-size: 14px;
}

.recent-tool-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}
</style>
