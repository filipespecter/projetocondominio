import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { ApiError } from "./ApiError.js";

const ROOT = path.resolve(process.cwd(), "uploads");
const ALLOWED = new Map([["image/jpeg","jpg"],["image/png","png"],["image/webp","webp"]]);
const signatures=[
  {mime:"image/jpeg",ok:b=>b.length>=3&&b[0]===0xff&&b[1]===0xd8&&b[2]===0xff},
  {mime:"image/png",ok:b=>b.length>=8&&b.subarray(0,8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]))},
  {mime:"image/webp",ok:b=>b.length>=12&&b.subarray(0,4).toString()==="RIFF"&&b.subarray(8,12).toString()==="WEBP"},
];
const detectMime=buffer=>signatures.find(item=>item.ok(buffer))?.mime??null;
const safeResolve=filePath=>{const full=path.resolve(process.cwd(),filePath);if(!full.startsWith(`${ROOT}${path.sep}`))throw new ApiError("Caminho de arquivo inválido.",400);return full;};

export async function saveImageDataUrl(dataUrl, folder, maxBytes = 800000) {
  if (!dataUrl) return null;
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl));
  if (!match || !ALLOWED.has(match[1])) throw new ApiError("Imagem inválida. Use JPG, PNG ou WEBP.", 422);
  const buffer = Buffer.from(match[2], "base64");
  if (!buffer.length || buffer.length > maxBytes) throw new ApiError("A imagem deve ter no máximo 800 KB após compactação.", 422);
  if(detectMime(buffer)!==match[1]) throw new ApiError("O conteúdo real da imagem não corresponde ao tipo informado.",422);
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
    const buffer = await fs.readFile(safeResolve(filePath));
    return `data:${mimeType || "image/jpeg"};base64,${buffer.toString("base64")}`;
  } catch { return null; }
}

export async function removeStoredFile(filePath) {
  if (!filePath) return;
  try { await fs.unlink(safeResolve(filePath)); } catch { return; }
}
