# 墨音 - 短视频应用

一个类似抖音的全屏刷视频网站，使用 React + Vite 构建，优先适配移动端。

## 功能特性

- 📱 全屏视频播放
- 👆 上下滑动切换视频
- 🎬 自动播放和循环
- 📲 移动端优化
- 🎯 触摸手势支持
- 🔒 API 域名保护（通过后端代理）

## 技术栈

- React 18
- Vite 5
- Express (后端代理)
- CSS3

## 快速开始

### 安装依赖

```bash
npm install
```

### 配置环境变量

创建 `.env` 文件（后端使用）：

```env
API_BASE_URL=https://xxx.xxx
```

创建 `.env.local` 文件（前端使用，可选）：

```env
# 上滑视频频率限制（毫秒），默认 3000ms（3秒）
VITE_SWIPE_UP_COOLDOWN=3000
```

### 开发模式

#### 方式一：使用启动脚本（Windows）

```bash
# Windows
start-dev.bat
```

或手动双击 `start-dev.bat` 文件。

#### 方式二：使用启动脚本（Mac/Linux）

```bash
# Mac/Linux
chmod +x start-dev.sh
./start-dev.sh
```

#### 方式三：使用 concurrently（需要先安装）

```bash
npm install --legacy-peer-deps
npm run dev:all
```

#### 方式四：分别启动（推荐，最简单）

打开两个终端窗口：

**终端 1：启动前端**

```bash
npm run dev
```

前端将在 http://localhost:5173 运行

**终端 2：启动后端**

```bash
npm run dev:server
```

后端将在 http://localhost:3000 运行

### 生产环境

#### 构建前端

```bash
npm run build
```

#### 启动服务器

```bash
npm start
```

服务器将在 http://localhost:3000 运行，同时提供：

- 前端静态文件服务
- API 代理服务

## 项目结构

```
moyin/
├── src/                    # 前端源码
│   ├── components/        # React 组件
│   ├── App.jsx            # 主应用组件
│   └── ...
├── server.js              # 后端代理服务器
├── dist/                  # 构建输出（生产环境）
├── package.json
└── vite.config.js
```

## API 代理

为了保护 API 域名不被暴露在前端代码中，所有 API 请求都通过后端代理：

- 前端请求：`/api/yy` 或 `/api/yy?type=xxx`
- 后端代理到：`https://xxx.xxx/yy` 或 `https://xxx.xxx/yy?type=xxx`

### API 接口

- 随机视频: `/api/yy`
- 指定类型: `/api/yy?type={type}`
- 类型列表: `/api/types`

> 注意：真实的 API 域名配置在后端 `.env` 文件中，不会暴露到前端。

## 使用说明

1. 打开应用后自动加载并播放视频
2. 向上滑动切换到下一个视频（有频率限制，默认3秒一次）
3. 向下滑动切换到上一个视频
4. 点击视频可以播放/暂停
5. 点击顶部选项栏选择视频类型

## 配置选项

### 上滑频率限制

为了防止用户频繁向上翻视频，可以通过环境变量 `VITE_SWIPE_UP_COOLDOWN` 设置上滑冷却时间（单位：毫秒）。

- 默认值：`3000`（3秒）
- 配置方式：在 `.env.local` 文件中设置
- 示例：设置为5秒 `VITE_SWIPE_UP_COOLDOWN=5000`

## 浏览器支持

- Chrome (推荐)
- Safari (iOS)
- 微信内置浏览器
- 其他现代浏览器
