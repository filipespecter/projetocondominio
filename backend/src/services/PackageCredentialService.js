import prisma from "../config/prisma.js";
import PickupCredential from "../utils/PickupCredential.js";
import { seal, unseal } from "../utils/MessagingSecrets.js";
import { ApiError } from "../utils/ApiError.js";
export class PackageCredentialService {
  constructor(db=prisma) { this.db=db; }
  async ensure(packageId, condominiumId) {
    return this.db.$transaction(async tx=>{
      await tx.$queryRaw`SELECT id FROM "Package" WHERE id=${packageId}::uuid AND "condominiumId"=${condominiumId}::uuid FOR UPDATE`;
      const pkg=await tx.package.findFirst({where:{id:packageId,condominiumId,status:"RECEIVED",deletedAt:null,pickupUsedAt:null}});
      if(!pkg) throw new ApiError("Encomenda indisponível para retirada.",409);
      const context=`pickup:${condominiumId}:${packageId}`;
      const stored=await tx.packagePickupSecret.findFirst({where:{packageId,condominiumId}});
      if(stored) {
        const credential=unseal(stored.encrypted,context);
        if(PickupCredential.hash(credential.code)===pkg.pickupCodeHash && PickupCredential.hash(credential.qrToken)===pkg.pickupTokenHash) return credential;
      }
      let code;
      for(let i=0;i<30;i++) {
        const next=PickupCredential.generateCode();
        if(!await tx.package.findFirst({where:{condominiumId,status:"RECEIVED",deletedAt:null,pickupUsedAt:null,pickupCodeHash:PickupCredential.hash(next)}})) {code=next; break;}
      }
      if(!code) throw new ApiError("Não foi possível gerar uma credencial única.",503);
      const credential={code,qrToken:PickupCredential.generateToken()};
      const encrypted=seal(credential,context);
      await tx.package.update({where:{id:packageId},data:{pickupCodeHash:PickupCredential.hash(code),pickupTokenHash:PickupCredential.hash(credential.qrToken),pickupGeneratedAt:new Date(),pickupUsedAt:null}});
      await tx.packagePickupSecret.upsert({where:{packageId},create:{packageId,condominiumId,encrypted},update:{encrypted}});
      return credential;
    });
  }
}
export default new PackageCredentialService();
