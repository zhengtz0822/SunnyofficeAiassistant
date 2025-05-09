<template>
  <div class="excel-analyzer">
    <h2 class="module-title">Excel数据分析</h2>
    
    <el-tabs v-model="activeTab" class="excel-tabs">
      <el-tab-pane label="数据分析" name="dataAnalysis">
        <el-form>
          <el-form-item label="当前选中区域">
            <el-tag v-if="currentSelection">{{ currentSelection }}</el-tag>
            <el-tag v-else type="info">未选择数据区域</el-tag>
            <el-button size="small" @click="refreshSelection" :loading="isRefreshing">
              <el-icon><Refresh /></el-icon> 刷新
            </el-button>
          </el-form-item>
          
          <el-form-item label="分析类型">
            <el-select v-model="analysisType" placeholder="请选择分析类型">
              <el-option label="描述性统计" value="descriptive"></el-option>
              <el-option label="相关性分析" value="correlation"></el-option>
              <el-option label="趋势分析" value="trend"></el-option>
              <el-option label="异常值检测" value="outliers"></el-option>
            </el-select>
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" @click="runAnalysis" :disabled="!currentSelection || isAnalyzing">
              运行分析
            </el-button>
          </el-form-item>
        </el-form>
        
        <div v-if="isAnalyzing" class="analysis-loading">
          <el-skeleton :rows="6" animated />
        </div>
        
        <div v-if="analysisResult && !isAnalyzing" class="analysis-result">
          <h3>分析结果</h3>
          <el-descriptions border>
            <el-descriptions-item v-for="(value, key) in analysisResult.summary" 
                               :key="key" :label="key">
              {{ value }}
            </el-descriptions-item>
          </el-descriptions>
          
          <div v-if="analysisResult.insights && analysisResult.insights.length" class="insights-section">
            <h4>数据洞察</h4>
            <el-card v-for="(insight, index) in analysisResult.insights" 
                   :key="index" class="insight-card">
              <template #header>
                <div class="insight-header">
                  <span>{{ insight.title }}</span>
                  <el-tag :type="insight.type">{{ insight.confidence }}</el-tag>
                </div>
              </template>
              <div>{{ insight.description }}</div>
              <div v-if="insight.recommendation" class="recommendation">
                <strong>建议：</strong> {{ insight.recommendation }}
                <el-button size="small" 
                         v-if="insight.action" 
                         @click="executeAction(insight.action)">
                  应用
                </el-button>
              </div>
            </el-card>
          </div>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="图表推荐" name="chartRecommendation">
        <div v-if="!currentSelection" class="no-selection-message">
          <el-alert
            title="未选择数据"
            type="info"
            description="请在Excel中选择一个数据区域以获取图表推荐"
            show-icon
            :closable="false"
          />
        </div>
        
        <div v-else>
          <p>基于您选择的 <el-tag>{{ currentSelection }}</el-tag> 区域数据:</p>
          
          <div class="chart-recommendations">
            <el-card v-for="(chart, index) in chartRecommendations" :key="index" class="chart-card">
              <template #header>
                <div class="chart-header">
                  <h4>{{ chart.title }}</h4>
                  <el-tag>{{ chart.type }}</el-tag>
                </div>
              </template>
              <div class="chart-description">
                {{ chart.description }}
              </div>
              <div class="chart-image-placeholder">
                <!-- 这里实际应用中应该显示图表预览 -->
                <el-image 
                  style="width: 100%; height: 150px"
                  :src="chart.previewUrl || 'https://via.placeholder.com/300x150?text=Chart+Preview'"
                  fit="contain"
                />
              </div>
              <div class="chart-actions">
                <el-button type="primary" size="small" @click="createChart(chart)">
                  创建图表
                </el-button>
              </div>
            </el-card>
          </div>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="公式助手" name="formulaAssistant">
        <el-form>
          <el-form-item label="公式需求描述">
            <el-input 
              v-model="formulaQuery" 
              type="textarea" 
              :rows="3" 
              placeholder="用自然语言描述您需要的Excel公式，例如：'计算A列中所有大于100的值的平均数'"
            />
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" @click="generateFormula" :loading="isGeneratingFormula">
              生成公式
            </el-button>
          </el-form-item>
        </el-form>
        
        <div v-if="formulaResult" class="formula-result">
          <el-alert
            title="推荐公式"
            type="success"
            :closable="false"
          />
          <div class="formula-code">
            <pre>{{ formulaResult.formula }}</pre>
          </div>
          <div class="formula-explanation">
            <p><strong>公式说明：</strong></p>
            <p>{{ formulaResult.explanation }}</p>
          </div>
          <div class="formula-actions">
            <el-button size="small" @click="applyFormula(formulaResult.formula)">
              应用公式
            </el-button>
            <el-button size="small" @click="copyFormula(formulaResult.formula)">
              复制公式
            </el-button>
          </div>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="工作表分析" name="sheetAnalysis">
        <el-button @click="analyzeWorkbook" :loading="isAnalyzingWorkbook">
          分析工作簿结构
        </el-button>
        
        <div v-if="workbookAnalysis" class="workbook-analysis">
          <h3>工作簿结构分析</h3>
          
          <div class="workbook-stats">
            <el-statistic title="工作表数量" :value="workbookAnalysis.sheetCount" />
            <el-statistic title="数据表数量" :value="workbookAnalysis.tableCount || 0" />
            <el-statistic title="图表数量" :value="workbookAnalysis.chartCount || 0" />
          </div>
          
          <h4>工作表列表</h4>
          <el-table :data="workbookAnalysis.sheets" style="width: 100%">
            <el-table-column prop="name" label="工作表名称" />
            <el-table-column prop="dataSize.rows" label="行数" />
            <el-table-column prop="dataSize.columns" label="列数" />
            <el-table-column prop="status" label="状态">
              <template #default="scope">
                <el-tag :type="scope.row.isHidden ? 'info' : 'success'">
                  {{ scope.row.isHidden ? '隐藏' : '可见' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
          
          <div v-if="workbookAnalysis.recommendations" class="workbook-recommendations">
            <h4>优化建议</h4>
            <el-collapse>
              <el-collapse-item 
                v-for="(rec, index) in workbookAnalysis.recommendations" 
                :key="index"
                :title="rec.title"
              >
                <p>{{ rec.description }}</p>
                <el-button v-if="rec.action" size="small" @click="executeWorkbookAction(rec.action)">
                  应用建议
                </el-button>
              </el-collapse-item>
            </el-collapse>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { Refresh } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

export default {
  name: 'ExcelAnalyzer',
  components: {
    Refresh
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
    const formulaResult = ref(null);
    const isAnalyzingWorkbook = ref(false);
    const workbookAnalysis = ref(null);
    const chartRecommendations = ref([]);
    
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
        }, 1500);
      } catch (error) {
        console.error('数据分析失败:', error);
        ElMessage.error('分析失败，请稍后重试');
        isAnalyzing.value = false;
      }
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
          '样本数': 10
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
          '趋势类型': '线性上升'
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
          '检测到的异常值': 3
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
            explanation: '这个公式使用AVERAGEIF函数计算A列中大于100的所有值的平均数。'
          };
        } else if (query.includes('求和') || query.includes('sum')) {
          formulaResult.value = {
            formula: '=SUMIFS(B:B,A:A,">1/1/2023",A:A,"<12/31/2023")',
            explanation: '这个公式使用SUMIFS函数计算B列中对应的A列日期在2023年范围内的所有值的总和。'
          };
        } else {
          formulaResult.value = {
            formula: '=VLOOKUP(A2,Sheet2!$A$1:$C$100,3,FALSE)',
            explanation: '这个公式使用VLOOKUP函数在Sheet2的A1:C100区域中查找与A2单元格匹配的值，并返回该行中第3列的值。'
          };
        }
        
        isGeneratingFormula.value = false;
      }, 1000);
    };
    
    // 应用公式
    const applyFormula = (formula) => {
      ElMessage.info(`公式 ${formula} 将被应用到当前选中单元格（实际项目中应调用Excel API）`);
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
              description: '当前工作表名称(Sheet1, Sheet2)缺乏描述性。建议使用有意义的名称以提高可读性。'
            },
            {
              title: '数据表格化',
              description: 'Sheet1包含大量数据但未使用表格格式。将数据转换为表格有助于排序、筛选和引用。',
              action: {
                type: 'convertToTable',
                sheet: 'Sheet1',
                range: 'A1:O100'
              }
            },
            {
              title: '移除空行',
              description: '检测到Sheet2中存在多行空数据(约5行)，这可能影响分析和性能。',
              action: {
                type: 'removeEmptyRows',
                sheet: 'Sheet2'
              }
            }
          ]
        };
        
        isAnalyzingWorkbook.value = false;
      }, 1500);
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
      ElMessage.info(`将创建${chart.type}：${chart.title}（实际项目中应调用Excel API）`);
      // 实际项目中应使用Excel API创建图表
    };
    
    // 执行数据洞察建议的操作
    const executeAction = (action) => {
      ElMessage.info(`执行操作：${action.type}（实际项目中应调用Excel API）`);
      // 实际项目中应使用Excel API执行相应操作
    };
    
    // 执行工作簿优化建议的操作
    const executeWorkbookAction = (action) => {
      ElMessage.info(`执行工作簿优化：${action.type}（实际项目中应调用Excel API）`);
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
      formulaQuery,
      isGeneratingFormula,
      formulaResult,
      generateFormula,
      applyFormula,
      copyFormula,
      isAnalyzingWorkbook,
      workbookAnalysis,
      analyzeWorkbook,
      chartRecommendations,
      createChart,
      executeAction,
      executeWorkbookAction
    };
  }
};
</script>

