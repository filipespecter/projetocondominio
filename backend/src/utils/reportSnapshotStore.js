import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { ApiError } from "./ApiError.js";
const root = () => path.resolve(process.cwd(), "uploads", "report-snapshots");
function location(user, id) {
  if (!/^[0-9a-f-]{36}$/i.test(id))
    throw new ApiError("Identificador de relatório inválido.", 422);
  const tenant = crypto
    .createHash("sha256")
    .update(user.condominiumId)
    .digest("hex");
  return path.join(root(), tenant, id + ".json");
}
export async function saveReportSnapshot(user, model, metadata, db) {
  const file = location(user, model.id),
    bytes = JSON.stringify(model),
    digest = crypto.createHash("sha256").update(bytes).digest("hex");
  await fs.mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
  const temporary = file + "." + crypto.randomUUID() + ".tmp";
  try {
    await fs.writeFile(temporary, bytes, { flag: "wx", mode: 0o600 });
    try {
      await fs.link(temporary, file);
    } catch (e) {
      if (e.code !== "EEXIST") throw e;
      const existing = await fs.readFile(file, "utf8");
      if (crypto.createHash("sha256").update(existing).digest("hex") !== digest)
        throw new ApiError(
          "Cópia do relatório divergente. Gere uma nova prévia.",
          409,
        );
    }
  } finally {
    await fs.rm(temporary, { force: true });
  }
  // A failed database write can be retried with the same signed preview; never remove a completed copy that another request may have committed.
  const existing = await db.auditLog.findFirst({
    where: {
      id: model.id,
      condominiumId: user.condominiumId,
      userId: user.id,
      module: "REPORT_DOCUMENT",
    },
    select: { id: true },
  });
  const saved = { ...metadata, digest };
  if (!existing)
    await db.auditLog.upsert({
      where: { id: model.id },
      update: {},
      create: {
        id: model.id,
        condominiumId: user.condominiumId,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        module: "REPORT_DOCUMENT",
        action: "EXPORT",
        afterData: saved,
        details:
          "Documento de relatório emitido e preservado para download autenticado.",
      },
    });
  return { id: model.id, ...saved };
}
export async function readReportSnapshot(user, id, digest) {
  try {
    const bytes = await fs.readFile(location(user, id), "utf8");
    if (
      digest &&
      crypto.createHash("sha256").update(bytes).digest("hex") !== digest
    )
      throw new ApiError(
        "Arquivo do relatório divergente. Solicite suporte.",
        409,
      );
    return JSON.parse(bytes);
  } catch (e) {
    if (e.code === "ENOENT")
      throw new ApiError(
        "Arquivo do relatório indisponível. Verifique o armazenamento de uploads.",
        404,
      );
    throw e;
  }
}
