import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import App from './App.vue';

// 处理ResizeObserver错误
const resizeObserverLoopErrRE = /ResizeObserver loop completed with undelivered notifications/;
window.addEventListener('error', (e) => {
  if (e.message && resizeObserverLoopErrRE.test(e.message)) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    e.preventDefault();
  }
});

// Office初始化处理
Office.onReady(({ host, platform }) => {
  console.log(`Office已初始化: ${host} on ${platform}`);
  
  // 初始化Vue应用
  const app = createApp(App);
  
  // 使用Element Plus
  app.use(ElementPlus);
  
  // 设置全局属性
  app.config.globalProperties.$officeHost = host;
  app.config.globalProperties.$officePlatform = platform;
  
  // 使用Pinia进行状态管理
  const pinia = createPinia();
  app.use(pinia);
  
  // 根据Host类型加载对应模块
  if (host === Office.HostType.Excel) {
    console.log('加载Excel专用模块');
    // 这里将在稍后导入Excel专用组件
    import('./components/excel/ExcelAnalyzer.vue').then((module) => {
      app.component('excel-analyzer', module.default);
    });
  } else if (host === Office.HostType.Word) {
    console.log('加载Word专用模块');
    // 这里将在稍后导入Word专用组件
    import('./components/word/TextAnalyzer.vue').then((module) => {
      app.component('text-analyzer', module.default);
    });
  }
  
  // 挂载应用
  app.mount('#app');
}); 