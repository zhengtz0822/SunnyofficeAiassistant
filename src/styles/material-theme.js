// Material Design 主题配置
export const materialTheme = {
  // 主色调
  primary: {
    main: "#2196F3",
    light: "#64B5F6",
    dark: "#1976D2",
    contrastText: "#FFFFFF",
  },
  // 次要色调
  secondary: {
    main: "#673AB7",
    light: "#9575CD",
    dark: "#512DA8",
    contrastText: "#FFFFFF",
  },
  // 成功色调
  success: {
    main: "#4CAF50",
    light: "#81C784",
    dark: "#388E3C",
    contrastText: "#FFFFFF",
  },
  // 警告色调
  warning: {
    main: "#FF9800",
    light: "#FFB74D",
    dark: "#F57C00",
    contrastText: "#FFFFFF",
  },
  // 错误色调
  error: {
    main: "#F44336",
    light: "#E57373",
    dark: "#D32F2F",
    contrastText: "#FFFFFF",
  },
  // 信息色调
  info: {
    main: "#2196F3",
    light: "#64B5F6",
    dark: "#1976D2",
    contrastText: "#FFFFFF",
  },
  // 背景色调
  background: {
    default: "#FAFAFA",
    paper: "#FFFFFF",
    card: "#FFFFFF",
  },
  // 文本色调
  text: {
    primary: "rgba(0, 0, 0, 0.87)",
    secondary: "rgba(0, 0, 0, 0.6)",
    disabled: "rgba(0, 0, 0, 0.38)",
    hint: "rgba(0, 0, 0, 0.38)",
  },
  // 分割线
  divider: "rgba(0, 0, 0, 0.12)",
  // 阴影
  shadows: {
    sm: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)",
    md: "0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)",
    lg: "0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)",
    xl: "0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22)",
    xxl: "0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22)",
  },
  // 圆角
  borderRadius: {
    xs: "2px",
    sm: "4px",
    md: "8px",
    lg: "12px",
    xl: "16px",
    xxl: "24px",
    circle: "50%",
  },
  // 间距
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
    xxl: "48px",
  },
  // 字体
  typography: {
    fontFamily: '"Roboto", "Microsoft YaHei", "Segoe UI", sans-serif',
    h1: {
      fontSize: "2.5rem",
      fontWeight: 300,
      letterSpacing: "-0.01562em",
    },
    h2: {
      fontSize: "2rem",
      fontWeight: 300,
      letterSpacing: "-0.00833em",
    },
    h3: {
      fontSize: "1.75rem",
      fontWeight: 400,
      letterSpacing: "0em",
    },
    h4: {
      fontSize: "1.5rem",
      fontWeight: 400,
      letterSpacing: "0.00735em",
    },
    h5: {
      fontSize: "1.25rem",
      fontWeight: 400,
      letterSpacing: "0em",
    },
    h6: {
      fontSize: "1rem",
      fontWeight: 500,
      letterSpacing: "0.0075em",
    },
    subtitle1: {
      fontSize: "1rem",
      fontWeight: 400,
      letterSpacing: "0.00938em",
    },
    subtitle2: {
      fontSize: "0.875rem",
      fontWeight: 500,
      letterSpacing: "0.00714em",
    },
    body1: {
      fontSize: "1rem",
      fontWeight: 400,
      letterSpacing: "0.00938em",
    },
    body2: {
      fontSize: "0.875rem",
      fontWeight: 400,
      letterSpacing: "0.01071em",
    },
    button: {
      fontSize: "0.875rem",
      fontWeight: 500,
      letterSpacing: "0.02857em",
      textTransform: "uppercase",
    },
    caption: {
      fontSize: "0.75rem",
      fontWeight: 400,
      letterSpacing: "0.03333em",
    },
    overline: {
      fontSize: "0.625rem",
      fontWeight: 400,
      letterSpacing: "0.08333em",
      textTransform: "uppercase",
    },
  },
  // 动画
  transitions: {
    easing: {
      easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
      easeOut: "cubic-bezier(0.0, 0, 0.2, 1)",
      easeIn: "cubic-bezier(0.4, 0, 1, 1)",
      sharp: "cubic-bezier(0.4, 0, 0.6, 1)",
    },
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195,
    },
  },
  // 深色模式
  dark: {
    background: {
      default: "#121212",
      paper: "#1E1E1E",
      card: "#2D2D2D",
    },
    text: {
      primary: "rgba(255, 255, 255, 0.87)",
      secondary: "rgba(255, 255, 255, 0.6)",
      disabled: "rgba(255, 255, 255, 0.38)",
      hint: "rgba(255, 255, 255, 0.38)",
    },
    divider: "rgba(255, 255, 255, 0.12)",
  },
}

