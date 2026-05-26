// ============================================
// AI Context Copilot — 配额 & 付费模块
// 每日免费额度 + ExtensionPay 买断检查
// 适用于 content script / sidepanel / options 三个上下文
// ============================================

const DAILY_LIMIT = 10;
const PAYMENT_CACHE_TTL_MS = 3600000; // 1 小时

// ---------- 获取今天的日期字符串 ----------
function todayStr() {
  return new Date().toISOString().split('T')[0];
}

// ---------- 获取付费状态 ----------
async function getPaymentStatus() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['paid', 'paidCheckedAt'], (items) => {
      const now = Date.now();
      const cached = items.paidCheckedAt;
      // 缓存未过期且已付费，直接信任缓存
      if (cached && (now - cached) < PAYMENT_CACHE_TTL_MS && items.paid) {
        resolve({ paid: true, source: 'cache' });
        return;
      }
      // 缓存过期或未付费，尝试从 background 刷新
      chrome.runtime.sendMessage({ type: 'refresh-payment-status' }, (response) => {
        if (chrome.runtime.lastError || !response) {
          // background 不可达，退守缓存
          resolve({ paid: !!items.paid, source: 'cache-fallback' });
        } else {
          resolve({ paid: response.paid, source: 'fresh' });
        }
      });
    });
  });
}

// ---------- 获取今日已用次数 ----------
async function getDailyCount() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['quotaDate', 'quotaCount'], (items) => {
      const today = todayStr();
      if (items.quotaDate !== today) {
        // 日期不匹配，自动重置
        chrome.storage.local.set({ quotaDate: today, quotaCount: 0 });
        resolve(0);
      } else {
        resolve(items.quotaCount || 0);
      }
    });
  });
}

// ---------- 递增今日计数 ----------
async function incrementDailyCount() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['quotaDate', 'quotaCount'], (items) => {
      const today = todayStr();
      const count = (items.quotaDate === today ? items.quotaCount : 0) + 1;
      chrome.storage.local.set({ quotaDate: today, quotaCount: count }, () => {
        resolve(count);
      });
    });
  });
}

// ---------- 检查配额并消耗 ----------
// 返回值: { allowed, reason, used, limit, remaining? }
async function checkAndUseQuota() {
  try {
    const payment = await getPaymentStatus();
    if (payment.paid) {
      return { allowed: true, reason: 'paid', limit: Infinity };
    }

    const count = await getDailyCount();
    if (count >= DAILY_LIMIT) {
      return { allowed: false, reason: 'exceeded', used: count, limit: DAILY_LIMIT, remaining: 0 };
    }

    const newCount = await incrementDailyCount();
    return { allowed: true, reason: 'free', used: newCount, limit: DAILY_LIMIT, remaining: DAILY_LIMIT - newCount };
  } catch (err) {
    console.warn('Quota check failed:', err);
    // 存储异常时 fail-closed
    return { allowed: false, reason: 'error', used: DAILY_LIMIT, limit: DAILY_LIMIT, remaining: 0 };
  }
}

// ---------- 读取当前配额信息（不消耗）----------
async function getQuotaInfo() {
  try {
    const [payment, count] = await Promise.all([getPaymentStatus(), getDailyCount()]);
    return { paid: payment.paid, used: count, limit: DAILY_LIMIT, remaining: Math.max(0, DAILY_LIMIT - count) };
  } catch (err) {
    return { paid: false, used: DAILY_LIMIT, limit: DAILY_LIMIT, remaining: 0 };
  }
}

// ---------- 打开支付页面 ----------
function openPaymentPage() {
  chrome.runtime.sendMessage({ type: 'open-payment-page' });
}

// ---------- 生成付费墙 HTML ----------
function getPaywallHTML(quota) {
  const used = quota.used || DAILY_LIMIT;
  const limit = quota.limit || DAILY_LIMIT;
  return `
<div class="aicc-paywall" style="text-align:center;padding:40px 24px;">
  <div style="font-size:56px;margin-bottom:16px;line-height:1;">🔒</div>
  <h3 style="font-size:20px;font-weight:800;color:#1e293b;margin:0 0 8px 0;">
    ${getPaywallTitle()}
  </h3>
  <p style="font-size:14px;color:#64748b;margin:0 0 6px 0;line-height:1.6;">
    ${getPaywallDesc(used, limit)}
  </p>
  <p style="font-size:12px;color:#94a3b8;margin:0 0 24px 0;">
    ${getPaywallHint()}
  </p>
  <button class="paywall-unlock-btn" style="
    display:inline-block;
    padding:12px 32px;
    background:linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color:#fff;
    border:none;
    border-radius:10px;
    font-size:15px;
    font-weight:700;
    cursor:pointer;
    box-shadow:0 4px 16px rgba(99,102,241,0.35);
    transition:all 0.15s ease;
  " onmouseover="this.style.transform='translateY(-1px)';this.style.boxShadow='0 6px 20px rgba(99,102,241,0.45)';"
     onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 4px 16px rgba(99,102,241,0.35)';">
    🚀 ${getPaywallBtnText()}
  </button>
</div>`;
}

// ---------- 付费墙文案（支持中英文）----------
function getPaywallTitle() {
  try { return t('paywallTitle'); } catch (_) {}
  return (typeof I18N !== 'undefined') ? 'Daily Limit Reached' : '已达每日限额';
}

function getPaywallDesc(used, limit) {
  const key = 'paywallDesc';
  try {
    if (typeof t === 'function') return t(key).replace('{used}', used).replace('{limit}', limit);
  } catch (_) {}
  return `You've used ${used}/${limit} free generations today.`;
}

function getPaywallHint() {
  try { return t('paywallHint'); } catch (_) {}
  return 'Resets at midnight · Or upgrade for unlimited use';
}

function getPaywallBtnText() {
  try { return t('paywallBtn'); } catch (_) {}
  return 'Unlock Unlimited';
}
