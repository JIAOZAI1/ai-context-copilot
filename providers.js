// ============================================
// AI Context Copilot — Provider Registry
// 多模型接入：OpenAI / DeepSeek / Anthropic / Gemini / Ollama / 自定义
// ============================================

const AI_PROVIDERS = {

  // ---------- OpenAI 及兼容接口 ----------
  'openai': {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com',
    endpoint: '/v1/chat/completions',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4.1', 'gpt-4.1-mini', 'o3-mini', 'o4-mini'],
    docsUrl: 'https://platform.openai.com/api-keys',

    getHeaders(apiKey) {
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      };
    },

    buildBody(model, messages, stream, maxTokens) {
      return JSON.stringify({
        model,
        messages,
        stream,
        temperature: 0.7,
        max_tokens: maxTokens || 4096
      });
    },

    parseStreamLine(line) {
      if (!line.startsWith('data: ')) return null;
      const data = line.slice(6);
      if (data === '[DONE]') return { done: true };
      try {
        const json = JSON.parse(data);
        return { content: json.choices?.[0]?.delta?.content || null };
      } catch (_) { return null; }
    },

    async checkError(response) {
      if (!response.ok) {
        const text = await response.text();
        let msg = `HTTP ${response.status}`;
        try { msg = JSON.parse(text).error?.message || msg; } catch (_) {}
        throw new Error(msg);
      }
    }
  },

  // ---------- DeepSeek ----------
  'deepseek': {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com',
    endpoint: '/chat/completions',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    docsUrl: 'https://platform.deepseek.com/api_keys',

    getHeaders(apiKey) {
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      };
    },

    buildBody(model, messages, stream, maxTokens) {
      return JSON.stringify({
        model,
        messages,
        stream,
        temperature: 0.7,
        max_tokens: maxTokens || 4096
      });
    },

    parseStreamLine(line) {
      if (!line.startsWith('data: ')) return null;
      const data = line.slice(6);
      if (data === '[DONE]') return { done: true };
      try {
        const json = JSON.parse(data);
        return { content: json.choices?.[0]?.delta?.content || null };
      } catch (_) { return null; }
    },

    async checkError(response) {
      if (!response.ok) {
        const text = await response.text();
        let msg = `HTTP ${response.status}`;
        try { msg = JSON.parse(text).error?.message || msg; } catch (_) {}
        throw new Error(msg);
      }
    }
  },

  // ---------- Anthropic Claude ----------
  'anthropic': {
    id: 'anthropic',
    name: 'Anthropic Claude',
    baseUrl: 'https://api.anthropic.com',
    endpoint: '/v1/messages',
    models: ['claude-sonnet-4-6', 'claude-opus-4-7', 'claude-haiku-4-5-20251001',
             'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022',
             'claude-3-opus-20240229'],
    docsUrl: 'https://console.anthropic.com/keys',

    getHeaders(apiKey) {
      return {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      };
    },

    // Anthropic 将 system prompt 作为顶层参数，而非 message
    buildBody(model, messages, stream, maxTokens) {
      const systemMsg = messages.find(m => m.role === 'system');
      const conversation = messages.filter(m => m.role !== 'system');
      const body = {
        model,
        messages: conversation,
        max_tokens: maxTokens || 4096,
        stream
      };
      if (systemMsg) body.system = systemMsg.content;
      return JSON.stringify(body);
    },

    // Anthropic SSE 流式格式: event + data，仅需 content_block_delta
    parseStreamLine(line) {
      if (!line.startsWith('data: ')) return null;
      const data = line.slice(6);
      try {
        const json = JSON.parse(data);
        if (json.type === 'content_block_delta') {
          return { content: json.delta?.text || null };
        }
        if (json.type === 'message_stop') {
          return { done: true };
        }
        return null;
      } catch (_) { return null; }
    },

    async checkError(response) {
      if (!response.ok) {
        const text = await response.text();
        let msg = `HTTP ${response.status}`;
        try { msg = JSON.parse(text).error?.message || msg; } catch (_) {}
        throw new Error(msg);
      }
    }
  },

  // ---------- Google Gemini ----------
  'gemini': {
    id: 'gemini',
    name: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com',
    endpoint: '/v1beta/models/{model}:generateContent',
    models: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-pro', 'gemini-1.5-flash'],
    docsUrl: 'https://aistudio.google.com/apikey',

    // Gemini 将 API Key 嵌入 URL 查询参数，无 Authorization header
    buildUrl(baseUrl, model, apiKey, stream) {
      // 重置流式文本缓存
      this._lastTextLength = 0;

      const action = stream ? 'streamGenerateContent' : 'generateContent';
      const url = `${baseUrl}/v1beta/models/${model}:${action}`;
      const params = [];
      if (apiKey) params.push(`key=${encodeURIComponent(apiKey)}`);
      if (stream) params.push('alt=sse');
      return params.length ? `${url}?${params.join('&')}` : url;
    },

    getHeaders(apiKey) {
      return { 'Content-Type': 'application/json' };
    },

    // Gemini uses contents array + systemInstruction (not messages)
    buildBody(model, messages, stream, maxTokens) {
      const systemMsg = messages.find(m => m.role === 'system');
      const conversation = messages.filter(m => m.role !== 'system');

      const contents = conversation.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      const body = {
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: maxTokens || 4096
        }
      };

      if (systemMsg) {
        body.systemInstruction = {
          parts: [{ text: systemMsg.content }]
        };
      }

      return JSON.stringify(body);
    },

    // Gemini SSE 每个 chunk 包含完整累积文本（非增量），需自行计算 delta
    parseStreamLine(line) {
      if (!line.startsWith('data: ')) return null;
      const data = line.slice(6);
      try {
        const json = JSON.parse(data);
        const candidate = json.candidates?.[0];
        if (!candidate) return null;
        const fullText = candidate.content?.parts?.[0]?.text || '';
        const delta = fullText.slice(this._lastTextLength || 0);
        this._lastTextLength = fullText.length;
        if (candidate.finishReason === 'STOP') {
          this._lastTextLength = 0;
          return delta ? { content: delta, done: true } : { done: true };
        }
        return delta ? { content: delta } : null;
      } catch (_) { return null; }
    },

    async checkError(response) {
      if (!response.ok) {
        const text = await response.text();
        let msg = `HTTP ${response.status}`;
        try { msg = JSON.parse(text).error?.message || msg; } catch (_) {}
        throw new Error(msg);
      }
    }
  },

  // ---------- Ollama (本地模型) ----------
  'ollama': {
    id: 'ollama',
    name: 'Ollama (本地)',
    baseUrl: 'http://localhost:11434',
    endpoint: '/api/chat',
    models: ['llama3', 'llama3.1', 'llama3.2', 'mistral', 'gemma2', 'qwen2.5', 'deepseek-r1', 'phi3'],
    docsUrl: 'https://ollama.com/download',

    // Ollama 本地服务通常不需要 API Key
    getHeaders(apiKey) {
      const headers = { 'Content-Type': 'application/json' };
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
      return headers;
    },

    buildBody(model, messages, stream, maxTokens) {
      return JSON.stringify({
        model,
        messages,
        stream,
        options: {
          temperature: 0.7,
          num_predict: maxTokens || 4096
        }
      });
    },

    // Ollama 使用 NDJSON（每行一个完整 JSON），非 SSE
    parseStreamLine(line) {
      try {
        const json = JSON.parse(line);
        if (json.done) return { done: true };
        return { content: json.message?.content || null };
      } catch (_) { return null; }
    },

    async checkError(response) {
      if (!response.ok) {
        const text = await response.text();
        let msg = `HTTP ${response.status}`;
        try { msg = JSON.parse(text).error || msg; } catch (_) {}
        throw new Error(msg);
      }
    }
  },

  // ---------- 通用 OpenAI 兼容接口 (OpenRouter / Groq / Together / OneAPI 等) ----------
  'openai-compat': {
    id: 'openai-compat',
    name: 'OpenAI 兼容接口',
    baseUrl: 'https://api.openai.com',
    endpoint: '/v1/chat/completions',
    models: ['gpt-4o-mini', 'gpt-4o', 'deepseek-chat', 'claude-3-5-sonnet', 'gemini-2.0-flash'],
    docsUrl: '',

    getHeaders(apiKey) {
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      };
    },

    buildBody(model, messages, stream, maxTokens) {
      return JSON.stringify({
        model,
        messages,
        stream,
        temperature: 0.7,
        max_tokens: maxTokens || 4096
      });
    },

    parseStreamLine(line) {
      if (!line.startsWith('data: ')) return null;
      const data = line.slice(6);
      if (data === '[DONE]') return { done: true };
      try {
        const json = JSON.parse(data);
        return { content: json.choices?.[0]?.delta?.content || null };
      } catch (_) { return null; }
    },

    async checkError(response) {
      if (!response.ok) {
        const text = await response.text();
        let msg = `HTTP ${response.status}`;
        try { msg = JSON.parse(text).error?.message || msg; } catch (_) {}
        throw new Error(msg);
      }
    }
  },

  // ---------- 完全自定义 ----------
  'custom': {
    id: 'custom',
    name: '自定义',
    baseUrl: '',
    endpoint: '',
    models: [],
    docsUrl: '',

    getHeaders(apiKey) {
      return {
        'Content-Type': 'application/json',
        'Authorization': `${apiKey}`
      };
    },

    buildBody(model, messages, stream, maxTokens) {
      return JSON.stringify({
        model,
        messages,
        stream,
        temperature: 0.7,
        max_tokens: maxTokens || 4096
      });
    },

    parseStreamLine(line) {
      // 默认尝试 OpenAI SSE 格式
      if (!line.startsWith('data: ')) return null;
      const data = line.slice(6);
      if (data === '[DONE]') return { done: true };
      try {
        const json = JSON.parse(data);
        return { content: json.choices?.[0]?.delta?.content || null };
      } catch (_) { return null; }
    },

    async checkError(response) {
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text.substring(0, 200)}`);
      }
    }
  }
};

// ---------- 获取指定 provider 配置 ----------
function getProvider(providerId) {
  return AI_PROVIDERS[providerId] || AI_PROVIDERS['openai-compat'];
}

// ---------- 列出所有可用的 provider ----------
function listProviders() {
  return Object.values(AI_PROVIDERS).map(p => ({
    id: p.id,
    name: p.name,
    baseUrl: p.baseUrl,
    models: p.models,
    docsUrl: p.docsUrl
  }));
}

// ---------- 通用流式请求 ----------
// 通过 background service worker 代理，避免 content script / side panel 的 CORS 限制
async function streamAIRequest(providerId, config, messages, onChunk, onDone, onError, signal) {
  const provider = getProvider(providerId);
  const baseUrl = (config.baseUrl || provider.baseUrl).replace(/\/$/, '');
  const endpoint = config.endpoint || provider.endpoint;
  const apiKey = config.apiKey || '';

  let url;
  if (provider.buildUrl) {
    url = provider.buildUrl(baseUrl, config.model, apiKey, true);
  } else {
    url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;
  }

  return new Promise((resolve) => {
    let completed = false;

    const finish = () => {
      if (completed) return;
      completed = true;
      try { port.disconnect(); } catch (_) { /* already closed */ }
      resolve();
    };

    let port;
    try {
      port = chrome.runtime.connect({ name: 'api-proxy-stream' });
    } catch (err) {
      onError(err);
      return resolve();
    }

    port.onMessage.addListener((msg) => {
      if (msg.type === 'line') {
        const result = provider.parseStreamLine(msg.line);
        if (result) {
          if (result.content) onChunk(result.content);
          if (result.done) { onDone(); finish(); }
        }
      } else if (msg.type === 'done') {
        onDone();
        finish();
      } else if (msg.type === 'error') {
        onError(new Error(msg.message));
        finish();
      }
    });

    port.onDisconnect.addListener(() => {
      if (!completed) {
        completed = true;
        onError(new Error('Background connection lost'));
        resolve();
      }
    });

    // 支持 AbortController 取消请求
    if (signal) {
      if (signal.aborted) {
        onDone();
        return finish();
      }
      signal.addEventListener('abort', () => {
        try { port.postMessage({ type: 'abort' }); } catch (_) {}
        onDone();
        finish();
      }, { once: true });
    }

    port.postMessage({
      type: 'start',
      url,
      headers: provider.getHeaders(apiKey),
      body: provider.buildBody(config.model, messages, true, config.maxTokens)
    });
  });
}
