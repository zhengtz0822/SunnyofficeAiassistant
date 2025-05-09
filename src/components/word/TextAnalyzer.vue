<template>
  <div class="text-analyzer">
    <h2 class="module-title">Word文档分析</h2>
    
    <el-tabs v-model="activeTab" class="word-tabs">
      <el-tab-pane label="文本分析" name="textAnalysis">
        <div class="text-analysis-content">
          <div class="content-info">
            <el-descriptions title="文档信息" :column="1" border>
              <el-descriptions-item label="文档长度">{{ documentStats.characterCount }} 字符</el-descriptions-item>
              <el-descriptions-item label="单词数量">{{ documentStats.wordCount }} 个</el-descriptions-item>
              <el-descriptions-item label="段落数量">{{ documentStats.paragraphCount }} 个</el-descriptions-item>
              <el-descriptions-item label="页数">{{ documentStats.pageCount }} 页</el-descriptions-item>
            </el-descriptions>
            
            <el-divider>文本分析</el-divider>
            
            <el-button-group>
              <el-button type="primary" @click="analyzeText('readability')" :loading="isAnalyzing">
                可读性分析
              </el-button>
              <el-button type="primary" @click="analyzeText('sentiment')" :loading="isAnalyzing">
                情感分析
              </el-button>
              <el-button type="primary" @click="analyzeText('keywords')" :loading="isAnalyzing">
                关键词提取
              </el-button>
            </el-button-group>
            
            <div v-if="isAnalyzing" class="analysis-loading">
              <el-skeleton :rows="5" animated />
            </div>
            
            <div v-if="textAnalysisResult && !isAnalyzing" class="analysis-result">
              <h3>{{ textAnalysisResult.title }}</h3>
              
              <!-- 可读性分析结果 -->
              <template v-if="textAnalysisResult.type === 'readability'">
                <el-progress 
                  :percentage="textAnalysisResult.score" 
                  :status="getReadabilityStatus(textAnalysisResult.score)"
                  :stroke-width="18"
                ></el-progress>
                <p class="result-summary">{{ textAnalysisResult.summary }}</p>
                
                <div v-if="textAnalysisResult.details" class="result-details">
                  <el-descriptions :column="2" border>
                    <el-descriptions-item v-for="(value, key) in textAnalysisResult.details" 
                                       :key="key" :label="key">
                      {{ value }}
                    </el-descriptions-item>
                  </el-descriptions>
                </div>
                
                <div v-if="textAnalysisResult.suggestions" class="result-suggestions">
                  <h4>改进建议</h4>
                  <el-alert
                    v-for="(suggestion, index) in textAnalysisResult.suggestions"
                    :key="index"
                    :title="suggestion.title"
                    :type="suggestion.type"
                    :description="suggestion.description"
                    show-icon
                    :closable="false"
                    class="suggestion-item"
                  ></el-alert>
                </div>
              </template>
              
              <!-- 情感分析结果 -->
              <template v-if="textAnalysisResult.type === 'sentiment'">
                <div class="sentiment-gauge">
                  <el-progress type="dashboard" :percentage="textAnalysisResult.score" :color="getSentimentColor"></el-progress>
                  <p class="sentiment-label">{{ getSentimentLabel(textAnalysisResult.score) }}</p>
                </div>
                
                <p class="result-summary">{{ textAnalysisResult.summary }}</p>
                
                <div v-if="textAnalysisResult.details" class="result-details">
                  <h4>详细分析</h4>
                  <el-table :data="textAnalysisResult.details.segments" style="width: 100%">
                    <el-table-column prop="text" label="文本片段" width="250"></el-table-column>
                    <el-table-column prop="sentiment" label="情感倾向">
                      <template #default="scope">
                        <el-tag :type="getSentimentTagType(scope.row.score)">
                          {{ scope.row.sentiment }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column prop="score" label="分数"></el-table-column>
                  </el-table>
                </div>
              </template>
              
              <!-- 关键词提取结果 -->
              <template v-if="textAnalysisResult.type === 'keywords'">
                <div class="keywords-cloud">
                  <el-tag
                    v-for="(keyword, index) in textAnalysisResult.keywords"
                    :key="index"
                    :style="{fontSize: getKeywordSize(keyword.weight)}"
                    class="keyword-tag"
                  >
                    {{ keyword.text }} ({{ keyword.count }})
                  </el-tag>
                </div>
                
                <p class="result-summary">{{ textAnalysisResult.summary }}</p>
                
                <div v-if="textAnalysisResult.topics" class="result-topics">
                  <h4>检测到的主题</h4>
                  <el-tag
                    v-for="(topic, index) in textAnalysisResult.topics"
                    :key="index"
                    type="success"
                    class="topic-tag"
                  >
                    {{ topic }}
                  </el-tag>
                </div>
              </template>
            </div>
          </div>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="文档生成" name="documentGeneration">
        <div class="document-generation">
          <el-form label-position="top">
            <el-form-item label="生成类型">
              <el-radio-group v-model="generationType">
                <el-radio label="summary">内容摘要</el-radio>
                <el-radio label="outline">文档大纲</el-radio>
                <el-radio label="revision">润色修订</el-radio>
              </el-radio-group>
            </el-form-item>
            
            <el-form-item label="选项">
              <el-checkbox v-model="generationOptions.replaceDocument">
                替换当前文档
              </el-checkbox>
              <el-checkbox v-model="generationOptions.insertAtCursor">
                在光标处插入
              </el-checkbox>
              <el-checkbox v-model="generationOptions.formatOutput">
                自动格式化
              </el-checkbox>
            </el-form-item>
            
            <el-form-item label="其他参数" v-if="generationType === 'summary'">
              <el-slider 
                v-model="generationOptions.summaryLength" 
                :min="10" 
                :max="50" 
                :step="5"
                :format-tooltip="value => `${value}%`"
              >
                <template #default="{ value }">
                  <div>摘要长度: {{ value }}%</div>
                </template>
              </el-slider>
            </el-form-item>
            
            <el-form-item>
              <el-button 
                type="primary" 
                @click="generateDocument" 
                :loading="isGenerating"
                :disabled="!generationType"
              >
                开始生成
              </el-button>
            </el-form-item>
          </el-form>
          
          <div v-if="isGenerating" class="generation-loading">
            <el-skeleton :rows="8" animated />
          </div>
          
          <div v-if="generatedContent && !isGenerating" class="generated-content">
            <div class="content-header">
              <h3>{{ getGenerationTitle() }}</h3>
              <div class="content-actions">
                <el-button size="small" @click="applyGeneratedContent">
                  应用到文档
                </el-button>
                <el-button size="small" @click="copyGeneratedContent">
                  复制
                </el-button>
              </div>
            </div>
            
            <div class="content-preview">
              <pre>{{ generatedContent }}</pre>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';

export default {
  name: 'TextAnalyzer',
  setup() {
    const activeTab = ref('textAnalysis');
    const isAnalyzing = ref(false);
    const textAnalysisResult = ref(null);
    
    // 文档统计信息
    const documentStats = ref({
      characterCount: 0,
      wordCount: 0,
      paragraphCount: 0,
      pageCount: 0
    });
    
    // 文档生成相关状态
    const generationType = ref('summary');
    const generationOptions = ref({
      replaceDocument: false,
      insertAtCursor: true,
      formatOutput: true,
      summaryLength: 25 // 默认摘要长度为原文的25%
    });
    const isGenerating = ref(false);
    const generatedContent = ref(null);
    
    // 初始化
    onMounted(() => {
      // 获取文档统计信息
      getDocumentStats();
    });
    
    // 获取文档统计信息
    const getDocumentStats = async () => {
      try {
        // 使用Word API获取文档信息
        await Word.run(async (context) => {
          const body = context.document.body;
          body.load("text");
          
          await context.sync();
          
          const text = body.text;
          documentStats.value = {
            characterCount: text.length,
            wordCount: estimateWordCount(text),
            paragraphCount: estimateParagraphCount(text),
            pageCount: estimatePageCount(text)
          };
        });
      } catch (error) {
        console.error('获取文档统计信息失败:', error);
        // 模拟数据，在实际项目中移除
        simulateDocumentStats();
      }
    };
    
    // 估算单词数量
    const estimateWordCount = (text) => {
      return text.split(/\s+/).filter(word => word.length > 0).length;
    };
    
    // 估算段落数量
    const estimateParagraphCount = (text) => {
      return text.split(/\n\s*\n/).length;
    };
    
    // 估算页数
    const estimatePageCount = (text) => {
      // 假设一页约2000字符
      return Math.max(1, Math.ceil(text.length / 2000));
    };
    
    // 模拟文档统计信息（用于开发测试）
    const simulateDocumentStats = () => {
      documentStats.value = {
        characterCount: 3520,
        wordCount: 584,
        paragraphCount: 12,
        pageCount: 2
      };
    };
    
    // 获取可读性状态
    const getReadabilityStatus = (score) => {
      if (score < 40) return 'exception';
      if (score < 70) return 'warning';
      return 'success';
    };
    
    // 获取情感颜色
    const getSentimentColor = (percentage) => {
      if (percentage < 30) return '#F56C6C'; // 负面
      if (percentage < 60) return '#E6A23C'; // 中性
      return '#67C23A'; // 正面
    };
    
    // 获取情感标签
    const getSentimentLabel = (score) => {
      if (score < 30) return '负面';
      if (score < 60) return '中性';
      return '正面';
    };
    
    // 获取情感标签类型
    const getSentimentTagType = (score) => {
      if (score < 30) return 'danger';
      if (score < 60) return 'warning';
      return 'success';
    };
    
    // 获取关键词大小
    const getKeywordSize = (weight) => {
      return `${Math.max(12, Math.min(24, 12 + weight * 12))}px`;
    };
    
    // 分析文本
    const analyzeText = (analysisType) => {
      isAnalyzing.value = true;
      
      // 模拟分析过程
      setTimeout(() => {
        switch (analysisType) {
          case 'readability':
            simulateReadabilityAnalysis();
            break;
          case 'sentiment':
            simulateSentimentAnalysis();
            break;
          case 'keywords':
            simulateKeywordsAnalysis();
            break;
        }
        
        isAnalyzing.value = false;
      }, 1500);
    };
    
    // 模拟可读性分析
    const simulateReadabilityAnalysis = () => {
      textAnalysisResult.value = {
        type: 'readability',
        title: '文档可读性分析',
        score: 75,
        summary: '您的文档可读性较好，适合一般读者阅读。有一些地方可以改进以提高清晰度。',
        details: {
          '平均句长': '15.3个词',
          '平均段落长度': '4.2个句子',
          '复杂词比例': '8.5%',
          '被动语态使用率': '12.3%',
          '专业术语密度': '低'
        },
        suggestions: [
          {
            title: '减少长句使用',
            type: 'warning',
            description: '您的文档中有3个句子超过30个词，考虑将它们分解为更简短的句子。'
          },
          {
            title: '考虑减少被动语态',
            type: 'info',
            description: '适当减少被动语态的使用可以使文档更加直接和清晰。'
          }
        ]
      };
    };
    
    // 模拟情感分析
    const simulateSentimentAnalysis = () => {
      textAnalysisResult.value = {
        type: 'sentiment',
        title: '文档情感分析',
        score: 65,
        summary: '您的文档整体呈现偏正面的情感倾向，传达了积极的信息和观点。',
        details: {
          segments: [
            { 
              text: '第一段落的内容...',
              sentiment: '正面',
              score: 78 
            },
            { 
              text: '第二段落的内容...',
              sentiment: '中性',
              score: 52 
            },
            { 
              text: '第三段落的内容...',
              sentiment: '负面',
              score: 28 
            },
            { 
              text: '第四段落的内容...',
              sentiment: '强烈正面',
              score: 85 
            }
          ]
        }
      };
    };
    
    // 模拟关键词提取
    const simulateKeywordsAnalysis = () => {
      textAnalysisResult.value = {
        type: 'keywords',
        title: '关键词提取',
        summary: '根据您的文档内容，我们提取了以下关键词和主题。',
        keywords: [
          { text: '人工智能', count: 12, weight: 1.0 },
          { text: '机器学习', count: 8, weight: 0.8 },
          { text: '数据分析', count: 7, weight: 0.7 },
          { text: '神经网络', count: 5, weight: 0.6 },
          { text: '自然语言处理', count: 5, weight: 0.6 },
          { text: '深度学习', count: 4, weight: 0.5 },
          { text: '算法', count: 4, weight: 0.5 },
          { text: '计算机视觉', count: 3, weight: 0.4 },
          { text: '大数据', count: 3, weight: 0.4 },
          { text: '技术发展', count: 2, weight: 0.3 }
        ],
        topics: [
          '人工智能技术',
          '机器学习应用',
          '数据科学',
          '技术创新'
        ]
      };
    };
    
    // 获取生成标题
    const getGenerationTitle = () => {
      switch (generationType.value) {
        case 'summary':
          return '文档摘要';
        case 'outline':
          return '文档大纲';
        case 'revision':
          return '润色修订';
        default:
          return '生成内容';
      }
    };
    
    // 生成文档
    const generateDocument = () => {
      if (!generationType.value) {
        ElMessage.warning('请选择生成类型');
        return;
      }
      
      isGenerating.value = true;
      
      // 模拟生成过程
      setTimeout(() => {
        switch (generationType.value) {
          case 'summary':
            generateSummary();
            break;
          case 'outline':
            generateOutline();
            break;
          case 'revision':
            generateRevision();
            break;
        }
        
        isGenerating.value = false;
      }, 2000);
    };
    
    // 生成摘要
    const generateSummary = () => {
      generatedContent.value = `这是一份自动生成的文档摘要，长度为原文的${generationOptions.value.summaryLength}%。

本文档主要讨论了人工智能技术在现代社会中的应用和影响。文章首先介绍了AI的基本概念和发展历程，然后详细分析了机器学习、深度学习和神经网络等核心技术。

文章强调了AI在医疗、金融、教育和交通等领域的创新应用，并探讨了这些技术带来的社会变革。同时也指出了AI发展面临的伦理和隐私挑战，以及需要建立的监管框架。

作者认为，尽管AI技术存在一些风险，但其潜在的积极影响远远超过了负面因素，人类应该拥抱这一技术革命并积极引导其向更加公平、透明的方向发展。`;
    };
    
    // 生成大纲
    const generateOutline = () => {
      generatedContent.value = `# 人工智能技术与应用

## 1. 引言
   - 1.1 人工智能的定义与范围
   - 1.2 历史发展与技术突破
   - 1.3 研究现状概述

## 2. 核心技术
   - 2.1 机器学习原理
     - 2.1.1 监督学习
     - 2.1.2 无监督学习
     - 2.1.3 强化学习
   - 2.2 深度学习与神经网络
     - 2.2.1 卷积神经网络
     - 2.2.2 循环神经网络
     - 2.2.3 注意力机制
   - 2.3 自然语言处理
   - 2.4 计算机视觉

## 3. 应用领域
   - 3.1 医疗健康
   - 3.2 金融服务
   - 3.3 教育科研
   - 3.4 智能交通
   - 3.5 其他领域应用

## 4. 社会影响
   - 4.1 就业市场变革
   - 4.2 伦理与隐私问题
   - 4.3 社会不平等

## 5. 未来展望
   - 5.1 技术发展趋势
   - 5.2 政策与监管框架
   - 5.3 人与AI共存的社会愿景

## 6. 结论

## 7. 参考文献`;
    };
    
    // 生成润色修订
    const generateRevision = () => {
      generatedContent.value = `原文：
AI技术在现今社会中被广泛的应用，有着很大的影响。我们可以看到机器学习、深度学习和神经网络这些技术的发展。这些技术被用在医疗，金融，教育，交通等领域。但是这些技术也带来了一些问题，比如说伦理和隐私方面的挑战，我们需要建立监管框架。

润色后：
人工智能技术在当代社会中已得到广泛应用，并产生了深远的影响。我们见证了机器学习、深度学习和神经网络等核心技术的飞速发展。这些创新技术已成功融入医疗、金融、教育和交通等多个关键领域，显著提升了服务效率和质量。

然而，技术进步的同时也伴随着伦理和隐私方面的重大挑战。为保障技术发展的健康与公正，建立完善的监管框架已成为当务之急。只有在确保安全与尊重个人权利的前提下，人工智能才能真正实现其改善人类生活的承诺。`;
    };
    
    // 应用生成内容到文档
    const applyGeneratedContent = () => {
      ElMessage.info('将生成内容应用到文档（实际项目中应调用Word API）');
      // 实际项目中应使用Word API将内容应用到文档
    };
    
    // 复制生成内容
    const copyGeneratedContent = () => {
      // 创建临时文本区域并复制内容
      const textArea = document.createElement('textarea');
      textArea.value = generatedContent.value;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      ElMessage.success('已复制到剪贴板');
    };
    
    return {
      // 文本分析相关
      activeTab,
      documentStats,
      isAnalyzing,
      textAnalysisResult,
      analyzeText,
      getReadabilityStatus,
      getSentimentColor,
      getSentimentLabel,
      getSentimentTagType,
      getKeywordSize,
      
      // 文档生成相关
      generationType,
      generationOptions,
      isGenerating,
      generatedContent,
      generateDocument,
      getGenerationTitle,
      applyGeneratedContent,
      copyGeneratedContent
    };
  }
};
</script>

<style>
.text-analyzer {
  padding: 10px;
}

.module-title {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 18px;
  color: #409EFF;
  border-bottom: 1px solid #EBEEF5;
  padding-bottom: 10px;
}

.word-tabs {
  margin-top: 15px;
}

.text-analysis-content {
  padding: 10px;
}

.content-info {
  margin-bottom: 20px;
}

.analysis-loading {
  margin-top: 20px;
}

.analysis-result {
  margin-top: 20px;
  border: 1px solid #EBEEF5;
  border-radius: 4px;
  padding: 15px;
  background-color: #F9FAFC;
}

.result-summary {
  margin: 15px 0;
  font-size: 14px;
  line-height: 1.5;
}

.result-details {
  margin-top: 15px;
}

.result-suggestions {
  margin-top: 20px;
}

.suggestion-item {
  margin-bottom: 10px;
}

.sentiment-gauge {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 10px 0;
}

.sentiment-label {
  margin-top: 10px;
  font-size: 16px;
  font-weight: bold;
}

.keywords-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 15px 0;
  padding: 15px;
  background-color: #F5F7FA;
  border-radius: 4px;
}

.keyword-tag {
  transition: all 0.3s ease;
}

.keyword-tag:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.topic-tag {
  margin-right: 10px;
  margin-bottom: 10px;
}

.document-generation {
  padding: 10px;
}

.generation-loading {
  margin-top: 20px;
}

.generated-content {
  margin-top: 20px;
  border: 1px solid #EBEEF5;
  border-radius: 4px;
  background-color: #F9FAFC;
  overflow: hidden;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background-color: #F5F7FA;
  border-bottom: 1px solid #EBEEF5;
}

.content-header h3 {
  margin: 0;
}

.content-actions {
  display: flex;
  gap: 10px;
}

.content-preview {
  padding: 15px;
  max-height: 400px;
  overflow-y: auto;
}

.content-preview pre {
  white-space: pre-wrap;
  font-family: 'Microsoft YaHei', 'Segoe UI', sans-serif;
  margin: 0;
  line-height: 1.6;
}
</style>