<style>
.excel-analyzer {
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

.excel-tabs {
  margin-top: 15px;
}

.analysis-result {
  margin-top: 20px;
  border: 1px solid #EBEEF5;
  border-radius: 4px;
  padding: 15px;
  background-color: #F9FAFC;
}

.analysis-loading {
  margin-top: 20px;
}

.insights-section {
  margin-top: 20px;
}

.insight-card {
  margin-bottom: 10px;
}

.insight-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.recommendation {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #EBEEF5;
}

.chart-recommendations {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.chart-card {
  display: flex;
  flex-direction: column;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-header h4 {
  margin: 0;
}

.chart-description {
  margin-bottom: 10px;
}

.chart-actions {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
}

.formula-result {
  margin-top: 20px;
  border: 1px solid #EBEEF5;
  border-radius: 4px;
  padding: 15px;
  background-color: #F9FAFC;
}

.formula-code {
  background-color: #F5F7FA;
  padding: 10px;
  border-radius: 4px;
  margin: 10px 0;
  font-family: monospace;
}

.formula-actions {
  margin-top: 15px;
  display: flex;
  gap: 10px;
}

.workbook-analysis {
  margin-top: 20px;
}

.workbook-stats {
  display: flex;
  justify-content: space-around;
  margin: 20px 0;
}

.workbook-recommendations {
  margin-top: 20px;
}

.no-selection-message {
  margin: 20px 0;
}
</style> 