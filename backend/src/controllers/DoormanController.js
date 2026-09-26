import DoormanService from "../services/DoormanService.js";
import DoormanSupervisionService from "../services/DoormanSupervisionService.js";

class DoormanController {
  async index(req,res,next){
    try{
      const {shift}=req.query;
      const condominiumId=req.user.condominiumId;

      const data = shift
        ? await DoormanService.findByShift(condominiumId,shift)
        : await DoormanService.findAll(condominiumId);

      return res.json({success:true,data});
    }catch(error){next(error);}
  }

  async show(req,res,next){
    try{
      const data=await DoormanService.findById(
        req.params.id,
        req.user.condominiumId
      );
      return res.json({success:true,data});
    }catch(error){next(error);}
  }

  async create(req,res,next){
    try{
      const data=await DoormanService.create(
        req.user.condominiumId,
        req.body,
        req.user,
        {ipAddress:req.ip,userAgent:req.get("user-agent")}
      );
      return res.status(201).json({success:true,message:"Porteiro cadastrado com sucesso.",data});
    }catch(error){next(error);}
  }

  async update(req,res,next){
    try{
      const data=await DoormanService.update(
        req.params.id,
        req.user.condominiumId,
        req.body,
        req.user,
        {ipAddress:req.ip,userAgent:req.get("user-agent")}
      );
      return res.json({success:true,message:"Porteiro atualizado com sucesso.",data});
    }catch(error){next(error);}
  }

  async changeShift(req,res,next){
    try{
      const data=await DoormanService.changeShift(
        req.params.id,
        req.user.condominiumId,
        req.body.shift,
        req.body.customShift,
        req.user,
        {ipAddress:req.ip,userAgent:req.get("user-agent")}
      );
      return res.json({success:true,message:"Turno atualizado.",data});
    }catch(error){next(error);}
  }

  async registerDuty(req,res,next){
    try{
      const data=await DoormanService.registerDuty(
        req.params.id,
        req.user.condominiumId,
        req.body.dutyDate,
        req.user,
        {ipAddress:req.ip,userAgent:req.get("user-agent")}
      );
      return res.json({success:true,message:"Plantão registrado.",data});
    }catch(error){next(error);}
  }

  async resetPassword(req,res,next){
    try{
      const data=await DoormanService.resetPassword(
        req.params.id,
        req.user.condominiumId,
        req.body.newPassword,
        req.user,
        {ipAddress:req.ip,userAgent:req.get("user-agent")}
      );
      return res.json({success:true,message:"Senha redefinida.",data});
    }catch(error){next(error);}
  }

  async remove(req,res,next){
    try{
      const data=await DoormanService.remove(
        req.params.id,
        req.user.condominiumId,
        req.user,
        {ipAddress:req.ip,userAgent:req.get("user-agent")}
      );
      return res.json({success:true,...data});
    }catch(error){next(error);}
  }

  async supervision(req,res,next){
    try{
      const data=await DoormanSupervisionService.get(
        req.params.id,
        req.user.condominiumId,
        req.query.days ?? 30
      );
      return res.json({success:true,data});
    }catch(error){next(error);}
  }

  async statistics(req,res,next){
    try{
      const data=await DoormanService.statistics(req.user.condominiumId);
      return res.json({success:true,data});
    }catch(error){next(error);}
  }
}

export default new DoormanController();
