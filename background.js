// AI Context Copilot — Background Service Worker
// Handles context menu, extension icon click → side panel, and runtime messages

chrome.runtime.onInstalled.addListener(() => {
  // 右键菜单：将选中文本发送到侧边栏对话
  chrome.contextMenus.create({
    id: 'ask-ai-selection',
    title: '🤖 用 AI Copilot 解释选中文本',
    contexts: ['selection']
  });
});

// 右键菜单点击 → 打开侧边栏并发送选中文本
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'ask-ai-selection' && info.selectionText) {
    // 先打开侧边栏
    chrome.sidePanel.open({ windowId: tab.windowId }).then(() => {
      // 延迟发送消息，确保侧边栏已加载
      setTimeout(() => {
        chrome.runtime.sendMessage({
          type: 'context-menu-query',
          text: info.selectionText
        });
      }, 500);
    });
  }
});

// 点击扩展图标 → 打开侧边栏
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

// 监听来自 content script 的消息，转发给侧边栏
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'open-sidepanel') {
    chrome.sidePanel.open({ windowId: sender.tab.windowId }).then(() => {
      setTimeout(() => {
        chrome.runtime.sendMessage({
          type: 'query-from-page',
          text: message.text,
          pageUrl: message.pageUrl
        });
      }, 500);
    });
    sendResponse({ success: true });
    return true;
  }

  // API 代理（非流式，用于连接测试）—— background 不受 CORS 限制
  if (message.type === 'api-proxy') {
    (async () => {
      try {
        const response = await fetch(message.url, {
          method: 'POST',
          headers: message.headers,
          body: message.body
        });
        const text = await response.text();
        try { sendResponse({ ok: response.ok, status: response.status, body: text }); } catch (_) {}
      } catch (err) {
        try { sendResponse({ error: err.message }); } catch (_) {}
      }
    })();
    return true;
  }

  return false;
});

// API 代理（流式，用于 AI 请求）—— background 不受 CORS 限制
{
  const activeStreams = new Map();
  let streamIdCounter = 0;

  chrome.runtime.onConnect.addListener((port) => {
    if (port.name !== 'api-proxy-stream') return;

    let abortController = null;
    let streamId = null;

    port.onMessage.addListener(async (msg) => {
      if (msg.type === 'start') {
        streamId = ++streamIdCounter;
        abortController = new AbortController();
        activeStreams.set(streamId, abortController);

        try {
          const response = await fetch(msg.url, {
            method: 'POST',
            headers: msg.headers,
            body: msg.body,
            signal: abortController.signal
          });

          if (!response.ok) {
            const text = await response.text();
            try { port.postMessage({ type: 'error', message: `HTTP ${response.status}: ${text.substring(0, 200)}` }); } catch (_) {}
            return;
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed) {
                try { port.postMessage({ type: 'line', line: trimmed }); } catch (_) { return; }
              }
            }
          }

          if (buffer.trim()) {
            try { port.postMessage({ type: 'line', line: buffer.trim() }); } catch (_) {}
          }

          try { port.postMessage({ type: 'done' }); } catch (_) {}
        } catch (err) {
          if (err.name === 'AbortError') {
            try { port.postMessage({ type: 'done' }); } catch (_) {}
          } else {
            try { port.postMessage({ type: 'error', message: err.message }); } catch (_) {}
          }
        } finally {
          if (streamId != null) activeStreams.delete(streamId);
        }
      } else if (msg.type === 'abort') {
        if (abortController) abortController.abort();
      }
    });

    port.onDisconnect.addListener(() => {
      if (abortController) abortController.abort();
      if (streamId != null) activeStreams.delete(streamId);
    });
  });
}
