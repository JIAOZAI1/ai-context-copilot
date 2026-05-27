// ============================================
// AI Context Copilot — i18n 多语言
// 支持中文 (zh-CN) 与 English (en)
// ============================================

const I18N = {
  'zh-CN': {
    // 头部
    headerTitle: 'AI Context Copilot',
    headerSubtitle: '划词 AI 上下文助手 · 设置中心',

    // API 配置
    apiSectionTitle: '⚡ API 配置',
    apiSectionDesc: '选择模型平台并填写 API Key，支持 OpenAI、DeepSeek、Anthropic、Ollama 及任意兼容接口',

    // 平台选择
    providerLabel: '模型平台',
    providerHintDefault: '选择平台后自动填充 Base URL 和推荐模型',
    providerHintOllama: 'Ollama 本地服务，默认无需 API Key。确保已启动 ollama serve',
    providerHintCustom: '完全自定义：填写任意 API 地址和 Endpoint 路径',
    providerHintGeneric: 'Base URL 已自动填充为 {name} 官方地址，也可手动修改',

    // API Key
    apiKeyLabel: 'API Key',
    apiKeyPlaceholder: 'sk-xxxxxxxxxxxxxxxxxxxxxxxx',
    apiKeyHint: '你的 API Key 仅存储在浏览器本地，绝不会上传到任何第三方服务器',
    apiKeyHintOllama: '本地部署通常无需填写',
    apiKeyHintAnthropic: 'sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxx',
    apiKeyHintGemini: 'AIzaSy... Google AI Studio API Key',
    apiKeyDocsLink: '📖 获取 API Key 指南',

    // Base URL
    baseUrlLabel: 'Base URL',

    // Endpoint
    endpointLabel: 'Endpoint 路径',
    endpointHint: '相对于 Base URL 的 API 路径，或以 http 开头的完整 URL',

    // 模型
    modelLabel: '模型名称',
    modelSelectDefault: '-- 选择模型 --',
    modelSelectCustom: '✏️ 手动输入...',
    modelInputPlaceholder: '或手动输入模型名',
    modelHint: '可从下拉列表中选择推荐模型，或直接手动输入',

    // 按钮
    saveBtn: '💾 保存配置',
    testBtn: '🔌 测试连接',
    testBtnLoading: ' 测试中...',

    // 状态消息
    statusSaved: '✓ 配置已保存',
    statusTesting: '正在测试 {name} 连接...',
    statusSuccess: '✓ 连接成功！模型 "{model}" 返回：{reply}',
    statusNoApiKey: '请先填写 API Key',
    statusNoModel: '请先选择或输入模型名称',
    statusFail: '✗ 连接失败：{msg}',

    // 模板管理
    templateSectionTitle: '📋 提示词模板',
    templateSectionDesc: '配置多个模板，选中网页文本后可选其一来调用 AI。可用变量：{{current_text}}（选中文本）、{{current_url}}（当前页面URL）、{{current_page}}（页面内容）、及自定义变量',
    templateNamePlaceholder: '模板名称',
    templatePromptPlaceholder: '提示词内容，使用 {{current_text}}、{{current_url}}、{{current_page}} 或自定义 {{变量名}}',
    templateVarHintCurrentText: ' 将被替换为鼠标选中的网页文本',
    templateVarHintCurrentUrl: ' 将被替换为当前页面的完整 URL',
    templateVarHintCurrentPage: ' 将被替换为当前页面的文本内容',
    templateEmpty: '暂无模板，点击下方按钮添加',
    addTemplateBtn: '＋ 添加模板',
    newTemplateName: '新模板',
    newTemplatePrompt: '请帮我分析以下文本：\n\n{{current_text}}',
    templateCardLabel: '生成卡片',
    templateCardHint: '启用后，该模板将在侧边栏中显示为卡片，点击卡片可填写变量表单后发送给 AI',
    templateCardSectionTitle: '📋 提示词卡片',
    templateCardFormTitle: '填写提示词变量',
    templateCardFormSubmit: '发送给 AI',
    templateCardFormCancel: '取消',
    templateCardUrlAuto: '（自动获取当前页面 URL）',
    templateCardTextPlaceholder: '请在此粘贴或输入文本内容...',

    // 隐私
    privacyTitle: '100% 隐私保护承诺',
    privacyText: '本插件 不依赖任何自建后端服务器，所有代码均为纯前端驱动。',
    privacyItem1: '你的 API Key 仅存储在浏览器本地 chrome.storage.local 中',
    privacyItem2: 'AI 请求直接在你的浏览器与 API 服务商之间点对点通信',
    privacyItem3: '不经过任何中间代理或第三方服务器',
    privacyItem4: '不会收集、上传或分享你的浏览数据、选中文本或对话内容',
    privacyItem5: '所有源代码均可审查，无混淆、无远程代码注入',
    privacyBadge: '你的数据，永远属于你。',

    // 页脚
    footerVersion: 'v2.0.0',
    footerManifestV3: 'Manifest V3',
    footerTagline: '多模型接入'
  },

  'en': {
    // Header
    headerTitle: 'AI Context Copilot',
    headerSubtitle: 'AI Context Assistant · Settings',

    // API Config
    apiSectionTitle: '⚡ API Configuration',
    apiSectionDesc: 'Select a model platform and fill in your API Key. Supports OpenAI, DeepSeek, Anthropic, Ollama, and any compatible API.',

    // Provider
    providerLabel: 'Platform',
    providerHintDefault: 'Select a platform to auto-fill Base URL and recommended models',
    providerHintOllama: 'Local Ollama service. API Key is optional. Make sure ollama serve is running.',
    providerHintCustom: 'Fully custom: enter any API address and endpoint path',
    providerHintGeneric: 'Base URL auto-filled with {name} official address. You may also edit it.',

    // API Key
    apiKeyLabel: 'API Key',
    apiKeyPlaceholder: 'sk-xxxxxxxxxxxxxxxxxxxxxxxx',
    apiKeyHint: 'Your API Key is stored only in your local browser, never uploaded to any third-party server.',
    apiKeyHintOllama: 'Usually not required for local deployment',
    apiKeyHintAnthropic: 'sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxx',
    apiKeyHintGemini: 'AIzaSy... Google AI Studio API Key',
    apiKeyDocsLink: '📖 Get API Key Guide',

    // Base URL
    baseUrlLabel: 'Base URL',

    // Endpoint
    endpointLabel: 'Endpoint Path',
    endpointHint: 'API path relative to Base URL, or a full URL starting with http',

    // Model
    modelLabel: 'Model Name',
    modelSelectDefault: '-- Select Model --',
    modelSelectCustom: '✏️ Custom...',
    modelInputPlaceholder: 'or type model name',
    modelHint: 'Choose from recommended models or enter a custom name',

    // Buttons
    saveBtn: '💾 Save Config',
    testBtn: '🔌 Test Connection',
    testBtnLoading: ' Testing...',

    // Status messages
    statusSaved: '✓ Config saved',
    statusTesting: 'Testing connection to {name}...',
    statusSuccess: '✓ Connected! Model "{model}" replied: {reply}',
    statusNoApiKey: 'Please fill in your API Key',
    statusNoModel: 'Please select or enter a model name',
    statusFail: '✗ Connection failed: {msg}',

    // Templates
    templateSectionTitle: '📋 Prompt Templates',
    templateSectionDesc: 'Create multiple templates. When you select text on a webpage, choose a template to use. Variables: {{current_text}} (selected text), {{current_url}} (page URL), {{current_page}} (page content), and custom variables.',
    templateNamePlaceholder: 'Template name',
    templatePromptPlaceholder: 'Prompt content. Use {{current_text}}, {{current_url}}, {{current_page}}, or custom {{variable_name}}',
    templateVarHintCurrentText: ' will be replaced with the selected webpage text',
    templateVarHintCurrentUrl: ' will be replaced with the current page URL',
    templateVarHintCurrentPage: ' will be replaced with the current page text content',
    templateEmpty: 'No templates yet. Click the button below to add one.',
    addTemplateBtn: '＋ Add Template',
    newTemplateName: 'New Template',
    newTemplatePrompt: 'Please analyze the following text:\n\n{{current_text}}',
    templateCardLabel: 'Generate Card',
    templateCardHint: 'When enabled, this template appears as a card in the sidebar. Click the card to fill in variables and send to AI.',
    templateCardSectionTitle: '📋 Prompt Cards',
    templateCardFormTitle: 'Fill in Variables',
    templateCardFormSubmit: 'Send to AI',
    templateCardFormCancel: 'Cancel',
    templateCardUrlAuto: '(Auto-filled from current page URL)',
    templateCardTextPlaceholder: 'Paste or type text here...',

    // Privacy
    privacyTitle: '100% Privacy Guarantee',
    privacyText: 'This extension does NOT rely on any self-built backend servers. All code is purely frontend-driven.',
    privacyItem1: 'Your API Key is stored only in your browser\'s chrome.storage.local',
    privacyItem2: 'AI requests go directly from your browser to the API provider, peer-to-peer',
    privacyItem3: 'No intermediate proxies or third-party servers involved',
    privacyItem4: 'No browsing data, selected text, or conversation content is ever collected or shared',
    privacyItem5: 'All source code is open for audit — no obfuscation, no remote code injection',
    privacyBadge: 'Your data stays yours. Always.',

    // Footer
    footerVersion: 'v2.0.0',
    footerManifestV3: 'Manifest V3',
    footerTagline: 'Multi-Model Support'
  }
};

