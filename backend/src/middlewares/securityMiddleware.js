import { rateLimit } from "express-rate-limit";
import env from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
const handler=(_req,_res,next)=>next(new ApiError("Muitas solicitações. Tente novamente mais tarde.",429));
const limiter=(windowMs,limit)=>rateLimit({windowMs,limit,standardHeaders:"draft-8",legacyHeaders:false,handler});
export const loginLimiter=limiter(15*60*1000,10);
export const resetLimiter=limiter(15*60*1000,5);
export const onboardingLimiter=limiter(60*60*1000,10);
export const webhookLimiter=limiter(60*1000,120);
export const apiLimiter=limiter(60*1000,300);
export function requireTrustedOrigin(req,_res,next){const origin=req.get("origin");if(origin&&origin!==env.FRONTEND_URL)return next(new ApiError("Origem não autorizada.",403));return next();}
