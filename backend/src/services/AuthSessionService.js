import crypto from "node:crypto";
import prisma from "../config/prisma.js";
import Jwt from "../utils/Jwt.js";
import { ApiError } from "../utils/ApiError.js";
const hash = token => crypto.createHash("sha256").update(String(token)).digest("hex");
class AuthSessionService {
  async create(user, context = {}) {
    const sessionId=crypto.randomUUID(), tokenFamilyId=crypto.randomUUID(), jti=crypto.randomUUID();
    const refreshToken=Jwt.generateRefreshToken(user,{sessionId,tokenFamilyId,jti}); const decoded=Jwt.decode(refreshToken);
    await prisma.authSession.create({data:{id:sessionId,userId:user.id,tokenFamilyId,refreshTokenHash:hash(refreshToken),expiresAt:new Date(decoded.exp*1000),ipAddress:context.ipAddress??null,userAgent:context.userAgent??null}});
    return {sessionId,accessToken:Jwt.generateAccessToken(user,{sessionId}),refreshToken};
  }
  async rotate(refreshToken, context={}) {
    let payload; try { payload=Jwt.verifyRefreshToken(refreshToken); } catch { throw new ApiError("Refresh token inválido ou expirado.",401); }
    if(!payload?.sub||!payload?.sid||!payload?.family) throw new ApiError("Refresh token inválido.",401);
    const session=await prisma.authSession.findUnique({where:{id:payload.sid},include:{user:{include:{condominium:true}}}});
    if(!session||session.refreshTokenHash!==hash(refreshToken)){await prisma.authSession.updateMany({where:{tokenFamilyId:payload.family,revokedAt:null},data:{revokedAt:new Date(),revokeReason:"REFRESH_REUSE_DETECTED"}});throw new ApiError("Sessão revogada por reutilização de credencial.",401);}
    if(session.revokedAt||session.expiresAt<=new Date()){await this.revokeFamily(session.tokenFamilyId,"REFRESH_REUSE_DETECTED");throw new ApiError("Sessão revogada ou expirada.",401);}
    if(payload.sv!==session.user.securityVersion){await this.revokeFamily(session.tokenFamilyId,"SECURITY_VERSION_CHANGED");throw new ApiError("Sessão inválida. Entre novamente.",401);}
    const next=Jwt.generateRefreshToken(session.user,{sessionId:session.id,tokenFamilyId:session.tokenFamilyId,jti:crypto.randomUUID()}); const decoded=Jwt.decode(next);
    await prisma.authSession.update({where:{id:session.id},data:{refreshTokenHash:hash(next),lastUsedAt:new Date(),expiresAt:new Date(decoded.exp*1000),ipAddress:context.ipAddress??session.ipAddress,userAgent:context.userAgent??session.userAgent}});
    return {user:session.user,accessToken:Jwt.generateAccessToken(session.user,{sessionId:session.id}),refreshToken:next};
  }
  revokeSession(id,reason="LOGOUT"){return id?prisma.authSession.updateMany({where:{id,revokedAt:null},data:{revokedAt:new Date(),revokeReason:reason}}):Promise.resolve();}
  revokeFamily(tokenFamilyId,reason){return prisma.authSession.updateMany({where:{tokenFamilyId,revokedAt:null},data:{revokedAt:new Date(),revokeReason:reason}});}
  revokeAllForUser(userId,reason){return prisma.$transaction([prisma.authSession.updateMany({where:{userId,revokedAt:null},data:{revokedAt:new Date(),revokeReason:reason}}),prisma.user.update({where:{id:userId},data:{securityVersion:{increment:1}}})]);}
}
export default new AuthSessionService();
