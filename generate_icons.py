import zlib
import struct

def write_png(filename, width, height):
    # A simple solid green image (#16a34a -> RGB 22, 163, 74)
    r, g, b = 22, 163, 74
    pixel_bytes = bytes([r, g, b] * width)
    # Map scanlines with a filter byte 0 at the beginning of each line
    scanlines = b"".join(b"\x00" + pixel_bytes for _ in range(height))
    
    # Compress the scanlines
    compressed = zlib.compress(scanlines)
    
    # PNG signature
    png_signature = b"\x89PNG\r\n\x1a\n"
    
    # IHDR chunk
    # Width (4 bytes), Height (4 bytes), Bit depth (1 byte, 8), Color type (1 byte, 2 = RGB),
    # Compression method (1 byte, 0), Filter method (1 byte, 0), Interlace method (1 byte, 0)
    ihdr_data = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    ihdr_chunk = struct.pack(">I", 13) + b"IHDR" + ihdr_data + struct.pack(">I", zlib.crc32(b"IHDR" + ihdr_data))
    
    # IDAT chunk
    idat_chunk = struct.pack(">I", len(compressed)) + b"IDAT" + compressed + struct.pack(">I", zlib.crc32(b"IDAT" + compressed))
    
    # IEND chunk
    iend_chunk = struct.pack(">I", 0) + b"IEND" + struct.pack(">I", zlib.crc32(b"IEND"))
    
    with open(filename, "wb") as f:
        f.write(png_signature + ihdr_chunk + idat_chunk + iend_chunk)

write_png("public/logo192.png", 192, 192)
write_png("public/logo512.png", 512, 512)
print("Icons generated successfully!")
