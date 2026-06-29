type ImageSignature = {
  mime: string;
  ext: string;
  bytes: number[];
  offset?: number;
};

const SIGNATURES: ImageSignature[] = [
  { mime: "image/jpeg", ext: "jpg",  bytes: [0xFF, 0xD8, 0xFF] },
  { mime: "image/png",  ext: "png",  bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] },
  { mime: "image/gif",  ext: "gif",  bytes: [0x47, 0x49, 0x46, 0x38] },
  // WebP: bytes 0-3 are "RIFF", bytes 8-11 are "WEBP"
  { mime: "image/webp", ext: "webp", bytes: [0x57, 0x45, 0x42, 0x50], offset: 8 },
];

export async function detectImageType(
  file: File
): Promise<{ mime: string; ext: string } | null> {
  const buf = new Uint8Array(await file.slice(0, 12).arrayBuffer());

  for (const sig of SIGNATURES) {
    const off = sig.offset ?? 0;
    if (buf.length < off + sig.bytes.length) continue;
    if (sig.bytes.every((b, i) => buf[off + i] === b)) {
      return { mime: sig.mime, ext: sig.ext };
    }
  }
  return null;
}
