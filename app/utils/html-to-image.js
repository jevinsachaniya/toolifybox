/**
 * Toolifybox — HTML to Image Converter Utility
 * High-performance, client-side HTML and CSS to PNG, JPG, and WebP conversion.
 * 100% in-browser processing with zero server uploads.
 */

export const HTML_IMAGE_FORMATS = [
  { id: 'png', label: 'PNG (Lossless & Transparent)', mime: 'image/png', ext: 'png', supportsAlpha: true },
  { id: 'jpg', label: 'JPG / JPEG (Compact File Size)', mime: 'image/jpeg', ext: 'jpg', supportsAlpha: false },
  { id: 'webp', label: 'WebP (Modern Web Format)', mime: 'image/webp', ext: 'webp', supportsAlpha: true },
];

export const HTML_IMAGE_SCALES = [
  { id: '1', label: '1x (Standard 96 DPI)', scale: 1 },
  { id: '2', label: '2x (Retina / High Res)', scale: 2 },
  { id: '3', label: '3x (Ultra HD / Print 300 DPI)', scale: 3 },
];

export const HTML_IMAGE_VIEWPORTS = [
  { id: 'auto', label: 'Auto (Fit Content Width)', width: 0 },
  { id: '800', label: '800px (Tablet / Card)', width: 800 },
  { id: '1080', label: '1080px (Instagram / Social)', width: 1080 },
  { id: '1200', label: '1200px (Desktop / OG Banner)', width: 1200 },
  { id: '1920', label: '1920px (Full HD 1080p)', width: 1920 },
];

export const HTML_IMAGE_BG_OPTIONS = [
  { id: 'transparent', label: 'Transparent Background', color: null },
  { id: 'white', label: 'White (#ffffff)', color: '#ffffff' },
  { id: 'dark', label: 'Dark Charcoal (#0f172a)', color: '#0f172a' },
  { id: 'custom', label: 'Custom Color', color: '#f8fafc' },
];

