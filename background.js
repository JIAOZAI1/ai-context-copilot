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
  }
  return true;
});
