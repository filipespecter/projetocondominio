import assetRepository from "../repositories/AssetRepository.js";
import supplierRepository from "../repositories/SupplierRepository.js";
import userRepository from "../repositories/UserRepository.js";
import AuditLogService from "./AuditLogService.js";
import NotificationService from "./NotificationService.js";
import { ApiError } from "../utils/ApiError.js";
import { removeStoredFile, saveFileDataUrl, sanitizeFileName, storedFileAsDataUrl } from "../utils/fileStorage.js";

class AssetService {
  text(v){return v===undefined||v===null||String(v).trim()===""?null:String(v).trim();}
  date(v,label){if(!v)return null;const d=new Date(`${v}T00:00:00.000Z`);if(Number.isNaN(d.getTime()))throw new ApiError(`${label} inválida.`,422);return d;}
  async validateRelations(condominiumId,data){
    if(data.supplierId){const s=await supplierRepository.findById(data.supplierId,condominiumId);if(!s)throw new ApiError("Fornecedor não encontrado neste condomínio.",404);}
    if(data.responsibleUserId){const u=await userRepository.findById(data.responsibleUserId,condominiumId);if(!u)throw new ApiError("Responsável não encontrado neste condomínio.",404);}
  }
  async uniqueTag(condominiumId,tag,ignored=null){if(!tag)return;const e=await assetRepository.findByAssetTag(condominiumId,tag);if(e&&e.id!==ignored)throw new ApiError("Já existe ativo com este patrimônio neste condomínio.",409);}
  normalize(data){const out={};for(const k of ["name","category","assetTag","manufacturer","model","serialNumber","location","supplierId","responsibleUserId","status","notes"])if(data[k]!==undefined)out[k]=this.text(data[k]);if(data.acquiredAt!==undefined)out.acquiredAt=this.date(data.acquiredAt,"Data de aquisição");if(data.warrantyUntil!==undefined)out.warrantyUntil=this.date(data.warrantyUntil,"Garantia");return out;}
  async findAll(condominiumId,filters={}){return assetRepository.findByCondominium(condominiumId,filters);}
  async findById(id,condominiumId){const a=await assetRepository.findById(id,condominiumId);if(!a)throw new ApiError("Ativo/equipamento não encontrado.",404);return a;}
  async create(condominiumId,data,user,requestContext=null){
    await this.validateRelations(condominiumId,data);const normalized=this.normalize(data);normalized.status ||= "OPERATIONAL";await this.uniqueTag(condominiumId,normalized.assetTag);
    let saved=null;try{if(data.attachmentDataUrl)saved=await saveFileDataUrl(data.attachmentDataUrl,"assets");if(saved){normalized.attachmentFileName=sanitizeFileName(data.attachmentFileName||"anexo");normalized.attachmentFilePath=saved.filePath;normalized.attachmentMimeType=saved.mimeType;normalized.attachmentFileSize=saved.fileSize;}
      const asset=await assetRepository.createForCondominium(condominiumId,normalized);
      await AuditLogService.logCreate({condominiumId,user,module:"ASSET",referenceId:asset.id,afterData:{name:asset.name,category:asset.category,assetTag:asset.assetTag,status:asset.status},details:"Ativo/equipamento cadastrado.",requestContext});
      return asset;
    }catch(e){if(saved)await removeStoredFile(saved.filePath);throw e;}
  }
  async update(id,condominiumId,data,user,requestContext=null){
    const before=await this.findById(id,condominiumId);await this.validateRelations(condominiumId,data);const normalized=this.normalize(data);if(normalized.assetTag!==undefined)await this.uniqueTag(condominiumId,normalized.assetTag,id);
    let saved=null;try{if(data.attachmentDataUrl)saved=await saveFileDataUrl(data.attachmentDataUrl,"assets");if(saved){normalized.attachmentFileName=sanitizeFileName(data.attachmentFileName||before.attachmentFileName||"anexo");normalized.attachmentFilePath=saved.filePath;normalized.attachmentMimeType=saved.mimeType;normalized.attachmentFileSize=saved.fileSize;}
      const asset=await assetRepository.updateById(id,condominiumId,normalized);if(!asset)throw new ApiError("Ativo/equipamento não encontrado.",404);if(saved&&before.attachmentFilePath)await removeStoredFile(before.attachmentFilePath);
      await AuditLogService.logUpdate({condominiumId,user,module:"ASSET",referenceId:id,beforeData:{name:before.name,status:before.status,assetTag:before.assetTag},afterData:{name:asset.name,status:asset.status,assetTag:asset.assetTag},details:"Ativo/equipamento atualizado.",requestContext});
      if(data.status!==undefined){await Promise.allSettled([NotificationService.createForActiveRoleUsers(condominiumId,"CONDOMINIUM_ADMIN",{title:"Ativo atualizado",message:`${asset.name}: ${asset.status}`,type:"ASSET_STATUS",module:"ASSET",referenceId:id})]);}
      return asset;
    }catch(e){if(saved)await removeStoredFile(saved.filePath);throw e;}
  }
  async remove(id,condominiumId,user,requestContext=null){const before=await this.findById(id,condominiumId);const ok=await assetRepository.softDelete(id,condominiumId);if(!ok)throw new ApiError("Ativo/equipamento não encontrado.",404);if(before.attachmentFilePath)await removeStoredFile(before.attachmentFilePath);await AuditLogService.logDelete({condominiumId,user,module:"ASSET",referenceId:id,beforeData:{name:before.name,status:before.status,assetTag:before.assetTag},details:"Ativo/equipamento removido logicamente.",requestContext});return{message:"Ativo/equipamento removido com sucesso."};}
  async download(id,condominiumId){const asset=await this.findById(id,condominiumId);if(!asset.attachmentFilePath)throw new ApiError("Este ativo não possui anexo.",404);const dataUrl=await storedFileAsDataUrl(asset.attachmentFilePath,asset.attachmentMimeType);if(!dataUrl)throw new ApiError("Arquivo do ativo não encontrado no armazenamento.",404);return{fileName:asset.attachmentFileName,mimeType:asset.attachmentMimeType,fileSize:asset.attachmentFileSize,dataUrl};}
}
export default new AssetService();