export const HTML_IMAGE_TEMPLATES = [
  {
    id: 'social-card',
    name: 'Social Media Promo Card',
    badge: 'Popular',
    format: 'png',
    viewport: '1200',
    html: `<div class="social-banner">
  <div class="banner-badge">🚀 LAUNCH ANNOUNCEMENT</div>
  <h1 class="banner-title">Build High-Performance Apps with 100% Privacy</h1>
  <p class="banner-desc">Transform, convert, and manipulate your documents and images directly in the browser using WebAssembly. Zero cloud uploads.</p>
  
  <div class="banner-footer">
    <div class="author-block">
      <div class="author-avatar">WP</div>
      <div>
        <div class="author-name">We Make PDF Studio</div>
        <div class="author-handle">@wemakepdf &bull; wemakepdf.com</div>
      </div>
    </div>
    <div class="stats-pill">
      <span class="stat-star">★ 4.9</span>
      <span class="stat-users">100k+ Users</span>
    </div>
  </div>
</div>`,
    css: `.social-banner {
  box-sizing: border-box;
  width: 100%;
  max-width: 1200px;
  padding: 64px;
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #311042 100%);
  border-radius: 28px;
  color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.12);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 480px;
}

.banner-badge {
  display: inline-block;
  align-self: flex-start;
  padding: 8px 18px;
  border-radius: 999px;
  background: rgba(225, 29, 72, 0.25);
  border: 1px solid rgba(244, 63, 94, 0.4);
  color: #fda4af;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.banner-title {
  font-size: 44px;
  line-height: 1.18;
  font-weight: 800;
  margin: 28px 0 16px;
  letter-spacing: -0.02em;
  background: linear-gradient(to right, #ffffff, #f1f5f9 60%, #cbd5e1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.banner-desc {
  font-size: 19px;
  line-height: 1.5;
  color: #94a3b8;
  max-width: 780px;
  margin: 0;
}

.banner-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 48px;
  padding-top: 28px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.author-block {
  display: flex;
  align-items: center;
  gap: 16px;
}

.author-avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e11d48, #f43f5e);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 18px;
  box-shadow: 0 4px 14px rgba(225, 29, 72, 0.4);
}

.author-name {
  font-size: 16px;
  font-weight: 700;
}

.author-handle {
  font-size: 13.5px;
  color: #94a3b8;
  margin-top: 2px;
}

.stats-pill {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.stat-star {
  color: #fbbf24;
  font-weight: 800;
  font-size: 15px;
}

.stat-users {
  color: #e2e8f0;
  font-size: 14px;
  font-weight: 600;
}`,
  },
  {
    id: 'receipt',
    name: 'Payment Receipt / Invoice',
    badge: 'Finance',
    format: 'png',
    viewport: '800',
    html: `<div class="receipt-card">
  <div class="receipt-top">
    <div class="check-circle">&#10003;</div>
    <div class="receipt-status">Payment Completed</div>
    <div class="receipt-amount">$349.00</div>
    <div class="receipt-date">Oct 30, 2026 &bull; Transaction ID: #TX-984210</div>
  </div>

  <div class="receipt-divider"></div>

  <div class="receipt-table">
    <div class="receipt-row">
      <span class="row-label">Plan Name</span>
      <span class="row-val font-bold">Pro Developer Annual</span>
    </div>
    <div class="receipt-row">
      <span class="row-label">Billed To</span>
      <span class="row-val">Sarah Jenkins (sarah.j@techcorp.io)</span>
    </div>
    <div class="receipt-row">
      <span class="row-label">Payment Method</span>
      <span class="row-val">Visa ending in 4242</span>
    </div>
    <div class="receipt-row">
      <span class="row-label">Subtotal</span>
      <span class="row-val">$320.00</span>
    </div>
    <div class="receipt-row">
      <span class="row-label">Estimated Tax (9.06%)</span>
      <span class="row-val">$29.00</span>
    </div>
    <div class="receipt-row total-row">
      <span class="row-label">Total Amount Paid</span>
      <span class="row-val">$349.00 USD</span>
    </div>
  </div>

  <div class="receipt-footer">
    Thank you for choosing We Make PDF. Need help? Contact support@wemakepdf.com
  </div>
</div>`,
    css: `.receipt-card {
  box-sizing: border-box;
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
  padding: 44px 36px;
  background: #ffffff;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 16px 40px -10px rgba(15, 23, 42, 0.1);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #0f172a;
}

.receipt-top {
  text-align: center;
}

.check-circle {
  width: 56px;
  height: 56px;
  margin: 0 auto 16px;
  border-radius: 50%;
  background: #ecfdf5;
  color: #059669;
  font-size: 26px;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
}

.receipt-status {
  font-size: 14px;
  font-weight: 700;
  color: #059669;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.receipt-amount {
  font-size: 40px;
  font-weight: 800;
  margin: 8px 0 4px;
  color: #0f172a;
}

.receipt-date {
  font-size: 13px;
  color: #64748b;
}

.receipt-divider {
  height: 1px;
  background: #f1f5f9;
  margin: 28px 0;
}

.receipt-table {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.receipt-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.row-label {
  color: #64748b;
}

.row-val {
  color: #0f172a;
  text-align: right;
}

.font-bold {
  font-weight: 700;
}

.total-row {
  margin-top: 10px;
  padding-top: 16px;
  border-top: 2px dashed #cbd5e1;
  font-size: 17px;
  font-weight: 800;
}

.total-row .row-val {
  color: #e11d48;
}

.receipt-footer {
  margin-top: 32px;
  text-align: center;
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.5;
}`,
  },
  {
    id: 'certificate',
    name: 'Award / Certificate Badge',
    badge: 'Design',
    format: 'png',
    viewport: '1080',
    html: `<div class="cert-frame">
  <div class="cert-border">
    <div class="cert-badge">&#9733; CERTIFICATE OF ACHIEVEMENT &#9733;</div>
    <h2 class="cert-subtitle">This award is proudly presented to</h2>
    <h1 class="cert-recipient">Alexander Montgomery</h1>
    <p class="cert-desc">For outstanding mastery, dedication, and excellence in Full-Stack Client-Side Web Architecture and Modern UI Systems.</p>

    <div class="cert-footer">
      <div class="sign-block">
        <div class="sign-line">Jessica Reynolds</div>
        <div class="sign-label">Program Director</div>
      </div>
      <div class="cert-seal">
        <div class="seal-inner">OFFICIAL<br>AWARD</div>
      </div>
      <div class="sign-block">
        <div class="sign-line">David K. Vance</div>
        <div class="sign-label">Chief Academic Officer</div>
      </div>
    </div>
  </div>
</div>`,
    css: `.cert-frame {
  box-sizing: border-box;
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  padding: 24px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.12);
  font-family: 'Georgia', serif;
}

.cert-border {
  border: 6px double #d97706;
  padding: 48px 40px;
  text-align: center;
  background: #fffbeb;
  border-radius: 8px;
}

.cert-badge {
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 0.25em;
  color: #b45309;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  margin-bottom: 20px;
}

.cert-subtitle {
  font-size: 16px;
  font-style: italic;
  color: #78350f;
  margin: 0 0 16px;
}

.cert-recipient {
  font-size: 42px;
  color: #0f172a;
  margin: 0 0 18px;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-decoration: underline;
  text-decoration-color: #f59e0b;
}

.cert-desc {
  font-size: 16px;
  line-height: 1.6;
  color: #451a03;
  max-width: 620px;
  margin: 0 auto 44px;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
}

.cert-footer {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding-top: 10px;
}

.sign-block {
  width: 180px;
  text-align: center;
}

.sign-line {
  font-size: 18px;
  font-style: italic;
  border-bottom: 1.5px solid #78350f;
  padding-bottom: 6px;
  color: #1e293b;
}

.sign-label {
  font-size: 11px;
  color: #92400e;
  text-transform: uppercase;
  margin-top: 6px;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  letter-spacing: 0.05em;
}

.cert-seal {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: radial-gradient(circle, #f59e0b 0%, #b45309 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(180, 83, 9, 0.4);
}

.seal-inner {
  font-size: 10px;
  font-weight: 900;
  color: #ffffff;
  letter-spacing: 0.1em;
  line-height: 1.3;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
}`,
  },
  {
    id: 'kpi-widget',
    name: 'Analytics KPI Widget',
    badge: 'Stats',
    format: 'png',
    viewport: '800',
    html: `<div class="kpi-widget">
  <div class="kpi-header">
    <div>
      <span class="kpi-tag">TOTAL REVENUE (Q4)</span>
      <div class="kpi-value">$1,284,930</div>
    </div>
    <div class="kpi-growth">+24.8% &uarr;</div>
  </div>

  <div class="kpi-bars">
    <div class="bar-col"><div class="bar" style="height: 45%;"></div><span>Jul</span></div>
    <div class="bar-col"><div class="bar" style="height: 60%;"></div><span>Aug</span></div>
    <div class="bar-col"><div class="bar" style="height: 52%;"></div><span>Sep</span></div>
    <div class="bar-col"><div class="bar" style="height: 78%;"></div><span>Oct</span></div>
    <div class="bar-col"><div class="bar active" style="height: 94%;"></div><span>Nov</span></div>
    <div class="bar-col"><div class="bar" style="height: 82%;"></div><span>Dec</span></div>
  </div>

  <div class="kpi-metrics-grid">
    <div class="metric-item">
      <div class="m-title">Active Users</div>
      <div class="m-val">48,219</div>
    </div>
    <div class="metric-item">
      <div class="m-title">Conversion Rate</div>
      <div class="m-val">4.32%</div>
    </div>
    <div class="metric-item">
      <div class="m-title">Avg. Session</div>
      <div class="m-val">6m 42s</div>
    </div>
  </div>
</div>`,
    css: `.kpi-widget {
  box-sizing: border-box;
  width: 100%;
  max-width: 680px;
  margin: 0 auto;
  padding: 36px;
  background: #0f172a;
  border-radius: 20px;
  color: #ffffff;
  border: 1px solid #1e293b;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.kpi-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 28px;
}

.kpi-tag {
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #94a3b8;
}

.kpi-value {
  font-size: 38px;
  font-weight: 800;
  margin-top: 4px;
  letter-spacing: -0.02em;
}

.kpi-growth {
  padding: 6px 14px;
  border-radius: 999px;
  background: rgba(16, 185, 129, 0.2);
  color: #34d399;
  font-size: 13.5px;
  font-weight: 700;
}

.kpi-bars {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  height: 120px;
  padding-bottom: 12px;
  border-bottom: 1px solid #1e293b;
  margin-bottom: 24px;
}

.bar-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  height: 100%;
  justify-content: flex-end;
}

.bar {
  width: 100%;
  background: #334155;
  border-radius: 6px 6px 2px 2px;
  transition: all 0.3s;
}

.bar.active {
  background: linear-gradient(180deg, #e11d48, #be123c);
  box-shadow: 0 0 16px rgba(225, 29, 72, 0.4);
}

.bar-col span {
  font-size: 11px;
  color: #64748b;
  font-weight: 600;
}

.kpi-metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.metric-item {
  background: #1e293b;
  padding: 14px 16px;
  border-radius: 10px;
}

.m-title {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 600;
}

.m-val {
  font-size: 18px;
  font-weight: 800;
  margin-top: 4px;
  color: #f8fafc;
}`,
  },
];

