// ============================================
// AI Context Copilot — Side Panel Script
// 多轮连续对话、粘贴页面内容、多模型流式响应
// ============================================

(function () {
  'use strict';

  const $ = (sel) => document.querySelector(sel);

  const messagesEl = $('#messages');
  const inputBox = $('#input-box');
  const sendBtn = $('#send-btn');
  const pasteBtn = $('#paste-btn');
  const clearBtn = $('#clear-btn');
  const loadingEl = $('#loading-indicator');
  const modelBadge = $('#model-badge');

  let conversationHistory = [];
  let isStreaming = false;
  let abortController = null;

  // ---------- 持久化会话 ----------
  function saveHistory() {
    const toSave = conversationHistory.slice(-50);
    chrome.storage.local.set({ sidepanelHistory: toSave });
  }

  function loadHistory() {
    chrome.storage.local.get(['sidepanelHistory'], (items) => {
      if (items.sidepanelHistory && items.sidepanelHistory.length > 0) {
        conversationHistory = items.sidepanelHistory;
        renderAllMessages();
      }
    });
  }

  // ---------- 配置 ----------
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

  // ---------- 更新模型标识 ----------
  async function updateModelBadge() {
    const config = await getConfig();
    const provider = getProvider(config.provider);
    if (config.apiKey && config.model) {
      modelBadge.textContent = `${provider?.name || ''} · ${config.model}`;
      modelBadge.classList.remove('unconfigured');
    } else if (config.provider === 'ollama' && config.model) {
      modelBadge.textContent = `Ollama · ${config.model}`;
      modelBadge.classList.remove('unconfigured');
    } else {
      modelBadge.textContent = '未配置';
      modelBadge.classList.add('unconfigured');
    }
  }

  // ---------- 渲染消息 ----------
  function renderAllMessages() {
    messagesEl.innerHTML = '';
    if (conversationHistory.length === 0) {
      messagesEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">💬</div>
          <p class="empty-title">开始 AI 对话</p>
          <p class="empty-desc">
            粘贴页面内容或直接输入问题<br>支持多轮连续对话
          </p>
        </div>
      `;
      return;
    }
    conversationHistory.forEach((msg, idx) => {
      if (msg.role === 'system') return;
      appendMessageBubble(msg.role, msg.content, idx);
    });
    scrollToBottom();
  }

  function appendMessageBubble(role, content, idx) {
    const emptyState = messagesEl.querySelector('.empty-state');
    if (emptyState) emptyState.remove();

    const bubble = document.createElement('div');
    bubble.className = `message ${role}`;
    bubble.dataset.msgIdx = idx;

    const label = role === 'user' ? 'You' : 'AI';
    bubble.innerHTML = `
      <span class="msg-label">${label}</span>
      <div class="msg-content">${renderMarkdown(content)}</div>
    `;

    if (role === 'assistant' && content) {
      addCopyButton(bubble, content);
    }

    messagesEl.appendChild(bubble);
  }

  function addCopyButton(bubble, content) {
    const actions = document.createElement('div');
    actions.className = 'msg-actions';
    actions.innerHTML = '<button class="msg-action-btn copy-msg-btn">📋 复制</button>';
    actions.querySelector('.copy-msg-btn').addEventListener('click', () => {
      navigator.clipboard.writeText(content).then(() => {
        const btn = actions.querySelector('.copy-msg-btn');
        btn.textContent = '✓ 已复制';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = '📋 复制';
          btn.classList.remove('copied');
        }, 1500);
      });
    });
    bubble.appendChild(actions);
  }

  function updateLastBubbleContent(content) {
    const bubbles = messagesEl.querySelectorAll('.message.assistant');
    const last = bubbles[bubbles.length - 1];
    if (last) {
      const contentEl = last.querySelector('.msg-content');
      if (contentEl) {
        contentEl.innerHTML = renderMarkdown(content);
        const cursor = document.createElement('span');
        cursor.className = 'typing-cursor';
        contentEl.appendChild(cursor);
      }
    }
  }

  function finalizeLastBubble(content) {
    const bubbles = messagesEl.querySelectorAll('.message.assistant');
    const last = bubbles[bubbles.length - 1];
    if (last) {
      const contentEl = last.querySelector('.msg-content');
      if (contentEl) {
        const cursor = contentEl.querySelector('.typing-cursor');
        if (cursor) cursor.remove();
        contentEl.innerHTML = renderMarkdown(content);
      }
      if (!last.querySelector('.msg-actions') && content) {
        addCopyButton(last, content);
      }
    }
  }

  // ---------- 简单的 Markdown 渲染 ----------
  function renderMarkdown(text) {
    if (!text) return '';
    let html = text;
    html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');
    return '<p>' + html + '</p>';
  }

  // ---------- 流式 AI 请求 ----------
  async function sendMessage(userText) {
    const config = await getConfig();

    if (!config.apiKey && config.provider !== 'ollama') {
      appendMessageBubble('assistant',
        '⚠️ 请先配置 API Key\n\n右键插件图标 → **选项**，选择模型平台并填写 API Key。',
        conversationHistory.length
      );
      conversationHistory.push({
        role: 'assistant',
        content: '⚠️ 请先配置 API Key\n\n右键插件图标 → 选项，选择模型平台并填写 API Key。'
      });
      saveHistory();
      return;
    }

    // 添加用户消息
    conversationHistory.push({ role: 'user', content: userText });
    appendMessageBubble('user', userText, conversationHistory.length - 1);
    scrollToBottom();

    // 构建消息列表
    const messages = [
      { role: 'system', content: '你是一个博学、有帮助的 AI 助手。请用简洁清晰的中文回答用户的问题。' },
      ...conversationHistory.filter(m => m.role !== 'system')
    ];

    // 显示加载状态
    setLoading(true);
    abortController = new AbortController();
    isStreaming = true;
    disableInput();

    // 添加空的 assistant 消息占位
    const placeholderIdx = conversationHistory.length;
    conversationHistory.push({ role: 'assistant', content: '' });
    appendMessageBubble('assistant', '', placeholderIdx);
    scrollToBottom();

    let fullContent = '';

    await streamAIRequest(
      config.provider,
      config,
      messages,
      // onChunk
      (delta) => {
        fullContent += delta;
        conversationHistory[placeholderIdx].content = fullContent;
        updateLastBubbleContent(fullContent);
        scrollToBottom();
      },
      // onDone
      () => {
        conversationHistory[placeholderIdx].content = fullContent;
        finalizeLastBubble(fullContent);
        saveHistory();
        setLoading(false);
        isStreaming = false;
        abortController = null;
        enableInput();
        inputBox.focus();
      },
      // onError
      (err) => {
        conversationHistory[placeholderIdx].content =
          `❌ 请求失败：${err.message}\n\n请检查 API Key、Base URL 和网络连接。`;
        const bubbles = messagesEl.querySelectorAll('.message.assistant');
        const last = bubbles[bubbles.length - 1];
        if (last) {
          const contentEl = last.querySelector('.msg-content');
          if (contentEl) {
            const cursor = contentEl.querySelector('.typing-cursor');
            if (cursor) cursor.remove();
            contentEl.innerHTML = renderMarkdown(conversationHistory[placeholderIdx].content);
          }
        }
        saveHistory();
        setLoading(false);
        isStreaming = false;
        abortController = null;
        enableInput();
        inputBox.focus();
      },
      abortController.signal
    );
  }

  // ---------- UI 辅助 ----------
  function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function setLoading(show) {
    loadingEl.classList.toggle('hidden', !show);
  }

  function disableInput() {
    inputBox.disabled = true;
    sendBtn.disabled = true;
    inputBox.placeholder = 'AI 正在回复中...';
  }

  function enableInput() {
    inputBox.disabled = false;
    sendBtn.disabled = false;
    inputBox.placeholder = '输入问题，按 Enter 发送，Shift+Enter 换行';
  }

  // ---------- 事件处理 ----------
  function handleSend() {
    const text = inputBox.value.trim();
    if (!text || isStreaming) return;
    inputBox.value = '';
    inputBox.style.height = 'auto';
    sendMessage(text);
  }

  sendBtn.addEventListener('click', handleSend);

  inputBox.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  inputBox.addEventListener('input', () => {
    inputBox.style.height = 'auto';
    inputBox.style.height = Math.min(inputBox.scrollHeight, 120) + 'px';
  });

  // 粘贴页面内容
  pasteBtn.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) return;

      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          return document.body?.innerText?.substring(0, 15000) || '';
        }
      });

      const pageText = results?.[0]?.result?.trim();
      if (pageText) {
        inputBox.value = `以下是我当前网页的文本内容，请帮我分析总结：\n\n"""\n${pageText}\n"""`;
        inputBox.style.height = 'auto';
        inputBox.style.height = Math.min(inputBox.scrollHeight, 120) + 'px';
        inputBox.focus();
      } else {
        inputBox.value = '（无法读取页面内容）';
      }
    } catch (err) {
      inputBox.value = `（读取失败：${err.message}）`;
    }
  });

  // 清空对话
  clearBtn.addEventListener('click', () => {
    if (isStreaming) {
      abortController?.abort();
      isStreaming = false;
      setLoading(false);
      enableInput();
    }
    conversationHistory = [];
    chrome.storage.local.remove('sidepanelHistory');
    renderAllMessages();
    inputBox.focus();
  });

  // 监听来自 background 的消息
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'context-menu-query' && message.text) {
      sendMessage(`请帮我解释以下文本：\n\n"""\n${message.text}\n"""`);
    } else if (message.type === 'query-from-page' && message.text) {
      sendMessage(`请帮我解释以下文本（来自 ${message.pageUrl || '网页'}）：\n\n"""\n${message.text}\n"""`);
    }
  });

  // ---------- 初始化 ----------
  updateModelBadge();
  loadHistory();

  chrome.storage.onChanged.addListener((changes) => {
    if (changes.apiKey || changes.model || changes.baseUrl || changes.provider) {
      updateModelBadge();
    }
  });

  // 点击模型 badge → 打开设置页
  modelBadge.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
  modelBadge.style.cursor = 'pointer';
  modelBadge.title = '点击打开设置';

})();
