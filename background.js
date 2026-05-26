// AI Context Copilot — Background Service Worker
// Handles context menu, extension icon click → side panel, runtime messages, and ExtensionPay

importScripts('ExtPay.js');
const extpay = ExtPay('ai-context-copilot');

// ---------- ExtensionPay 初始化 ----------
extpay.startBackground();

function cachePaymentStatus() {
  extpay.getUser().then((user) => {
    chrome.storage.local.set({ paid: !!user.paid, paidCheckedAt: Date.now() });
  }).catch(() => {
    // 网络错误静默处理，留待下次刷新
  });
}

// 启动时缓存一次
cachePaymentStatus();

// 支付完成监听
extpay.onPaid.addListener((user) => {
  chrome.storage.local.set({ paid: true, paidCheckedAt: Date.now() });
  // 广播给所有 extension page
  chrome.runtime.sendMessage({ type: 'payment-completed' }).catch(() => {});
});

// ---------- 右键菜单 ----------
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'ask-ai-selection',
    title: '🤖 用 AI Copilot 解释选中文本',
    contexts: ['selection']
  });
});

// 右键菜单点击 → 打开侧边栏并发送选中文本
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'ask-ai-selection' && info.selectionText) {
    chrome.sidePanel.open({ windowId: tab.windowId }).then(() => {
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

// ---------- 消息路由 ----------
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // 打开侧边栏（来自 content script）
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

  // 打开 ExtensionPay 支付页面
  if (message.type === 'open-payment-page') {
    extpay.openPaymentPage();
    sendResponse({ success: true });
    return true;
  }

  // 刷新付费状态
  if (message.type === 'refresh-payment-status') {
    extpay.getUser().then((user) => {
      chrome.storage.local.set({ paid: !!user.paid, paidCheckedAt: Date.now() });
      sendResponse({ paid: !!user.paid });
    }).catch((err) => {
      sendResponse({ paid: false, error: err.message });
    });
    return true;
  }
});
