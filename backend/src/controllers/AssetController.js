import AssetService from "../services/AssetService.js";
const context = (req) => ({ ipAddress: req.ip ?? null, userAgent: req.get("user-agent") ?? null, requestId: req.requestId ?? null });
class AssetController {
  async index(req,res,next){try{return res.json({success:true,data:await AssetService.findAll(req.user.condominiumId,req.query)});}catch(e){return next(e);}}
  async show(req,res,next){try{return res.json({success:true,data:await AssetService.findById(req.params.id,req.user.condominiumId)});}catch(e){return next(e);}}
  async create(req,res,next){try{return res.status(201).json({success:true,message:"Ativo/equipamento cadastrado com sucesso.",data:await AssetService.create(req.user.condominiumId,req.body,req.user,context(req))});}catch(e){return next(e);}}
  async update(req,res,next){try{return res.json({success:true,message:"Ativo/equipamento atualizado com sucesso.",data:await AssetService.update(req.params.id,req.user.condominiumId,req.body,req.user,context(req))});}catch(e){return next(e);}}
  async remove(req,res,next){try{return res.json({success:true,...await AssetService.remove(req.params.id,req.user.condominiumId,req.user,context(req))});}catch(e){return next(e);}}
  async download(req,res,next){try{return res.json({success:true,data:await AssetService.download(req.params.id,req.user.condominiumId)});}catch(e){return next(e);}}
}
export default new AssetController();
