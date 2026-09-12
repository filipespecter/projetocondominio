import BaseRepository from "./BaseRepository.js";

class AssetRepository extends BaseRepository {
  constructor(){ super("asset"); }
  get defaultInclude(){ return { supplier:{select:{id:true,legalName:true,tradeName:true,status:true}}, responsibleUser:{select:{id:true,name:true,role:true,status:true}} }; }
  async findById(id, condominiumId){ return this.findFirst({id, condominiumId, deletedAt:null},{include:this.defaultInclude}); }
  async findByCondominium(condominiumId, filters={}){
    const where={condominiumId,deletedAt:null};
    if(filters.status) where.status=filters.status;
    if(filters.category) where.category=filters.category;
    if(filters.supplierId) where.supplierId=filters.supplierId;
    if(filters.search) where.OR=[
      {name:{contains:filters.search,mode:"insensitive"}},
      {category:{contains:filters.search,mode:"insensitive"}},
      {assetTag:{contains:filters.search,mode:"insensitive"}},
      {serialNumber:{contains:filters.search,mode:"insensitive"}},
      {location:{contains:filters.search,mode:"insensitive"}},
    ];
    return this.findMany(where,{include:this.defaultInclude,orderBy:[{status:"asc"},{name:"asc"}]});
  }
  async findByAssetTag(condominiumId,assetTag){ if(!assetTag)return null; return this.findFirst({condominiumId,assetTag,deletedAt:null}); }
  async createForCondominium(condominiumId,data){ return this.create({condominiumId,...data},{include:this.defaultInclude}); }
  async updateById(id,condominiumId,data){ const r=await this.updateMany({id,condominiumId,deletedAt:null},data); if(!r.count)return null; return this.findById(id,condominiumId); }
  async softDelete(id,condominiumId){ const r=await this.updateMany({id,condominiumId,deletedAt:null},{deletedAt:new Date(),status:"INACTIVE"}); return r.count>0; }
}
export default new AssetRepository();
