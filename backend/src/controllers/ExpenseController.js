import ExpenseService from "../services/ExpenseService.js";
function ctx(req){return {ipAddress:req.ip??null,userAgent:req.get("user-agent")??null,requestId:req.requestId??null,supportSessionId:req.supportSession?.id??null};}
class ExpenseController {
  async list(req,res,next){try{return res.json({success:true,data:await ExpenseService.list(req.user.condominiumId,req.query)});}catch(e){next(e)}}
  async categories(req,res,next){try{return res.json({success:true,data:await ExpenseService.listCategories(req.user.condominiumId)});}catch(e){next(e)}}
  async createCategory(req,res,next){try{return res.status(201).json({success:true,data:await ExpenseService.createCategory(req.user.condominiumId,req.body,req.user,ctx(req))});}catch(e){next(e)}}
  async updateCategory(req,res,next){try{return res.json({success:true,data:await ExpenseService.updateCategory(req.params.id,req.user.condominiumId,req.body,req.user,ctx(req))});}catch(e){next(e)}}
  async removeCategory(req,res,next){try{return res.json({success:true,data:await ExpenseService.removeCategory(req.params.id,req.user.condominiumId,req.user,ctx(req))});}catch(e){next(e)}}
  async receipt(req,res,next){try{return res.json({success:true,data:await ExpenseService.receipt(req.params.id,req.user.condominiumId)});}catch(e){next(e)}}
  async create(req,res,next){try{return res.status(201).json({success:true,data:await ExpenseService.create(req.user.condominiumId,req.body,req.user,ctx(req))});}catch(e){next(e)}}
  async update(req,res,next){try{return res.json({success:true,data:await ExpenseService.update(req.params.id,req.user.condominiumId,req.body,req.user,ctx(req))});}catch(e){next(e)}}
  async remove(req,res,next){try{return res.json({success:true,data:await ExpenseService.remove(req.params.id,req.user.condominiumId,req.user,ctx(req))});}catch(e){next(e)}}
}
export default new ExpenseController();
