// ============================================
// AI Context Copilot — Content Script
// 划词检测、多模板浮动按钮栏、AI 流式回答卡片
// ============================================

(function () {
  'use strict';

  // ---------- 全局状态 ----------
  let templateBar = null;
  let overlay = null;
  let card = null;
  let isStreaming = false;
  let abortController = null;

  // ---------- 简单的 Markdown → HTML 渲染器 ----------
  function renderMarkdown(text) {
    let html = text;
    html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');
    html = html.replace(/^---$/gm, '<hr>');
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');
    return '<p>' + html + '</p>';
  }

  // ---------- 读取存储配置 ----------
  async function getConfig() {
    const defaults = {
      provider: 'openai',
      apiKey: '',
      baseUrl: '',
      endpoint: '',
      model: 'gpt-4o-mini'
    };
    return new Promise((resolve) => {
      chrome.storage.local.get(defaults, (items) => resolve(items));
    });
  }

  async function getTemplates() {
    const defaults = [
      { id: 'explain', name: '解释', color: '#6366f1', prompt: '请帮我详细解释以下文本的含义和背景：\n\n"""\n{{current_text}}\n"""', generateCard: false },
      { id: 'summarize', name: '总结', color: '#10b981', prompt: '请用简洁的要点列表总结以下文本的核心内容：\n\n"""\n{{current_text}}\n"""', generateCard: false },
      { id: 'translate', name: '翻译', color: '#06b6d4', prompt: '请将以下文本翻译成流畅自然的中文：\n\n"""\n{{current_text}}\n"""', generateCard: false },
      { id: 'polish', name: '润色', color: '#8b5cf6', prompt: '请帮我润色改进以下文本，使表达更加流畅专业：\n\n"""\n{{current_text}}\n"""', generateCard: false },
      { id: 'analyze', name: '分析', color: '#f59e0b', prompt: '请从多个维度深度分析以下文本：\n\n"""\n{{current_text}}\n"""', generateCard: false },
      { id: 'chat', name: '对话', color: '#ec4899', prompt: '{{current_text}}', generateCard: false }
    ];
    return new Promise((resolve) => {
      chrome.storage.local.get(['templates'], (items) => {
        resolve(items.templates && items.templates.length > 0 ? items.templates : defaults);
      });
    });
  }

  // ---------- 创建模板按钮栏 ----------
  async function createTemplateBar(x, y, selectedText) {
    removeTemplateBar();

    const allTemplates = await getTemplates();
    // 过滤掉配置了"生成卡片"的模板（它们只在侧边栏显示）
    const templates = allTemplates.filter(t => !t.generateCard);

    if (templates.length === 0) return;

    if (templates.length <= 1) {
      // 单模板模式：按钮直接挂到 body，坐标设在按钮上
      const tpl = templates[0];
      const btn = document.createElement('div');
      btn.className = 'aicc-float-btn';
      btn.style.background = tpl.color || '#6366f1';
      btn.textContent = (tpl.name || 'AI')[0];
      btn.title = tpl.name || 'AI 助手';
      btn.style.left = x + 8 + 'px';
      btn.style.top = y + 8 + 'px';
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        showCard(selectedText, tpl);
        removeTemplateBar();
      });
      document.body.appendChild(btn);
      templateBar = btn;
      return;
    }

    // 多模板模式：毛玻璃按钮栏
    const bar = document.createElement('div');
    bar.className = 'aicc-template-bar';

    templates.forEach((tpl) => {
      const btn = document.createElement('button');
      btn.className = 'aicc-template-btn';
      btn.style.background = tpl.color || '#6366f1';
      btn.textContent = (tpl.name || '?')[0];
      btn.setAttribute('data-tooltip', tpl.name || '');
      btn.title = tpl.name || '';
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        showCard(selectedText, tpl);
        removeTemplateBar();
      });
      bar.appendChild(btn);
    });

    bar.style.left = x + 8 + 'px';
    bar.style.top = y + 8 + 'px';
    document.body.appendChild(bar);
    templateBar = bar;

    // 如果按钮栏超出视口，调整位置
    const rect = bar.getBoundingClientRect();
    if (rect.right > window.innerWidth - 10) {
      bar.style.left = (window.innerWidth - rect.width - 16) + 'px';
    }
    if (rect.bottom > window.innerHeight - 10) {
      bar.style.top = (y - rect.height - 12) + 'px';
    }
  }

  function removeTemplateBar() {
    if (templateBar) {
      templateBar.remove();
      templateBar = null;
    }
  }

  // ---------- 移除卡片 ----------
  function removeCard() {
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
    isStreaming = false;
    if (overlay) { overlay.remove(); overlay = null; }
    if (card) { card = null; }
  }

  // ---------- 显示 AI 回答卡片 ----------
  async function showCard(selectedText, template) {
    removeCard();

    // 遮罩层
    overlay = document.createElement('div');
    overlay.className = 'aicc-overlay';
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay && !isStreaming) removeCard();
    });

    // 卡片
    card = document.createElement('div');
    card.className = 'aicc-card';
    card.addEventListener('click', (e) => e.stopPropagation());

    // 头部（显示模板名称）
    const header = document.createElement('div');
    header.className = 'aicc-card-header';
    header.innerHTML = `
      <div class="aicc-card-title">
        <div class="aicc-card-title-icon" style="background:${escapeHtml(template.color || '#6366f1')}">${escapeHtml((template.name || 'AI')[0])}</div>
        <span>${escapeHtml(template.name || 'AI 助手')}</span>
      </div>
      <div class="aicc-card-actions">
        <button class="aicc-card-btn aicc-copy-btn" title="复制回答">📋</button>
        <button class="aicc-card-btn aicc-close-btn" title="关闭">✕</button>
      </div>
    `;

    // 选中文本上下文
    const contextBox = document.createElement('div');
    contextBox.className = 'aicc-context-box';
    contextBox.innerHTML = `<div class="aicc-context-label">选中的文本</div>${escapeHtml(selectedText)}`;

    // 回答区域
    const answerArea = document.createElement('div');
    answerArea.className = 'aicc-answer-area';
    answerArea.innerHTML = `
      <div class="aicc-loading">
        <div class="aicc-loading-dot"></div>
        <div class="aicc-loading-dot"></div>
        <div class="aicc-loading-dot"></div>
      </div>
    `;

    card.appendChild(header);
    card.appendChild(contextBox);
    card.appendChild(answerArea);
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    // 事件绑定
    const closeBtn = header.querySelector('.aicc-close-btn');
    const copyBtn = header.querySelector('.aicc-copy-btn');
    closeBtn.addEventListener('click', () => {
      if (!isStreaming) removeCard();
    });
    copyBtn.addEventListener('click', () => {
      const text = answerArea.innerText.trim();
      navigator.clipboard.writeText(text).then(() => {
        copyBtn.textContent = '✓';
        copyBtn.classList.add('copied');
        setTimeout(() => {
          copyBtn.textContent = '📋';
          copyBtn.classList.remove('copied');
        }, 1500);
      });
    });

    // ESC 关闭
    const escHandler = (e) => {
      if (e.key === 'Escape' && !isStreaming) {
        removeCard();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);

    // 流式请求
    await streamAIResponse(selectedText, template, answerArea);
  }

  // ---------- 流式 AI 请求 ----------
  async function streamAIResponse(selectedText, template, answerArea) {
    const config = await getConfig();

    if (!config.apiKey && config.provider !== 'ollama') {
      answerArea.innerHTML = `
        <div class="aicc-error">
          <div class="aicc-error-icon">⚙️</div>
          <div class="aicc-error-msg">请先配置 API Key</div>
          <div style="font-size:13px;color:#94a3b8;">右键插件图标 → 选项，填写你的 API Key</div>
        </div>
      `;
      return;
    }

    abortController = new AbortController();
    isStreaming = true;

    answerArea.innerHTML = '<div class="aicc-stream-content"></div>';
    const streamContent = answerArea.querySelector('.aicc-stream-content');
    let fullText = '';
    const cursor = document.createElement('span');
    cursor.className = 'aicc-cursor';

    // 替换模板变量：{{Text}}（兼容旧版）、{{current_text}}、{{current_url}}、{{current_page}}
    let userPrompt = template.prompt || '{{current_text}}';
    userPrompt = userPrompt.replace(/\{\{Text\}\}/gi, selectedText);
    userPrompt = userPrompt.replace(/\{\{current_text\}\}/gi, selectedText);
    userPrompt = userPrompt.replace(/\{\{current_url\}\}/gi, window.location.href);
    const pageContent = (document.body?.innerText || '').substring(0, 15000);
    userPrompt = userPrompt.replace(/\{\{current_page\}\}/gi, pageContent);

    const messages = [
      { role: 'user', content: userPrompt }
    ];

    await streamAIRequest(
      config.provider,
      config,
      messages,
      // onChunk
      (delta) => {
        fullText += delta;
        streamContent.innerHTML = renderMarkdown(fullText);
        streamContent.appendChild(cursor);
        answerArea.scrollTop = answerArea.scrollHeight;
      },
      // onDone
      () => {
        if (cursor.parentNode) cursor.remove();
        streamContent.innerHTML = renderMarkdown(fullText) || '(AI 未返回内容)';
        isStreaming = false;
        abortController = null;
      },
      // onError
      (err) => {
        answerArea.innerHTML = `
          <div class="aicc-error">
            <div class="aicc-error-icon">⚠️</div>
            <div class="aicc-error-msg">请求失败：${escapeHtml(err.message)}</div>
            <div style="font-size:13px;color:#94a3b8;">请检查 API Key、Base URL 和网络连接</div>
          </div>
        `;
        isStreaming = false;
        abortController = null;
      },
      abortController.signal
    );
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ---------- 监听鼠标划词 ----------
  document.addEventListener('mouseup', (e) => {
    setTimeout(() => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();

      if (!text || text.length < 2) {
        removeTemplateBar();
        return;
      }

      if (overlay && overlay.contains(e.target)) return;
      if (templateBar && templateBar.contains(e.target)) return;

      createTemplateBar(e.clientX, e.clientY, text);
    }, 10);
  });

  // 点击其他地方移除模板栏
  document.addEventListener('mousedown', (e) => {
    if (templateBar && !templateBar.contains(e.target)) {
      removeTemplateBar();
    }
  });

  // 滚动时移除
  document.addEventListener('scroll', () => {
    removeTemplateBar();
  }, { capture: true, passive: true });

})();
