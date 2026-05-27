// ============================================
// AI Context Copilot — Options Page Script
// 多模型平台配置、自动填充、连接测试、多语言
// ============================================

(function () {
  'use strict';

  const $ = (sel) => document.querySelector(sel);

  const providerSelect = $('#provider');
  const apiKeyInput = $('#api-key');
  const baseUrlInput = $('#base-url');
  const baseUrlGroup = $('#baseurl-group');
  const endpointInput = $('#endpoint');
  const endpointGroup = $('#endpoint-group');
  const modelSelect = $('#model-select');
  const modelInput = $('#model');
  const docsLink = $('#docs-link');
  const providerHint = $('#provider-hint');
  const form = $('#config-form');
  const saveBtn = $('#save-btn');
  const testBtn = $('#test-btn');
  const statusBar = $('#status-bar');

  const defaults = {
    provider: 'openai',
    apiKey: '',
    baseUrl: '',
    endpoint: '',
    model: 'gpt-4o-mini'
  };

  let currentProvider = null;

  // ---------- 切换 provider ----------
  function selectProvider(providerId) {
    currentProvider = getProvider(providerId);
    if (!currentProvider) return;

    if (providerId === 'custom') {
      baseUrlGroup.classList.add('hidden');
      endpointGroup.classList.remove('hidden');
      providerHint.textContent = t('providerHintCustom');
    } else if (providerId === 'ollama') {
      baseUrlGroup.classList.remove('hidden');
      endpointGroup.classList.add('hidden');
      baseUrlInput.value = currentProvider.baseUrl;
      providerHint.textContent = t('providerHintOllama');
    } else {
      baseUrlGroup.classList.remove('hidden');
      endpointGroup.classList.add('hidden');
      baseUrlInput.value = currentProvider.baseUrl;
      providerHint.textContent = t('providerHintGeneric', { name: currentProvider.name });
    }

    populateModelDropdown(currentProvider.models);

    if (providerId === 'ollama') {
      apiKeyInput.placeholder = t('apiKeyHintOllama');
    } else if (providerId === 'anthropic') {
      apiKeyInput.placeholder = t('apiKeyHintAnthropic');
    } else {
      apiKeyInput.placeholder = t('apiKeyPlaceholder');
    }

    if (currentProvider.docsUrl) {
      docsLink.href = currentProvider.docsUrl;
      docsLink.classList.remove('hidden');
    } else {
      docsLink.classList.add('hidden');
    }
  }

  // ---------- 填充模型下拉 ----------
  function populateModelDropdown(models) {
    modelSelect.innerHTML = `<option value="">${t('modelSelectDefault')}</option>`;
    if (models && models.length > 0) {
      models.forEach((m) => {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = m;
        modelSelect.appendChild(opt);
      });
    }
    modelSelect.innerHTML += `<option value="__custom__">${t('modelSelectCustom')}</option>`;
  }

  // ---------- 加载已保存的配置 ----------
  function loadConfig() {
    chrome.storage.local.get(defaults, (items) => {
      const providerId = items.provider || defaults.provider;
      providerSelect.value = providerId;
      selectProvider(providerId);

      apiKeyInput.value = items.apiKey || '';
      if (items.baseUrl && items.baseUrl !== currentProvider?.baseUrl) {
        baseUrlInput.value = items.baseUrl;
      }
      if (items.endpoint) {
        endpointInput.value = items.endpoint;
      }
      modelInput.value = items.model || defaults.model;

      if (items.model) {
        const match = [...modelSelect.options].find(o => o.value === items.model);
        if (match) modelSelect.value = items.model;
      }
    });
  }

  function collectConfig() {
    const provider = providerSelect.value;
    const baseUrl = provider === 'custom' ? '' : baseUrlInput.value.trim();
    return {
      provider,
      apiKey: apiKeyInput.value.trim(),
      baseUrl: baseUrl || currentProvider?.baseUrl || '',
      endpoint: provider === 'custom' ? endpointInput.value.trim() : '',
      model: modelInput.value.trim() || defaults.model
    };
  }

  function saveConfig(silent) {
    const config = collectConfig();
    chrome.storage.local.set(config, () => {
      if (!silent) showStatus('success', t('statusSaved'));
    });
  }

  function showStatus(type, message) {
    statusBar.className = `status-bar ${type}`;
    statusBar.textContent = message;
    clearTimeout(statusBar._timeout);
    statusBar._timeout = setTimeout(() => {
      statusBar.classList.add('hidden');
    }, 5000);
  }

  // ---------- 测试连接 ----------
  async function testConnection() {
    const config = collectConfig();

    if (!config.apiKey && providerSelect.value !== 'ollama') {
      showStatus('error', t('statusNoApiKey'));
      return;
    }
    if (!config.model) {
      showStatus('error', t('statusNoModel'));
      return;
    }

    testBtn.disabled = true;
    testBtn.querySelector('.btn-text').innerHTML =
      `<span class="spinner"></span>${t('testBtnLoading')}`;
    showStatus('info', t('statusTesting', { name: currentProvider.name }));

    try {
      const provider = getProvider(config.provider);
      const baseUrl = (config.baseUrl || provider.baseUrl).replace(/\/$/, '');
      const endpoint = config.endpoint || provider.endpoint;

      let url;
      if (provider.buildUrl) {
        url = provider.buildUrl(baseUrl, config.model, config.apiKey);
      } else {
        url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: provider.getHeaders(config.apiKey),
        body: provider.buildBody(config.model, [
          { role: 'user', content: 'Hi, reply with just: OK' }
        ], false, 20)
      });

      await provider.checkError(response);
      const data = await response.json();

      let reply = '(empty)';
      if (data.choices?.[0]?.message?.content) {
        reply = data.choices[0].message.content;
      } else if (data.content?.[0]?.text) {
        reply = data.content[0].text;
      } else if (data.message?.content) {
        reply = data.message.content;
      }

      showStatus('success', t('statusSuccess', { model: config.model, reply }));
    } catch (err) {
      showStatus('error', t('statusFail', { msg: err.message }));
    } finally {
      testBtn.disabled = false;
      testBtn.querySelector('.btn-text').textContent = t('testBtn');
    }
  }

  // ---------- 事件绑定 ----------

  providerSelect.addEventListener('change', () => {
    selectProvider(providerSelect.value);
    saveConfig(true);
  });

  modelSelect.addEventListener('change', () => {
    if (modelSelect.value === '__custom__') {
      modelInput.value = '';
      modelInput.focus();
    } else if (modelSelect.value) {
      modelInput.value = modelSelect.value;
    }
    saveConfig(true);
  });

  modelInput.addEventListener('input', () => {
    const match = [...modelSelect.options].find(o => o.value === modelInput.value);
    modelSelect.value = match ? modelInput.value : '';
  });

  document.querySelectorAll('.toggle-pwd').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const input = document.getElementById(targetId);
      if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🙈';
      } else {
        input.type = 'password';
        btn.textContent = '👁';
      }
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    saveConfig();
  });

  testBtn.addEventListener('click', testConnection);

  [apiKeyInput, baseUrlInput, endpointInput, modelInput].forEach((input) => {
    input.addEventListener('blur', () => {
      if (input.value !== (input._prevValue || '')) {
        input._prevValue = input.value;
        saveConfig(true);
      }
    });
  });

  // ========== 语言切换 ==========

  function updateLangToggle() {
    document.querySelectorAll('.lang-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.lang === currentLang);
    });
  }

  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      setLang(btn.dataset.lang);
      updateLangToggle();
      // 刷新动态内容
      selectProvider(providerSelect.value);
      renderTemplates();
    });
  });

  // ========== 提示词模板管理 ==========

  const templatesList = $('#templates-list');
  const addTemplateBtn = $('#add-template-btn');

  const TEMPLATE_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#f97316', '#3b82f6'];

  // 默认模板使用 key 来存储翻译后的名称，实际名称会在 render 时根据语言计算
  const DEFAULT_TEMPLATES = [
    { id: 'explain', name: '解释', color: '#6366f1', prompt: '请帮我详细解释以下文本的含义和背景：\n\n"""\n{{current_text}}\n"""', generateCard: false },
    { id: 'summarize', name: '总结', color: '#10b981', prompt: '请用简洁的要点列表总结以下文本的核心内容：\n\n"""\n{{current_text}}\n"""', generateCard: false },
    { id: 'translate', name: '翻译', color: '#06b6d4', prompt: '请将以下文本翻译成流畅自然的中文，保持原意和语气：\n\n"""\n{{current_text}}\n"""', generateCard: false },
    { id: 'polish', name: '润色', color: '#8b5cf6', prompt: '请帮我润色改进以下文本，修正语法错误，使表达更加流畅专业，但保持原意不变：\n\n"""\n{{current_text}}\n"""', generateCard: false },
    { id: 'analyze', name: '分析', color: '#f59e0b', prompt: '请从多个维度和视角深度分析以下文本，包括内容、结构、观点、论据等方面：\n\n"""\n{{current_text}}\n"""', generateCard: false },
    { id: 'chat', name: '对话', color: '#ec4899', prompt: '{{current_text}}', generateCard: false }
  ];

  // 默认模板的英文名称映射
  const DEFAULT_TEMPLATE_NAMES_EN = {
    explain: 'Explain',
    summarize: 'Summary',
    translate: 'Translate',
    polish: 'Polish',
    analyze: 'Analyze',
    chat: 'Chat'
  };

  let templates = [];

  function loadTemplates() {
    chrome.storage.local.get(['templates'], (items) => {
      if (items.templates && items.templates.length > 0) {
        templates = items.templates;
      } else {
        // 根据当前语言使用默认模板名
        templates = DEFAULT_TEMPLATES.map((tpl) => ({
          ...tpl,
          name: currentLang === 'en' ? (DEFAULT_TEMPLATE_NAMES_EN[tpl.id] || tpl.name) : tpl.name
        }));
      }
      renderTemplates();
    });
  }

  function saveTemplates() {
    chrome.storage.local.set({ templates });
  }

  function renderTemplates() {
    const tplNamePlaceholder = t('templateNamePlaceholder');
    const tplPromptPlaceholder = t('templatePromptPlaceholder');
    const tplVarHintText = t('templateVarHintCurrentText');
    const tplVarHintUrl = t('templateVarHintCurrentUrl');
    const tplVarHintPage = t('templateVarHintCurrentPage');
    const cardLabel = t('templateCardLabel');
    const cardHint = t('templateCardHint');

    if (templates.length === 0) {
      templatesList.innerHTML = `<div class="templates-empty">${t('templateEmpty')}</div>`;
    } else {
      templatesList.innerHTML = templates.map((tpl, i) => `
        <div class="template-item" data-index="${i}">
          <div class="template-item-header">
            <div class="template-icon-preview" style="background:${escapeHtmlAttr(tpl.color || TEMPLATE_COLORS[i % TEMPLATE_COLORS.length])}">
              ${escapeHtml((tpl.name || '?')[0])}
            </div>
            <input type="text" class="template-name-input" value="${escapeHtmlAttr(tpl.name)}"
                   placeholder="${tplNamePlaceholder}" data-field="name" data-index="${i}">
            <div class="template-item-actions">
              <button class="template-action-btn move-up-btn" data-index="${i}" title="↑" ${i === 0 ? 'disabled' : ''}>▲</button>
              <button class="template-action-btn move-down-btn" data-index="${i}" title="↓" ${i === templates.length - 1 ? 'disabled' : ''}>▼</button>
              <button class="template-action-btn delete-btn" data-index="${i}" title="✕">✕</button>
            </div>
          </div>
          <div class="template-color-row">
            ${TEMPLATE_COLORS.map((c) => `
              <span class="color-dot${(tpl.color || '') === c ? ' active' : ''}"
                    data-color="${c}" data-index="${i}"
                    style="background:${c}" title="${c}"></span>
            `).join('')}
          </div>
          <textarea class="template-prompt-input" rows="2"
                    placeholder="${tplPromptPlaceholder}"
                    data-field="prompt" data-index="${i}">${escapeHtml(tpl.prompt)}</textarea>
          <div class="template-vars-hint">
            <span><code>{<!-- -->{current_text}}</code>${tplVarHintText}</span>
            <span><code>{<!-- -->{current_url}}</code>${tplVarHintUrl}</span>
            <span><code>{<!-- -->{current_page}}</code>${tplVarHintPage}</span>
          </div>
          <div class="template-card-toggle">
            <label class="toggle-label">
              <input type="checkbox" class="card-toggle-checkbox" data-index="${i}"${tpl.generateCard ? ' checked' : ''}>
              <span class="toggle-switch"></span>
              <span class="toggle-text">${cardLabel}</span>
            </label>
            <span class="toggle-hint">${cardHint}</span>
          </div>
        </div>
      `).join('');
    }

    bindTemplateEvents();
  }

  function bindTemplateEvents() {
    templatesList.querySelectorAll('[data-field]').forEach((el) => {
      el.addEventListener('input', () => {
        const idx = parseInt(el.dataset.index);
        const field = el.dataset.field;
        if (idx >= 0 && idx < templates.length) {
          templates[idx][field] = el.value;
          if (field === 'name') {
            const preview = templatesList.querySelector(`.template-item[data-index="${idx}"] .template-icon-preview`);
            if (preview) preview.textContent = (el.value || '?')[0];
          }
          saveTemplates();
        }
      });
    });

    templatesList.querySelectorAll('.color-dot').forEach((dot) => {
      dot.addEventListener('click', () => {
        const idx = parseInt(dot.dataset.index);
        const color = dot.dataset.color;
        if (idx >= 0 && idx < templates.length) {
          templates[idx].color = color;
          templatesList.querySelectorAll(`.color-dot[data-index="${idx}"]`).forEach(d => d.classList.remove('active'));
          dot.classList.add('active');
          const preview = templatesList.querySelector(`.template-item[data-index="${idx}"] .template-icon-preview`);
          if (preview) preview.style.background = color;
          saveTemplates();
        }
      });
    });

    templatesList.querySelectorAll('.delete-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index);
        if (idx >= 0 && idx < templates.length) {
          templates.splice(idx, 1);
          saveTemplates();
          renderTemplates();
        }
      });
    });

    templatesList.querySelectorAll('.move-up-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index);
        if (idx > 0) {
          [templates[idx - 1], templates[idx]] = [templates[idx], templates[idx - 1]];
          saveTemplates();
          renderTemplates();
        }
      });
    });

    templatesList.querySelectorAll('.move-down-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index);
        if (idx < templates.length - 1) {
          [templates[idx], templates[idx + 1]] = [templates[idx + 1], templates[idx]];
          saveTemplates();
          renderTemplates();
        }
      });
    });

    templatesList.querySelectorAll('.card-toggle-checkbox').forEach((cb) => {
      cb.addEventListener('change', () => {
        const idx = parseInt(cb.dataset.index);
        if (idx >= 0 && idx < templates.length) {
          templates[idx].generateCard = cb.checked;
          saveTemplates();
        }
      });
    });
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function escapeHtmlAttr(str) {
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  addTemplateBtn.addEventListener('click', () => {
    templates.push({
      id: 'tpl_' + Date.now(),
      name: t('newTemplateName'),
      color: TEMPLATE_COLORS[templates.length % TEMPLATE_COLORS.length],
      prompt: t('newTemplatePrompt'),
      generateCard: false
    });
    saveTemplates();
    renderTemplates();
  });

  // ========== 初始化 ==========
  initI18n();
  updateLangToggle();
  loadConfig();
  loadTemplates();
})();
