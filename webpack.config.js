const path = require("path")
const HtmlWebpackPlugin = require("html-webpack-plugin")
const { VueLoaderPlugin } = require("vue-loader")
const CopyWebpackPlugin = require("copy-webpack-plugin")
const fs = require("fs")

// 获取开发证书路径
const certPath = path.join(process.env.USERPROFILE || process.env.HOME, ".office-addin-dev-certs")
const certExists = fs.existsSync(path.join(certPath, "localhost.crt"))

module.exports = (env, options) => {
  const isProduction = options.mode === "production"

  return {
    entry: "./src/main.js",
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "bundle.[contenthash].js",
      clean: true,
    },
    devtool: isProduction ? "source-map" : "eval-source-map",
    devServer: {
      static: {
        directory: path.join(__dirname, "dist"),
      },
      port: 3001,
      hot: true,
      https: certExists
        ? {
            key: fs.readFileSync(path.join(certPath, "localhost.key")),
            cert: fs.readFileSync(path.join(certPath, "localhost.crt")),
          }
        : true,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      proxy: {
        "/api/deepseek/*": {
          target: "https://api.deepseek.com/",
          changeOrigin: true,
          secure: true,
          pathRewrite: (path, req) => {
            // 从/api/deepseek/v1/chat/completions => /v1/chat/completions
            return path.replace(/^\/api\/deepseek/, "")
          },
          logLevel: "debug",
          onProxyReq: (proxyReq, req, res) => {
            console.log("代理请求到DeepSeek API:", req.method, req.path)
            console.log("代理请求头:", proxyReq.getHeaders())
          },
          onProxyRes: (proxyRes, req, res) => {
            console.log("DeepSeek API响应状态:", proxyRes.statusCode)
            console.log("DeepSeek API响应头:", proxyRes.headers)
          },
          onError: (err, req, res) => {
            console.error("DeepSeek API代理错误:", err)
          },
        },
      },
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              presets: ["@babel/preset-env"],
            },
          },
        },
        {
          test: /\.vue$/,
          loader: "vue-loader",
        },
        {
          test: /\.css$/,
          use: ["style-loader", "css-loader"],
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: "./src/index.html",
        filename: "index.html",
        inject: "body",
      }),
      new HtmlWebpackPlugin({
        template: "./src/commands.html",
        filename: "commands.html",
        inject: "body",
      }),
      new VueLoaderPlugin(),
      new CopyWebpackPlugin({
        patterns: [{ from: "assets", to: "assets", noErrorOnMissing: true }],
      }),
    ],
    resolve: {
      extensions: [".js", ".vue", ".json"],
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
  }
}
