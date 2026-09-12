import SupplierService from "../services/SupplierService.js";
const ctx = req => ({ ipAddress: req.ip ?? null, userAgent: req.get("user-agent") ?? null, requestId: req.requestId ?? null });
class SupplierController {
  async index(req,res,next){try{return res.json({success:true,data:await SupplierService.findAll(req.user.condominiumId,req.query)});}catch(e){return next(e);}}
  async show(req,res,next){try{return res.json({success:true,data:await SupplierService.findById(req.params.id,req.user.condominiumId)});}catch(e){return next(e);}}
  async create(req,res,next){try{return res.status(201).json({success:true,message:"Fornecedor cadastrado com sucesso.",data:await SupplierService.create(req.user.condominiumId,req.body,req.user,ctx(req))});}catch(e){return next(e);}}
  async update(req,res,next){try{return res.json({success:true,message:"Fornecedor atualizado com sucesso.",data:await SupplierService.update(req.params.id,req.user.condominiumId,req.body,req.user,ctx(req))});}catch(e){return next(e);}}
  async remove(req,res,next){try{return res.json({success:true,...await SupplierService.remove(req.params.id,req.user.condominiumId,req.user,ctx(req))});}catch(e){return next(e);}}
}
export default new SupplierController();