// 导出 CSS 变量
export function generateCssVariables(isDark = false) {
  const theme = isDark
    ? {
        ...materialTheme,
        background: materialTheme.dark.background,
        text: materialTheme.dark.text,
        divider: materialTheme.dark.divider,
      }
    : materialTheme

  return `
    :root {
      /* 主色调 */
      --md-primary-main: ${theme.primary.main};
      --md-primary-light: ${theme.primary.light};
      --md-primary-dark: ${theme.primary.dark};
      --md-primary-contrast: ${theme.primary.contrastText};
      
      /* 次要色调 */
      --md-secondary-main: ${theme.secondary.main};
      --md-secondary-light: ${theme.secondary.light};
      --md-secondary-dark: ${theme.secondary.dark};
      --md-secondary-contrast: ${theme.secondary.contrastText};
      
      /* 成功色调 */
      --md-success-main: ${theme.success.main};
      --md-success-light: ${theme.success.light};
      --md-success-dark: ${theme.success.dark};
      --md-success-contrast: ${theme.success.contrastText};
      
      /* 警告色调 */
      --md-warning-main: ${theme.warning.main};
      --md-warning-light: ${theme.warning.light};
      --md-warning-dark: ${theme.warning.dark};
      --md-warning-contrast: ${theme.warning.contrastText};
      
      /* 错误色调 */
      --md-error-main: ${theme.error.main};
      --md-error-light: ${theme.error.light};
      --md-error-dark: ${theme.error.dark};
      --md-error-contrast: ${theme.error.contrastText};
      
      /* 信息色调 */
      --md-info-main: ${theme.info.main};
      --md-info-light: ${theme.info.light};
      --md-info-dark: ${theme.info.dark};
      --md-info-contrast: ${theme.info.contrastText};
      
      /* 背景色调 */
      --md-background-default: ${theme.background.default};
      --md-background-paper: ${theme.background.paper};
      --md-background-card: ${theme.background.card};
      
      /* 文本色调 */
      --md-text-primary: ${theme.text.primary};
      --md-text-secondary: ${theme.text.secondary};
      --md-text-disabled: ${theme.text.disabled};
      --md-text-hint: ${theme.text.hint};
      
      /* 分割线 */
      --md-divider: ${theme.divider};
      
      /* 阴影 */
      --md-shadow-sm: ${theme.shadows.sm};
      --md-shadow-md: ${theme.shadows.md};
      --md-shadow-lg: ${theme.shadows.lg};
      --md-shadow-xl: ${theme.shadows.xl};
      --md-shadow-xxl: ${theme.shadows.xxl};
      
      /* 圆角 */
      --md-radius-xs: ${theme.borderRadius.xs};
      --md-radius-sm: ${theme.borderRadius.sm};
      --md-radius-md: ${theme.borderRadius.md};
      --md-radius-lg: ${theme.borderRadius.lg};
      --md-radius-xl: ${theme.borderRadius.xl};
      --md-radius-xxl: ${theme.borderRadius.xxl};
      
      /* 间距 */
      --md-spacing-xs: ${theme.spacing.xs};
      --md-spacing-sm: ${theme.spacing.sm};
      --md-spacing-md: ${theme.spacing.md};
      --md-spacing-lg: ${theme.spacing.lg};
      --md-spacing-xl: ${theme.spacing.xl};
      --md-spacing-xxl: ${theme.spacing.xxl};
      
      /* 字体 */
      --md-font-family: ${theme.typography.fontFamily};
      
      /* 过渡 */
      --md-transition-easing-standard: ${theme.transitions.easing.easeInOut};
      --md-transition-easing-accelerate: ${theme.transitions.easing.easeIn};
      --md-transition-easing-decelerate: ${theme.transitions.easing.easeOut};
      --md-transition-duration-short: ${theme.transitions.duration.short}ms;
      --md-transition-duration-standard: ${theme.transitions.duration.standard}ms;
      --md-transition-duration-complex: ${theme.transitions.duration.complex}ms;
      
      /* Element Plus 变量覆盖 */
      --el-color-primary: ${theme.primary.main};
      --el-color-primary-light-3: ${theme.primary.light};
      --el-color-primary-dark-2: ${theme.primary.dark};
      --el-color-success: ${theme.success.main};
      --el-color-warning: ${theme.warning.main};
      --el-color-danger: ${theme.error.main};
      --el-color-info: ${theme.info.main};
      --el-bg-color: ${theme.background.paper};
      --el-bg-color-page: ${theme.background.default};
      --el-text-color-primary: ${theme.text.primary};
      --el-text-color-regular: ${theme.text.secondary};
      --el-text-color-secondary: ${theme.text.secondary};
      --el-text-color-placeholder: ${theme.text.hint};
      --el-border-color: ${theme.divider};
      --el-border-color-light: ${theme.divider};
      --el-border-color-lighter: ${theme.divider};
      --el-border-radius-base: ${theme.borderRadius.sm};
      --el-font-size-base: 14px;
      --el-font-family: ${theme.typography.fontFamily};
    }
  `
}
