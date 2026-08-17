import fs from 'fs';
import zlib from 'zlib';

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let j = 0; j < 8; j++) {
      c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function writePng(filename, width, height) {
  const r = 22, g = 163, b = 74; // #16a34a forest green
  const rowSize = width * 3;
  const scanlines = Buffer.alloc((1 + rowSize) * height);
  
  let offset = 0;
  for (let y = 0; y < height; y++) {
    scanlines[offset++] = 0; // filter method 0
    for (let x = 0; x < width; x++) {
      scanlines[offset++] = r;
      scanlines[offset++] = g;
      scanlines[offset++] = b;
    }
  }
  
  const compressed = zlib.deflateSync(scanlines);
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  
  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // color type (RGB)
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  
  const ihdrChunk = Buffer.concat([
    Buffer.from([0, 0, 0, 13]), // length
    Buffer.from('IHDR'),
    ihdrData,
    Buffer.alloc(4) // CRC placeholder
  ]);
  ihdrChunk.writeUInt32BE(crc32(ihdrChunk.subarray(4, 4 + 4 + 13)), 4 + 4 + 13);
  
  // IDAT chunk
  const idatChunk = Buffer.concat([
    Buffer.alloc(4), // length placeholder
    Buffer.from('IDAT'),
    compressed,
    Buffer.alloc(4) // CRC placeholder
  ]);
  idatChunk.writeUInt32BE(compressed.length, 0);
  idatChunk.writeUInt32BE(crc32(idatChunk.subarray(4, 4 + 4 + compressed.length)), 4 + 4 + compressed.length);
  
  // IEND chunk
  const iendChunk = Buffer.concat([
    Buffer.from([0, 0, 0, 0]),
    Buffer.from('IEND'),
    Buffer.from([0xae, 0x42, 0x60, 0x82]) // CRC for empty IEND
  ]);
  
  const png = Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
  fs.writeFileSync(filename, png);
}

writePng("public/logo192.png", 192, 192);
writePng("public/logo512.png", 512, 512);
console.log("Icons generated successfully!");
