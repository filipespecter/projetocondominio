import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { ApiError } from "./ApiError.js";

const ROOT = path.resolve(process.cwd(), "uploads");

const ALLOWED = new Map([
  ["application/pdf", "pdf"],
  ["application/msword", "doc"],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx"],
  ["application/vnd.ms-excel", "xls"],
  ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "xlsx"],
  ["text/plain", "txt"],
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);
function matchesContent(buffer,mime){
  const text=buffer.subarray(0,8).toString("latin1"), zip=buffer[0]===0x50&&buffer[1]===0x4b, ole=buffer.subarray(0,8).equals(Buffer.from([0xd0,0xcf,0x11,0xe0,0xa1,0xb1,0x1a,0xe1]));
  if(mime==="application/pdf") return text.startsWith("%PDF-");
  if(mime==="image/jpeg") return buffer[0]===0xff&&buffer[1]===0xd8&&buffer[2]===0xff;
  if(mime==="image/png") return buffer.subarray(0,8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]));
  if(mime==="image/webp") return buffer.subarray(0,4).toString()==="RIFF"&&buffer.subarray(8,12).toString()==="WEBP";
  if(["application/msword","application/vnd.ms-excel"].includes(mime)) return ole;
  if(["application/vnd.openxmlformats-officedocument.wordprocessingml.document","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"].includes(mime)) return zip;
  if(mime==="text/plain") return !buffer.includes(0);
  return false;
}
export async function scanForMalware(_buffer){return {clean:true,engine:"not-configured"};}

function safeResolve(filePath) {
  const resolved = path.resolve(process.cwd(), String(filePath ?? ""));
  if (!resolved.startsWith(`${ROOT}${path.sep}`)) {
    throw new ApiError("Caminho de arquivo inválido.", 400);
  }
  return resolved;
}

export function sanitizeFileName(fileName) {
  const name = String(fileName ?? "arquivo")
    .replace(/[\\/:*?"<>|]/g, "_")
    .split("")
    .map((character) =>
      character.charCodeAt(0) < 32
        ? "_"
        : character
    )
    .join("")
    .trim();

  return name.slice(0, 180) || "arquivo";
}

export async function saveFileDataUrl(dataUrl, folder, options = {}) {
  if (!dataUrl) return null;

  const maxBytes = options.maxBytes ?? 8 * 1024 * 1024;
  const allowedMimeTypes = options.allowedMimeTypes ?? [...ALLOWED.keys()];
  const match = /^data:([^;,]+);base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl));

  if (!match || !ALLOWED.has(match[1]) || !allowedMimeTypes.includes(match[1])) {
    throw new ApiError("Arquivo inválido ou formato não permitido.", 422);
  }

  const buffer = Buffer.from(match[2], "base64");
  if (!buffer.length || buffer.length > maxBytes) {
    throw new ApiError(`O arquivo deve ter no máximo ${Math.floor(maxBytes / 1024 / 1024)} MB.`, 422);
  }
  if(!matchesContent(buffer,match[1])) throw new ApiError("O conteúdo real do arquivo não corresponde ao formato informado.",422);
  const scan=await scanForMalware(buffer); if(!scan.clean) throw new ApiError("Arquivo rejeitado pela verificação de segurança.",422);

  const dir = path.join(ROOT, String(folder).replace(/[^A-Za-z0-9_-]/g, ""));
  await fs.mkdir(dir, { recursive: true });

  const ext = ALLOWED.get(match[1]);
  const filename = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const fullPath = path.join(dir, filename);
  await fs.writeFile(fullPath, buffer);

  return {
    filePath: path.relative(process.cwd(), fullPath),
    mimeType: match[1],
    fileSize: buffer.length,
  };
}

export async function storedFileAsDataUrl(filePath, mimeType) {
  if (!filePath) return null;
  try {
    const buffer = await fs.readFile(safeResolve(filePath));
    return `data:${mimeType || "application/octet-stream"};base64,${buffer.toString("base64")}`;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    return null;
  }
}

export async function removeStoredFile(filePath) {
  if (!filePath) return;
  try {
    await fs.unlink(safeResolve(filePath));
  } catch (error) {
    if (error instanceof ApiError) throw error;
  }
}
