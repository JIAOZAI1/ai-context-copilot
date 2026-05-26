// ============================================
// AI Context Copilot — Icon Generator
// 纯 Node.js，零依赖，生成 PNG 图标
// 运行: node generate-icons.js
// ============================================

const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

const ICONS_DIR = path.join(__dirname, 'icons');

// 确保图标目录存在
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

// 创建 32-bit CRC 表
function makeCRCTable() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  return table;
}

const crcTable = makeCRCTable();

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  }
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function createChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBytes, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([len, typeBytes, data, crc]);
}

function createPNG(width, height, pixels) {
  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // Raw image data with filter bytes
  const rawData = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width * 4);
    rawData[rowOffset] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const px = pixels[y * width + x];
      const off = rowOffset + 1 + x * 4;
      rawData[off] = px[0];     // R
      rawData[off + 1] = px[1]; // G
      rawData[off + 2] = px[2]; // B
      rawData[off + 3] = px[3]; // A
    }
  }

  const compressed = zlib.deflateSync(rawData);

  return Buffer.concat([
    signature,
    createChunk('IHDR', ihdr),
    createChunk('IDAT', compressed),
    createChunk('IEND', Buffer.alloc(0))
  ]);
}

// 生成渐变色图标像素
function generateIconPixels(size) {
  const pixels = new Array(size * size);
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 1;
  const cornerRadius = size * 0.22;

  // 渐变颜色: 从 #6366f1 (indigo) 到 #8b5cf6 (purple)
  const startR = 0x63, startG = 0x66, startB = 0xf1;
  const endR = 0x8b, endG = 0x5c, endB = 0xf6;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = y * size + x;

      // 计算到最近的角的距离 (圆角矩形)
      let inside = true;

      // 简化的圆角矩形检测
      const dx = Math.max(0, Math.abs(x - cx) - (size / 2 - cornerRadius));
      const dy = Math.max(0, Math.abs(y - cy) - (size / 2 - cornerRadius));
      const cornerDist = Math.sqrt(dx * dx + dy * dy);

      const distFromCenter = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);

      if (cornerDist > cornerRadius || distFromCenter > radius) {
        // 完全透明
        pixels[idx] = [0, 0, 0, 0];
        continue;
      }

      // 渐变混合 (对角线渐变)
      const t = (x + y) / (size * 2); // 0 ~ 1
      const r = Math.round(startR + (endR - startR) * t);
      const g = Math.round(startG + (endG - startG) * t);
      const b = Math.round(startB + (endB - startB) * t);

      // 边缘抗锯齿
      let alpha = 255;
      const edgeDist = cornerRadius - cornerDist;
      if (edgeDist < 1.5 && edgeDist > 0) {
        alpha = Math.round(255 * Math.max(0, edgeDist / 1.5));
      } else if (cornerDist >= cornerRadius) {
        alpha = 0;
      }

      // 轻微的高光效果
      const highlight = 1 - distFromCenter / radius;
      const boostedR = Math.min(255, Math.round(r + highlight * 25));
      const boostedG = Math.min(255, Math.round(g + highlight * 20));
      const boostedB = Math.min(255, Math.round(b + highlight * 15));

      pixels[idx] = [boostedR, boostedG, boostedB, alpha];
    }
  }

  return pixels;
}

// 生成各尺寸图标
const sizes = [16, 48, 128];

sizes.forEach((size) => {
  console.log(`正在生成 ${size}x${size} 图标...`);
  const pixels = generateIconPixels(size);
  const png = createPNG(size, size, pixels);
  const filepath = path.join(ICONS_DIR, `icon${size}.png`);
  fs.writeFileSync(filepath, png);
  console.log(`  ✓ 已保存: icon${size}.png (${png.length} bytes)`);
});

// 同时生成 32px 版本
console.log(`正在生成 32x32 图标...`);
const pixels32 = generateIconPixels(32);
const png32 = createPNG(32, 32, pixels32);
fs.writeFileSync(path.join(ICONS_DIR, 'icon32.png'), png32);
console.log(`  ✓ 已保存: icon32.png (${png32.length} bytes)`);

console.log('\n🎉 所有图标生成完毕！');
