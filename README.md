# AI Context Copilot

划词 AI 上下文助手 — 一款纯前端驱动的 Chrome 浏览器插件。选中任意网页文本，一键调用大模型进行解释、翻译、总结、润色或深度分析。100% 本地隐私保护，无需自建后端。

## 核心特性

- **划词即用** — 在任意网页选中文本，鼠标旁浮出彩色模板按钮栏，点击即可调用 AI
- **多模板切换** — 内置 6 个模板（解释 / 总结 / 翻译 / 润色 / 分析 / 自由对话），可自定义名称、颜色和提示词。提示词支持 `{{Text}}` 占位符自动替换选中文本
- **多模型接入** — 支持 OpenAI、DeepSeek、Anthropic Claude、Ollama（本地模型）及任意 OpenAI 兼容接口（OpenRouter、Groq、OneAPI 等）
- **流式渲染** — AI 回答以打字机效果实时输出，支持一键复制
- **侧边栏对话** — 点击插件图标打开侧边栏，支持多轮连续对话，可一键粘贴当前网页全文
- **右键菜单** — 选中文本右键 →「用 AI Copilot 解释选中文本」直达侧边栏
- **100% 隐私** — API Key 仅存于浏览器本地 `chrome.storage.local`，请求由浏览器直连 API 服务商，不经过任何中转服务器
- **多语言** — 设置页支持中文 / English 即时切换

## 安装

### 开发者模式加载

1. 下载本项目代码到本地
2. 打开 Chrome，地址栏输入 `chrome://extensions/` 回车
3. 打开右上角 **「开发者模式」** 开关
4. 点击 **「加载已解压的扩展程序」**
5. 选择项目根目录 `ai-context-copilot/`
6. 插件图标出现在工具栏，加载完成

### 生成图标（可选）

项目已包含预生成的 PNG 图标，如需重新生成：

```bash
node generate-icons.js
```

## 配置指南

### 第一步：获取 API Key

根据你选择的模型平台获取 API Key：

| 平台 | 获取地址 | 说明 |
|---|---|---|
| **OpenAI** | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) | 需绑定信用卡，新用户有免费额度 |
| **DeepSeek** | [platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys) | 国内可直接访问，价格低廉 |
| **Anthropic** | [console.anthropic.com/keys](https://console.anthropic.com/keys) | Claude 系列模型 |
| **Ollama** | [ollama.com/download](https://ollama.com/download) | 本地部署，完全免费，无需 API Key |
| **OpenRouter** | [openrouter.ai/keys](https://openrouter.ai/keys) | 统一网关，可调用多平台模型 |

### 第二步：填写配置

1. 右键点击工具栏插件图标 → **「选项」**，或访问 `chrome://extensions/` → 找到插件 → 「扩展程序选项」
2. 在 **「模型平台」** 下拉框选择你的服务商
3. 粘贴 **API Key**（Ollama 本地部署可跳过）
4. 确认 **Base URL** 已自动填充（也可手动修改）
5. 在 **「模型名称」** 下拉框选择推荐模型，或直接输入自定义模型名
6. 点击 **「🔌 测试连接」** 验证配置

### 第三步：管理提示词模板

1. 在 **「提示词模板」** 区域查看和编辑内置模板
2. 点击模板名称可重命名，点击颜色圆点可更换主题色
3. 提示词中使用 `{{Text}}` 作为选中文本的占位符
4. 点击 **「＋ 添加模板」** 创建自定义模板
5. 使用 ▲▼ 按钮调整模板顺序，✕ 删除模板

### 常用 Base URL 参考

| 服务商 | Base URL | 备注 |
|---|---|---|
| OpenAI | `https://api.openai.com` | 需科学上网 |
| DeepSeek | `https://api.deepseek.com` | 国内直连 |
| Anthropic | `https://api.anthropic.com` | 需科学上网 |
| Ollama | `http://localhost:11434` | 本地运行 |
| OpenRouter | `https://openrouter.ai/api` | 网关代理 |
| Groq | `https://api.groq.com/openai` | 免费额度 |
| Together AI | `https://api.together.xyz` | — |
| 硅基流动 | `https://api.siliconflow.cn` | 国内中转 |
| OneAPI 中转 | 自定域名 | 自部署 |

## 使用方式

### 方式一：网页划词

1. 在任意网页用鼠标选中一段文本
2. 鼠标旁浮出模板按钮栏，点击想要的模板（如 💡 解释、📝 总结）
3. 弹出精美卡片，AI 回答以流式打字机效果实时渲染
4. 卡片内可 📋 复制回答，按 `ESC` 或点击 ✕ 关闭

> **模板按钮规则**：只有 1 个模板时显示单个按钮；多个模板时显示横向按钮栏，hover 可查看模板名称。

### 方式二：侧边栏连续对话

1. 点击工具栏 **插件图标**，右侧打开侧边栏
2. 在输入框直接输入问题，按 `Enter` 发送（`Shift+Enter` 换行）
3. 点击 **📄 按钮** 可一键抓取当前网页全文并粘贴
4. 支持多轮连续对话，对话历史自动保存（最近 50 条）

### 方式三：右键菜单

1. 选中网页文本 → 右键 → **「🤖 用 AI Copilot 解释选中文本」**
2. 自动打开侧边栏并发送选中的文本

## 项目结构

```
ai-context-copilot/
├── manifest.json          # Chrome Extension Manifest V3 配置
├── background.js          # 后台 Service Worker（右键菜单、侧边栏）
├── providers.js           # 多模型接入注册中心
├── i18n.js                # 中英文多语言翻译
├── content.js             # 网页划词脚本（模板按钮栏 + 流式卡片）
├── content.css            # 划词 UI 样式（aicc- 前缀隔离）
├── options.html           # 设置页面
├── options.js             # 设置逻辑（配置、模板管理、语言切换）
├── options.css            # 设置页样式
├── sidepanel.html         # 侧边栏对话面板
├── sidepanel.js           # 侧边栏逻辑（多轮对话、流式响应）
├── sidepanel.css          # 侧边栏样式
├── generate-icons.js      # PNG 图标生成脚本
└── icons/                 # 插件图标 (16/32/48/128px)
```

## 技术要点

- **Manifest V3** — 使用最新 Chrome 扩展规范，Service Worker 后台运行
- **零依赖** — 不引用任何 CDN 或外部资源，所有代码自包含，符合 Chrome Web Store 安全规定
- **CSS 隔离** — 注入网页的样式全部使用 `aicc-` 前缀，Shadow DOM 风格隔离
- **ReadableStream** — 使用 `fetch` + `ReadableStream` 解析 SSE/NDJSON 流式响应
- **Provider 模式** — 每种模型平台实现统一接口（`getHeaders` / `buildBody` / `parseStreamLine` / `buildUrl`），新增平台只需添加配置即可
- **本地存储** — 所有配置、模板、对话历史均存入 `chrome.storage.local`

## 隐私声明

- **无后端服务器** — 本插件不依赖任何自建后端，所有逻辑在浏览器内完成
- **API Key 本地化** — 密钥仅存储于 `chrome.storage.local`，不会离开你的浏览器
- **点对点通信** — AI 请求由你的浏览器直连 API 服务商，不经过任何中间代理
- **零数据收集** — 不会收集、上传或分享你的浏览数据、选中文本或对话内容
- **代码可审计** — 全部源码开放，无混淆、无远程代码注入

## License

MIT
