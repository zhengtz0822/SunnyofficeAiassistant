# Office AI Assistant (Office AI 助手)

Office AI Assistant 是一个基于 AI 的 Office 插件，支持 Word 和 Excel 应用程序，提供智能文档分析和数据处理功能。

## 功能特点

### 通用功能

- AI 对话界面，支持自然语言交互
- 自动识别当前 Office 应用类型并提供相应功能
- 模型配置管理，支持多种大型语言模型的 API
- 主题切换和用户偏好设置

### Word 文档功能

- 文本分析
  - 可读性分析
  - 情感分析
  - 关键词提取
- 内容生成
  - 文档摘要生成
  - 文档大纲生成
  - 文本润色和修订

### Excel 数据功能

- 数据分析
  - 描述性统计
  - 相关性分析
  - 趋势分析
  - 异常值检测
- 图表推荐
  - 基于数据特征推荐适合的图表类型
  - 快速创建可视化图表
- 公式助手
  - 自然语言转 Excel 公式
  - 公式解释与优化
- 工作表分析
  - 工作簿结构分析
  - 优化建议

## 技术栈

- 前端框架: Vue 3 + Vite
- UI 组件库: Element Plus
- 状态管理: Pinia
- Office 插件 API: Office.js
- 大型语言模型: 支持 OpenAI API、Azure OpenAI 等

## 开发指南

### 环境准备

1. 安装 Node.js (推荐 v14 或更高版本)
2. 安装依赖：

```bash
npm install
```

### 开发命令

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 构建 Office 插件包
npm run package
```

### 调试说明

1. 在 Office 开发人员模式下加载插件进行调试
2. 执行以下命令将插件清单添加到 Office 应用程序中:

```bash
npx office-addin-debugging start manifest.xml
```

## 配置说明

### 模型配置

插件支持配置多个 AI 模型 API，配置选项包括：

- 模型名称
- API 端点
- API 密钥
- 高级参数 (温度、最大 token 数等)

### 用户设置

用户可以自定义的设置包括：

- 界面主题 (浅色/深色/跟随系统)
- 字体大小
- 对话历史保存选项
- Office 集成选项

## 注意事项

- 插件默认不包含 AI 模型 API 密钥，用户需要在设置中配置自己的 API 密钥
- 某些功能可能需要特定的 Office 版本才能正常工作
- 大文档或数据分析可能受到 API 调用限制的影响

## 未来计划

- 添加更多 Office 应用支持 (PowerPoint, Outlook)
- 支持更多 AI 模型和功能
- 离线模式支持
- 数据导出和报告生成功能

## 许可说明

本项目采用 MIT 许可证
```

</rewritten_file>