/**
 * Combines HTML body and custom CSS into a clean, standalone HTML5 document.
 */
export function combineHtmlAndCss(html, css = '', options = {}) {
  const {
    title = 'Document Image Export',
    backgroundColor = 'transparent',
    viewportWidth = 0,
  } = options;

  const cleanHtml = (html || '').trim();
  const cleanCss = (css || '').trim();

  // If already a full HTML document, inject or update the custom CSS
  if (/<!doctype\s+html/i.test(cleanHtml) || /<html[\s>]/i.test(cleanHtml)) {
    const styleTag = `<style id="wemakepdf-custom-css">\n${cleanCss}\n</style>`;
    if (cleanHtml.includes('</head>')) {
      return cleanHtml.replace('</head>', `${styleTag}\n</head>`);
    }
    return `${styleTag}\n${cleanHtml}`;
  }

  // Boilerplate wrapper
  const bgStyle = backgroundColor && backgroundColor !== 'transparent'
    ? `background-color: ${backgroundColor};`
    : 'background-color: transparent;';

  const widthStyle = viewportWidth > 0
    ? `width: ${viewportWidth}px; max-width: ${viewportWidth}px; margin: 0 auto;`
    : 'width: max-content; max-width: 100%; margin: 0 auto;';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    *, *::before, *::after {
      box-sizing: border-box;
    }
    html, body {
      margin: 0;
      padding: 0;
      ${bgStyle}
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    #render-container {
      ${widthStyle}
      padding: 16px;
      box-sizing: border-box;
    }
  </style>
  <style id="wemakepdf-custom-css">
${cleanCss}
  </style>
</head>
<body>
  <div id="render-container">
${cleanHtml}
  </div>
</body>
</html>`;
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Generates an output filename with proper image extension.
 */
export function htmlToImageFilename(originalName = 'document', format = 'png') {
  const base = String(originalName || 'document')
    .replace(/\.[a-z0-9]+$/i, '')
    .trim()
    .replace(/[^a-zA-Z0-9_\-\u0900-\u097F\u0A80-\u0AFF]/g, '_')
    .replace(/_+/g, '_') || 'document';

  const ext = format === 'jpg' ? 'jpg' : format === 'webp' ? 'webp' : 'png';
  return `${base}.${ext}`;
}

/**
 * Validates HTML and CSS inputs.
 */
export function validateHtmlInput(html, css = '') {
  if (!html || typeof html !== 'string' || !html.trim()) {
    return { valid: false, error: 'HTML source code is empty. Please enter HTML code or upload a file.' };
  }
  return { valid: true, error: null };
}

/**
 * Renders HTML and CSS directly into an image Blob (PNG, JPG, WebP)
 * using client-side html2canvas in an isolated iframe sandbox.
 * Supports both options object convertHtmlToImage({ html, css, ... })
 * and positional parameters convertHtmlToImage(html, css, options).
 */
export async function convertHtmlToImage(htmlOrOptions, cssArg = '', optionsArg = {}) {
  const isObj = typeof htmlOrOptions === 'object' && htmlOrOptions !== null;
  const html = isObj ? (htmlOrOptions.html || '') : htmlOrOptions;
  const css = isObj ? (htmlOrOptions.css || '') : cssArg;
  const opts = isObj ? htmlOrOptions : optionsArg;

  const {
    format = 'png',
    scale = 2,
    quality = 0.95,
    backgroundColor = 'transparent',
    viewportWidth = 0,
    targetFilename = opts.filename || opts.targetFilename || 'rendered-image.png',
    onProgress = null,
    signal = null,
  } = opts;

  const validation = validateHtmlInput(html, css);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  if (signal?.aborted) {
    const err = new Error('Conversion cancelled.');
    err.name = 'AbortError';
    throw err;
  }

  onProgress?.('Preparing isolated rendering sandbox...');

  const combinedDoc = combineHtmlAndCss(html, css, {
    title: targetFilename,
    backgroundColor,
    viewportWidth,
  });

  // Dynamically load html2canvas in client
  const { default: html2canvas } = await import('html2canvas');

  if (signal?.aborted) {
    const err = new Error('Conversion cancelled.');
    err.name = 'AbortError';
    throw err;
  }

  // Create isolated invisible iframe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-9999px';
  iframe.style.top = '0';
  iframe.style.width = viewportWidth > 0 ? `${viewportWidth + 32}px` : '1200px';
  iframe.style.height = '1000px';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  try {
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(combinedDoc);
    iframeDoc.close();

    onProgress?.('Loading styles and fonts...');
    await new Promise((resolve) => setTimeout(resolve, 200));

    try {
      if (iframeDoc.fonts?.ready) {
        await iframeDoc.fonts.ready;
      }
    } catch {
      // Non-critical fallback
    }

    if (signal?.aborted) {
      const err = new Error('Conversion cancelled.');
      err.name = 'AbortError';
      throw err;
    }

    // Determine target element
    const container = iframeDoc.getElementById('render-container') || iframeDoc.body;
    const contentWidthPx = container.scrollWidth || container.offsetWidth || 800;
    const contentHeightPx = container.scrollHeight || container.offsetHeight || 600;

    iframe.style.width = `${contentWidthPx + 32}px`;
    iframe.style.height = `${contentHeightPx + 32}px`;

    onProgress?.('Capturing high-resolution pixel canvas...');

    const canvasBg = format === 'jpg'
      ? (backgroundColor && backgroundColor !== 'transparent' ? backgroundColor : '#ffffff')
      : (backgroundColor === 'transparent' ? null : backgroundColor);

    const canvas = await html2canvas(container, {
      scale: Math.max(1, Math.min(3, Number(scale) || 2)),
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: canvasBg,
      windowWidth: contentWidthPx + 32,
    });

    if (signal?.aborted) {
      const err = new Error('Conversion cancelled.');
      err.name = 'AbortError';
      throw err;
    }

    onProgress?.(`Encoding into ${format.toUpperCase()} format...`);

    const mime = format === 'jpg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
    const qual = format === 'png' ? undefined : Math.max(0.1, Math.min(1, Number(quality) || 0.95));

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((b) => {
        if (b) resolve(b);
        else reject(new Error('Failed to encode canvas to image Blob.'));
      }, mime, qual);
    });

    const dataUrl = canvas.toDataURL(mime, qual);

    return {
      blob,
      dataUrl,
      width: canvas.width,
      height: canvas.height,
      size: blob.size,
      format,
      filename: targetFilename,
    };
  } finally {
    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
  }
}

