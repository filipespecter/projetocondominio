import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { ApiError } from "./ApiError.js";

const ROOT = path.resolve(process.cwd(), "uploads");
const ALLOWED = new Map([["image/jpeg","jpg"],["image/png","png"],["image/webp","webp"]]);

export async function saveImageDataUrl(dataUrl, folder, maxBytes = 800000) {
  if (!dataUrl) return null;
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl));
  if (!match || !ALLOWED.has(match[1])) throw new ApiError("Imagem inválida. Use JPG, PNG ou WEBP.", 422);
  const buffer = Buffer.from(match[2], "base64");
  if (!buffer.length || buffer.length > maxBytes) throw new ApiError("A imagem deve ter no máximo 800 KB após compactação.", 422);
  const dir = path.join(ROOT, folder);
  await fs.mkdir(dir, { recursive: true });
  const filename = `${Date.now()}-${crypto.randomUUID()}.${ALLOWED.get(match[1])}`;
  const fullPath = path.join(dir, filename);
  await fs.writeFile(fullPath, buffer);
  return { filePath: path.relative(process.cwd(), fullPath), mimeType: match[1] };
}

export async function imageAsDataUrl(filePath, mimeType) {
  if (!filePath) return null;
  try {
    const buffer = await fs.readFile(path.resolve(process.cwd(), filePath));
    return `data:${mimeType || "image/jpeg"};base64,${buffer.toString("base64")}`;
  } catch { return null; }
}

export async function removeStoredFile(filePath) {
  if (!filePath) return;
  try { await fs.unlink(path.resolve(process.cwd(), filePath)); } catch { return; }
}
