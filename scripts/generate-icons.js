import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createCRC32Table() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  return table;
}

const crcTable = createCRC32Table();

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ (-1)) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(4 + 4 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4);
  data.copy(buf, 8);
  const toCheck = Buffer.concat([Buffer.from(type), data]);
  const check = crc32(toCheck);
  buf.writeUInt32BE(check, 8 + len);
  return buf;
}

function encodePNG(width, height, rgbaBuffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // deflate
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // no interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Scanlines with filter byte 0
  const scanlines = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    const scanlineOffset = y * (1 + width * 4);
    scanlines[scanlineOffset] = 0; // filter None
    const rowData = rgbaBuffer.subarray(y * width * 4, (y + 1) * width * 4);
    rowData.copy(scanlines, scanlineOffset + 1);
  }

  const compressedData = zlib.deflateSync(scanlines);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function renderEmblem(size, isMaskable = false) {
  const buf = Buffer.alloc(size * size * 4);
  const center = size / 2;
  const radius = isMaskable ? size * 0.45 : size * 0.47;
  const innerRadius = radius * 0.95;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= radius) {
        // Navy blue base gradient (#091b30 to #14385f)
        const factor = (y / size);
        const rBase = Math.round(9 + 11 * factor);
        const gBase = Math.round(27 + 29 * factor);
        const bBase = Math.round(48 + 47 * factor);

        // Border ring
        if (dist >= innerRadius && dist <= radius) {
          // Crisp White / Golden Ring
          buf[idx] = 255;
          buf[idx + 1] = 255;
          buf[idx + 2] = 255;
          buf[idx + 3] = 255;
        } else if (dist >= innerRadius - 2) {
          // Golden hairline
          buf[idx] = 251;
          buf[idx + 1] = 191;
          buf[idx + 2] = 36;
          buf[idx + 3] = 255;
        } else {
          // Navy interior
          buf[idx] = rBase;
          buf[idx + 1] = gBase;
          buf[idx + 2] = bBase;
          buf[idx + 3] = 255;

          // Lucky stars / balls / tree shape
          // Central Tree & "T" Trunk
          const nx = (x - center) / (size * 0.5);
          const ny = (y - center) / (size * 0.5);

          // Tree crown: circle cluster
          const crownDist1 = Math.hypot(nx, ny + 0.15);
          const crownDist2 = Math.hypot(nx - 0.15, ny + 0.05);
          const crownDist3 = Math.hypot(nx + 0.15, ny + 0.05);

          const isFoliage = (crownDist1 < 0.28 || crownDist2 < 0.22 || crownDist3 < 0.22);
          // Trunk / Letter "T"
          const isTStem = (Math.abs(nx) < 0.04 && ny >= 0.05 && ny <= 0.38);
          const isTBar = (Math.abs(nx) < 0.18 && ny >= 0.03 && ny <= 0.09);
          const isTRoot = (Math.abs(nx) < 0.12 && ny >= 0.36 && ny <= 0.40);

          // Lottery Drum rings: ellipse
          const drumR = Math.hypot(nx / 0.55, ny / 0.35);
          const isDrumRing = Math.abs(drumR - 0.85) < 0.04;

          // Lucky gold stars
          const isStarL = Math.hypot(nx + 0.55, ny - 0.05) < 0.06;
          const isStarR = Math.hypot(nx - 0.55, ny - 0.05) < 0.06;
          const isBallTop = Math.hypot(nx, ny + 0.48) < 0.07;

          if (isStarL || isStarR) {
            // Gold star
            buf[idx] = 251;
            buf[idx + 1] = 191;
            buf[idx + 2] = 36;
            buf[idx + 3] = 255;
          } else if (isBallTop) {
            // Sky blue R ball
            buf[idx] = 56;
            buf[idx + 1] = 189;
            buf[idx + 2] = 248;
            buf[idx + 3] = 255;
          } else if (isFoliage) {
            // White tree crown with navy center cutout
            const innerCut = Math.hypot(nx, ny + 0.15) < 0.12;
            if (innerCut) {
              buf[idx] = 251;
              buf[idx + 1] = 191;
              buf[idx + 2] = 36; // gold spark in tree
              buf[idx + 3] = 255;
            } else {
              buf[idx] = 255;
              buf[idx + 1] = 255;
              buf[idx + 2] = 255;
              buf[idx + 3] = 255;
            }
          } else if (isTBar || isTStem || isTRoot) {
            // White "T" trunk
            buf[idx] = 255;
            buf[idx + 1] = 255;
            buf[idx + 2] = 255;
            buf[idx + 3] = 255;
          } else if (isDrumRing) {
            buf[idx] = 56;
            buf[idx + 1] = 189;
            buf[idx + 2] = 248;
            buf[idx + 3] = 180;
          }
        }
      } else {
        if (isMaskable) {
          // Fill maskable background with navy
          buf[idx] = 9;
          buf[idx + 1] = 27;
          buf[idx + 2] = 48;
          buf[idx + 3] = 255;
        } else {
          // Transparent
          buf[idx] = 0;
          buf[idx + 1] = 0;
          buf[idx + 2] = 0;
          buf[idx + 3] = 0;
        }
      }
    }
  }

  return encodePNG(size, size, buf);
}

const pubDir = path.resolve('public');
if (!fs.existsSync(pubDir)) fs.mkdirSync(pubDir, { recursive: true });

fs.writeFileSync(path.join(pubDir, 'pwa-192x192.png'), renderEmblem(192));
fs.writeFileSync(path.join(pubDir, 'pwa-512x512.png'), renderEmblem(512));
fs.writeFileSync(path.join(pubDir, 'apple-touch-icon.png'), renderEmblem(180));
fs.writeFileSync(path.join(pubDir, 'pwa-maskable-512x512.png'), renderEmblem(512, true));
fs.writeFileSync(path.join(pubDir, 'favicon.ico'), renderEmblem(32));

console.log('Successfully generated all PWA icons (192, 512, maskable, apple-touch-icon)!');