// ---------- 当前语言 ----------
let currentLang = 'zh-CN';

function setLang(lang) {
  currentLang = lang;
  chrome.storage.local.set({ lang });
  translatePage();
}

function getLang() {
  return currentLang;
}

// ---------- 获取翻译 ----------
function t(key, replacements) {
  let text = (I18N[currentLang] && I18N[currentLang][key]) || I18N['zh-CN'][key] || key;
  if (replacements) {
    Object.keys(replacements).forEach((k) => {
      text = text.replace(`{${k}}`, replacements[k]);
    });
  }
  return text;
}

// ---------- 翻译整个页面 ----------
function translatePage(root) {
  const container = root || document;
  container.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    const text = t(key);
    if (text) {
      // 如果元素有子元素（如 code），仅更新文本节点
      if (el.children.length > 0) {
        for (const child of el.childNodes) {
          if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) {
            child.textContent = text;
            return;
          }
        }
        // 没有纯文本节点则设置第一个文本节点
        el.childNodes[0] && (el.childNodes[0].textContent = text);
      } else {
        el.textContent = text;
      }
    }
  });

  // placeholder 属性
  container.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });

  // title 属性
  container.querySelectorAll('[data-i18n-title]').forEach((el) => {
    el.title = t(el.dataset.i18nTitle);
  });
}

// ---------- 初始化语言 ----------
function initI18n() {
  chrome.storage.local.get(['lang'], (items) => {
    if (items.lang && I18N[items.lang]) {
      currentLang = items.lang;
    } else {
      // 根据浏览器语言自动检测
      const navLang = navigator.language;
      currentLang = navLang.startsWith('zh') ? 'zh-CN' : 'en';
    }
    translatePage();
  });
}
