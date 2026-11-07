import crypto from "node:crypto";
import { ApiError } from "../utils/ApiError.js";
import { validatePasswordPolicy } from "../utils/PasswordPolicy.js";

const generic = { message: "Se o e-mail informado estiver cadastrado e o envio estiver disponível, você receberá um código válido por 15 minutos." };
const invalid = () => new ApiError("Código inválido, expirado ou com tentativas esgotadas. Solicite um novo código e use o e-mail e o portal do pedido.", 400);
const digest = value => crypto.createHash("sha256").update(String(value)).digest("hex");
function portal(data) {
  if (data?.portalType === "platform") throw new ApiError("A recuperação por e-mail não está disponível para a Central. Solicite a redefinição ao proprietário da plataforma.", 403);
  if (!["sindico", "porteiro", "morador"].includes(data?.portalType)) throw new ApiError("Perfil de acesso inválido.", 400);
}
function audit(user, action, context) {
  return { condominiumId:user.condominiumId, userId:user.id, userName:user.name, userRole:user.role,
    action, module:"AUTH", referenceId:user.id,
    details:action === "PASSWORD_RESET_CONFIRMED" ? "Senha redefinida por código de e-mail; sessões anteriores revogadas." : "Solicitação de recuperação de senha registrada.",
    ipAddress:context?.ipAddress ?? null, userAgent:context?.userAgent ?? null };
}
// All code issuance/consumption takes the same user row lock, before touching codes.
async function lock(db, userId) {
  await db.$queryRaw`SELECT "id" FROM "User" WHERE "id" = CAST(${userId} AS uuid) FOR UPDATE`;
}
export async function requestRecovery(data, context, {db, findUser, validateAccess, send}) {
  portal(data);
  const user = await findUser(data);
  if (!user?.email) return {...generic};
  try { validateAccess(user); } catch { return {...generic}; }
  const code = String(crypto.randomInt(0, 1000000)).padStart(6, "0");
  const codeHash = digest(code);
  await db.$transaction(async tx => {
    await lock(tx,user.id);
    await tx.passwordResetCode.updateMany({where:{userId:user.id,usedAt:null},data:{usedAt:new Date()}});
    await tx.passwordResetCode.create({data:{userId:user.id,codeHash,expiresAt:new Date(Date.now()+15 * 60 * 1000)}});
    await tx.auditLog.create({data:audit(user,"PASSWORD_RESET_REQUEST",context)});
  });
  try {
    await send({channel:"EMAIL",recipient:user.email,subject:"InfinityCondo - código para redefinir sua senha",
      content:`Seu código de recuperação InfinityCondo é ${code}. Ele expira em 15 minutos e só pode ser usado uma vez. Use somente o código do pedido mais recente. Se você não solicitou esta alteração, ignore esta mensagem.`});
  } catch {
    await db.$transaction(async tx => {
      await lock(tx,user.id);
      await tx.passwordResetCode.updateMany({where:{userId:user.id,codeHash,usedAt:null},data:{usedAt:new Date()}});
      await tx.auditLog.create({data:{...audit(user,"PASSWORD_RESET_SEND_FAILED",context),details:"Falha no envio do código; conferir provedor transacional."}});
    });
  }
  return {...generic};
}
export async function confirmRecovery(data, context, {db, findUser, validateAccess, hashPassword}) {
  portal(data);
  validatePasswordPolicy(data?.newPassword,"nova senha");
  if (data.newPassword !== data.newPasswordConfirmation) throw new ApiError("A confirmação da nova senha não corresponde.",400);
  if (!/^\d{6}$/.test(String(data.code ?? ""))) throw invalid();
  const user = await findUser(data);
  if (!user) throw invalid();
  try { validateAccess(user); } catch { throw invalid(); }
  const passwordHash = await hashPassword(data.newPassword);
  const accepted = await db.$transaction(async tx => {
    await lock(tx,user.id);
    const record = await tx.passwordResetCode.findFirst({where:{userId:user.id,usedAt:null,expiresAt:{gt:new Date()}},orderBy:{createdAt:"desc"}});
    if (!record || record.attempts >= 5) return false;
    if (!crypto.timingSafeEqual(Buffer.from(record.codeHash),Buffer.from(digest(data.code)))) {
      await tx.passwordResetCode.update({where:{id:record.id},data:{attempts:{increment:1}}});
      return false; // Commit attempt counter, then reject outside the transaction.
    }
    const claim = await tx.passwordResetCode.updateMany({where:{id:record.id,usedAt:null,expiresAt:{gt:new Date()},attempts:{lt:5}},data:{usedAt:new Date()}});
    if (claim.count !== 1) return false;
    await tx.user.update({where:{id:user.id},data:{passwordHash,mustChangePassword:false,passwordChangedAt:new Date(),failedLoginAttempts:0,lockedUntil:null,securityVersion:{increment:1}}});
    await tx.authSession.updateMany({where:{userId:user.id,revokedAt:null},data:{revokedAt:new Date(),revokeReason:"PASSWORD_RESET"}});
    await tx.passwordResetCode.updateMany({where:{userId:user.id,usedAt:null},data:{usedAt:new Date()}});
    await tx.auditLog.create({data:audit(user,"PASSWORD_RESET_CONFIRMED",context)});
    return true;
  });
  if (!accepted) throw invalid();
  return {message:"Senha redefinida com sucesso. Faça login com a nova senha."};
}
