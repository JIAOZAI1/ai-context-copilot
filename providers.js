// ============================================
// AI Context Copilot — Provider Registry
// 多模型接入：OpenAI / DeepSeek / Anthropic / Ollama / 自定义
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
async function streamAIRequest(providerId, config, messages, onChunk, onDone, onError, signal) {
  const provider = getProvider(providerId);
  const baseUrl = (config.baseUrl || provider.baseUrl).replace(/\/$/, '');
  const endpoint = config.endpoint || provider.endpoint;
  const apiKey = config.apiKey || '';

  // 支持 provider 自定义 URL 构建（如 Gemini 将 API Key 和 model 嵌入 URL）
  let url;
  if (provider.buildUrl) {
    url = provider.buildUrl(baseUrl, config.model, apiKey);
  } else {
    url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: provider.getHeaders(apiKey),
      body: provider.buildBody(config.model, messages, true, config.maxTokens),
      signal
    });

    await provider.checkError(response);

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Ollama 使用 NDJSON，按完整行解析
      if (providerId === 'ollama') {
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          const result = provider.parseStreamLine(trimmed);
          if (result) {
            if (result.done) { onDone(); return; }
            if (result.content) onChunk(result.content);
          }
        }
      } else {
        // OpenAI / Anthropic 使用 SSE 格式
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        let currentEvent = '';

        for (const line of lines) {
          const trimmed = line.trim();

          // 跟踪 SSE event 类型（Anthropic 需要，OpenAI 忽略）
          if (trimmed.startsWith('event: ')) {
            currentEvent = trimmed.slice(7);
            continue;
          }

          if (!trimmed.startsWith('data: ')) continue;

          const result = provider.parseStreamLine(trimmed);
          if (result) {
            if (result.done) { onDone(); return; }
            if (result.content) onChunk(result.content);
          }
        }
      }
    }

    onDone();
  } catch (err) {
    if (err.name === 'AbortError') {
      onDone();
    } else {
      onError(err);
    }
  }
}
