<template>
  <div class="excel-analyzer">
    <h2 class="module-title">Excel数据分析</h2>
    
    <el-tabs v-model="activeTab" class="excel-tabs">
      <el-tab-pane label="数据分析" name="dataAnalysis">
        <div class="tab-content">
          <div class="panel-container">
            <div class="control-panel">
              <el-card class="panel-card">
                <template #header>
                  <div class="card-header">
                    <span>分析控制面板</span>
                  </div>
                </template>
                <el-form label-position="top">
                  <el-form-item label="当前选中区域">
                    <div class="selection-info">
                      <el-tag v-if="currentSelection" size="large">{{ currentSelection }}</el-tag>
                      <el-tag v-else type="info" size="large">未选择数据区域</el-tag>
                      <el-button size="small" @click="refreshSelection" :loading="isRefreshing" class="refresh-btn">
                        <el-icon><Refresh /></el-icon> 刷新
                      </el-button>
                    </div>
                  </el-form-item>
                  
                  <el-form-item label="分析类型">
                    <el-select v-model="analysisType" placeholder="请选择分析类型" class="full-width">
                      <el-option label="描述性统计" value="descriptive">
                        <div class="option-content">
                          <el-icon><DataAnalysis /></el-icon>
                          <span>描述性统计</span>
                        </div>
                      </el-option>
                      <el-option label="相关性分析" value="correlation">
                        <div class="option-content">
                          <el-icon><Connection /></el-icon>
                          <span>相关性分析</span>
                        </div>
                      </el-option>
                      <el-option label="趋势分析" value="trend">
                        <div class="option-content">
                          <el-icon><TrendCharts /></el-icon>
                          <span>趋势分析</span>
                        </div>
                      </el-option>
                      <el-option label="异常值检测" value="outliers">
                        <div class="option-content">
                          <el-icon><Warning /></el-icon>
                          <span>异常值检测</span>
                        </div>
                      </el-option>
                    </el-select>
                  </el-form-item>
                  
                  <el-form-item>
                    <el-button type="primary" @click="runAnalysis" :disabled="!currentSelection || isAnalyzing" class="full-width">
                      <el-icon v-if="isAnalyzing"><Loading /></el-icon>
                      <el-icon v-else><DataAnalysis /></el-icon>
                      {{ isAnalyzing ? '分析中...' : '运行分析' }}
                    </el-button>
                  </el-form-item>
                </el-form>
              </el-card>
            </div>
            
            <div class="result-panel">
              <div v-if="isAnalyzing" class="analysis-loading">
                <div class="loading-container">
                  <el-icon class="loading-icon"><Loading /></el-icon>
                  <span>正在分析数据，请稍候...</span>
                </div>
                <el-skeleton :rows="6" animated />
              </div>
              
              <div v-else-if="analysisResult" class="analysis-result">
                <el-card class="result-card">
                  <template #header>
                    <div class="card-header">
                      <span>分析结果</span>
                      <el-button type="primary" size="small" @click="exportResult">
                        <el-icon><Download /></el-icon> 导出
                      </el-button>
                    </div>
                  </template>
                  
                  <el-descriptions border :column="1" class="result-summary">
                    <el-descriptions-item v-for="(value, key) in analysisResult.summary" 
                                      :key="key" :label="key">
                      {{ value }}
                    </el-descriptions-item>
                  </el-descriptions>
                  
                  <div v-if="analysisResult.insights && analysisResult.insights.length" class="insights-section">
                    <h4 class="section-title">数据洞察</h4>
                    <el-collapse accordion>
                      <el-collapse-item v-for="(insight, index) in analysisResult.insights" 
                                    :key="index" :name="index">
                        <template #title>
                          <div class="insight-header">
                            <el-icon v-if="insight.type === 'success'"><SuccessFilled /></el-icon>
                            <el-icon v-else-if="insight.type === 'warning'"><WarningFilled /></el-icon>
                            <el-icon v-else-if="insight.type === 'info'"><InfoFilled /></el-icon>
                            <span>{{ insight.title }}</span>
                            <el-tag :type="insight.type" size="small" class="confidence-tag">{{ insight.confidence }}</el-tag>
                          </div>
                        </template>
                        <div class="insight-content">
                          <p>{{ insight.description }}</p>
                          <div v-if="insight.recommendation" class="recommendation">
                            <strong>建议：</strong> {{ insight.recommendation }}
                            <el-button v-if="insight.action" size="small" type="primary" @click="executeAction(insight.action)">
                              应用建议
                            </el-button>
                          </div>
                        </div>
                      </el-collapse-item>
                    </el-collapse>
                  </div>
                </el-card>
              </div>
              
              <div v-else class="no-result">
                <el-empty description="尚未进行分析" :image-size="120">
                  <template #description>
                    <p>请选择数据区域并点击"运行分析"按钮</p>
                  </template>
                </el-empty>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="图表推荐" name="chartRecommendation">
        <div class="tab-content">
          <div v-if="!currentSelection" class="no-selection-message">
            <el-empty description="未选择数据区域" :image-size="120">
              <template #description>
                <p>请在Excel中选择一个数据区域以获取图表推荐</p>
              </template>
              <el-button type="primary" @click="refreshSelection">选择数据</el-button>
            </el-empty>
          </div>
          
          <div v-else>
            <div class="selection-header">
              <h3>基于数据区域: <el-tag size="large">{{ currentSelection }}</el-tag></h3>
              <el-button type="primary" size="small" @click="refreshSelection">
                <el-icon><Refresh /></el-icon> 刷新选择
              </el-button>
            </div>
            
            <div class="chart-recommendations">
              <el-row :gutter="20">
                <el-col :span="8" v-for="(chart, index) in chartRecommendations" :key="index">
                  <el-card class="chart-card" :body-style="{ padding: '0px' }">
                    <div class="chart-image">
                      <el-image 
                        :src="chart.previewUrl || 'https://via.placeholder.com/300x150?text=Chart+Preview'"
                        fit="cover"
                      />
                      <div class="chart-type-badge">
                        <el-tag>{{ chart.type }}</el-tag>
                      </div>
                    </div>
                    <div class="chart-info">
                      <h4>{{ chart.title }}</h4>
                      <p>{{ chart.description }}</p>
                      <div class="chart-actions">
                        <el-button type="primary" @click="createChart(chart)">
                          <el-icon><PieChart /></el-icon> 创建图表
                        </el-button>
                        <el-button type="info" @click="previewChart(chart)">
                          <el-icon><View /></el-icon> 预览
                        </el-button>
                      </div>
                    </div>
                  </el-card>
                </el-col>
              </el-row>
            </div>
          </div>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="公式助手" name="formulaAssistant">
        <div class="tab-content formula-assistant-content">
          <el-row :gutter="20" class="formula-input-row">
            <el-col :span="12">
              <el-card class="formula-input-card">
                <template #header>
                  <div class="card-header">
                    <span>公式需求</span>
                  </div>
                </template>
                <el-form label-position="top">
                  <el-form-item label="用自然语言描述您需要的Excel公式">
                    <el-input 
                      v-model="formulaQuery" 
                      type="textarea" 
                      :rows="5" 
                      placeholder="例如：'计算A列中所有大于100的值的平均数'"
                      class="formula-textarea"
                    />
                  </el-form-item>
                  
                  <el-form-item label="相关单元格范围（可选）">
                    <el-input v-model="formulaRange" placeholder="例如：A1:D10" />
                  </el-form-item>
                  
                  <el-form-item>
                    <el-button type="primary" @click="generateFormula" :loading="isGeneratingFormula" class="full-width">
                      <el-icon v-if="!isGeneratingFormula"><MagicStick /></el-icon>
                      <el-icon v-else><Loading /></el-icon>
                      {{ isGeneratingFormula ? '生成中...' : '生成公式' }}
                    </el-button>
                  </el-form-item>
                </el-form>
              </el-card>
            </el-col>
            
            <el-col :span="12">
              <el-card v-if="formulaResult" class="formula-result-card">
                <template #header>
                  <div class="card-header">
                    <span>推荐公式</span>
                    <div class="header-actions">
                      <el-button size="small" @click="copyFormula(formulaResult.formula)">
                        <el-icon><CopyDocument /></el-icon> 复制
                      </el-button>
                      <el-button size="small" type="primary" @click="applyFormula(formulaResult.formula)">
                        <el-icon><Check /></el-icon> 应用
                      </el-button>
                    </div>
                  </div>
                </template>
                
                <div class="formula-code">
                  <pre>{{ formulaResult.formula }}</pre>
                </div>
                
                <div class="formula-explanation">
                  <h4 class="section-title">公式说明</h4>
                  <p>{{ formulaResult.explanation }}</p>
                </div>
                
                <div v-if="formulaResult.examples" class="formula-examples">
                  <h4 class="section-title">使用示例</h4>
                  <ul>
                    <li v-for="(example, index) in formulaResult.examples" :key="index">
                      {{ example }}
                    </li>
                  </ul>
                </div>
              </el-card>
              
              <div v-else class="no-formula-result">
                <el-empty description="尚未生成公式" :image-size="120">
                  <template #description>
                    <p>在左侧输入您的需求，点击"生成公式"按钮</p>
                  </template>
                </el-empty>
              </div>
            </el-col>
          </el-row>
          
          <el-divider content-position="center">常用公式示例</el-divider>
          
          <el-row :gutter="20" class="formula-examples-grid">
            <el-col :span="8" v-for="(example, index) in formulaExamples" :key="index">
              <el-card class="example-card" @click="useFormulaExample(example)">
                <h4>{{ example.title }}</h4>
                <div class="example-formula">{{ example.formula }}</div>
                <p>{{ example.description }}</p>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="工作表分析" name="sheetAnalysis">
        <div class="tab-content">
          <div class="workbook-header">
            <h3>工作簿结构分析</h3>
            <el-button type="primary" @click="analyzeWorkbook" :loading="isAnalyzingWorkbook">
              <el-icon v-if="!isAnalyzingWorkbook"><DataBoard /></el-icon>
              <el-icon v-else><Loading /></el-icon>
              {{ isAnalyzingWorkbook ? '分析中...' : '分析工作簿' }}
            </el-button>
          </div>
          
          <div v-if="isAnalyzingWorkbook" class="analysis-loading">
            <div class="loading-container">
              <el-icon class="loading-icon"><Loading /></el-icon>
              <span>正在分析工作簿结构，请稍候...</span>
            </div>
            <el-skeleton :rows="6" animated />
          </div>
          
          <div v-else-if="workbookAnalysis" class="workbook-analysis">
            <el-row :gutter="20" class="workbook-stats">
              <el-col :span="8">
                <el-card class="stat-card">
                  <el-statistic title="工作表数量" :value="workbookAnalysis.sheetCount">
                    <template #icon><el-icon><Document /></el-icon></template>
                  </el-statistic>
                </el-card>
              </el-col>
              <el-col :span="8">
                <el-card class="stat-card">
                  <el-statistic title="数据表数量" :value="workbookAnalysis.tableCount || 0">
                    <template #icon><el-icon><Grid /></el-icon></template>
                  </el-statistic>
                </el-card>
              </el-col>
              <el-col :span="8">
                <el-card class="stat-card">
                  <el-statistic title="图表数量" :value="workbookAnalysis.chartCount || 0">
                    <template #icon><el-icon><PieChart /></el-icon></template>
                  </el-statistic>
                </el-card>
              </el-col>
            </el-row>
            
            <el-card class="sheets-card">
              <template #header>
                <div class="card-header">
                  <span>工作表列表</span>
                  
                </div>
              </template>
              
              <el-table :data="workbookAnalysis.sheets" style="width: 100%" stripe>
                <el-table-column prop="name" label="工作表名称">
                  <template #default="scope">
                    <div class="sheet-name">
                      <el-icon v-if="scope.row.isHidden"><Hide /></el-icon>
                      <el-icon v-else><Document /></el-icon>
                      {{ scope.row.name }}
                    </div>
                  </template>
                </el-table-column>
                <el-table-column prop="dataSize.rows" label="行数" width="100" />
                <el-table-column prop="dataSize.columns" label="列数" width="100" />
                <el-table-column label="状态" width="120">
                  <template #default="scope">
                    <el-tag :type="scope.row.isHidden ? 'info' : 'success'" size="small">
                      {{ scope.row.isHidden ? '隐藏' : '可见' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="150">
                  <template #default="scope">
                    <el-button size="small" @click="navigateToSheet(scope.row.name)">
                      <el-icon><Position /></el-icon> 跳转
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
            
            <div v-if="workbookAnalysis.recommendations && workbookAnalysis.recommendations.length" class="workbook-recommendations">
              <el-card class="recommendations-card">
                <template #header>
                  <div class="card-header">
                    <span>优化建议</span>
                  </div>
                </template>
                
                <el-timeline>
                  <el-timeline-item
                    v-for="(rec, index) in workbookAnalysis.recommendations"
                    :key="index"
                    :type="getRecommendationType(rec)"
                    :color="getRecommendationColor(rec)"
                  >
                    <h4>{{ rec.title }}</h4>
                    <p>{{ rec.description }}</p>
                    <el-button 
                      v-if="rec.action" 
                      size="small" 
                      type="primary" 
                      @click="executeWorkbookAction(rec.action)"
                    >
                      应用建议
                    </el-button>
                  </el-timeline-item>
                </el-timeline>
              </el-card>
            </div>
          </div>
          
          <div v-else class="no-workbook-analysis">
            <el-empty description="尚未分析工作簿" :image-size="120">
              <template #description>
                <p>点击"分析工作簿"按钮开始分析</p>
              </template>
              <el-button type="primary" @click="analyzeWorkbook">
                <el-icon><DataBoard /></el-icon> 分析工作簿
              </el-button>
            </el-empty>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { 
  Refresh, 
  DataAnalysis, 
  Connection, 
  TrendCharts, 
  Warning, 
  Loading, 
  Download, 
  SuccessFilled, 
  WarningFilled, 
  InfoFilled,
  PieChart,
  View,
  MagicStick,
  CopyDocument,
  Check,
  Document,
  Grid,
  DataBoard,
  Hide,
  Position
} from '@element-plus/icons-vue';
import { ElMessage, ElNotification } from 'element-plus';

// Declare Office and Excel if they are not available globally
const Office = window.Office;
const Excel = window.Excel;

export default {
  name: 'ExcelAnalyzer',
  components: {
    Refresh,
    DataAnalysis,
    Connection,
    TrendCharts,
    Warning,
    Loading,
    Download,
    SuccessFilled,
    WarningFilled,
    InfoFilled,
    PieChart,
    View,
    MagicStick,
    CopyDocument,
    Check,
    Document,
    Grid,
    DataBoard,
    Hide,
    Position
  },
  setup() {
    const activeTab = ref('dataAnalysis');
    const currentSelection = ref(null);
    const analysisType = ref('descriptive');
    const isRefreshing = ref(false);
    const isAnalyzing = ref(false);
    const analysisResult = ref(null);
    const isGeneratingFormula = ref(false);
    const formulaQuery = ref('');
    const formulaRange = ref('');
    const formulaResult = ref(null);
    const isAnalyzingWorkbook = ref(false);
    const workbookAnalysis = ref(null);
    const chartRecommendations = ref([]);
    
    // 公式示例
    const formulaExamples = ref([
      {
        title: '条件平均值',
        formula: '=AVERAGEIF(A:A,">100")',
        description: '计算A列中大于100的所有值的平均数'
      },
      {
        title: '日期范围求和',
        formula: '=SUMIFS(B:B,A:A,">1/1/2023",A:A,"<12/31/2023")',
        description: '计算B列中对应的A列日期在2023年范围内的所有值的总和'
      },
      {
        title: '多条件查找',
        formula: '=VLOOKUP(A2,Sheet2!$A$1:$C$100,3,FALSE)',
        description: '在Sheet2的A1:C100区域中查找与A2单元格匹配的值，并返回该行中第3列的值'
      },
      {
        title: '数据透视',
        formula: '=SUMPRODUCT((A1:A100="Value")*(B1:B100))',
        description: '计算B列中对应A列值为"Value"的所有数字的总和'
      },
      {
        title: '动态范围',
        formula: '=INDEX(A:A,MATCH(MAX(B:B),B:B,0))',
        description: '返回B列中最大值对应的A列值'
      },
      {
        title: '条件计数',
        formula: '=COUNTIFS(A:A,">0",B:B,"<>0")',
        description: '计算A列大于0且B列不等于0的单元格数量'
      }
    ]);
    
    // 初始化
    onMounted(() => {
      // 初始尝试获取选中区域
      refreshSelection();
      
      // 监听Excel中的选择变化（如果Excel API支持的话）
      try {
        if (Office && Office.context && Office.context.document) {
          Office.context.document.addHandlerAsync(
            Office.EventType.DocumentSelectionChanged,
            onSelectionChanged
          );
        }
      } catch (error) {
        console.error('无法添加选择变化监听器:', error);
      }
    });
    
    // 选择变化事件处理
    const onSelectionChanged = () => {
      refreshSelection();
    };
    
    // 刷新当前选中区域
    const refreshSelection = async () => {
      isRefreshing.value = true;
      
      try {
        // 使用Excel API获取当前选中区域
        await Excel.run(async (context) => {
          const range = context.workbook.getSelectedRange();
          range.load("address");
          
          await context.sync();
          
          if (range.address) {
            currentSelection.value = range.address;
            // 根据新选中的区域更新图表推荐
            getChartRecommendations();
          } else {
            currentSelection.value = null;
          }
        });
      } catch (error) {
        console.error('获取选中区域失败:', error);
        // 模拟数据，在实际项目中移除
        simulateSelection();
      } finally {
        isRefreshing.value = false;
      }
    };
    
    // 模拟选中区域（用于开发测试）
    const simulateSelection = () => {
      currentSelection.value = 'Sheet1!A1:D10';
      // 模拟图表推荐
      simulateChartRecommendations();
    };
    
    // 运行数据分析
    const runAnalysis = async () => {
      if (!currentSelection.value) {
        ElMessage.warning('请先选择数据区域');
        return;
      }
      
      isAnalyzing.value = true;
      
      try {
        // 模拟数据分析，实际项目中应调用Excel API
        setTimeout(() => {
          switch (analysisType.value) {
            case 'descriptive':
              simulateDescriptiveAnalysis();
              break;
            case 'correlation':
              simulateCorrelationAnalysis();
              break;
            case 'trend':
              simulateTrendAnalysis();
              break;
            case 'outliers':
              simulateOutliersAnalysis();
              break;
          }
          isAnalyzing.value = false;
          
          // 显示成功通知
          ElNotification({
            title: '分析完成',
            message: `已完成${getAnalysisTypeName(analysisType.value)}`,
            type: 'success',
            position: 'bottom-right'
          });
        }, 1500);
      } catch (error) {
        console.error('数据分析失败:', error);
        ElMessage.error('分析失败，请稍后重试');
        isAnalyzing.value = false;
      }
    };
    
    // 获取分析类型名称
    const getAnalysisTypeName = (type) => {
      const typeMap = {
        'descriptive': '描述性统计分析',
        'correlation': '相关性分析',
        'trend': '趋势分析',
        'outliers': '异常值检测'
      };
      return typeMap[type] || type;
    };
    
    // 导出分析结果
    const exportResult = () => {
      ElMessage.success('分析结果已导出到新工作表');
      // 实际项目中应使用Excel API导出结果
    };
    
    // 模拟描述性统计分析
    const simulateDescriptiveAnalysis = () => {
      analysisResult.value = {
        summary: {
          '数据区域': currentSelection.value,
          '行数': 10,
          '列数': 4,
          '非空单元格': 38,
          '数值型单元格': 35,
          '文本型单元格': 3,
          '最小值': 10.5,
          '最大值': 95.2,
          '平均值': 45.7,
          '中位数': 42.3,
          '标准差': 22.1
        },
        insights: [
          {
            title: '数据分布不均',
            type: 'warning',
            confidence: '中等',
            description: '数据显示右偏分布，有20%的值明显高于平均水平。',
            recommendation: '考虑对数据进行归一化处理以获得更好的分析结果。'
          },
          {
            title: '可能存在异常值',
            type: 'warning',
            confidence: '高',
            description: '检测到2个可能的异常值(95.2和10.5)，它们偏离标准差超过2倍。',
            recommendation: '检查C8和A3单元格的数据是否正确，或考虑移除这些值后重新分析。',
            action: {
              type: 'highlight',
              target: 'C8:C8,A3:A3'
            }
          },
          {
            title: '数据完整性良好',
            type: 'success',
            confidence: '高',
            description: '所选区域的数据完整性良好，没有检测到缺失值。',
            recommendation: '可以直接进行进一步分析，无需数据清洗。'
          }
        ]
      };
    };
    
    // 模拟相关性分析
    const simulateCorrelationAnalysis = () => {
      analysisResult.value = {
        summary: {
          '数据区域': currentSelection.value,
          '分析的列数': 4,
          '样本数': 10,
          '最强相关': 'A列与C列 (r=0.85)',
          '最弱相关': 'B列与D列 (r=-0.32)'
        },
        insights: [
          {
            title: '强正相关',
            type: 'success',
            confidence: '高',
            description: 'A列和C列显示强正相关(r=0.85)，表明这两个变量高度相关。',
            recommendation: '可以考虑将这两个变量合并或仅使用其中一个进行进一步分析。'
          },
          {
            title: '弱负相关',
            type: 'info',
            confidence: '中等',
            description: 'B列和D列显示弱负相关(r=-0.32)。',
            recommendation: '这种关系可能不足以用于预测模型。'
          },
          {
            title: '多重共线性风险',
            type: 'warning',
            confidence: '中等',
            description: '检测到多个变量之间存在较强相关性，可能导致多重共线性问题。',
            recommendation: '在构建回归模型时，考虑使用主成分分析(PCA)或岭回归等技术。'
          }
        ]
      };
    };
    
    // 模拟趋势分析
    const simulateTrendAnalysis = () => {
      analysisResult.value = {
        summary: {
          '数据区域': currentSelection.value,
          '时间序列长度': 10,
          '趋势类型': '线性上升',
          '年增长率': '5.2%',
          '季节性': '检测到季节性波动',
          '预测可靠性': '中等'
        },
        insights: [
          {
            title: '明显的上升趋势',
            type: 'success',
            confidence: '高',
            description: '数据显示明显的线性上升趋势，年增长率约为5.2%。',
            recommendation: '建议使用线性回归模型进行预测。',
            action: {
              type: 'forecast',
              method: 'linear',
              periods: 3
            }
          },
          {
            title: '季节性波动',
            type: 'info',
            confidence: '中等',
            description: '数据中可能存在季节性波动，每4个数据点形成一个周期。',
            recommendation: '考虑使用季节性时间序列模型获得更准确的预测。'
          },
          {
            title: '预测不确定性',
            type: 'warning',
            confidence: '中等',
            description: '由于样本量较小(10个数据点)，长期预测可能存在较大不确定性。',
            recommendation: '建议仅进行短期预测(1-3个周期)，并定期更新模型。'
          }
        ]
      };
    };
    
    // 模拟异常值检测
    const simulateOutliersAnalysis = () => {
      analysisResult.value = {
        summary: {
          '数据区域': currentSelection.value,
          '总数据点': 40,
          '检测到的异常值': 3,
          '异常值比例': '7.5%',
          '检测方法': 'Z-score (阈值: 3)',
          '置信度': '95%'
        },
        insights: [
          {
            title: '异常值',
            type: 'warning',
            confidence: '高',
            description: '在B5、C9和D2单元格检测到异常值，它们偏离数据分布的标准差超过3倍。',
            recommendation: '建议检查这些单元格的数据输入是否正确。',
            action: {
              type: 'highlight',
              target: 'B5:B5,C9:C9,D2:D2'
            }
          },
          {
            title: '异常值影响',
            type: 'info',
            confidence: '中等',
            description: '移除检测到的异常值后，平均值从45.7变为42.3，标准差从22.1降至18.4。',
            recommendation: '考虑在进一步分析中排除这些异常值，以获得更准确的结果。',
            action: {
              type: 'filter',
              criteria: 'exclude outliers'
            }
          },
          {
            title: '可能的数据输入错误',
            type: 'warning',
            confidence: '中等',
            description: 'C9单元格的值(95.2)可能是数据输入错误，它比该列的平均值高出4倍以上。',
            recommendation: '建议检查原始数据源或重新输入该值。',
            action: {
              type: 'navigate',
              target: 'C9'
            }
          }
        ]
      };
    };
    
    // 生成Excel公式
    const generateFormula = () => {
      if (!formulaQuery.value.trim()) {
        ElMessage.warning('请输入公式需求描述');
        return;
      }
      
      isGeneratingFormula.value = true;
      
      // 模拟公式生成
      setTimeout(() => {
        const query = formulaQuery.value.toLowerCase();
        
        if (query.includes('平均') || query.includes('average')) {
          formulaResult.value = {
            formula: '=AVERAGEIF(A:A,">100")',
            explanation: '这个公式使用AVERAGEIF函数计算A列中大于100的所有值的平均数。AVERAGEIF函数接受三个参数：要检查的范围、条件和要计算平均值的范围（如果省略，则使用第一个范围）。',
            examples: [
              '如果A1:A10包含数值，=AVERAGEIF(A1:A10,">100")将计算大于100的值的平均数',
              '要计算特定范围内的平均值，可以使用=AVERAGEIF(A1:A10,">100",B1:B10)'
            ]
          };
        } else if (query.includes('求和') || query.includes('sum')) {
          formulaResult.value = {
            formula: '=SUMIFS(B:B,A:A,">1/1/2023",A:A,"<12/31/2023")',
            explanation: '这个公式使用SUMIFS函数计算B列中对应的A列日期在2023年范围内的所有值的总和。SUMIFS函数允许您指定多个条件，第一个参数是要求和的范围，后面的参数成对出现，分别是条件范围和条件。',
            examples: [
              '要计算销售额列中所有大区为"北区"且月份为"1月"的值的总和，可以使用=SUMIFS(销售额列,大区列,"北区",月份列,"1月")',
              '条件可以使用通配符，例如=SUMIFS(B:B,A:A,"*2023*")将计算A列包含"2023"的所有对应B列值的总和'
            ]
          };
        } else {
          formulaResult.value = {
            formula: '=VLOOKUP(A2,Sheet2!$A$1:$C$100,3,FALSE)',
            explanation: '这个公式使用VLOOKUP函数在Sheet2的A1:C100区域中查找与A2单元格匹配的值，并返回该行中第3列的值。VLOOKUP函数的第四个参数设为FALSE表示需要精确匹配。',
            examples: [
              '要查找产品代码对应的价格，可以使用=VLOOKUP(产品代码单元格,产品表范围,价格列索引,FALSE)',
              '如果需要模糊匹配，可以将最后一个参数设为TRUE，例如=VLOOKUP(A2,Sheet2!$A$1:$C$100,3,TRUE)'
            ]
          };
        }
        
        isGeneratingFormula.value = false;
        
        // 显示成功通知
        ElNotification({
          title: '公式已生成',
          message: '根据您的描述生成了推荐公式',
          type: 'success',
          position: 'bottom-right'
        });
      }, 1000);
    };
    
    // 使用公式示例
    const useFormulaExample = (example) => {
      formulaQuery.value = example.description;
      formulaResult.value = {
        formula: example.formula,
        explanation: example.description,
        examples: [
          '这是一个预设的公式示例，您可以根据需要修改。',
          '点击"应用公式"将此公式应用到当前选中的单元格。'
        ]
      };
      
      // 显示提示
      ElMessage.success('已加载公式示例');
    };
    
    // 应用公式
    const applyFormula = (formula) => {
      ElMessage.success(`公式 ${formula} 将被应用到当前选中单元格`);
      // 实际项目中应使用Excel API应用公式
    };
    
    // 复制公式
    const copyFormula = (formula) => {
      // 创建临时文本区域并复制内容
      const textArea = document.createElement('textarea');
      textArea.value = formula;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      ElMessage.success('公式已复制到剪贴板');
    };
    
    // 分析工作簿结构
    const analyzeWorkbook = () => {
      isAnalyzingWorkbook.value = true;
      
      // 模拟工作簿分析
      setTimeout(() => {
        workbookAnalysis.value = {
          sheetCount: 3,
          tableCount: 2,
          chartCount: 1,
          sheets: [
            {
              name: 'Sheet1',
              isHidden: false,
              dataSize: {
                rows: 100,
                columns: 15
              }
            },
            {
              name: 'Sheet2',
              isHidden: false,
              dataSize: {
                rows: 50,
                columns: 8
              }
            },
            {
              name: 'Sheet3',
              isHidden: true,
              dataSize: {
                rows: 20,
                columns: 5
              }
            }
          ],
          recommendations: [
            {
              title: '工作表命名优化',
              type: 'info',
              description: '当前工作表名称(Sheet1, Sheet2)缺乏描述性。建议使用有意义的名称以提高可读性。'
            },
            {
              title: '数据表格化',
              type: 'success',
              description: 'Sheet1包含大量数据但未使用表格格式。将数据转换为表格有助于排序、筛选和引用。',
              action: {
                type: 'convertToTable',
                sheet: 'Sheet1',
                range: 'A1:O100'
              }
            },
            {
              title: '移除空行',
              type: 'warning',
              description: '检测到Sheet2中存在多行空数据(约5行)，这可能影响分析和性能。',
              action: {
                type: 'removeEmptyRows',
                sheet: 'Sheet2'
              }
            }
          ]
        };
        
        isAnalyzingWorkbook.value = false;
        
        // 显示成功通知
        ElNotification({
          title: '工作簿分析完成',
          message: `已分析 ${workbookAnalysis.value.sheetCount} 个工作表`,
          type: 'success',
          position: 'bottom-right'
        });
      }, 1500);
    };
    
    // 刷新工作簿分析
    const refreshWorkbookAnalysis = () => {
      analyzeWorkbook();
    };
    
    // 跳转到指定工作表
    const navigateToSheet = (sheetName) => {
      ElMessage.success(`正在跳转到工作表: ${sheetName}`);
      // 实际项目中应使用Excel API跳转到指定工作表
    };
    
    // 获取建议类型
    const getRecommendationType = (recommendation) => {
      if (recommendation.type === 'warning') return 'warning';
      if (recommendation.type === 'success') return 'success';
      return 'info';
    };
    
    // 获取建议颜色
    const getRecommendationColor = (recommendation) => {
      if (recommendation.type === 'warning') return '#E6A23C';
      if (recommendation.type === 'success') return '#67C23A';
      if (recommendation.type === 'info') return '#909399';
      return '#409EFF';
    };
    
    // 获取图表推荐
    const getChartRecommendations = () => {
      // 这里应该基于选中的数据区域，使用AI分析数据特征并推荐图表类型
      // 实际项目中应调用后端AI服务进行分析
      simulateChartRecommendations();
    };
    
    // 模拟图表推荐
    const simulateChartRecommendations = () => {
      chartRecommendations.value = [
        {
          title: '销售趋势折线图',
          type: '折线图',
          description: '适合显示持续时间内的趋势变化。您的数据包含时间序列，非常适合用折线图展示趋势。',
          previewUrl: 'https://via.placeholder.com/300x150?text=Line+Chart'
        },
        {
          title: '产品销售比较柱状图',
          type: '柱状图',
          description: '适合比较不同类别之间的数值大小。您的数据包含多个类别的比较信息。',
          previewUrl: 'https://via.placeholder.com/300x150?text=Bar+Chart'
        },
        {
          title: '销售构成饼图',
          type: '饼图',
          description: '适合显示部分与整体的关系。您的数据显示了不同产品的销售构成比例。',
          previewUrl: 'https://via.placeholder.com/300x150?text=Pie+Chart'
        }
      ];
    };
    
    // 创建图表
    const createChart = (chart) => {
      ElMessage.success(`将创建${chart.type}：${chart.title}`);
      // 实际项目中应使用Excel API创建图表
    };
    
    // 预览图表
    const previewChart = (chart) => {
      ElMessage.info(`预览${chart.type}：${chart.title}`);
      // 实际项目中应显示图表预览对话框
    };
    
    // 执行数据洞察建议的操作
    const executeAction = (action) => {
      ElMessage.success(`执行操作：${action.type}`);
      // 实际项目中应使用Excel API执行相应操作
    };
    
    // 执行工作簿优化建议的操作
    const executeWorkbookAction = (action) => {
      ElMessage.success(`执行工作簿优化：${action.type}`);
      // 实际项目中应使用Excel API执行相应操作
    };
    
    return {
      activeTab,
      currentSelection,
      analysisType,
      isRefreshing,
      isAnalyzing,
      analysisResult,
      refreshSelection,
      runAnalysis,
      exportResult,
      formulaQuery,
      formulaRange,
      isGeneratingFormula,
      formulaResult,
      formulaExamples,
      generateFormula,
      useFormulaExample,
      applyFormula,
      copyFormula,
      isAnalyzingWorkbook,
      workbookAnalysis,
      analyzeWorkbook,
      refreshWorkbookAnalysis,
      navigateToSheet,
      getRecommendationType,
      getRecommendationColor,
      chartRecommendations,
      createChart,
      previewChart,
      executeAction,
      executeWorkbookAction
    };
  }
};
</script>

<style>
.excel-analyzer {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.module-title {
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 20px;
  font-weight: 500;
  color: var(--md-primary-main);
  border-bottom: 1px solid var(--md-divider);
  padding-bottom: 12px;
}

.excel-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.excel-tabs .el-tabs__content {
  flex: 1;
  overflow: hidden;
  padding: 0;
}

.tab-content {
  height: 100%;
  overflow-y: auto;
  padding: 16px;
}

/* 数据分析页面样式 */
.panel-container {
  display: flex;
  gap: 20px;
  min-height: 0; /* 这是关键，允许容器收缩 */
  flex: 1;
}

.control-panel {
  width: 300px;
  flex-shrink: 0;
}

.result-panel {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  max-height: 100%;
}

.panel-card {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header span {
  font-weight: 500;
  font-size: 16px;
}

.selection-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.full-width {
  width: 100%;
}

.option-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.analysis-loading {
  padding: 20px;
  background-color: var(--md-background-card);
  border-radius: var(--md-radius-md);
  box-shadow: var(--md-shadow-sm);
}

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
  padding: 20px;
  background-color: var(--md-background-elevated);
  border-radius: var(--md-radius-md);
}

.loading-icon {
  font-size: 24px;
  animation: rotate 1.5s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.result-card {
  margin-bottom: 20px;
}

.result-summary {
  margin-bottom: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 500;
  margin: 20px 0 10px;
  color: var(--md-text-primary);
  position: relative;
  padding-left: 12px;
  border-left: 3px solid var(--md-primary-main);
}

.insight-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.confidence-tag {
  margin-left: auto;
}

.insight-content {
  padding: 10px;
  background-color: var(--md-background-elevated);
  border-radius: var(--md-radius-sm);
  margin-top: 10px;
}

.recommendation {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed var(--md-divider);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.no-result {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 图表推荐页面样式 */
.no-selection-message {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.selection-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.chart-recommendations {
  margin-top: 20px;
}

.chart-card {
  height: 100%;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.chart-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--md-shadow-md);
}

.chart-image {
  position: relative;
  height: 150px;
  overflow: hidden;
}

.chart-type-badge {
  position: absolute;
  top: 10px;
  right: 10px;
}

.chart-info {
  padding: 15px;
}

.chart-info h4 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 16px;
  font-weight: 500;
}

.chart-info p {
  margin-bottom: 15px;
  color: var(--md-text-secondary);
  font-size: 14px;
}

.chart-actions {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

/* 公式助手页面样式 */
.formula-input-card,
.formula-result-card {
  height: 100%;
}

.formula-textarea {
  font-family: 'Consolas', 'Monaco', monospace;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.formula-code {
  background-color: var(--md-background-elevated);
  padding: 15px;
  border-radius: var(--md-radius-md);
  margin-bottom: 20px;
  overflow-x: auto;
}

.formula-code pre {
  margin: 0;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 14px;
  line-height: 1.5;
  color: var(--md-text-primary);
}

.formula-explanation {
  margin-bottom: 20px;
}

.formula-examples ul {
  padding-left: 20px;
  margin-top: 10px;
}

.formula-examples li {
  margin-bottom: 8px;
  line-height: 1.5;
}

.no-formula-result {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.formula-examples-grid {
  margin-top: 20px;
  overflow-y: auto;
  padding-bottom: 20px;
}

.example-card {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  height: 100%;
  margin-bottom: 20px;
}

.example-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--md-shadow-md);
}

.example-card h4 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 16px;
  font-weight: 500;
}

.example-formula {
  font-family: 'Consolas', 'Monaco', monospace;
  background-color: var(--md-background-elevated);
  padding: 8px;
  border-radius: var(--md-radius-sm);
  margin-bottom: 10px;
  font-size: 14px;
  overflow-x: auto;
}

.example-card p {
  margin-bottom: 0;
  color: var(--md-text-secondary);
  font-size: 14px;
}

/* 工作表分析页面样式 */
.workbook-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.workbook-stats {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
  padding: 10px;
}

.sheets-card {
  margin-bottom: 20px;
}

.sheet-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.recommendations-card {
  margin-bottom: 20px;
}

.no-workbook-analysis {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .panel-container {
    flex-direction: column;
  }
  
  .control-panel {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .chart-recommendations .el-col {
    width: 100%;
  }
}

/* 滚动条样式 */
.tab-content::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.tab-content::-webkit-scrollbar-track {
  background: transparent;
}

.tab-content::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.tab-content::-webkit-scrollbar-thumb:hover {
  background-color: rgba(0, 0, 0, 0.3);
}

/* 深色模式滚动条 */
.dark-mode .tab-content::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.2);
}

.dark-mode .tab-content::-webkit-scrollbar-thumb:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

/* 刷新按钮样式 */
.refresh-btn {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 动画效果 */
.el-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.el-card:hover {
  box-shadow: var(--md-shadow-md);
}

.formula-input-row {
  margin-bottom: 20px;
}

.formula-examples-grid {
  margin-top: 20px;
  margin-bottom: 20px;
}

/* 添加公式助手内容区域的样式 */
.formula-assistant-content {
  display: flex;
  flex-direction: column;
}
</style>
