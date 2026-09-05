import prisma from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";

export function requireFeature(featureCode) {
  return async (req, res, next) => {
    try {
      if (["PLATFORM_OWNER","PLATFORM_ADMIN","PLATFORM_SUPPORT"].includes(req.user?.role)) return next();
      const condominiumId = req.user?.condominiumId ?? req.condominiumId;
      if (!condominiumId) return next(new ApiError("Condomínio não identificado.",403));
      const subscription = await prisma.subscription.findFirst({
        where:{ condominiumId, status:{in:["TRIAL","ACTIVE","OVERDUE"]} }, orderBy:{createdAt:"desc"},
        select:{ plan:{ select:{ code:true, planFeatures:{ where:{enabled:true,feature:{active:true,deletedAt:null}}, select:{feature:{select:{code:true}}} } } } },
      });
      const features = new Set(subscription?.plan?.planFeatures?.map(x=>x.feature.code) ?? []);
      if (!features.has(featureCode)) return next(new ApiError("Recurso disponível no Plano Completo.",403,{code:"FEATURE_NOT_AVAILABLE",feature:featureCode,plan:subscription?.plan?.code ?? null}));
      req.featureContext={ code:featureCode, planCode:subscription?.plan?.code ?? null };
      return next();
    } catch(error){ return next(error); }
  };
}
export default requireFeature;
