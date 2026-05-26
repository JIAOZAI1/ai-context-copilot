# AI Context Copilot

A pure frontend Chrome extension for AI-powered text assistance. Select any text on any webpage, and with one click invoke LLMs to explain, translate, summarize, polish, or deeply analyze it. 100% local privacy — no backend required.

**Languages:** [English](#english) | [中文](#chinese)

---

## English

### Core Features

- **Select-and-Go** — Select text on any webpage; a color-coded template button bar floats near your cursor. One click invokes the AI.
- **Multiple Templates** — 6 built-in templates (Explain / Summarize / Translate / Polish / Analyze / Free Chat), all customizable: rename, recolor, and edit prompts. Prompts support the `{{Text}}` placeholder for auto-inserting selected text.
- **Multi-Provider** — Supports OpenAI, DeepSeek, Anthropic Claude, Ollama (local models), and any OpenAI-compatible API (OpenRouter, Groq, OneAPI, etc.).
- **Streaming Output** — AI responses render in real time with a typewriter effect. One-click copy.
- **Side Panel Chat** — Click the extension icon to open a side panel for multi-turn conversations. One-click paste the full text of the current webpage.
- **Context Menu** — Right-click selected text → "Explain with AI Copilot" to jump directly to the side panel.
- **100% Privacy** — API keys are stored only in the browser's `chrome.storage.local`. Requests go directly from your browser to the API provider — no intermediate servers.
- **Multi-Language** — Settings page supports instant Chinese / English switching.

### Installation

#### Developer Mode (Load Unpacked)

1. Download the project code to your local machine.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Toggle **Developer mode** on (top-right corner).
4. Click **Load unpacked**.
5. Select the project root directory `ai-context-copilot/`.
6. The extension icon will appear in your toolbar — installation complete.

#### Generate Icons (Optional)

The project includes pre-generated PNG icons. To regenerate:

```bash
node generate-icons.js
```

### Configuration Guide

#### Step 1: Get an API Key

Obtain an API key from your chosen provider:

| Provider | Key URL | Notes |
|---|---|---|
| **OpenAI** | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) | Requires billing setup; free credits for new users |
| **DeepSeek** | [platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys) | Low-cost, accessible from China |
| **Anthropic** | [console.anthropic.com/keys](https://console.anthropic.com/keys) | Claude series models |
| **Ollama** | [ollama.com/download](https://ollama.com/download) | Runs locally, completely free, no API key needed |
| **OpenRouter** | [openrouter.ai/keys](https://openrouter.ai/keys) | Unified gateway to multiple providers |

#### Step 2: Fill in Your Configuration

1. Right-click the extension icon in the toolbar → **Options**, or go to `chrome://extensions/` → find the extension → **Extension options**.
2. Select your provider from the **Provider** dropdown.
3. Paste your **API Key** (skip for local Ollama deployments).
4. Confirm the **Base URL** is auto-filled (you can edit it manually).
5. Choose a recommended model from the **Model** dropdown, or type a custom model name.
6. Click **Test Connection** to verify.

#### Step 3: Manage Prompt Templates

1. View and edit built-in templates in the **Prompt Templates** section.
2. Click a template name to rename it; click the color dot to change its theme color.
3. Use `{{Text}}` in prompts as the placeholder for selected text.
4. Click **+ Add Template** to create a custom template.
5. Use the ▲▼ buttons to reorder templates, and ✕ to delete.

#### Common Base URLs

| Provider | Base URL | Notes |
|---|---|---|
| OpenAI | `https://api.openai.com` | Requires VPN in some regions |
| DeepSeek | `https://api.deepseek.com` | Direct access from China |
| Anthropic | `https://api.anthropic.com` | Requires VPN in some regions |
| Ollama | `http://localhost:11434` | Local runtime |
| OpenRouter | `https://openrouter.ai/api` | API gateway |
| Groq | `https://api.groq.com/openai` | Free tier available |
| Together AI | `https://api.together.xyz` | — |
| SiliconFlow | `https://api.siliconflow.cn` | China-based proxy |
| OneAPI | Custom domain | Self-hosted |

### Usage

#### Method 1: In-Page Text Selection

1. Select a piece of text on any webpage.
2. A template button bar floats near your cursor — click the desired template (e.g., 💡 Explain, 📝 Summarize).
3. A sleek card pops up with the AI response streaming in via typewriter effect.
4. Inside the card: 📋 copy the response, press `ESC` or click ✕ to close.

> **Button rules**: a single template shows a single button; multiple templates show a horizontal button bar. Hover to see the template name.

#### Method 2: Side Panel Chat

1. Click the extension icon in the toolbar to open the right-hand side panel.
2. Type your question and press `Enter` to send (`Shift+Enter` for newline).
3. Click the 📄 **Paste Page** button to grab the full text of the current webpage.
4. Multi-turn conversations are supported; history is auto-saved (last 50 messages).

#### Method 3: Context Menu

1. Select text on a webpage → right-click → **🤖 Explain selected text with AI Copilot**.
2. The side panel opens automatically with the selected text sent as a query.

### Project Structure

```
ai-context-copilot/
├── manifest.json          # Chrome Extension Manifest V3 config
├── background.js          # Service Worker (context menu, side panel)
├── providers.js           # Multi-provider registry
├── i18n.js                # Chinese/English translations
├── content.js             # Text selection script (template bar + streaming card)
├── content.css            # Selection UI styles (aicc- prefixed isolation)
├── options.html           # Settings page
├── options.js             # Settings logic (config, template management, language)
├── options.css            # Settings page styles
├── sidepanel.html         # Side panel chat UI
├── sidepanel.js           # Side panel logic (multi-turn chat, streaming)
├── sidepanel.css          # Side panel styles
├── generate-icons.js      # PNG icon generation script
└── icons/                 # Extension icons (16/32/48/128px)
```

### Technical Highlights

- **Manifest V3** — Uses the latest Chrome extension spec with Service Worker background execution.
- **Zero Dependencies** — No CDN or external resources; all code is self-contained, meeting Chrome Web Store security requirements.
- **CSS Isolation** — All injected styles use the `aicc-` prefix for Shadow DOM–style isolation.
- **ReadableStream** — Parses SSE/NDJSON streaming responses using `fetch` + `ReadableStream`.
- **Provider Pattern** — Each model provider implements a unified interface (`getHeaders` / `buildBody` / `parseStreamLine` / `buildUrl`). Adding a new provider only requires adding a config entry.
- **Local Storage** — All configuration, templates, and chat history are stored in `chrome.storage.local`.

### Privacy

- **No backend server** — This extension depends on no self-hosted backend. All logic runs in the browser.
- **Local API keys** — Keys are stored only in `chrome.storage.local` and never leave your browser.
- **Direct communication** — AI requests go directly from your browser to the API provider with no intermediate proxy.
- **Zero data collection** — No browsing data, selected text, or conversation content is collected, uploaded, or shared.
- **Auditable code** — The full source is open, with no obfuscation or remote code injection.

### License

MIT

---

## 中文

### 核心特性

- **划词即用** — 在任意网页选中文本，鼠标旁浮出彩色模板按钮栏，点击即可调用 AI
- **多模板切换** — 内置 6 个模板（解释 / 总结 / 翻译 / 润色 / 分析 / 自由对话），可自定义名称、颜色和提示词。提示词支持 `{{Text}}` 占位符自动替换选中文本
- **多模型接入** — 支持 OpenAI、DeepSeek、Anthropic Claude、Ollama（本地模型）及任意 OpenAI 兼容接口（OpenRouter、Groq、OneAPI 等）
- **流式渲染** — AI 回答以打字机效果实时输出，支持一键复制
- **侧边栏对话** — 点击插件图标打开侧边栏，支持多轮连续对话，可一键粘贴当前网页全文
- **右键菜单** — 选中文本右键 →「用 AI Copilot 解释选中文本」直达侧边栏
- **100% 隐私** — API Key 仅存于浏览器本地 `chrome.storage.local`，请求由浏览器直连 API 服务商，不经过任何中转服务器
- **多语言** — 设置页支持中文 / English 即时切换

### 安装

#### 开发者模式加载

1. 下载本项目代码到本地
2. 打开 Chrome，地址栏输入 `chrome://extensions/` 回车
3. 打开右上角 **「开发者模式」** 开关
4. 点击 **「加载已解压的扩展程序」**
5. 选择项目根目录 `ai-context-copilot/`
6. 插件图标出现在工具栏，加载完成

#### 生成图标（可选）

项目已包含预生成的 PNG 图标，如需重新生成：

```bash
node generate-icons.js
```

### 配置指南

#### 第一步：获取 API Key

根据你选择的模型平台获取 API Key：

| 平台 | 获取地址 | 说明 |
|---|---|---|
| **OpenAI** | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) | 需绑定信用卡，新用户有免费额度 |
| **DeepSeek** | [platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys) | 国内可直接访问，价格低廉 |
| **Anthropic** | [console.anthropic.com/keys](https://console.anthropic.com/keys) | Claude 系列模型 |
| **Ollama** | [ollama.com/download](https://ollama.com/download) | 本地部署，完全免费，无需 API Key |
| **OpenRouter** | [openrouter.ai/keys](https://openrouter.ai/keys) | 统一网关，可调用多平台模型 |

#### 第二步：填写配置

1. 右键点击工具栏插件图标 → **「选项」**，或访问 `chrome://extensions/` → 找到插件 → 「扩展程序选项」
2. 在 **「模型平台」** 下拉框选择你的服务商
3. 粘贴 **API Key**（Ollama 本地部署可跳过）
4. 确认 **Base URL** 已自动填充（也可手动修改）
5. 在 **「模型名称」** 下拉框选择推荐模型，或直接输入自定义模型名
6. 点击 **「🔌 测试连接」** 验证配置

#### 第三步：管理提示词模板

1. 在 **「提示词模板」** 区域查看和编辑内置模板
2. 点击模板名称可重命名，点击颜色圆点可更换主题色
3. 提示词中使用 `{{Text}}` 作为选中文本的占位符
4. 点击 **「＋ 添加模板」** 创建自定义模板
5. 使用 ▲▼ 按钮调整模板顺序，✕ 删除模板

#### 常用 Base URL 参考

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

### 使用方式

#### 方式一：网页划词

1. 在任意网页用鼠标选中一段文本
2. 鼠标旁浮出模板按钮栏，点击想要的模板（如 💡 解释、📝 总结）
3. 弹出精美卡片，AI 回答以流式打字机效果实时渲染
4. 卡片内可 📋 复制回答，按 `ESC` 或点击 ✕ 关闭

> **模板按钮规则**：只有 1 个模板时显示单个按钮；多个模板时显示横向按钮栏，hover 可查看模板名称。

#### 方式二：侧边栏连续对话

1. 点击工具栏 **插件图标**，右侧打开侧边栏
2. 在输入框直接输入问题，按 `Enter` 发送（`Shift+Enter` 换行）
3. 点击 **📄 按钮** 可一键抓取当前网页全文并粘贴
4. 支持多轮连续对话，对话历史自动保存（最近 50 条）

#### 方式三：右键菜单

1. 选中网页文本 → 右键 → **「🤖 用 AI Copilot 解释选中文本」**
2. 自动打开侧边栏并发送选中的文本

### 项目结构

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

### 技术要点

- **Manifest V3** — 使用最新 Chrome 扩展规范，Service Worker 后台运行
- **零依赖** — 不引用任何 CDN 或外部资源，所有代码自包含，符合 Chrome Web Store 安全规定
- **CSS 隔离** — 注入网页的样式全部使用 `aicc-` 前缀，Shadow DOM 风格隔离
- **ReadableStream** — 使用 `fetch` + `ReadableStream` 解析 SSE/NDJSON 流式响应
- **Provider 模式** — 每种模型平台实现统一接口（`getHeaders` / `buildBody` / `parseStreamLine` / `buildUrl`），新增平台只需添加配置即可
- **本地存储** — 所有配置、模板、对话历史均存入 `chrome.storage.local`

### 隐私声明

- **无后端服务器** — 本插件不依赖任何自建后端，所有逻辑在浏览器内完成
- **API Key 本地化** — 密钥仅存储于 `chrome.storage.local`，不会离开你的浏览器
- **点对点通信** — AI 请求由你的浏览器直连 API 服务商，不经过任何中间代理
- **零数据收集** — 不会收集、上传或分享你的浏览数据、选中文本或对话内容
- **代码可审计** — 全部源码开放，无混淆、无远程代码注入

### License

MIT
