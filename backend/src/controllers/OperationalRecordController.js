import OperationalRecordService from "../services/OperationalRecordService.js";

function requestContext(req) {
  return { requestId: req.requestId ?? null, ipAddress: req.ip ?? null, userAgent: req.get?.("user-agent") ?? null };
}

class OperationalRecordController {
  async index(req,res,next) {
    try { return res.json({ success:true, data: await OperationalRecordService.findAll(req.user.condominiumId) }); }
    catch(error){ return next(error); }
  }
  async create(req,res,next) {
    try { const data=await OperationalRecordService.create(req.user.condominiumId,req.body,req.user,requestContext(req)); return res.status(201).json({success:true,message:"Registro operacional criado com sucesso.",data}); }
    catch(error){ return next(error); }
  }
  async remove(req,res,next) {
    try { await OperationalRecordService.remove(req.params.id,req.user.condominiumId,req.user,requestContext(req)); return res.json({success:true,message:"Registro operacional excluído com sucesso."}); }
    catch(error){ return next(error); }
  }
}
export default new OperationalRecordController();
